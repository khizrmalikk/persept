import { sendAgentCommandFromForm } from "@/lib/workforce/actions";

// "This week" — Muse's latest weekly plan (plan/YYYY-Www.md), rendered as rows of
// day · channel · angle · source, with an "edit plan" textarea that saves back
// through Muse ("update the plan: <text>"; Muse rewrites the file). No plan yet →
// an empty state with a one-click "write this week's plan now".
//
// Presentational + server-action forms only (no client JS): the textarea posts
// the whole edited plan via sendAgentCommandFromForm (prefix + note).

export type PlanRow = {
  day: string;
  channel: string;
  angle: string;
  source: string;
};

function channelClass(channel: string): string {
  const c = channel.toLowerCase();
  return c.includes("insta") ? "is-instagram" : "is-linkedin";
}

export function MuseWeekPanel({
  rows,
  planText,
}: {
  rows: PlanRow[];
  planText: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="wf-muse-week">
        <p className="wf-of-mini-empty">
          no plan yet; next on Sunday 08:00, or ask muse for one now.
        </p>
        <form action={sendAgentCommandFromForm}>
          <input type="hidden" name="agent" value="muse" />
          <input type="hidden" name="text" value="write this week's plan now" />
          <button className="act sm" type="submit">
            write this week&rsquo;s plan now
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="wf-muse-week">
      <ul className="wf-muse-plan">
        {rows.map((r, i) => (
          <li key={`${r.day}-${i}`} className="wf-muse-plan-row">
            <span className="wf-muse-plan-day">{r.day}</span>
            <span className={`wf-chip sm ${channelClass(r.channel)}`}>
              {r.channel}
            </span>
            <span className="wf-muse-plan-angle" title={r.angle}>
              {r.angle}
            </span>
            {r.source && (
              <span className="wf-muse-plan-source" title={r.source}>
                {r.source}
              </span>
            )}
          </li>
        ))}
      </ul>
      <details className="wf-muse-editplan">
        <summary>edit plan</summary>
        <form action={sendAgentCommandFromForm}>
          <input type="hidden" name="agent" value="muse" />
          <input type="hidden" name="prefix" value="update the plan: " />
          <textarea
            name="note"
            rows={8}
            defaultValue={planText}
            className="wf-muse-editbox"
          />
          <button className="act sm" type="submit">
            save plan
          </button>
        </form>
      </details>
    </div>
  );
}
