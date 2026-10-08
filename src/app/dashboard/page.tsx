import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { approveFromForm, rejectFromForm } from "@/lib/workforce/actions";
import { getOpenBacklog, parseHealth } from "@/lib/workforce/backlog";
import { getAgentFile } from "@/lib/workforce/files";
import { getFixes } from "@/lib/workforce/fixes";
import { getOpenIdeaCount } from "@/lib/workforce/ideas";
import { getHealth } from "@/lib/workforce/metrics";
import { getHandoffs, parseOutbound } from "@/lib/workforce/outreach";
import { agentColor, ROSTER, rosterById } from "@/lib/workforce/roster";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import type { Agent, Approval, WfEvent } from "@/lib/workforce/types";
import { type MobileAgent, MobileOffice } from "./_components/MobileOffice";
import { type OfficeRoom, OfficeRooms } from "./_components/office/OfficeRooms";
import { dueState } from "./_components/panels/dates";
import "./office.css";
import "./mobile-office.css";

// Office home (redesign): the six-room office + running/backlog/health + the
// waiting/urgent/latest/pulse rail. Server component (real reads, 6s refresh);
// only the room grid is a client island (wandering workers + climbing bars).

const AMBER = "oklch(0.8 0.14 70)";
const GREEN = "oklch(0.8 0.16 150)";
const RED = "oklch(0.72 0.17 25)";
const RISK: Record<string, [string, string]> = {
  low: ["rgba(255,255,255,0.07)", "#cfc9c0"],
  medium: ["oklch(0.8 0.14 70 / 0.16)", AMBER],
  high: ["oklch(0.72 0.17 25 / 0.18)", RED],
};
const ROOM_ORDER = ["scout", "fixer", "muse", "hunter", "chief", "scribe"];

