"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Serializable message shape built server-side and handed to the client transcript.
export type ChatMessage = {
  id: number;
  mine: boolean;
  text: string;
  ts: string;
  // true when this turn came from call mode ([voice call] / [voice call ended]).
  call?: boolean;
};

type Props = {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  // Human-readable status label (e.g. "working", "idle") + a class key for the dot.
  statusLabel?: string;
  statusKey?: string;
  messages: ChatMessage[];
  // The fixed send contract — a server action imported by the server page and passed down.
  // Next.js allows a server action to cross the server→client boundary as a prop.
  sendAction: (formData: FormData) => void | Promise<void>;
  // The voice-call control (CallPanel). It renders a single fragment: a round
  // call/end button plus (when a call is active) its own `.cp-panel` transcript
  // section. ChatPane hosts that fragment in a dedicated `.chat-call-region`
  // directly beneath the header, so the round button reads as a header action
  // while the live-call transcript gets its OWN roomy, clearly separated section
  // instead of being squished under the header. Kept as a slot so the call lives
  // INSIDE this one cohesive panel instead of a floating bar.
  callSlot?: ReactNode;
  // Optional: caps the message scroll height. The agent page wants a tall chat
  // that fills the rail; the office chat card wants a shorter, contained one.
  // Defaults to the tall treatment (via the CSS variable) when omitted.
  scrollMaxHeight?: number;
  // Optional composer placeholder override (e.g. Scribe's "proposal for <company>: …").
  composerHint?: string;
};

// Pixel slack: treat "within this many px of the bottom" as "already at the bottom",
// so the transcript sticks to the newest message but never yanks a reader who scrolled up.
const STICK_THRESHOLD = 80;

// Markdown drop-in limits. A dropped file is read client-side and inlined into the
// message text (there is no attachment channel to the bridge), so cap the size.
const MAX_ATTACH_BYTES = 200 * 1024;
const isMarkdownFile = (f: File) =>
  /\.(md|markdown|txt)$/i.test(f.name) ||
  f.type === "text/markdown" ||
  f.type === "text/plain";

