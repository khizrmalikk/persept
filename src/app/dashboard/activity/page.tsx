import { supabaseAdmin } from "@/lib/supabase/server";
import {
  type Agent,
  ago,
  type Task,
  type WfEvent,
  when,
} from "@/lib/workforce/types";

export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; kind?: string }>;
}) {
  const { agent, kind } = await searchParams;
  const db = supabaseAdmin();
  let q = db
    .from("events")
    .select("*")
    .order("ts", { ascending: false })
    .limit(150);
  if (agent) q = q.eq("agent_id", agent);
  if (kind) q = q.eq("kind", kind);
  const [{ data: events }, { data: tasks }, { data: agents }] =
    await Promise.all([
      q,
      db
        .from("tasks")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20),
      db.from("agents").select("id, name, emoji"),
    ]);

  const agentList =
    (agents as Pick<Agent, "id" | "name" | "emoji">[] | null) ?? [];
  const kindHref = kind ? `&kind=${kind}` : "";

  return (
    <>
      <header className="wf-page-head">
        <div className="wf-page-head-l">
          <p className="kicker">activity</p>
          <h1>
            what happened
            <span className="cursor" />
          </h1>
          <p className="lede">
            the live event stream and scheduled runs across the workforce.
          </p>
        </div>
      </header>

      <div className="chips" style={{ marginBottom: 20 }}>
        <a
          className={`chip-link ${agent ? "" : "active"}`}
          href={`/dashboard/activity${kind ? `?kind=${kind}` : ""}`}
        >
          all
        </a>
        {agentList.map((a) => (
          <a
            key={a.id}
            className={`chip-link ${agent === a.id ? "active" : ""}`}
            href={`/dashboard/activity?agent=${a.id}${kindHref}`}
          >
            {a.emoji ? `${a.emoji} ` : ""}
            {a.name ?? a.id}
          </a>
        ))}
      </div>

      <div className="two">
        <section className="activity-feed">
          <div className="panel hud-bracket">
            <div className="hud-head">
              <span className="hud-head-l">event feed</span>
              <span className="hud-head-r">{events?.length ?? 0} events</span>
            </div>
            {!events?.length ? (
              <div className="empty">nothing yet</div>
            ) : (
              <ul className="feed">
                {(events as WfEvent[]).map((e) => (
                  <li key={e.id}>
                    <span className="t" title={when(e.ts)}>
                      {ago(e.ts)}
                    </span>
                    <span className="who">{e.agent_id ?? "system"}</span>
                    <span>
                      <span
                        className={`kind ${
                          e.kind === "error"
                            ? "error"
                            : e.kind === "subagent"
                              ? "worker"
                              : ""
                        }`}
                      >
                        {e.kind === "subagent" ? "worker" : e.kind}
                      </span>
                      {e.summary}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="activity-runs">
          <div className="panel hud-bracket table-scroll">
            <div className="hud-head">
              <span className="hud-head-l">scheduled runs</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>when</th>
                  <th>agent</th>
                  <th>job</th>
                  <th>status</th>
                </tr>
              </thead>
              <tbody>
                {((tasks as Task[] | null) ?? []).map((t) => (
                  <tr key={t.id}>
                    <td className="muted">
                      {when(t.started_at ?? t.finished_at)}
                    </td>
                    <td>{t.agent_id}</td>
                    <td>
                      {t.name ?? t.source}
                      <br />
                      <span className="muted">
                        {(t.model ?? "").replace("anthropic/", "")}
                      </span>
                      {t.error && (
                        <>
                          <br />
                          <span className="err">{t.error.slice(0, 120)}</span>
                        </>
                      )}
                    </td>
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
                {!tasks?.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      no runs recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </>
  );
}
