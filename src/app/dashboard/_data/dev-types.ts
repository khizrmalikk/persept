// Client-safe shared types + constants for the Dev window. Kept apart from dev.ts
// (the loader, which imports server-only supabaseAdmin) so the client window can
// import these VALUES without dragging server code into the browser bundle.

export const DEV_TABS: [string, string][] = [
  ["changes", "changes"],
  ["prs", "pull requests"],
  ["deploys", "deploys"],
  ["errors", "errors"],
  ["terminal", "terminal"],
  ["knowledge", "knowledge"],
];

export type OSFixPill =
  | "shipped"
  | "in progress"
  | "failed"
  | "investigating"
  | "merged";

// pill background / foreground tokens per status
export const FIX_PILL: Record<OSFixPill, { bg: string; fg: string }> = {
  shipped: { bg: "oklch(0.8 0.14 70 / 0.18)", fg: "var(--ambink)" },
  "in progress": { bg: "var(--t-fixer)", fg: "var(--c-fixer)" },
  failed: { bg: "oklch(0.6 0.17 28 / 0.16)", fg: "var(--bad)" },
  investigating: { bg: "var(--surf2)", fg: "var(--soft)" },
  merged: { bg: "oklch(0.72 0.15 150 / 0.16)", fg: "var(--ok)" },
};

// map the raw fixes.status → the window's pill word
export function fixPill(status: string): OSFixPill {
  switch (status) {
    case "merged":
      return "merged";
    case "failed":
      return "failed";
    case "pr_open":
      return "shipped";
    case "research_done":
    case "no_change":
      return "investigating";
    default:
      return "in progress"; // queued | running
  }
}

export type OSRepo = {
  id: string;
  name: string; // project name
  repo: string; // repo slug "owner/name", "" when unset
  hasRepo: boolean;
  enabled: boolean;
  branch: string;
  lastDeploy: string; // from the latest deploys row, "—" when none
  status: "ok" | "deploying";
};

// Full editable project (client-safe mirror of @/lib/workforce/projects Project),
// passed to the ProjectEditor panel — the client can't read the DB.
export type OSProjectLogin = {
  path: string;
  email_selector: string;
  password_selector: string;
  submit_selector: string;
  env: string;
};
export type OSProject = {
  id: string;
  name: string;
  repo: string;
  default_branch: string;
  description: string;
  notes: string;
  checks: string[];
  allowed_tools: string[];
  dev: string;
  url: string;
  login: OSProjectLogin;
  deploy: "vercel" | "flag" | null;
  vercel_project_id: string;
  research_cadence: "none" | "weekly";
  enabled: boolean;
};

export type OSPrCheck = { name: string; status: string };

export type OSFix = {
  id: string; // short_id (retryFix takes this)
  project: string; // project id
  title: string;
  note: string;
  message: string; // detail shown in the right pane when there's no inline diff
  pill: OSFixPill;
  failed: boolean;
  running: boolean;
  prNumber: number | null;
  prUrl: string;
  prState: "open" | "merged" | "closed" | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  checks: OSPrCheck[];
  logTail: string;
};

export type OSPr = {
  number: number;
  title: string;
  branch: string;
  diffstat: string;
  status: string;
  waiting: boolean;
  project: string;
};

export type OSDeploy = {
  id: string;
  project: string;
  change: string;
  status: "queued" | "building" | "live" | "failed" | string;
  env: string;
  url: string;
  when: string;
};

export type OSErrorState = "new" | "queued" | "fixed" | "ignored";
export type OSError = {
  id: string;
  project: string;
  signature: string;
  severity: string; // fatal | error | warning | info
  countToday: number;
  state: OSErrorState;
  stateLabel: string;
  fixer: boolean; // state === queued → "Fixer is on it"
  fixId: string | null;
};

export type OSKnowledgeFile = {
  id: string;
  title: string;
  type: string; // short ext/mime chip
  text: string;
};

export type OSDev = {
  repos: OSRepo[];
  projects: OSProject[]; // full editable rows for the ProjectEditor panel
  // keyed by repo.id
  fixesByProject: Record<string, OSFix[]>;
  knowledgeByProject: Record<string, OSKnowledgeFile[]>;
  prs: OSPr[];
  deploys: OSDeploy[];
  errors: OSError[];
};

export const severityColor = (sev: string): string =>
  sev === "fatal" || sev === "error"
    ? "var(--bad)"
    : sev === "warning"
      ? "oklch(0.8 0.14 70)"
      : "var(--mute)";

export const deployDot = (
  status: string,
): { dot: string; glow: string; color: string } => {
  if (status === "live")
    return { dot: "oklch(0.72 0.17 150)", glow: "none", color: "var(--ink)" };
  if (status === "building" || status === "queued")
    return {
      dot: "oklch(0.8 0.14 70)",
      glow: "0 0 10px oklch(0.8 0.14 70)",
      color: "var(--ambink)",
    };
  if (status === "failed")
    return { dot: "oklch(0.65 0.18 28)", glow: "none", color: "var(--bad)" };
  return { dot: "oklch(0.7 0.1 250)", glow: "none", color: "var(--ink)" };
};
