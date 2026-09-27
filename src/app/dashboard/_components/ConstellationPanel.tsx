"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ConstellationWorker } from "@/lib/workforce/types";
import type { NetworkAgent } from "./AgentNetwork2D";
import { OFFICE_DESKS, OfficeFloor } from "./OfficeFloor";
import { HealthStrip } from "./panels/HealthStrip";

// ── Office (main page) view ─────────────────────────────────────────────────
// The office is a full-width command deck in three columns under a thin stats
// strip. LEFT: the roster (every desk in the building), the sub-agents running
// right now, and the tasks in progress. CENTER: the illustrated office floor
// with a live avatar at each agent's desk. RIGHT: the approvals queue, whatever
// is urgent, and a pulse card. A thin latest-activity strip runs along the
// bottom. Lives in an owned client file so the server page stays a pure
// data-fetching component that hands this fully-serializable props.

export type OfficeAgent = {
  id: string;
  name: string;
  emoji: string | null;
  status: string; // raw agent status label (idle/working/…)
  statusLabel: string; // human label
  netStatus: NetworkAgent["status"]; // clamped status (working|waiting|idle|…)
  isHub: boolean;
  pending: number; // approvals waiting
  workers: number; // running background workers
  currentTask: string | null;
  lastActive: string; // preformatted "3m ago"
};

export type OfficeEvent = {
  id: number;
  agent: string;
  summary: string;
  time: string; // preformatted hh:mm:ss
  isError: boolean;
  kind: string; // raw event kind — "post" gets a chip + link
  url: string | null; // published post link, when the event carries one
};

// A compact pending-approval row for the office embed (top of the queue).
export type OfficeApproval = {
  id: number;
  agentId: string;
  agentName: string;
  agentEmoji: string | null;
  action: string;
  severity: string; // "high" | "medium" | "low" | "" (parsed from risk)
  ago: string; // preformatted "3m ago"
};

// A running background worker (OpenClaw sub-agent) for the left rail.
export type OfficeSubagent = {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string | null;
  label: string;
  ago: string;
};

// A task an agent is actively working on (in-progress run).
export type OfficeTask = {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string | null;
  name: string;
  ago: string;
};

// Something that wants the owner's eye: a risky approval, an error, or an open
// hand-off. Built server-side so the rail stays presentational.
export type OfficeUrgent = {
  id: string;
  kind: "approval" | "error" | "handoff";
  emoji: string | null;
  text: string;
  meta: string;
  severity?: string;
};

// A compact open-backlog row for the home (read-only; full backlog lives on
// Chief's page). `dueCls` is the pre-computed due-state class (err/accent/muted).
export type OfficeBacklog = {
  id: string;
  title: string;
  owner: string;
  due: string | null;
  priority: string;
  dueCls: string;
};

