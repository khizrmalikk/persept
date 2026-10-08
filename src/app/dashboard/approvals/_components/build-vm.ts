// Shared view-model builders for the approvals master-detail (ApprovalsView).
// Used by the main /dashboard/approvals page (all agents) and the Hunter agent's
// approvals tab (scoped to hunter). Server-safe (no client-only imports).

import {
  type DraftVersion,
  draftAuthorLabel,
  draftKindLabel,
} from "@/lib/workforce/drafts";
import { parseOutbound } from "@/lib/workforce/outreach";
import { agentColor, rosterById } from "@/lib/workforce/roster";
import { type Approval, ago, when } from "@/lib/workforce/types";
import type { ApprovalVM, DecidedVM, VersionVM } from "./ApprovalsView";

// Scribe raises a "question about …" approval to ask the owner, not to send.
export function isQuestionApproval(action: string | null): boolean {
  return /^\s*question about\b/i.test(action ?? "");
}

// A "merge PR #n in <project>" approval → the PR number + project. On approve the
// bridge merges; the inbox renders the fix's checks/screenshots instead of a send.
export function parseMerge(action: string | null): {
  isMerge: boolean;
  prNumber: number | null;
  project: string;
} {
  const m = (action ?? "").trim().match(/^merge PR #(\d+)(?:\s+in\s+(.+))?/i);
  if (!m) return { isMerge: false, prNumber: null, project: "" };
  return {
    isMerge: true,
    prNumber: Number(m[1]) || null,
    project: (m[2] ?? "").trim(),
  };
}

type RiskLevel = "low" | "medium" | "high";

// "SEVERITY — reason" → a risk level + the reason text.
function parseRisk(
  risk: string | null,
  why: string | null,
): { level: RiskLevel; reason: string } {
  const raw = (risk ?? "").trim();
  const m = raw.match(/^([A-Za-z]+)\s*[—–-]\s*([\s\S]*)$/);
  const word = (m?.[1] ?? raw.split(/\s/)[0] ?? "").toLowerCase();
  const level: RiskLevel =
    word === "high" || word === "critical"
      ? "high"
      : word === "medium" || word === "med"
        ? "medium"
        : "low";
  const reason = (m?.[2]?.trim() || why || "").trim();
  return { level, reason };
}

function channelFor(action: string, outboundChannel: string | null): string {
  if (outboundChannel) return outboundChannel;
  const a = action.toLowerCase();
  if (a.includes("proposal")) return "proposal";
  if (a.includes("backlog")) return "backlog";
  if (a.includes("merge")) return "merge";
  return "review";
}

export function approvalToVM(ap: Approval): ApprovalVM {
  const r = rosterById(ap.agent_id ?? "") ?? {
    id: ap.agent_id ?? "system",
    name: ap.agent_id ?? "system",
    emoji: "◆",
    hue: 70,
    room: "",
    role: "",
  };
  const outbound = parseOutbound(ap.draft);
  const { level, reason } = parseRisk(ap.risk, ap.why);
  const merge = parseMerge(ap.action);
  return {
    id: ap.id,
    agentId: r.id,
    agentName: r.name,
    emoji: r.emoji,
    tint: agentColor(r.hue, 0.16),
    tintHead: agentColor(r.hue, 0.08),
    selBorder: agentColor(r.hue, 0.6),
    channel: channelFor(ap.action ?? "", outbound?.channel ?? null),
    when: ago(ap.ts),
    action: ap.action ?? "approval request",
    risk: level,
    reason: reason || "needs your decision",
    outbound: !!outbound,
    to: outbound?.to ?? "",
    subject: outbound?.subject || "",
    context: outbound?.campaign || "",
    body: (outbound ? outbound.body : ap.draft) ?? "",
    held: ap.status === "held",
    isQuestion: isQuestionApproval(ap.action),
    isMerge: merge.isMerge,
    prNumber: merge.prNumber,
    prProject: merge.project,
  };
}

export function approvalToDecidedVM(d: Approval, versions = 0): DecidedVM {
  const r = rosterById(d.agent_id ?? "");
  const status = (d.status ?? "decided").toLowerCase();
  return {
    id: d.id,
    when: ago(d.decided_at ?? d.ts),
    emoji: r?.emoji ?? "◆",
    agentName: r?.name ?? d.agent_id ?? "system",
    action: d.action ?? "",
    status,
    bad: status === "rejected",
    versions,
  };
}

// The draft-version chain, serialized for the client history panel.
export function toVersionVMs(versions: DraftVersion[]): VersionVM[] {
  return versions.map((v) => ({
    id: v.id,
    n: v.n,
    author: v.author,
    authorLabel: draftAuthorLabel(v.author),
    kind: v.kind,
    kindLabel: draftKindLabel(v.kind),
    when: v.ts ? when(v.ts) : "",
    note: v.note,
    subject: v.subject,
    body: v.body,
    diffable: v.kind === "revision" || v.kind === "edited",
  }));
}
