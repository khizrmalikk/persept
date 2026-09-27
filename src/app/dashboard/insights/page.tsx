import { getInsights } from "@/lib/workforce/insights";
import { InsightsView } from "../_components/InsightsView";
import "../insights.css";

// Insights (redesign): all derivation happens server-side in getInsights (real
// events/tasks/subagents/approvals); the client view only holds the range toggle.
export const dynamic = "force-dynamic";

export default async function Insights() {
  const data = await getInsights();
  return <InsightsView data={data} />;
}
