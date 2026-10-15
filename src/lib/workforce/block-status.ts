// Server-side, batched status lookups for parsed blocks. A card shows a live pill
// where a table knows the state; this fills `block.status` in place. One query per
// table, matched by field + time (the message's ts ± 2h). FULLY DEFENSIVE: any
// missing table/column or bad row leaves the block without a pill (it still
// renders). Never call this from the client — it uses the service key.

import { supabaseAdmin } from "@/lib/supabase/server";
import type { BlockPart, BlockStatus } from "./blocks";

type Item = { block: BlockPart; ts: string | null };

const TWO_H = 2 * 60 * 60 * 1000;
const norm = (s: unknown): string =>
  String(s ?? "")
    .trim()
    .toLowerCase();

type Row = Record<string, unknown>;

// nearest candidate to the message time. When the message time is known, only a
// row within ±2h counts (the brief's window); otherwise the most recent row wins
// (rows arrive newest-first).
function nearest(rows: Row[], at: string | null, tsKey = "ts"): Row | null {
  if (!rows.length) return null;
  const t = at ? new Date(at).getTime() : Number.NaN;
  if (!Number.isFinite(t)) return rows[0];
  let best: Row | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const r of rows) {
    const raw = r[tsKey];
    const rt = typeof raw === "string" ? new Date(raw).getTime() : Number.NaN;
    const diff = Number.isFinite(rt)
      ? Math.abs(rt - t)
      : Number.POSITIVE_INFINITY;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  }
  return best && bestDiff <= TWO_H ? best : null;
}

export async function attachBlockStatuses(items: Item[]): Promise<void> {
  if (!items.length) return;
  const db = supabaseAdmin();
  const by = (t: BlockPart["type"]) =>
    items.filter((it) => it.block.type === t);

  await Promise.all([
    copyStatuses(db, by("COPY REQUEST")),
    leadStatuses(db, by("LEAD")),
    fixStatuses(db, [...by("FIX REQUEST"), ...by("RUN")]),
    approvalStatuses(db, by("APPROVAL REQUEST")),
    backlogStatuses(db, [...by("BACKLOG"), ...by("TASK")]),
    campaignStatuses(db, by("CAMPAIGN")),
  ]);
}

type DB = ReturnType<typeof supabaseAdmin>;

async function copyStatuses(db: DB, items: Item[]) {
  if (!items.length) return;
  try {
    const { data } = await db
      .from("copy_requests")
      .select("company, to, kind, status, ts, approval_id")
      .order("ts", { ascending: false })
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block, ts } of items) {
      const company = norm(block.fields.company);
      const to = norm(block.fields.to);
      const kind = norm(block.fields.kind);
      const cands = rows.filter((r) => {
        const okWho =
          (company && norm(r.company) === company) || (to && norm(r.to) === to);
        const okKind = !kind || norm(r.kind) === kind;
        return okWho && okKind;
      });
      const row = nearest(cands, ts);
      if (!row) continue;
      const s = norm(row.status);
      const approvalId =
        row.approval_id == null ? null : Number(row.approval_id) || null;
      const map: Record<string, BlockStatus> = {
        requested: { label: "requested", tone: "muted" },
        writing: { label: "writing", tone: "working" },
        drafted: { label: "drafted", tone: "done", approvalId },
        question: { label: "has a question", tone: "waiting" },
        refused: { label: "refused", tone: "failed" },
        stalled: { label: "stalled", tone: "failed" },
      };
      if (map[s]) block.status = map[s];
    }
  } catch {
    /* no pill */
  }
}

async function leadStatuses(db: DB, items: Item[]) {
  const plain = items.filter((it) => !it.block.op); // op forms (accept/dismiss) aren't a lead row
  if (!plain.length) return;
  try {
    const { data } = await db
      .from("leads")
      .select("company, status, ts")
      .order("ts", { ascending: false })
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block, ts } of plain) {
      const company = norm(block.fields.company);
      if (!company) continue;
      const cands = rows.filter((r) => norm(r.company) === company);
      const row = nearest(cands, ts);
      if (!row) continue;
      const map: Record<string, BlockStatus> = {
        suggested: { label: "suggested", tone: "muted" },
        sent_to_hunter: { label: "sent to hunter", tone: "working" },
        dismissed: { label: "dismissed", tone: "muted" },
      };
      const s = map[norm(row.status)];
      if (s) block.status = s;
    }
  } catch {
    /* no pill */
  }
}

