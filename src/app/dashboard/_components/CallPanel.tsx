"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PercyAvatar } from "@/components/percy/PercyAvatar";
import { setPercyCall, setPercyMode } from "@/components/percy/percy-bus";
import { endCall as endCallAction } from "@/lib/workforce/actions";
import { useLive } from "./LiveView";
import { useOS } from "./os-store";

// ── call panel ──────────────────────────────────────────────────────────────
// A voice call with Percy over the existing bridge plumbing: browser speech in →
// POST /api/workforce/call/send; Percy's speech-only replies stream back over the
// SSE channel (GET /api/workforce/call/stream) and show as captions. No
// speechSynthesis in production — the prototype used it only as a stand-in. When
// a plan event arrives mid-call the panel goes mini and the live view runs.

type Phase = "ringing" | "live";
type Caption = { who: "percy" | "you"; text: string };
type Call = {
  phase: Phase;
  t0: number;
  muted: boolean;
  lines: Caption[];
  heard: string;
  bridge: boolean; // live bridge channel reachable
} | null;

type CallApi = {
  call: Call;
  start: () => void;
  end: () => void;
  toggleMute: () => void;
};

const CallCtx = createContext<CallApi | null>(null);
export function useCall(): CallApi {
  const v = useContext(CallCtx);
  if (!v) throw new Error("useCall must be used inside <CallProvider>");
  return v;
}

// minimal typing for the browser SpeechRecognition API (not in lib.dom)
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecCtor = new () => SpeechRec;

function getSpeechRec(): SpeechRecCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const os = useOS();
  const [call, setCall] = useState<Call>(null);
  const [, setNow] = useState(0); // 1s tick so the timer re-renders

  const osRef = useRef(os);
  osRef.current = os;
  const esRef = useRef<EventSource | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const callRef = useRef<Call>(call);
  callRef.current = call;

  const teardown = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    try {
      recRef.current?.abort();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    setPercyCall(false);
    setPercyMode("idle");
  }, []);

  const end = useCallback(() => {
    teardown();
    setCall(null);
    void endCallAction("percy").catch(() => {});
  }, [teardown]);

  const sendUtterance = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setCall((c) =>
      c ? { ...c, lines: push(c.lines, "you", t), heard: "" } : c,
    );
    void fetch("/api/workforce/call/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: "percy", text: t }),
    }).catch(() => {});
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRec();
    if (!Ctor) return; // no mic recognition — captions still work
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0]?.transcript ?? "";
        if (r.isFinal) final += txt;
        else interim += txt;
      }
      if (interim) setCall((c) => (c ? { ...c, heard: interim } : c));
      if (final.trim()) sendUtterance(final);
    };
    rec.onend = () => {
      // keep listening while the call is live and not muted
      const c = callRef.current;
      if (c && c.phase === "live" && !c.muted) {
        try {
          rec.start();
        } catch {
          /* race on restart */
        }
      }
    };
    rec.onerror = () => {};
    try {
      rec.start();
    } catch {
      /* already started */
    }
    recRef.current = rec;
  }, [sendUtterance]);

  const openStream = useCallback(() => {
    const es = new EventSource("/api/workforce/call/stream?agent=percy");
    es.onmessage = (ev) => {
      let msg: { type?: string; text?: string } | null = null;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!msg) return;
      if (msg.type === "delta" && msg.text) {
        setPercyMode("speaking");
        const text = msg.text;
        setCall((c) => (c ? { ...c, lines: appendPercy(c.lines, text) } : c));
      } else if (msg.type === "final") {
        setPercyMode("listening");
      } else if (msg.type === "error") {
        osRef.current.showToast("the call dropped — try again");
      }
    };
    es.onerror = () => {
      // transient; the browser auto-reconnects. nothing to do.
    };
    esRef.current = es;
  }, []);

  const start = useCallback(() => {
    if (callRef.current) return;
    setCall({
      phase: "ringing",
      t0: Date.now(),
      muted: false,
      lines: [],
      heard: "",
      bridge: false,
    });
    setPercyCall(true);
    setPercyMode("listening");
    // probe the bridge, then go live
    void (async () => {
      let bridge = false;
      try {
        const r = await fetch("/api/workforce/call/stream?agent=percy&ping=1");
        bridge = r.status === 200;
      } catch {
        bridge = false;
      }
      // short ring, then connect
      await new Promise((res) => setTimeout(res, 1200));
      if (!callRef.current) return; // ended during ring
      setCall((c) => (c ? { ...c, phase: "live", bridge } : c));
      if (bridge) {
        openStream();
        startListening();
      } else {
        osRef.current.showToast(
          "live voice needs the bridge — your words still reach Percy",
        );
        startListening(); // utterances still POST (queue for when the bridge is up)
      }
    })();
  }, [openStream, startListening]);

  const toggleMute = useCallback(() => {
    setCall((c) => {
      if (!c) return c;
      const muted = !c.muted;
      if (muted) {
        try {
          recRef.current?.stop();
        } catch {
          /* ignore */
        }
      } else {
        try {
          recRef.current?.start();
        } catch {
          /* ignore */
        }
      }
      return { ...c, muted };
    });
  }, []);

  // ⌥P toggles the call
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyP") {
        e.preventDefault();
        if (callRef.current) end();
        else start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, end]);

  // 1s timer tick while a call is live
  useEffect(() => {
    if (!call) return;
    const t = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [call]);

  // tear down on unmount
  useEffect(() => teardown, [teardown]);

  return (
    <CallCtx.Provider value={{ call, start, end, toggleMute }}>
      {children}
      <CallPanel />
    </CallCtx.Provider>
  );
}

