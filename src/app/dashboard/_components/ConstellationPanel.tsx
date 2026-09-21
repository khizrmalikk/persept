"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ConstellationWorker } from "@/lib/workforce/types";
import {
  AgentConstellation,
  type ConstellationAgent,
  type ConstellationSubAgent,
} from "./AgentConstellation";
import { CallPanel } from "./CallPanel";
import { type ChatMessage, ChatPane } from "./ChatPane";
import { MonitorWave } from "./MonitorWave";

// Thin client wrapper so a server page can render the 3D constellation and still
// wire node-click navigation (a function can't cross the server→client boundary).
//
// `callAgentId` / `callSpeaking` drive the constellation's live-call animation:
// while a voice call is running the called node pulses (and brightens while the
// agent is speaking). They are forwarded to <AgentConstellation> which owns the
// visual treatment.
export function ConstellationPanel({
  agents,
  subAgents,
  subagents,
  className,
  callAgentId,
  callSpeaking,
  focusAgentId,
  onSelectAgent,
  onCallAgent,
}: {
  agents: ConstellationAgent[];
  subAgents?: ConstellationSubAgent[];
  subagents?: ConstellationWorker[]; // background workers → satellites
  className?: string;
  callAgentId?: string | null; // the agent currently on a call (or null)
  callSpeaking?: boolean; // true while that agent's audio is playing
  // the agent to re-centre the 3D view on (null / hub → centred on the hub).
  // The office passes its selectedId so switching agents in the chat card
  // re-centres the constellation on that agent.
  focusAgentId?: string | null;
  onSelectAgent?: (id: string) => void; // override node-click (office uses this)
  onCallAgent?: (id: string) => void; // hover-call a node → start a voice call
}) {
  const router = useRouter();
  // The call + focus props are forwarded through; AgentConstellation accepts
  // them. The spread keeps this forward-compatible without churn.
  const extraProps = { callAgentId, callSpeaking, focusAgentId } as Record<
    string,
    unknown
  >;
  return (
    <AgentConstellation
      agents={agents}
      subAgents={subAgents}
      subagents={subagents}
      className={className}
      onSelectAgent={
        onSelectAgent ?? ((id) => router.push(`/dashboard/agents/${id}`))
      }
      onCallAgent={onCallAgent}
      {...extraProps}
    />
  );
}

// ── Office (main page) view ─────────────────────────────────────────────────
// The interactive light office: the full-bleed constellation as the centrepiece
// with a calm light overlay (identity/status, live stats, roster, activity peek)
// floating over it, plus call-from-this-page. Lives here (an owned client file)
// so the server page can stay a pure data-fetching server component and hand it
// fully-serializable props.

export type OfficeAgent = {
  id: string;
  name: string;
  emoji: string | null;
  status: string; // raw agent status label (idle/working/…)
  statusLabel: string; // human label
  constStatus: ConstellationAgent["status"]; // status for the 3D node
  isHub: boolean;
  pending: number; // approvals waiting
  workers: number; // running background workers
};

export type OfficeEvent = {
  id: number;
  agent: string;
  summary: string;
  time: string; // preformatted hh:mm:ss
  isError: boolean;
};

export type OfficeData = {
  agents: OfficeAgent[];
  workers: ConstellationWorker[];
  events: OfficeEvent[];
  // Recent chat history per agent (chronological), for the office chat card.
  chatByAgent: Record<string, ChatMessage[]>;
  stats: {
    online: number;
    total: number;
    working: number;
    waiting: number;
    doneToday: number;
  };
  bridgeStale: boolean;
};

