"use client";

import {
  type CSSProperties,
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
import type { OSAgent } from "../_data/agents";
import { useLive } from "./LiveView";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// ── call panel ──────────────────────────────────────────────────────────────
// A voice call with Percy over the existing bridge plumbing: browser speech in →
// POST /api/workforce/call/send; Percy's speech-only replies stream back over the
// SSE channel (GET /api/workforce/call/stream) and show as captions. No
// speechSynthesis in production — the prototype used it only as a stand-in. A
// session also lives as a compact pill in the menu bar (started by holding ⌘⌥);
// while Percy drives the screen the full card hides and the pill represents it.

type Phase = "ringing" | "live";
type Caption = { who: "percy" | "you"; text: string };
type Call = {
  phase: Phase;
  t0: number;
  muted: boolean;
  lines: Caption[];
  heard: string;
  bridge: boolean; // live bridge channel reachable
  bar: boolean; // session lives only in the menu-bar pill (no full card)
} | null;

type CallApi = {
  call: Call;
  holding: boolean;
  micNotice: boolean;
  start: (opts?: { bar?: boolean }) => void;
  end: () => void;
  toggleMute: () => void;
  showCall: () => void;
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
  const [holding, setHolding] = useState(false);
  const [micNotice, setMicNotice] = useState(false);

  const osRef = useRef(os);
  osRef.current = os;
  const holdTimerRef = useRef<number | undefined>(undefined);
  const esRef = useRef<EventSource | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const callRef = useRef<Call>(call);
  callRef.current = call;
  // Percy's voice: the bridge /tts audio queue, spoken sentence by sentence.
  const ttsQueueRef = useRef<string[]>([]);
  const ttsBusyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefetchRef = useRef<Promise<string | null> | null>(null);
  const sentenceBufRef = useRef("");
  const voiceRef = useRef<string | undefined>(undefined);
  // browser speech-recognition health (Chrome-only in practice)
  const micStartRef = useRef(0);
  const micFastRef = useRef(0);

  const teardown = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    try {
      recRef.current?.abort();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
    audioRef.current = null;
    ttsQueueRef.current = [];
    ttsBusyRef.current = false;
    prefetchRef.current = null;
    sentenceBufRef.current = "";
    setPercyCall(false);
    setPercyMode("idle");
  }, []);

  const end = useCallback(() => {
    teardown();
    setCall(null);
    void endCallAction("percy").catch(() => {});
  }, [teardown]);

  // bring the full card forward from a bar-only session
  const showCall = useCallback(() => {
    setCall((c) => (c ? { ...c, bar: false } : c));
  }, []);

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

  // ── Percy's voice (bridge /tts, spoken sentence by sentence) ──────────────
  const ttsFetch = useCallback(async (text: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/workforce/call/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, voice: voiceRef.current }),
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, []);

  const pumpTts = useCallback(async () => {
    if (ttsBusyRef.current) return;
    ttsBusyRef.current = true;
    try {
      recRef.current?.stop(); // speaking pauses listening
    } catch {
      /* ignore */
    }
    setPercyMode("speaking");
    while (ttsQueueRef.current.length > 0) {
      const text = ttsQueueRef.current.shift();
      if (!text) break;
      const url = prefetchRef.current
        ? await prefetchRef.current
        : await ttsFetch(text);
      prefetchRef.current = null;
      const next = ttsQueueRef.current[0];
      if (next) prefetchRef.current = ttsFetch(next); // prefetch while we play
      if (!url) continue;
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        const done = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
    }
    ttsBusyRef.current = false;
    const c = callRef.current;
    if (c && c.phase === "live") {
      setPercyMode("listening");
      if (!c.muted) {
        try {
          micStartRef.current = Date.now();
          recRef.current?.start();
        } catch {
          /* ignore */
        }
      }
    } else {
      setPercyMode("idle");
    }
  }, [ttsFetch]);

  const enqueueSentence = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || t.startsWith("(call:")) return; // Percy's own note, don't speak it
      ttsQueueRef.current.push(t);
      void pumpTts();
    },
    [pumpTts],
  );

  // split streamed text into complete sentences; keep the tail buffered
  const flushSentences = useCallback(
    (chunk: string, final = false) => {
      let buf = sentenceBufRef.current + chunk;
      const re = /(.+?[.!?]+)(\s+|$)/g;
      let lastEnd = 0;
      let m = re.exec(buf);
      while (m !== null) {
        enqueueSentence(m[1]);
        lastEnd = re.lastIndex;
        m = re.exec(buf);
      }
      buf = buf.slice(lastEnd);
      if (final && buf.trim()) {
        enqueueSentence(buf);
        buf = "";
      }
      sentenceBufRef.current = buf;
    },
    [enqueueSentence],
  );

  const startListening = useCallback(() => {
    const Ctor = getSpeechRec();
    if (!Ctor) {
      setMicNotice(true); // Safari/Arc: no webkitSpeechRecognition
      return;
    }
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
      // Arc/Safari end immediately; three fast ends → show the Chrome notice
      if (Date.now() - micStartRef.current < 500) {
        micFastRef.current += 1;
        if (micFastRef.current >= 3) {
          setMicNotice(true);
          return;
        }
      } else {
        micFastRef.current = 0;
      }
      // keep listening while the call is live and not muted
      const c = callRef.current;
      if (c && c.phase === "live" && !c.muted) {
        try {
          micStartRef.current = Date.now();
          rec.start();
        } catch {
          /* race on restart */
        }
      }
    };
    rec.onerror = () => {};
    try {
      micStartRef.current = Date.now();
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
        const text = msg.text;
        setCall((c) => (c ? { ...c, lines: appendPercy(c.lines, text) } : c));
        flushSentences(text); // speak as sentences complete
      } else if (msg.type === "final") {
        flushSentences("", true); // speak any trailing partial sentence
      } else if (msg.type === "error") {
        osRef.current.showToast("the call dropped — try again");
      }
    };
    es.onerror = () => {
      // transient; the browser auto-reconnects. nothing to do.
    };
    esRef.current = es;
  }, [flushSentences]);

  const start = useCallback(
    (opts?: { bar?: boolean }) => {
      if (callRef.current) return;
      setCall({
        phase: "ringing",
        t0: Date.now(),
        muted: false,
        lines: [],
        heard: "",
        bridge: false,
        bar: opts?.bar ?? false,
      });
      setPercyCall(true);
      setPercyMode("listening");
      // probe the bridge, then go live
      void (async () => {
        let bridge = false;
        try {
          const r = await fetch(
            "/api/workforce/call/stream?agent=percy&ping=1",
          );
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
          // Percy greets first — the greeting streams back like any turn
          void fetch("/api/workforce/call/start", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ agentId: "percy" }),
          }).catch(() => {});
          startListening();
        } else {
          osRef.current.showToast(
            "live voice needs the bridge — your words still reach Percy",
          );
          startListening(); // utterances still POST (queue for when the bridge is up)
        }
      })();
    },
    [openStream, startListening],
  );

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

  // load the saved voice choice (sent as `voice` on every /tts request)
  useEffect(() => {
    const v = window.localStorage.getItem("os-call-voice");
    if (v) voiceRef.current = v;
  }, []);

  // ⌥P toggles the full call card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyP") {
        e.preventDefault();
        if (callRef.current) end();
        else start({ bar: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, end]);

  // hold ⌘ + ⌥ (Ctrl+Alt) for 500ms to start/end a Percy session (into the bar).
  // Cancels on an early modifier release, any other key, or window blur; ignored
  // on the lock screen and on key auto-repeat.
  useEffect(() => {
    const cancel = () => {
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = undefined;
      setHolding(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (osRef.current.locked || e.repeat) return;
      const isMod = e.key === "Meta" || e.key === "Alt" || e.key === "Control";
      const bothMods = (e.metaKey || e.ctrlKey) && e.altKey;
      if (bothMods && isMod) {
        if (holdTimerRef.current) return;
        setHolding(true);
        holdTimerRef.current = window.setTimeout(() => {
          holdTimerRef.current = undefined;
          setHolding(false);
          if (callRef.current) end();
          else start({ bar: true });
        }, 500);
      } else if (holdTimerRef.current) {
        cancel();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "Alt" || e.key === "Control") cancel();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", cancel);
      cancel();
    };
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
    <CallCtx.Provider
      value={{ call, holding, micNotice, start, end, toggleMute, showCall }}
    >
      {children}
      <CallPanel />
      <SessionPill />
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

// the bridge appends a one-line "(call: …)" note for Percy, not the owner —
// drop any line beginning with it from the captions and from TTS.
function stripCall(s: string): string {
  return s
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("(call:"))
    .join("\n")
    .trim();
}

function fmtDur(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── the panel (full + mini) ─────────────────────────────────────────────────
function CallPanel() {
  const { call, end, toggleMute, micNotice } = useCall();
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

  // the full card shows only when the session isn't bar-only and Percy isn't
  // driving the screen; otherwise the menu-bar session pill represents the call.
  if (call.bar || liveRunning) return null;

  const last3 = call.lines.slice(-3);

  return (
    <section
      aria-label="call with Percy"
      style={{
        position: "fixed",
        right: 18,
        bottom: 66,
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
              {l.who === "percy" ? stripCall(l.text) : l.text}
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

      {micNotice && (
        <div
          style={{
            padding: "0 16px 10px",
            fontSize: 11.5,
            color: "#85847d",
          }}
        >
          voice input needs Chrome
        </div>
      )}

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

// ── menu-bar session pill ───────────────────────────────────────────────────
// Shows whenever any call/session is active (and while ⌘⌥ is held). Replaces the
// old bottom-right mini card, including while Percy drives the screen.
const PILL_WRAP: CSSProperties = {
  position: "fixed",
  left: "50%",
  top: 4,
  transform: "translateX(-50%)",
  zIndex: 42,
  height: 28,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 3px",
  borderRadius: 14,
  background: "#0c0c0c",
  color: "#ecebe5",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  overflow: "hidden",
};
const PILL_AVATAR: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  overflow: "hidden",
  flex: "none",
  background: "#141416",
};
const EQ_KEYS = ["a", "b", "c", "d"];

function SessionPill() {
  const { call, holding, end, toggleMute, showCall } = useCall();
  const { run } = useLive();
  const os = useOS();
  const [, tick] = useState(0);
  const barOn = !!call || holding;
  useEffect(() => {
    if (!barOn) return;
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [barOn]);
  if (!barOn) return null;

  // hold feedback (modifier held, no call yet)
  if (!call) {
    return (
      <div className="os-popin" style={PILL_WRAP}>
        <span style={PILL_AVATAR}>
          <PercyAvatar mode="idle" />
        </span>
        <span style={{ fontSize: 12, color: "#a4a39d", paddingRight: 6 }}>
          keep holding to start Percy
        </span>
        <span className="os-hold-fill" />
      </div>
    );
  }

  const liveRunning = run?.status === "running";
  const working = liveRunning
    ? `working · step ${run.i + 1} of ${run.plan.steps.length}`
    : null;
  const status =
    call.phase === "ringing"
      ? "connecting…"
      : (working ?? (call.muted ? "you're muted" : "listening"));
  const accent = !!working;
  const live = call.phase === "live" && !call.muted;

  return (
    <div
      className="os-popin"
      style={{
        ...PILL_WRAP,
        border: accent
          ? "1px solid var(--accent)"
          : "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <span style={PILL_AVATAR}>
        <PercyAvatar mode={accent ? "working" : "listening"} />
      </span>
      <button
        type="button"
        onClick={() => os.openDrawer("percy")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          border: "none",
          background: "transparent",
          color: "#ecebe5",
          cursor: "pointer",
          lineHeight: 1.1,
          padding: 0,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>Percy</span>
        <span
          style={{
            fontSize: 11.5,
            color: accent ? "var(--accent)" : "#a4a39d",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </span>
      </button>
      <span
        style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}
      >
        {EQ_KEYS.map((k, i) => (
          <span
            key={k}
            style={{
              width: 2,
              height: 12,
              background: "var(--accent)",
              borderRadius: 1,
              transformOrigin: "bottom",
              transform: "scaleY(0.3)",
              animation: live
                ? `os-eq-bar ${working ? "0.7s" : "1.3s"} ease-in-out ${(
                    -0.23 * i
                  ).toFixed(2)}s infinite`
                : "none",
            }}
          />
        ))}
      </span>
      <span style={{ fontSize: 11.5, color: "#85847d" }}>
        {fmtDur(Date.now() - call.t0)}
      </span>
      <SessBtn label="mute" onClick={toggleMute} active={call.muted}>
        {call.muted ? "🔇" : "🎙"}
      </SessBtn>
      <SessBtn label="show call" onClick={showCall}>
        ⤢
      </SessBtn>
      <SessBtn label="end call" onClick={end} danger>
        ✕
      </SessBtn>
    </div>
  );
}

function SessBtn({
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
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "none",
        background: danger
          ? "oklch(0.6 0.2 27)"
          : active
            ? "#ecebe5"
            : "rgba(255,255,255,0.08)",
        color: danger ? "#fff" : active ? "#0c0c0c" : "#ecebe5",
        fontSize: 10,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flex: "none",
      }}
    >
      {children}
    </button>
  );
}

// ── Percy pill (bottom-right chat bar) ──────────────────────────────────────
// Avatar + text open the conversations drawer; the phone button starts/ends a
// call (full card). Lives here so it can reach the call context.
export function PercyPill({
  agents,
  pending,
}: {
  agents: OSAgent[];
  pending: number;
}) {
  const os = useOS();
  const { call, start, end } = useCall();
  const status = agents.find((a) => a.id === "percy")?.status ?? "";
  const onCall = !!call;
  return (
    <div
      data-pc="pill"
      style={{
        position: "absolute",
        right: 14,
        bottom: 10,
        zIndex: 26,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 5,
        borderRadius: 14,
        background: "var(--dock)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow)",
        color: "var(--ink)",
      }}
    >
      <button
        type="button"
        onClick={() => os.toggleDrawer("percy")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          background: "transparent",
          color: "var(--ink)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Persona agent="percy" size={36} ring status={status} />
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            textAlign: "left",
            width: 140,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>Percy</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pending > 0
              ? `${pending} waiting for you`
              : "hold ⌘⌥ to talk · ⌘J"}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={onCall ? "end call" : "call Percy"}
        onClick={() => (onCall ? end() : start({ bar: false }))}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          flex: "none",
          background: onCall ? "oklch(0.6 0.2 27)" : "var(--accent)",
          color: "var(--onacc, #0c0c0c)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          style={{ transform: onCall ? "rotate(135deg)" : "none" }}
        >
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" />
        </svg>
      </button>
    </div>
  );
}
