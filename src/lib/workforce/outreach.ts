// Server-only reads + pure helpers for Hunter's outreach workspace.
//
// Tables (see docs/workforce-dashboard.md):
//   campaigns  — DASHBOARD-owned (created/edited here; the bridge mirrors them
//                into Hunter's workspace as campaigns/<slug>.md within a minute).
//   messages   — BRIDGE-owned (the outreach log; the dashboard only reads it).
//   handoffs   — DASHBOARD-writable for status (done/drop); rows created by the bridge.
//
// Every read here uses supabaseAdmin() (service key, server-side only) and is
// DEFENSIVE: a missing table / unconfigured project returns empty rather than
// throwing, so the page still renders while the bridge schema is being set up.

import { supabaseAdmin } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

export type AssetType = "video" | "image" | "file" | "link";
export type CampaignAsset = {
  type: AssetType;
  title: string;
  url: string;
  use: string; // "when to use"
};
export type CampaignRules = {
  channels: string[]; // email | instagram | whatsapp | linkedin
  daily_cap: number;
  follow_up_days: number[]; // e.g. [3, 7]
  search_queries: string[]; // google-maps searches the bridge runs each morning (max 8)
  platforms: string[]; // muse campaigns: linkedin | instagram | x | reddit | tiktok | newsletter
  starts: string; // muse campaign start date (YYYY-MM-DD) or ""
  ends: string; // muse campaign end date (YYYY-MM-DD) or ""
};

// The platforms a muse (marketing) campaign can run on.
export const MUSE_PLATFORMS = [
  "linkedin",
  "instagram",
  "x",
  "reddit",
  "tiktok",
  "newsletter",
];
export type CampaignStatus = "active" | "paused" | "archived";
export type Campaign = {
  id: string;
  agent_id: string;
  name: string;
  status: CampaignStatus;
  goal: string;
  audience: string;
  offer: string;
  description: string;
  assets: CampaignAsset[];
  rules: CampaignRules;
  created_at: string | null;
  updated_at: string | null;
};

export type MessageDirection = "out" | "in";
export type MessageKind = "first_touch" | "follow_up" | "reply" | "inbound";
export type MessageStatus = "sent" | "approved_manual" | "received" | "held";
export type OutreachMessage = {
  id: string;
  ts: string;
  agent_id: string;
  campaign_id: string | null;
  direction: MessageDirection;
  channel: string;
  kind: MessageKind;
  company: string | null;
  contact: string | null;
  subject: string | null;
  body: string;
  thread_id: string | null;
  status: MessageStatus;
  approval_id: number | null;
  action_id: number | null;
};

