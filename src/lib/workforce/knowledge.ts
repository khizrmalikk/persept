// Server-only reads for the knowledge base — files the owner uploads for the
// agents. `knowledge_files` is DASHBOARD-owned (created/edited/soft-removed here);
// the bridge mirrors each row into every listed agent's workspace as
// memory/knowledge/<slug>.md within two minutes, and removes it on `deleted_at`.
// Text extraction happens on upload (see actions.ts), so the bridge only reads.
//
// Reads are DEFENSIVE: a missing table returns empty rather than throwing.

import { supabaseAdmin } from "@/lib/supabase/server";

export const KNOWLEDGE_AGENTS = [
  "scribe",
  "hunter",
  "muse",
  "chief",
  "scout",
] as const;

export type KnowledgeFile = {
  id: string;
  title: string;
  path: string;
  mime: string;
  bytes: number;
  text: string | null;
  summary: string;
  agent_ids: string[];
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

function norm(row: Record<string, unknown>): KnowledgeFile {
  const text = row.text == null ? null : String(row.text);
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    path: String(row.path ?? ""),
    mime: String(row.mime ?? ""),
    bytes: Number(row.bytes ?? 0) || 0,
    text: text?.trim() ? text : null,
    summary: String(row.summary ?? ""),
    agent_ids: Array.isArray(row.agent_ids)
      ? (row.agent_ids as unknown[]).map(String).filter(Boolean)
      : [],
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
  };
}

// Live (not soft-removed) knowledge files, newest first.
export async function getKnowledgeFiles(limit = 200): Promise<KnowledgeFile[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("knowledge_files")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}

// Live knowledge files an agent receives (agent_ids contains agentId), newest
// first — for the small panel on Scribe's page.
export async function getKnowledgeForAgent(
  agentId: string,
  limit = 3,
): Promise<{ files: KnowledgeFile[]; count: number }> {
  try {
    const { data, count, error } = await supabaseAdmin()
      .from("knowledge_files")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .contains("agent_ids", [agentId])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { files: [], count: 0 };
    const files = ((data as Record<string, unknown>[] | null) ?? []).map(norm);
    return { files, count: count ?? files.length };
  } catch {
    return { files: [], count: 0 };
  }
}
