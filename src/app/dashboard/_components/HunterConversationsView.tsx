"use client";

import { useState } from "react";
import { sendOutboundAsOwner } from "@/lib/workforce/actions";

export type ConvoMsg = {
  out: boolean;
  channel: string;
  kind: string;
  t: string;
  subject: string;
  body: string;
  foot: string;
};
export type ConvoThread = {
  key: string;
  company: string;
  email: string;
  campaign: string;
  status: string;
  statusBg: string;
  statusFg: string;
  last: string;
  channel: string;
  threadId: string;
  subject: string;
  msgs: ConvoMsg[];
};

const FILTERS = ["all", "replied", "awaiting reply", "handed off"];

export function HunterConversationsView({
  threads,
}: {
  threads: ConvoThread[];
}) {
  const [cf, setCf] = useState("all");
  const [sel, setSel] = useState(threads[0]?.key ?? "");
  const [reply, setReply] = useState("");

  const list = threads.filter((t) => cf === "all" || t.status === cf);
  const thread = threads.find((t) => t.key === sel) ?? list[0];

  return (
    <div className="wf-hn-convos">
      <div className="wf-hn-convo-list">
        <div className="wf-hn-convo-chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`wf-hn-fchip${cf === f ? " on" : ""}`}
              onClick={() => setCf(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {list.length === 0 && (
          <div className="wf-hn-empty">no threads with that status.</div>
        )}
        {list.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`wf-hn-convo-card${t.key === sel ? " on" : ""}`}
            onClick={() => {
              setSel(t.key);
              setReply("");
            }}
          >
            <span className="wf-hn-thread-top">
              <span className="wf-hn-thread-co">{t.company}</span>
              <span
                className="wf-hn-stpill"
                style={{ background: t.statusBg, color: t.statusFg }}
              >
                {t.status}
              </span>
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {t.email}
            </span>
            <span className="wf-hn-thread-last">{t.last}</span>
          </button>
        ))}
      </div>

      {thread && (
        <div className="wf-hn-thread-view">
          <div className="wf-hn-thread-head">
            <div>
              <div
                style={{
                  fontFamily: "var(--font-arch)",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {thread.company}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {thread.email} · {thread.campaign || "no campaign"}
              </div>
            </div>
            <span
              className="wf-hn-stpill"
              style={{ background: thread.statusBg, color: thread.statusFg }}
            >
              {thread.status}
            </span>
          </div>
          <div className="wf-hn-thread-msgs">
            {thread.msgs.map((m, i) => (
              <div
                key={`${m.t}-${i}`}
                className={`wf-hn-msg${m.out ? " out" : ""}`}
              >
                <div className="wf-hn-bubble">
                  <div className="wf-hn-bubble-tags">
                    <span className="wf-chip-mono">{m.channel}</span>
                    <span
                      className="wf-chip-mono"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--line-strong)",
                      }}
                    >
                      {m.kind}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ink-faint)",
                      }}
                    >
                      {m.t}
                    </span>
                  </div>
                  {m.subject && (
                    <div className="wf-hn-bubble-subject">{m.subject}</div>
                  )}
                  <div className="wf-hn-bubble-body">{m.body}</div>
                  {m.foot && <div className="wf-hn-bubble-foot">{m.foot}</div>}
                </div>
                {!m.out && (
                  <button
                    type="button"
                    className="wf-hn-btn ghost sm"
                    onClick={() =>
                      setReply("hi, thanks for coming back to me.\n\n")
                    }
                  >
                    reply as me
                  </button>
                )}
              </div>
            ))}
          </div>
          <form action={sendOutboundAsOwner} className="wf-hn-sendas">
            <input type="hidden" name="channel" value={thread.channel} />
            <input type="hidden" name="to" value={thread.email} />
            <input
              type="hidden"
              name="subject"
              value={
                thread.subject.startsWith("re:")
                  ? thread.subject
                  : `re: ${thread.subject}`
              }
            />
            <input type="hidden" name="campaign" value={thread.campaign} />
            <input type="hidden" name="thread" value={thread.threadId} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--ink-mut)",
              }}
            >
              <span className="wf-hn-sendas-label">send as me</span>
              <span>
                written by you, sent from your address. no approval step.
              </span>
            </div>
            <textarea
              name="body"
              className="wf-hn-textarea"
              style={{ minHeight: 90 }}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="write your reply…"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="wf-hn-btn amber"
                disabled={!reply.trim()}
                style={reply.trim() ? undefined : { opacity: 0.5 }}
              >
                send as me
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
