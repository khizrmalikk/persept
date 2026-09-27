// Read-only, server-only access to the agents' background workers (OpenClaw
// sub-agents), mirrored by the bridge into the `subagents` table. The dashboard
// only READS this table — it never writes it (workers are bridge-owned).
//
// Defensive by design: the table may not exist yet on a fresh bridge, so every
// read returns [] rather than throwing / breaking the page.

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Subagent } from "@/lib/workforce/types";

const COLS =
  "session_key, agent_id, label, status, model, started_at, last_active_at, updated_at";

const rank = (s: Subagent) => (s.status === "running" ? 0 : 1);

/** Workers for one agent — running first, then newest — capped (for the panel). */
export async function getAgentSubagents(
  agentId: string,
  limit = 8,
): Promise<Subagent[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("subagents")
      .select(COLS)
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false })
      .limit(50);
    const rows = (data as Subagent[] | null) ?? [];
    rows.sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
    );
    return rows.slice(0, limit);
  } catch {
    return [];
  }
}

/** All workers that are running OR finished within the last 10 minutes (for the viz). */
export async function getActiveSubagents(): Promise<Subagent[]> {
  const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  try {
    const { data } = await supabaseAdmin()
      .from("subagents")
      .select(COLS)
      .or(`status.eq.running,updated_at.gte.${tenMinAgo}`)
      .order("updated_at", { ascending: false })
      .limit(200);
    return (data as Subagent[] | null) ?? [];
  } catch {
    return [];
  }
}

/** Currently-running workers for one agent (used by the /api/workforce/workers route). */
export async function getRunningWorkers(agentId: string): Promise<Subagent[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("subagents")
      .select(COLS)
      .eq("agent_id", agentId)
      .eq("status", "running")
      .order("updated_at", { ascending: false })
      .limit(20);
    return (data as Subagent[] | null) ?? [];
  } catch {
    return [];
  }
}
