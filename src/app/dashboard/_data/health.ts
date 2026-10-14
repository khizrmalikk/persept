import { supabaseAdmin } from "@/lib/supabase/server";

// Stale-data guards (§4): the cost ledger hasn't run (integrations.ledger.status =
// pending) or the vps hasn't reported a metrics row in the last 10 minutes. Both
// the command today tab and the agent pages show a one-line amber notice from
// these so stale numbers are never mistaken for live ones. Defensive: a missing
// table yields `false` (no false alarms before the bridge is set up).
export type OSHealthFlags = { vpsStale: boolean; ledgerPending: boolean };

const TEN_MIN = 10 * 60 * 1000;

export async function loadHealthFlags(): Promise<OSHealthFlags> {
  const db = supabaseAdmin();
  const [vps, ledger] = await Promise.all([
    (async () => {
      try {
        return (
          await db.from("vps_metrics").select("ts").eq("id", 1).maybeSingle()
        ).data as { ts?: string } | null;
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        return (
          await db
            .from("integrations")
            .select("status")
            .eq("id", "ledger")
            .maybeSingle()
        ).data as { status?: string } | null;
      } catch {
        return null;
      }
    })(),
  ]);

  // stale only when a row exists and is older than 10 min — no row at all means
  // the bridge hasn't started reporting, which the "—" placeholders already show.
  const ts = vps?.ts ? Date.parse(vps.ts) : Number.NaN;
  const vpsStale = !Number.isNaN(ts) && Date.now() - ts > TEN_MIN;
  const ledgerPending = (ledger?.status ?? "") === "pending";
  return { vpsStale, ledgerPending };
}

// The one-line message for a set of flags, or null when all is fresh. Shared so
// the command tab and agent pages word it identically.
export function staleNoticeText(flags: OSHealthFlags): string | null {
  if (flags.vpsStale)
    return "the bridge has not reported in the last 10 minutes";
  if (flags.ledgerPending) return "the cost ledger has not run yet";
  return null;
}
