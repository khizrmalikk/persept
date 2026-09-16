import { supabaseAdmin } from "@/lib/supabase/server";
import { type Approval, ago } from "@/lib/workforce/types";
import { ApprovalCard } from "../_components/ApprovalCard";

export default async function Approvals() {
  const db = supabaseAdmin();
  const [{ data: pending }, { data: done }] = await Promise.all([
    db.from("approvals").select("*").eq("status", "pending").order("ts", { ascending: true }),
    db.from("approvals").select("*").neq("status", "pending").order("decided_at", { ascending: false }).limit(15),
  ]);
  return (
    <>
      <p className="kicker">approvals</p>
      <h1>waiting for you<span className="cursor" /></h1>
      <p className="lede">agents draft and prepare. you press send, merge, publish and pay.</p>
      {!pending?.length ? <div className="empty">nothing waiting. the agents are working inside their limits.</div>
        : (pending as Approval[]).map((ap) => <ApprovalCard key={ap.id} ap={ap} />)}
      {!!done?.length && (
        <>
          <p className="kicker" style={{ marginTop: 34 }}>decided</p>
          <div className="panel">
            <table className="table">
              <thead><tr><th>when</th><th>agent</th><th>action</th><th>decision</th></tr></thead>
              <tbody>
                {(done as Approval[]).map((ap) => (
                  <tr key={ap.id}><td className="muted">{ago(ap.decided_at ?? ap.ts)}</td><td>{ap.agent_id}</td><td>{ap.action}</td><td className={ap.status === "approved" ? "ok" : "err"}>{ap.status}{ap.decision_note ? <span className="muted"> · {ap.decision_note}</span> : null}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
