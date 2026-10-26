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
  { id: "command", label: "Command" },
  { id: "approvals", label: "Approvals" },
  { id: "frontdesk", label: "Front desk" },
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
  { id: "dev", label: "Dev" },
  { id: "knowledge", label: "Knowledge" },
  { id: "warroom", label: "War room" },
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
