import { supabaseAdmin } from "@/lib/supabase/server";
import { type Task, type WfEvent, ago, when } from "@/lib/workforce/types";

export default async function Activity({ searchParams }: { searchParams: Promise<{ agent?: string; kind?: string }> }) {
  const { agent, kind } = await searchParams;
  const db = supabaseAdmin();
  let q = db.from("events").select("*").order("ts", { ascending: false }).limit(150);
  if (agent) q = q.eq("agent_id", agent);
  if (kind) q = q.eq("kind", kind);
  const [{ data: events }, { data: tasks }, { data: agents }] = await Promise.all([
    q,
    db.from("tasks").select("*").order("started_at", { ascending: false }).limit(20),
    db.from("agents").select("id"),
  ]);
  return (
    <div className="two">
      <div>
        <p className="kicker">activity</p>
        <h1>what happened<span className="cursor" /></h1>
        <div className="row" style={{ marginBottom: 14 }}>
          <a className={`act ${agent ? "secondary" : ""}`} style={{ fontSize: 13 }} href="/dashboard/activity">all</a>
          {((agents as { id: string }[] | null) ?? []).map((a) => (
            <a key={a.id} className={`act ${agent === a.id ? "" : "secondary"}`} style={{ fontSize: 13 }} href={`/dashboard/activity?agent=${a.id}`}>{a.id}</a>
          ))}
        </div>
        {!events?.length ? <div className="empty">nothing yet</div> : (
          <ul className="feed">
            {(events as WfEvent[]).map((e) => (
              <li key={e.id}><span className="t" title={when(e.ts)}>{ago(e.ts)}</span><span className="who">{e.agent_id ?? "system"}</span><span><span className="kind">{e.kind}</span>{e.summary}</span></li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="kicker">scheduled runs</p>
        <div className="panel">
          <table className="table">
            <thead><tr><th>when</th><th>agent</th><th>job</th><th>status</th></tr></thead>
            <tbody>
              {((tasks as Task[] | null) ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="muted">{when(t.started_at ?? t.finished_at)}</td>
                  <td>{t.agent_id}</td>
                  <td>{t.name ?? t.source}<br /><span className="muted">{(t.model ?? "").replace("anthropic/", "")}</span>{t.error && <><br /><span className="err">{t.error.slice(0, 120)}</span></>}</td>
                  <td className={t.status === "error" ? "err" : t.status === "ok" ? "ok" : "muted"}>{t.status}</td>
                </tr>
              ))}
              {!tasks?.length && <tr><td colSpan={4} className="muted">no runs recorded yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
