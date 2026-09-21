// Read-only, server-only aggregation for the AI-workforce dashboard.
//
// This module ONLY reads. It never inserts/updates/deletes — the sole writers in this
// codebase are `actions.ts` and `auth-actions.ts`. Every function fetches its own bounded
// row set (capped `.limit()`, cutoff filters) and aggregates in JS, because SQL
// GROUP BY / RPC is not available on this project. All functions handle null/empty data
// gracefully (return zeros/empty, never throw). Must only run in server components — no
// "use client".

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Agent, Approval, Task, WfEvent } from "@/lib/workforce/types";

const TZ = "Asia/Dubai";
const ROW_CAP = 2000;
const MS_MIN = 60_000;
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// small pure helpers
// ---------------------------------------------------------------------------

/** Bucket key + label for an ISO timestamp, in Asia/Dubai, at hour or day granularity. */
function bucketOf(
  iso: string,
  granularity: "hour" | "day",
): { key: string; label: string } {
  const d = new Date(iso);
  // Extract the Dubai-local wall-clock parts deterministically via Intl.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  if (hour === "24") hour = "00"; // some engines emit 24 for midnight
  const weekday = get("weekday"); // e.g. "Mon"

  if (granularity === "hour") {
    return { key: `${year}-${month}-${day}T${hour}`, label: `${hour}:00` };
  }
  return { key: `${year}-${month}-${day}`, label: weekday };
}

/** Median of a numeric list, or null when empty. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Build an ordered list of contiguous buckets covering [start, now], oldest→newest.
 * Anchors on `now` and steps back so the newest bucket is the current hour/day.
 */
