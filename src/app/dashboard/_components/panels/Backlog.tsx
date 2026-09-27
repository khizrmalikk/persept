"use client";

import { useMemo, useState, useTransition } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";

type Item = { text: string; done: boolean };

// Clean the raw backlog markdown into readable checklist items: drop headings
// ("# Backlog") and blank lines, strip the list bullet / "[ ]" / "☐" tokens, and
// detect a checked item. The raw markdown made the panel unreadable.
function parseItems(lines: string[]): Item[] {
  const out: Item[] = [];
  for (const raw of lines) {
    let t = raw.trim();
    if (!t) continue;
    if (/^#{1,6}\s/.test(t)) continue; // heading like "# Backlog"
    let done = false;
    const box = t.match(/^[-*+]?\s*\[([ xX])\]\s*/); // "- [ ] " / "[x] "
    if (box) {
      done = box[1].toLowerCase() === "x";
      t = t.slice(box[0].length);
    } else {
      t = t.replace(/^[-*+•]\s+/, "").replace(/^[☐☑✓]\s*/, "");
    }
    t = t.trim();
    if (t) out.push({ text: t, done });
  }
  return out;
}

// chief's backlog (memory/backlog.md) as a readable checklist. Each open item has
// a compact "hand to <agent>" control (revealed on hover/focus) that sends exactly:
//   "hand this to <agent>: <line>"
export function Backlog({
  lines,
  agents,
}: {
  lines: string[];
  agents: { id: string; emoji: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<Record<number, string>>({});
  const [pick, setPick] = useState<Record<number, string>>({});
  const items = useMemo(() => parseItems(lines), [lines]);

  if (!items.length) {
    return <p className="empty">chief's backlog is empty</p>;
  }
  const first = agents[0]?.id ?? "";

  return (
    <ul className="wf-backlog">
      {items.map((it, i) => {
        const target = pick[i] ?? first;
        return (
          <li
            key={`${i}-${it.text.slice(0, 24)}`}
            className={`wf-backlog-row${it.done ? " is-done" : ""}`}
          >
            <span className="wf-backlog-mark" aria-hidden="true">
              {it.done ? "☑" : "☐"}
            </span>
            <span className="wf-backlog-text">{it.text}</span>
            {done[i] ? (
              <span className="wf-backlog-done">→ {done[i]}</span>
            ) : (
              agents.length > 0 && (
                <span className="wf-backlog-hand">
                  <select
                    value={target}
                    aria-label={`hand "${it.text.slice(0, 40)}" to an agent`}
                    onChange={(e) =>
                      setPick((p) => ({ ...p, [i]: e.target.value }))
                    }
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.emoji} {a.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="wf-backlog-hand-btn"
                    disabled={pending || !target}
                    title={`hand this item to ${target}`}
                    onClick={() =>
                      start(() => {
                        void sendAgentCommand(
                          "chief",
                          `hand this to ${target}: ${it.text}`,
                        );
                        setDone((d) => ({ ...d, [i]: target }));
                      })
                    }
                  >
                    hand
                  </button>
                </span>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
