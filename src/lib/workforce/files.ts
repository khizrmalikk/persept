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
// Markdown pipe-table parser. Extracted to ./markdown-table (no server imports)
// so it can be unit-tested in isolation; re-exported here so `@/lib/workforce/files`
// stays the single import path for the app.
// ---------------------------------------------------------------------------

export {
  type MarkdownTable,
  parseMarkdownTable,
} from "./markdown-table";