function severity(risk: string | null | undefined): "low" | "medium" | "high" {
  const w =
    (risk ?? "")
      .trim()
      .match(/^([A-Za-z]+)/)?.[1]
      ?.toLowerCase() ?? "";
  if (w === "high" || w === "critical") return "high";
  if (w === "medium" || w === "moderate") return "medium";
  return "low";
}
function hhmm(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
function cleanSummary(raw: string): string {
  let s = (raw ?? "").trim();
  s = s.replace(/^(assistant|user|owner)\s*:\s*/i, "");
  if (/^\[voice call ended\]/i.test(s))
    return (
      s.replace(/^\[voice call ended\]\s*/i, "").trim() || "voice call ended"
    );
  if (/^\[voice call\]/i.test(s))
    return s.replace(/^\[voice call\]\s*/i, "").trim() || "voice call";
  return s || raw;
}
function healthHref(text: string): string {
  const t = text.toLowerCase();
  if (/repl(y|ies)|no response|conversation/.test(t))
    return "/dashboard/agents/hunter/conversations?filter=awaiting";
  if (/prospect|overdue|next touch/.test(t))
    return "/dashboard/agents/hunter/prospects";
  return "/dashboard/agents/chief#wf-backlog";
}

export default async function Office() {
  const db = supabaseAdmin();
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [
    { data: agentRows },
    { data: pending },
    { data: recent },
    { data: todays },
    workerRows,
    health,
    handoffs,
    openBacklog,
    chiefState,
    openIdeaCount,
  ] = await Promise.all([
    db.from("agents").select("*").order("id"),
    db
      .from("approvals")
      .select("id, agent_id, action, risk, draft, ts")
      .eq("status", "pending")
      .order("ts", { ascending: true }),
    db.from("events").select("*").order("ts", { ascending: false }).limit(24),
    db
      .from("events")
      .select("agent_id")
      .gte("ts", since.toISOString())
      .in("kind", ["run", "cron", "message"]),
    getActiveSubagents(),
    getHealth(),
    getHandoffs("hunter", ["open"]),
    getOpenBacklog(),
    getAgentFile("chief", "STATE.md"),
    getOpenIdeaCount(),
  ]);

  const dbAgents = (agentRows as Agent[] | null) ?? [];
  const liveById = new Map(dbAgents.map((a) => [a.id, a]));

  type Pend = Pick<Approval, "id" | "agent_id" | "action" | "risk" | "ts"> & {
    draft: string | null;
  };
  const pendingList = (pending as Pend[] | null) ?? [];
  const pendingByAgent = new Map<string, number>();
  for (const p of pendingList)
    if (p.agent_id)
      pendingByAgent.set(p.agent_id, (pendingByAgent.get(p.agent_id) ?? 0) + 1);

  // Workers = running OR finished in the last 10 min (getActiveSubagents already
  // scopes to that window). Keep the recently-finished ones so sub-agent activity
  // is visible even when a worker finishes in seconds; `running` drives status.
  const workersByAgent = new Map<string, { label: string }[]>();
  const runningByAgent = new Map<string, number>();
  for (const w of workerRows)
    if (w.agent_id) {
      const arr = workersByAgent.get(w.agent_id) ?? [];
      arr.push({ label: w.label ?? "background task" });
      workersByAgent.set(w.agent_id, arr);
      if (w.status === "running")
        runningByAgent.set(
          w.agent_id,
          (runningByAgent.get(w.agent_id) ?? 0) + 1,
        );
    }

  type St = "working" | "waiting" | "idle" | "soon";
  const statusOf = (id: string): St => {
    if (!liveById.has(id)) return "soon";
    const a = liveById.get(id);
    if (a?.status === "working" || (runningByAgent.get(id) ?? 0) > 0)
      return "working";
    if ((pendingByAgent.get(id) ?? 0) > 0) return "waiting";
    return "idle";
  };

  // What an agent is doing: its current_task, else its most recent event summary
  // (the bridge often leaves current_task empty even while an agent is working).
  const latestByAgent = new Map<string, string>();
  for (const e of (recent as WfEvent[] | null) ?? []) {
    if (e.agent_id && !latestByAgent.has(e.agent_id)) {
      const s = cleanSummary(e.summary ?? "");
      if (s) latestByAgent.set(e.agent_id, s);
    }
  }
  const taskOf = (id: string, st: St): string => {
    if (st === "soon") return "not deployed yet";
    const ct = liveById.get(id)?.current_task?.trim();
    if (ct) return ct;
    if (st === "working") return latestByAgent.get(id) ?? "working…";
    return "idle · next run scheduled";
  };
  // only show workers for an agent that is actually working
  const workersFor = (id: string, st: St) =>
    st === "working" ? (workersByAgent.get(id) ?? []) : [];
  const totalWorkers = ROSTER.reduce(
    (n, r) => n + workersFor(r.id, statusOf(r.id)).length,
    0,
  );

  const deployed = ROSTER.filter((r) => liveById.has(r.id)).length;
  const working = ROSTER.filter((r) => statusOf(r.id) === "working").length;
  const pendingCount = pendingList.length;
  const doneToday = ((todays as unknown[] | null) ?? []).length;

  // ── rooms ──────────────────────────────────────────────────────────────
  // Fixer's card shows a count of open PRs (fixes awaiting a merge approval).
  const fixerOpenPRs = (await getFixes(200)).filter(
    (f) => f.status === "pr_open",
  ).length;
  const rooms: OfficeRoom[] = ROOM_ORDER.map((id) => {
    const a = rosterById(id);
    const hue = a?.hue ?? 70;
    const c = agentColor(hue);
    const st = statusOf(id);
    const ws = workersFor(id, st);
    const waitN = pendingByAgent.get(id) ?? 0;
    const chipBg =
      st === "working"
        ? agentColor(hue, 0.18)
        : st === "waiting"
          ? "oklch(0.8 0.14 70 / 0.16)"
          : "rgba(255,255,255,0.06)";
    return {
      id,
      href: `/dashboard/agents/${id}`,
      room: a?.room ?? id,
      name: a?.name ?? id,
      emoji: a?.emoji ?? "◆",
      color: c,
      tint: agentColor(hue, 0.16),
      glow: `radial-gradient(55% 65% at 50% 42%, ${agentColor(hue, st === "working" ? 0.2 : 0.06)}, transparent 72%)`,
      border:
        st === "soon"
          ? "rgba(255,255,255,0.12)"
          : st === "working"
            ? agentColor(hue, 0.35)
            : "rgba(255,255,255,0.07)",
      borderStyle: st === "soon" ? "dashed" : "solid",
      avatarShadow:
        st === "working"
          ? `0 0 0 2px ${c}, 0 0 30px ${agentColor(hue, 0.55)}`
          : "0 0 0 1px rgba(255,255,255,0.1)",
      statusLabel: st === "soon" ? "soon" : st,
      chipBg,
      chipFg: st === "working" ? c : st === "waiting" ? AMBER : "#8a847b",
      status: st,
      task: taskOf(id, st),
      basePct: st === "working" ? 42 : 0,
      workerLine: ws.length
        ? `${ws.length} worker${ws.length > 1 ? "s" : ""}`
        : "",
      badge:
        id === "fixer" && fixerOpenPRs > 0
          ? `${fixerOpenPRs} open PR${fixerOpenPRs > 1 ? "s" : ""}`
          : "",
      waiting: waitN > 0,
      waitingText: `needs you · ${waitN}`,
      opacity: st === "soon" ? 0.6 : 1,
      workers: ws.map((w) => ({
        color: c,
        fill: agentColor(hue, 0.2),
        task: w.label,
      })),
    };
  });

  // ── running tree ───────────────────────────────────────────────────────
  const running = ROSTER.filter((r) => statusOf(r.id) === "working").map(
    (r) => {
      const c = agentColor(r.hue);
      const ws = workersByAgent.get(r.id) ?? [];
      return {
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        tint: agentColor(r.hue, 0.16),
        task: taskOf(r.id, "working"),
        workers: ws.map((w) => ({ task: w.label, color: c })),
      };
    },
  );

  // ── backlog ────────────────────────────────────────────────────────────
  const backlog = openBacklog.slice(0, 4).map((b) => {
    const owner = rosterById(b.owner ?? "");
    let due = { text: "no date", color: "#6f6a62" };
    if (b.due) {
      const s = dueState(b.due);
      due =
        s === "overdue"
          ? { text: b.due, color: RED }
          : s === "today"
            ? { text: "today", color: AMBER }
            : { text: b.due, color: "#8a847b" };
    }
    return { id: b.id, emoji: owner?.emoji ?? "•", title: b.title, due };
  });

  // ── health ─────────────────────────────────────────────────────────────
  const health2 = parseHealth(chiefState?.content)
    .slice(0, 4)
    .map((text, i) => ({
      key: `h${i}`,
      text,
      href: healthHref(text),
      color: /overdue|past due/i.test(text) ? RED : AMBER,
    }));

  // ── waiting queue (top 3) ──────────────────────────────────────────────
  const queue = pendingList.slice(0, 3).map((p) => {
    const a = rosterById(p.agent_id ?? "");
    const sev = severity(p.risk);
    const out = parseOutbound(p.draft) !== null;
    return {
      id: p.id,
      agentId: p.agent_id ?? "chief",
      emoji: a?.emoji ?? "◆",
      name: a?.name ?? p.agent_id ?? "system",
      tint: agentColor(a?.hue ?? 70, 0.16),
      action: p.action ?? "approval request",
      risk: sev,
      riskBg: RISK[sev][0],
      riskFg: RISK[sev][1],
      approveLabel: out ? "send" : "approve",
    };
  });

  // ── urgent ─────────────────────────────────────────────────────────────
  const events = (recent as WfEvent[] | null) ?? [];
  const urgent: {
    key: string;
    kind: string;
    text: string;
    href: string;
    bg: string;
    fg: string;
  }[] = [];
  for (const p of pendingList)
    if (severity(p.risk) === "high")
      urgent.push({
        key: `ap-${p.id}`,
        kind: "risk",
        text: p.action ?? "risky approval",
        href: "/dashboard/approvals",
        bg: RISK.high[0],
        fg: RED,
      });
  for (const e of events.filter((e) => e.kind === "error").slice(0, 2))
    urgent.push({
      key: `er-${e.id}`,
      kind: "error",
      text: cleanSummary(e.summary ?? "error"),
      href: "/dashboard/activity",
      bg: RISK.high[0],
      fg: RED,
    });
  for (const h of handoffs.slice(0, 2))
    urgent.push({
      key: `ho-${h.id}`,
      kind: "hand-off",
      text: h.why ?? `hand-off: ${h.company ?? "a prospect"}`,
      href: "/dashboard/agents/hunter/conversations",
      bg: "rgba(255,255,255,0.07)",
      fg: "#cfc9c0",
    });

  // ── latest feed ────────────────────────────────────────────────────────
  const latest = events.slice(0, 7).map((e) => {
    const a = rosterById(e.agent_id ?? "");
    const child = e.kind === "worker" || e.kind === "subagent";
    return {
      id: e.id,
      t: hhmm(e.ts),
      emoji: a?.emoji ?? "•",
      text: cleanSummary(e.summary ?? e.kind ?? "event"),
      indent: child ? 16 : 0,
      fg: child ? "#8a847b" : "#cfc9c0",
    };
  });

  const pulse = [
    {
      label: "bridge",
      value: health.bridgeStale ? "degraded" : "live",
      color: health.bridgeStale ? AMBER : GREEN,
    },
    { label: "deployed", value: `${deployed} / 6`, color: "#f4f1ec" },
    { label: "workers now", value: String(totalWorkers), color: "#f4f1ec" },
    { label: "done today", value: String(doneToday), color: "#f4f1ec" },
  ];

  // ── header text ────────────────────────────────────────────────────────
  const now = new Date();
  const dubaiHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  const partOfDay =
    dubaiHour < 12 ? "morning" : dubaiHour < 18 ? "afternoon" : "evening";
  const dateLine = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(now)
    .toLowerCase();
  const summaryLine = `${pendingCount} ${pendingCount === 1 ? "thing is" : "things are"} waiting for you. ${working} ${working === 1 ? "agent is" : "agents are"} working with ${totalWorkers} worker${totalWorkers === 1 ? "" : "s"}.`;
  const greeting =
    dubaiHour < 5
      ? "still up"
      : dubaiHour < 12
        ? "good morning"
        : dubaiHour < 17
          ? "good afternoon"
          : "good evening";

  // ── mobile agent list (roster order) ───────────────────────────────────
  const mobileAgents: MobileAgent[] = ROSTER.map((r) => {
    const st = statusOf(r.id);
    return {
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      hue: r.hue,
      status: st,
      task: taskOf(r.id, st),
      workers: workersFor(r.id, st).length,
      pending: pendingByAgent.get(r.id) ?? 0,
    };
  });

  const stats = [
    { value: String(deployed), of: " / 6", label: "online", color: "#f4f1ec" },
    { value: String(working), of: "", label: "working", color: "#f4f1ec" },
    {
      value: String(pendingCount),
      of: "",
      label: "waiting on you",
      color: pendingCount ? AMBER : "#f4f1ec",
    },
    { value: String(doneToday), of: "", label: "done today", color: "#f4f1ec" },
  ];

  return (
    <>
      <MobileOffice
        agents={mobileAgents}
        greeting={greeting}
        dateLine={dateLine}
        summary={summaryLine}
        onlineCount={deployed}
        workingCount={working}
        pendingCount={pendingCount}
      />
      <div className="wf-only-desktop">
        <div className="of-wrap">
          <div className="of-head">
            <div>
              <div className="of-eyebrow">office · {dateLine}</div>
              <h1 className="of-h1">good {partOfDay}, khizr</h1>
              <p className="of-sum">{summaryLine}</p>
              {openIdeaCount > 0 && (
                <Link
                  href="/dashboard/agents/chief#wf-ideas"
                  className="of-ideas-line"
                >
                  {openIdeaCount} idea{openIdeaCount === 1 ? "" : "s"} waiting
                  for chief →
                </Link>
              )}
            </div>
          </div>
          <div className="of-stats">
            {stats.map((s) => (
              <div className="of-stat" key={s.label}>
                <div className="of-stat-n" style={{ color: s.color }}>
                  {s.value}
                  {s.of && <span className="of-stat-of">{s.of}</span>}
                </div>
                <div className="of-stat-l">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="of-body">
            <div className="of-main">
              <OfficeRooms rooms={rooms} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 16,
                }}
              >
                {/* running */}
                <div className="of-panel">
                  <div className="of-panel-head">
                    <span className="of-panel-title">running</span>
                    <span className="of-panel-note">
                      {working} agents · {totalWorkers} workers
                    </span>
                  </div>
                  {running.length === 0 ? (
                    <div className="of-empty">nothing running right now.</div>
                  ) : (
                    running.map((r) => (
                      <div className="of-run-row" key={r.id}>
                        <div className="of-run-head">
                          <span
                            className="of-run-emoji"
                            style={{ background: r.tint }}
                          >
                            {r.emoji}
                          </span>
                          <span className="of-run-name">{r.name}</span>
                          <span className="of-run-task">{r.task}</span>
                        </div>
                        {r.workers.map((w) => (
                          <div className="of-run-worker" key={w.task}>
                            <span className="of-connector">└</span>
                            <span
                              className="of-run-wdot"
                              style={{ border: `1.5px solid ${w.color}` }}
                            />
                            <span className="of-run-wtask">{w.task}</span>
                            <span className="of-run-wbar">
                              <span
                                style={{ width: "60%", background: w.color }}
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* backlog */}
                <div className="of-panel">
                  <div className="of-panel-head">
                    <span className="of-panel-title">backlog</span>
                    <Link
                      href="/dashboard/agents/chief"
                      className="of-panel-link"
                    >
                      open →
                    </Link>
                  </div>
                  {backlog.length === 0 ? (
                    <div className="of-empty">backlog is clear.</div>
                  ) : (
                    backlog.map((b) => (
                      <div className="of-row" key={b.id}>
                        <span>{b.emoji}</span>
                        <span className="of-row-title">{b.title}</span>
                        <span
                          className="of-row-due"
                          style={{ color: b.due.color }}
                        >
                          {b.due.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* health */}
                <div className="of-panel">
                  <div className="of-panel-head">
                    <span className="of-panel-title">health</span>
                    <span className="of-panel-note">from chief · STATE.md</span>
                  </div>
                  {health2.length === 0 ? (
                    <div className="of-empty">all clear.</div>
                  ) : (
                    health2.map((h) => (
                      <Link href={h.href} className="of-h-row" key={h.key}>
                        <span
                          className="of-h-dot"
                          style={{ background: h.color }}
                        />
                        <span className="of-h-text">{h.text}</span>
                        <span className="of-h-arrow">→</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* right rail */}
            <div className="of-rail">
              <div className="of-panel">
                <div className="of-panel-head">
                  <span className="of-panel-title">
                    waiting for you{" "}
                    <span style={{ color: AMBER }}>{pendingCount}</span>
                  </span>
                  <Link href="/dashboard/approvals" className="of-panel-link">
                    open inbox →
                  </Link>
                </div>
                {queue.length === 0 ? (
                  <div className="of-empty">
                    nothing waiting. the agents are working inside their limits.
                  </div>
                ) : (
                  queue.map((q) => (
                    <div className="of-q-card" key={q.id}>
                      <div className="of-q-top">
                        <span
                          className="of-q-tile"
                          style={{ background: q.tint }}
                        >
                          {q.emoji}
                        </span>
                        <span className="of-q-name">{q.name}</span>
                        <span style={{ flex: 1 }} />
                        <span
                          className="of-q-risk"
                          style={{ background: q.riskBg, color: q.riskFg }}
                        >
                          {q.risk}
                        </span>
                      </div>
                      <div className="of-q-action">{q.action}</div>
                      <div className="of-q-actions">
                        <form action={approveFromForm}>
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="agent" value={q.agentId} />
                          <button type="submit" className="of-btn-amber">
                            {q.approveLabel}
                          </button>
                        </form>
                        <Link
                          href="/dashboard/approvals"
                          className="of-btn-outline"
                        >
                          review
                        </Link>
                        <form action={rejectFromForm}>
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="agent" value={q.agentId} />
                          <button type="submit" className="of-btn-ghost">
                            reject
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="of-panel">
                <div className="of-panel-title" style={{ marginBottom: 8 }}>
                  urgent
                </div>
                {urgent.length === 0 ? (
                  <div className="of-empty">all calm. nothing on fire.</div>
                ) : (
                  urgent.map((u) => (
                    <Link href={u.href} className="of-u-row" key={u.key}>
                      <span
                        className="of-u-kind"
                        style={{ background: u.bg, color: u.fg }}
                      >
                        {u.kind}
                      </span>
                      <span>{u.text}</span>
                    </Link>
                  ))
                )}
              </div>

              <div className="of-panel">
                <div className="of-panel-head">
                  <span className="of-panel-title">latest</span>
                  <Link href="/dashboard/activity" className="of-panel-link">
                    see all →
                  </Link>
                </div>
                {latest.length === 0 ? (
                  <div className="of-empty">nothing yet.</div>
                ) : (
                  latest.map((e) => (
                    <div
                      className="of-l-row"
                      key={e.id}
                      style={{ paddingLeft: e.indent }}
                    >
                      <span className="of-l-time">{e.t}</span>
                      <span>{e.emoji}</span>
                      <span className="of-l-text" style={{ color: e.fg }}>
                        {e.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="of-panel of-pulse">
                {pulse.map((p) => (
                  <div key={p.label}>
                    <div className="of-pulse-l">{p.label}</div>
                    <div className="of-pulse-v" style={{ color: p.color }}>
                      {p.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
