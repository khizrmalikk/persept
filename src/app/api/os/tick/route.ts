import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// The OS live-update heartbeat. The shell polls this every 5s (15s when the tab
// is hidden) and only calls router.refresh() when a value changed — so one cheap
// request replaces blanket refresh timers, and no table is exposed to the client
// (service key, server-side). Everything is defensive: a missing table yields a
// null/0 for that field, never a 500.

export const dynamic = "force-dynamic";

const num = async (p: PromiseLike<{ count: number | null }>) => {
  try {
    return (await p).count ?? 0;
  } catch {
    return 0;
  }
};
const scalar = async <T>(
  p: PromiseLike<{ data: T | null }>,
): Promise<T | null> => {
  try {
    return (await p).data;
  } catch {
    return null;
  }
};

export async function GET() {
  const db = supabaseAdmin();

  const [
    approvals_pending,
    fixes_running,
    eventsRow,
    goalsRow,
    prospectsRow,
    vpsRow,
  ] = await Promise.all([
    num(
      db
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    num(
      db
        .from("fixes")
        .select("id", { count: "exact", head: true })
        .eq("status", "running"),
    ),
    scalar(
      db
        .from("events")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    // the war room polls this: the bridge bumps goals.updated_at when it flips
    // `planning` false (a PLAN landed), writes steps/phases, or a live `cur` moves.
    scalar(
      db
        .from("goals")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    scalar(
      db
        .from("prospects")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    scalar(db.from("vps_metrics").select("ts").eq("id", 1).maybeSingle()),
  ]);

  return NextResponse.json(
    {
      approvals_pending,
      fixes_running,
      events_max_id: (eventsRow as { id?: number } | null)?.id ?? 0,
      goals_updated_at:
        (goalsRow as { updated_at?: string } | null)?.updated_at ?? null,
      prospects_updated_at:
        (prospectsRow as { updated_at?: string } | null)?.updated_at ?? null,
      vps_ts: (vpsRow as { ts?: string } | null)?.ts ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
