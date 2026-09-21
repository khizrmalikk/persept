// Read-only, server-only access to the agents' mirrored working files.
//
// The bridge mirrors each agent's workspace into the `agent_files` table
// (agent_id, path, content, hash, updated_at) — the dashboard only READS it and
// never writes it (files are bridge-owned; agents update their own files). Use
// only inside server components / server code — never expose the admin client to
// the browser.

import { supabaseAdmin } from "@/lib/supabase/server";

export type AgentFile = {
  agent_id: string;
  path: string;
  content: string;
  hash: string | null;
  updated_at: string | null;
};

/** One mirrored file by exact path, or null when the agent hasn't written it yet. */
export async function getAgentFile(
  agentId: string,
  path: string,
): Promise<AgentFile | null> {
  const { data } = await supabaseAdmin()
    .from("agent_files")
    .select("agent_id, path, content, hash, updated_at")
    .eq("agent_id", agentId)
    .eq("path", path)
    .maybeSingle();
  return (data as AgentFile | null) ?? null;
}

/** All mirrored files under a path prefix, newest path first (dated files sort desc). */
export async function listAgentFiles(
  agentId: string,
  prefix: string,
): Promise<AgentFile[]> {
  const { data } = await supabaseAdmin()
    .from("agent_files")
    .select("agent_id, path, content, hash, updated_at")
    .eq("agent_id", agentId)
    .like("path", `${prefix}%`)
    .order("path", { ascending: false })
    .limit(500);
  return (data as AgentFile[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Markdown pipe-table parser — tolerant of leading/trailing pipes and the
// separator row. Column keys are lower-cased so lookups are predictable.
// ---------------------------------------------------------------------------

export type MarkdownTable = {
  columns: string[];
  rows: Record<string, string>[];
};

function splitCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 &&
    cells.every((c) => /^:?-{1,}:?$/.test(c.replace(/\s+/g, "")))
  );
}

export function parseMarkdownTable(
  md: string | null | undefined,
): MarkdownTable {
  const empty: MarkdownTable = { columns: [], rows: [] };
  if (!md) return empty;

  // Grab the first contiguous block of pipe-bearing lines (skip any prose/heading above it).
  const block: string[] = [];
  let started = false;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.includes("|")) {
      block.push(line);
      started = true;
    } else if (started) {
      break;
    }
  }
  if (block.length < 2) return empty;

  const columns = splitCells(block[0]).map((c) => c.toLowerCase());
  const dataStart = isSeparatorRow(splitCells(block[1])) ? 2 : 1;

  const rows: Record<string, string>[] = [];
  for (let i = dataStart; i < block.length; i++) {
    const cells = splitCells(block[i]);
    if (isSeparatorRow(cells)) continue;
    if (cells.every((c) => c === "")) continue;
    const row: Record<string, string> = {};
    columns.forEach((col, idx) => {
      row[col] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return { columns, rows };
}
