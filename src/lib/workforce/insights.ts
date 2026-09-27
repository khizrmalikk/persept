// Server-only reads that power the insights page. Computes throughput (events,
// runs and workers on one aligned timeline), approvals turnaround, grouped
// rejection reasons, and per-agent output — all from real tables, with honest
// zeros when the workforce is quiet. Defensive: a missing table yields empties.

import { supabaseAdmin } from "@/lib/supabase/server";
import { ROSTER } from "./roster";

const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;
const CAP = 5000;

export type Bar = {
  events: number;
  runs: number;
  workers: number;
  eh: number; // stacked heights, % of the tallest bar
  rh: number;
  wh: number;
  label: string; // shown label (blank for skipped ticks)
  tip: string;
};

export type Kpi = {
  label: string;
  value: string;
  note: string;
  tone: "ok" | "warn" | "mut";
};

export type RangeData = {
  bars: Bar[];
  kpis: Kpi[];
  chartSub: string;
  hasData: boolean;
};

export type PerAgentRow = {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  ok: string;
  err: string;
  errBad: boolean;
  rate: string;
  events: string;
  workers: string;
  trend: number[]; // 0..100 heights
  pending: string;
  last: string;
  soon: boolean;
};

export type Insights = {
  ranges: { "24h": RangeData; "7d": RangeData };
  turnaround: {
    ratePct: number | null;
    avg: string;
    median: string;
    pending: number;
    oldest: string;
    approved: number;
    rejected: number;
  };
  rejections: { n: number; text: string }[];
  perAgent: PerAgentRow[];
};

function agoShort(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function mins(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// bucket a set of timestamps into `count` slots of `step` ending now (slot 0 =
// oldest, slot count-1 = now).
function bucketize(times: string[], now: number, count: number, step: number) {
  const arr = new Array<number>(count).fill(0);
  for (const iso of times) {
    if (!iso) continue;
    const age = now - new Date(iso).getTime();
    if (age < 0 || age >= count * step) continue;
    const slot = count - 1 - Math.floor(age / step);
    if (slot >= 0 && slot < count) arr[slot] += 1;
  }
  return arr;
}

function slotLabel(
  now: number,
  slot: number,
  count: number,
  step: number,
  window: "24h" | "7d",
): string {
  const d = new Date(now - (count - 1 - slot) * step);
  if (window === "7d") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      weekday: "short",
    })
      .format(d)
      .toLowerCase();
  }
  const hh = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    hour12: false,
  })
    .format(d)
    .padStart(2, "0");
  return slot % 3 === 0 ? hh : "";
}

async function buildRange(
  window: "24h" | "7d",
  deployed: number,
  total: number,
): Promise<RangeData> {
  const db = supabaseAdmin();
  const now = Date.now();
  const count = window === "24h" ? 24 : 7;
  const step = window === "24h" ? MS_HOUR : MS_DAY;
  const cutoff = new Date(now - count * step).toISOString();

  const [evRes, taskRes, subRes] = await Promise.all([
    db.from("events").select("ts").gte("ts", cutoff).limit(CAP),
    db
      .from("tasks")
      .select("started_at, status")
      .gte("started_at", cutoff)
      .limit(CAP),
    db
      .from("subagents")
      .select("started_at")
      .gte("started_at", cutoff)
      .limit(CAP),
  ]);

  const events = (evRes.data as { ts: string }[] | null) ?? [];
  const tasks =
    (taskRes.data as { started_at: string; status: string | null }[] | null) ??
    [];
  const subs = (subRes.data as { started_at: string }[] | null) ?? [];

  const eBuckets = bucketize(
    events.map((e) => e.ts),
    now,
    count,
    step,
  );
  const rBuckets = bucketize(
    tasks.map((t) => t.started_at),
    now,
    count,
    step,
  );
  const wBuckets = bucketize(
    subs.map((s) => s.started_at),
    now,
    count,
    step,
  );

  const totalEvents = events.length;
  const totalRuns = tasks.length;
  const totalWorkers = subs.length;
  const failedRuns = tasks.filter((t) => t.status === "error").length;

  const max = Math.max(
    1,
    ...eBuckets.map((e, i) => e + rBuckets[i] + wBuckets[i]),
  );
  const bars: Bar[] = eBuckets.map((e, i) => ({
    events: e,
    runs: rBuckets[i],
    workers: wBuckets[i],
    eh: (e / max) * 100,
    rh: (rBuckets[i] / max) * 100,
    wh: (wBuckets[i] / max) * 100,
    label: slotLabel(now, i, count, step, window),
    tip: `${slotLabel(now, i, count, step, window) || (window === "24h" ? `${i}` : "")} · ${e} events · ${rBuckets[i]} runs · ${wBuckets[i]} workers`,
  }));

  const win = window === "24h" ? "24h" : "7d";
  const busiest = bars.reduce(
    (b, x) => (x.events > b.events ? x : b),
    bars[0] ?? { events: 0, label: "" },
  );
  const errRate = totalRuns ? (failedRuns / totalRuns) * 100 : 0;
  const kpis: Kpi[] = [
    {
      label: `events · ${win}`,
      value: String(totalEvents),
      note: busiest.events
        ? `busiest at ${busiest.label || "—"}`
        : "quiet window",
      tone: "mut",
    },
    {
      label: `runs · ${win}`,
      value: String(totalRuns),
      note: failedRuns ? `${failedRuns} failed` : "none failed",
      tone: failedRuns ? "warn" : "mut",
    },
    {
      label: "workers spawned",
      value: String(totalWorkers),
      note: totalWorkers ? "background tasks" : "none this window",
      tone: "mut",
    },
    {
      label: "agents online",
      value: `${deployed} / ${total}`,
      note: deployed < total ? "fixer not deployed" : "all deployed",
      tone: "mut",
    },
    {
      label: "error rate",
      value: `${errRate.toFixed(errRate < 10 ? 1 : 0)}%`,
      note: `${failedRuns} of ${totalRuns} runs`,
      tone: failedRuns ? "warn" : "mut",
    },
  ];

  return {
    bars,
    kpis,
    chartSub:
      window === "24h"
        ? "events, runs and workers per hour, last 24h"
        : "events, runs and workers per day, last 7 days",
    hasData: totalEvents + totalRuns + totalWorkers > 0,
  };
}

