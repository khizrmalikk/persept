import { supabaseAdmin } from "@/lib/supabase/server";
import { getCopyLibrary, getInFlightCopy } from "@/lib/workforce/copy";
import {
  type AgentFile,
  listAgentFiles,
  parseMarkdownTable,
} from "@/lib/workforce/files";
import { getCampaigns } from "@/lib/workforce/outreach";
import {
  getPosts,
  parseFrontMatter,
  parseMusePost,
} from "@/lib/workforce/posts";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import type { OSCopyRow } from "./copy-types";
import {
  type OSAsset,
  type OSAssetKind,
  type OSCampaign,
  type OSDraft,
  type OSMarketing,
  type OSPublished,
  type OSWeekItem,
  type OSWeekSlot,
  WEEK_DAYS,
  type WeekCampaign,
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

// ── Asia/Dubai week maths ──────────────────────────────────────────────────────
// Dubai is a fixed +04:00 (no DST), but we still resolve calendar parts via Intl
// so the day boundary is honest. Day cards run Sunday → Saturday.
const TZ = "Asia/Dubai";
const WD: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Dubai calendar parts for an instant: {ymd "YYYY-MM-DD", wd 0=Sun…6=Sat}
function dubaiParts(iso: string | Date): { ymd: string; wd: number } {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return { ymd: "", wd: 0 };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    wd: WD[get("weekday")] ?? 0,
  };
}

