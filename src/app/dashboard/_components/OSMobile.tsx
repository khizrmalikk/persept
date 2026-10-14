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
import { AGENT_HUE_VAR } from "../_data/windows";
import { AttachButton, AttachChips } from "./ChatAttach";
import { ChatBody } from "./ChatBody";
import { Persona, type PersonaStatus } from "./Persona";
import { useChatAttachments } from "./useChatAttachments";

// Workforce Mobile (<1280px): chat with Chief + the approval queue. Shares the
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
  const chiefStatus = agents.find((a) => a.id === "chief")?.status ?? "";

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
          width="18"
          height="17"
          viewBox="0 0 136.6 125.56"
          aria-hidden="true"
        >
          <path
            d="M27.37,119.56L96.19,1.97c.71-1.22,2.02-1.97,3.44-1.97h32.97c3.08,0,5,3.35,3.44,6l-69.05,117.59c-.72,1.22-2.02,1.97-3.44,1.97H30.81c-3.08,0-4.99-3.34-3.44-6Z"
            fill="oklch(0.8 0.14 70)"
          />
          <path
            d="M95.24,0H3.94C.67,0-1.17,3.76.83,6.34l19.74,25.49c.75.96,1.89,1.53,3.11,1.53h52.04"
            style={{ fill: "var(--ink)" }}
          />
        </svg>
        <span className="os-display" style={{ fontWeight: 800, fontSize: 16 }}>
          persept
        </span>
        <span
          style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--soft)" }}
        >
          {tab === "chat" ? "chief" : `${live.length} waiting`}
        </span>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {tab === "chat" ? (
          <MobileChat threads={threads} status={chiefStatus} />
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
            {t === "chat" ? "chat with chief" : "approvals"}
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
  const nid = useRef(0);
  const att = useChatAttachments();

  const serverMsgs = threads.chief ?? [];
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
    const fd = new FormData();
    fd.append("agent", "chief");
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
            tell chief what you need. it turns it into tasks and anything
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
            {!m.mine && <Persona agent="chief" size={26} status={status} />}
            <div
              style={{
                maxWidth: "78%",
                display: "flex",
                flexDirection: "column",
                gap: 3,
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
                  fontSize: 14.5,
                  lineHeight: 1.45,
                }}
              >
                <ChatBody text={m.text} mine={m.mine} />
              </div>
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
          <AttachButton agentId="chief" att={att} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="tell chief what you need…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              minWidth: 0,
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
      {shown.map((a) => (
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
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
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
      ))}
    </div>
  );
}
