import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendMessageFromForm } from "@/lib/workforce/actions";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import { getSuggestedLeads } from "@/lib/workforce/leads";
import {
  getCampaigns,
  getHandoffs,
  getMessages,
  groupThreads,
  slugify,
} from "@/lib/workforce/outreach";
import {
  type Agent,
  type Approval,
  ago,
  STATUS_LABEL,
  stripCallNote,
  type Task,
  type WfEvent,
  when,
} from "@/lib/workforce/types";
import { AgentChatView } from "../../_components/AgentChatView";
import { ApprovalCard } from "../../_components/ApprovalCard";
import { CallPanel } from "../../_components/CallPanel";
import { type ChatMessage, ChatPane } from "../../_components/ChatPane";
import {
  HunterChatView,
  type HunterStats,
} from "../../_components/HunterChatView";
import { AgentPanels } from "../../_components/panels/AgentPanels";
import { dueState } from "../../_components/panels/dates";
import { Handoffs } from "../../_components/panels/Handoffs";
import { PipelineSummary } from "../../_components/panels/PipelineSummary";
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
  ]);
  if (!agent) notFound();
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
    return await buildHunterChat(a, agentName, chat);
  }

  // ── LEFT: the agent's work (brief, backlog, memory, role-specific panels). ──
  const work = (
    <section className="wf-of-panel">
      <div className="wf-of-panel-head">
        <h2>work</h2>
      </div>
      <div className="wf-of-panel-body">
        <AgentPanels agent={a} agents={agents} museEnabled={museEnabled} />
      </div>
    </section>
  );

  // ── RIGHT: approvals waiting on the owner. ──────────────────────────────────
  const approvalsNode = (
    <section className="wf-of-panel">
      <div className="wf-of-panel-head">
        <h2>
          waiting for you
          {pendingList.length > 0 && (
            <span className="wf-of-panel-count">{pendingList.length}</span>
          )}
        </h2>
      </div>
      <div className="wf-of-panel-body">
        {pendingList.length > 0 ? (
          <div className="wf-out-approvals">
            {pendingList.map((ap) => (
              <ApprovalCard
                key={ap.id}
                ap={ap}
                emoji={a.emoji}
                name={agentName}
              />
            ))}
          </div>
        ) : (
          <p className="wf-of-mini-empty">nothing waiting on you.</p>
        )}
      </div>
    </section>
  );

  // ── RIGHT: recent runs. ─────────────────────────────────────────────────────
  const runs = (
    <section className="wf-of-panel">
      <div className="wf-of-panel-head">
        <h2>
          recent runs
          {recentRuns.length > 0 && (
            <span className="wf-of-panel-count">{recentRuns.length}</span>
          )}
        </h2>
      </div>
      <div className="wf-of-panel-body">
        {recentRuns.length > 0 ? (
          <table className="table wf-runs">
            <tbody>
              {recentRuns.map((t) => (
                <tr key={t.id}>
                  <td className="muted">
                    {when(t.started_at ?? t.finished_at)}
                  </td>
                  <td>{t.name ?? t.source}</td>
                  <td
                    className={
                      t.status === "error"
                        ? "err"
                        : t.status === "ok"
                          ? "ok"
                          : "muted"
                    }
                  >
                    {t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="wf-of-mini-empty">no runs yet.</p>
        )}
      </div>
    </section>
  );

  // Muse shows its drafts (pending approvals as post cards) inside the work
  // panel, so the generic right-rail approvals would duplicate them — drop it.
  const isMuse = a.id === "muse";

  return (
    <AgentChatView
      identity={{
        emoji: agentEmoji,
        name: agentName,
        statusKey: status,
        statusLabel: STATUS_LABEL[status] ?? status,
        model,
        lastActive: ago(a.last_active_at),
        currentTask: a.current_task,
      }}
      chat={chat}
      work={work}
      approvals={isMuse ? null : approvalsNode}
      runs={runs}
    />
  );
}

// Assemble Hunter's chat page: the chat in the centre, with the outreach data
// that matters to Hunter on the flanks — pipeline + hand-offs on the left,
// approvals + conversations + composer on the right. Campaigns are their own page
// now. Reads are defensive (a missing table renders empty, never crashes).
async function buildHunterChat(
  a: Agent,
  agentName: string,
  chat: React.ReactNode,
) {
  const [campaigns, messages, handoffsOpen, prospectsFile, apRes, leads] =
    await Promise.all([
      getCampaigns("hunter"),
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
    ]);

  const table = parseMarkdownTable(prospectsFile?.content);
  const rows = table.rows as ProspectRow[];
  const dueOf: Record<string, ReturnType<typeof dueState>> = {};
  for (const r of rows) dueOf[r.company] = dueState(r.next_due);

  const approvals = (apRes.data as Approval[] | null) ?? [];
  const threads = groupThreads(messages);
  const handedOff = handoffsOpen
    .map((h) => (h.company ?? "").toLowerCase())
    .filter(Boolean);
  const campaignOptions = campaigns.map((c) => ({
    slug: slugify(c.name),
    name: c.name,
  }));

  const repliedThreads = threads.filter((t) =>
    t.messages.some((m) => m.direction === "in"),
  ).length;
  const stats: HunterStats = {
    prospects: rows.length,
    replied: repliedThreads,
    handoffs: handoffsOpen.length,
    waiting: approvals.length,
  };

  // Top 3 prospects for the chat page — most urgent first (overdue → today →
  // soonest). The full, sortable list lives on the prospects page.
  const dueRank = (d: string | undefined) => {
    const s = dueState(d);
    return s === "overdue" ? 0 : s === "today" ? 1 : s === "future" ? 2 : 3;
  };
  const topProspects = [...rows]
    .sort((a, b) => {
      const r = dueRank(a.next_due) - dueRank(b.next_due);
      if (r !== 0) return r;
      return (a.next_due ?? "").localeCompare(b.next_due ?? "");
    })
    .slice(0, 3);

  const pipeline = (
    <div className="wf-hub-pipeline">
      <PipelineSummary
        table={table}
        fileContent={prospectsFile?.content ?? null}
      />
      {rows.length > 0 && (
        <section className="wf-of-panel">
          <div className="wf-of-panel-head">
            <h2>
              prospects <span className="wf-of-panel-count">{rows.length}</span>
            </h2>
            <Link
              href="/dashboard/agents/hunter/prospects"
              className="wf-of-link"
            >
              see all →
            </Link>
          </div>
          <div className="wf-of-panel-body">
            <ul className="wf-prosp-mini">
              {topProspects.map((r) => {
                const due = dueState(r.next_due);
                const dueCls =
                  due === "overdue"
                    ? "err"
                    : due === "today"
                      ? "accent"
                      : "muted";
                return (
                  <li key={r.company} className="wf-prosp-mini-row">
                    <span className="wf-prosp-mini-co" title={r.company}>
                      {r.company}
                    </span>
                    {r.status && (
                      <span className="wf-chip sm">
                        {r.status.replace(/[_-]+/g, " ")}
                      </span>
                    )}
                    {r.next_due && (
                      <span className={`wf-prosp-mini-due ${dueCls}`}>
                        {r.next_due}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );

  const approvalsNode = (
    <section className="wf-of-panel">
      <div className="wf-of-panel-head">
        <h2>
          approvals
          {approvals.length > 0 && (
            <span className="wf-of-panel-count">{approvals.length}</span>
          )}
        </h2>
      </div>
      <div className="wf-of-panel-body">
        {approvals.length > 0 ? (
          <div className="wf-out-approvals">
            {approvals.map((ap) => (
              <ApprovalCard
                key={ap.id}
                ap={ap}
                emoji={a.emoji}
                name={agentName}
              />
            ))}
          </div>
        ) : (
          <p className="wf-of-mini-empty">nothing waiting for you.</p>
        )}
      </div>
    </section>
  );

  // Compact "new leads" strip — Scout's suggested leads that can become Hunter
  // prospects. Only shown when there are any; full triage is on Scout's page.
  const leadsStrip =
    leads.length > 0 ? (
      <section className="wf-of-panel wf-leads-strip">
        <div className="wf-of-panel-head">
          <h2>
            new leads <span className="wf-of-panel-count">{leads.length}</span>
          </h2>
          <Link
            href="/dashboard/agents/scout#wf-leads-anchor"
            className="wf-of-link"
          >
            review →
          </Link>
        </div>
        <div className="wf-of-panel-body">
          <ul className="wf-leads-mini">
            {leads.slice(0, 3).map((l) => (
              <li key={l.id} className="wf-leads-mini-row">
                <span className="wf-leads-mini-co" title={l.company}>
                  {l.company}
                </span>
                {l.angle && (
                  <span className="wf-leads-mini-angle" title={l.angle}>
                    {l.angle}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  return (
    <HunterChatView
      chat={chat}
      stats={stats}
      leads={leadsStrip}
      pipeline={pipeline}
      approvals={approvalsNode}
      handoffs={<Handoffs handoffs={handoffsOpen} />}
      threads={threads}
      handedOff={handedOff}
      campaigns={campaignOptions}
      handoffCount={handoffsOpen.length}
    />
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
