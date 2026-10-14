import type { AgentKey } from "../_components/Persona";

// Client-safe shared types + constants for the marketing window. Kept apart from
// marketing.ts (the loader, which imports server-only supabaseAdmin) so the client
// window can import these VALUES without dragging server code into the browser
// bundle. See frontdesk-types.ts for the pattern this mirrors.

export const WEEK_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type OSWeekSlot = {
  day: WeekDay;
  today: boolean;
  channel: string | null;
  title: string | null;
  // "" when the day is open; otherwise the plan state
  status: "" | "published" | "waiting" | "drafting" | "planned";
  open: boolean;
};

export type OSDraft = {
  id: string;
  title: string;
  channel: string;
  state: "waiting" | "writing" | "gone";
  pct: number;
  approvalId: number | null;
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
  platforms: string[];
  searchQueries: string[];
  dailyCap: number;
  notes: string;
  searchQueryCount: number;
};

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
  drafts: OSDraft[];
  published: OSPublished[];
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
