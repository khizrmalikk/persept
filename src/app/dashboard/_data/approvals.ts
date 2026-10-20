import { supabaseAdmin } from "@/lib/supabase/server";
import { getInFlightCopy } from "@/lib/workforce/copy";
import { getApprovalChains } from "@/lib/workforce/drafts";
import { parseOutbound } from "@/lib/workforce/outreach";
import { type Approval, ago } from "@/lib/workforce/types";
import type { WindowKey } from "../_components/os-store";
import type { AgentKey } from "../_components/Persona";
import type { OSFlightRow } from "./copy-types";

// Approvals, shaped for the OS window. Reads the real `approvals` table plus the
// day-30 columns (kind / workspace / company), falling back to text inference for
// rows written before that bundle. Reuses parseOutbound for the email/post body
// and getApprovalChains for the "drafted by / checked by / being revised" trail.

export type OSApprovalKind =
  | "email"
  | "linkedin"
  | "instagram"
  | "whatsapp"
  | "linkedin-message"
  | "proposal"
  | "merge"
  | "payment"
  | "question"
  | "other";

export type OSApprovalWs = Extract<
  WindowKey,
  "frontdesk" | "marketing" | "dev" | "command"
>;

export type OSApproval = {
  id: number;
  agent: AgentKey;
  kind: OSApprovalKind;
  workspace: OSApprovalWs | null;
  company: string | null;
  deal: string | null;
  title: string;
  age: string; // compact, e.g. "2h"
  held: boolean;
  body: string;
  editable: boolean;
  // email / message
  to?: string;
  subject?: string;
  channel?: string;
  // proposal
  total?: string;
  link?: string;
  // merge
  repo?: string;
  branch?: string;
  pr?: number;
  // payment
  amount?: string;
  vendor?: string;
  // the trail of who touched it
  trail: { k: AgentKey; t: string }[];
};

export type OSManualPost = { id: string; slug: string; title: string };

const KINDS = new Set<OSApprovalKind>([
  "email",
  "linkedin",
  "instagram",
  "whatsapp",
  "linkedin-message",
  "proposal",
  "merge",
  "payment",
  "question",
  "other",
]);
const AGENTS = new Set<AgentKey>([
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
]);
const WS = new Set<OSApprovalWs>(["frontdesk", "marketing", "dev", "command"]);

const shortAge = (iso: string | null) => ago(iso).replace(/\s*ago$/, "");

