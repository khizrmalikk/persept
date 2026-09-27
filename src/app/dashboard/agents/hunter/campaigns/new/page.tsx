import Link from "next/link";
import { CampaignEditor } from "@/app/dashboard/_components/panels/CampaignEditor";
import { type Campaign, DEFAULT_RULES } from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

// New campaign → the editor with an empty draft. Saving writes the row and
// redirects to the campaign's page.
export default function NewCampaignPage() {
  const campaign: Campaign = {
    id: "",
    agent_id: "hunter",
    name: "",
    status: "active",
    goal: "",
    audience: "",
    offer: "",
    description: "",
    assets: [],
    rules: { ...DEFAULT_RULES },
    created_at: null,
    updated_at: null,
  };
  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-scroll">
        <div className="wf-campaign-editor-bar">
          <Link href="/dashboard/agents/hunter/campaigns" className="wf-back">
            ← campaigns
          </Link>
          <span className="wf-campaign-editor-title">new campaign</span>
        </div>
        <CampaignEditor campaign={campaign} isNew />
      </div>
    </div>
  );
}
