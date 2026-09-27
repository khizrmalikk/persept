"use client";

import { type ReactNode, useState } from "react";
import type { Thread } from "@/lib/workforce/outreach";
import { type CampaignOption, Compose } from "./Compose";
import { Conversations, type ReplySeed } from "./Conversations";

// Client glue for the lower half of the outreach tab. Owns the reply seed so a
// "reply" click in a conversation pre-fills the compose box. The pipeline,
// approvals and hand-offs are server-rendered (forms/server actions) and passed in
// as nodes so this component stays a thin interactive shell.
export function OutreachExchange({
  threads,
  handedOff,
  campaigns,
  pipeline,
  approvals,
  handoffs,
}: {
  threads: Thread[];
  handedOff: string[];
  campaigns: CampaignOption[];
  pipeline: ReactNode;
  approvals: ReactNode;
  handoffs: ReactNode;
}) {
  const [seed, setSeed] = useState<ReplySeed | null>(null);
  const handedSet = new Set(handedOff.map((s) => s.toLowerCase()));

  return (
    <div className="wf-out-cols">
      <div className="wf-out-main">
        {pipeline}
        <section className="wf-out-section" aria-label="conversations">
          <h3 className="wf-out-h">conversations</h3>
          <Conversations
            threads={threads}
            handedOff={handedSet}
            onReply={setSeed}
          />
        </section>
      </div>
      <aside className="wf-out-rail">
        <Compose
          campaigns={campaigns}
          seed={seed}
          onConsumed={() => setSeed(null)}
        />
        {approvals}
        {handoffs}
      </aside>
    </div>
  );
}
