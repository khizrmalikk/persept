import { supabaseAdmin } from "@/lib/supabase/server";

// Operations Percy runs on the system. One row per op in the bridge-owned `ops`
// table; this app only READS it (writes go out as OPS-block messages on
// `actions`, which the bridge turns into ops rows). Defensive: a missing table
// yields an empty list, never a 500. See docs / bridge schema.sql.

export type OSOpStatus =
  | "queued"
  | "awaiting_approval"
  | "running"
  | "done"
  | "failed"
  | "rejected";

export type OSOp = {
  id: string;
  ts: string; // ISO
  verb: string;
  args: string; // normalised to a single display string
  why: string;
  tier: "auto" | "approval";
  host: boolean;
  status: OSOpStatus;
  durationMs: number | null;
  result: string;
  before: unknown;
  after: unknown;
};

type OpRow = {
  id: string;
  ts: string | null;
  verb: string | null;
  args: unknown;
  why: string | null;
  tier: string | null;
  host: boolean | null;
  status: string | null;
  duration_ms: number | null;
  result: string | null;
  before: unknown;
  after: unknown;
};

const STATUSES: OSOpStatus[] = [
  "queued",
  "awaiting_approval",
  "running",
  "done",
  "failed",
  "rejected",
];

function asArgs(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

export async function loadOps(limit = 20): Promise<OSOp[]> {
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("ops")
      .select(
        "id, ts, verb, args, why, tier, host, status, duration_ms, result, before, after",
      )
      .order("ts", { ascending: false })
      .limit(limit);
    return ((data as OpRow[] | null) ?? []).map((r) => ({
      id: String(r.id),
      ts: (r.ts ?? "").trim(),
      verb: (r.verb ?? "").trim(),
      args: asArgs(r.args),
      why: (r.why ?? "").trim(),
      tier: r.tier === "approval" ? "approval" : "auto",
      host: !!r.host,
      status: STATUSES.includes(r.status as OSOpStatus)
        ? (r.status as OSOpStatus)
        : "queued",
      durationMs: r.duration_ms ?? null,
      result: (r.result ?? "").toString(),
      before: r.before ?? null,
      after: r.after ?? null,
    }));
  } catch {
    return [];
  }
}
