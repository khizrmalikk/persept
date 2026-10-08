// Server-only reads for Fixer's work. `fixes` is BRIDGE-owned (Fixer's runner
// writes a row per fix/feature/chore/research run); the dashboard only reads it
// and (via sendAgentCommand) retries a failed one. Screenshots live in the
// `campaign-assets` bucket under fixes/<short_id>/<filename>. Defensive reads.

import { supabaseAdmin } from "@/lib/supabase/server";

export type FixStatus =
  | "queued"
  | "running"
  | "pr_open"
  | "research_done"
  | "no_change"
  | "failed"
  | "merged";

export type FixKind = "fix" | "feature" | "chore" | "research";
export type FixRequestedBy =
  | "owner"
  | "chief"
  | "fixer"
  | "schedule"
  | "feedback";

export type FixCheck = { cmd: string; ok: boolean; tail: string };

export type Fix = {
  id: string;
  short_id: string;
  ts: string | null;
  project: string;
  kind: FixKind;
  title: string;
  spec: string;
  model: string;
  requested_by: string;
  status: FixStatus;
  branch: string;
  pr_url: string;
  pr_number: number | null;
  summary: string;
  checks: FixCheck[];
  screenshots: string[];
  error: string;
  started_at: string | null;
  finished_at: string | null;
  merged_at: string | null;
};

const STATUSES: FixStatus[] = [
  "queued",
  "running",
  "pr_open",
  "research_done",
  "no_change",
  "failed",
  "merged",
];
const KINDS: FixKind[] = ["fix", "feature", "chore", "research"];

function checks(v: unknown): FixCheck[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return {
      cmd: String(o.cmd ?? ""),
      ok: o.ok === true,
      tail: String(o.tail ?? ""),
    };
  });
}

function norm(row: Record<string, unknown>): Fix {
  const status = String(row.status ?? "queued");
  const kind = String(row.kind ?? "fix");
  return {
    id: String(row.id),
    short_id: String(row.short_id ?? ""),
    ts: (row.ts as string | null) ?? null,
    project: String(row.project ?? ""),
    kind: (KINDS.includes(kind as FixKind) ? kind : "fix") as FixKind,
    title: String(row.title ?? ""),
    spec: String(row.spec ?? ""),
    model: String(row.model ?? ""),
    requested_by: String(row.requested_by ?? "owner"),
    status: (STATUSES.includes(status as FixStatus)
      ? status
      : "queued") as FixStatus,
    branch: String(row.branch ?? ""),
    pr_url: String(row.pr_url ?? ""),
    pr_number: row.pr_number == null ? null : Number(row.pr_number) || null,
    summary: String(row.summary ?? ""),
    checks: checks(row.checks),
    screenshots: Array.isArray(row.screenshots)
      ? (row.screenshots as unknown[]).map(String).filter(Boolean)
      : [],
    error: String(row.error ?? ""),
    started_at: (row.started_at as string | null) ?? null,
    finished_at: (row.finished_at as string | null) ?? null,
    merged_at: (row.merged_at as string | null) ?? null,
  };
}

export async function getFixes(limit = 200): Promise<Fix[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("fixes")
      .select("*")
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// The fix behind a "merge PR #n in <project>" approval, matched on pr_number +
// project. Returns null when nothing matches (the approval still renders).
export async function getFixByPr(
  project: string,
  prNumber: number,
): Promise<Fix | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("fixes")
      .select("*")
      .eq("project", project)
      .eq("pr_number", prNumber)
      .order("ts", { ascending: false })
      .limit(1);
    if (error) return null;
    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? norm(row) : null;
  } catch {
    return null;
  }
}

// Signed URLs (1h) for a fix's screenshots in campaign-assets/fixes/<short_id>/…
// One batched call per fix (createSignedUrls).
export async function signedScreenshots(
  shortId: string,
  filenames: string[],
): Promise<{ name: string; url: string }[]> {
  if (!shortId || !filenames.length) return [];
  try {
    const paths = filenames.map((name) => `fixes/${shortId}/${name}`);
    const { data } = await supabaseAdmin()
      .storage.from("campaign-assets")
      .createSignedUrls(paths, 3600);
    return ((data ?? []) as { path?: string; signedUrl?: string }[])
      .filter((d) => d.signedUrl)
      .map((d) => ({
        name: (d.path ?? "").split("/").pop() ?? "",
        url: d.signedUrl as string,
      }));
  } catch {
    return [];
  }
}
