// Static registry of the dashboard controls Percy may drive. The manifest route
// serves this to the bridge so Percy only ever names a control that exists; the
// executor (LiveView) resolves each id as [data-pc="<id>"] (dots fall back to
// dashes). Patterned row ids are listed once with a <placeholder>.
//
// NEVER list approve / reject / send / publish / pay / merge controls here — the
// bridge refuses those ids too, and the manifest must not advertise them.

export type UiTargetKind =
  | "window"
  | "tab"
  | "button"
  | "field"
  | "select"
  | "row";

export type UiTarget = {
  id: string;
  label: string;
  kind: UiTargetKind;
  does?: string;
};

export type UiWindow = {
  id: string;
  label: string;
  tabs?: { id: string; label: string }[];
  targets?: UiTarget[];
};

export const UI_MANIFEST_VERSION = "1";

export const UI_WINDOWS: UiWindow[] = [
  {
    id: "command",
    label: "Command",
    tabs: [
      { id: "today", label: "Today" },
      { id: "backlog", label: "Backlog" },
      { id: "ideas", label: "Ideas" },
      { id: "review", label: "Review" },
      { id: "schedule", label: "Schedule" },
    ],
    targets: [
      {
        id: "backlog.new",
        label: "new backlog item field",
        kind: "field",
        does: "type a backlog item, then pick the owner",
      },
    ],
  },
  {
    id: "approvals",
    label: "Approvals",
    // the kind filters — navigation only; approve/reject/send are never listed.
    targets: [
      {
        id: "approvals.filter.all",
        label: "show all approvals",
        kind: "button",
      },
      {
        id: "approvals.filter.out",
        label: "show outbound approvals",
        kind: "button",
      },
      {
        id: "approvals.filter.posts",
        label: "show post approvals",
        kind: "button",
      },
      {
        id: "approvals.filter.proposal",
        label: "show proposal approvals",
        kind: "button",
      },
      {
        id: "approvals.filter.merge",
        label: "show code approvals",
        kind: "button",
      },
      {
        id: "approvals.filter.money",
        label: "show money approvals",
        kind: "button",
      },
    ],
  },
  {
    id: "frontdesk",
    label: "Front desk",
    tabs: [
      { id: "pipeline", label: "Pipeline" },
      { id: "leads", label: "Research desk" },
      { id: "conversations", label: "Conversations" },
      { id: "proposals", label: "Proposals" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    tabs: [
      { id: "studio", label: "Studio" },
      { id: "library", label: "Library" },
      { id: "campaigns", label: "Campaigns" },
      { id: "assets", label: "Assets" },
    ],
    targets: [
      {
        id: "campaigns.new.hunter",
        label: "new campaign led by Hunter",
        kind: "button",
        does: "start an outreach campaign",
      },
      {
        id: "campaigns.new.muse",
        label: "new campaign led by Muse",
        kind: "button",
        does: "start a content campaign",
      },
      { id: "campaign.name", label: "campaign name field", kind: "field" },
      {
        id: "campaign.save",
        label: "save campaign",
        kind: "button",
        does: "create or update the campaign draft",
      },
    ],
  },
  {
    id: "dev",
    label: "Dev",
    tabs: [
      { id: "changes", label: "Changes" },
      { id: "prs", label: "PRs" },
      { id: "deploys", label: "Deploys" },
      { id: "errors", label: "Errors" },
      { id: "terminal", label: "Terminal" },
      { id: "knowledge", label: "Files" },
    ],
    targets: [
      {
        id: "project.new",
        label: "new project",
        kind: "button",
        does: "add a repo for Fixer to work on",
      },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    tabs: [
      { id: "files", label: "Files" },
      { id: "graph", label: "Graph" },
    ],
    targets: [
      { id: "knowledge.search", label: "search files field", kind: "field" },
    ],
  },
  {
    id: "warroom",
    label: "War room",
    tabs: [
      { id: "goals", label: "Goals" },
      { id: "money", label: "Money" },
    ],
    targets: [
      {
        id: "goal.new",
        label: "new goal",
        kind: "button",
        does: "start a war-room goal",
      },
    ],
  },
  { id: "system", label: "System monitor" },
];

export const UI_TARGETS: UiTarget[] = [
  {
    id: "pill",
    label: "Percy pill",
    kind: "button",
    does: "open the Percy drawer",
  },
  { id: "sysmon", label: "System monitor popover", kind: "window" },
  {
    id: "prospect.<key>",
    label: "a prospect / deal row",
    kind: "row",
    does: "open the deal panel",
  },
  { id: "lead.<id>", label: "a research-desk lead", kind: "row" },
  {
    id: "proposal.<id>",
    label: "a proposal row",
    kind: "row",
    does: "open the proposal",
  },
  {
    id: "campaign.<id>",
    label: "a campaign card",
    kind: "row",
    does: "open the campaign",
  },
  { id: "approval.<id>", label: "an approval card", kind: "row" },
  { id: "backlog.<id>", label: "a backlog card", kind: "row" },
  { id: "fix.<id>", label: "a fix row", kind: "row" },
  { id: "goal.<id>", label: "a war-room goal", kind: "row" },
  {
    id: "agent.<id>",
    label: "an agent card",
    kind: "row",
    does: "open the agent page",
  },
];

export function uiManifest() {
  return {
    version: UI_MANIFEST_VERSION,
    windows: UI_WINDOWS,
    targets: UI_TARGETS,
  };
}
