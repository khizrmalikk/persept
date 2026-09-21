import Link from "next/link";
import { type Agent, ago, STATUS_LABEL } from "@/lib/workforce/types";
import { HudPanel } from "./HudPanel";

// One row per agent so chief's page doubles as the roster overview: emoji, name,
// status dot, last-active. Rows link to each agent's detail page.
export function RosterStrip({ agents }: { agents: Agent[] }) {
  if (!agents.length) {
    return (
      <HudPanel title="roster">
        <p className="empty">no agents online yet</p>
      </HudPanel>
    );
  }
  return (
    <HudPanel title="roster" right={`${agents.length} agents`}>
      <ul className="wf-roster">
        {agents.map((a) => {
          const status = a.status ?? "idle";
          return (
            <li key={a.id} className="wf-roster-row">
              <Link
                href={`/dashboard/agents/${a.id}`}
                className="wf-roster-link"
              >
                <span className="wf-roster-emoji" aria-hidden="true">
                  {a.emoji ?? "◆"}
                </span>
                <span className="wf-roster-name">{a.name ?? a.id}</span>
                <span className="wf-roster-status">
                  <span className={`dot ${status}`} />
                  {STATUS_LABEL[status] ?? status}
                </span>
                <span className="wf-roster-ago muted">
                  {ago(a.last_active_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}
