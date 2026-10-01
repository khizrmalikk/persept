// Server-only reads for the ideas inbox — suggestions agents raise for the owner.
// `ideas` is BRIDGE-owned (agents insert rows; Chief escalates by raising an
// approval); the dashboard only flips `status` to `dismiss` (see actions.ts) or
// tells Chief to decide. Reads are DEFENSIVE: a missing table returns empty.

import { supabaseAdmin } from "@/lib/supabase/server";

export type IdeaStatus = "open" | "dismiss" | "escalated" | "done";

export type Idea = {
  id: string;
  short_id: string;
  ts: string | null;
  agent_id: string;
  title: string;
  why: string;
  what: string;
  needs: string;
  cost: string;
  status: IdeaStatus;
  reason: string;
  decided_at: string | null;
};

function norm(row: Record<string, unknown>): Idea {
  const status = String(row.status ?? "open");
  return {
    id: String(row.id),
    short_id: String(row.short_id ?? ""),
    ts: (row.ts as string | null) ?? null,
    agent_id: String(row.agent_id ?? ""),
    title: String(row.title ?? ""),
    why: String(row.why ?? ""),
    what: String(row.what ?? ""),
    needs: String(row.needs ?? ""),
    cost: String(row.cost ?? ""),
    status: (["open", "dismiss", "escalated", "done"].includes(status)
      ? status
      : "open") as IdeaStatus,
    reason: String(row.reason ?? ""),
    decided_at: (row.decided_at as string | null) ?? null,
  };
}

// Active ideas (open + escalated), newest first.
export async function getActiveIdeas(limit = 50): Promise<Idea[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("ideas")
      .select("*")
      .in("status", ["open", "escalated"])
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// Decided ideas (dismissed + done), newest decision first.
export async function getDecidedIdeas(limit = 20): Promise<Idea[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("ideas")
      .select("*")
      .in("status", ["dismiss", "done"])
      .order("decided_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// Count of ideas still waiting for a decision (status open) — the home-page line.
export async function getOpenIdeaCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin()
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// For each escalated idea, the open approval Chief raised for it — matched by the
// idea's short_id appearing in the approval's `why` or `raw`. Returns a map
// short_id → approval id. Defensive; approvals without `raw` still match on `why`.
export async function getEscalatedApprovalMap(
  shortIds: string[],
): Promise<Record<string, number>> {
  const ids = shortIds.map((s) => s.trim()).filter(Boolean);
  if (!ids.length) return {};
  try {
    const { data, error } = await supabaseAdmin()
      .from("approvals")
      .select("*")
      .in("status", ["pending", "held"])
      .order("ts", { ascending: false })
      .limit(200);
    if (error) return {};
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    const out: Record<string, number> = {};
    for (const sid of ids) {
      const hit = rows.find((r) => {
        const hay = `${String(r.why ?? "")} ${String(r.raw ?? "")}`;
        return hay.includes(sid);
      });
      if (hit && hit.id != null) out[sid] = Number(hit.id);
    }
    return out;
  } catch {
    return {};
  }
}
