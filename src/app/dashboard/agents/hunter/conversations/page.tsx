import { ConversationsBoard } from "@/app/dashboard/_components/ConversationsBoard";
import { HunterTabs } from "@/app/dashboard/_components/HunterTabs";
import {
  getCampaigns,
  getHandoffs,
  getMessages,
  getOpenHandoffCount,
  groupThreads,
  slugify,
} from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

// Hunter's full conversation log — every thread + the "send as me" composer. The
// chat page shows a compact version alongside the chat; this is the whole thing.
export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const [messages, handoffsOpen, campaigns, handoffCount] = await Promise.all([
    getMessages("hunter"),
    getHandoffs("hunter", ["open"]),
    getCampaigns("hunter"),
    getOpenHandoffCount("hunter"),
  ]);
  const threads = groupThreads(messages);
  const handedOff = handoffsOpen
    .map((h) => (h.company ?? "").toLowerCase())
    .filter(Boolean);
  const campaignOptions = campaigns.map((c) => ({
    slug: slugify(c.name),
    name: c.name,
  }));

  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-head">
        <HunterTabs handoffCount={handoffCount} />
      </div>
      <div className="wf-hub-scroll">
        <div className="wf-prospects">
          <h1 className="wf-campaigns-title">conversations</h1>
          <ConversationsBoard
            threads={threads}
            handedOff={handedOff}
            campaigns={campaignOptions}
            initialFilter={filter}
          />
        </div>
      </div>
    </div>
  );
}
