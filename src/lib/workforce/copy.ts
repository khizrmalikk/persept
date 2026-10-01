// Server-only reads for copy requests — one agent asking Scribe (the writer) to
// draft a message. `copy_requests` is BRIDGE-owned; the dashboard only reads it
// and (via a plain sendAgentCommand) nudges a stuck one. Defensive reads.

import { supabaseAdmin } from "@/lib/supabase/server";

export type CopyStatus = "requested" | "writing" | "drafted";

export type CopyRequest = {
  id: string;
  short_id: string;
  ts: string | null;
  for_agent: string;
  writer: string;
  kind: string;
  channel: string;
  to: string;
  company: string;
  contact: string;
  campaign: string;
  thread: string;
  image: string;
  context: string;
  status: CopyStatus;
  approval_id: number | null;
  subject: string;
  body: string;
  drafted_at: string | null;
};

function norm(row: Record<string, unknown>): CopyRequest {
  const status = String(row.status ?? "requested");
  return {
    id: String(row.id),
    short_id: String(row.short_id ?? ""),
    ts: (row.ts as string | null) ?? null,
    for_agent: String(row.for_agent ?? ""),
    writer: String(row.writer ?? ""),
    kind: String(row.kind ?? ""),
    channel: String(row.channel ?? ""),
    to: String(row.to ?? ""),
    company: String(row.company ?? ""),
    contact: String(row.contact ?? ""),
    campaign: String(row.campaign ?? ""),
    thread: String(row.thread ?? ""),
    image: String(row.image ?? ""),
    context: String(row.context ?? ""),
    status: (["requested", "writing", "drafted"].includes(status)
      ? status
      : "requested") as CopyStatus,
    approval_id:
      row.approval_id == null ? null : Number(row.approval_id) || null,
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    drafted_at: (row.drafted_at as string | null) ?? null,
  };
}

// The last `limit` copy requests for an agent. `by` selects the column: "for"
// (Hunter/Muse — requests they raised) or "writer" (Scribe — requests it writes).
export async function getCopyRequests(
  agentId: string,
  by: "for" | "writer",
  limit = 30,
): Promise<CopyRequest[]> {
  try {
    const column = by === "writer" ? "writer" : "for_agent";
    const { data, error } = await supabaseAdmin()
      .from("copy_requests")
      .select("*")
      .eq(column, agentId)
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// Average minutes from request (ts) to draft (drafted_at) across the given rows.
// null when nothing has been drafted yet. Pure — safe to call after a read.
export function averageDraftMinutes(rows: CopyRequest[]): number | null {
  const spans: number[] = [];
  for (const r of rows) {
    if (!r.ts || !r.drafted_at) continue;
    const ms = new Date(r.drafted_at).getTime() - new Date(r.ts).getTime();
    if (Number.isFinite(ms) && ms >= 0) spans.push(ms / 60000);
  }
  if (!spans.length) return null;
  return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);
}
