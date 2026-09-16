import { decideFromForm } from "@/lib/workforce/actions";
import { type Approval, ago } from "@/lib/workforce/types";

export function ApprovalCard({ ap }: { ap: Approval }) {
  const risk = (ap.risk ?? "").split(/[\s—-]/)[0].toLowerCase();
  return (
    <div className="approval">
      <div className="top">
        <div className="action">{ap.action ?? "approval request"}</div>
        <div className={`risk ${risk}`}>{ap.risk ?? ""}</div>
      </div>
      <div className="why">{ap.agent_id} · {ago(ap.ts)}{ap.why ? ` · ${ap.why}` : ""}</div>
      <pre>{ap.draft ?? "(no draft text)"}</pre>
      <form className="row" action={decideFromForm}>
        <input type="hidden" name="id" value={ap.id} />
        <input type="hidden" name="agent" value={ap.agent_id ?? "chief"} />
        <input type="text" name="note" placeholder="note to the agent (optional)" style={{ flex: 1, minWidth: 220 }} />
        <button className="act" name="decision" value="approve" type="submit">approve</button>
        <button className="act danger" name="decision" value="reject" type="submit">reject</button>
      </form>
    </div>
  );
}
