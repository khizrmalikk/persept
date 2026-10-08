import Link from "next/link";
// type-only: leads.ts is server-only (supabaseAdmin).
import type { TriageEvent } from "@/lib/workforce/leads";
import { Markdown } from "./Markdown";

// "Decided for you" — Chief's triage decisions over the last 7 days, grouped by
// day (newest first). Each row links to the leads page for that lead. Below, the
// newest inbox/TRIAGE.md collapsed (what Chief is deciding next). Presentational;
// the collapse is a native <details>.

function dayKey(ts: string | null): string {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(
    new Date(ts),
  );
}
function dayLabel(ts: string | null): string {
  if (!ts) return "earlier";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(ts));
}

export function ChiefTriagePanel({
  events,
  triageMd,
}: {
  events: TriageEvent[];
  triageMd: string | null;
}) {
  // group by Dubai day, preserving the newest-first order the query returned.
  const groups: { day: string; label: string; items: TriageEvent[] }[] = [];
  for (const e of events) {
    const day = dayKey(e.ts);
    let g = groups.find((x) => x.day === day);
    if (!g) {
      g = { day, label: dayLabel(e.ts), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  return (
    <div className="wf-triage">
      {events.length === 0 ? (
        <p className="wf-of-mini-empty">
          chief hasn&rsquo;t decided anything in the last 7 days.
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.day} className="wf-triage-day">
            <div className="wf-triage-daylabel">{g.label}</div>
            <ul className="wf-triage-list">
              {g.items.map((e) => (
                <li key={e.id} className="wf-triage-item">
                  <span
                    className={`wf-triage-decision is-${e.decision || "na"}`}
                  >
                    {e.decision || "decided"}
                  </span>
                  <Link
                    href={`/dashboard/agents/scout?lead=${encodeURIComponent(
                      e.leadId,
                    )}#wf-leads-anchor`}
                    className="wf-triage-co"
                  >
                    {e.company || e.summary || "a lead"}
                  </Link>
                  {e.reason && (
                    <span className="wf-triage-reason">{e.reason}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      {triageMd?.trim() && (
        <details className="wf-triage-next">
          <summary>what chief is deciding next</summary>
          <div className="wf-triage-next-body">
            <Markdown source={triageMd} />
          </div>
        </details>
      )}
    </div>
  );
}