export function ChatPane({
  agentId,
  agentName,
  agentEmoji,
  statusLabel,
  statusKey,
  messages,
  sendAction,
  callSlot,
  scrollMaxHeight,
  composerHint,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // Whether the viewer is currently pinned to the bottom. Starts true so the first
  // paint lands on the newest message; updated on every scroll.
  const atBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  // Whether the composer currently has text — drives the send button's enabled/
  // clay state. Purely presentational; the real value is the textarea's own value.
  const [hasText, setHasText] = useState(false);
  // Markdown drop-in: dragging a .md file over the composer, and any skip notice.
  const [dragOver, setDragOver] = useState(false);
  const [attachNote, setAttachNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // Optimistic sends: a message you send is an `actions` row that only echoes back
  // as an `events` row minutes later (bridge + agent), so we show it instantly as a
  // pending bubble and a "typing…" line, then drop it once the real message arrives.
  const [pending, setPending] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const prevLastId = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // First mount: land on the newest message with no animation.
  // useLayoutEffect avoids a visible jump before paint.
  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, [scrollToBottom]);

  // Track proximity to the bottom as the user scrolls.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distance <= STICK_THRESHOLD;
      atBottomRef.current = near;
      setShowJump(!near);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // On new/changed messages (the 6s AutoRefresh re-renders the server page and feeds a
  // fresh array), stick to the bottom ONLY if the viewer was already near it.
  const lastId = messages.length ? messages[messages.length - 1].id : 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: lastId + length are the change signal that a new message arrived across the 6s refresh
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom("smooth");
  }, [lastId, messages.length, scrollToBottom]);

  // Reconcile optimistic sends against the refreshed server transcript: drop any
  // pending bubble the server has now echoed back as one of my messages, and stop
  // the "typing…" line once a NEW agent reply lands.
  useEffect(() => {
    const mine = new Set(
      messages.filter((m) => m.mine).map((m) => m.text.trim()),
    );
    setPending((prev) => prev.filter((t) => !mine.has(t)));
    if (lastId !== prevLastId.current) {
      const last = messages[messages.length - 1];
      if (last && !last.mine) setTyping(false);
      prevLastId.current = lastId;
    }
  }, [messages, lastId]);

  // Auto-grow the composer up to a cap, then let it scroll internally.
  const autosize = useCallback(() => {
    const ta = textRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, []);
  useEffect(() => {
    autosize();
  }, [autosize]);

  const onInput = () => {
    autosize();
    setHasText((textRef.current?.value.trim().length ?? 0) > 0);
  };

  // Markdown drop-in. There is no attachment channel to the bridge (a message is
  // one `actions` row with `text`), so a dropped .md file is read client-side and
  // its contents are inserted into the composer as a labelled block — the agent
  // receives the file inline in the message. Accepts .md / .markdown / .txt, caps
  // each file at 200kb, and notes anything it skipped.
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setAttachNote("");
      const blocks: string[] = [];
      const skipped: string[] = [];
      for (const f of list) {
        if (!isMarkdownFile(f)) {
          skipped.push(`${f.name} (not markdown)`);
          continue;
        }
        if (f.size > MAX_ATTACH_BYTES) {
          skipped.push(`${f.name} (over 200kb)`);
          continue;
        }
        const body = (await f.text()).trim();
        if (body) blocks.push(`attached: ${f.name}\n\n${body}`);
      }
      if (skipped.length) setAttachNote(`skipped ${skipped.join(", ")}`);
      const ta = textRef.current;
      if (!ta || !blocks.length) return;
      const existing = ta.value.trim();
      ta.value = existing
        ? `${existing}\n\n${blocks.join("\n\n")}`
        : blocks.join("\n\n");
      autosize();
      setHasText(ta.value.trim().length > 0);
      ta.focus();
    },
    [autosize],
  );

  const onDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    setDragOver(false);
    void addFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer?.types ?? []).includes("Files")) return;
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null))
      setDragOver(false);
  };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void addFiles(e.target.files);
    e.target.value = ""; // allow re-picking the same file
  };

  // Enter-to-send progressive enhancement. Enter submits the real form (server action),
  // Shift+Enter inserts a newline. Because this only enhances a genuine <form action>,
  // it degrades to a normal submit if JS is off.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if ((textRef.current?.value.trim().length ?? 0) === 0) return;
      formRef.current?.requestSubmit();
    }
  };

  // After a send, show the message immediately (optimistic bubble + typing line),
  // then clear + reset the composer and snap to the newest line. React captures the
  // form data synchronously on submit, so clearing the textarea next frame is safe.
  const onSubmit = () => {
    atBottomRef.current = true;
    const ta = textRef.current;
    const text = (ta?.value ?? "").trim();
    setHasText(false);
    setAttachNote("");
    if (text) {
      setPending((p) => [...p, text]);
      setTyping(true);
      // Safety cap so the bubble can't spin forever if the reply is never detected
      // (e.g. the agent acts without messaging). While the agent is "working" the
      // bubble stays up via statusKey regardless; this only bounds the send-driven
      // case. Cleared the moment a new agent message arrives (reconcile effect).
      window.setTimeout(() => setTyping(false), 120000);
    }
    requestAnimationFrame(() => {
      if (ta) {
        ta.value = "";
        ta.style.height = "auto";
      }
      scrollToBottom("smooth");
    });
  };

  // Show the "waiting for a reply" bubble while a send is in flight OR while the
  // agent is actively working — but ONLY while the last thing in the thread is
  // yours (or a pending send), i.e. we're genuinely waiting on the agent. That
  // keeps it up for the whole wait, yet hides it the instant a reply lands (even
  // if the agent's "working" status is briefly stale until the next refresh).
  const lastMsg = messages[messages.length - 1];
  const awaitingAgent = pending.length > 0 || (lastMsg ? lastMsg.mine : false);
  const showWaiting = awaitingAgent && (typing || statusKey === "working");

  // Keep the newest optimistic bubble / waiting line in view as they appear.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pending + waiting state are the intended scroll triggers
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom("smooth");
  }, [pending.length, showWaiting, scrollToBottom]);

  const dotKey = statusKey ?? "idle";

  return (
    <section
      className="chat-panel"
      aria-label={`chat with ${agentName}`}
      style={
        scrollMaxHeight
          ? ({
              "--chat-scroll-max": `${scrollMaxHeight}px`,
            } as CSSProperties)
          : undefined
      }
    >
      {/* ── Header: avatar · name · status · call button ─────────────────── */}
      <header className="chat-head">
        <span className="chat-avatar" aria-hidden="true">
          {agentEmoji}
        </span>
        <span className="chat-id">
          <span className="chat-name">{agentName}</span>
          <span className="chat-status">
            <span className={`dot ${dotKey}`} aria-hidden="true" />
            {statusLabel ?? dotKey}
          </span>
        </span>
        {/* The round call / end-call button lives here as a header action. It's
            the same CallPanel fragment rendered in `.chat-call-region` below —
            CSS lifts the button up into the header row while the transcript
            section that follows it flows into its own roomy block. */}
      </header>

      {/* ── Voice-call region: the CallPanel fragment (round button + its own
          titled transcript section). Given its OWN block directly under the
          header so a live call is clearly separated + roomy, never squished. */}
      {callSlot && <div className="chat-call-region">{callSlot}</div>}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="chat-body">
        <div
          ref={scrollRef}
          className="chat-scroll"
          role="log"
          aria-live="polite"
          aria-label={`conversation with ${agentName}`}
        >
          {!messages.length && !pending.length ? (
            <div className="chat-empty">
              <span className="ce-avatar" aria-hidden="true">
                {agentEmoji}
              </span>
              <span className="ce-title">say hi to {agentName}</span>
              <span className="ce-sub">
                messages you send appear here, with replies a few seconds later.
              </span>
            </div>
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1];
              // Tighten spacing when the same sender speaks twice in a row.
              const grouped = prev && prev.mine === m.mine;
              return (
                <div
                  key={m.id}
                  className={`bubble-row ${m.mine ? "mine" : "theirs"}${grouped ? " grouped" : ""}`}
                >
                  {!m.mine && (
                    <span className="bubble-avatar" aria-hidden="true">
                      {grouped ? "" : agentEmoji}
                    </span>
                  )}
                  <div className="bubble-col">
                    <div className="bubble">
                      <span className="bubble-text">{m.text}</span>
                    </div>
                    <span className="bubble-meta">
                      {m.call && (
                        <span className="call-chip">
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.44.57 3.57a1 1 0 01-.24 1l-2.23 2.23z"
                              fill="currentColor"
                            />
                          </svg>
                          call
                        </span>
                      )}
                      <time className="bubble-t">{m.ts}</time>
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {pending.map((t, i) => (
            <div
              key={`pending-${i}-${t.slice(0, 24)}`}
              className={`bubble-row mine is-pending${
                i > 0 || (messages.length && messages[messages.length - 1].mine)
                  ? " grouped"
                  : ""
              }`}
            >
              <div className="bubble-col">
                <div className="bubble">
                  <span className="bubble-text">{t}</span>
                </div>
                <span className="bubble-meta">
                  <span className="bubble-t">sending…</span>
                </span>
              </div>
            </div>
          ))}

          {showWaiting && (
            <div className="bubble-row theirs typing-row">
              <span className="bubble-avatar" aria-hidden="true">
                {agentEmoji}
              </span>
              <div className="bubble-col">
                <div className="bubble typing-bubble">
                  <span className="sr-only">
                    waiting for {agentName} to reply
                  </span>
                  <span className="typing-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <span className="bubble-meta">
                  <span className="bubble-t">waiting for a reply…</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {showJump && (
          <button
            type="button"
            className="chat-jump"
            onClick={() => {
              scrollToBottom("smooth");
              atBottomRef.current = true;
              setShowJump(false);
            }}
            aria-label="jump to latest message"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 5v14M5 12l7 7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            latest
          </button>
        )}
      </div>

      {/* ── Composer: rounded AI-input with integrated send ──────────────── */}
      <div className="chat-foot">
        <form
          ref={formRef}
          action={sendAction}
          onSubmit={onSubmit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`composer${dragOver ? " is-drop" : ""}`}
        >
          <input type="hidden" name="agent" value={agentId} />
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            multiple
            hidden
            onChange={onPick}
          />
          <button
            type="button"
            className="composer-attach"
            onClick={() => fileRef.current?.click()}
            aria-label={`attach a markdown file to ${agentName}`}
            title="attach a markdown file"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M21.4 11.05 12.25 20.2a5 5 0 0 1-7.07-7.07l9.19-9.19a3.33 3.33 0 0 1 4.71 4.71l-9.2 9.19a1.67 1.67 0 0 1-2.35-2.36l8.49-8.48"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <label className="sr-only" htmlFor={`composer-${agentId}`}>
            message {agentName}
          </label>
          <textarea
            id={`composer-${agentId}`}
            ref={textRef}
            name="text"
            rows={1}
            placeholder={composerHint ?? `message ${agentName}…`}
            onInput={onInput}
            onKeyDown={onKeyDown}
          />
          {dragOver && (
            <div className="composer-drop" aria-hidden="true">
              drop markdown to add it to your message
            </div>
          )}
          <button
            className="composer-send"
            type="submit"
            disabled={!hasText}
            aria-label={`send message to ${agentName}`}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="composer-hint">
          {attachNote ? (
            <span className="composer-note">{attachNote}</span>
          ) : (
            <>
              sent through the bridge into {agentName}&apos;s main session ·
              drop or attach a .md file to add it inline
            </>
          )}
        </p>
      </div>
    </section>
  );
}
