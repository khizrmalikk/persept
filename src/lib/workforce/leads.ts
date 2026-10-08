// Server-only reads for Scout's leads — companies Scout found that can become
// Hunter prospects in one click.
//
// `leads` is BRIDGE-owned (Scout's weekly prospecting run creates rows); the
// dashboard updates `status` only (suggested → sent_to_hunter | dismissed), like
// `handoffs`. See docs/workforce-dashboard.md. Reads are DEFENSIVE: a missing table
// returns empty rather than throwing.

import { supabaseAdmin } from "@/lib/supabase/server";

export type LeadStatus = "suggested" | "sent_to_hunter" | "dismissed";

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
  // who decided this lead and why. `decided_by` is "chief" (auto-triage) or
  // "owner"; "" while still suggested. `reason` is Chief's or the owner's note.
  decided_by: string;
  decided_at: string | null;
  reason: string;
  raw: string;
};

function norm(row: Record<string, unknown>): Lead {
  const status = String(row.status ?? "suggested");
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

export async function getHandledLeads(limit = 20): Promise<Lead[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("leads")
      .select("*")
      .in("status", ["sent_to_hunter", "dismissed"])
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
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
