"use client";

import { useState } from "react";
import type { Insights } from "@/lib/workforce/insights";
import { agentColor } from "@/lib/workforce/roster";

const AMBER = "oklch(0.8 0.14 70)";
const RUN = "oklch(0.78 0.12 220)";
const OK = "oklch(0.8 0.16 150)";
const RED = "oklch(0.72 0.17 25)";

// Insights (redesign): a 24h/7d range toggle over KPI cards, a stacked
// events/runs/workers throughput chart, the approvals-turnaround ring, grouped
// rejection reasons, and the per-agent output table. Plain SVG/CSS, real data.
export function InsightsView({ data }: { data: Insights }) {
  const [range, setRange] = useState<"24h" | "7d">("24h");
  const r = data.ranges[range];
  const t = data.turnaround;
  const noteTone = (tone: string) =>
    tone === "warn"
      ? "var(--warn)"
      : tone === "ok"
        ? "var(--ok)"
        : "var(--ink-faint)";

  return (
    <div className="wf-in">
      <header className="wf-in-head">
        <div>
          <div className="wf-in-eyebrow">insights</div>
          <h1 className="wf-in-h1">how it is going</h1>
          <p className="wf-in-lede">
            throughput, turnaround and per-agent output. read-only, refreshed
            live.
          </p>
        </div>
        <div className="wf-in-range">
          {(["24h", "7d"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`wf-in-range-btn${range === k ? " is-on" : ""}`}
              onClick={() => setRange(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </header>

      <div className="wf-in-kpis">
        {r.kpis.map((k) => (
          <div className="wf-in-kpi" key={k.label}>
            <div className="wf-in-kpi-label">{k.label}</div>
            <div className="wf-in-kpi-value">{k.value}</div>
            <div className="wf-in-kpi-note" style={{ color: noteTone(k.tone) }}>
              {k.note}
            </div>
          </div>
        ))}
      </div>

      <section className="wf-in-panel">
        <div className="wf-in-panel-head">
          <div>
            <div className="wf-in-panel-title">throughput</div>
            <div className="wf-in-panel-sub">{r.chartSub}</div>
          </div>
          <div className="wf-in-legend">
            <span>
              <span className="wf-in-sw" style={{ background: AMBER }} />
              events
            </span>
            <span>
              <span className="wf-in-sw" style={{ background: RUN }} />
              runs
            </span>
            <span>
              <span className="wf-in-sw wf-in-sw-ring" />
              workers
            </span>
          </div>
        </div>
        {r.hasData ? (
          <>
            <div className="wf-in-bars">
              {r.bars.map((b, i) => (
                <div
                  className="wf-in-bar"
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional buckets
                  key={i}
                  title={b.tip}
                >
                  <div
                    className="wf-in-seg wf-in-seg-w"
                    style={{ height: `${b.wh}%` }}
                  />
                  <div
                    className="wf-in-seg"
                    style={{ height: `${b.rh}%`, background: RUN }}
                  />
                  <div
                    className="wf-in-seg"
                    style={{ height: `${b.eh}%`, background: AMBER }}
                  />
                </div>
              ))}
            </div>
            <div className="wf-in-xaxis">
              {r.bars.map((b, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional buckets
                <div className="wf-in-tick" key={i}>
                  {b.label}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="wf-in-empty">
            not enough data yet. the chart fills in as the workforce runs.
          </div>
        )}
      </section>

      <div className="wf-in-two">
        <section className="wf-in-panel wf-in-turn">
          <div
            className="wf-in-ring"
            style={{
              background:
                t.ratePct == null
                  ? "rgba(255,255,255,0.06)"
                  : `conic-gradient(${OK} 0 ${t.ratePct}%, ${RED} 0 100%)`,
            }}
          >
            <div className="wf-in-ring-hole">
              <div className="wf-in-ring-n">
                {t.ratePct == null ? "—" : `${t.ratePct}%`}
              </div>
              <div className="wf-in-ring-l">approved</div>
            </div>
          </div>
          <div className="wf-in-turn-body">
            <div className="wf-in-panel-title" style={{ marginBottom: 12 }}>
              approvals turnaround
            </div>
            <dl className="wf-in-kv">
              <dt>avg decision</dt>
              <dd>{t.avg}</dd>
              <dt>median</dt>
              <dd>{t.median}</dd>
              <dt>pending now</dt>
              <dd>{t.pending}</dd>
              <dt>oldest pending</dt>
              <dd>{t.oldest}</dd>
              <dt>approved · rejected</dt>
              <dd>
                <span style={{ color: OK }}>{t.approved}</span> ·{" "}
                <span style={{ color: RED }}>{t.rejected}</span>
              </dd>
            </dl>
          </div>
        </section>

        <section className="wf-in-panel">
          <div className="wf-in-panel-title" style={{ marginBottom: 12 }}>
            what the rejections say
          </div>
          {data.rejections.length ? (
            <div className="wf-in-rej">
              {data.rejections.map((x) => (
                <div className="wf-in-rej-row" key={x.text}>
                  <span className="wf-in-rej-n">{x.n}</span>
                  <span>{x.text}</span>
                </div>
              ))}
              <a
                className="wf-in-rej-link"
                href="/dashboard/agents/chief#wf-backlog"
              >
                chief turns these into backlog items →
              </a>
            </div>
          ) : (
            <p className="wf-in-empty-inline">
              nothing rejected yet. reasons you give on a reject show up here.
            </p>
          )}
        </section>
      </div>

      <section className="wf-in-panel wf-in-table-wrap">
        <div className="wf-in-table-head">
          <span className="wf-in-panel-title">per-agent output</span>
          <span className="wf-in-panel-sub">
            runs over 7d · events and workers over 24h
          </span>
        </div>
        <div className="wf-in-table">
          <div className="wf-in-tr wf-in-th">
            <span>agent</span>
            <span>ok</span>
            <span>err</span>
            <span>success</span>
            <span>events</span>
            <span>workers</span>
            <span>trend</span>
            <span>pending</span>
            <span>last active</span>
          </div>
          {data.perAgent.map((p) => {
            const c = agentColor(p.hue);
            const mx = Math.max(1, ...p.trend);
            return (
              <div
                className="wf-in-tr"
                key={p.id}
                style={{ opacity: p.soon ? 0.55 : 1 }}
              >
                <span className="wf-in-agent">
                  <span
                    className="wf-in-agent-tile"
                    style={{ background: agentColor(p.hue, 0.16) }}
                  >
                    {p.emoji}
                  </span>
                  <span className="wf-in-agent-name">{p.name}</span>
                </span>
                <span className="wf-in-mono">{p.ok}</span>
                <span
                  className="wf-in-mono"
                  style={{ color: p.errBad ? RED : "var(--ink-faint)" }}
                >
                  {p.err}
                </span>
                <span className="wf-in-mono">{p.rate}</span>
                <span className="wf-in-mono">{p.events}</span>
                <span className="wf-in-mono">{p.workers}</span>
                <span className="wf-in-spark">
                  {p.trend.map((v, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional trend
                      key={i}
                      className="wf-in-spark-bar"
                      style={{ height: `${(v / mx) * 100}%`, background: c }}
                    />
                  ))}
                </span>
                <span className="wf-in-mono">{p.pending}</span>
                <span className="wf-in-last">{p.last}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
