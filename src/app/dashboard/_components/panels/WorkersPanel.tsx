import { getAgentSubagents } from "@/lib/workforce/subagents";
import { ago } from "@/lib/workforce/types";
import { HudPanel } from "./HudPanel";

// The agent's background workers (OpenClaw sub-agents) as a compact HUD list.
// Read-only via getAgentSubagents (running first, then newest, capped at 8).
// Running rows glow at the accent; done rows dim. Honest empty state.
export async function WorkersPanel({ agentId }: { agentId: string }) {
  const workers = await getAgentSubagents(agentId);

  if (!workers.length) {
    return (
      <HudPanel title="background workers" right="workers">
        <p className="empty">no background workers yet</p>
      </HudPanel>
    );
  }

  return (
    <HudPanel title="background workers" right={`${workers.length} active`}>
      <ul className="wf-workers">
        {workers.map((w) => {
          const running = w.status === "running";
          const name =
            w.label?.trim() || w.session_key.slice(-8) || w.session_key;
          const timing = running
            ? `started ${ago(w.started_at)}`
            : `finished ${ago(w.updated_at)}`;
          return (
            <li className="wf-worker" key={w.session_key}>
              <span
                className={`wf-worker-dot ${running ? "on" : "off"}`}
                aria-hidden="true"
              />
              <span className="wf-worker-label">{name}</span>
              {w.model ? (
                <span className="wf-worker-model">
                  {w.model.replace("anthropic/", "")}
                </span>
              ) : null}
              <span className="wf-worker-time">{timing}</span>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}
