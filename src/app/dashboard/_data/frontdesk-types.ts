import type { OSMoney } from "@/lib/workforce/stripe-types";
import type { AgentKey } from "../_components/Persona";
import type { OSCopyRow, OSFlightRow } from "./copy-types";

// Client-safe shared types + constants for the front desk. Kept apart from
// frontdesk.ts (the loader, which imports server-only supabaseAdmin) so the
// client window can import these VALUES without dragging server code into the
// browser bundle.

export type OSStage =
  | "prospect"
  | "contacted"
  | "replied"
  | "call"
  | "proposal"
  | "won";

// pipeline columns, in order; `lost`/`parked` are hidden behind a filter
export const OS_STAGES: { key: OSStage; label: string }[] = [
  { key: "prospect", label: "prospect" },
  { key: "contacted", label: "contacted" },
  { key: "replied", label: "replied" },
  { key: "call", label: "call" },
  { key: "proposal", label: "proposal" },
  { key: "won", label: "won" },
];

export const PROPOSAL_STEPS = [
  "draft",
  "approved",
  "sent",
  "viewed",
  "accepted",
] as const;

export type OSDeal = {
  key: string;
  company: string;
  contact: string;
  role: string;
  stage: OSStage;
  value: number;
  source: string;
  lastLine: string;
  lastWhen: string;
  team: AgentKey[];
  proposalId: string | null;
  // day-47: this prospect's company matches a lead Hunter qualified on his own
  // (decided_by=hunter) — the pipeline "new" column can filter to just these.
  fromHunter: boolean;
  // set when a Stripe payment matched this prospect's key (day-40)
  paid: {
    aed: number;
    when: string; // formatted date
    number: string;
    url: string;
  } | null;
  wonAt: string | null; // prospects.won_at — set when a payment matched (day-42)
};

export type OSLeadFit = "high" | "medium" | "low" | "";
// who decided a lead: Hunter (auto-qualify), Chief, the owner, or nobody yet.
export type OSLeadDecider = "hunter" | "chief" | "owner" | "";

export type OSLead = {
  id: string;
  company: string;
  what: string;
  signal: string;
  src: string;
  status: "suggested" | "sent_to_hunter" | "dismissed";
  // day-47 qualifying metadata
  fit: OSLeadFit;
  reason: string; // Hunter's one-line reason (shown in amber when he leaves it)
  decidedBy: OSLeadDecider;
  decidedAt: string; // "ago"-formatted, "" when undecided
  // true for suggested leads Hunter never got (>24h old, qualify_sent_at null)
  notYetQualified: boolean;
};

export type OSProposalRow = {
  id: string;
  company: string;
  title: string;
  status: string;
  stepIndex: number;
  views: number;
  value: string;
  updated: string;
  dealKey: string | null;
  // the workspace (day-45): read Scribe's draft, approve, send back for edits.
  markdown: string;
  contact: string;
  preparedBy: string;
  validUntil: string;
  token: string; // public /p/<token> link
  sentAt: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
};

export type OSConvMsg = {
  by: "them" | "hunter" | "you";
  text: string;
  t: string;
  via: string | null;
};
export type OSThread = {
  key: string;
  who: string;
  company: string;
  lastText: string;
  lastT: string;
  msgs: OSConvMsg[];
};

export type OSFrontDesk = {
  deals: OSDeal[];
  // day-47 research desk: Hunter qualifies; the owner watches and overrules.
  // `forYou` = leads Hunter left (suggested + reason) plus stale un-qualified
  // ones. `withHunter` = count he currently has in hand. `decidedRecently` =
  // every accept/dismiss in the last 7 days. `leadsToday` = today's tally.
  forYou: OSLead[];
  withHunter: number;
  decidedRecently: OSLead[];
  leadsToday: { accepted: number; dismissed: number; left: number };
  proposals: OSProposalRow[];
  threads: OSThread[];
  sources: { name: string; count: number }[];
  // day-47: finished copy Scribe wrote (copy_requests with a body), so the deal
  // panel can show what was actually sent to a company before a call.
  copy: OSCopyRow[];
  // day-47: Hunter's copy requests still in flight (for the pipeline strip)
  inFlight: OSFlightRow[];
  pipelineValue: number;
  wonThisMonth: number;
  // how much of wonThisMonth is backed by a real Stripe payment (vs "unpaid" won
  // prospects). day-40.
  wonPaidThisMonth: number;
  money: OSMoney;
};
