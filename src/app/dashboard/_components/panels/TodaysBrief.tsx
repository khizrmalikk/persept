import { HudPanel } from "./HudPanel";

// chief's morning brief. The page finds the latest assistant message whose text starts
// with "good morning" (from today, Asia/Dubai) and passes its text here; this splits it
// into the five labelled sections leniently. Empty state when there's none today.

const SECTIONS: { key: string; label: string; match: RegExp }[] = [
  { key: "yesterday", label: "yesterday", match: /yesterday/i },
  {
    key: "waiting",
    label: "waiting on you",
    match: /waiting on you|waiting for you|waiting/i,
  },
  { key: "today", label: "today", match: /today/i },
  { key: "cost", label: "cost", match: /cost|spend/i },
  { key: "one", label: "one thing", match: /one thing|the one thing/i },
];

// Split the brief on heading-ish lines that name a section; collect the prose under each.
function splitBrief(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let cur = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const stripped = line
      .replace(/^#+\s*/, "")
      .replace(/[*_:]+$/g, "")
      .replace(/^[-*]\s*/, "");
    const label = stripped.toLowerCase();
    const hit = SECTIONS.find(
      (s) =>
        s.match.test(label) &&
        label.replace(s.match, "").replace(/[:\s—-]/g, "").length <= 2,
    );
    if (hit) {
      cur = hit.key;
      const rest = stripped
        .replace(hit.match, "")
        .replace(/^[:\s—-]+/, "")
        .trim();
      out[cur] = rest ? `${rest}\n` : "";
    } else if (cur) {
      out[cur] = `${out[cur] ?? ""}${line}\n`;
    }
  }
  return out;
}

export function TodaysBrief({ text }: { text: string | null }) {
  if (!text) {
    return (
      <HudPanel title="today's brief">
        <p className="empty">no brief yet today; next at 08:00</p>
      </HudPanel>
    );
  }
  const parts = splitBrief(text);
  const any = SECTIONS.some((s) => parts[s.key]?.trim());
  return (
    <HudPanel title="today's brief" right="08:00">
      {!any ? (
        <pre className="wf-log-pre">{text.trim()}</pre>
      ) : (
        <div className="wf-brief">
          {SECTIONS.map((s) => (
            <div className="wf-brief-block" key={s.key}>
              <span className="wf-brief-label">{s.label}</span>
              <p className="wf-brief-body">{parts[s.key]?.trim() || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </HudPanel>
  );
}
