import { getAgentFile } from "@/lib/workforce/files";
import { HudPanel } from "./HudPanel";
import { Markdown } from "./Markdown";

// hunter's current offer (OFFER.md), rendered markdown, collapsed by default.
export async function OfferPanel({ agentId = "hunter" }: { agentId?: string }) {
  const file = await getAgentFile(agentId, "OFFER.md");
  if (!file?.content?.trim()) {
    return (
      <HudPanel title="offer">
        <p className="empty">{agentId} has not written an offer yet</p>
      </HudPanel>
    );
  }
  return (
    <HudPanel collapsible title="offer" right="read">
      <Markdown source={file.content} />
    </HudPanel>
  );
}
