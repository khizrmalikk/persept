import type { AgentKey } from "../_components/Persona";

// Client-safe shared types + constants for the Command window. Kept apart from
// command.ts (the loader, which imports server-only supabaseAdmin) so the client
// component can import these VALUES without pulling server code into the bundle.

export type OSStatus = "working" | "waiting" | "idle" | "soon";
export type OSColumn = "todo" | "doing" | "waiting" | "done";

export type OSStateTile = {
  key: string;
  label: string;
  value: string | number;
  sub: string;
  accent: boolean;
  win?: string;
  tab?: string;
};

export type OSHealth = {
  text: string;
  cta: string | null;
  win?: string;
  tab?: string;
};

export type OSTeamMember = {
  id: AgentKey;
  name: string;
  status: OSStatus;
  task: string;
  costToday: number;
  budgetUsd: number | null;
  ringPct: number;
};

export type OSBacklogCard = {
  id: string;
  title: string;
  detail: string;
  owner: AgentKey;
  due: string | null;
  priority: "high" | "normal" | "low";
  column: OSColumn;
  workforce: boolean;
};

export type OSIdeaCard = {
  id: string;
  title: string;
  by: AgentKey;
  who: string;
  why: string;
  status: string;
  isNew: boolean;
};

export type OSRun = {
  day: number; // 0 = mon … 6 = sun
  time: string; // HH:MM
  agent: AgentKey;
  name: string;
  status: "planned" | "done" | "missed";
};

export type OSReview = { title: string; date: string; markdown: string } | null;

export type OSCommand = {
  stateTiles: OSStateTile[];
  health: OSHealth[];
  team: OSTeamMember[];
  brief: string | null;
  backlog: OSBacklogCard[];
  ideas: OSIdeaCard[];
  review: OSReview;
  runs: OSRun[];
  owners: AgentKey[];
  // §4 stale-data guard: one-line amber notice, null when data is fresh.
  staleNotice: string | null;
};

// kanban columns (contract): to do = open & !waiting & owner not working,
// in progress = open & owner working, waiting for you = waiting_on_owner, done = done.
export const BACKLOG_COLUMNS: {
  key: OSColumn;
  label: string;
  color: string;
  empty: string;
}[] = [
  {
    key: "todo",
    label: "to do",
    color: "var(--ink)",
    empty: "nothing queued. Chief adds items here when you ask for something.",
  },
  {
    key: "doing",
    label: "in progress",
    color: "var(--ok)",
    empty: "nothing in progress",
  },
  {
    key: "waiting",
    label: "waiting for you",
    color: "var(--ambink)",
    empty: "nothing is waiting on you",
  },
  {
    key: "done",
    label: "done",
    color: "var(--mute)",
    empty: "nothing done yet",
  },
];

export const COMMAND_TABS: [string, string][] = [
  ["today", "today"],
  ["backlog", "backlog"],
  ["ideas", "ideas"],
  ["review", "weekly review"],
  ["schedule", "schedule"],
];

export const PRIORITY_DOT: Record<string, string> = {
  high: "var(--bad)",
  normal: "oklch(0.8 0.14 70)",
  low: "var(--mute)",
};

export const ROSTER_IDS: AgentKey[] = [
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];
