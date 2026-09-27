import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignEditor } from "@/app/dashboard/_components/panels/CampaignEditor";
import { getCampaign } from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

// Edit an existing campaign. Reached from the pencil on a campaign card or the
// "edit" button on the campaign page. Saving redirects back to the campaign page.
export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-scroll">
        <div className="wf-campaign-editor-bar">
          <Link
            href={`/dashboard/agents/hunter/campaigns/${id}`}
            className="wf-back"
          >
            ← {campaign.name || "campaign"}
          </Link>
          <span className="wf-campaign-editor-title">
            edit · {campaign.name || "campaign"}
          </span>
        </div>
        <CampaignEditor campaign={campaign} isNew={false} />
      </div>
    </div>
  );
}
