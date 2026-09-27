"use client";

import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import type { Thread } from "@/lib/workforce/outreach";
import { HunterTabs } from "./HunterTabs";
import { type CampaignOption, Compose } from "./panels/Compose";
import { Conversations, type ReplySeed } from "./panels/Conversations";

// Hunter's chat page — the office layout, applied to one agent: the chat is the
// centrepiece, and the data that matters to Hunter flanks it. LEFT: the prospect
// pipeline + open hand-offs. CENTER: the chat. RIGHT: pending approvals, the
// conversation log and the "send as me" composer (a reply pre-fills the composer,
// which is why this shell is a client component that owns the reply seed).

export type HunterStats = {
  prospects: number;
  replied: number;
  handoffs: number;
  waiting: number;
};

export function HunterChatView({
  chat,
  stats,
  leads,
  pipeline,
  approvals,
  handoffs,
  threads,
  handedOff,
  campaigns,
  handoffCount,
}: {
  chat: ReactNode;
  stats: HunterStats;
  leads?: ReactNode;
  pipeline: ReactNode;
  approvals: ReactNode;
  handoffs: ReactNode;
  threads: Thread[];
  handedOff: string[];
  campaigns: CampaignOption[];
  handoffCount: number;
}) {
  const [seed, setSeed] = useState<ReplySeed | null>(null);
  const handedSet = new Set(handedOff.map((s) => s.toLowerCase()));

  return (
    <div className="wf-hub wf-dark">
      <div className="wf-hub-head">
        <HunterTabs handoffCount={handoffCount} />
      </div>

      <section
        className="wf-of-stats wf-hub-stats"
        aria-label="hunter at a glance"
      >
        <Stat n={stats.prospects} label="prospects" />
        <Stat n={stats.replied} label="replied" />
        <Stat
          n={stats.handoffs}
          label="hand-offs"
          attention={stats.handoffs > 0}
        />
        <Stat
          n={stats.waiting}
          label="waiting on you"
          attention={stats.waiting > 0}
        />
      </section>

      <div className="wf-hub-body">
        <aside
          className="wf-of-left wf-hub-col"
          aria-label="leads, pipeline, hand-offs and compose"
        >
          {leads && <Fragment key="leads">{leads}</Fragment>}
          <Fragment key="pipeline">{pipeline}</Fragment>
          <Fragment key="handoffs">{handoffs}</Fragment>
          <Compose
            key="compose"
            campaigns={campaigns}
            seed={seed}
            onConsumed={() => setSeed(null)}
          />
        </aside>

        <section className="wf-hub-center" aria-label="chat">
          {chat}
        </section>

        <aside
          className="wf-of-right wf-hub-col"
          aria-label="approvals and conversations"
        >
          <Fragment key="approvals">{approvals}</Fragment>
          <section key="conversations" className="wf-of-panel">
            <div className="wf-of-panel-head">
              <h2>conversations</h2>
            </div>
            <div className="wf-of-panel-body">
              <Conversations
                threads={threads}
                handedOff={handedSet}
                onReply={setSeed}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  n,
  label,
  attention,
}: {
  n: number;
  label: string;
  attention?: boolean;
}) {
  return (
    <div className={`wf-of-stat ${attention ? "attention" : ""}`}>
      <span className="wf-of-stat-n">{n}</span>
      <span className="wf-of-stat-l">{label}</span>
    </div>
  );
}
