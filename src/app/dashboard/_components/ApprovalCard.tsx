import { approveFromForm, rejectFromForm } from "@/lib/workforce/actions";
import { type Approval, ago } from "@/lib/workforce/types";

// Form contract: hidden `id`, hidden `agent`, text `note`. The decision is decided
// by WHICH button submits — approve → approveFromForm, reject → rejectFromForm via
// `formAction` — so a decision can never be misread/inverted. `emoji`/`name` are
// optional presentation-only props (joined agent_id → agents); they never post.
export function ApprovalCard({
  ap,
  emoji,
  name,
}: {
  ap: Approval;
  emoji?: string | null;
  name?: string | null;
}) {
  // `ap.risk` is usually "SEVERITY — reason…". Show only the severity word in
  // the pill (short), and the reason as a normal muted line so it can't blow the
  // card apart. Falls back gracefully if there's no "—".
  const riskRaw = (ap.risk ?? "").trim();
  const riskMatch = riskRaw.match(/^([A-Za-z]+)\s*[—–-]\s*([\s\S]*)$/);
  const severity = (
    riskMatch?.[1] ??
    riskRaw.split(/\s/)[0] ??
    ""
  ).toLowerCase();
  const riskReason = riskMatch?.[2]?.trim() ?? "";
  return (
    <div className="approval">
      <div className="top">
        <div className="id-row">
          <span className="a-emoji">{emoji ?? "•"}</span>
          <div className="action">{ap.action ?? "approval request"}</div>
        </div>
        {severity && <div className={`risk ${severity}`}>{severity}</div>}
      </div>
      {riskReason && <div className="risk-reason">{riskReason}</div>}
      <div className="why">
        {name ?? ap.agent_id} · {ago(ap.ts)}
        {ap.why ? ` · ${ap.why}` : ""}
      </div>
      <pre>{ap.draft ?? "(no draft text)"}</pre>
      <form className="row" action={approveFromForm}>
        <input type="hidden" name="id" value={ap.id} />
        <input type="hidden" name="agent" value={ap.agent_id ?? "chief"} />
        <input
          type="text"
          name="note"
          placeholder="note to the agent (optional)"
          style={{ flex: 1, minWidth: 220 }}
        />
        <button className="act" type="submit" formAction={approveFromForm}>
          approve
        </button>
        <button
          className="act danger"
          type="submit"
          formAction={rejectFromForm}
        >
          reject
        </button>
      </form>
    </div>
  );
}
