import {
  approveFromForm,
  rejectFromForm,
  sendApprovedEdit,
} from "@/lib/workforce/actions";
import { parseOutbound } from "@/lib/workforce/outreach";
import { type Approval, ago } from "@/lib/workforce/types";

// Form contract: hidden `id`, hidden `agent`, text `note`. The decision is decided
// by WHICH button submits — approve → approveFromForm, reject → rejectFromForm via
// `formAction` — so a decision can never be misread/inverted. `emoji`/`name` are
// optional presentation-only props (joined agent_id → agents); they never post.
//
// When the draft parses as the outbound message format (an email/DM Hunter wants
// to send), the card renders the parsed to/subject/channel header + body, and the
// buttons read "send" / "edit and send" / "reject" instead of the generic
// approve/reject. Held approvals (bridge hit the daily cap) show a "release".
export function ApprovalCard({
  ap,
  emoji,
  name,
}: {
  ap: Approval;
  emoji?: string | null;
  name?: string | null;
}) {
  const outbound = parseOutbound(ap.draft);
  if (outbound) {
    return (
      <OutboundApproval ap={ap} outbound={outbound} emoji={emoji} name={name} />
    );
  }

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
      <div className="approval-msg">{ap.draft ?? "(no draft text)"}</div>
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

function OutboundApproval({
  ap,
  outbound,
  emoji,
  name,
}: {
  ap: Approval;
  outbound: NonNullable<ReturnType<typeof parseOutbound>>;
  emoji?: string | null;
  name?: string | null;
}) {
  const agent = ap.agent_id ?? "hunter";
  const isEmail = outbound.channel.toLowerCase() === "email";
  const held = ap.status === "held";
  const sendLabel = held
    ? "release"
    : isEmail
      ? "send"
      : "approve (I'll send by hand)";
  return (
    <div className="approval is-outbound">
      <div className="top">
        <div className="id-row">
          <span className="a-emoji">{emoji ?? "•"}</span>
          <div className="action">{ap.action ?? "message to send"}</div>
        </div>
        <span className="wf-chip sm">{outbound.channel}</span>
      </div>
      <dl className="wf-outbound-head">
        <div>
          <dt>to</dt>
          <dd>{outbound.to}</dd>
        </div>
        {outbound.subject && (
          <div>
            <dt>subject</dt>
            <dd>{outbound.subject}</dd>
          </div>
        )}
        {outbound.campaign && (
          <div>
            <dt>campaign</dt>
            <dd className="mono">{outbound.campaign}</dd>
          </div>
        )}
      </dl>
      <div className="why">
        {name ?? agent} · {ago(ap.ts)}
        {ap.why ? ` · ${ap.why}` : ""}
      </div>
      {held && <div className="wf-outbound-held">held: daily cap reached</div>}
      <div className="approval-msg">{outbound.body || "(no message body)"}</div>

      {/* send / release + reject */}
      <form className="row" action={approveFromForm}>
        <input type="hidden" name="id" value={ap.id} />
        <input type="hidden" name="agent" value={agent} />
        <button className="act" type="submit" formAction={approveFromForm}>
          {sendLabel}
        </button>
        <button
          className="act danger"
          type="submit"
          formAction={rejectFromForm}
        >
          reject
        </button>
      </form>

      {/* edit and send — the owner tweaks the draft; the bridge sends the edited
          text as-is (kind "send", carrying the approval id so it closes it). */}
      <details className="wf-outbound-edit">
        <summary>edit and send</summary>
        <form action={sendApprovedEdit}>
          <input type="hidden" name="id" value={ap.id} />
          <input type="hidden" name="agent" value={agent} />
          <textarea
            name="text"
            rows={8}
            defaultValue={ap.draft ?? ""}
            className="wf-outbound-editbox"
          />
          <button className="act" type="submit">
            send edited
          </button>
        </form>
      </details>
    </div>
  );
}