// a stable Date at noon UTC for a Y-M-D (so ±day arithmetic never crosses a day)
const noonUTC = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 12));
const ymdOf = (dt: Date) =>
  `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
const prettyYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = noonUTC(y, m, d);
  const wd = Object.keys(WD)[dt.getUTCDay()];
  return `${wd} ${d} ${MON[m - 1]}`;
};

// ISO week (Mon-based) of a Y-M-D, plus its ISO week-year → "2026-W43"
function isoWeekTag(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = noonUTC(y, m, d);
  const dayNum = (dt.getUTCDay() + 6) % 7; // Mon=0
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3); // Thursday of this week
  const isoYear = dt.getUTCFullYear();
  const firstThu = noonUTC(isoYear, 1, 4);
  const firstDayNum = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDayNum + 3);
  const week =
    1 + Math.round((dt.getTime() - firstThu.getTime()) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

const isSuperseded = (content: string | null | undefined) =>
  /superseded/i.test((content ?? "").split("\n").slice(0, 3).join("\n"));

type MuseApprovalRow = {
  id: number;
  ts: string | null;
  action: string | null;
  draft: string | null;
};

export async function loadMarketing(): Promise<OSMarketing> {
  const [
    posts,
    hunterCamps,
    museCamps,
    postFiles,
    planFiles,
    copyLib,
    inFlightAll,
    draftRows,
  ] = await Promise.all([
    getPosts("muse").catch(() => []),
    getCampaigns("hunter").catch(() => []),
    getCampaigns("muse").catch(() => []),
    listAgentFiles("muse", "posts/").catch(() => [] as AgentFile[]),
    listAgentFiles("muse", "plan/").catch(() => [] as AgentFile[]),
    getCopyLibrary(200).catch(() => []),
    getInFlightCopy().catch(() => []),
    (async () => {
      try {
        const { data } = await supabaseAdmin()
          .from("approvals")
          .select("id, ts, action, draft")
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
      body: mp?.body || String(r.draft ?? ""),
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
    text: p.text,
    url: p.url ?? "",
    date: prettyYmd(dubaiParts(p.published_at ?? p.ts).ymd),
  }));

  // ── copy library: everything Scribe has written (copy_requests with a body) ──
  const library: OSCopyRow[] = copyLib.map((r) => ({
    id: r.id,
    forAgent: r.for_agent,
    writer: r.writer,
    kind: r.kind,
    channel: r.channel,
    company: r.company,
    contact: r.contact,
    campaign: r.campaign,
    subject: r.subject,
    body: r.body,
    when: ago(r.ts),
    ts: r.ts,
    status: r.approvalStatus,
  }));

  const learned =
    published.length > 0
      ? `"${published.slice().sort((a, b) => b.impressions - a.impressions)[0].title}" was the week's best post.`
      : "";

  // ── this week (Sun–Sat, Asia/Dubai) ─────────────────────────────────────────
  // A post sits on a day card only if its OWN date falls inside this week; older
  // posts stay in the published list below. Each day is filled by priority:
  // published → a draft/approval pending that day → a planned slot → "+ ask Muse".
  const today = dubaiParts(new Date());
  const [ty, tm, td] = today.ymd.split("-").map(Number);
  const sunday = noonUTC(ty, tm, td);
  sunday.setUTCDate(sunday.getUTCDate() - today.wd); // back to the week's Sunday
  const dayYmds = Array.from({ length: 7 }, (_, i) =>
    ymdOf(new Date(sunday.getTime() + i * 86400000)),
  );
  const weekStart = dayYmds[0];
  const weekEnd = dayYmds[6];
  const inWeek = (ymd: string) => !!ymd && ymd >= weekStart && ymd <= weekEnd;
  const firstLine = (t: string) => t.split("\n")[0]?.slice(0, 48) || "post";
  const normKey = (s: string) =>
    s.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120);

  // campaign + front-matter date from Muse's mirrored posts/*.md, matched by body
  const parsedFiles = postFiles.map((f) => {
    const { data, body } = parseFrontMatter(f.content);
    const camp = (data.campaign ?? "").toLowerCase();
    return {
      key: normKey(body),
      campaign: (camp === "gyst"
        ? "gyst"
        : camp === "persept"
          ? "persept"
          : null) as WeekCampaign,
      date:
        (data.date ?? "").slice(0, 10) ||
        (f.path.split("/").pop() ?? "").slice(0, 10),
    };
  });
  const matchFile = (text: string) => {
    const want = normKey(text);
    if (!want) return null;
    return (
      parsedFiles.find(
        (pf) => pf.key && (pf.key.startsWith(want) || want.startsWith(pf.key)),
      ) ?? null
    );
  };

  const pubByDay: OSWeekItem[][] = dayYmds.map(() => []);
  const waitByDay: OSWeekItem[][] = dayYmds.map(() => []);
  const planByDay: OSWeekItem[][] = dayYmds.map(() => []);
  // stack up to two a day, never two of the same campaign
  const add = (bucket: OSWeekItem[][], idx: number, item: OSWeekItem) => {
    if (idx < 0 || bucket[idx].length >= 2) return;
    if (item.campaign && bucket[idx].some((x) => x.campaign === item.campaign))
      return;
    bucket[idx].push(item);
  };

  for (const p of pub) {
    const f = matchFile(p.text);
    // date: posted_at/ts, else the post file's front-matter date
    let ymd = dubaiParts(p.published_at ?? p.ts).ymd;
    if (!inWeek(ymd) && f && inWeek(f.date)) ymd = f.date;
    if (!inWeek(ymd)) continue;
    add(pubByDay, dayYmds.indexOf(ymd), {
      status: "published",
      channel: p.channel,
      campaign: f?.campaign ?? null,
      title: firstLine(p.text),
      approvalId: null,
    });
  }

  for (const r of draftRows) {
    const mp = parseMusePost(r.draft);
    const f = matchFile(mp?.body ?? r.draft ?? "");
    // date: the approval's ts, else the matched post file's front-matter date
    let ymd = dubaiParts(r.ts ?? "").ymd;
    if (!inWeek(ymd) && f && inWeek(f.date)) ymd = f.date;
    if (!inWeek(ymd)) continue;
    add(waitByDay, dayYmds.indexOf(ymd), {
      status: "waiting",
      channel:
        mp?.channel ??
        (/instagram/i.test(r.action ?? "") ? "instagram" : "linkedin"),
      campaign: f?.campaign ?? null,
      title:
        (r.action ?? "post").replace(
          /^\s*(linkedin|instagram)[-\s]?post:?\s*/i,
          "",
        ) || "post",
      approvalId: r.id,
    });
  }

  // the plan: this ISO week's file, else the newest non-superseded plan that
  // mentions a day inside the window.
  const wantTag = isoWeekTag(today.ymd);
  let planFile: AgentFile | undefined = planFiles.find(
    (f) => f.path.endsWith(`${wantTag}.md`) && !isSuperseded(f.content),
  );
  if (!planFile)
    planFile = planFiles.find(
      (f) =>
        !isSuperseded(f.content) &&
        dayYmds.some((d) => (f.content ?? "").includes(d)),
    );
  if (planFile) {
    for (const row of parseMarkdownTable(planFile.content).rows) {
      const dateCell = (row.date ?? "").slice(0, 10);
      let idx = -1;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateCell)) idx = dayYmds.indexOf(dateCell);
      else
        idx = (WEEK_DAYS as readonly string[]).indexOf(
          (row.day ?? "").slice(0, 3).toLowerCase(),
        );
      if (idx < 0) continue;
      const camp = (row.campaign ?? "").toLowerCase();
      add(planByDay, idx, {
        status: "planned",
        channel: (row.channel || row.platform || "").toLowerCase() || null,
        campaign: (camp === "gyst"
          ? "gyst"
          : camp === "persept"
            ? "persept"
            : null) as WeekCampaign,
        title: (
          row.angle ||
          row.theme ||
          row.topic ||
          row.post ||
          row.idea ||
          "planned post"
        ).slice(0, 48),
        approvalId: null,
      });
    }
  }

  const week: OSWeekSlot[] = WEEK_DAYS.map((day, i) => ({
    day,
    date: dayYmds[i],
    today: dayYmds[i] === today.ymd,
    items: pubByDay[i].length
      ? pubByDay[i]
      : waitByDay[i].length
        ? waitByDay[i]
        : planByDay[i],
  }));

  const planTag = planFile
    ? (planFile.path.match(/(\d{4}-W\d{2})/)?.[1] ?? wantTag)
    : wantTag;
  const editedWhen = planFile?.updated_at
    ? prettyYmd(dubaiParts(planFile.updated_at).ymd)
    : "";
  const planCaption = planFile
    ? `plan · ${planTag} · edited by Muse${editedWhen ? ` ${editedWhen}` : ""}`
    : null;

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
      channels: c.rules.channels.filter(Boolean),
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

  return {
    week,
    planCaption,
    drafts,
    published,
    library,
    inFlight: inFlightAll.filter((r) => r.forAgent === "muse"),
    learned,
    campaigns,
    assets,
  };
}
