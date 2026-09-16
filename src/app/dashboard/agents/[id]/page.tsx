import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendMessageFromForm } from "@/lib/workforce/actions";
import { type Agent, type Approval, type Task, type WfEvent, ago, STATUS_LABEL, when } from "@/lib/workforce/types";
import { ApprovalCard } from "../../_components/ApprovalCard";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseAdmin();
  const [{ data: agent }, { data: msgs }, { data: pending }, { data: tasks }] = await Promise.all([
    db.from("agents").select("*").eq("id", id).maybeSingle(),
    db.from("events").select("*").eq("agent_id", id).eq("kind", "message").order("ts", { ascending: false }).limit(40),
    db.from("approvals").select("*").eq("agent_id", id).eq("status", "pending").order("ts"),
    db.from("tasks").select("*").eq("agent_id", id).order("started_at", { ascending: false }).limit(10),
  ]);
  if (!agent) notFound();
  const a = agent as Agent;
  const messages = (((msgs as WfEvent[] | null) ?? []).slice()).reverse();
  return (
    <div className="two">
      <div>
        <p className="kicker">agent</p>
        <h1>{a.emoji} {a.name ?? a.id}<span className="cursor" /></h1>
        <div className="statusline">
          <span className={`pill ${a.status ?? "idle"}`}><span className={`dot ${a.status ?? "idle"}`} />{STATUS_LABEL[a.status ?? "idle"]}</span>
          <span className="muted">active {ago(a.last_active_at)} · {(a.model ?? "").replace("anthropic/", "")}</span>
        </div>
        {a.current_task && <p className="task">{a.current_task}</p>}
        <div className="chat">
          {!messages.length && <div className="empty">no messages recorded yet</div>}
          {messages.map((m) => {
            const p = (m.payload ?? {}) as { role?: string; text?: string };
            const mine = p.role === "user" || (m.summary ?? "").startsWith("owner");
            return <div key={m.id} className={`msg ${mine ? "user" : ""}`}>{p.text ?? m.summary}<span className="t">{when(m.ts)}</span></div>;
          })}
        </div>
        <form action={sendMessageFromForm} className="row">
          <input type="hidden" name="agent" value={a.id} />
          <textarea name="text" placeholder={`message ${a.name ?? a.id}…`} style={{ flex: 1 }} />
          <button className="act" type="submit">send</button>
        </form>
        <p className="muted" style={{ fontSize: 12 }}>sent through the bridge into the agent&apos;s main session; the reply appears above within a few seconds.</p>
      </div>
      <div>
        {!!pending?.length && (<><p className="kicker">waiting for you</p>{(pending as Approval[]).map((ap) => <ApprovalCard key={ap.id} ap={ap} />)}</>)}
        <p className="kicker" style={{ marginTop: pending?.length ? 22 : 10 }}>recent runs</p>
        <div className="panel">
          <table className="table">
            <tbody>
              {((tasks as Task[] | null) ?? []).map((t) => (
                <tr key={t.id}><td className="muted">{when(t.started_at ?? t.finished_at)}</td><td>{t.name ?? t.source}</td><td className={t.status === "error" ? "err" : t.status === "ok" ? "ok" : "muted"}>{t.status}</td></tr>
              ))}
              {!tasks?.length && <tr><td className="muted">none yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
