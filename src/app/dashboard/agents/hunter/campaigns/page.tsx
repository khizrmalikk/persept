import { HunterTabs } from "@/app/dashboard/_components/HunterTabs";
import {
  type CampaignStat,
  CampaignsPanel,
} from "@/app/dashboard/_components/panels/CampaignsPanel";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import {
  type Campaign,
  getCampaigns,
  getHandoffs,
  getMessages,
  getOpenHandoffCount,
  slugify,
} from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

// Hunter's campaigns board. Counts are derived the same way the bridge slugs a
// campaign (name → slug) so a prospect's `campaign` column lines up with its card.
export default async function CampaignsPage() {
  const [campaigns, messages, handoffsOpen, prospectsFile, handoffCount] =
    await Promise.all([
      getCampaigns("hunter"),
      getMessages("hunter"),
      getHandoffs("hunter", ["open"]),
      getAgentFile("hunter", "PROSPECTS.md"),
      getOpenHandoffCount("hunter"),
    ]);

  const rows = parseMarkdownTable(prospectsFile?.content).rows as Record<
    string,
    string
  >[];

  const stats: Record<string, CampaignStat> = {};
  for (const c of campaigns)
    stats[c.id] = { sent: 0, replies: 0, handoffs: 0, prospects: 0 };
  for (const m of messages) {
    const s = m.campaign_id ? stats[m.campaign_id] : undefined;
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
      stats[c.id].prospects++;
      companyToCampaign.set((r.company ?? "").toLowerCase(), c);
    }
  }
  for (const h of handoffsOpen) {
    const c = companyToCampaign.get((h.company ?? "").toLowerCase());
    if (c) stats[c.id].handoffs++;
  }

  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-head">
        <HunterTabs handoffCount={handoffCount} />
      </div>
      <div className="wf-hub-scroll">
        <CampaignsPanel campaigns={campaigns} stats={stats} />
      </div>
    </div>
  );
}
