import type { AgentKey } from "../_components/Persona";
import type { OSCopyRow, OSFlightRow } from "./copy-types";

// Client-safe shared types + constants for the marketing window. Kept apart from
// marketing.ts (the loader, which imports server-only supabaseAdmin) so the client
// window can import these VALUES without dragging server code into the browser
// bundle. See frontdesk-types.ts for the pattern this mirrors.

// day-47: the strip runs Sunday → Saturday (Muse posts Sun–Thu).
export const WEEK_DAYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type WeekCampaign = "persept" | "gyst" | null;

// one card entry — a day can stack up to two (one per campaign).
export type OSWeekItem = {
  status: "published" | "waiting" | "drafting" | "planned";
  channel: string | null;
  campaign: WeekCampaign;
  title: string;
  approvalId: number | null; // set for "waiting" → opens the approval
};

export type OSWeekSlot = {
  day: WeekDay;
  date: string; // ISO yyyy-mm-dd (Asia/Dubai) this card represents
  today: boolean;
  items: OSWeekItem[]; // empty → the card shows "+ ask Muse"
};

export type OSDraft = {
  id: string;
  title: string;
  channel: string;
  state: "waiting" | "writing" | "gone";
  pct: number;
  approvalId: number | null;
  // day-47: the full draft text, so a row expands to the actual words
  body: string;
};

export type OSPublished = {
  id: string;
  title: string;
  channel: string;
  when: string;
  impressions: number;
  reactions: number;
  comments: number;
  barPct: number;
  // day-47: the full post text + its public url, revealed on expand
  text: string;
  url: string;
  date: string; // posted date, "5 jan" style
};

export type OSCampaign = {
  id: string;
  name: string;
  owner: AgentKey; // hunter | muse
  ownerName: string;
  status: string; // active | paused | archived (shown as "done")
  collab: AgentKey[];
  objs: string;
  assets: number;
  aps: number;
  last: string;
  // editable fields (the campaign editor panel)
  description: string;
  goal: string;
  // day-47: the contact channels Hunter reaches out on (email | linkedin |
  // whatsapp | instagram). Separate from `platforms`, which are Muse's surfaces.
  channels: string[];
  platforms: string[];
  searchQueries: string[];
  dailyCap: number;
  notes: string;
  searchQueryCount: number;
};

// the contact channels a Hunter outreach campaign can use
export const CAMPAIGN_CHANNELS = [
  "email",
  "linkedin",
  "whatsapp",
  "instagram",
] as const;

export type OSAssetKind = "image" | "video" | "copy";
export type OSAsset = {
  id: string;
  name: string;
  kind: OSAssetKind;
  by: AgentKey;
  used: string;
  url: string;
  text: string;
};

export type OSMarketing = {
  week: OSWeekSlot[];
  // day-47: caption under the strip, e.g.
  // "plan · 2026-W43 · edited by Muse Sun 18 Oct" (null when no plan file)
  planCaption: string | null;
  drafts: OSDraft[];
  published: OSPublished[];
  // day-47: the copy library — every finished piece Scribe wrote (copy_requests
  // with a body), newest first, for the library tab.
  library: OSCopyRow[];
  // day-47: Muse's copy requests still in flight (for the in-flight strip)
  inFlight: OSFlightRow[];
  learned: string;
  campaigns: OSCampaign[];
  assets: OSAsset[];
};

// the four asset filter chips
export const ASSET_FILTERS: { key: "all" | OSAssetKind; label: string }[] = [
  { key: "all", label: "all" },
  { key: "image", label: "images" },
  { key: "video", label: "video" },
  { key: "copy", label: "copy" },
];

// status pill styling per week-plan / draft state → [bg, fg]
export const PLAN_STYLE: Record<string, [string, string]> = {
  published: ["oklch(0.72 0.15 150 / 0.16)", "var(--ok)"],
  waiting: ["oklch(0.8 0.14 70 / 0.2)", "var(--ambink)"],
  drafting: ["var(--t-muse)", "var(--c-muse)"],
  planned: ["var(--surf2)", "var(--soft)"],
};
export const PLAN_LABEL: Record<string, string> = {
  published: "published",
  waiting: "waiting for you",
  drafting: "Muse is writing",
  planned: "planned",
};

// campaign badge → [bg, fg]. persept = coral, gyst = its golden yellow.
export const CAMPAIGN_BADGE: Record<"persept" | "gyst", [string, string]> = {
  persept: ["var(--t-scout)", "var(--c-scout)"],
  gyst: ["oklch(0.8 0.15 95 / 0.18)", "oklch(0.8 0.15 95)"],
};
