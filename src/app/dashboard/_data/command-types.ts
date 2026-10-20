import type { AgentKey } from "../_components/Persona";

// Client-safe shared types + constants for the Command window. Kept apart from
// command.ts (the loader, which imports server-only supabaseAdmin) so the client
// component can import these VALUES without pulling server code into the bundle.

export type OSStatus = "working" | "waiting" | "idle" | "soon";
export type OSColumn = "todo" | "doing" | "waiting" | "done" | "dropped";

// day-39: `backlog.status` is the single source of truth (no derivation from the
// agent's status). The bridge owns started|doing|blocked|stalled.
export type OSBacklogState =
  | "open"
  | "started"
  | "doing"
  | "blocked"
  | "stalled"
  | "done"
  | "dropped";

// status (+ a pending owner approval) → board column. Pure, so the loader and the
// client can agree. started|doing with waiting_on_owner is "waiting for you".
export function backlogColumn(
  state: OSBacklogState,
  waitingOnOwner: boolean,
): OSColumn {
  if (state === "dropped") return "dropped";
  if (state === "done") return "done";
  if (state === "blocked" || state === "stalled") return "waiting";
  if ((state === "started" || state === "doing") && waitingOnOwner)
    return "waiting";
  if (state === "started" || state === "doing") return "doing";
  return "todo"; // open (and anything unexpected)
}

export type OSStateTile = {
  key: string;
  label: string;
  value: string | number;
  sub: string;
  accent: boolean;
  win?: string;
  tab?: string;
  // day-40 money tile: span the full row + colour the sub red (overdue).
  wide?: boolean;
  subBad?: boolean;
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
  id: string; // full uuid (the start command needs it)
  title: string;
  detail: string;
  owner: AgentKey;
  due: string | null;
  priority: "high" | "normal" | "low";
  column: OSColumn;
  state: OSBacklogState;
  workforce: boolean;
  // task-system fields (day-39)
  startedAt: string | null; // when handed to the agent (for the "waiting" line)
  doingNote: string; // doing_note while the agent works
  doingBy: AgentKey | null; // doing_by
  blockedWhy: string; // blocked_why (red badge)
  waitingOnOwner: boolean; // an approval from the agent is pending
  result: string; // the agent's result when done
  resultVerified: boolean; // tick vs "unverified"
  doneBy: string; // "owner" or an agent id
  doneAt: string | null;
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
  // "rerun" (day-47): the job missed its slot and the bridge ran it itself —
  // shown neutrally ("re-run by system"), not as a miss.
  status: "planned" | "done" | "missed" | "rerun";
};

export type OSReview = { title: string; date: string; markdown: string } | null;

// day-47: today's copy flow for the "words" tile
export type OSWords = {
  requested: number;
  writing: number;
  questions: number;
  drafted: number;
  oldestWaitingMin: number;
};

export type OSCommand = {
  stateTiles: OSStateTile[];
  health: OSHealth[];
  team: OSTeamMember[];
  brief: string | null;
  backlog: OSBacklogCard[];
  ideas: OSIdeaCard[];
  review: OSReview;
  runs: OSRun[];
  words: OSWords;
  owners: AgentKey[];
  // §4 stale-data guard: one-line amber notice, null when data is fresh.
  staleNotice: string | null;
};

// kanban columns (day-39, from backlog.status — see backlogColumn):
// to do = open · in progress = started|doing · waiting for you = blocked|stalled|
// waiting_on_owner · done = done. `dropped` is off-board (a filter chip reveals it).
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

// shown only when the "dropped" filter chip is on.
export const DROPPED_COLUMN = {
  key: "dropped" as OSColumn,
  label: "dropped",
  color: "var(--mute)",
  empty: "nothing dropped",
};

export const COMMAND_TABS: [string, string][] = [
  ["today", "today"],
  ["backlog", "backlog"],
  ["ideas", "ideas"],
  ["review", "weekly review"],
  ["schedule", "schedule"],
];

export const PRIORITY_DOT: Record<string, string> = {
  high: "var(--bad)",
  normal: "oklch(0.68 0.21 38)",
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
