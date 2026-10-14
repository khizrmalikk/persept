"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessageFromForm } from "@/lib/workforce/actions";
import type { OSAgent } from "../_data/agents";
import type { OSThreadMsg } from "../_data/threads";
import { AttachButton, AttachChips } from "./ChatAttach";
import { ChatBody } from "./ChatBody";
import { useOS } from "./os-store";
import { type AgentKey, Persona } from "./Persona";
import { useChatAttachments } from "./useChatAttachments";

// The conversations drawer: one panel, six threads. Chief is pinned first (you
// tell Chief what you need), then a `direct` label and the five other agents.
// Sending routes through the real `sendMessageFromForm` action (an `actions` row
// the bridge relays); replies and task cards arrive from the bridge as events —
// history loading is wired with the agent page. Optimistic bubbles show sends now.

type Bubble = { id: string; mine: boolean; text: string; ts: string };
const ORDER: AgentKey[] = [
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];

export function ChiefDrawer({
  agents,
  threads,
}: {
  agents: OSAgent[];
  threads: Record<string, OSThreadMsg[]>;
}) {
  const os = useOS();
  // optimistic sends not yet echoed back as a `user` event, per thread
  const [pending, setPending] = useState<Record<string, Bubble[]>>({});
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const nid = useRef(0);
  const typingTimers = useRef<Record<string, number>>({});
  const att = useChatAttachments(os.showToast);

  const thread = os.thread;
  const agent = agents.find((a) => a.id === thread);
  const name = thread === "chief" ? "Chief" : (agent?.name ?? thread);

  // drop any staged attachments when switching threads — they belong to the
  // message you were composing for the thread you left.
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear on thread switch only
  useEffect(() => {
    att.clear();
  }, [thread]);

  const send = useCallback((text: string, to: AgentKey) => {
    const body = text.trim();
    if (!body) return;
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setPending((m) => ({
      ...m,
      [to]: [
        ...(m[to] ?? []),
        { id: `o${nid.current++}`, mine: true, text: body, ts },
      ],
    }));
    setTyping((t) => ({ ...t, [to]: true }));
    window.clearTimeout(typingTimers.current[to]);
    typingTimers.current[to] = window.setTimeout(
      () => setTyping((t) => ({ ...t, [to]: false })),
      90_000,
    );
    const fd = new FormData();
    fd.append("agent", to);
    fd.append("text", body);
    void sendMessageFromForm(fd);
  }, []);

  // fold the draft + any staged attachments into one message body, send, reset.
  const doSend = () => {
    const body = att.compose(draft);
    if (!body.trim()) return;
    send(body, thread);
    att.clear();
    setDraft("");
  };

  // reconcile: when fresh events land (via the tick), drop optimistic bubbles the
  // server has now echoed as a `user` message, and stop the typing line once a new
  // `assistant` reply is the newest message for that thread.
  useEffect(() => {
    setPending((prev) => {
      const next: Record<string, Bubble[]> = {};
      for (const [k, arr] of Object.entries(prev)) {
        const mine = new Set(
          (threads[k] ?? []).filter((m) => m.mine).map((m) => m.text.trim()),
        );
        next[k] = arr.filter((o) => !mine.has(o.text.trim()));
      }
      return next;
    });
    setTyping((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        const last = (threads[k] ?? [])[(threads[k] ?? []).length - 1];
        if (last && !last.mine) next[k] = false;
      }
      return next;
    });
  }, [threads]);

  // palette "ask chief: …" handoff
  useEffect(() => {
    const onAsk = () => {
      const q = window.sessionStorage.getItem("os-ask-chief");
      if (q) {
        window.sessionStorage.removeItem("os-ask-chief");
        send(q, "chief");
      }
    };
    window.addEventListener("os-ask-chief", onAsk);
    return () => window.removeEventListener("os-ask-chief", onAsk);
  }, [send]);

  // server thread + unmatched optimistic bubbles, oldest→newest
  const serverMsgs = threads[thread] ?? [];
  const mineTexts = new Set(
    serverMsgs.filter((m) => m.mine).map((m) => m.text.trim()),
  );
  const list: Bubble[] = [
    ...serverMsgs,
    ...(pending[thread] ?? []).filter((o) => !mineTexts.has(o.text.trim())),
  ];
  const showTyping = !!typing[thread];

  // stick to newest — also when the drawer opens, so it starts at the most recent
  // message rather than the top. A rAF lets layout settle before measuring.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on open / thread / message change
  useEffect(() => {
    if (!os.drawer) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [os.drawer, list.length, thread, showTyping]);

  if (!os.drawer) return null;

  const sub =
    thread === "chief"
      ? "tell Chief what you need. Chief hands it to the right agent."
      : `direct line · ${agent?.room ?? ""}`;

  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        top: 46,
        bottom: 90,
        width: 440,
        zIndex: 25,
        background: "var(--surf)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Persona agent={thread} size={40} ring status={agent?.status ?? ""} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>{name}</span>
          <span
            style={{
              fontSize: 12,
              color: "var(--soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </span>
        </div>
        <button
          type="button"
          onClick={os.closeDrawer}
          aria-label="close conversations"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--soft)",
            background: "transparent",
            border: "none",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* thread tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {ORDER.map((k) => {
          const active = k === thread;
          const st = agents.find((a) => a.id === k)?.status ?? "";
          const isChief = k === "chief";
          return (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <button
                type="button"
                onClick={() => os.setThread(k)}
                title={
                  k === "chief"
                    ? "Chief"
                    : (agents.find((a) => a.id === k)?.name ?? k)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: 3,
                  paddingRight: isChief ? 10 : 3,
                  borderRadius: 999,
                  background: active ? "var(--surf2)" : "transparent",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <Persona agent={k} size={26} status={st} />
                {isChief && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      color: "var(--ink)",
                    }}
                  >
                    chief
                  </span>
                )}
              </button>
              {isChief && (
                <span
                  className="os-mono"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--mute)",
                    padding: "0 4px 0 6px",
                  }}
                >
                  direct
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {list.length === 0 && (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--mute)",
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            {thread === "chief"
              ? "say what you need. Chief turns it into tasks for the right agent and anything outbound comes to approvals."
              : `message ${name} directly. Chief still sees this thread.`}
          </div>
        )}
        {list.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-end",
              justifyContent: m.mine ? "flex-end" : "flex-start",
            }}
          >
            {!m.mine && <Persona agent={thread} size={26} />}
            <div
              style={{
                maxWidth: 320,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: m.mine ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: m.mine
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  background: m.mine ? "var(--ink)" : "var(--surf2)",
                  color: m.mine ? "var(--bg)" : "var(--ink)",
                  fontSize: 13.5,
                  lineHeight: 1.45,
                }}
              >
                <ChatBody text={m.text} mine={m.mine} />
              </div>
              <span
                className="os-mono"
                style={{ fontSize: 10, color: "var(--mute)" }}
              >
                {m.ts}
              </span>
            </div>
          </div>
        ))}
        {showTyping && (
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <Persona agent={thread} size={26} />
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "16px 16px 16px 4px",
                background: "var(--surf2)",
                display: "flex",
                gap: 4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="os-typing-dot"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--soft)",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <div style={{ margin: "0 12px 12px" }}>
        <AttachChips att={att} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 8px 6px 6px",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
          }}
        >
          <AttachButton agentId={thread} att={att} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSend();
            }}
            placeholder={
              thread === "chief"
                ? "tell chief what you need…"
                : `message ${name}…`
            }
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={doSend}
            disabled={!draft.trim() && att.items.length === 0}
            aria-label="send"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--ink)",
              color: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flex: "none",
              border: "none",
              opacity: !draft.trim() && att.items.length === 0 ? 0.4 : 1,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
