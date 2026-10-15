import type { OSMoney } from "@/lib/workforce/stripe-types";
import type { AgentKey } from "../_components/Persona";

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
  // set when a Stripe payment matched this prospect's key (day-40)
  paid: {
    aed: number;
    when: string; // formatted date
    number: string;
    url: string;
  } | null;
  wonAt: string | null; // prospects.won_at — set when a payment matched (day-42)
};

export type OSLead = {
  id: string;
  company: string;
  what: string;
  signal: string;
  src: string;
  status: "suggested" | "sent_to_hunter" | "dismissed";
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
  leads: OSLead[];
  handledLeads: OSLead[];
  proposals: OSProposalRow[];
  threads: OSThread[];
  sources: { name: string; count: number }[];
  pipelineValue: number;
  wonThisMonth: number;
  // how much of wonThisMonth is backed by a real Stripe payment (vs "unpaid" won
  // prospects). day-40.
  wonPaidThisMonth: number;
  money: OSMoney;
};