export type OfficeData = {
  agents: OfficeAgent[];
  workers: ConstellationWorker[];
  subagents: OfficeSubagent[];
  tasks: OfficeTask[];
  events: OfficeEvent[];
  approvals: OfficeApproval[];
  urgent: OfficeUrgent[];
  backlog: OfficeBacklog[];
  backlogOpen: number;
  health: string[]; // Chief's STATE.md health lines ([] = all clear)
  stats: {
    online: number;
    total: number;
    working: number;
    waiting: number;
    doneToday: number;
  };
  bridgeStale: boolean;
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OfficeView({
  data,
  approveAction,
  rejectAction,
}: {
  data: OfficeData;
  // The approve / reject server actions, threaded from the server page into the
  // embedded approvals rows (same guarded contract the approvals page uses).
  approveAction: (formData: FormData) => void | Promise<void>;
  rejectAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const { agents, subagents, tasks, events, approvals, urgent, stats } = data;
  const { backlog, backlogOpen, health } = data;

  const open = useCallback(
    (id: string) => router.push(`/dashboard/agents/${id}`),
    [router],
  );

  // live agents keyed by id → the floor + roster light up the deployed desks.
  const liveById = useMemo(() => {
    const m: Record<string, OfficeAgent | undefined> = {};
    for (const a of agents) m[a.id] = a;
    return m;
  }, [agents]);

  const deployed = agents.length;
  const extraApprovals = Math.max(0, approvals.length - 5);

  // One "running" column: the agents working right now, the tasks in progress and
  // every background sub-agent, merged newest-signal-first into a single list.
  const running = useMemo(() => {
    type Row = {
      key: string;
      emoji: string | null;
      title: string;
      sub: string;
      tag: string;
      agentId?: string;
    };
    const rows: Row[] = [];
    for (const a of agents)
      if (a.netStatus === "working")
        rows.push({
          key: `a-${a.id}`,
          emoji: a.emoji,
          title: a.name,
          sub: a.currentTask ?? "working",
          tag: "agent",
          agentId: a.id,
        });
    for (const t of tasks)
      rows.push({
        key: `t-${t.id}`,
        emoji: t.agentEmoji,
        title: t.name,
        sub: `${t.agentName} · ${t.ago}`,
        tag: "task",
        agentId: t.agentId || undefined,
      });
    for (const s of subagents)
      rows.push({
        key: `s-${s.id}`,
        emoji: s.agentEmoji,
        title: s.label,
        sub: `${s.agentName} · ${s.ago}`,
        tag: "worker",
        agentId: s.agentId || undefined,
      });
    return rows;
  }, [agents, tasks, subagents]);

  return (
    <div className="wf-of wf-dark">
      {/* ── thin stats strip: the four numbers, full width ───────────────── */}
      <section className="wf-of-stats" aria-label="workforce status">
        <StatCard n={stats.online} label="online" sub={`of ${stats.total}`} />
        <StatCard n={stats.working} label="working" />
        <StatCard
          n={stats.waiting}
          label="waiting on you"
          attention={stats.waiting > 0}
        />
        <StatCard n={stats.doneToday} label="done today" />
      </section>

      <div className="wf-of-body">
        {/* ── LEFT: everything running now, roster strip pinned at the bottom ─ */}
        <aside className="wf-of-left" aria-label="running work and roster">
          <Panel title="running" count={running.length || undefined} grow>
            {running.length === 0 ? (
              <p className="wf-of-mini-empty">nothing running right now.</p>
            ) : (
              <ul className="wf-of-run">
                {running.map((r) => {
                  const inner = (
                    <>
                      <span
                        className={`wf-of-run-mark ${r.tag}`}
                        aria-hidden="true"
                      />
                      <span className="wf-of-run-emoji" aria-hidden="true">
                        {r.emoji ?? "◆"}
                      </span>
                      <span className="wf-of-run-body">
                        <span className="wf-of-run-title" title={r.title}>
                          {r.title}
                        </span>
                        <span className="wf-of-run-sub" title={r.sub}>
                          {r.sub}
                        </span>
                      </span>
                      <span className={`wf-of-run-tag ${r.tag}`}>{r.tag}</span>
                    </>
                  );
                  return (
                    <li key={r.key}>
                      {r.agentId ? (
                        <button
                          type="button"
                          className="wf-of-run-item"
                          onClick={() => open(r.agentId as string)}
                        >
                          {inner}
                        </button>
                      ) : (
                        <div className="wf-of-run-item is-static">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* compact backlog — read-only peek; full backlog on Chief's page */}
          <Panel
            title="backlog"
            count={backlogOpen || undefined}
            action={
              <button
                type="button"
                className="wf-of-link"
                onClick={() => router.push("/dashboard/agents/chief")}
              >
                open <ArrowIcon />
              </button>
            }
          >
            {backlog.length === 0 ? (
              <p className="wf-of-mini-empty">backlog is clear.</p>
            ) : (
              <ul className="wf-of-bl">
                {backlog.map((b) => (
                  <li key={b.id} className="wf-of-bl-row">
                    <span
                      className={`wf-of-bl-dot is-${b.priority}`}
                      aria-hidden="true"
                    />
                    <span className="wf-of-bl-title" title={b.title}>
                      {b.title}
                    </span>
                    {b.due && (
                      <span className={`wf-of-bl-due ${b.dueCls}`}>
                        {b.due}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* roster: all six agents in one clean row */}
          <section className="wf-of-rosterbar" aria-label="roster">
            <div className="wf-of-rosterbar-head">
              <span>roster</span>
              <span className="wf-of-panel-count">
                {deployed}/{OFFICE_DESKS.length}
              </span>
            </div>
            <div className="wf-of-rosterbar-row">
              {OFFICE_DESKS.map((d) => {
                const a = liveById[d.id];
                const cls = `wf-of-chip ${a ? `is-live is-${a.netStatus}` : "is-soon"}`;
                const chip = (
                  <>
                    <span className="wf-of-chip-emoji" aria-hidden="true">
                      {a?.emoji ?? "○"}
                      {a && (
                        <span className={`wf-of-chip-dot ${a.netStatus}`} />
                      )}
                      {a && a.pending > 0 && (
                        <span className="wf-of-chip-badge">{a.pending}</span>
                      )}
                    </span>
                    <span className="wf-of-chip-name">
                      {a?.name ?? d.label}
                    </span>
                  </>
                );
                return a ? (
                  <button
                    key={d.id}
                    type="button"
                    className={cls}
                    onClick={() => open(a.id)}
                    title={`${a.name} · ${a.statusLabel}`}
                  >
                    {chip}
                  </button>
                ) : (
                  <div key={d.id} className={cls} title={`${d.label} · soon`}>
                    {chip}
                  </div>
                );
              })}
            </div>
          </section>

          {/* health: the discrepancies Chief's STATE.md can see (or all clear) */}
          <section className="wf-of-health" aria-label="health">
            <div className="wf-of-health-head">
              <span>health</span>
              {health.length > 0 && (
                <span className="wf-of-panel-count">{health.length}</span>
              )}
            </div>
            <HealthStrip lines={health} />
          </section>
        </aside>

        {/* ── CENTER: the illustrated office ─────────────────────────────── */}
        <section className="wf-of-center" aria-label="the office">
          <OfficeFloor
            live={liveById}
            subs={subagents.map((s) => ({
              id: s.id,
              parentId: s.agentId,
              label: s.label,
            }))}
            onSelect={open}
          />
        </section>

        {/* ── RIGHT: approvals · urgent · pulse ──────────────────────────── */}
        <aside className="wf-of-right" aria-label="approvals and alerts">
          <Panel
            title="approvals"
            count={stats.waiting || undefined}
            grow
            action={
              <button
                type="button"
                className="wf-of-link"
                onClick={() => router.push("/dashboard/approvals")}
              >
                open <ArrowIcon />
              </button>
            }
          >
            {approvals.length === 0 ? (
              <p className="wf-of-mini-empty">
                nothing waiting. the agents are working inside their limits.
              </p>
            ) : (
              <ul className="wf-of-appr">
                {approvals.slice(0, 5).map((ap) => (
                  <li key={ap.id} className="wf-of-appr-row">
                    <div className="wf-of-appr-top">
                      <span className="wf-of-appr-emoji" aria-hidden="true">
                        {ap.agentEmoji ?? "•"}
                      </span>
                      <span className="wf-of-appr-action" title={ap.action}>
                        {ap.action}
                      </span>
                      {ap.severity && (
                        <span className={`wf-of-risk ${ap.severity}`}>
                          {ap.severity}
                        </span>
                      )}
                    </div>
                    <div className="wf-of-appr-meta">
                      {ap.agentName} · {ap.ago}
                    </div>
                    <div className="wf-of-appr-actions">
                      <form action={approveAction}>
                        <input type="hidden" name="id" value={ap.id} />
                        <input type="hidden" name="agent" value={ap.agentId} />
                        <button className="act tiny" type="submit">
                          approve
                        </button>
                      </form>
                      <form action={rejectAction}>
                        <input type="hidden" name="id" value={ap.id} />
                        <input type="hidden" name="agent" value={ap.agentId} />
                        <button className="act tiny danger" type="submit">
                          reject
                        </button>
                      </form>
                      <button
                        type="button"
                        className="wf-of-review"
                        onClick={() => router.push("/dashboard/approvals")}
                      >
                        review
                      </button>
                    </div>
                  </li>
                ))}
                {extraApprovals > 0 && (
                  <li className="wf-of-appr-more">
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/approvals")}
                    >
                      +{extraApprovals} more waiting →
                    </button>
                  </li>
                )}
              </ul>
            )}
          </Panel>

          <Panel title="urgent" count={urgent.length || undefined}>
            {urgent.length === 0 ? (
              <p className="wf-of-mini-empty">all calm. nothing on fire.</p>
            ) : (
              <ul className="wf-of-urgent">
                {urgent.map((u) => (
                  <li key={u.id} className={`wf-of-urg is-${u.kind}`}>
                    <span className="wf-of-urg-emoji" aria-hidden="true">
                      {u.emoji ?? (u.kind === "error" ? "⚠" : "•")}
                    </span>
                    <span className="wf-of-urg-body">
                      <span className="wf-of-urg-text" title={u.text}>
                        {u.text}
                      </span>
                      <span className="wf-of-urg-meta">{u.meta}</span>
                    </span>
                    {u.severity && (
                      <span className={`wf-of-risk ${u.severity}`}>
                        {u.severity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="pulse">
            <div className="wf-of-pulse">
              <div className="wf-of-pulse-row">
                <span className="wf-of-pulse-l">bridge</span>
                <span
                  className={`wf-of-pulse-v ${data.bridgeStale ? "warn" : "ok"}`}
                >
                  {data.bridgeStale ? "standby" : "live"}
                </span>
              </div>
              <div className="wf-of-pulse-row">
                <span className="wf-of-pulse-l">deployed</span>
                <span className="wf-of-pulse-v mono">
                  {deployed}/{OFFICE_DESKS.length}
                </span>
              </div>
              <div className="wf-of-pulse-row">
                <span className="wf-of-pulse-l">workers</span>
                <span className="wf-of-pulse-v mono">{subagents.length}</span>
              </div>
              <div className="wf-of-pulse-row">
                <span className="wf-of-pulse-l">done today</span>
                <span className="wf-of-pulse-v mono">{stats.doneToday}</span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>

      {/* ── thin bottom strip: latest activity ───────────────────────────── */}
      <section className="wf-of-activity" aria-label="latest activity">
        <div className="wf-of-activity-head">
          <h2>latest</h2>
          <button
            type="button"
            className="wf-of-link"
            onClick={() => router.push("/dashboard/activity")}
          >
            see all <ArrowIcon />
          </button>
        </div>
        {events.length === 0 ? (
          <p className="wf-of-mini-empty">nothing yet.</p>
        ) : (
          <ul className="wf-of-feed">
            {events.map((e) => (
              <li key={e.id} className="wf-of-feed-li">
                <button
                  type="button"
                  className="wf-of-feed-item"
                  onClick={() => router.push(`/dashboard/agents/${e.agent}`)}
                >
                  <span className="wf-of-feed-time mono">{e.time}</span>
                  <span className="wf-of-feed-agent">{e.agent}</span>
                  {e.kind === "post" && (
                    <span className="wf-chip sm wf-of-feed-kind">post</span>
                  )}
                  <span
                    className={`wf-of-feed-sum ${e.isError ? "err" : ""}`}
                    title={e.summary}
                  >
                    {e.summary}
                  </span>
                </button>
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="wf-of-feed-link"
                  >
                    link →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── small building blocks ─────────────────────────────────────────────────

function StatCard({
  n,
  label,
  sub,
  attention,
}: {
  n: number;
  label: string;
  sub?: string;
  attention?: boolean;
}) {
  return (
    <div className={`wf-of-stat ${attention ? "attention" : ""}`}>
      <span className="wf-of-stat-n">{n}</span>
      <span className="wf-of-stat-l">
        {label}
        {sub && <span className="wf-of-stat-sub"> {sub}</span>}
      </span>
    </div>
  );
}

function Panel({
  title,
  count,
  action,
  grow,
  children,
}: {
  title: string;
  count?: number | string;
  action?: React.ReactNode;
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`wf-of-panel${grow ? " is-grow" : ""}`}>
      <div className="wf-of-panel-head">
        <h2>
          {title}
          {count !== undefined && (
            <span className="wf-of-panel-count">{count}</span>
          )}
        </h2>
        {action}
      </div>
      <div className="wf-of-panel-body">{children}</div>
    </section>
  );
}
