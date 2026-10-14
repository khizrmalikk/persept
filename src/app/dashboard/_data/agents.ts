import { supabaseAdmin } from "@/lib/supabase/server";
import { ROSTER } from "@/lib/workforce/roster";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import type { AgentKey } from "../_components/Persona";

export type OSStatus = "working" | "waiting" | "idle" | "soon";

// Per the day-30 bridge contract: per-agent CPU/memory are NOT provided — the
// workforce is costed, not metered. So each agent carries today's cost + tokens
// and a budget, and the map ring is cost-against-prorated-budget, not CPU.
export type OSAgent = {
  id: AgentKey;
  name: string;
  room: string;
  mandate: string;
  status: OSStatus;
  costToday: number;
  costMonth: number;
  tokensToday: number;
  budgetUsd: number | null;
  model: string; // parsed `provider/model`, "" when unset
  // cost_today / (budget_usd / days-in-month), 0..100 — the node ring + vps bar
  ringPct: number;
  task: string; // agents.current_task, "" when nothing is running (no fixtures)
  from: string[];
  to: string[];
  lastActive: string; // agents.last_active_at (ISO), "" when never
};

// agents.model used to hold the gateway's object ({"primary": "..."}); day-34+ it's
// a plain `provider/model` string. Parse both so the UI only ever sees a string.
export function parseModel(raw: string | null): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s) as { primary?: unknown; model?: unknown };
      return String(o.primary ?? o.model ?? "").trim();
    } catch {
      return "";
    }
  }
  return s;
}

type AgentRow = {
  id: string;
  status: string | null;
  current_task: string | null;
  cost_today: number | null;
  tokens_today: number | null;
  cost_month: number | null;
  budget_usd: number | null;
  model: string | null;
  last_active_at: string | null;
};

const daysInMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

export async function loadAgents(): Promise<{
  agents: OSAgent[];
  pending: number;
  working: number;
}> {
  let pending = 0;
  const rowById = new Map<string, AgentRow>();
  const pendingByAgent = new Map<string, number>();
  const workersByAgent = new Map<string, number>();

  try {
    const db = supabaseAdmin();
    const [{ data: agentRows }, { data: pendingRows }, workerRows] =
      await Promise.all([
        db
          .from("agents")
          .select(
            "id, status, current_task, cost_today, tokens_today, cost_month, budget_usd, model, last_active_at",
          ),
        db.from("approvals").select("agent_id").eq("status", "pending"),
        getActiveSubagents(),
      ]);
    for (const a of (agentRows as AgentRow[] | null) ?? [])
      rowById.set(a.id, a);
    for (const p of (pendingRows as { agent_id: string | null }[] | null) ??
      []) {
      pending += 1;
      if (p.agent_id)
        pendingByAgent.set(
          p.agent_id,
          (pendingByAgent.get(p.agent_id) ?? 0) + 1,
        );
    }
    for (const w of workerRows)
      if (w.status === "running" && w.agent_id)
        workersByAgent.set(
          w.agent_id,
          (workersByAgent.get(w.agent_id) ?? 0) + 1,
        );
  } catch {
    // DB/columns unreachable — fall through; everyone shows idle/soon, zero cost.
  }

  const dim = daysInMonth();
  let working = 0;
  const agents: OSAgent[] = ROSTER.map((r) => {
    const row = rowById.get(r.id);
    const deployed = !!row;
    const waiting = (pendingByAgent.get(r.id) ?? 0) > 0;
    const busy =
      row?.status === "working" || (workersByAgent.get(r.id) ?? 0) > 0;
    const status: OSStatus = !deployed
      ? "soon"
      : waiting
        ? "waiting"
        : busy
          ? "working"
          : "idle";
    if (status === "working" || status === "waiting") working += 1;

    const costToday = row?.cost_today ?? 0;
    const budgetUsd = row?.budget_usd ?? null;
    const perDay = budgetUsd && budgetUsd > 0 ? budgetUsd / dim : 0;
    const ringPct = perDay > 0 ? Math.min(100, (costToday / perDay) * 100) : 0;

    return {
      id: r.id as AgentKey,
      name: r.name,
      room: r.room,
      mandate: r.mandate,
      status,
      costToday,
      costMonth: row?.cost_month ?? 0,
      tokensToday: row?.tokens_today ?? 0,
      budgetUsd,
      model: parseModel(row?.model ?? null),
      ringPct,
      // current_task or "" — the UI shows "nothing running"; never a fixture.
      task: (row?.current_task ?? "").trim(),
      from: r.from,
      to: r.to,
      lastActive: (row?.last_active_at ?? "").trim(),
    };
  });

  return { agents, pending, working };
}

// The single vps_metrics row (id = 1), written every minute by the bridge. Null
// when the table/row isn't there yet so the shell degrades gracefully.
export type OSVps = {
  cpuPct: number;
  memUsed: number;
  memTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptimeS: number;
  monthSpend: number;
  budgetUsd: number | null;
};

export async function loadVps(): Promise<OSVps | null> {
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("vps_metrics")
      .select(
        "cpu_pct, mem_total, mem_used, disk_total, disk_used, uptime_s, month_spend_usd, budget_usd",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return null;
    const r = data as {
      cpu_pct: number | null;
      mem_total: number | null;
      mem_used: number | null;
      disk_total: number | null;
      disk_used: number | null;
      uptime_s: number | null;
      month_spend_usd: number | null;
      budget_usd: number | null;
    };
    return {
      cpuPct: Math.round(r.cpu_pct ?? 0),
      memUsed: r.mem_used ?? 0,
      memTotal: r.mem_total ?? 0,
      diskUsed: r.disk_used ?? 0,
      diskTotal: r.disk_total ?? 0,
      uptimeS: r.uptime_s ?? 0,
      monthSpend: r.month_spend_usd ?? 0,
      budgetUsd: r.budget_usd ?? null,
    };
  } catch {
    return null;
  }
}
