// Server-only reads + pure helpers for Chief's backlog and live-state view.
//
// Tables / files (see docs/workforce-dashboard.md):
//   backlog     — DASHBOARD-WRITABLE. The dashboard creates/edits/completes/drops
//                 rows directly; agents change rows through the bridge (BACKLOG
//                 blocks), so rows can appear/change without the dashboard — poll.
//   agent_files — BRIDGE-owned. The bridge mirrors Chief's STATE.md and BACKLOG.md
//                 into agent_files (read-only here).
//
// Every read uses supabaseAdmin() (service key, server-side only) and is DEFENSIVE:
// a missing table / file returns empty rather than throwing, so the page renders
// while the bridge schema is being set up.

import { supabaseAdmin } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

export type BacklogOwner = string; // 'owner' | 'chief' | 'hunter' | 'scout' | …
export type BacklogPriority = "high" | "normal" | "low";
export type BacklogStatus = "open" | "done" | "dropped";

export type BacklogItem = {
  id: string;
  title: string;
  detail: string;
  owner: BacklogOwner;
  due: string | null; // YYYY-MM-DD
  priority: BacklogPriority;
  status: BacklogStatus;
  source: string; // 'dashboard' | 'chief' | 'you' | …
  created_at: string | null;
  updated_at: string | null;
  done_at: string | null;
};

const PRIORITIES: BacklogPriority[] = ["high", "normal", "low"];

function normItem(row: Record<string, unknown>): BacklogItem {
  const priority = String(row.priority ?? "normal");
  const status = String(row.status ?? "open");
  return {
    id: String(row.id),
    title: String(row.title ?? "(untitled)"),
    detail: String(row.detail ?? ""),
    owner: String(row.owner ?? "owner"),
    due: (row.due as string | null) ?? null,
    priority: (PRIORITIES.includes(priority as BacklogPriority)
      ? priority
      : "normal") as BacklogPriority,
    status: (["open", "done", "dropped"].includes(status)
      ? status
      : "open") as BacklogStatus,
    source: String(row.source ?? ""),
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    done_at: (row.done_at as string | null) ?? null,
  };
}

// ── Reads (defensive) ─────────────────────────────────────────────────────────

// Open items, high → low priority, then soonest due first, then newest.
const PRIORITY_RANK: Record<BacklogPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export async function getOpenBacklog(): Promise<BacklogItem[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("backlog")
      .select("*")
      .eq("status", "open")
      .limit(300);
    if (error) return [];
    const rows = ((data as Record<string, unknown>[] | null) ?? []).map(
      normItem,
    );
    rows.sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p !== 0) return p;
      // items with a due date come first, soonest first
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due) return -1;
      if (b.due) return 1;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
    return rows;
  } catch {
    return [];
  }
}

export async function getDoneBacklog(limit = 20): Promise<BacklogItem[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("backlog")
      .select("*")
      .eq("status", "done")
      .order("done_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(normItem);
  } catch {
    return [];
  }
}

// group open items by priority, preserving the sorted order within each bucket
export function groupByPriority(
  items: BacklogItem[],
): { priority: BacklogPriority; items: BacklogItem[] }[] {
  return PRIORITIES.map((priority) => ({
    priority,
    items: items.filter((i) => i.priority === priority),
  })).filter((g) => g.items.length > 0);
}

// ── STATE.md parsing ──────────────────────────────────────────────────────────

export type StateSection = {
  title: string; // the "## " heading, lower-cased
  lines: string[]; // list/body lines (bullets stripped)
};

export type ParsedState = {
  asOf: string; // the first non-empty line (e.g. "state as of 14:32")
  sections: StateSection[];
};

// Split STATE.md into sections on "## " headings. The first non-empty line before
// any heading is the "as of" line. Bullets are stripped so lines render cleanly.
export function parseState(content: string | null | undefined): ParsedState {
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");
  let asOf = "";
  const sections: StateSection[] = [];
  let cur: StateSection | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^##\s+(.*)$/.exec(line.trim());
    if (heading) {
      cur = { title: heading[1].trim().toLowerCase(), lines: [] };
      sections.push(cur);
      continue;
    }
    const t = line.trim();
    if (!t) continue;
    if (/^#\s/.test(t)) {
      // a top-level "# ..." title — treat as the as-of line if we have none yet
      if (!asOf) asOf = t.replace(/^#\s+/, "");
      continue;
    }
    if (!cur) {
      if (!asOf) asOf = t;
      continue;
    }
    cur.lines.push(t.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, ""));
  }
  return { asOf, sections };
}

// The "## Health (discrepancies the system can see)" section of STATE.md — the
// live discrepancy lines. All-clear sentinels ("all clear", "nothing", "none",
// "no discrepancies", "healthy") are treated as empty, so callers get [] and can
// show "all clear". A missing section is also empty.
export function parseHealth(content: string | null | undefined): string[] {
  const { sections } = parseState(content);
  const sec = sections.find((s) => s.title.startsWith("health"));
  if (!sec) return [];
  return sec.lines.filter(
    (l) =>
      !/^(all clear|nothing|none|no discrepanc|no issues|healthy|ok\b|✓)/i.test(
        l,
      ),
  );
}

// true when the mirrored file hasn't been refreshed in over 15 minutes
export function isStale(
  updatedAt: string | null | undefined,
  minutes = 15,
): boolean {
  if (!updatedAt) return true;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > minutes * 60_000;
}