export async function getInsights(): Promise<Insights> {
  const db = supabaseAdmin();
  const now = Date.now();
  const cutoff24 = new Date(now - 24 * MS_HOUR).toISOString();
  const cutoff7 = new Date(now - 7 * MS_DAY).toISOString();

  try {
    const [{ data: agentRows }, approvals, decided, sub24, ev24, tasks7] =
      await Promise.all([
        db.from("agents").select("id, last_active_at"),
        db.from("approvals").select("ts, status, decided_at, agent_id"),
        db
          .from("approvals")
          .select("agent_id, decision_note, status")
          .eq("status", "rejected")
          .limit(CAP),
        db.from("subagents").select("agent_id").gte("started_at", cutoff24),
        db.from("events").select("agent_id, ts").gte("ts", cutoff24).limit(CAP),
        db
          .from("tasks")
          .select("agent_id, status")
          .gte("started_at", cutoff7)
          .limit(CAP),
      ]);

    const agents =
      (agentRows as { id: string; last_active_at: string | null }[] | null) ??
      [];
    const deployedIds = new Set(agents.map((a) => a.id));
    const total = ROSTER.length;
    const deployed = ROSTER.filter((r) => deployedIds.has(r.id)).length;

    const [range24, range7] = await Promise.all([
      buildRange("24h", deployed, total),
      buildRange("7d", deployed, total),
    ]);

    // turnaround
    const apRows =
      (approvals.data as unknown as
        | {
            ts: string;
            status: string | null;
            decided_at: string | null;
            agent_id: string | null;
          }[]
        | null) ?? [];
    const pending = apRows.filter((a) => a.status === "pending");
    const decidedRows = apRows.filter(
      (a) =>
        a.decided_at &&
        (a.status === "approved" ||
          a.status === "rejected" ||
          a.status === "sent" ||
          a.status === "published"),
    );
    const approved = apRows.filter(
      (a) =>
        a.status === "approved" ||
        a.status === "sent" ||
        a.status === "published",
    ).length;
    const rejected = apRows.filter((a) => a.status === "rejected").length;
    const decidedTotal = approved + rejected;
    const ratePct = decidedTotal
      ? Math.round((approved / decidedTotal) * 100)
      : null;
    const durations = decidedRows
      .map(
        (a) =>
          new Date(a.decided_at as string).getTime() - new Date(a.ts).getTime(),
      )
      .filter((d) => d >= 0)
      .sort((a, b) => a - b);
    const avg = durations.length
      ? mins(durations.reduce((s, d) => s + d, 0) / durations.length)
      : "—";
    const median = durations.length
      ? mins(durations[Math.floor(durations.length / 2)])
      : "—";
    const oldestPending = pending
      .map((a) => a.ts)
      .sort()
      .at(0);
    const oldest = oldestPending ? agoShort(oldestPending) : "—";

    // rejection reasons — grouped by decision_note
    const rejRows =
      (decided.data as unknown as
        | {
            agent_id: string | null;
            decision_note: string | null;
            status: string | null;
          }[]
        | null) ?? [];
    const reasonCounts = new Map<string, number>();
    for (const r of rejRows) {
      const note = (r.decision_note ?? "").trim().toLowerCase();
      const key = note || "no reason given";
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
    const rejections = [...reasonCounts.entries()]
      .map(([text, n]) => ({ n, text }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);

    // per-agent
    const subs24 =
      (sub24.data as unknown as { agent_id: string | null }[] | null) ?? [];
    const events24 =
      (ev24.data as unknown as
        | { agent_id: string | null; ts: string }[]
        | null) ?? [];
    const tasksRows =
      (tasks7.data as unknown as
        | { agent_id: string | null; status: string | null }[]
        | null) ?? [];
    const pendingByAgent = new Map<string, number>();
    for (const p of pending)
      if (p.agent_id)
        pendingByAgent.set(
          p.agent_id,
          (pendingByAgent.get(p.agent_id) ?? 0) + 1,
        );
    const workersByAgent = new Map<string, number>();
    for (const s of subs24)
      if (s.agent_id)
        workersByAgent.set(
          s.agent_id,
          (workersByAgent.get(s.agent_id) ?? 0) + 1,
        );
    const okByAgent = new Map<string, number>();
    const errByAgent = new Map<string, number>();
    for (const t of tasksRows) {
      if (!t.agent_id) continue;
      if (t.status === "ok")
        okByAgent.set(t.agent_id, (okByAgent.get(t.agent_id) ?? 0) + 1);
      else if (t.status === "error")
        errByAgent.set(t.agent_id, (errByAgent.get(t.agent_id) ?? 0) + 1);
    }
    // 12-slot 2-hour trend per agent from events24
    const trendByAgent = new Map<string, number[]>();
    for (const a of ROSTER)
      trendByAgent.set(a.id, new Array<number>(12).fill(0));
    for (const e of events24) {
      if (!e.agent_id || !e.ts) continue;
      const t = trendByAgent.get(e.agent_id);
      if (!t) continue;
      const age = now - new Date(e.ts).getTime();
      const slot = 11 - Math.floor(age / (2 * MS_HOUR));
      if (slot >= 0 && slot < 12) t[slot] += 1;
    }
    const eventsByAgent = new Map<string, number>();
    for (const e of events24)
      if (e.agent_id)
        eventsByAgent.set(e.agent_id, (eventsByAgent.get(e.agent_id) ?? 0) + 1);
    const lastById = new Map(
      agents.map((a) => [a.id, a.last_active_at] as const),
    );

    const perAgent: PerAgentRow[] = ROSTER.map((r) => {
      const soon = !deployedIds.has(r.id);
      const ok = okByAgent.get(r.id) ?? 0;
      const err = errByAgent.get(r.id) ?? 0;
      const fin = ok + err;
      const trend = trendByAgent.get(r.id) ?? [];
      const mx = Math.max(1, ...trend);
      return {
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        hue: r.hue,
        ok: soon ? "—" : String(ok),
        err: soon ? "—" : String(err),
        errBad: err > 0,
        rate: soon || fin === 0 ? "—" : `${Math.round((ok / fin) * 100)}%`,
        events: soon ? "—" : String(eventsByAgent.get(r.id) ?? 0),
        workers: soon ? "—" : String(workersByAgent.get(r.id) ?? 0),
        trend: trend.map((v) => (v / mx) * 100),
        pending: soon ? "—" : String(pendingByAgent.get(r.id) ?? 0),
        last: soon ? "not deployed" : agoShort(lastById.get(r.id) ?? null),
        soon,
      };
    });

    return {
      ranges: { "24h": range24, "7d": range7 },
      turnaround: {
        ratePct,
        avg,
        median,
        pending: pending.length,
        oldest,
        approved,
        rejected,
      },
      rejections,
      perAgent,
    };
  } catch {
    const empty: RangeData = {
      bars: [],
      kpis: [],
      chartSub: "",
      hasData: false,
    };
    return {
      ranges: { "24h": empty, "7d": empty },
      turnaround: {
        ratePct: null,
        avg: "—",
        median: "—",
        pending: 0,
        oldest: "—",
        approved: 0,
        rejected: 0,
      },
      rejections: [],
      perAgent: ROSTER.map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        hue: r.hue,
        ok: "—",
        err: "—",
        errBad: false,
        rate: "—",
        events: "—",
        workers: "—",
        trend: [],
        pending: "—",
        last: "—",
        soon: r.id === "fixer",
      })),
    };
  }
}
