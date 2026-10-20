// Server-only reads for copy requests — one agent asking Scribe (the writer) to
// draft a message. `copy_requests` is BRIDGE-owned; the dashboard only reads it
// and (via a plain sendAgentCommand) nudges a stuck one. Defensive reads.

import { cache } from "react";
import type {
  FlightStatus,
  OSFlightRow,
} from "@/app/dashboard/_data/copy-types";
import { supabaseAdmin } from "@/lib/supabase/server";

export type CopyStatus =
  | "requested"
  | "writing"
  | "drafted"
  | "question"
  | "refused"
  // the writer went quiet; the bridge auto-resends and records resent_at.
  | "stalled";

export type CopyRequest = {
  id: string;
  short_id: string;
  root_id: string;
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
  resent_at: string | null;
};

function norm(row: Record<string, unknown>): CopyRequest {
  const status = String(row.status ?? "requested");
  return {
    id: String(row.id),
    short_id: String(row.short_id ?? ""),
    root_id: String(row.root_id ?? ""),
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
    status: ([
      "requested",
      "writing",
      "drafted",
      "question",
      "refused",
      "stalled",
    ].includes(status)
      ? status
      : "requested") as CopyStatus,
    approval_id:
      row.approval_id == null ? null : Number(row.approval_id) || null,
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    drafted_at: (row.drafted_at as string | null) ?? null,
    resent_at: (row.resent_at as string | null) ?? null,
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

// day-47 "show the actual words": the owner's archive of everything Scribe has
// written — every `copy_requests` row that has a `body`, newest first, each with
// the STATUS of the piece read from its linked approval (pending | approved |
// rejected | sent | published), falling back to the request's own lifecycle when
// there is no approval yet. Defensive like the rest.
export type CopyLibraryRow = CopyRequest & { approvalStatus: string };

export const getCopyLibrary = cache(async function getCopyLibrary(
  limit = 200,
): Promise<CopyLibraryRow[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("copy_requests")
      .select("*")
      .not("body", "is", null)
      .neq("body", "")
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    const rows = ((data as Record<string, unknown>[] | null) ?? []).map(norm);

    // one lookup for every linked approval's status
    const ids = [
      ...new Set(
        rows.map((r) => r.approval_id).filter((n): n is number => n != null),
      ),
    ];
    const statusById = new Map<number, string>();
    if (ids.length) {
      const { data: aps } = await db
        .from("approvals")
        .select("id, status")
        .in("id", ids);
      for (const a of (aps as { id: number; status: string | null }[]) ?? [])
        statusById.set(a.id, String(a.status ?? "").toLowerCase());
    }

    return rows.map((r) => {
      const raw = r.approval_id != null ? statusById.get(r.approval_id) : "";
      // normalise: a held approval still reads as "pending" to the owner
      const approvalStatus =
        raw === "held" ? "pending" : raw || (r.body ? "drafted" : r.status);
      return { ...r, approvalStatus };
    });
  } catch {
    return [];
  }
});

// day-47 "work in flight": copy requests that have not reached the owner yet —
// still being written, questioned, stalled, or refused — in the last 24 h,
// newest first. Shaped for the strip; cached so every window shares one query.
const FLIGHT_STATES = [
  "requested",
  "writing",
  "question",
  "stalled",
  "refused",
] as const;

export const getInFlightCopy = cache(async function getInFlightCopy(
  limit = 80,
): Promise<OSFlightRow[]> {
  try {
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    const { data, error } = await supabaseAdmin()
      .from("copy_requests")
      .select("*")
      .in("status", FLIGHT_STATES as unknown as string[])
      .gte("ts", cutoff)
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? [])
      .map(norm)
      .map((r) => {
        const base = r.resent_at ?? r.ts;
        const ageMin = base
          ? Math.max(0, (Date.now() - new Date(base).getTime()) / 60000)
          : 0;
        return {
          id: r.id,
          forAgent: r.for_agent,
          kind: r.kind,
          who: r.company || r.to || r.contact,
          campaign: r.campaign,
          status: r.status as FlightStatus,
          ageMin,
          approvalId: r.approval_id,
          reason: r.status === "refused" ? r.body : "",
        } satisfies OSFlightRow;
      });
  } catch {
    return [];
  }
});

// day-47 "words" tile: today's copy flow — how many requested / writing /
// questioned / drafted, and the oldest still-waiting request's age in minutes.
export type WordsToday = {
  requested: number;
  writing: number;
  questions: number;
  drafted: number;
  oldestWaitingMin: number;
};

export const getWordsToday = cache(
  async function getWordsToday(): Promise<WordsToday> {
    const empty: WordsToday = {
      requested: 0,
      writing: 0,
      questions: 0,
      drafted: 0,
      oldestWaitingMin: 0,
    };
    try {
      const cutoff = new Date(Date.now() - 86400000).toISOString();
      const { data, error } = await supabaseAdmin()
        .from("copy_requests")
        .select("status, ts, drafted_at, resent_at")
        .or(`ts.gte.${cutoff},drafted_at.gte.${cutoff}`)
        .limit(400);
      if (error) return empty;
      const out = { ...empty };
      let oldest = 0;
      for (const row of (data as Record<string, unknown>[] | null) ?? []) {
        const status = String(row.status ?? "");
        const draftedAt = (row.drafted_at as string | null) ?? null;
        if (draftedAt && draftedAt >= cutoff) out.drafted += 1;
        if (status === "requested") out.requested += 1;
        else if (status === "writing") out.writing += 1;
        else if (status === "question") out.questions += 1;
        if (["requested", "writing", "question"].includes(status)) {
          const base =
            (row.resent_at as string | null) ?? (row.ts as string | null);
          if (base) {
            const min = (Date.now() - new Date(base).getTime()) / 60000;
            if (min > oldest) oldest = min;
          }
        }
      }
      out.oldestWaitingMin = Math.round(oldest);
      return out;
    } catch {
      return empty;
    }
  },
);

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
