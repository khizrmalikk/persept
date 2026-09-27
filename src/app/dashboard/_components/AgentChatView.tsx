import { Fragment, type ReactNode } from "react";

// The generic agent page — the same office-style grid every surface now uses:
// a slim identity bar on top, then three columns. LEFT: the agent's work (its
// brief, backlog, memory and role-specific panels). CENTER: the chat. RIGHT:
// approvals waiting on the owner + recent runs. Purely presentational: the server
// page fetches everything and hands the three regions in as nodes.

export type AgentIdentity = {
  emoji: string;
  name: string;
  statusKey: string;
  statusLabel: string;
  model: string;
  lastActive: string;
  currentTask: string | null;
};

export function AgentChatView({
  identity,
  chat,
  work,
  approvals,
  runs,
}: {
  identity: AgentIdentity;
  chat: ReactNode;
  work: ReactNode;
  approvals: ReactNode;
  runs: ReactNode;
}) {
  return (
    <div className="wf-hub wf-dark wf-agentview">
      <section className="wf-agent-identity" aria-label={`${identity.name}`}>
        <span className="wf-agent-identity-emoji" aria-hidden="true">
          {identity.emoji}
        </span>
        <div className="wf-agent-identity-main">
          <h1 className="wf-agent-identity-name">{identity.name}</h1>
          <span className={`wf-agent-identity-pill is-${identity.statusKey}`}>
            <span className={`wf-of-rost-dot ${identity.statusKey}`} />
            {identity.statusLabel}
          </span>
        </div>
        <dl className="wf-agent-identity-meta">
          {identity.currentTask && (
            <div>
              <dt>task</dt>
              <dd>{identity.currentTask}</dd>
            </div>
          )}
          {identity.model && (
            <div>
              <dt>model</dt>
              <dd className="mono">{identity.model}</dd>
            </div>
          )}
          <div>
            <dt>last active</dt>
            <dd>{identity.lastActive}</dd>
          </div>
        </dl>
      </section>

      <div className="wf-hub-body wf-agent-body">
        <aside className="wf-of-left wf-hub-col" aria-label="work">
          {work}
        </aside>
        <section className="wf-hub-center" aria-label="chat">
          {chat}
        </section>
        <aside
          className="wf-of-right wf-hub-col"
          aria-label="approvals and runs"
        >
          <Fragment key="approvals">{approvals}</Fragment>
          <Fragment key="runs">{runs}</Fragment>
        </aside>
      </div>
    </div>
  );
}
