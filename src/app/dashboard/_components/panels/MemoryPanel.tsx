import { getAgentFile } from "@/lib/workforce/files";
import { HudPanel } from "./HudPanel";

// Standing memory (MEMORY.md) as a compact list — each "- " line is one row.
// Collapsed by default. Honest empty state when the agent hasn't written it.
export async function MemoryPanel({ agentId }: { agentId: string }) {
  const file = await getAgentFile(agentId, "MEMORY.md");
  const lines = (file?.content ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") || l.startsWith("* "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);

  if (!file || !lines.length) {
    return (
      <HudPanel title="standing memory">
        <p className="empty">
          {agentId} has not written any standing memory yet
        </p>
      </HudPanel>
    );
  }

  return (
    <HudPanel collapsible title={`standing memory (${lines.length} lines)`}>
      <ul className="wf-memory-list">
        {lines.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
        ))}
      </ul>
    </HudPanel>
  );
}
