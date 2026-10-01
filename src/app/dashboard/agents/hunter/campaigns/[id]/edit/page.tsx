import { notFound } from "next/navigation";
import { HunterCampaignForm } from "@/app/dashboard/_components/HunterCampaignForm";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { getCampaign, slugify } from "@/lib/workforce/outreach";
import { getHunterHeaderStats } from "../../../_data";
import "../../../../../hunter.css";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ stats, pending }, campaign] = await Promise.all([
    getHunterHeaderStats(),
    getCampaign(id),
  ]);
  if (!campaign) notFound();

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <HunterCampaignForm
        initial={{
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          owner: campaign.agent_id,
          goal: campaign.goal,
          audience: campaign.audience,
          offer: campaign.offer,
          description: campaign.description,
          channels: campaign.rules.channels,
          daily_cap: campaign.rules.daily_cap,
          follow_up_days: campaign.rules.follow_up_days,
          search_queries: campaign.rules.search_queries,
          platforms: campaign.rules.platforms,
          starts: campaign.rules.starts,
          ends: campaign.rules.ends,
          assets: campaign.assets,
          slug: slugify(campaign.name),
        }}
      />
    </div>
  );
}
