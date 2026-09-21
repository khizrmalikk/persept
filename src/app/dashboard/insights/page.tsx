import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fmtMins, fmtPct } from "@/lib/workforce/format";
import {
  getAgentProductivity,
  getApprovalStats,
  getHealth,
  getThroughput,
} from "@/lib/workforce/metrics";
import { type Agent, ago } from "@/lib/workforce/types";
import { Donut, Sparkline, ThroughputChart } from "../_components/charts";

type Range = "24h" | "7d";

export default async function Insights({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: Range = rawRange === "7d" ? "7d" : "24h";

  const db = supabaseAdmin();
  const [throughput, approvals, productivity, health, { data: agentRows }] =
    await Promise.all([
      getThroughput(range),
      getApprovalStats(),
      getAgentProductivity(),
      getHealth(),
      db.from("agents").select("id, name, emoji"),
    ]);

  // join agentId → name/emoji for the productivity table
  const meta = new Map<string, { name: string; emoji: string | null }>();
  for (const a of (agentRows as
    | Pick<Agent, "id" | "name" | "emoji">[]
    | null) ?? [])
    meta.set(a.id, { name: a.name ?? a.id, emoji: a.emoji });

  const prod = [...productivity].sort((a, b) => b.events24h - a.events24h);

  return (
    <>
      {/* page header ------------------------------------------------------- */}
      <header className="wf-page-head">
        <div className="wf-page-head-l">
          <p className="kicker">insights</p>
          <h1>
            how it is going
            <span className="cursor" />
          </h1>
          <p className="lede">
            throughput, turnaround and per-agent output. read-only, refreshed
            live.
          </p>
        </div>
        <div className="wf-page-head-r">
          {/* biome-ignore lint/a11y/useSemanticElements: labelled range-toggle cluster is a legit ARIA group */}
          <div className="segmented" role="group" aria-label="time range">
            <Link
              className={range === "24h" ? "active" : ""}
              href="/dashboard/insights?range=24h"
            >
              24h
            </Link>
            <Link
              className={range === "7d" ? "active" : ""}
              href="/dashboard/insights?range=7d"
            >
              7d
            </Link>
          </div>
        </div>
      </header>

      {/* stat tiles -------------------------------------------------------- */}
      <div className="insight-tiles">
        <div className="stat hud-bracket">
          <span className="m-value">{throughput.totalEvents}</span>
          <span className="m-label">events · {range}</span>
        </div>
        <div className="stat hud-bracket">
          <span className="m-value">{throughput.totalRuns}</span>
          <span className="m-label">runs · {range}</span>
        </div>
        <div className="stat hud-bracket">
          <span className="m-value">
            {health.agentsOnline}
            <small>/ {health.agentsTotal}</small>
          </span>
          <span className="m-label">agents online</span>
        </div>
        <div className="stat hud-bracket">
          <span
            className={`m-value ${
              health.errorRate && health.errorRate > 0 ? "warn" : ""
            }`}
          >
            {health.errorRate === null ? "—" : fmtPct(health.errorRate)}
          </span>
          <span className="m-label">error rate · 24h</span>
        </div>
      </div>

      {/* throughput — full width ------------------------------------------- */}
      <div className="panel pad-lg hud-bracket" style={{ marginBottom: 22 }}>
        <div className="panel-head">
          <div>
            <div className="p-title">throughput</div>
            <div className="p-sub">
              events and runs over the{" "}
              {range === "24h" ? "last 24h" : "last 7d"}
            </div>
          </div>
          <div className="hud-head-r">
            busiest {throughput.busiestLabel ?? "—"}
          </div>
        </div>
        <div className="chart-totals">
          <div className="ct">
            <div className="v">{throughput.totalEvents}</div>
            <div className="l">events</div>
          </div>
          <div className="ct">
            <div className="v">{throughput.totalRuns}</div>
            <div className="l">runs</div>
          </div>
          <div className="ct">
            <div className="v">{throughput.busiestLabel ?? "—"}</div>
            <div className="l">busiest</div>
          </div>
        </div>
        <ThroughputChart buckets={throughput.buckets} />
        <div className="chart-legend">
          <span className="lg">
            <span className="swatch" style={{ background: "var(--accent)" }} />
            events
          </span>
          <span className="lg">
            <span
              className="swatch"
              style={{ background: "rgba(242,237,228,0.22)" }}
            />
            runs
          </span>
        </div>
      </div>

      {/* approvals turnaround + health ------------------------------------- */}
      <div className="dash-2" style={{ marginBottom: 22 }}>
        <div className="panel pad-lg hud-bracket">
          <div className="panel-head">
            <div className="p-title">approvals turnaround</div>
            <div className="hud-head-r">how fast you clear</div>
          </div>
          <div className="donut-wrap">
            <Donut value={approvals.approvalRate} label="approved" />
            <div className="kv">
              <span className="k">avg decision</span>
              <span className="v">{fmtMins(approvals.avgDecisionMins)}</span>
              <span className="k">median</span>
              <span className="v">{fmtMins(approvals.medianDecisionMins)}</span>
              <span className="k">pending</span>
              <span className="v">
                {approvals.pending}
                {approvals.pending > 0 && (
                  <>
                    {" "}
                    <Link
                      className="link-underline"
                      href="/dashboard/approvals"
                    >
                      review
                    </Link>
                  </>
                )}
              </span>
              <span className="k">oldest pending</span>
              <span className="v">
                {approvals.oldestPendingTs
                  ? ago(approvals.oldestPendingTs)
                  : "none"}
              </span>
              <span className="k">approved / rejected</span>
              <span className="v">
                <span className="ok">{approvals.approved}</span> ·{" "}
                <span className="err">{approvals.rejected}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="panel pad-lg hud-bracket">
          <div className="panel-head">
            <div className="p-title">system health</div>
            <div className="hud-head-r">last 24h</div>
          </div>
          <div className="kv">
            <span className="k">bridge</span>
            <span className="v">
              <span
                className={`heartbeat ${health.bridgeStale ? "stale" : "live"}`}
              >
                {health.bridgeStale ? "stale" : "live"}
              </span>
              {health.bridgeSeenAt && (
                <span className="muted">
                  {" "}
                  · seen {ago(health.bridgeSeenAt)}
                </span>
              )}
            </span>
            <span className="k">agents online</span>
            <span className="v">
              {health.agentsOnline} / {health.agentsTotal}
            </span>
            <span className="k">error rate</span>
            <span className="v">
              {health.errorRate === null ? "—" : fmtPct(health.errorRate)}
            </span>
          </div>
          {health.recentErrors.length > 0 ? (
            <ul className="err-list">
              {health.recentErrors.map((e, i) => (
                <li key={`${e.ts}-${i}`}>
                  <span className="who">{e.agentId ?? "system"}</span>
                  <span className="sum">{e.summary ?? "error"}</span>
                  <span className="t">{ago(e.ts)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              no errors in the last 24h
            </p>
          )}
        </div>
      </div>

      {/* per-agent productivity — full-width centrepiece ------------------- */}
      <div className="panel pad-lg hud-bracket insight-prod">
        <div className="panel-head">
          <div className="p-title">per-agent output</div>
          <div className="hud-head-r">runs over 7d · events over 24h</div>
        </div>
        {prod.length === 0 ? (
          <div className="empty">no agents yet</div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>agent</th>
                  <th className="num">ok</th>
                  <th className="num">err</th>
                  <th>success rate</th>
                  <th className="num">events 24h</th>
                  <th>trend</th>
                  <th className="num">pending</th>
                  <th>last active</th>
                </tr>
              </thead>
              <tbody>
                {prod.map((p) => {
                  const m = meta.get(p.agentId);
                  const rate = p.successRate;
                  const rateClass =
                    rate === null
                      ? ""
                      : rate >= 0.8
                        ? ""
                        : rate >= 0.5
                          ? "warn"
                          : "err";
                  return (
                    <tr key={p.agentId}>
                      <td>
                        <span className="agent-cell">
                          <span className="e">{m?.emoji ?? "•"}</span>
                          <span>{m?.name ?? p.agentId}</span>
                        </span>
                      </td>
                      <td className="num ok">{p.runsOk}</td>
                      <td className="num err">{p.runsError || ""}</td>
                      <td>
                        {rate === null ? (
                          <span className="muted">—</span>
                        ) : (
                          <span className="ratebar">
                            <span className="track">
                              <span
                                className={`fill ${rateClass}`}
                                style={{ width: `${Math.round(rate * 100)}%` }}
                              />
                            </span>
                            <span className="pct">{fmtPct(rate)}</span>
                          </span>
                        )}
                      </td>
                      <td className="num">{p.events24h}</td>
                      <td>
                        <Sparkline values={p.activity24h} />
                      </td>
                      <td className="num">
                        {p.pending > 0 ? (
                          <span style={{ color: "var(--accent-ink)" }}>
                            {p.pending}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="muted">{ago(p.lastActiveAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
