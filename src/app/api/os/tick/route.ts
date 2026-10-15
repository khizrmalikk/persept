import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fxToAed } from "@/lib/workforce/stripe";

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
    backlogRow,
    prospectsRow,
    stripeRow,
    paymentsRow,
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
    // the backlog polls this: the bridge bumps backlog.updated_at on every BACKLOG
    // block (started/doing/blocked/stalled/done), so a card moves within ~5s.
    scalar(
      db
        .from("backlog")
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
    // the money surfaces poll this: the bridge bumps stripe_accounts.updated_at
    // on every 15-min mirror, so the money tab/tiles refresh within ~5s.
    scalar(
      db
        .from("stripe_accounts")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    // the payments list polls this: the bridge inserts a payments row (and may
    // link it to a prospect), so the money tab / deal panel refresh within ~5s.
    scalar(
      db
        .from("payments")
        .select("created_at")
        .order("created_at", { ascending: false })
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
      backlog_updated_at:
        (backlogRow as { updated_at?: string } | null)?.updated_at ?? null,
      prospects_updated_at:
        (prospectsRow as { updated_at?: string } | null)?.updated_at ?? null,
      stripe_updated_at:
        (stripeRow as { updated_at?: string } | null)?.updated_at ?? null,
      payments_updated_at:
        (paymentsRow as { created_at?: string } | null)?.created_at ?? null,
      // static, but cheap to ship here so the client has the bridge's FX without
      // a second request (also at /api/os/config).
      stripe_fx_to_aed: fxToAed(),
      vps_ts: (vpsRow as { ts?: string } | null)?.ts ?? null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
