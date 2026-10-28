"use client";

import { type ReactNode, useState } from "react";
import type { BlockPart, Part } from "@/lib/workforce/blocks";
import { SystemChip } from "./BlockCard";
import { ChatBody } from "./ChatBody";
import type { AgentKey } from "./Persona";

// Renders an agent message that contains blocks. Per the spec's transcript
// hygiene, the bubble shows only the spoken part (the text/`say` — everything
// above the first `---`/block header); the blocks themselves never sit in the
// bubble, they live under a single "show blocks" disclosure in monospace. Used
// by the drawer and mobile; owner messages never reach here.

export function MessageBody({
  parts,
  thread: _thread,
}: {
  parts: Part[];
  thread: AgentKey;
}) {
  const [showBlocks, setShowBlocks] = useState(false);
  // the spoken part: text + system lines, in source order. Blocks are pulled out.
  const spoken = parts.filter((p) => p.kind === "text" || p.kind === "system");
  const blocks = parts.filter((p) => p.kind === "block") as BlockPart[];

  const segs: ReactNode[] = spoken.map((p, i) =>
    p.kind === "system" ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static parsed list, order is stable
      <SystemChip key={i} text={p.text} />
    ) : (
      <div
        // biome-ignore lint/suspicious/noArrayIndexKey: static parsed list, order is stable
        key={i}
        style={{
          padding: "10px 14px",
          borderRadius: "16px 16px 16px 4px",
          background: "var(--surf2)",
          color: "var(--ink)",
          fontSize: 13.5,
          lineHeight: 1.45,
        }}
      >
        <ChatBody text={p.text} mine={false} />
      </div>
    ),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      {segs}
      {blocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => setShowBlocks((v) => !v)}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 9px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--soft)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                transform: showBlocks ? "rotate(90deg)" : "none",
                transition: "transform .15s ease",
              }}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            {showBlocks ? "hide blocks" : `show blocks · ${blocks.length}`}
          </button>
          {showBlocks && (
            <pre
              className="os-mono"
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 12,
                background: "var(--code, #0a0a0a)",
                color: "#d7d5cd",
                border: "1px solid var(--line)",
                fontSize: 11.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 320,
                overflow: "auto",
              }}
            >
              {blocks.map((b) => b.raw).join("\n\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
