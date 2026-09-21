import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendMessageFromForm } from "@/lib/workforce/actions";
import {
  type Agent,
  type Approval,
  ago,
  STATUS_LABEL,
  type Task,
  type WfEvent,
  when,
} from "@/lib/workforce/types";
import { ApprovalCard } from "../../_components/ApprovalCard";
import { CallPanel } from "../../_components/CallPanel";
import { type ChatMessage, ChatPane } from "../../_components/ChatPane";
import { AgentPanels } from "../../_components/panels/AgentPanels";

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
    return { id: m.id, mine, text, ts: when(m.ts), call };
  });

  const taskList = (tasks as Task[] | null) ?? [];
  const recentRuns = taskList.slice(0, 5);

  return (
    <div className="wf-agent">
      {/* full-width identity header — spans the whole page */}
      <header className="wf-agent-head hud-bracket">
        <div className="wf-agent-id">
          <p className="kicker">agent</p>
          <h1>
            {a.emoji} {agentName}
            <span className="cursor" />
          </h1>
          <div className="statusline">
            <span className={`pill ${status}`}>
              <span className={`dot ${status}`} />
              {STATUS_LABEL[status] ?? status}
            </span>
            <span className="muted">
              active {ago(a.last_active_at)}
              {modelLabel(a.model) ? ` · ${modelLabel(a.model)}` : ""}
            </span>
          </div>
        </div>
        {a.current_task && (
          <p className="task wf-agent-task">{a.current_task}</p>
        )}
      </header>

      {/* space-filling body: main content area + a right-hand chat rail */}
      <div className="wf-agent-body">
        <div className="wf-agent-main">
          {pendingList.length > 0 && (
            <section className="wf-agent-approvals">
              <p className="kicker">waiting for you</p>
              {pendingList.map((ap) => (
                <ApprovalCard
                  key={ap.id}
                  ap={ap}
                  emoji={a.emoji}
                  name={a.name ?? a.id}
                />
              ))}
            </section>
          )}
          <AgentPanels agent={a} agents={agents} museEnabled={museEnabled} />
        </div>

        <aside className="wf-agent-rail">
          <div className="chat-col">
            <ChatPane
              agentId={a.id}
              agentName={agentName}
              agentEmoji={agentEmoji}
              statusLabel={STATUS_LABEL[status] ?? status}
              statusKey={status}
              messages={chatMessages}
              sendAction={sendMessageFromForm}
              callSlot={
                <CallPanel
                  agentId={a.id}
                  agentName={agentName}
                  emoji={a.emoji ?? "◆"}
                />
              }
            />
          </div>

          {/* recent runs — a compact collapsible widget, not its own column */}
          <details
            className="hud-panel hud-bracket wf-panel wf-collapse wf-runs"
            open
          >
            <summary className="hud-head">
              <span className="hud-head-l">
                <span className="sep">{"// "}</span>recent runs
              </span>
              <span className="hud-head-r wf-collapse-hint">
                {recentRuns.length ? `last ${recentRuns.length}` : "none"}
              </span>
            </summary>
            <div className="hud-body">
              <table className="table">
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
                  {!recentRuns.length && (
                    <tr>
                      <td className="muted">none yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </aside>
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
