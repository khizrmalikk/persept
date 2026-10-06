import { HunterCampaignForm } from "@/app/dashboard/_components/HunterCampaignForm";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { DEFAULT_RULES } from "@/lib/workforce/outreach";
import { getHunterHeaderStats } from "../../_data";
import "../../../../hunter.css";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const [{ stats, pending }, sp] = await Promise.all([
    getHunterHeaderStats(),
    searchParams,
  ]);
  const owner = sp.owner === "muse" ? "muse" : "hunter";
  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <HunterCampaignForm
        initial={{
          id: "",
          name: "",
          status: "active",
          owner,
          goal: "",
          audience: "",
          offer: "",
          description: "",
          channels: [...DEFAULT_RULES.channels],
          daily_cap: DEFAULT_RULES.daily_cap,
          follow_up_days: [...DEFAULT_RULES.follow_up_days],
          search_queries: [],
          platforms: [],
          starts: "",
          ends: "",
          assets: [],
          slug: "",
        }}
      />
    </div>
  );
}
