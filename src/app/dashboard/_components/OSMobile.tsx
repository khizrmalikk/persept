"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  approveFromForm,
  rejectFromForm,
  sendMessageFromForm,
} from "@/lib/workforce/actions";
import type { OSAgent } from "../_data/agents";
import type { OSApproval } from "../_data/approvals";
import type { OSThreadMsg } from "../_data/threads";
import { waHref } from "../_data/whatsapp";
import { AGENT_HUE_VAR } from "../_data/windows";
import { AttachButton, AttachChips } from "./ChatAttach";
import { ChatBody } from "./ChatBody";
import { MessageBody } from "./MessageBody";
import { Persona, type PersonaStatus } from "./Persona";
import { useChatAttachments } from "./useChatAttachments";

// Workforce Mobile (<1280px): chat with Percy + the approval queue. Shares the
// desktop's server data (threads/approvals) and its TickPoller (which keeps
// polling even while the desktop is display:none), so replies and new approvals
// arrive live. Sends/decisions go through the same server actions.

export function OSMobile({
  agents,
  approvals,
  threads,
}: {
  agents: OSAgent[];
  approvals: OSApproval[];
  threads: Record<string, OSThreadMsg[]>;
}) {
  const [tab, setTab] = useState<"chat" | "approvals">("chat");
  const live = approvals.filter((a) => !a.held);
  const percyStatus = agents.find((a) => a.id === "percy")?.status ?? "";

  return (
    <div className="os-mobile">
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
          background: "var(--surf)",
        }}
      >
        <svg
          width="16"
          height="17"
          viewBox="10.31 8 79.38 84"
          aria-hidden="true"
        >
          <path
            d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
            fill="var(--accent)"
          />
          <path
            fillRule="evenodd"
            d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
            fill="var(--accent)"
          />
        </svg>
        <span className="os-display" style={{ fontWeight: 800, fontSize: 16 }}>
          persept
        </span>
        <span
          style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--soft)" }}
        >
          {tab === "chat" ? "percy" : `${live.length} waiting`}
        </span>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {tab === "chat" ? (
          <MobileChat threads={threads} status={percyStatus} />
        ) : (
          <MobileApprovals approvals={live} />
        )}
      </div>

      {/* bottom nav */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid var(--line)",
          background: "var(--surf)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {(["chat", "approvals"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: tab === t ? "var(--ink)" : "var(--mute)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {t === "chat" ? "chat with percy" : "approvals"}
            {t === "approvals" && live.length > 0 && (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {live.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileChat({
  threads,
  status,
}: {
  threads: Record<string, OSThreadMsg[]>;
  status: PersonaStatus;
}) {
  const [pending, setPending] = useState<OSThreadMsg[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const nid = useRef(0);
  const att = useChatAttachments();

  const serverMsgs = threads.percy ?? [];
  const mineTexts = new Set(
    serverMsgs.filter((m) => m.mine).map((m) => m.text.trim()),
  );
  const list = [
    ...serverMsgs,
    ...pending.filter((o) => !mineTexts.has(o.text.trim())),
  ];

  // drop reconciled optimistic bubbles on refresh
  // biome-ignore lint/correctness/useExhaustiveDependencies: reconcile on new server messages
  useEffect(() => {
    setPending((prev) => prev.filter((o) => !mineTexts.has(o.text.trim())));
  }, [serverMsgs.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: stick to newest
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  const send = () => {
    const body = att.compose(draft);
    if (!body.trim()) return;
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setPending((p) => [
      ...p,
      { id: `o${nid.current++}`, mine: true, text: body, ts },
    ]);
    setDraft("");
    att.clear();
    if (composerRef.current) composerRef.current.style.height = "auto";
    const fd = new FormData();
    fd.append("agent", "percy");
    fd.append("text", body);
    void sendMessageFromForm(fd);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
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
              maxWidth: 260,
            }}
          >
            tell percy what you need. it turns it into tasks and anything
            outbound comes to approvals.
          </div>
        )}
        {list.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              justifyContent: m.mine ? "flex-end" : "flex-start",
            }}
          >
            {!m.mine && <Persona agent="percy" size={26} status={status} />}
            <div
              style={{
                maxWidth: "78%",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                alignItems: m.mine ? "flex-end" : "flex-start",
                minWidth: 0,
              }}
            >
              {!m.mine && m.parts?.some((p) => p.kind !== "text") ? (
                <MessageBody parts={m.parts} thread="percy" />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: m.mine
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: m.mine ? "var(--ink)" : "var(--surf2)",
                    color: m.mine ? "var(--bg)" : "var(--ink)",
                    fontSize: 14.5,
                    lineHeight: 1.45,
                  }}
                >
                  <ChatBody text={m.text} mine={m.mine} />
                </div>
              )}
              {m.ts && (
                <span
                  className="os-mono"
                  style={{ fontSize: 10, color: "var(--mute)" }}
                >
                  {m.ts}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
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
          <AttachButton agentId="percy" att={att} />
          <textarea
            ref={composerRef}
            value={draft}
            rows={1}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a line break
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="tell percy what you need…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              minWidth: 0,
              resize: "none",
              maxHeight: 120,
              lineHeight: 1.45,
              padding: "6px 0",
            }}
          />
          <button
            type="button"
            onClick={send}
            aria-label="send"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--ink)",
              color: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              flex: "none",
            }}
          >
            <svg
              width="16"
              height="16"
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

function MobileApprovals({ approvals }: { approvals: OSApproval[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Set<number>>(new Set());
  const shown = approvals.filter((a) => !done.has(a.id));

  const decide = (a: OSApproval, fn: typeof approveFromForm) => {
    setDone((d) => new Set(d).add(a.id));
    const fd = new FormData();
    fd.append("id", String(a.id));
    fd.append("agent", a.agent);
    void fn(fd).then(() => router.refresh());
  };

  if (shown.length === 0)
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "var(--mute)",
          fontSize: 14,
          textAlign: "center",
          padding: 24,
        }}
      >
        nothing waiting for you. agents keep working.
      </div>
    );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {shown.map((a) => {
        // whatsapp: open the chat app straight to the found number with the
        // draft prefilled — the point of approving on your phone.
        const wa = a.kind === "whatsapp" ? waHref(a.to, a.body) : null;
        return (
          <div
            key={a.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Persona agent={a.agent} size={30} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  className="os-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: `var(${AGENT_HUE_VAR[a.agent]})`,
                  }}
                >
                  {a.kind} · {a.age}
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}
                >
                  {a.title}
                </span>
              </div>
            </div>
            {a.body && (
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "var(--soft)",
                  whiteSpace: "pre-wrap",
                  maxHeight: 160,
                  overflow: "auto",
                }}
              >
                {a.body.slice(0, 400)}
              </div>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 11,
                  borderRadius: 10,
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                open in whatsapp
              </a>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => decide(a, approveFromForm)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                }}
              >
                approve
              </button>
              <button
                type="button"
                onClick={() => decide(a, rejectFromForm)}
                style={{
                  padding: "11px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: "transparent",
                  color: "var(--bad)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
