"use client";

import { type ReactNode, useState } from "react";

// Hunter's page is two tabs — "outreach" (the CRM: campaigns, pipeline,
// conversations, compose, hand-offs) and "chat" (the same modern agent chat every
// other agent has). Both halves are rendered on the server and handed here as
// ReactNodes; this shell owns only which tab is showing. Outreach is the default.
export function HunterWorkspace({
  outreach,
  chat,
  handoffCount,
}: {
  outreach: ReactNode;
  chat: ReactNode;
  handoffCount: number;
}) {
  const [tab, setTab] = useState<"outreach" | "chat">("outreach");
  return (
    <div className="wf-hunter">
      <div className="wf-hunter-tabs" role="tablist" aria-label="hunter">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "outreach"}
          className={`wf-hunter-tab${tab === "outreach" ? " is-active" : ""}`}
          onClick={() => setTab("outreach")}
        >
          outreach
          {handoffCount > 0 && (
            <span className="wf-hunter-tab-badge">{handoffCount}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chat"}
          className={`wf-hunter-tab${tab === "chat" ? " is-active" : ""}`}
          onClick={() => setTab("chat")}
        >
          chat
        </button>
      </div>
      {/* Both panes stay mounted so the chat transcript / scroll position and any
          in-progress compose text survive a tab switch; the hidden one is inert. */}
      <div
        className="wf-hunter-pane"
        role="tabpanel"
        hidden={tab !== "outreach"}
        aria-label="outreach"
      >
        {outreach}
      </div>
      <div
        className="wf-hunter-pane wf-hunter-pane-chat"
        role="tabpanel"
        hidden={tab !== "chat"}
        aria-label="chat"
      >
        {chat}
      </div>
    </div>
  );
}
