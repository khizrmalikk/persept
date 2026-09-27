"use client";

import { useMemo, useState } from "react";
import type { OutreachMessage, Thread } from "@/lib/workforce/outreach";
import { when } from "@/lib/workforce/types";

// The outreach message log, grouped into threads by company. Read-only view of the
// bridge-owned `messages` table (outbound sits right, inbound left). Filter chips
// narrow to replied / awaiting-reply / handed-off. A "reply" on an inbound message
// pre-fills the compose box (via the onReply callback the parent passes down).

type Filter = "all" | "replied" | "awaiting" | "handed";

function threadReplied(t: Thread): boolean {
  return t.messages.some((m) => m.direction === "in");
}
function threadAwaiting(t: Thread): boolean {
  // owner reached out and the prospect has not answered since the last outbound
  const last = t.messages[t.messages.length - 1];
  return last?.direction === "out";
}

const KIND_LABEL: Record<string, string> = {
  first_touch: "first touch",
  follow_up: "follow-up",
  reply: "reply",
  inbound: "inbound",
};

export type ReplySeed = {
  to: string;
  subject: string;
  thread: string;
  campaign: string;
  channel: string;
};

const FILTERS: Filter[] = ["all", "replied", "awaiting", "handed"];

export function Conversations({
  threads,
  handedOff,
  onReply,
  initialFilter,
}: {
  threads: Thread[];
  handedOff: Set<string>;
  onReply?: (seed: ReplySeed) => void;
  // deep-link the starting filter (e.g. the home health strip → awaiting reply)
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState<Filter>(
    FILTERS.includes(initialFilter as Filter)
      ? (initialFilter as Filter)
      : "all",
  );

  const shown = useMemo(() => {
    switch (filter) {
      case "replied":
        return threads.filter(threadReplied);
      case "awaiting":
        return threads.filter(threadAwaiting);
      case "handed":
        return threads.filter((t) => handedOff.has(t.company.toLowerCase()));
      default:
        return threads;
    }
  }, [threads, filter, handedOff]);

  const chips: [Filter, string][] = [
    ["all", "all"],
    ["replied", "replied"],
    ["awaiting", "awaiting reply"],
    ["handed", "handed off"],
  ];

  return (
    <div className="wf-convos">
      <div className="wf-convos-filters">
        {chips.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`wf-chip${filter === k ? " is-active" : ""}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {threads.length === 0 ? (
        <p className="empty">
          no messages yet. approve a draft or write one below.
        </p>
      ) : shown.length === 0 ? (
        <p className="empty">nothing matches that filter.</p>
      ) : (
        <div className="wf-convo-list">
          {shown.map((t) => (
            <ThreadBlock
              key={t.key}
              thread={t}
              handedOff={handedOff.has(t.company.toLowerCase())}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadBlock({
  thread,
  handedOff,
  onReply,
}: {
  thread: Thread;
  handedOff: boolean;
  onReply?: (seed: ReplySeed) => void;
}) {
  return (
    <section className="wf-thread">
      <header className="wf-thread-head">
        <span className="wf-thread-co">{thread.company}</span>
        {thread.contact && (
          <span className="wf-thread-contact">{thread.contact}</span>
        )}
        {handedOff && <span className="wf-thread-handed">handed to you</span>}
      </header>
      <div className="wf-thread-msgs">
        {thread.messages.map((m, i) => (
          <MessageBubble key={m.id} m={m} first={i === 0} onReply={onReply} />
        ))}
      </div>
    </section>
  );
}

function MessageBubble({
  m,
  first,
  onReply,
}: {
  m: OutreachMessage;
  first: boolean;
  onReply?: (seed: ReplySeed) => void;
}) {
  const out = m.direction === "out";
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(m.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className={`wf-msg ${out ? "is-out" : "is-in"}`}>
      <div className="wf-msg-meta">
        <span className="wf-chip sm">{m.channel}</span>
        <span className="wf-chip sm ghost">{KIND_LABEL[m.kind] ?? m.kind}</span>
        <span className="wf-msg-ts mono">{when(m.ts)}</span>
      </div>
      {first && m.subject && <div className="wf-msg-subject">{m.subject}</div>}
      <div className="wf-msg-body">{m.body}</div>
      <div className="wf-msg-foot">
        <MessageStatus m={m} copied={copied} onCopy={copy} />
        {!out && onReply && (
          <button
            type="button"
            className="wf-msg-reply"
            onClick={() =>
              onReply({
                to: m.contact || m.company || "",
                subject: m.subject ? `re: ${m.subject}` : "",
                thread: m.thread_id ?? "",
                campaign: "",
                channel: m.channel || "email",
              })
            }
          >
            reply
          </button>
        )}
      </div>
    </div>
  );
}

function MessageStatus({
  m,
  copied,
  onCopy,
}: {
  m: OutreachMessage;
  copied: boolean;
  onCopy: () => void;
}) {
  if (m.status === "approved_manual") {
    return (
      <span className="wf-msg-status">
        approved, send by hand
        <button type="button" className="wf-msg-copy" onClick={onCopy}>
          {copied ? "copied" : "copy body"}
        </button>
      </span>
    );
  }
  if (m.status === "held") {
    return <span className="wf-msg-status muted">held · release tomorrow</span>;
  }
  if (m.status === "received") {
    return <span className="wf-msg-status muted">received</span>;
  }
  return <span className="wf-msg-status muted">sent</span>;
}
