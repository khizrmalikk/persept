// Server-only reads for the knowledge graph (bridge day-38). Reads wiki_nodes
// (WITHOUT the embedding — it never leaves the server), wiki_edges, wiki_meta.
// Semantic search embeds the query with OpenAI text-embedding-3-small and calls
// the match_wiki_nodes RPC. Everything is DEFENSIVE: a missing table/key yields
// empty, never a throw. `loadGraph` is request-cached.

import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  OSGraph,
  WikiEdge,
  WikiMeta,
  WikiNode,
  WikiNodeType,
} from "./wiki-types";
import { NODE_TYPES } from "./wiki-types";

const S = (v: unknown): string => String(v ?? "").trim();
const N = (v: unknown): number => (v == null ? 0 : Number(v) || 0);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => S(x)).filter(Boolean) : [];

// all node columns EXCEPT embedding — the vector must never reach the client.
const NODE_COLS =
  "id, path, type, title, entity_type, owner, tags, privacy, summary, words, degree, mtime, updated_at";

function normNode(r: Record<string, unknown>): WikiNode {
  const t = S(r.type).toLowerCase();
  return {
    id: S(r.id),
    path: S(r.path),
    type: (NODE_TYPES as string[]).includes(t) ? (t as WikiNodeType) : "source",
    title: S(r.title) || S(r.id),
    entityType: S(r.entity_type),
    owner: r.owner == null || S(r.owner) === "" ? null : S(r.owner),
    tags: arr(r.tags),
    privacy: S(r.privacy) || "public",
    summary: S(r.summary),
    words: N(r.words),
    degree: N(r.degree),
    mtime: (r.mtime as string | null) ?? null,
    updatedAt: (r.updated_at as string | null) ?? null,
  };
}

const normEdge = (r: Record<string, unknown>): WikiEdge => ({
  source: S(r.source),
  target: S(r.target),
  kind: (S(r.kind).toLowerCase() || "link") as WikiEdge["kind"],
  weight: N(r.weight) || 1,
});

export const loadGraph = cache(async (): Promise<OSGraph> => {
  const db = supabaseAdmin();
  const [nodesRes, edgesRes, metaRes] = await Promise.all([
    (async () => {
      try {
        return await db.from("wiki_nodes").select(NODE_COLS).limit(4000);
      } catch {
        return { data: null };
      }
    })(),
    (async () => {
      try {
        return await db
          .from("wiki_edges")
          .select("source, target, kind, weight")
          .limit(20000);
      } catch {
        return { data: null };
      }
    })(),
    (async () => {
      try {
        return await db
          .from("wiki_meta")
          .select("nodes, edges, embedded, synced_at")
          .order("synced_at", { ascending: false })
          .limit(1)
          .maybeSingle();
      } catch {
        return { data: null };
      }
    })(),
  ]);

  const nodes = (
    (nodesRes as { data: Record<string, unknown>[] | null }).data ?? []
  ).map(normNode);
  const ids = new Set(nodes.map((n) => n.id));
  // keep only edges whose endpoints are both present (orphans crash the layout)
  const edges = (
    (edgesRes as { data: Record<string, unknown>[] | null }).data ?? []
  )
    .map(normEdge)
    .filter((e) => ids.has(e.source) && ids.has(e.target));
  const m = (metaRes as { data: Record<string, unknown> | null }).data;
  const meta: WikiMeta | null = m
    ? {
        nodes: N(m.nodes),
        edges: N(m.edges),
        embedded: N(m.embedded),
        syncedAt: (m.synced_at as string | null) ?? null,
      }
    : null;

  return { nodes, edges, meta };
});

// last path segment of every source page, for the files tab's "in the vault" chip.
export async function vaultSourceSlugs(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("wiki_nodes")
      .select("path")
      .ilike("path", "sources/%")
      .limit(4000);
    return ((data as { path: string }[] | null) ?? [])
      .map((r) => S(r.path).split("/").pop() ?? "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ── semantic search ───────────────────────────────────────────────────────────

// embed text with OpenAI text-embedding-3-small. null when no key or on error, so
// callers degrade to title/tag filtering.
export async function embedQuery(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !text.trim()) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    const emb = json.data?.[0]?.embedding;
    return Array.isArray(emb) ? emb : null;
  } catch {
    return null;
  }
}

// a stored node's embedding (server-only; for "related to this page").
export async function nodeEmbedding(id: string): Promise<number[] | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("wiki_nodes")
      .select("embedding")
      .eq("id", id)
      .maybeSingle();
    const raw = (data as { embedding?: unknown } | null)?.embedding;
    if (Array.isArray(raw)) return raw.map(Number);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(Number) : null;
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// nearest pages to an embedding via the match_wiki_nodes RPC → node ids.
export async function matchNodes(
  embedding: number[],
  count = 10,
): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin().rpc("match_wiki_nodes", {
      query_embedding: embedding,
      match_count: count,
    });
    if (error) return [];
    return ((data as { id?: string }[] | null) ?? [])
      .map((r) => S(r.id))
      .filter(Boolean);
  } catch {
    return [];
  }
}

// the page content for the side panel's "open page": summary (+ vault file text
// if a `wiki_text` table exposes it, else summary only).
export async function pageContent(
  id: string,
): Promise<{ title: string; summary: string; body: string } | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("wiki_nodes")
      .select("id, title, summary")
      .eq("id", id)
      .maybeSingle();
    const n = data as { title?: string; summary?: string } | null;
    if (!n) return null;
    let body = "";
    try {
      const { data: txt } = await supabaseAdmin()
        .from("wiki_text")
        .select("text")
        .eq("id", id)
        .maybeSingle();
      body = S((txt as { text?: string } | null)?.text);
    } catch {
      body = "";
    }
    return { title: S(n.title), summary: S(n.summary), body };
  } catch {
    return null;
  }
}
