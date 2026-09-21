import { getAgentFile } from "@/lib/workforce/files";
import { today, yesterday } from "./dates";
import { HudPanel } from "./HudPanel";

// The agent's day log: memory/<today>.md, falling back to yesterday's. Rendered as
// plain text in a <pre>, collapsed by default. Empty state when neither exists.
export async function TodayLog({ agentId }: { agentId: string }) {
  const t = today();
  const y = yesterday();
  let file = await getAgentFile(agentId, `memory/${t}.md`);
  let date = t;
  if (!file) {
    file = await getAgentFile(agentId, `memory/${y}.md`);
    date = y;
  }

  if (!file?.content?.trim()) {
    return (
      <HudPanel title="day log">
        <p className="empty">{agentId} has not logged today or yesterday</p>
      </HudPanel>
    );
  }

  const label = date === t ? "today" : "yesterday";
  return (
    <HudPanel collapsible title={`day log · ${date}`} right={label}>
      <pre className="wf-log-pre">{file.content.trim()}</pre>
    </HudPanel>
  );
}
