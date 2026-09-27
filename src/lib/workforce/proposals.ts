// Server-only reads + the public view-counter for Scribe's proposals.
//
// `proposals` is BRIDGE-owned: the bridge upserts a row whenever Scribe writes/edits
// a file under proposals/ in its workspace (markdown stored without front matter).
// The dashboard only updates `status`, `view_count`, and the viewed/sent timestamps
// (see actions.ts + recordProposalView below). Reads are DEFENSIVE: a missing table
// returns empty rather than throwing. See docs/workforce-dashboard.md.

import { supabaseAdmin } from "@/lib/supabase/server";

export type ProposalStatus =
  | "draft"
  | "approved"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined";

export type Proposal = {
  id: string;
  agent_id: string;
  path: string;
  token: string;
  title: string;
  company: string;
  contact: string;
  prepared_by: string;
  date: string;
  valid_until: string;
  markdown: string;
  status: ProposalStatus;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  sent_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// a draft is never public; everything from `approved` on is
export const PUBLIC_STATUSES: ProposalStatus[] = [
  "approved",
  "sent",
  "viewed",
  "accepted",
  "declined",
];

function norm(row: Record<string, unknown>): Proposal {
  const status = String(row.status ?? "draft");
  return {
    id: String(row.id),
    agent_id: String(row.agent_id ?? "scribe"),
    path: String(row.path ?? ""),
    token: String(row.token ?? ""),
    title: String(row.title ?? "proposal"),
    company: String(row.company ?? ""),
    contact: String(row.contact ?? ""),
    prepared_by: String(row.prepared_by ?? "Persept"),
    date: String(row.date ?? ""),
    valid_until: String(row.valid_until ?? ""),
    markdown: String(row.markdown ?? ""),
    status: ([
      "draft",
      "approved",
      "sent",
      "viewed",
      "accepted",
      "declined",
    ].includes(status)
      ? status
      : "draft") as ProposalStatus,
    view_count: Number(row.view_count ?? 0),
    first_viewed_at: (row.first_viewed_at as string | null) ?? null,
    last_viewed_at: (row.last_viewed_at as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

export async function getProposals(agentId = "scribe"): Promise<Proposal[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("proposals")
      .select("*")
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

export async function getProposalByToken(
  token: string,
): Promise<Proposal | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("proposals")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error || !data) return null;
    return norm(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

function isBot(userAgent: string): boolean {
  return /bot|crawler|preview|facebookexternalhit/i.test(userAgent);
}

// Count a public view. NOT guarded (the public page has no auth) — this is the one
// unauthenticated write the app makes, and only to the view_count / viewed columns.
// Skips bots/link-preview fetchers so the count reflects real opens.
export async function recordProposalView(
  proposal: Proposal,
  userAgent: string,
): Promise<void> {
  if (isBot(userAgent)) return;
  const now = new Date().toISOString();
  try {
    await supabaseAdmin()
      .from("proposals")
      .update({
        view_count: (proposal.view_count ?? 0) + 1,
        last_viewed_at: now,
        first_viewed_at: proposal.first_viewed_at ?? now,
        status: proposal.status === "sent" ? "viewed" : proposal.status,
      })
      .eq("id", proposal.id);
  } catch {
    // view counting is best-effort; never break the public page
  }
}
