"use client";

import type { ReactNode } from "react";
import type { BlockPart, Part } from "@/lib/workforce/blocks";
import { BlockStack, SystemChip } from "./BlockCard";
import { ChatBody } from "./ChatBody";
import type { AgentKey } from "./Persona";

// Renders an agent message that contains blocks: cards, system chips and plain
// text, in source order. Consecutive blocks of the same type collapse into one
// stack. Text segments keep the normal (received) bubble so prose still reads like
// a message. Used by the drawer and mobile; owner messages never reach here.

export function MessageBody({
  parts,
  thread,
}: {
  parts: Part[];
  thread: AgentKey;
}) {
  const segs: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (p.kind === "block") {
      const group: BlockPart[] = [p];
      let j = i + 1;
      while (
        j < parts.length &&
        parts[j].kind === "block" &&
        (parts[j] as BlockPart).type === p.type
      ) {
        group.push(parts[j] as BlockPart);
        j++;
      }
      segs.push(<BlockStack key={key++} blocks={group} thread={thread} />);
      i = j;
    } else if (p.kind === "system") {
      segs.push(<SystemChip key={key++} text={p.text} />);
      i++;
    } else {
      segs.push(
        <div
          key={key++}
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
        </div>,
      );
      i++;
    }
  }
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
    </div>
  );
}