const mergeOf = (action: string | null) =>
  (action ?? "").trim().match(/^merge pr #(\d+)(?:\s+in\s+(.+))?/i);
const isQuestion = (action: string | null) =>
  /^\s*question about\b/i.test(action ?? "");

// Infer a kind from the action + parsed outbound channel for pre-bundle rows.
function inferKind(ap: Approval, channel: string | null): OSApprovalKind {
  const a = (ap.action ?? "").toLowerCase();
  if (mergeOf(ap.action)) return "merge";
  if (isQuestion(ap.action)) return "question";
  if (/^\s*send proposal\b|proposal/.test(a)) return "proposal";
  if (/\bpay\b|payment|invoice|subscription/.test(a)) return "payment";
  const ch = (channel ?? "").toLowerCase();
  if (ch.includes("instagram")) return "instagram";
  if (ch.includes("linkedin-post")) return "linkedin";
  if (ch.includes("linkedin")) return "linkedin-message";
  if (ch.includes("whatsapp")) return "whatsapp";
  if (ch.includes("email")) return "email";
  return "other";
}

function inferWs(agent: AgentKey, kind: OSApprovalKind): OSApprovalWs {
  if (kind === "merge") return "dev";
  if (kind === "linkedin" || kind === "instagram" || agent === "muse")
    return "marketing";
  return "frontdesk";
}

function amountVendor(action: string | null, why: string | null) {
  const text = `${action ?? ""} ${why ?? ""}`;
  const amount = text.match(/[$£€]\s?\d[\d,]*(?:\.\d+)?/)?.[0] ?? "";
  // "pay for Apollo.io: $49 a month" → vendor "Apollo.io"
  const vendor =
    (action ?? "").match(/pay(?:\s+for)?\s+([^:,.]+)/i)?.[1]?.trim() ?? "";
  return { amount, vendor };
}

export async function loadApprovals(): Promise<{
  approvals: OSApproval[];
  manual: OSManualPost[];
  pending: number;
  inFlight: OSFlightRow[];
}> {
  const db = supabaseAdmin();
  const inFlight = await getInFlightCopy().catch(() => [] as OSFlightRow[]);
  let rows: Approval[] = [];
  let manual: OSManualPost[] = [];
  try {
    const [{ data: ap }, { data: posts }] = await Promise.all([
      db
        .from("approvals")
        .select("*")
        .in("status", ["pending", "held"])
        .order("ts", { ascending: false }),
      db
        .from("posts")
        .select("id, text, slug, status")
        .eq("status", "approved_manual")
        .limit(12),
    ]);
    rows = (ap as Approval[] | null) ?? [];
    manual = (
      (posts as
        | { id: string; text: string | null; slug: string | null }[]
        | null) ?? []
    ).map((p) => ({
      id: String(p.id),
      slug: p.slug ?? "",
      title: (p.text ?? "").split("\n")[0]?.slice(0, 80) || "instagram post",
    }));
  } catch {
    return { approvals: [], manual: [], pending: 0, inFlight };
  }

  // the trail (drafted by / checked / being revised) for every row at once
  let metaByApproval: Awaited<
    ReturnType<typeof getApprovalChains>
  >["metaByApproval"] = {};
  try {
    ({ metaByApproval } = await getApprovalChains(rows.map((r) => r.id)));
  } catch {
    metaByApproval = {};
  }

  const approvals: OSApproval[] = rows.map((ap) => {
    const agent: AgentKey = AGENTS.has(ap.agent_id as AgentKey)
      ? (ap.agent_id as AgentKey)
      : "chief";
    const outbound = parseOutbound(ap.draft);
    const rawKind = (ap as unknown as { kind?: string | null }).kind;
    const kind: OSApprovalKind =
      rawKind && KINDS.has(rawKind as OSApprovalKind)
        ? (rawKind as OSApprovalKind)
        : inferKind(ap, outbound?.channel ?? null);
    const rawWs = (ap as unknown as { workspace?: string | null }).workspace;
    const workspace: OSApprovalWs | null =
      rawWs && WS.has(rawWs as OSApprovalWs)
        ? (rawWs as OSApprovalWs)
        : inferWs(agent, kind);
    const company =
      (ap as unknown as { company?: string | null }).company ??
      (ap.action ?? "").match(/send proposal to\s+([^:]+)/i)?.[1]?.trim() ??
      null;

    const body = (outbound ? outbound.body : ap.draft) ?? "";
    const meta = metaByApproval[ap.id];
    const trail: { k: AgentKey; t: string }[] = [
      { k: agent, t: `drafted by ${cap(agent)}` },
    ];
    if (meta?.status === "writing")
      trail.push({ k: "scribe", t: "being revised by Scribe" });
    if (kind === "proposal")
      trail.push({ k: "hunter", t: "Hunter sends it once you approve" });

    const merge = mergeOf(ap.action);
    const pay = kind === "payment" ? amountVendor(ap.action, ap.why) : null;
    const link = body.match(/persept\.ai\/p\/\w+/)?.[0];

    return {
      id: ap.id,
      agent,
      kind,
      workspace,
      company,
      deal: company ? company.toLowerCase().replace(/\s+/g, "") : null,
      title: ap.action ?? "approval request",
      age: shortAge(ap.ts),
      held: ap.status === "held",
      body,
      editable:
        kind === "email" ||
        kind === "linkedin" ||
        kind === "whatsapp" ||
        kind === "linkedin-message",
      to: outbound?.to || undefined,
      subject: outbound?.subject || undefined,
      channel: outbound?.channel || undefined,
      total: undefined,
      link,
      repo: merge?.[2]?.trim() || undefined,
      branch: undefined,
      pr: merge ? Number(merge[1]) || undefined : undefined,
      amount: pay?.amount || undefined,
      vendor: pay?.vendor || undefined,
      trail,
    };
  });

  return {
    approvals,
    manual,
    pending: approvals.filter((a) => !a.held).length,
    inFlight,
  };
}

const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