export type HandoffStatus = "open" | "done" | "dropped";
export type Handoff = {
  id: string;
  ts: string;
  agent_id: string;
  company: string | null;
  contact: string | null;
  channel: string | null;
  why: string | null;
  next: string | null;
  status: HandoffStatus;
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

// Campaign slug — the SAME rule the bridge uses to name campaigns/<slug>.md and
// to match a prospect's `campaign` column: lowercase, non-alphanumerics → "-",
// trimmed. Keep this in lockstep with the bridge.
export function slugify(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DEFAULT_RULES: CampaignRules = {
  channels: ["email"],
  daily_cap: 20,
  follow_up_days: [3, 7],
  search_queries: [],
  platforms: [],
  starts: "",
  ends: "",
};

// A YYYY-MM-DD date or "" — used for muse campaign start/end.
export function normDate(v: unknown): string {
  const s = String(v ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

// Up to 8 google-maps search queries, one per line: trim, drop blanks, cap at 8.
// Shared by the campaign form (parse a textarea) and saveCampaign (server).
export function normSearchQueries(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/);
  return arr
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 8);
}

// Domain of a website/url, lowercased, no scheme / www / path. "" when unusable.
// Used to tie a lead back to a candidate the morning search found.
export function hostFromUrl(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return s
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
      .toLowerCase();
  }
}

// The outbound message format — used in approval drafts and `send` actions:
//
//   channel: email
//   to: Name <address>
//   subject: ...
//   thread: <optional, replies only>
//   campaign: <slug>
//
//   <body>
export type Outbound = {
  channel: string;
  to: string;
  subject: string;
  thread?: string;
  campaign?: string;
  body: string;
};

export function buildOutbound(o: Outbound): string {
  const head = [
    `channel: ${o.channel.trim()}`,
    `to: ${o.to.trim()}`,
    `subject: ${o.subject.trim()}`,
  ];
  if (o.thread?.trim()) head.push(`thread: ${o.thread.trim()}`);
  if (o.campaign?.trim()) head.push(`campaign: ${o.campaign.trim()}`);
  return `${head.join("\n")}\n\n${o.body.trim()}`;
}

// Parse a draft as the outbound format. Returns null when it does not look like
// one (so an ordinary approval draft renders as plain text). Requires at least a
// `channel` and `to` header.
export function parseOutbound(
  text: string | null | undefined,
): Outbound | null {
  const norm = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sep = norm.indexOf("\n\n");
  const headerBlock = sep >= 0 ? norm.slice(0, sep) : norm;
  const body = sep >= 0 ? norm.slice(sep + 2) : "";
  const h: Record<string, string> = {};
  for (const line of headerBlock.split("\n")) {
    const m = line.match(/^\s*([a-z_]+)\s*:\s*(.*)$/i);
    if (m) h[m[1].toLowerCase()] = m[2].trim();
  }
  if (!h.channel || !h.to) return null;
  return {
    channel: h.channel,
    to: h.to,
    subject: h.subject ?? "",
    thread: h.thread || undefined,
    campaign: h.campaign || undefined,
    body: body.trim(),
  };
}

// Group messages into threads by company (fallback contact), each ordered oldest
// → newest, threads ordered by most-recent activity first.
export type Thread = {
  key: string;
  company: string;
  contact: string | null;
  messages: OutreachMessage[];
  lastTs: string;
};
export function groupThreads(messages: OutreachMessage[]): Thread[] {
  const by = new Map<string, OutreachMessage[]>();
  for (const m of messages) {
    const key = (m.company || m.contact || m.thread_id || "unknown").trim();
    const arr = by.get(key);
    if (arr) arr.push(m);
    else by.set(key, [m]);
  }
  const threads: Thread[] = [];
  for (const [key, msgs] of by) {
    const ordered = [...msgs].sort((a, b) => a.ts.localeCompare(b.ts));
    const last = ordered[ordered.length - 1];
    threads.push({
      key,
      company: last.company || key,
      contact: last.contact,
      messages: ordered,
      lastTs: last.ts,
    });
  }
  threads.sort((a, b) => b.lastTs.localeCompare(a.lastTs));
  return threads;
}

// ── Normalisers (coerce jsonb columns to typed shapes with defaults) ──────────

function asAssets(v: unknown): CampaignAsset[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((a): CampaignAsset | null => {
      if (!a || typeof a !== "object") return null;
      const o = a as Record<string, unknown>;
      const type = String(o.type ?? "link");
      return {
        type: (["video", "image", "file", "link"].includes(type)
          ? type
          : "link") as AssetType,
        title: String(o.title ?? ""),
        url: String(o.url ?? ""),
        use: String(o.use ?? ""),
      };
    })
    .filter((a): a is CampaignAsset => a !== null && a.url !== "");
}

function asRules(v: unknown): CampaignRules {
  if (!v || typeof v !== "object") return { ...DEFAULT_RULES };
  const o = v as Record<string, unknown>;
  return {
    channels: Array.isArray(o.channels)
      ? o.channels.map(String).filter(Boolean)
      : [...DEFAULT_RULES.channels],
    daily_cap:
      typeof o.daily_cap === "number" && o.daily_cap > 0
        ? Math.floor(o.daily_cap)
        : DEFAULT_RULES.daily_cap,
    follow_up_days: Array.isArray(o.follow_up_days)
      ? o.follow_up_days.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [...DEFAULT_RULES.follow_up_days],
    search_queries: normSearchQueries(o.search_queries),
    platforms: Array.isArray(o.platforms)
      ? o.platforms.map(String).filter(Boolean)
      : [],
    starts: normDate(o.starts),
    ends: normDate(o.ends),
  };
}

function normCampaign(row: Record<string, unknown>): Campaign {
  const status = String(row.status ?? "active");
  return {
    id: String(row.id),
    agent_id: String(row.agent_id ?? "hunter"),
    name: String(row.name ?? "untitled campaign"),
    status: (["active", "paused", "archived"].includes(status)
      ? status
      : "active") as CampaignStatus,
    goal: String(row.goal ?? ""),
    audience: String(row.audience ?? ""),
    offer: String(row.offer ?? ""),
    description: String(row.description ?? ""),
    assets: asAssets(row.assets),
    rules: asRules(row.rules),
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

// ── Reads (defensive) ─────────────────────────────────────────────────────────

export async function getCampaigns(agentId: string): Promise<Campaign[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("campaigns")
      .select("*")
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(normCampaign);
  } catch {
    return [];
  }
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return normCampaign(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getMessages(agentId: string): Promise<OutreachMessage[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("messages")
      .select("*")
      .eq("agent_id", agentId)
      .order("ts", { ascending: true })
      .limit(1000);
    if (error) return [];
    return (data as OutreachMessage[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getHandoffs(
  agentId: string,
  statuses: HandoffStatus[] = ["open"],
): Promise<Handoff[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("handoffs")
      .select("*")
      .eq("agent_id", agentId)
      .in("status", statuses)
      .order("ts", { ascending: false })
      .limit(200);
    if (error) return [];
    return (data as Handoff[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getOpenHandoffCount(agentId: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin()
      .from("handoffs")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("status", "open");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ── Candidates — the bridge's morning google-maps search results ───────────────
// `candidates` is BRIDGE-owned: it runs each campaign's `rules.search_queries` on
// google maps every morning and fills this table; Scout qualifies from a file
// rendered from the same rows. The dashboard only READS it. Defensive like the rest.

export type Candidate = {
  id: string;
  ts: string | null;
  campaign_id: string | null;
  place_id: string;
  name: string;
  website: string;
  domain: string;
  phone: string;
  whatsapp: string;
  emails: string[];
  instagram: string;
  linkedin: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  type: string;
  maps_url: string;
  query: string;
  status: string;
};

function asEmails(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function normCandidate(row: Record<string, unknown>): Candidate {
  const num = (x: unknown): number | null => {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  };
  return {
    id: String(row.id),
    ts: (row.ts as string | null) ?? null,
    campaign_id: (row.campaign_id as string | null) ?? null,
    place_id: String(row.place_id ?? ""),
    name: String(row.name ?? ""),
    website: String(row.website ?? ""),
    domain: String(row.domain ?? "")
      .replace(/^www\./i, "")
      .toLowerCase(),
    phone: String(row.phone ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    emails: asEmails(row.emails),
    instagram: String(row.instagram ?? ""),
    linkedin: String(row.linkedin ?? ""),
    address: String(row.address ?? ""),
    rating: num(row.rating),
    reviews: num(row.reviews),
    type: String(row.type ?? ""),
    maps_url: String(row.maps_url ?? ""),
    query: String(row.query ?? ""),
    status: String(row.status ?? ""),
  };
}

// Newest candidates for one campaign (the panel on the campaign page).
export async function getCampaignCandidates(
  campaignId: string,
  limit = 50,
): Promise<Candidate[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("candidates")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(
      normCandidate,
    );
  } catch {
    return [];
  }
}

// Per-campaign candidate counts in the last `days` days (the card's 5th stat).
export async function getCandidateCounts(
  sinceDays = 30,
): Promise<Record<string, number>> {
  try {
    const since = new Date(
      Date.now() - sinceDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabaseAdmin()
      .from("candidates")
      .select("campaign_id")
      .gte("ts", since)
      .limit(5000);
    if (error) return {};
    const out: Record<string, number> = {};
    for (const r of (data as { campaign_id: string | null }[] | null) ?? []) {
      const id = r.campaign_id;
      if (id) out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  } catch {
    return {};
  }
}

// Post counts per campaign for muse cards: `copy_requests` with kind "post",
// grouped by the request's `campaign` value (a slug or name). The caller looks up
// by both the campaign slug and its raw name. Defensive.
export async function getPostCountsByCampaign(): Promise<
  Record<string, number>
> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("copy_requests")
      .select("campaign, kind")
      .ilike("kind", "post")
      .limit(5000);
    if (error) return {};
    const out: Record<string, number> = {};
    for (const r of (data as { campaign: string | null }[] | null) ?? []) {
      const key = String(r.campaign ?? "")
        .trim()
        .toLowerCase();
      if (key) out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  } catch {
    return {};
  }
}

// Domains the morning search has found (any campaign) — a lead whose website
// matches one came from candidates, not Scout's own web search.
export async function getCandidateDomains(): Promise<Set<string>> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("candidates")
      .select("domain")
      .limit(5000);
    if (error) return new Set();
    const set = new Set<string>();
    for (const r of (data as { domain: string | null }[] | null) ?? []) {
      const d = String(r.domain ?? "")
        .replace(/^www\./i, "")
        .toLowerCase();
      if (d) set.add(d);
    }
    return set;
  } catch {
    return new Set();
  }
}
