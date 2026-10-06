import Link from "next/link";
import { DeleteCampaignButton } from "@/app/dashboard/_components/DeleteCampaignButton";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import {
  type Campaign,
  getCampaigns,
  getCandidateCounts,
  getHandoffs,
  getMessages,
  slugify,
} from "@/lib/workforce/outreach";
import { getHunterHeaderStats } from "../_data";
import "../../../hunter.css";

export const dynamic = "force-dynamic";

const HN = "oklch(0.78 0.12 150)";
function stPill(status: string): { background: string; color: string } {
  if (status === "active")
    return { background: "oklch(0.78 0.12 150 / 0.16)", color: HN };
  if (status === "paused")
    return { background: "rgba(255,255,255,0.07)", color: "var(--ink-mut)" };
  return { background: "rgba(255,255,255,0.05)", color: "var(--ink-faint)" };
}

export default async function CampaignsPage() {
  const [
    { stats, pending },
    campaigns,
    messages,
    handoffsOpen,
    prospectsFile,
    candidateCounts,
  ] = await Promise.all([
    getHunterHeaderStats(),
    getCampaigns("hunter"),
    getMessages("hunter"),
    getHandoffs("hunter", ["open"]),
    getAgentFile("hunter", "PROSPECTS.md"),
    getCandidateCounts(30),
  ]);

  const rows = parseMarkdownTable(prospectsFile?.content).rows;
  const cstats: Record<
    string,
    { sent: number; replies: number; handoffs: number; prospects: number }
  > = {};
  for (const c of campaigns)
    cstats[c.id] = { sent: 0, replies: 0, handoffs: 0, prospects: 0 };
  for (const m of messages) {
    const s = m.campaign_id ? cstats[m.campaign_id] : undefined;
    if (!s) continue;
    if (m.direction === "out") s.sent++;
    else s.replies++;
  }
  const slugToCampaign = new Map<string, Campaign>();
  for (const c of campaigns) slugToCampaign.set(slugify(c.name), c);
  const companyToCampaign = new Map<string, Campaign>();
  for (const r of rows) {
    const c = slugToCampaign.get((r.campaign ?? "").trim());
    if (c) {
      cstats[c.id].prospects++;
      companyToCampaign.set((r.company ?? "").toLowerCase(), c);
    }
  }
  for (const h of handoffsOpen) {
    const c = companyToCampaign.get((h.company ?? "").toLowerCase());
    if (c) cstats[c.id].handoffs++;
  }

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <div className="wf-hn-intro">
        <span>
          each campaign tells hunter who to reach, what to offer and how hard to
          push.
        </span>
        <Link href="./campaigns/new" className="wf-hn-btn amber">
          new campaign
        </Link>
      </div>
      <div className="wf-hn-board">
        {campaigns.length === 0 && (
          <p className="wf-hn-empty">no campaigns yet. create the first one.</p>
        )}
        {campaigns.map((c) => {
          const s = cstats[c.id];
          const emptyBrief = !c.goal && !c.audience && !c.offer;
          const noQueries =
            c.status === "active" && c.rules.search_queries.length === 0;
          const candidates = candidateCounts[c.id] ?? 0;
          return (
            <div
              key={c.id}
              className="wf-hn-camp"
              style={{ position: "relative" }}
            >
              <Link
                href={`./campaigns/${c.id}`}
                aria-label={c.name}
                style={{ position: "absolute", inset: 0, zIndex: 1 }}
              />
              <div className="wf-hn-camp-top">
                <div className="wf-hn-camp-name">{c.name}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <span className="wf-hn-stpill" style={stPill(c.status)}>
                    {c.status}
                  </span>
                  <Link
                    href={`./campaigns/${c.id}/edit`}
                    title="edit"
                    className="wf-hn-editbtn"
                    style={{ display: "grid", placeItems: "center" }}
                  >
                    ✎
                  </Link>
                  <DeleteCampaignButton id={c.id} name={c.name} />
                </div>
              </div>
              <div className="wf-hn-camp-snippet">
                {c.goal || "no goal yet"}
              </div>
              {emptyBrief && (
                <div className="wf-hn-camp-warn">
                  brief is empty · hunter won&rsquo;t draft until goal, audience
                  and offer are filled in
                </div>
              )}
              {noQueries && (
                <div className="wf-hn-camp-warn">
                  no search queries · no new prospects will be found for this
                  campaign
                </div>
              )}
              <div className="wf-hn-camp-chips">
                {c.rules.channels.map((ch) => (
                  <span key={ch} className="wf-chip-mono">
                    {ch}
                  </span>
                ))}
              </div>
              <div
                className="wf-hn-camp-stats"
                style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
              >
                {(
                  [
                    ["sent", s.sent],
                    ["replies", s.replies],
                    ["hand-offs", s.handoffs],
                    ["prospects", s.prospects],
                    ["candidates", candidates],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <div className="wf-hn-camp-stat-v">{v}</div>
                    <div className="wf-hn-camp-stat-k">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
