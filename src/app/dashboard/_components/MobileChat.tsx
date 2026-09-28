"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { agentColor } from "@/lib/workforce/roster";

// Mobile chat screen (< 768px): a horizontal agent chip strip, a header, the
// message list and the composer. Sends through the same `sendMessageFromForm`
// server action as the desktop chat. The agent's reply arrives via the 6s
// refresh (Realtime is out of scope on mobile); we only show an optimistic user
// bubble + a bounded "typing…" line.

export type ChatChip = {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  statusLabel: string;
};
type Msg = { id: number; mine: boolean; text: string; ts: string };

export function MobileChat({
  roster,
  current,
  messages,
  canChat,
  sendAction,
}: {
  roster: ChatChip[];
  current: {
    id: string;
    name: string;
    emoji: string;
    hue: number;
    statusLabel: string;
    task: string;
  };
  messages: Msg[];
  canChat: boolean;
  sendAction: (fd: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [hasText, setHasText] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);

  // drop optimistic bubbles the server has now echoed back as "mine" messages
  const lastLen = useRef(messages.length);
  useEffect(() => {
    const mine = new Set(messages.filter((m) => m.mine).map((m) => m.text));
    setPending((prev) => prev.filter((t) => !mine.has(t)));
    if (messages.length > lastLen.current) setTyping(false);
    lastLen.current = messages.length;
  }, [messages]);

  // stick to the latest message — messages/pending/typing are the change signals
  // biome-ignore lint/correctness/useExhaustiveDependencies: those three are the intended scroll triggers
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, typing]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };
  const onInput = () => {
    autosize();
    setHasText((taRef.current?.value.trim().length ?? 0) > 0);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if ((taRef.current?.value.trim().length ?? 0) > 0)
        formRef.current?.requestSubmit();
    }
  };
  const onSubmit = () => {
    const ta = taRef.current;
    const text = (ta?.value ?? "").trim();
    if (!text) return;
    setPending((p) => [...p, text]);
    setTyping(true);
    setHasText(false);
    window.setTimeout(() => setTyping(false), 8000);
    requestAnimationFrame(() => {
      if (ta) {
        ta.value = "";
        ta.style.height = "auto";
      }
    });
  };

  const sub =
    current.statusLabel === "soon"
      ? "not deployed"
      : `${current.statusLabel}${current.task ? ` · ${current.task.toLowerCase()}` : ""}`;

  return (
    <div className="wf-only-mobile wf-mchat">
      <div className="wf-mchat-chips">
        {roster.map((a) => {
          const active = a.id === current.id;
          const dot =
            a.statusLabel === "working"
              ? agentColor(a.hue)
              : a.statusLabel === "waiting"
                ? "var(--accent)"
                : a.statusLabel === "soon"
                  ? "transparent"
                  : "var(--ink-ghost)";
          return (
            <button
              key={a.id}
              type="button"
              className={`wf-mchat-chip${active ? " is-active" : ""}`}
              style={{
                background: active ? agentColor(a.hue, 0.16) : "var(--panel)",
                borderColor: active
                  ? agentColor(a.hue, 0.5)
                  : "rgba(255,255,255,0.08)",
              }}
              onClick={() => router.push(`/dashboard/agents/${a.id}`)}
            >
              <span
                className="wf-mchat-chip-av"
                style={{ background: agentColor(a.hue, 0.16) }}
              >
                {a.emoji}
              </span>
              <span>{a.name}</span>
              <span className="wf-mchat-chip-dot" style={{ background: dot }} />
            </button>
          );
        })}
      </div>

      <div className="wf-mchat-head">
        <span
          className="wf-mchat-head-av"
          style={{ background: agentColor(current.hue, 0.16) }}
        >
          {current.emoji}
        </span>
        <div className="wf-mchat-head-id">
          <div className="wf-mchat-head-name">{current.name}</div>
          <div className="wf-mchat-head-sub">{sub}</div>
        </div>
      </div>

      <div className="wf-mchat-scroll" ref={scrollRef}>
        {messages.length === 0 && pending.length === 0 && (
          <div className="wf-mchat-empty">
            say hi to {current.name.toLowerCase()}. messages go through the
            bridge into its main session.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`wf-mchat-row ${m.mine ? "mine" : "theirs"}`}
          >
            <div className="wf-mchat-bubble">{m.text}</div>
          </div>
        ))}
        {pending.map((t) => (
          <div key={`p-${t}`} className="wf-mchat-row mine">
            <div className="wf-mchat-bubble">{t}</div>
          </div>
        ))}
        {typing && (
          <div className="wf-mchat-typing">{current.name} is typing…</div>
        )}
      </div>

      {canChat ? (
        <form
          ref={formRef}
          action={sendAction}
          onSubmit={onSubmit}
          className="wf-mchat-composer"
        >
          <input type="hidden" name="agent" value={current.id} />
          <textarea
            ref={taRef}
            name="text"
            rows={1}
            placeholder={`message ${current.name}…`}
            onInput={onInput}
            onKeyDown={onKeyDown}
            className="wf-mchat-input"
          />
          <button
            type="submit"
            className={`wf-mchat-send${hasText ? " on" : ""}`}
            disabled={!hasText}
            aria-label={`send message to ${current.name}`}
          >
            ↑
          </button>
        </form>
      ) : (
        <div className="wf-mchat-soon">
          {current.name.toLowerCase()} isn&rsquo;t deployed yet. ask chief to
          schedule it.
        </div>
      )}
    </div>
  );
}
