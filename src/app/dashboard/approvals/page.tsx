import { supabaseAdmin } from "@/lib/supabase/server";
import { type Agent, type Approval, ago } from "@/lib/workforce/types";
import { ApprovalCard } from "../_components/ApprovalCard";

export default async function Approvals() {
  const db = supabaseAdmin();
  const [{ data: pending }, { data: done }, { data: agentRows }] =
    await Promise.all([
      db
        .from("approvals")
        .select("*")
        .eq("status", "pending")
        .order("ts", { ascending: true }),
      db
        .from("approvals")
        .select("*")
        .neq("status", "pending")
        .order("decided_at", { ascending: false })
        .limit(15),
      db.from("agents").select("id, name, emoji"),
    ]);

  const meta = new Map<string, { name: string; emoji: string | null }>();
  for (const a of (agentRows as
    | Pick<Agent, "id" | "name" | "emoji">[]
    | null) ?? [])
    meta.set(a.id, { name: a.name ?? a.id, emoji: a.emoji });

  const waiting = (pending as Approval[] | null) ?? [];
  const decided = (done as Approval[] | null) ?? [];

  return (
    <>
      <header className="wf-page-head">
        <div className="wf-page-head-l">
          <p className="kicker">approvals</p>
          <h1>
            waiting for you
            <span className="cursor" />
          </h1>
          <p className="lede">
            agents draft and prepare. you press send, merge, publish and pay.
          </p>
        </div>
        {waiting.length > 0 && (
          <div className="wf-page-head-r">
            <span className="pill waiting">
              <span className="dot waiting" />
              {waiting.length} in queue
            </span>
          </div>
        )}
      </header>

      {!waiting.length ? (
        <div className="empty">
          nothing waiting. the agents are working inside their limits.
        </div>
      ) : (
        <div className="approvals-queue">
          {waiting.map((ap) => {
            const m = ap.agent_id ? meta.get(ap.agent_id) : undefined;
            return (
              <ApprovalCard
                key={ap.id}
                ap={ap}
                emoji={m?.emoji}
                name={m?.name}
              />
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <p className="kicker" style={{ marginTop: 34, marginBottom: 12 }}>
            decided
          </p>
          <div className="panel hud-bracket table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>when</th>
                  <th>agent</th>
                  <th>action</th>
                  <th>decision</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((ap) => {
                  const m = ap.agent_id ? meta.get(ap.agent_id) : undefined;
                  return (
                    <tr key={ap.id}>
                      <td className="muted">{ago(ap.decided_at ?? ap.ts)}</td>
                      <td>
                        <span className="agent-cell">
                          <span className="e">{m?.emoji ?? "•"}</span>
                          <span>{m?.name ?? ap.agent_id}</span>
                        </span>
                      </td>
                      <td>{ap.action}</td>
                      <td className={ap.status === "approved" ? "ok" : "err"}>
                        {ap.status}
                        {ap.decision_note ? (
                          <span className="muted"> · {ap.decision_note}</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
