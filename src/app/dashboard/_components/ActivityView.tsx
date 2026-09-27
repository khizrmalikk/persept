"use client";

import { useState } from "react";
import { agentColor } from "@/lib/workforce/roster";

export type FeedRow = {
  id: number;
  t: string;
  agentId: string;
  name: string;
  emoji: string;
  hue: number;
  kind: string;
  summary: string;
  child: boolean;
};
export type RunRow = {
  id: string;
  when: string;
  emoji: string;
  job: string;
  model: string;
  status: "ok" | "running" | "error" | "scheduled";
};

// kind chip colours (bg, fg)
const KIND: Record<string, [string, string]> = {
  message: ["rgba(255,255,255,0.07)", "#cfc9c0"],
  worker: ["oklch(0.78 0.12 220 / 0.16)", "oklch(0.82 0.1 220)"],
  cron: ["rgba(255,255,255,0.05)", "#8a847b"],
  lead: ["oklch(0.78 0.12 20 / 0.16)", "oklch(0.82 0.1 20)"],
  approval: ["oklch(0.8 0.14 70 / 0.16)", "oklch(0.8 0.14 70)"],
  post: ["oklch(0.78 0.12 110 / 0.16)", "oklch(0.84 0.1 110)"],
  error: ["oklch(0.72 0.17 25 / 0.18)", "oklch(0.72 0.17 25)"],
};
const RUN_STATUS: Record<string, [string, string]> = {
  ok: ["oklch(0.8 0.16 150 / 0.14)", "oklch(0.8 0.16 150)"],
  running: ["oklch(0.78 0.12 220 / 0.16)", "oklch(0.82 0.1 220)"],
  error: ["oklch(0.72 0.17 25 / 0.18)", "oklch(0.72 0.17 25)"],
  scheduled: ["rgba(255,255,255,0.06)", "#8a847b"],
};

// Activity (redesign): agent + kind filter chips, the live event feed (worker
// events indented under their parent), and the scheduled-runs panel.
export function ActivityView({
  agents,
  feed,
  runs,
}: {
  agents: { id: string; name: string; emoji: string }[];
  feed: FeedRow[];
  runs: RunRow[];
}) {
  const [fa, setFa] = useState("all");
  const [fk, setFk] = useState("all");

  const shown = feed.filter(
    (e) =>
      (fa === "all" || e.agentId === fa) && (fk === "all" || e.kind === fk),
  );

  const agentChips = [
    { id: "all", label: "all" },
    ...agents.map((a) => ({ id: a.id, label: `${a.emoji} ${a.name}` })),
  ];
  const kindChips = [
    "all",
    "message",
    "worker",
    "cron",
    "lead",
    "approval",
    "post",
    "error",
  ];

  return (
    <div className="wf-ac">
      <header className="wf-ac-head">
        <div className="wf-ac-eyebrow">activity</div>
        <h1 className="wf-ac-h1">what happened</h1>
        <p className="wf-ac-lede">
          the live event stream and scheduled runs across the workforce. workers
          show under the agent that spawned them.
        </p>
      </header>

      <div className="wf-ac-filters">
        <div className="wf-ac-filter-row">
          <span className="wf-ac-filter-label">agent</span>
          {agentChips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`wf-ac-chip${fa === c.id ? " is-on" : ""}`}
              onClick={() => setFa(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="wf-ac-filter-row">
          <span className="wf-ac-filter-label">kind</span>
          {kindChips.map((k) => (
            <button
              key={k}
              type="button"
              className={`wf-ac-chip${fk === k ? " is-on" : ""}`}
              onClick={() => setFk(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="wf-ac-grid">
        <section className="wf-ac-panel">
          <div className="wf-ac-panel-head">
            <span className="wf-ac-panel-title">event feed</span>
            <span className="wf-ac-panel-meta">
              {shown.length} events · live
            </span>
          </div>
          {shown.length === 0 ? (
            <div className="wf-ac-empty">no events match these filters.</div>
          ) : (
            shown.map((e) => {
              const [kbg, kfg] = KIND[e.kind] ?? KIND.message;
              return (
                <div
                  key={e.id}
                  className={`wf-ac-row${e.child ? " is-child" : ""}`}
                >
                  <span className="wf-ac-time">{e.t}</span>
                  {e.child && <span className="wf-ac-conn">└</span>}
                  <span
                    className="wf-ac-tile"
                    style={{ background: agentColor(e.hue, 0.16) }}
                  >
                    {e.emoji}
                  </span>
                  <span className="wf-ac-name">{e.name}</span>
                  <span
                    className="wf-ac-kind"
                    style={{ background: kbg, color: kfg }}
                  >
                    {e.kind}
                  </span>
                  <span className="wf-ac-sum">{e.summary}</span>
                </div>
              );
            })
          )}
        </section>

        <section className="wf-ac-panel">
          <div className="wf-ac-panel-head">
            <span className="wf-ac-panel-title">scheduled runs</span>
          </div>
          {runs.length === 0 ? (
            <div className="wf-ac-empty">no runs recorded yet.</div>
          ) : (
            runs.map((r) => {
              const [bg, fg] = RUN_STATUS[r.status];
              return (
                <div key={r.id} className="wf-ac-run">
                  <span className="wf-ac-run-when">{r.when}</span>
                  <span className="wf-ac-run-emoji">{r.emoji}</span>
                  <span className="wf-ac-run-main">
                    <span className="wf-ac-run-job">{r.job}</span>
                    {r.model && (
                      <span className="wf-ac-run-model">{r.model}</span>
                    )}
                  </span>
                  <span
                    className="wf-ac-run-status"
                    style={{ background: bg, color: fg }}
                  >
                    {r.status}
                  </span>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
