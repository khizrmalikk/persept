import type { AgentKey } from "../_components/Persona";

// Client-safe shared types + static data for the agent page. Kept apart from
// agentpage.ts (the loader, which imports server-only supabaseAdmin) so the
// client window can import these VALUES without pulling server code into the
// browser bundle. See os-window-client-server-split.

export type OSIntegration = {
  id: string;
  name: string;
  status: "connected" | "pending" | "off";
  detail: string;
};

export type OSRun = {
  time: string; // HH:MM Dubai
  name: string;
  // "rerun" (day-47): the job missed its slot and the bridge ran it itself —
  // shown neutrally, not as a miss.
  status: "planned" | "done" | "missed" | "rerun";
};

// One line in the runs & logs pane — an `events` row for this agent.
export type OSLogLine = {
  id: string;
  kind: string;
  text: string;
  ts: string; // humanized ("2m", "") for the right-hand timestamp
};

// events.kind → log line colour (§2 runs & logs):
// message grey · run/cron blue · warning amber · approval green ·
// config/goal/backlog violet · system muted.
export const LOG_KIND_COLOR: Record<string, string> = {
  message: "var(--soft)",
  run: "oklch(0.72 0.12 250)",
  cron: "oklch(0.72 0.12 250)",
  warning: "var(--ambink)",
  approval: "var(--ok)",
  config: "var(--c-fixer)",
  goal: "var(--c-fixer)",
  backlog: "var(--c-fixer)",
  system: "var(--mute)",
};
export const logKindColor = (kind: string): string =>
  LOG_KIND_COLOR[kind] ?? "var(--soft)";

// agents.model is a plain `provider/model` string; show it as "provider · model"
// ("not set" when empty). The string is already parsed server-side (agents.ts).
export function modelDisplay(model: string): string {
  const s = (model ?? "").trim();
  if (!s) return "not set";
  const i = s.indexOf("/");
  return i < 0 ? s : `${s.slice(0, i)} · ${s.slice(i + 1)}`;
}

// A capability the agent has. `locked` = always asks you (send / merge / publish
// / pay) and can't be switched off; otherwise it's a reversible, internal toggle.
export type OSCapability = {
  label: string;
  detail: string;
  locked: boolean;
  defaultOn: boolean;
};

// day-47: a finished piece in an agent's mirrored output folder (Scribe
// library/, Muse posts/, Hunter drafts/), with its front-matter metadata.
export type OSAgentFile = {
  path: string;
  name: string; // basename
  updated: string; // "ago"
  request: string;
  approval: string;
  status: string; // front-matter status; "published" gets a green mark
  url: string;
  published: boolean;
  body: string; // content below the front matter, for expand
};

export type OSAgentExtras = {
  integrations: OSIntegration[];
  runs: OSRun[];
  capabilities: OSCapability[];
  log: OSLogLine[]; // this agent's events, oldest→newest for the log pane
  ledgerPending: boolean; // cost ledger hasn't run → show "ledger has not run yet"
  vpsStale: boolean; // vps_metrics older than 10 min
  staleNotice: string | null; // the one-line amber notice (null when fresh)
  // day-42 money, only set for Hunter's page (at-a-glance). null elsewhere.
  paidThisMonth: number | null;
  overdueInvoices: number | null;
  // day-47 lead qualifying, only set for Hunter's page. null elsewhere.
  qualifiedWeek: { accepted: number; dismissed: number } | null;
  // day-47: this agent's mirrored output folder (empty for agents without one)
  files: OSAgentFile[];
};

// Model tiers the owner can pick on the permissions tab (CONFIG block to Chief).
export const MODEL_TIERS = ["cheap", "routine", "judgment"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

// Static capability list per agent. Reversible/internal → toggle; anything that
// sends, merges, publishes or pays → locked "always asks you".
export const CAPABILITIES: Record<AgentKey, OSCapability[]> = {
  chief: [
    {
      label: "add backlog items for any agent",
      detail: "how Chief delegates",
      locked: false,
      defaultOn: true,
    },
    {
      label: "move agents between tasks",
      detail: "reprioritise when something is urgent",
      locked: false,
      defaultOn: true,
    },
    {
      label: "run the weekly review",
      detail: "fridays at 10:00",
      locked: false,
      defaultOn: true,
    },
    {
      label: "change another agent's permissions",
      detail: "only you can do this",
      locked: true,
      defaultOn: false,
    },
  ],
  scout: [
    {
      label: "search public sources",
      detail: "licence registers, job boards, news",
      locked: false,
      defaultOn: true,
    },
    {
      label: "add leads to the research desk",
      detail: "you or Hunter accept them",
      locked: false,
      defaultOn: true,
    },
    {
      label: "buy contact data",
      detail: "money",
      locked: true,
      defaultOn: false,
    },
  ],
  hunter: [
    {
      label: "add prospects and update the pipeline",
      detail: "internal and reversible",
      locked: false,
      defaultOn: true,
    },
    {
      label: "draft outbound emails",
      detail: "drafts go to approvals",
      locked: false,
      defaultOn: true,
    },
    { label: "send email", detail: "outbound", locked: true, defaultOn: false },
    {
      label: "book calls on your calendar",
      detail: "creates the invite once you approve the reply",
      locked: true,
      defaultOn: false,
    },
    { label: "pay for tools", detail: "money", locked: true, defaultOn: false },
  ],
  scribe: [
    {
      label: "write and revise proposals",
      detail: "internal drafts",
      locked: false,
      defaultOn: true,
    },
    {
      label: "transcribe calls",
      detail: "call mode",
      locked: false,
      defaultOn: true,
    },
    {
      label: "send a proposal",
      detail: "Hunter sends it after your tap",
      locked: true,
      defaultOn: false,
    },
  ],
  muse: [
    {
      label: "draft posts and images",
      detail: "saved to the studio",
      locked: false,
      defaultOn: true,
    },
    {
      label: "plan the week",
      detail: "shows in content studio",
      locked: false,
      defaultOn: true,
    },
    {
      label: "publish to linkedin",
      detail: "outbound",
      locked: true,
      defaultOn: false,
    },
    { label: "spend on ads", detail: "money", locked: true, defaultOn: false },
  ],
  fixer: [
    {
      label: "read and write code in listed repos",
      detail: "only repos in dev",
      locked: false,
      defaultOn: true,
    },
    {
      label: "open pull requests",
      detail: "internal",
      locked: false,
      defaultOn: true,
    },
    {
      label: "run tests and preview deploys",
      detail: "reversible",
      locked: false,
      defaultOn: true,
    },
    {
      label: "merge to main and deploy",
      detail: "access",
      locked: true,
      defaultOn: false,
    },
  ],
  you: [],
};

// Which integration ids belong to each agent's "connected accounts" (per the
// day-30 contract's integrations mapping).
export const AGENT_INTEGRATIONS: Record<AgentKey, string[]> = {
  chief: ["telegram", "ledger"],
  scout: ["places"],
  hunter: ["gmail", "places"],
  scribe: [],
  muse: ["linkedin-profile", "linkedin-page"],
  fixer: ["runner"],
  you: [],
};
