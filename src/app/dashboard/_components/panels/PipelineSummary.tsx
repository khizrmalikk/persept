import type { MarkdownTable } from "@/lib/workforce/files";
import { dueState } from "./dates";
import { HudPanel } from "./HudPanel";

// The pipeline funnel at a glance: a tile per status in funnel order, plus one line
// summarising what's due. Receives the already-parsed PROSPECTS.md table.
const STATUS_ORDER = [
  "new",
  "drafted",
  "approached",
  "followed_up_1",
  "followed_up_2",
  "replied",
  "call_booked",
  "handed_off",
  "parked",
  "no",
] as const;

function normStatus(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function PipelineSummary({
  table,
  fileContent,
}: {
  table: MarkdownTable;
  // The raw PROSPECTS.md content (null when the file is missing). Lets us tell
  // "not written yet" apart from "present but unparseable".
  fileContent?: string | null;
}) {
  if (!table.rows.length) {
    // file missing → hasn't been written; file present but 0 rows → parse failed.
    if (fileContent == null) {
      return (
        <HudPanel title="pipeline">
          <p className="empty">hunter has not written its prospect list yet</p>
        </HudPanel>
      );
    }
    const firstLines = fileContent.split(/\r?\n/).slice(0, 3).join("\n");
    return (
      <HudPanel title="pipeline">
        <p className="empty">prospect list found but could not be read</p>
        <pre className="wf-log-pre">{firstLines}</pre>
      </HudPanel>
    );
  }

  const counts: Record<string, number> = {};
  let dueToday = 0;
  let overdue = 0;
  for (const row of table.rows) {
    const st = normStatus(row.status ?? "");
    if (st) counts[st] = (counts[st] ?? 0) + 1;
    const d = dueState(row.next_due);
    if (d === "today") dueToday++;
    else if (d === "overdue") overdue++;
  }

  return (
    <HudPanel title="pipeline" right={`${table.rows.length} prospects`}>
      <div className="wf-tiles">
        {STATUS_ORDER.map((st) => {
          const n = counts[st] ?? 0;
          return (
            <div className={`wf-tile${n === 0 ? " zero" : ""}`} key={st}>
              <span className="wf-tile-n">{n}</span>
              <span className="wf-tile-l">{st.replace(/_/g, " ")}</span>
            </div>
          );
        })}
      </div>
      <p className="wf-due-line">
        next due:{" "}
        <span className={dueToday ? "accent" : "muted"}>{dueToday} today</span>,{" "}
        <span className={overdue ? "err" : "muted"}>{overdue} overdue</span>
      </p>
    </HudPanel>
  );
}