// small inline icons (no dep) — decorative, aria-hidden
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5h10v10M19 5 8 16M6 8v10a1 1 0 0 0 1 1h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OfficeView({
  data,
  sendAction,
}: {
  data: OfficeData;
  // The message-send server action, threaded from the server page into the
  // office chat card's composer (same contract the agent page uses).
  sendAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const { agents, workers, events, chatByAgent, stats, bridgeStale } = data;

  // The chat card's currently-selected agent (defaults to the first agent).
  // Switching agents here is a pure UI change; it does NOT start a call.
  const [selectedId, setSelectedId] = useState<string>(agents[0]?.id ?? "");
  const selectedIndex = Math.max(
    0,
    agents.findIndex((a) => a.id === selectedId),
  );
  const selected = agents[selectedIndex] ?? agents[0] ?? null;

  // Call-from-this-page state. `callAgentId` names the agent on a call (null =
  // no call); `callSpeaking` = the agent's audio is currently playing. Both are
  // fed to the constellation to animate the node, and set from CallPanel's
  // onCallState callback. The call lives INSIDE the chat card for that agent.
  const [callAgentId, setCallAgentId] = useState<string | null>(null);
  const [callSpeaking, setCallSpeaking] = useState(false);

  // Select an agent in the chat card AND start a call with them (sphere / roster
  // call button). autoStart on the CallPanel connects the call on mount.
  const startCall = useCallback((id: string) => {
    setSelectedId(id);
    setCallAgentId(id);
    setCallSpeaking(false);
  }, []);
  // Switch the chat card to an agent WITHOUT calling (switcher tabs / arrows).
  const selectAgent = useCallback((id: string) => {
    setSelectedId(id);
  }, []);
  const onCallState = useCallback(
    (s: { active: boolean; speaking: boolean }) => {
      setCallSpeaking(s.speaking);
      // The call ending (active → false) clears the animation on the node.
      if (!s.active) setCallAgentId(null);
    },
    [],
  );

  const goPrev = useCallback(() => {
    if (agents.length === 0) return;
    const i = (selectedIndex - 1 + agents.length) % agents.length;
    setSelectedId(agents[i].id);
  }, [agents, selectedIndex]);
  const goNext = useCallback(() => {
    if (agents.length === 0) return;
    const i = (selectedIndex + 1) % agents.length;
    setSelectedId(agents[i].id);
  }, [agents, selectedIndex]);

  const selectedMessages = useMemo(
    () => (selected ? (chatByAgent[selected.id] ?? []) : []),
    [selected, chatByAgent],
  );

  const constellationAgents: ConstellationAgent[] = agents.map((a) => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    status: a.constStatus,
    isHub: a.isHub,
  }));

  return (
    <div className="wf-office">
      {/* full-bleed constellation stage (dark command deck) */}
      <div className="wf-stage">
        <ConstellationPanel
          agents={constellationAgents}
          subagents={workers}
          className="wf-canvas-full"
          callAgentId={callAgentId}
          callSpeaking={callSpeaking}
          // re-centre the 3D on the chat card's currently-selected agent.
          // selectedId defaults to the first agent, so the hub (Chief) stays
          // centred initially; switching agents in the card re-centres on them.
          focusAgentId={selectedId}
          // Clicking a sphere starts a voice call with that agent (the node then
          // runs its call animation + the call dock opens). Opening the agent's
          // page is done from the roster card's "open" button on the left, so the
          // sphere itself is dedicated to the call action — no fiddly hover popover.
          onSelectAgent={startCall}
        />

        {/* ── rich warm HUD frame (decorative, non-interactive) ───────────── */}
        <div className="wf-hud" aria-hidden="true">
          {/* corner brackets */}
          <span className="wf-hud-bracket tl" />
          <span className="wf-hud-bracket tr" />
          <span className="wf-hud-bracket bl" />
          <span className="wf-hud-bracket br" />

          {/* top readout bar — just a tag + fading rule. No status/counts here:
              the office card (with its own live pill + stats) sits over this area
              and it's translucent, so anything behind it bleeds through. */}
          <div className="wf-hud-readout top">
            <span className="wf-hud-tag">{"//"} workforce</span>
            <span className="wf-hud-sep" />
          </div>

          {/* corner coordinate flavour labels */}
          <span className="wf-hud-coord tl">{"//"} deck.persept · sec-01</span>
          <span className="wf-hud-coord br">lat 25.20 · lon 55.27 {"//"}</span>

          {/* bottom readout bar — system health */}
          <div className="wf-hud-readout bottom">
            <span className="wf-hud-tag">{"//"} sys</span>
            <span className={`wf-hud-sys ${bridgeStale ? "bad" : "ok"}`}>
              {bridgeStale ? "degraded" : "healthy"}
            </span>
            <span className="wf-hud-sep" />
            <span className="wf-hud-metrics">
              <span>
                agents{" "}
                <b>
                  {stats.online}/{stats.total}
                </b>
              </span>
              <span>
                done today <b>{stats.doneToday}</b>
              </span>
            </span>
          </div>

          {/* scanline overlay (reduced-motion-safe via CSS) */}
          <div className="wf-hud-scanlines" />
        </div>
      </div>

      {/* calm light overlay */}
      <div className="wf-overlay">
        <div className="wf-rail-left">
          {/* identity / status */}
          <section className="wf-card wf-ident" aria-label="workforce status">
            <div className="wf-ident-top">
              <div>
                <div className="wf-ident-title">the office</div>
                <div className="wf-ident-sub">
                  {stats.total} {stats.total === 1 ? "agent" : "agents"} on the
                  workforce
                </div>
              </div>
              <span
                className={`wf-status-pill ${bridgeStale ? "stale" : "live"}`}
              >
                <span className={`dot ${bridgeStale ? "stale" : "live"}`} />
                {bridgeStale ? "standby" : "live"}
              </span>
            </div>

            {/* live stats cluster */}
            <div className="wf-stats">
              <div className="wf-stat">
                <span className="wf-stat-n">{stats.online}</span>
                <span className="wf-stat-l">online</span>
              </div>
              <div className="wf-stat">
                <span className="wf-stat-n">{stats.working}</span>
                <span className="wf-stat-l">working</span>
              </div>
              <div
                className={`wf-stat ${stats.waiting > 0 ? "attention" : ""}`}
              >
                <span className="wf-stat-n">{stats.waiting}</span>
                <span className="wf-stat-l">waiting</span>
              </div>
              <div className="wf-stat">
                <span className="wf-stat-n">{stats.doneToday}</span>
                <span className="wf-stat-l">done today</span>
              </div>
            </div>

            {/* live monitoring readout — the office is always watching */}
            <MonitorWave active={!bridgeStale} />
          </section>

          {stats.waiting > 0 && (
            <button
              type="button"
              className="wf-attention"
              onClick={() => router.push("/dashboard/approvals")}
            >
              <span>
                {stats.waiting} {stats.waiting === 1 ? "approval" : "approvals"}{" "}
                waiting for you
              </span>
              <span className="act">review</span>
            </button>
          )}

          {/* roster */}
          <section className="wf-card" aria-label="agents">
            <div className="wf-card-head">
              <h2>roster</h2>
            </div>
            <div className="wf-roster-list">
              {agents.map((a) => (
                <div
                  key={a.id}
                  className={`wf-roster-item ${callAgentId === a.id ? "on-call" : ""}`}
                >
                  <span className="wf-roster-emoji" aria-hidden="true">
                    {a.emoji ?? "•"}
                  </span>
                  <button
                    type="button"
                    className="wf-roster-main"
                    onClick={() => router.push(`/dashboard/agents/${a.id}`)}
                    style={{
                      background: "none",
                      border: 0,
                      textAlign: "left",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <span className="wf-roster-name">{a.name}</span>
                    <span className="wf-roster-meta">
                      <span className={`dot ${a.status}`} />
                      {a.statusLabel}
                      {a.workers > 0
                        ? ` · ${a.workers} worker${a.workers > 1 ? "s" : ""}`
                        : ""}
                    </span>
                  </button>
                  {a.pending > 0 && (
                    <span
                      className="wf-roster-badge"
                      title={`${a.pending} waiting`}
                    >
                      {a.pending}
                    </span>
                  )}
                  <div className="wf-roster-actions">
                    <button
                      type="button"
                      className="wf-icon-btn call"
                      onClick={() => startCall(a.id)}
                      aria-label={`call ${a.name}`}
                      title={`call ${a.name}`}
                    >
                      <PhoneIcon />
                    </button>
                    <button
                      type="button"
                      className="wf-icon-btn"
                      onClick={() => router.push(`/dashboard/agents/${a.id}`)}
                      aria-label={`open ${a.name}`}
                      title={`open ${a.name}`}
                    >
                      <OpenIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* latest activity peek — lives in the left rail so the right rail is
              dedicated to the (tall) chat card and nothing gets cut off. */}
          <section className="wf-card" aria-label="latest activity">
            <div className="wf-card-head">
              <h2>latest</h2>
              <button
                type="button"
                className="wf-see-all"
                onClick={() => router.push("/dashboard/activity")}
              >
                see all
              </button>
            </div>
            {events.length === 0 ? (
              <p className="empty">nothing yet.</p>
            ) : (
              <div className="wf-peek-list">
                {events.map((e) => (
                  <div key={e.id} className="wf-peek-item">
                    <div className="wf-peek-top">
                      <span className="wf-peek-agent">{e.agent}</span>
                      <span className="wf-peek-time">{e.time}</span>
                    </div>
                    <span
                      className={`wf-peek-summary ${e.isError ? "err" : ""}`}
                    >
                      {e.summary}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="wf-center-spacer" aria-hidden="true" />

        <div className="wf-rail-right">
          {/* ── office chat card: switch between agents + chat inline ──────── */}
          {selected && (
            <section className="wf-card wf-chatcard" aria-label="agent chat">
              {/* agent switcher: prev/next arrows + a scrollable tab row */}
              <div className="wf-chatcard-switch">
                <button
                  type="button"
                  className="wf-chatcard-arrow"
                  onClick={goPrev}
                  disabled={agents.length < 2}
                  aria-label="previous agent"
                  title="previous agent"
                >
                  <ChevronIcon dir="left" />
                </button>
                <div
                  className="wf-chatcard-tabs"
                  role="tablist"
                  aria-label="choose an agent to chat with"
                >
                  {agents.map((a) => {
                    const on = a.id === selected.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        className={`wf-chatcard-tab ${on ? "on" : ""} ${
                          callAgentId === a.id ? "on-call" : ""
                        }`}
                        onClick={() => selectAgent(a.id)}
                        title={a.name}
                      >
                        <span
                          className="wf-chatcard-tab-emoji"
                          aria-hidden="true"
                        >
                          {a.emoji ?? "•"}
                        </span>
                        <span className="wf-chatcard-tab-name">{a.name}</span>
                        {a.pending > 0 && (
                          <span className="wf-chatcard-tab-badge">
                            {a.pending}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="wf-chatcard-arrow"
                  onClick={goNext}
                  disabled={agents.length < 2}
                  aria-label="next agent"
                  title="next agent"
                >
                  <ChevronIcon dir="right" />
                </button>
              </div>

              {/* the shared ChatPane for the selected agent — its header holds
                  the round call button, and an active call renders its own roomy
                  transcript section inside the pane. A fresh key per agent resets
                  the pane (and unmounts the previous agent's CallPanel cleanly). */}
              <div className="wf-chatcard-pane">
                <ChatPane
                  key={selected.id}
                  agentId={selected.id}
                  agentName={selected.name}
                  agentEmoji={selected.emoji ?? "◆"}
                  statusLabel={selected.statusLabel}
                  statusKey={selected.status}
                  messages={selectedMessages}
                  sendAction={sendAction}
                  scrollMaxHeight={300}
                  callSlot={
                    <CallPanel
                      key={selected.id}
                      agentId={selected.id}
                      agentName={selected.name}
                      emoji={selected.emoji ?? "◆"}
                      onCallState={onCallState}
                      autoStart={callAgentId === selected.id}
                    />
                  }
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