function push(lines: Caption[], who: "percy" | "you", text: string): Caption[] {
  return [...lines, { who, text }];
}
// delta text appends to the trailing Percy line, or starts a new one
function appendPercy(lines: Caption[], text: string): Caption[] {
  const last = lines[lines.length - 1];
  if (last && last.who === "percy")
    return [...lines.slice(0, -1), { who: "percy", text: last.text + text }];
  return [...lines, { who: "percy", text }];
}

function fmtDur(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── the panel (full + mini) ─────────────────────────────────────────────────
function CallPanel() {
  const { call, end, toggleMute } = useCall();
  const { run } = useLive();
  if (!call) return null;

  const liveRunning = run?.status === "running";
  const dur = fmtDur(Date.now() - call.t0);
  const status =
    call.phase === "ringing"
      ? "calling Percy…"
      : call.muted
        ? "muted"
        : "listening";

  // mini while Percy is working on screen (the live view takes the foreground)
  if (liveRunning) {
    return (
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 94,
          zIndex: 27,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 8,
          borderRadius: 16,
          background: "#0c0c0c",
          color: "#ecebe5",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            overflow: "hidden",
            flex: "none",
          }}
        >
          <PercyAvatar mode="speaking" />
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Percy · {dur}</span>
        <IconBtn label="mute" onClick={toggleMute} active={call.muted}>
          {call.muted ? "🔇" : "🎙"}
        </IconBtn>
        <IconBtn label="end call" onClick={end} danger>
          ✕
        </IconBtn>
      </div>
    );
  }

  const last3 = call.lines.slice(-3);

  return (
    <section
      aria-label="call with Percy"
      style={{
        position: "fixed",
        right: 18,
        bottom: 94,
        width: 340,
        zIndex: 27,
        borderRadius: 20,
        background: "#0c0c0c",
        color: "#ecebe5",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* avatar well */}
      <div
        style={{
          position: "relative",
          height: 190,
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(60% 60% at 50% 45%, color-mix(in oklch, var(--accent) 22%, transparent), transparent)",
        }}
      >
        <span style={{ width: 150, height: 150, display: "block" }}>
          <PercyAvatar mode={call.phase === "live" ? "listening" : "idle"} />
        </span>
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 20,
          }}
        >
          Percy
        </span>
        <span
          style={{
            position: "absolute",
            top: 18,
            right: 16,
            fontSize: 12,
            color: "#a4a39d",
          }}
        >
          {call.phase === "ringing" ? status : dur}
        </span>
      </div>

      {/* captions */}
      <div style={{ padding: "12px 16px", minHeight: 78 }}>
        {last3.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#85847d" }}>
            captions show here…
          </div>
        ) : (
          last3.map((l, i) => (
            <div
              key={`${l.who}:${l.text.slice(0, 16)}`}
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                marginTop: i ? 4 : 0,
                color: l.who === "percy" ? "#ff5a1f" : "#c9c8c2",
              }}
            >
              {l.text}
            </div>
          ))
        )}
        {call.heard && (
          <div style={{ fontSize: 13, color: "#85847d", marginTop: 4 }}>
            {call.heard}
            <span className="os-caret">▍</span>
          </div>
        )}
      </div>

      {/* controls */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 16px 16px",
          justifyContent: "center",
        }}
      >
        <IconBtn label="mute" onClick={toggleMute} active={call.muted}>
          {call.muted ? "🔇" : "🎙"}
        </IconBtn>
        <IconBtn label="end call" onClick={end} danger>
          end
        </IconBtn>
      </div>
    </section>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        background: danger
          ? "oklch(0.55 0.2 27)"
          : active
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.06)",
        color: "#ecebe5",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