function bucketTimeline(
  now: Date,
  count: number,
  granularity: "hour" | "day",
): { key: string; label: string; t: string }[] {
  const step = granularity === "hour" ? MS_HOUR : MS_DAY;
  const out: { key: string; label: string; t: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * step);
    const { key, label } = bucketOf(d.toISOString(), granularity);
    out.push({ key, label, t: d.toISOString() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// throughput
// ---------------------------------------------------------------------------

export type ThroughputBucket = {
  t: string;
  label: string;
  events: number;
  runs: number;
};
export type Throughput = {
  window: "24h" | "7d";
  buckets: ThroughputBucket[]; // 24 hourly buckets for 24h, or 7 daily buckets for 7d, oldest→newest
  totalEvents: number;
  totalRuns: number; // task runs started in window
  busiestLabel: string | null; // label of the bucket with most events
};

export async function getThroughput(
  window: "24h" | "7d" = "24h",
): Promise<Throughput> {
  const db = supabaseAdmin();
  const now = new Date();
  const granularity: "hour" | "day" = window === "24h" ? "hour" : "day";
  const count = window === "24h" ? 24 : 7;
  const spanMs = window === "24h" ? 24 * MS_HOUR : 7 * MS_DAY;
  const cutoffISO = new Date(now.getTime() - spanMs).toISOString();

  const timeline = bucketTimeline(now, count, granularity);
  // Aggregate onto an index keyed by bucket key. If two timeline slots map to the same
  // key (should not happen with fixed steps) the first wins; counts still sum correctly.
  const index = new Map<string, ThroughputBucket>();
  const order: string[] = [];
  for (const b of timeline) {
    if (!index.has(b.key)) {
      index.set(b.key, { t: b.t, label: b.label, events: 0, runs: 0 });
      order.push(b.key);
    }
  }

  const [eventsRes, tasksRes] = await Promise.all([
    db
      .from("events")
      .select("ts")
      .gte("ts", cutoffISO)
      .order("ts", { ascending: false })
      .limit(ROW_CAP),
    db
      .from("tasks")
      .select("started_at")
      .gte("started_at", cutoffISO)
      .order("started_at", { ascending: false })
      .limit(ROW_CAP),
  ]);

  const events = (eventsRes.data ?? []) as Pick<WfEvent, "ts">[];
  const tasks = (tasksRes.data ?? []) as Pick<Task, "started_at">[];

  let totalEvents = 0;
  for (const e of events) {
    if (!e.ts) continue;
    const { key } = bucketOf(e.ts, granularity);
    const bucket = index.get(key);
    if (bucket) {
      bucket.events += 1;
      totalEvents += 1;
    }
  }

  let totalRuns = 0;
  for (const t of tasks) {
    if (!t.started_at) continue;
    const { key } = bucketOf(t.started_at, granularity);
    const bucket = index.get(key);
    if (bucket) {
      bucket.runs += 1;
      totalRuns += 1;
    }
  }

  const buckets = order.map((k) => index.get(k) as ThroughputBucket);

  let busiestLabel: string | null = null;
  let busiestCount = -1;
  for (const b of buckets) {
    if (b.events > busiestCount) {
      busiestCount = b.events;
      busiestLabel = b.label;
    }
  }
  if (busiestCount <= 0) busiestLabel = null; // no events → no meaningful busiest bucket

  return { window, buckets, totalEvents, totalRuns, busiestLabel };
}

// ---------------------------------------------------------------------------
// approvals
// ---------------------------------------------------------------------------

export type ApprovalStats = {
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number | null; // approved / (approved+rejected), 0..1, null if none decided
  avgDecisionMins: number | null; // mean of (decided_at - ts) in minutes over recent decided approvals
  medianDecisionMins: number | null;
  oldestPendingTs: string | null; // ts of the longest-waiting pending approval
};

export async function getApprovalStats(): Promise<ApprovalStats> {
  const db = supabaseAdmin();

  const [pendingRes, oldestPendingRes, decidedRes] = await Promise.all([
    // Cheap count of pending, no rows returned.
    db
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Longest-waiting pending approval (smallest ts).
    db
      .from("approvals")
      .select("ts")
      .eq("status", "pending")
      .order("ts", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Recent decided sample for rate + decision-time stats.
    db
      .from("approvals")
      .select("ts, status, decided_at")
      .neq("status", "pending")
      .order("decided_at", { ascending: false })
      .limit(200),
  ]);

  const pending = pendingRes.count ?? 0;
  const oldestPendingTs =
    (oldestPendingRes.data as Pick<Approval, "ts"> | null)?.ts ?? null;
  const decided = (decidedRes.data ?? []) as Pick<
    Approval,
    "ts" | "status" | "decided_at"
  >[];

  let approved = 0;
  let rejected = 0;
  const decisionMins: number[] = [];
  for (const a of decided) {
    if (a.status === "approved") approved += 1;
    else if (a.status === "rejected") rejected += 1;
    if (a.ts && a.decided_at) {
      const delta =
        (new Date(a.decided_at).getTime() - new Date(a.ts).getTime()) / MS_MIN;
      if (Number.isFinite(delta) && delta >= 0) decisionMins.push(delta);
    }
  }

  const totalDecided = approved + rejected;
  const approvalRate = totalDecided > 0 ? approved / totalDecided : null;
  const avgDecisionMins =
    decisionMins.length > 0
      ? round1(decisionMins.reduce((s, v) => s + v, 0) / decisionMins.length)
      : null;
  const med = median(decisionMins);
  const medianDecisionMins = med === null ? null : round1(med);

  return {
    pending,
    approved,
    rejected,
    approvalRate,
    avgDecisionMins,
    medianDecisionMins,
    oldestPendingTs,
  };
}

// ---------------------------------------------------------------------------
// per-agent productivity
// ---------------------------------------------------------------------------

export type AgentProductivity = {
  agentId: string;
  runsOk: number;
  runsError: number;
  successRate: number | null; // runsOk / (runsOk+runsError), null if no finished runs
  events24h: number;
  pending: number; // pending approvals for this agent
  lastActiveAt: string | null;
  activity24h: number[]; // 24 numbers, events per hour for the last 24h (oldest→newest), for a sparkline
};

export async function getAgentProductivity(): Promise<AgentProductivity[]> {
  const db = supabaseAdmin();
  const now = new Date();
  const cutoff24hISO = new Date(now.getTime() - 24 * MS_HOUR).toISOString();
  const cutoff7dISO = new Date(now.getTime() - 7 * MS_DAY).toISOString();

  const [agentsRes, tasksRes, eventsRes, approvalsRes] = await Promise.all([
    db
      .from("agents")
      .select("id, last_active_at")
      .order("last_active_at", { ascending: false, nullsFirst: false })
      .limit(ROW_CAP),
    db
      .from("tasks")
      .select("agent_id, status, started_at")
      .gte("started_at", cutoff7dISO)
      .order("started_at", { ascending: false })
      .limit(ROW_CAP),
    db
      .from("events")
      .select("agent_id, ts")
      .gte("ts", cutoff24hISO)
      .order("ts", { ascending: false })
      .limit(ROW_CAP),
    db
      .from("approvals")
      .select("agent_id")
      .eq("status", "pending")
      .limit(ROW_CAP),
  ]);

  const agents = (agentsRes.data ?? []) as Pick<
    Agent,
    "id" | "last_active_at"
  >[];
  const tasks = (tasksRes.data ?? []) as Pick<
    Task,
    "agent_id" | "status" | "started_at"
  >[];
  const events = (eventsRes.data ?? []) as Pick<WfEvent, "agent_id" | "ts">[];
  const approvals = (approvalsRes.data ?? []) as Pick<Approval, "agent_id">[];

  // The 24 hourly bucket keys for the last 24h, oldest→newest, so each agent's
  // activity24h array lines up positionally.
  const timeline = bucketTimeline(now, 24, "hour");
  const slotOfKey = new Map<string, number>();
  timeline.forEach((b, i) => {
    if (!slotOfKey.has(b.key)) slotOfKey.set(b.key, i);
  });

  type Acc = {
    runsOk: number;
    runsError: number;
    events24h: number;
    pending: number;
    lastActiveAt: string | null;
    activity24h: number[];
  };
  const make = (lastActiveAt: string | null): Acc => ({
    runsOk: 0,
    runsError: 0,
    events24h: 0,
    pending: 0,
    lastActiveAt,
    activity24h: new Array<number>(24).fill(0),
  });

  const acc = new Map<string, Acc>();
  for (const a of agents) acc.set(a.id, make(a.last_active_at ?? null));

  // Tasks over last 7d → success/error counts. Only finished runs (ok/error) count
  // toward successRate; running/null are ignored for the rate but not fatal.
  for (const t of tasks) {
    if (!t.agent_id) continue;
    const row = acc.get(t.agent_id);
    if (!row) continue; // ignore tasks for agents not in the agents table
    if (t.status === "ok") row.runsOk += 1;
    else if (t.status === "error") row.runsError += 1;
  }

  // Events over last 24h → total + hourly sparkline.
  for (const e of events) {
    if (!e.agent_id || !e.ts) continue;
    const row = acc.get(e.agent_id);
    if (!row) continue;
    row.events24h += 1;
    const { key } = bucketOf(e.ts, "hour");
    const slot = slotOfKey.get(key);
    if (slot !== undefined) row.activity24h[slot] += 1;
  }

  // Pending approvals per agent.
  for (const ap of approvals) {
    if (!ap.agent_id) continue;
    const row = acc.get(ap.agent_id);
    if (row) row.pending += 1;
  }

  return agents.map((a) => {
    const row = acc.get(a.id) as Acc;
    const finished = row.runsOk + row.runsError;
    return {
      agentId: a.id,
      runsOk: row.runsOk,
      runsError: row.runsError,
      successRate: finished > 0 ? row.runsOk / finished : null,
      events24h: row.events24h,
      pending: row.pending,
      lastActiveAt: row.lastActiveAt,
      activity24h: row.activity24h,
    };
  });
}

// ---------------------------------------------------------------------------
// health
// ---------------------------------------------------------------------------

export type Health = {
  bridgeSeenAt: string | null;
  bridgeStale: boolean; // true if no heartbeat or older than 30s
  agentsOnline: number; // agents whose status != offline (and != null)
  agentsTotal: number;
  errorRate: number | null; // error events / total events over last 24h, 0..1, null if no events
  recentErrors: {
    agentId: string | null;
    summary: string | null;
    ts: string;
  }[]; // up to 5, newest first
};

export async function getHealth(): Promise<Health> {
  const db = supabaseAdmin();
  const now = new Date();
  const cutoff24hISO = new Date(now.getTime() - 24 * MS_HOUR).toISOString();

  const [instanceRes, agentsRes, eventsRes] = await Promise.all([
    db.from("instance").select("last_seen_at").limit(1).maybeSingle(),
    db.from("agents").select("status").limit(ROW_CAP),
    db
      .from("events")
      .select("agent_id, kind, summary, ts")
      .gte("ts", cutoff24hISO)
      .order("ts", { ascending: false })
      .limit(ROW_CAP),
  ]);

  const bridgeSeenAt =
    (instanceRes.data as { last_seen_at: string | null } | null)
      ?.last_seen_at ?? null;
  const bridgeStale =
    !bridgeSeenAt || now.getTime() - new Date(bridgeSeenAt).getTime() > 30_000;

  const agents = (agentsRes.data ?? []) as Pick<Agent, "status">[];
  const agentsTotal = agents.length;
  const agentsOnline = agents.filter(
    (a) => a.status != null && a.status !== "offline",
  ).length;

  const events = (eventsRes.data ?? []) as Pick<
    WfEvent,
    "agent_id" | "kind" | "summary" | "ts"
  >[];
  const totalEvents = events.length;
  let errorCount = 0;
  const recentErrors: {
    agentId: string | null;
    summary: string | null;
    ts: string;
  }[] = [];
  // events arrive newest→oldest, so pushing in order keeps recentErrors newest-first.
  for (const e of events) {
    if (e.kind === "error") {
      errorCount += 1;
      if (recentErrors.length < 5 && e.ts) {
        recentErrors.push({
          agentId: e.agent_id ?? null,
          summary: e.summary ?? null,
          ts: e.ts,
        });
      }
    }
  }
  const errorRate = totalEvents > 0 ? errorCount / totalEvents : null;

  return {
    bridgeSeenAt,
    bridgeStale,
    agentsOnline,
    agentsTotal,
    errorRate,
    recentErrors,
  };
}

// ---------------------------------------------------------------------------
// convenience: everything in one round of parallel fetches
// ---------------------------------------------------------------------------

export async function getDashboardMetrics(): Promise<{
  throughput: Throughput;
  approvals: ApprovalStats;
  productivity: AgentProductivity[];
  health: Health;
}> {
  const [throughput, approvals, productivity, health] = await Promise.all([
    getThroughput("24h"),
    getApprovalStats(),
    getAgentProductivity(),
    getHealth(),
  ]);
  return { throughput, approvals, productivity, health };
}
