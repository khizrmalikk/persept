"use client";

import { useState } from "react";
import type { Thread } from "@/lib/workforce/outreach";
import { type CampaignOption, Compose } from "./panels/Compose";
import { Conversations, type ReplySeed } from "./panels/Conversations";

// Full-page conversation log for Hunter: every thread with its filters, plus the
// "send as me" composer. A reply on an inbound message pre-fills the composer, so
// this owns the reply seed (which is why it's a client shell).
export function ConversationsBoard({
  threads,
  handedOff,
  campaigns,
  initialFilter,
}: {
  threads: Thread[];
  handedOff: string[];
  campaigns: CampaignOption[];
  initialFilter?: string;
}) {
  const [seed, setSeed] = useState<ReplySeed | null>(null);
  const handedSet = new Set(handedOff.map((s) => s.toLowerCase()));
  return (
    <div className="wf-conv-board">
      <section className="wf-of-panel">
        <div className="wf-of-panel-head">
          <h2>conversations</h2>
        </div>
        <div className="wf-of-panel-body">
          <Conversations
            threads={threads}
            handedOff={handedSet}
            onReply={setSeed}
            initialFilter={initialFilter}
          />
        </div>
      </section>
      <Compose
        campaigns={campaigns}
        seed={seed}
        onConsumed={() => setSeed(null)}
      />
    </div>
  );
}
