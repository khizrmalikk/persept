// Server-only reads + pure helpers for Muse's marketing/content workspace.
//
// Tables (see docs/workforce-dashboard.md):
//   posts — BRIDGE-owned: a row per published / approved-for-manual post. The
//           dashboard may update `status` to `posted_by_owner` and write `stats`.
//
// Muse's workspace files are mirrored into `agent_files` for agent_id = 'muse':
//   plan/YYYY-Www.md            — the weekly plan (a markdown table)
//   posts/YYYY-MM-DD-<slug>.md  — each draft, with front matter + the text
//   BRAND.md, inputs/scout-latest.md
//
// Every read uses supabaseAdmin() (service key, server-side only) and is
// DEFENSIVE: a missing table / unconfigured project returns empty rather than
// throwing, so the page renders while the bridge schema is being set up.

import { supabaseAdmin } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

export type PostChannel = "linkedin" | "instagram";
export type PostStatus = "published" | "approved_manual" | "posted_by_owner";

export type PostStats = {
  impressions?: number;
  reactions?: number;
  comments?: number;
  replies?: number;
};

export type Post = {
  id: string;
  ts: string;
  agent_id: string;
  channel: PostChannel;
  // true for a company-page post (channel `linkedin-page-post`); false for the
  // owner's profile (`linkedin-post`). Only meaningful when channel is linkedin.
  page: boolean;
  text: string;
  image_url: string | null;
  status: PostStatus;
  external_id: string | null;
  url: string | null;
  approval_id: number | null;
  action_id: number | null;
  published_at: string | null;
  stats: PostStats;
};

function asStats(v: unknown): PostStats {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const num = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) ? x : undefined;
  return {
    impressions: num(o.impressions),
    reactions: num(o.reactions),
    comments: num(o.comments),
    replies: num(o.replies),
  };
}

function normPost(row: Record<string, unknown>): Post {
  const channel = String(row.channel ?? "linkedin").toLowerCase();
  const status = String(row.status ?? "published");
  return {
    id: String(row.id),
    ts: String(row.ts ?? ""),
    agent_id: String(row.agent_id ?? "muse"),
    channel: (channel.startsWith("instagram")
      ? "instagram"
      : "linkedin") as PostChannel,
    page: channel.includes("page"),
    text: String(row.text ?? ""),
    image_url: (row.image_url as string | null) ?? null,
    status: (["published", "approved_manual", "posted_by_owner"].includes(
      status,
    )
      ? status
      : "published") as PostStatus,
    external_id: (row.external_id as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    approval_id: (row.approval_id as number | null) ?? null,
    action_id: (row.action_id as number | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    stats: asStats(row.stats),
  };
}

// ── Reads (defensive) ─────────────────────────────────────────────────────────

export async function getPosts(agentId = "muse"): Promise<Post[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("posts")
      .select("*")
      .eq("agent_id", agentId)
      .order("ts", { ascending: false })
      .limit(200);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(normPost);
  } catch {
    return [];
  }
}

// ── Pure helpers (no server imports — kept here as the single import path) ─────

// Front matter of a mirrored `posts/*.md` file: a leading `--- … ---` block of
// `key: value` lines, then the post text. Tolerates a file with no front matter.
export function parseFrontMatter(content: string | null | undefined): {
  data: Record<string, string>;
  body: string;
} {
  const text = (content ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text.trim() };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kv)
      data[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: text.slice(m[0].length).trim() };
}

// slug from a mirrored path: posts/2026-09-26-why-a-human-presses-send.md →
// "why-a-human-presses-send" (strip dir, the leading date, and .md).
export function slugFromPath(path: string): string {
  const file = (path ?? "").split("/").pop() ?? "";
  return file
    .replace(/\.md$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .trim();
}

// Muse's approval draft: the outbound-style header block
//   channel: linkedin-post | instagram-post
//   image: <campaign-assets url>      (optional)
//   comment: <link posted as first comment>   (optional)
//
//   <post text>
// Returns null when it does not look like a Muse post (channel not *-post).
export type MusePost = {
  channel: PostChannel;
  // true for `linkedin-page-post` (company page), false for `linkedin-post`.
  page: boolean;
  image: string | null;
  comment: string | null;
  body: string;
};
export function parseMusePost(
  draft: string | null | undefined,
): MusePost | null {
  const norm = (draft ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sep = norm.indexOf("\n\n");
  const headerBlock = sep >= 0 ? norm.slice(0, sep) : norm;
  const body = sep >= 0 ? norm.slice(sep + 2) : "";
  const h: Record<string, string> = {};
  for (const line of headerBlock.split("\n")) {
    const kv = line.match(/^\s*([a-z_]+)\s*:\s*(.*)$/i);
    if (kv) h[kv[1].toLowerCase()] = kv[2].trim();
  }
  const raw = (h.channel ?? "").toLowerCase();
  const channel: PostChannel | null = raw.startsWith("linkedin")
    ? "linkedin"
    : raw.startsWith("instagram")
      ? "instagram"
      : null;
  if (!channel || !/-post$/.test(raw)) return null;
  return {
    channel,
    page: raw.includes("page"),
    image: h.image || null,
    comment: h.comment || null,
    body: body.trim(),
  };
}

// Match a draft's text to a mirrored posts/*.md file (front matter carries the
// image_brief). We compare on a normalised prefix of the body since the slug is
// not in the approval. Returns the matched file's slug + image_brief + image.
export function matchPostFile(
  body: string,
  files: { path: string; content: string }[],
): { slug: string; image_brief: string | null; image: string | null } | null {
  const key = (s: string) =>
    s.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120);
  const want = key(body);
  if (!want) return null;
  for (const f of files) {
    const { data, body: fileBody } = parseFrontMatter(f.content);
    if (key(fileBody).startsWith(want) || want.startsWith(key(fileBody))) {
      return {
        slug: slugFromPath(f.path),
        image_brief: data.image_brief || null,
        image: data.image || null,
      };
    }
  }
  return null;
}
