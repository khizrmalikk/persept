import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  acceptLead,
  approveFromForm,
  rejectFromForm,
  sendMessageFromForm,
} from "@/lib/workforce/actions";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import { getSuggestedLeads } from "@/lib/workforce/leads";
import {
  getHandoffs,
  getMessages,
  groupThreads,
  parseOutbound,
} from "@/lib/workforce/outreach";
import { agentColor, ROSTER, rosterById } from "@/lib/workforce/roster";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import {
  type Agent,
  type Approval,
  ago,
  STATUS_LABEL,
  type Subagent,
  stripCallNote,
  type Task,
  type WfEvent,
  when,
} from "@/lib/workforce/types";
import "../../agent.css";
import "../../hunter.css";
import "../../mobile-chat.css";
import { CallPanel } from "../../_components/CallPanel";
import { type ChatMessage, ChatPane } from "../../_components/ChatPane";
import { HunterHeader, type HunterStats } from "../../_components/HunterHeader";
import { ManualSend } from "../../_components/ManualSend";
import { type ChatChip, MobileChat } from "../../_components/MobileChat";
import { AgentPanels } from "../../_components/panels/AgentPanels";
import { dueState } from "../../_components/panels/dates";
import type { ProspectRow } from "../../_components/panels/PipelineTable";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();
  const [
    { data: agent },
    { data: msgs },
    { data: pending },
    { data: tasks },
    { data: roster },
    workerRows,
    { data: allPending },
    { data: warningRows },
  ] = await Promise.all([
    db.from("agents").select("*").eq("id", id).maybeSingle(),
    db
      .from("events")
      .select("*")
      .eq("agent_id", id)
      .eq("kind", "message")
      .order("ts", { ascending: false })
      .limit(40),
    db
      .from("approvals")
      .select("*")
      .eq("agent_id", id)
      .eq("status", "pending")
      .order("ts"),
    db
      .from("tasks")
      .select("*")
      .eq("agent_id", id)
      .order("started_at", { ascending: false })
      .limit(10),
    db.from("agents").select("*").order("id"),
    getActiveSubagents(),
    db.from("approvals").select("agent_id").eq("status", "pending"),
    db
      .from("events")
      .select("*")
      .eq("agent_id", id)
      .eq("kind", "warning")
      .order("ts", { ascending: false })
      .limit(10),
  ]);
  const warnings = (warningRows as WfEvent[] | null) ?? [];

  // ── mobile chat chip roster: every agent + its status (shared by all branches) ──
  const liveById = new Map(
    ((roster as Agent[] | null) ?? []).map((x) => [x.id, x]),
  );
  const pendingByAgent = new Map<string, number>();
  for (const p of (allPending as { agent_id: string | null }[] | null) ?? [])
    if (p.agent_id)
      pendingByAgent.set(p.agent_id, (pendingByAgent.get(p.agent_id) ?? 0) + 1);
  const runningByAgent = new Map<string, number>();
  for (const w of workerRows)
    if (w.status === "running" && w.agent_id)
      runningByAgent.set(w.agent_id, (runningByAgent.get(w.agent_id) ?? 0) + 1);
  const statusOf = (aid: string): string => {
    const live = liveById.get(aid);
    if (!live) return "soon";
    if (live.status === "working" || (runningByAgent.get(aid) ?? 0) > 0)
      return "working";
    return (pendingByAgent.get(aid) ?? 0) > 0 ? "waiting" : "idle";
  };
  const chipRoster: ChatChip[] = ROSTER.map((rr) => ({
    id: rr.id,
    name: rr.name,
    emoji: rr.emoji,
    hue: rr.hue,
    statusLabel: statusOf(rr.id),
  }));

  // Fixer (and any roster agent not yet in `agents`) is "not deployed" — render
  // the full shell with a not-deployed work card rather than a 404.
  if (!agent) {
    const nd = rosterById(id);
    if (!nd) notFound();
    return (
      <>
        <MobileChat
          roster={chipRoster}
          current={{
            id: nd.id,
            name: nd.name,
            emoji: nd.emoji,
            hue: nd.hue,
            statusLabel: "soon",
            task: "not deployed",
          }}
          messages={[]}
          canChat={false}
          sendAction={sendMessageFromForm}
        />
        <div className="wf-only-desktop">
          <NotDeployedAgent
            id={nd.id}
            name={nd.name}
            emoji={nd.emoji}
            hue={nd.hue}
            room={nd.room}
          />
        </div>
      </>
    );
  }
  const a = agent as Agent;
  const agents = (roster as Agent[] | null) ?? [];
  const museEnabled = agents.some((ag) => ag.id === "muse");
  const status = a.status ?? "idle";
  const rawMessages = ((msgs as WfEvent[] | null) ?? []).slice().reverse();
  const pendingList = (pending as Approval[] | null) ?? [];
  const agentName = a.name ?? a.id;
  const agentEmoji = a.emoji ?? "◆";
  const model = modelLabel(a.model);

  // Build a serializable transcript for the client ChatPane (server owns the data fetch).
  const chatMessages: ChatMessage[] = rawMessages.map((m) => {
    const p = (m.payload ?? {}) as { role?: string; text?: string };
    const mine = p.role === "user" || (m.summary ?? "").startsWith("owner");
    let text = p.text ?? m.summary ?? "";
    // Call-mode turns arrive tagged; strip the marker and flag them so ChatPane
    // can render a small "call" chip. Order matters: check the longer marker first.
    let call = false;
    if (text.startsWith("[voice call ended]")) {
      text = text.slice("[voice call ended]".length).trimStart();
      call = true;
    } else if (text.startsWith("[voice call]")) {
      text = text.slice("[voice call]".length).trimStart();
      call = true;
    }
    // drop the bridge's "(call: …)" instruction line(s) — plumbing, not content.
    text = stripCallNote(text);
    return { id: m.id, mine, text, ts: when(m.ts), call };
  });

  const taskList = (tasks as Task[] | null) ?? [];
  const recentRuns = taskList.slice(0, 6);

  const r = rosterById(a.id);
  const hue = r?.hue ?? 70;

  // ── The mobile chat (< 768px) — rendered for every agent branch below. ──────
  const mchat = (
    <MobileChat
      roster={chipRoster}
      current={{
        id: a.id,
        name: agentName,
        emoji: agentEmoji,
        hue,
        statusLabel: statusOf(a.id),
        task: a.current_task ?? "",
      }}
      messages={chatMessages}
      canChat
      sendAction={sendMessageFromForm}
    />
  );

  // ── The chat: the workspace centerpiece. Fills its column's full height/width. ──
  const chat = (
    <ChatPane
      agentId={a.id}
      agentName={agentName}
      agentEmoji={agentEmoji}
      statusLabel={STATUS_LABEL[status] ?? status}
      statusKey={status}
      messages={chatMessages}
      sendAction={sendMessageFromForm}
      composerHint={
        a.id === "scribe"
          ? "proposal for <company>: <your call notes>"
          : a.id === "muse"
            ? "post about <topic> · three angles on <topic> · rewrite: <notes>"
            : undefined
      }
      callSlot={
        <CallPanel
          agentId={a.id}
          agentName={agentName}
          emoji={a.emoji ?? "◆"}
        />
      }
    />
  );

  // ── Hunter: a dedicated chat page (office-style — chat centre, outreach data on
  //    the flanks). Campaigns live on their own route now (./hunter/campaigns). ──
  if (a.id === "hunter") {
    return (
      <>
        {mchat}
        <div className="wf-only-desktop">
          {await buildHunterChat(a, agentName, chat, warnings)}
        </div>
      </>
    );
  }

  // ── the new agent shell: identity header + work / chat / right-rail ─────────
  const agcVars = {
    "--agc": agentColor(hue),
    "--agc-tint": agentColor(hue, 0.16),
    "--agc-ring": agentColor(hue, 0.3),
  } as CSSProperties;
  const room = r?.room ?? "";
  const tagline = TAGLINES[a.id] ?? "";

  const myWorkers = (workerRows as Subagent[]).filter(
    (w) => w.agent_id === a.id,
  );
  const running = myWorkers.filter((w) => w.status === "running");
  const finished = myWorkers.filter((w) => w.status !== "running").slice(0, 3);
  const workingNow = status === "working" || running.length > 0;
  const chipKey = workingNow
    ? "working"
    : pendingList.length
      ? "waiting"
      : "idle";

  return (
    <>
      {mchat}
      <div className="wf-only-desktop">
        <div className="wf-ag" style={agcVars}>
          <header className="wf-ag-head">
            <div className="wf-ag-glow" />
            <span className={`wf-ag-avatar${workingNow ? " is-working" : ""}`}>
              {agentEmoji}
            </span>
            <div className="wf-ag-id">
              <div className="wf-ag-id-top">
                <h1 className="wf-ag-name">{agentName}</h1>
                <span className={`wf-ag-chip is-${chipKey}`}>
                  <span className="dot" />
                  {STATUS_LABEL[chipKey] ?? chipKey}
                </span>
                {room && <span className="wf-ag-room">{room}</span>}
              </div>
              {tagline && <div className="wf-ag-tagline">{tagline}</div>}
            </div>
            <dl className="wf-ag-meta">
              {model && (
                <div>
                  <dt>model</dt>
                  <dd className="mono">{model}</dd>
                </div>
              )}
              <div>
                <dt>last active</dt>
                <dd>{ago(a.last_active_at)}</dd>
              </div>
              <div>
                <dt>workers</dt>
                <dd>{running.length}</dd>
              </div>
              <div>
                <dt>waiting</dt>
                <dd>{pendingList.length}</dd>
              </div>
            </dl>
          </header>

          <div className="wf-ag-cols">
            <section className="wf-ag-work" aria-label="work">
              <AgentPanels
                agent={a}
                agents={agents}
                museEnabled={museEnabled}
              />
            </section>

            <section className="wf-ag-chat" aria-label="chat">
              {chat}
            </section>

            <aside className="wf-ag-rail" aria-label="approvals and workers">
              <AgentWarnings warnings={warnings} />
              <div className="wf-ag-card">
                <div className="wf-ag-card-title">waiting for you</div>
                {pendingList.length ? (
                  pendingList.map((ap) => {
                    const ob = parseOutbound(ap.draft);
                    const label = ob
                      ? ob.channel.toLowerCase().includes("linkedin")
                        ? "publish"
                        : "send"
                      : "approve";
                    const preview = (ob ? ob.body : (ap.draft ?? "")).trim();
                    return (
                      <div className="wf-ag-wait" key={ap.id}>
                        <div className="wf-ag-wait-action">
                          {ap.action ?? "approval request"}
                        </div>
                        {preview && (
                          <div className="wf-ag-wait-preview">{preview}</div>
                        )}
                        <div className="wf-ag-wait-btns">
                          <form action={approveFromForm}>
                            <input type="hidden" name="id" value={ap.id} />
                            <input type="hidden" name="agent" value={a.id} />
                            <button className="wf-ag-btn" type="submit">
                              {label}
                            </button>
                          </form>
                          <Link
                            href="/dashboard/approvals"
                            className="wf-ag-btn ghost"
                          >
                            edit
                          </Link>
                          <form action={rejectFromForm}>
                            <input type="hidden" name="id" value={ap.id} />
                            <input type="hidden" name="agent" value={a.id} />
                            <button className="wf-ag-btn bare" type="submit">
                              reject
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="wf-ag-empty">nothing waiting on you.</p>
                )}
              </div>

              <div className="wf-ag-card">
                <div className="wf-ag-card-head">
                  <span className="wf-ag-card-title">workers</span>
                  <span className="wf-ag-card-sub">
                    {running.length} running
                  </span>
                </div>
                {running.length === 0 && finished.length === 0 ? (
                  <p className="wf-ag-empty">
                    no workers running. {agentName.toLowerCase()} spins them up
                    for longer tasks; they show here while they run.
                  </p>
                ) : (
                  <>
                    {running.map((w) => (
                      <div className="wf-ag-worker" key={w.session_key}>
                        <div className="wf-ag-worker-top">
                          <span
                            className="wf-ag-worker-dot"
                            style={{ background: agentColor(hue, 0.22) }}
                          />
                          <span className="wf-ag-worker-task">
                            {w.label ?? "background task"}
                          </span>
                          <span className="wf-ag-worker-age">
                            {ago(w.started_at ?? w.updated_at)}
                          </span>
                        </div>
                        <div className="wf-ag-worker-bar">
                          <i />
                        </div>
                      </div>
                    ))}
                    {finished.map((w) => (
                      <div className="wf-ag-finished" key={w.session_key}>
                        <span className="tick">✓</span>
                        <span className="wf-ag-worker-task">
                          {w.label ?? "task"}
                        </span>
                        <span className="wf-ag-worker-age">
                          {ago(w.updated_at ?? w.started_at)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="wf-ag-card">
                <div className="wf-ag-card-title">recent runs</div>
                {recentRuns.length ? (
                  recentRuns.map((t) => {
                    const st =
                      t.status === "error"
                        ? "err"
                        : t.status === "ok"
                          ? "ok"
                          : "run";
                    return (
                      <div className="wf-ag-run" key={t.id}>
                        <span className="wf-ag-run-t">
                          {ago(t.started_at ?? t.finished_at)}
                        </span>
                        <span className="wf-ag-run-job">
                          {t.name ?? t.source ?? "run"}
                        </span>
                        <span className={`wf-ag-run-st ${st}`}>{t.status}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="wf-ag-empty">no runs yet.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

// `events.kind = 'warning'` rows — a small amber dot and the summary, nothing
// else. Rendered on the agent's page (and mirrored in the activity feed).
function AgentWarnings({ warnings }: { warnings: WfEvent[] }) {
  if (!warnings.length) return null;
  return (
    <div className="wf-ag-card">
      <div className="wf-ag-card-title">warnings</div>
      {warnings.map((w) => (
        <div
          key={w.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "6px 0",
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <span
            style={{
              flex: "0 0 auto",
              width: 7,
              height: 7,
              marginTop: 5,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
          <span>{w.summary ?? "warning"}</span>
        </div>
      ))}
    </div>
  );
}

// per-agent tagline for the identity header (from the design)
const TAGLINES: Record<string, string> = {
  chief:
    "the one who briefs you. morning brief, backlog, health, weekly review.",
  scout:
    "the one who finds leads and reads the market. weekly prospecting, daily digest.",
  hunter:
    "the one who does outreach. finds who to talk to, drafts every message.",
  scribe:
    "the one who writes proposals. call notes in, a page the prospect can open out.",
  muse: "the one who does marketing. a weekly plan and drafts in your voice.",
  fixer: "the one who fixes and builds internal things.",
};

// A roster agent with no `agents` row (e.g. Fixer) — the full shell with a
// not-deployed work card instead of a 404.
function NotDeployedAgent({
  id,
  name,
  emoji,
  hue,
  room,
}: {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  room: string;
}) {
  const agcVars = {
    "--agc": agentColor(hue),
    "--agc-tint": agentColor(hue, 0.16),
    "--agc-ring": agentColor(hue, 0.3),
  } as CSSProperties;
  return (
    <div className="wf-ag" style={agcVars}>
      <header className="wf-ag-head">
        <div className="wf-ag-glow" />
        <span className="wf-ag-avatar">{emoji}</span>
        <div className="wf-ag-id">
          <div className="wf-ag-id-top">
            <h1 className="wf-ag-name">{name}</h1>
            <span className="wf-ag-chip is-idle">
              <span className="dot" />
              not deployed
            </span>
            {room && <span className="wf-ag-room">{room}</span>}
          </div>
          {TAGLINES[id] && <div className="wf-ag-tagline">{TAGLINES[id]}</div>}
        </div>
      </header>
      <div className="wf-ag-cols">
        <section className="wf-ag-work" aria-label="work">
          <div className="wf-ag-fixer">
            <h3>not deployed yet</h3>
            <p>
              {name.toLowerCase()} fixes and builds internal things: broken
              integrations, failed runs, small tools the other agents need. once
              deployed, its work panels show open fixes, recent patches and
              anything it needs you to merge.
            </p>
            <div className="gates">
              <span>→ you approve every merge</span>
              <span>→ it never touches access or billing</span>
            </div>
            <Link href="/dashboard/agents/chief" className="wf-ag-btn">
              ask chief to schedule it
            </Link>
          </div>
        </section>
        <section className="wf-ag-chat" aria-label="chat">
          <div
            className="wf-ag-card"
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <p className="wf-ag-empty">
              {name.toLowerCase()} isn’t deployed yet — chat opens once it’s
              live.
            </p>
          </div>
        </section>
        <aside className="wf-ag-rail" aria-label="workers">
          <div className="wf-ag-card">
            <div className="wf-ag-card-title">waiting for you</div>
            <p className="wf-ag-empty">nothing waiting on you.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Assemble Hunter's chat page: the chat in the centre, with the outreach data
// that matters to Hunter on the flanks — pipeline + hand-offs on the left,
// approvals + conversations + composer on the right. Campaigns are their own page
// now. Reads are defensive (a missing table renders empty, never crashes).
async function buildHunterChat(
  _a: Agent,
  _agentName: string,
  chat: React.ReactNode,
  warnings: WfEvent[] = [],
) {
  const [messages, handoffsOpen, prospectsFile, apRes, leads, workerRows] =
    await Promise.all([
      getMessages("hunter"),
      getHandoffs("hunter", ["open"]),
      getAgentFile("hunter", "PROSPECTS.md"),
      supabaseAdmin()
        .from("approvals")
        .select("*")
        .eq("agent_id", "hunter")
        .in("status", ["pending", "held"])
        .order("ts"),
      getSuggestedLeads(),
      getActiveSubagents(),
    ]);

  const rows = parseMarkdownTable(prospectsFile?.content).rows as ProspectRow[];
  const approvals = (apRes.data as Approval[] | null) ?? [];
  const threads = groupThreads(messages);
  // approved-manual whatsapp / instagram messages the owner still sends himself
  const manualSends = messages.filter(
    (m) =>
      m.direction === "out" &&
      m.status === "approved_manual" &&
      ["whatsapp", "instagram"].includes((m.channel ?? "").toLowerCase()),
  );
  const replied = threads.filter((t) =>
    t.messages.some((m) => m.direction === "in"),
  ).length;
  const workers = (workerRows as Subagent[]).filter(
    (w) => w.status === "running" && w.agent_id === "hunter",
  );
  const stats: HunterStats = {
    prospects: rows.length,
    replied,
    handoffs: handoffsOpen.length,
    waiting: approvals.length,
    workers: workers.length,
  };

  // funnel across the 10 pipeline stages
  const STAGES = [
    "new",
    "drafted",
    "approached",
    "followed up 1",
    "followed up 2",
    "replied",
    "call booked",
    "handed off",
    "parked",
    "no",
  ];
  const norm = (x: string) =>
    (x ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  const counts: Record<string, number> = Object.fromEntries(
    STAGES.map((s) => [s, 0]),
  );
  for (const r of rows) {
    const st = norm(r.status ?? "");
    if (st in counts) counts[st] += 1;
  }
  const fmax = Math.max(1, ...Object.values(counts));
  const dueToday = rows.filter((r) => dueState(r.next_due) === "today").length;
  const overdue = rows.filter((r) => dueState(r.next_due) === "overdue").length;

  const dueRank = (d: string | undefined) => {
    const s = dueState(d);
    return s === "overdue" ? 0 : s === "today" ? 1 : s === "future" ? 2 : 3;
  };
  const topProspects = [...rows]
    .sort(
      (x, y) =>
        dueRank(x.next_due) - dueRank(y.next_due) ||
        (x.next_due ?? "").localeCompare(y.next_due ?? ""),
    )
    .slice(0, 3);

  const hn = agentColor(150);
  const dueColor = (d: string | undefined) => {
    const s = dueState(d);
    return s === "overdue"
      ? "var(--err)"
      : s === "today"
        ? "var(--accent)"
        : "var(--ink-faint)";
  };
  const threadStatus = (t: (typeof threads)[number]) =>
    handoffsOpen.some(
      (h) => (h.company ?? "").toLowerCase() === t.company.toLowerCase(),
    )
      ? "handed off"
      : t.messages.some((m) => m.direction === "in")
        ? "replied"
        : "awaiting reply";
  const stColor = (st: string): CSSProperties =>
    st === "replied"
      ? { background: "oklch(0.8 0.14 70 / 0.16)", color: "var(--accent)" }
      : st === "handed off"
        ? { background: "oklch(0.8 0.16 150 / 0.14)", color: "var(--ok)" }
        : { background: "rgba(255,255,255,0.07)", color: "var(--ink-soft)" };

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={approvals.length} />
      <div className="wf-hn-chat">
        {/* left flank: pipeline funnel + top prospects */}
        <section className="wf-hn-flank left">
          <div className="wf-hn-panel">
            <div className="wf-hn-panel-head">
              <span className="wf-hn-panel-title">pipeline</span>
              <Link
                href="/dashboard/agents/hunter/prospects"
                className="wf-hn-link"
              >
                {rows.length} prospects →
              </Link>
            </div>
            {STAGES.map((st) => (
              <div
                key={st}
                className={`wf-hn-funnel-row${counts[st] ? "" : " dim"}`}
              >
                <span className="wf-hn-funnel-label">{st}</span>
                <span className="wf-hn-funnel-bar">
                  <span
                    style={{
                      width: `${(counts[st] / fmax) * 100}%`,
                      background: hn,
                    }}
                  />
                </span>
                <span className="wf-hn-funnel-n">{counts[st]}</span>
              </div>
            ))}
            <div className="wf-hn-nextdue">
              next due:{" "}
              <span className="wf-hn-due-today">{dueToday} today</span> ·{" "}
              <span className="wf-hn-due-over">{overdue} overdue</span>
            </div>
          </div>
          {topProspects.length > 0 && (
            <div className="wf-hn-panel">
              <div className="wf-hn-panel-title">top prospects</div>
              {topProspects.map((r) => (
                <div key={r.company} className="wf-hn-prow">
                  <div className="wf-hn-prow-top">
                    <span className="wf-hn-prow-co">{r.company}</span>
                    <span
                      className="wf-hn-prow-due"
                      style={{ color: dueColor(r.next_due) }}
                    >
                      {r.next_due
                        ? dueState(r.next_due) === "today"
                          ? "today"
                          : r.next_due
                        : ""}
                    </span>
                  </div>
                  {(r.angle ?? r.notes) && (
                    <div className="wf-hn-prow-angle">{r.angle ?? r.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* center: the chat */}
        <section className="wf-hn-center">{chat}</section>

        {/* right flank: approvals · workers · conversations · new leads */}
        <section className="wf-hn-flank">
          {warnings.length > 0 && (
            <div className="wf-hn-panel">
              <div className="wf-hn-panel-title">warnings</div>
              {warnings.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "6px 0",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 auto",
                      width: 7,
                      height: 7,
                      marginTop: 5,
                      borderRadius: "50%",
                      background: "var(--accent)",
                    }}
                  />
                  <span>{w.summary ?? "warning"}</span>
                </div>
              ))}
            </div>
          )}
          <div className="wf-hn-panel">
            <div className="wf-hn-panel-head">
              <span className="wf-hn-panel-title">
                approvals{" "}
                <span className="wf-hn-chipct">{approvals.length}</span>
              </span>
              <Link
                href="/dashboard/agents/hunter/approvals"
                className="wf-hn-link"
              >
                open →
              </Link>
            </div>
            {approvals.length === 0 ? (
              <div className="wf-hn-empty">nothing waiting for you.</div>
            ) : (
              approvals.slice(0, 3).map((ap) => {
                const ob = parseOutbound(ap.draft);
                const held = ap.status === "held";
                return (
                  <div key={ap.id} className="wf-hn-mini">
                    <div className="wf-hn-mini-tags">
                      <span className="wf-chip-mono">
                        {ob?.channel ?? "note"}
                      </span>
                      {held && (
                        <span className="wf-hn-note">held · daily cap</span>
                      )}
                    </div>
                    <div className="wf-hn-mini-to">
                      {ob?.to ?? ap.action ?? "outbound"}
                    </div>
                    <div className="wf-hn-mini-btns">
                      <form
                        action={approveFromForm}
                        style={{ display: "inline" }}
                      >
                        <input type="hidden" name="id" value={ap.id} />
                        <input type="hidden" name="agent" value="hunter" />
                        <button type="submit" className="wf-hn-btn amber sm">
                          {held ? "release" : "send"}
                        </button>
                      </form>
                      <Link
                        href="/dashboard/agents/hunter/approvals"
                        className="wf-hn-btn ghost sm"
                      >
                        review
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="wf-hn-panel">
            <div className="wf-hn-panel-head">
              <span className="wf-hn-panel-title">workers</span>
              <span className="wf-hn-note">{workers.length} running</span>
            </div>
            {workers.length === 0 ? (
              <div className="wf-hn-empty">no workers running.</div>
            ) : (
              workers.map((w) => (
                <div key={w.session_key} className="wf-hn-worker">
                  <div className="wf-hn-worker-top">
                    <span className="wf-hn-worker-dot" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {w.label ?? "background task"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {manualSends.length > 0 && (
            <div className="wf-hn-panel">
              <div className="wf-hn-panel-head">
                <span className="wf-hn-panel-title">
                  to send from your phone
                </span>
                <span className="wf-hn-note">{manualSends.length}</span>
              </div>
              {manualSends.slice(0, 5).map((m) => (
                <div key={m.id} className="wf-hn-mini">
                  <div className="wf-hn-mini-tags">
                    <span className="wf-chip-mono">{m.channel}</span>
                  </div>
                  <div className="wf-hn-mini-to">
                    {m.company || m.contact || "outbound"}
                  </div>
                  <div className="wf-hn-thread-last">
                    {(m.body ?? "").split("\n")[0]}
                  </div>
                  <ManualSend
                    messageId={m.id}
                    agentId="hunter"
                    company={m.company ?? ""}
                    channel={m.channel ?? ""}
                    contact={m.contact ?? ""}
                    body={m.body ?? ""}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="wf-hn-panel">
            <div className="wf-hn-panel-head">
              <span className="wf-hn-panel-title">conversations</span>
              <Link
                href="/dashboard/agents/hunter/conversations"
                className="wf-hn-link"
              >
                all →
              </Link>
            </div>
            {threads.length === 0 ? (
              <div className="wf-hn-empty">no threads yet.</div>
            ) : (
              threads.slice(0, 3).map((t) => {
                const st = threadStatus(t);
                return (
                  <Link
                    key={t.key}
                    href="/dashboard/agents/hunter/conversations"
                    className="wf-hn-thread"
                  >
                    <span className="wf-hn-thread-top">
                      <span className="wf-hn-thread-co">{t.company}</span>
                      <span className="wf-hn-stpill" style={stColor(st)}>
                        {st}
                      </span>
                    </span>
                    <span className="wf-hn-thread-last">
                      {
                        (t.messages[t.messages.length - 1].body ?? "").split(
                          "\n",
                        )[0]
                      }
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {leads.length > 0 && (
            <div className="wf-hn-panel">
              <div className="wf-hn-panel-head">
                <span className="wf-hn-panel-title">new leads</span>
                <Link
                  href="/dashboard/agents/scout#wf-leads-anchor"
                  className="wf-hn-link"
                >
                  from 🔭 scout
                </Link>
              </div>
              {leads.slice(0, 3).map((l) => (
                <div key={l.id} className="wf-hn-lead">
                  <span className="wf-hn-lead-co">
                    {l.company}{" "}
                    {l.size && (
                      <span className="wf-hn-lead-size">{l.size}</span>
                    )}
                  </span>
                  <form
                    action={acceptLead.bind(null, l.id)}
                    style={{ display: "inline" }}
                  >
                    <button type="submit" className="wf-hn-btn ghost sm">
                      add
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// The `model` column can hold a plain id ("anthropic/claude-sonnet-5") or a JSON
// blob ('{"primary":"claude-sonnet-5"}'). Show a clean single model name either way.
function modelLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  const clean = (s: string) => s.replace(/^anthropic\//, "").trim();
  const t = raw.trim();
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t) as Record<string, unknown>;
      const v = obj.primary ?? Object.values(obj)[0];
      return v ? clean(String(v)) : "";
    } catch {
      return "";
    }
  }
  return clean(t);
}
