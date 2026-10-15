"use client";

import { type CSSProperties, useState } from "react";
import {
  type BlockPart,
  type BlockStatus,
  blockMeta,
} from "@/lib/workforce/blocks";
import { AGENT_HUE_VAR } from "../_data/windows";
import { type OSSub, useOS, type WindowKey } from "./os-store";
import type { AgentKey } from "./Persona";

// A parsed block, rendered in the style of the approvals card: a mono uppercase
// label in the target agent's colour, a title, a right-aligned status pill, and an
// expandable body (fields + the raw text behind "show raw"). Deep links jump to
// the window that owns the thing.

// prose-shaped fields render as paragraphs; everything else as a key/value row.
const PROSE = new Set([
  "context",
  "spec",
  "draft",
  "detail",
  "body",
  "summary",
  "why",
  "next",
  "evidence",
  "angle",
  "idea",
  "ask",
  "reason",
  "question",
  "text",
]);

function toneColour(tone: BlockStatus["tone"]): string {
  switch (tone) {
    case "working":
      return "var(--ok)";
    case "waiting":
      return "var(--ambink)";
    case "failed":
      return "var(--bad)";
    default:
      return "var(--mute)";
  }
}

function deepLink(p: BlockPart): { win: WindowKey; sub: OSSub } | null {
  const id = p.status?.approvalId;
  switch (p.type) {
    case "COPY REQUEST":
      return id ? { win: "approvals", sub: { id: String(id) } } : null;
    case "APPROVAL REQUEST":
      return { win: "approvals", sub: id ? { id: String(id) } : {} };
    case "FIX REQUEST":
    case "RUN":
      return { win: "dev", sub: { tab: "changes" } };
    case "LEAD":
      return { win: "frontdesk", sub: { tab: "leads" } };
    case "BACKLOG":
    case "TASK":
      return { win: "command", sub: { tab: "backlog" } };
    case "CAMPAIGN":
      return { win: "marketing", sub: { tab: "campaigns" } };
    default:
      return null;
  }
}

function StatusPill({ status }: { status: BlockStatus }) {
  const c = toneColour(status.tone);
  return (
    <span
      className="os-mono"
      style={{
        fontSize: 9.5,
        letterSpacing: "0.04em",
        textTransform: "lowercase",
        color: c,
        border: `1px solid ${c}`,
        borderRadius: 999,
        padding: "2px 7px",
        whiteSpace: "nowrap",
        flex: "none",
        opacity: status.tone === "muted" ? 0.75 : 1,
      }}
    >
      {status.label}
    </span>
  );
}

const linkBtn: CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: "1px solid var(--line)",
  borderRadius: 8,
  color: "var(--soft)",
  fontSize: 11,
  padding: "4px 9px",
  cursor: "pointer",
};

export function BlockCard({ b, thread }: { b: BlockPart; thread: AgentKey }) {
  const os = useOS();
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const { target, title } = blockMeta(b);
  const agent = (target ?? thread) as AgentKey;
  const hue =
    target === "you" ? "var(--ambink)" : `var(${AGENT_HUE_VAR[agent]})`;
  const who = agent === "you" ? "YOU" : agent.toUpperCase();
  const label = `${b.type}${b.op ? ` ${b.op}` : ""} → ${who}`;
  const link = deepLink(b);

  const entries = Object.entries(b.fields).filter(
    ([k, v]) => v && k !== "status",
  );
  const kv = entries.filter(([k]) => !PROSE.has(k));
  const prose = entries.filter(([k]) => PROSE.has(k));

  return (
    <div
      style={{
        borderRadius: 12,
        background: "var(--surf2)",
        border: "1px solid var(--line)",
        borderLeft: `2px solid ${hue}`,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: "9px 11px",
          cursor: "pointer",
          color: "var(--ink)",
        }}
      >
        <span
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            width: "100%",
          }}
        >
          <span
            className="os-mono"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: hue,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </span>
          {b.status && (
            <span style={{ marginLeft: "auto" }}>
              <StatusPill status={b.status} />
            </span>
          )}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>
          {title}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 11px 10px",
          }}
        >
          {prose.map(([k, v]) => (
            <div
              key={k}
              style={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <span
                className="os-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                {k}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: "var(--soft)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {v}
              </span>
            </div>
          ))}
          {kv.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                columnGap: 10,
                rowGap: 3,
              }}
            >
              {kv.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--mute)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {k}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}
          {b.status?.detail && (
            <span style={{ fontSize: 12, color: "var(--bad)" }}>
              {b.status.detail}
            </span>
          )}
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {link && (
              <button
                type="button"
                style={{ ...linkBtn, color: "var(--ink)" }}
                onClick={() => os.open(link.win, link.sub)}
              >
                open →
              </button>
            )}
            <button
              type="button"
              style={linkBtn}
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "hide raw" : "show raw"}
            </button>
          </div>
          {showRaw && (
            <pre
              className="os-mono"
              style={{
                margin: 0,
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--mute)",
                background: "var(--surf)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 10px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {b.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// Consecutive blocks of the same type collapse: the first shows, the rest hide
// behind "show all N".
export function BlockStack({
  blocks,
  thread,
}: {
  blocks: BlockPart[];
  thread: AgentKey;
}) {
  const [open, setOpen] = useState(false);
  if (blocks.length <= 1) {
    return blocks[0] ? <BlockCard b={blocks[0]} thread={thread} /> : null;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <BlockCard b={blocks[0]} thread={thread} />
      {open ? (
        blocks
          .slice(1)
          .map((b, i) => (
            <BlockCard key={`${b.type}-${i}`} b={b} thread={thread} />
          ))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ ...linkBtn, alignSelf: "flex-start" }}
        >
          show all {blocks.length} {blocks[0].type.toLowerCase()}s
        </button>
      )}
    </div>
  );
}

// A bridge summary line (SENT, PUBLISHED, N copy requests …) — a muted chip, not a
// bubble.
export function SystemChip({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11.5,
        color: "var(--mute)",
        padding: "2px 2px",
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: 999,
          background: "var(--mute)",
          flex: "none",
        }}
      />
      <span style={{ whiteSpace: "pre-wrap" }}>{text.toLowerCase()}</span>
    </div>
  );
}
