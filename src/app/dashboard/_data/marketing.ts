import { supabaseAdmin } from "@/lib/supabase/server";
import { getCampaigns } from "@/lib/workforce/outreach";
import { getPosts, parseMusePost } from "@/lib/workforce/posts";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import {
  type OSAsset,
  type OSAssetKind,
  type OSCampaign,
  type OSDraft,
  type OSMarketing,
  type OSPublished,
  type OSWeekSlot,
  WEEK_DAYS,
} from "./marketing-types";

// Marketing (owner: Muse). Reads muse posts (published + stats), muse's pending
// approvals as drafts, hunter+muse campaigns (shared table), and the assets stored
// on each campaign's `assets` jsonb (campaign-assets bucket). Server-only; shared
// types + consts live in ./marketing-types (client-safe). Defensive throughout.
export type { OSMarketing } from "./marketing-types";

const CAMPAIGN_COLLAB: Record<string, AgentKey[]> = {
  hunter: ["scout", "scribe"],
  muse: ["scribe", "hunter"],
};
const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);

type MuseApprovalRow = {
  id: number;
  action: string | null;
  draft: string | null;
};

export async function loadMarketing(): Promise<OSMarketing> {
  const [posts, hunterCamps, museCamps, draftRows] = await Promise.all([
    getPosts("muse").catch(() => []),
    getCampaigns("hunter").catch(() => []),
    getCampaigns("muse").catch(() => []),
    (async () => {
      try {
        const { data } = await supabaseAdmin()
          .from("approvals")
          .select("id, action, draft")
          .eq("agent_id", "muse")
          .eq("status", "pending")
          .order("ts", { ascending: false });
        return (data as MuseApprovalRow[] | null) ?? [];
      } catch {
        return [] as MuseApprovalRow[];
      }
    })(),
  ]);

  // ── drafts: muse's pending approvals waiting for your tap ───────────────────
  const drafts: OSDraft[] = draftRows.map((r) => {
    const mp = parseMusePost(r.draft);
    return {
      id: String(r.id),
      title:
        (r.action ?? "post").replace(
          /^\s*(linkedin|instagram)[-\s]?post:?\s*/i,
          "",
        ) || "post",
      channel:
        mp?.channel ??
        (/(instagram)/i.test(r.action ?? "") ? "instagram" : "linkedin"),
      state: "waiting" as const,
      pct: 0,
      approvalId: r.id,
    };
  });

  // ── published: muse posts with stats ────────────────────────────────────────
  const pub = posts.filter(
    (p) => p.status === "published" || p.status === "posted_by_owner",
  );
  const maxImp = Math.max(1, ...pub.map((p) => p.stats.impressions ?? 0));
  const published: OSPublished[] = pub.slice(0, 8).map((p) => ({
    id: p.id,
    title: p.text.split("\n")[0]?.slice(0, 70) || "post",
    channel: p.channel,
    when: ago(p.published_at ?? p.ts),
    impressions: p.stats.impressions ?? 0,
    reactions: p.stats.reactions ?? 0,
    comments: p.stats.comments ?? 0,
    barPct: Math.round(((p.stats.impressions ?? 0) / maxImp) * 100),
  }));

  const learned =
    published.length > 0
      ? `"${published.slice().sort((a, b) => b.impressions - a.impressions)[0].title}" was the week's best post.`
      : "";

  // ── week plan: current mon–sun, published posts placed by their day ─────────
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7; // mon=0 … sun=6
  const bySlot = new Map<number, (typeof pub)[number]>();
  for (const p of pub) {
    const d = p.published_at ?? p.ts;
    if (!d) continue;
    const idx = (new Date(d).getDay() + 6) % 7;
    // only keep posts published within the last 7 days in the week strip
    if (!bySlot.has(idx)) bySlot.set(idx, p);
  }
  const week: OSWeekSlot[] = WEEK_DAYS.map((day, i) => {
    const p = bySlot.get(i);
    return p
      ? {
          day,
          today: i === todayIdx,
          channel: p.channel,
          title: p.text.split("\n")[0]?.slice(0, 48) || "post",
          status: "published" as const,
          open: false,
        }
      : {
          day,
          today: i === todayIdx,
          channel: null,
          title: null,
          status: "" as const,
          open: true,
        };
  });

  // ── campaigns: hunter + muse, shared table ──────────────────────────────────
  const campaigns: OSCampaign[] = [...hunterCamps, ...museCamps].map((c) => {
    const owner = (c.agent_id === "muse" ? "muse" : "hunter") as AgentKey;
    const objs =
      owner === "muse"
        ? c.rules.platforms.filter(Boolean).join(" · ") || "content"
        : c.rules.channels.filter(Boolean).join(" · ") || "outreach";
    const sq = c.rules.search_queries.filter(Boolean);
    return {
      id: c.id,
      name: c.name,
      owner,
      ownerName: cap(owner),
      status: c.status,
      collab: CAMPAIGN_COLLAB[owner] ?? [],
      objs,
      assets: c.assets.length,
      aps: 0,
      last: ago(c.updated_at),
      description: c.description,
      goal: c.goal,
      platforms: c.rules.platforms.filter(Boolean),
      searchQueries: sq,
      dailyCap: c.rules.daily_cap,
      notes: (c as unknown as { notes?: string }).notes ?? "",
      searchQueryCount: sq.length,
    };
  });

  // ── assets: flattened from every campaign's assets jsonb ────────────────────
  const assets: OSAsset[] = [];
  for (const c of [...hunterCamps, ...museCamps]) {
    const owner = (c.agent_id === "muse" ? "muse" : "hunter") as AgentKey;
    c.assets.forEach((a, i) => {
      const kind: OSAssetKind =
        a.type === "image" ? "image" : a.type === "video" ? "video" : "copy";
      assets.push({
        id: `${c.id}-${i}`,
        name: a.title || "asset",
        kind,
        by: owner,
        used: c.name,
        url: a.url,
        text: kind === "copy" ? a.use || a.title || a.url : "",
      });
    });
  }

  return { week, drafts, published, learned, campaigns, assets };
}
