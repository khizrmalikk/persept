import { supabaseAdmin } from "@/lib/supabase/server";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import type { OSDesktop, OSEvent, OSGoal, OSRun } from "./desktop-types";

// Desktop widgets: goals (dashboard-owned), the activity feed (events), and
// today's scheduled runs (runs_schedule). All defensive — a missing table just
// yields an empty widget.

const AGENTS = new Set<AgentKey>([
  "percy",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
]);
const asAgent = (v: unknown): AgentKey =>
  AGENTS.has(v as AgentKey) ? (v as AgentKey) : "percy";

const safe = async <T>(
  p: PromiseLike<{ data: T | null }>,
): Promise<T | null> => {
  try {
    return (await p).data;
  } catch {
    return null;
  }
};

export async function loadDesktop(): Promise<OSDesktop> {
  const db = supabaseAdmin();
  const [goalRows, eventRows, runRows] = await Promise.all([
    safe(
      db
        .from("goals")
        .select("label, period, value, target, sort")
        .order("sort", { ascending: true }),
    ),
    safe(
      db
        .from("events")
        .select("id, ts, agent_id, kind, summary, payload")
        .order("ts", { ascending: false })
        .limit(8),
    ),
    safe(
      db
        .from("runs_schedule")
        .select("time, agent, name, status")
        .order("time", { ascending: true }),
    ),
  ]);

  const goals: OSGoal[] = (
    (goalRows as
      | { label: string; period: string; value: number; target: number }[]
      | null) ?? []
  ).map((g) => ({
    label: g.label,
    period: g.period ?? "",
    value: g.value ?? 0,
    target: g.target ?? 0,
  }));

  const feed: OSEvent[] = (
    (eventRows as
      | {
          id: number | string;
          ts: string | null;
          agent_id: string | null;
          kind: string | null;
          summary: string | null;
          payload: unknown;
        }[]
      | null) ?? []
  )
    .slice(0, 5)
    .map((e) => {
      const payloadText = (e.payload as { text?: string } | null)?.text ?? "";
      return {
        id: String(e.id),
        agent: asAgent(e.agent_id),
        kind: (e.kind ?? "run").toLowerCase(),
        text: (e.summary || payloadText || "").slice(0, 120),
        when: ago(e.ts),
      };
    });

  const toMinutes = (t: string) => {
    const m = t.match(/(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  };
  const runs: OSRun[] = (
    (runRows as
      | { time: string; agent: string; name: string; status: string }[]
      | null) ?? []
  ).map((r) => ({
    minutes: toMinutes(r.time ?? "0:00"),
    agent: asAgent(r.agent),
    name: r.name ?? "run",
    status: (["planned", "done", "missed", "rerun"].includes(r.status)
      ? r.status
      : "planned") as OSRun["status"],
  }));

  return { goals, feed, runs };
}
