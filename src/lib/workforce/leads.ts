// Server-only reads for Scout's leads — companies Scout found that can become
// Hunter prospects.
//
// `leads` is BRIDGE-owned (Scout's weekly prospecting run creates rows). Day-47:
// the bridge now hands each new batch to HUNTER, who qualifies against the offer
// and campaign audiences — he accepts (status → sent_to_hunter), dismisses, or
// LEAVES a lead for the owner (status stays `suggested`, with a `reason`). The
// dashboard writes `status`/`decided_by`/`reason`/`qualify_sent_at` only (see
// docs/workforce-dashboard.md). Reads are DEFENSIVE: a missing table/column
// returns empty rather than throwing.

import { supabaseAdmin } from "@/lib/supabase/server";

export type LeadStatus = "suggested" | "sent_to_hunter" | "dismissed";
export type LeadFit = "high" | "medium" | "low" | "";

function dayAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export type Lead = {
  id: string;
  ts: string | null;
  agent_id: string;
  company: string;
  website: string;
  contact: string;
  channel: string;
  size: string;
  angle: string;
  evidence: string;
  source_url: string;
  campaign: string; // slug
  status: LeadStatus;
  // who decided this lead and why. `decided_by` is "hunter" (auto-qualify),
  // "chief" or "owner"; "" while nobody has touched it. `reason` is the one-line
  // reason (Hunter's when he leaves/dismisses a lead, else the owner's).
  decided_by: string;
  decided_at: string | null;
  reason: string;
  // day-47: `qualify_sent_at` is when the system handed the lead to Hunter;
  // `fit` is Hunter's read of the offer fit. null/"" until he gets to it.
  qualify_sent_at: string | null;
  fit: LeadFit;
  raw: string;
};

function norm(row: Record<string, unknown>): Lead {
  const status = String(row.status ?? "suggested");
  const fit = String(row.fit ?? "").toLowerCase();
  return {
    id: String(row.id),
    ts: (row.ts as string | null) ?? null,
    agent_id: String(row.agent_id ?? "scout"),
    company: String(row.company ?? ""),
    website: String(row.website ?? ""),
    contact: String(row.contact ?? ""),
    channel: String(row.channel ?? ""),
    size: String(row.size ?? ""),
    angle: String(row.angle ?? ""),
    evidence: String(row.evidence ?? ""),
    source_url: String(row.source_url ?? ""),
    campaign: String(row.campaign ?? ""),
    status: (["suggested", "sent_to_hunter", "dismissed"].includes(status)
      ? status
      : "suggested") as LeadStatus,
    decided_by: String(row.decided_by ?? ""),
    decided_at: (row.decided_at as string | null) ?? null,
    reason: String(row.reason ?? ""),
    qualify_sent_at: (row.qualify_sent_at as string | null) ?? null,
    fit: (["high", "medium", "low"].includes(fit) ? fit : "") as LeadFit,
    raw: String(row.raw ?? ""),
  };
}

export async function getSuggestedLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .eq("status", "suggested")
      .order("ts", { ascending: false })
      .limit(200);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// day-47: every final decision (accepted/dismissed) in the last `days` days,
// newest first — the "decided recently" list. Leads Hunter merely LEFT stay
// `suggested` and surface in the "for you" panel instead, so they are excluded
// here.
export async function getRecentlyDecidedLeads(
  days = 7,
  limit = 60,
): Promise<Lead[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .in("status", ["sent_to_hunter", "dismissed"])
      .gte("decided_at", dayAgoIso(days))
      .order("decided_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// day-47: Hunter's own qualifying history — leads he decided (decided_by=hunter).
// Used two ways: the set of companies (all-time, lowercased) to flag pipeline
// prospects that arrived from his qualifying, and this-week accept/dismiss counts
// for his agent page. Defensive: a missing column/table yields zeros.
export type HunterQualified = {
  companies: Set<string>;
  weekAccepted: number;
  weekDismissed: number;
};

export async function getHunterQualified(): Promise<HunterQualified> {
  const empty: HunterQualified = {
    companies: new Set(),
    weekAccepted: 0,
    weekDismissed: 0,
  };
  try {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("company, status, decided_at")
      .eq("decided_by", "hunter")
      .order("decided_at", { ascending: false })
      .limit(500);
    if (error) return empty;
    const weekCut = dayAgoIso(7);
    const companies = new Set<string>();
    let weekAccepted = 0;
    let weekDismissed = 0;
    for (const row of (data as Record<string, unknown>[] | null) ?? []) {
      const company = String(row.company ?? "")
        .trim()
        .toLowerCase();
      if (company) companies.add(company);
      const decidedAt = (row.decided_at as string | null) ?? null;
      if (!decidedAt || decidedAt < weekCut) continue;
      const status = String(row.status ?? "");
      if (status === "sent_to_hunter") weekAccepted += 1;
      else if (status === "dismissed") weekDismissed += 1;
    }
    return { companies, weekAccepted, weekDismissed };
  } catch {
    return empty;
  }
}

export async function getSuggestedLeadCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin()
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "suggested");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Chief's triage decisions — `events` rows with kind 'triage' (newest first) in
// the last `days` days. The company / decision / reason / lead id come from the
// event payload, falling back to the summary text. Defensive like the rest.
export type TriageEvent = {
  id: number;
  ts: string | null;
  company: string;
  decision: string; // "accept" | "dismiss" | ""
  reason: string;
  leadId: string;
  summary: string;
};

export async function getTriageEvents(days = 7): Promise<TriageEvent[]> {
  try {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabaseAdmin()
      .from("events")
      .select("*")
      .eq("kind", "triage")
      .gte("ts", cutoff)
      .order("ts", { ascending: false })
      .limit(200);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map((row) => {
      const p = (row.payload ?? {}) as Record<string, unknown>;
      const decisionRaw = String(p.decision ?? p.action ?? "").toLowerCase();
      const decision = decisionRaw.includes("accept")
        ? "accept"
        : decisionRaw.includes("dismiss")
          ? "dismiss"
          : "";
      return {
        id: Number(row.id),
        ts: (row.ts as string | null) ?? null,
        company: String(p.company ?? ""),
        decision,
        reason: String(p.reason ?? ""),
        leadId: String(p.lead_id ?? p.leadId ?? ""),
        summary: String(row.summary ?? ""),
      };
    });
  } catch {
    return [];
  }
}
