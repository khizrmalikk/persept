import { HunterCampaignForm } from "@/app/dashboard/_components/HunterCampaignForm";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { DEFAULT_RULES } from "@/lib/workforce/outreach";
import { getHunterHeaderStats } from "../../_data";
import "../../../../hunter.css";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const { stats, pending } = await getHunterHeaderStats();
  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <HunterCampaignForm
        initial={{
          id: "",
          name: "",
          status: "active",
          goal: "",
          audience: "",
          offer: "",
          description: "",
          channels: [...DEFAULT_RULES.channels],
          daily_cap: DEFAULT_RULES.daily_cap,
          follow_up_days: [...DEFAULT_RULES.follow_up_days],
          assets: [],
          slug: "",
        }}
      />
    </div>
  );
}