async function fixStatuses(db: DB, items: Item[]) {
  if (!items.length) return;
  try {
    const { data } = await db
      .from("fixes")
      .select("title, status, pr_number, ts")
      .order("ts", { ascending: false })
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block, ts } of items) {
      const title = norm(block.fields.title);
      if (!title) continue;
      const cands = rows.filter((r) => {
        const rt = norm(r.title);
        return rt === title || rt.includes(title) || title.includes(rt);
      });
      const row = nearest(cands, ts);
      if (!row) continue;
      const s = norm(row.status);
      const pr = row.pr_number == null ? null : Number(row.pr_number) || null;
      const map: Record<string, BlockStatus> = {
        queued: { label: "queued", tone: "muted" },
        running: { label: "running", tone: "working" },
        pr_open: {
          label: pr ? `open pr #${pr} →` : "pr open →",
          tone: "working",
        },
        research_done: { label: "research done", tone: "done" },
        failed: { label: "failed", tone: "failed" },
        merged: { label: "merged", tone: "done" },
      };
      if (map[s]) block.status = map[s];
    }
  } catch {
    /* no pill */
  }
}

async function approvalStatuses(db: DB, items: Item[]) {
  if (!items.length) return;
  try {
    const { data } = await db
      .from("approvals")
      .select("id, action, status, ts")
      .order("ts", { ascending: false })
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block, ts } of items) {
      const action = norm(block.fields.action);
      if (!action) continue;
      const cands = rows.filter((r) => {
        const ra = norm(r.action);
        return ra === action || ra.includes(action) || action.includes(ra);
      });
      const row = nearest(cands, ts);
      if (!row) continue;
      const id = row.id == null ? null : Number(row.id) || null;
      const s = norm(row.status);
      const map: Record<string, BlockStatus> = {
        pending: { label: "waiting on you", tone: "waiting", approvalId: id },
        held: { label: "held", tone: "waiting", approvalId: id },
        approved: { label: "approved", tone: "done" },
        rejected: { label: "rejected", tone: "failed" },
      };
      if (map[s]) block.status = map[s];
    }
  } catch {
    /* no pill */
  }
}

async function backlogStatuses(db: DB, items: Item[]) {
  if (!items.length) return;
  try {
    const { data } = await db
      .from("backlog")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block, ts } of items) {
      const id = norm(block.fields.id);
      const title = norm(block.fields.title);
      let row: Record<string, unknown> | null = null;
      if (id) row = rows.find((r) => norm(r.id) === id) ?? null;
      if (!row && title) {
        const cands = rows.filter((r) => norm(r.title) === title);
        row = nearest(cands, ts, "updated_at");
      }
      if (!row) continue;
      const s = norm(row.status);
      const map: Record<string, BlockStatus> = {
        open: { label: "to do", tone: "muted" },
        started: { label: "in progress", tone: "working" },
        doing: { label: "in progress", tone: "working" },
        blocked: { label: "blocked", tone: "failed" },
        stalled: { label: "stalled", tone: "failed" },
        done: { label: "done", tone: "done" },
        dropped: { label: "dropped", tone: "muted" },
      };
      if (map[s]) block.status = map[s];
    }
  } catch {
    /* no pill */
  }
}

async function campaignStatuses(db: DB, items: Item[]) {
  if (!items.length) return;
  try {
    const { data } = await db
      .from("campaigns")
      .select("name, status, updated_at")
      .limit(400);
    const rows = (data as Record<string, unknown>[] | null) ?? [];
    for (const { block } of items) {
      const name = norm(block.fields.name);
      if (!name) continue;
      const row = rows.find((r) => norm(r.name) === name);
      if (!row) continue;
      const s = norm(row.status);
      const tone: BlockStatus["tone"] =
        s === "active" || s === "running"
          ? "working"
          : s === "done" || s === "finished"
            ? "done"
            : "muted";
      block.status = { label: s || "campaign", tone };
    }
  } catch {
    /* no pill */
  }
}
