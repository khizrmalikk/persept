import { getAgentFile, listAgentFiles } from "@/lib/workforce/files";
import { HudPanel } from "./HudPanel";
import { Markdown } from "./Markdown";

// "learned from edits": the newest draft files Scribe keeps under
// memory/drafts/, each openable inline (the file viewer), plus the "## lessons"
// section of Scribe's MEMORY.md. Read-only; files are bridge-owned.

// First non-empty line as a title, with markdown heading / bold stripped.
function titleOf(content: string): string {
  const line = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (!line) return "untitled draft";
  return line
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s*/, "")
    .trim()
    .slice(0, 120);
}

// The body of a "## lessons" section (until the next heading of same/higher level).
function lessonsSection(content: string | null | undefined): string {
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,2}\s+lessons\b/i.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return "";
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (/^#{1,2}\s+\S/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

export async function ScribeLessonsPanel({ agentId }: { agentId: string }) {
  const [files, memory] = await Promise.all([
    listAgentFiles(agentId, "memory/drafts/"),
    getAgentFile(agentId, "MEMORY.md"),
  ]);
  const drafts = files.slice(0, 5);
  const lessons = lessonsSection(memory?.content);

  if (drafts.length === 0 && !lessons) {
    return (
      <HudPanel title="learned from edits">
        <p className="empty">
          nothing yet. as you edit and send scribe&rsquo;s drafts, what it
          learns lands here.
        </p>
      </HudPanel>
    );
  }

  return (
    <HudPanel
      title="learned from edits"
      right={drafts.length ? `${drafts.length}` : undefined}
    >
      {drafts.length > 0 && (
        <div className="wf-scribe-drafts">
          {drafts.map((f) => (
            <details key={f.path} className="wf-scribe-draft">
              <summary className="wf-scribe-draft-sum">
                {titleOf(f.content)}
              </summary>
              <div className="wf-scribe-draft-body">
                <Markdown source={f.content} />
              </div>
            </details>
          ))}
        </div>
      )}
      {lessons && (
        <div className="wf-scribe-lessons">
          <div className="wf-scribe-lessons-head">lessons</div>
          <Markdown source={lessons} />
        </div>
      )}
    </HudPanel>
  );
}
