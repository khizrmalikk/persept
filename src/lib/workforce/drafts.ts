// Server-only reads for a message's draft history. `draft_versions` is
// BRIDGE-owned: one row per step of a message's life (draft → revision_note →
// revision → question → answer → edited → sent/approved/rejected), tied together
// by `root_id`. The dashboard only READS it. Defensive: a missing table yields
// empty, so the approvals inbox still renders while the schema is set up.

import { supabaseAdmin } from "@/lib/supabase/server";

export type DraftAuthor = "scribe" | "owner" | "system";
export type DraftKind =
  | "draft"
  | "revision_note"
  | "revision"
  | "question"
  | "answer"
  | "edited"
  | "sent"
  | "approved"
  | "rejected";

export type DraftVersion = {
  id: string;
  ts: string | null;
  root_id: string;
  copy_request_id: string | null;
  approval_id: number | null;
  n: number;
  author: DraftAuthor;
  kind: string;
  note: string;
  subject: string;
  body: string;
};

// Plain-words label for a version row (server-side so the client gets it ready).
export function draftKindLabel(kind: string): string {
  switch (kind) {
    case "draft":
      return "scribe's draft";
    case "revision_note":
      return "your note";
    case "revision":
      return "scribe's revision";
    case "question":
      return "scribe asked";
    case "answer":
      return "your answer";
    case "edited":
      return "you edited before sending";
    case "sent":
      return "sent";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return kind.replace(/[_-]+/g, " ");
  }
}

// The author chip label: owner → "you".
export function draftAuthorLabel(author: string): string {
  return author === "owner" ? "you" : author;
}

function norm(row: Record<string, unknown>): DraftVersion {
  const author = String(row.author ?? "system");
  return {
    id: String(row.id),
    ts: (row.ts as string | null) ?? null,
    root_id: String(row.root_id ?? ""),
    copy_request_id: (row.copy_request_id as string | null) ?? null,
    approval_id: row.approval_id == null ? null : Number(row.approval_id),
    n: Number(row.n ?? 0) || 0,
    author: (["scribe", "owner", "system"].includes(author)
      ? author
      : "system") as DraftAuthor,
    kind: String(row.kind ?? "draft"),
    note: String(row.note ?? ""),
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
  };
}

export type ChainMeta = {
  root_id: string;
  company: string;
  kind: string;
  channel: string;
  status: string;
  // for a refused/question request the `body` carries the reason / question
  body: string;
};

// For a set of approval ids: the draft-version chain for each (via the matching
// copy_request's root_id) and the copy_request meta. Two queries, batched.
export async function getApprovalChains(approvalIds: number[]): Promise<{
  versionsByApproval: Record<number, DraftVersion[]>;
  metaByApproval: Record<number, ChainMeta>;
}> {
  const ids = [...new Set(approvalIds.filter((n) => Number.isFinite(n)))];
  if (!ids.length) return { versionsByApproval: {}, metaByApproval: {} };
  try {
    const db = supabaseAdmin();
    const { data: crRows, error: crErr } = await db
      .from("copy_requests")
      .select("approval_id, root_id, company, kind, channel, status, body")
      .in("approval_id", ids);
    if (crErr) return { versionsByApproval: {}, metaByApproval: {} };

    const metaByApproval: Record<number, ChainMeta> = {};
    const rootByApproval: Record<number, string> = {};
    const rootIds = new Set<string>();
    for (const r of (crRows as Record<string, unknown>[] | null) ?? []) {
      const aid = Number(r.approval_id);
      const root = String(r.root_id ?? "");
      if (!Number.isFinite(aid)) continue;
      metaByApproval[aid] = {
        root_id: root,
        company: String(r.company ?? ""),
        kind: String(r.kind ?? ""),
        channel: String(r.channel ?? ""),
        status: String(r.status ?? ""),
        body: String(r.body ?? ""),
      };
      if (root) {
        rootByApproval[aid] = root;
        rootIds.add(root);
      }
    }

    const versionsByRoot: Record<string, DraftVersion[]> = {};
    if (rootIds.size) {
      const { data: vRows } = await db
        .from("draft_versions")
        .select("*")
        .in("root_id", [...rootIds])
        .order("n", { ascending: true });
      for (const row of (vRows as Record<string, unknown>[] | null) ?? []) {
        const v = norm(row);
        if (!versionsByRoot[v.root_id]) versionsByRoot[v.root_id] = [];
        versionsByRoot[v.root_id].push(v);
      }
    }

    const versionsByApproval: Record<number, DraftVersion[]> = {};
    for (const aid of ids) {
      const root = rootByApproval[aid];
      if (root && versionsByRoot[root])
        versionsByApproval[aid] = versionsByRoot[root];
    }
    return { versionsByApproval, metaByApproval };
  } catch {
    return { versionsByApproval: {}, metaByApproval: {} };
  }
}
