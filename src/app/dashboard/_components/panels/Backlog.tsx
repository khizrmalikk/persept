"use client";

import { useState, useTransition } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";

// chief's backlog (memory/backlog.md) as a read-only checklist. Each line gets a
// "hand to <agent>" control: a <select> of enabled agents + submit. Sends exactly:
//   "hand this to <agent>: <line>"
// The backlog lines are parsed server-side and passed in; enabled agents likewise.
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

  if (!lines.length) {
    return <p className="empty">chief's backlog is empty</p>;
  }
  const first = agents[0]?.id ?? "";

  return (
    <ul className="wf-backlog">
      {lines.map((line, i) => {
        const target = pick[i] ?? first;
        return (
          <li key={`${i}-${line.slice(0, 20)}`} className="wf-backlog-row">
            <span className="wf-backlog-mark" aria-hidden="true">
              ☐
            </span>
            <span className="wf-backlog-text">{line}</span>
            {done[i] ? (
              <span className="wf-backlog-done muted">handed to {done[i]}</span>
            ) : (
              <span className="wf-backlog-hand">
                <select
                  value={target}
                  aria-label={`hand line ${i + 1} to an agent`}
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
                  className="act secondary"
                  disabled={pending || !target}
                  onClick={() =>
                    start(() => {
                      void sendAgentCommand(
                        "chief",
                        `hand this to ${target}: ${line}`,
                      );
                      setDone((d) => ({ ...d, [i]: target }));
                    })
                  }
                >
                  hand to
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
