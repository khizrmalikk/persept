import Link from "next/link";
import type { ReactNode } from "react";

// The "## Health" lines from Chief's STATE.md as a compact list: each discrepancy
// gets a warning dot, and known phrases link to where you'd act on them. Empty
// lines → "all clear" (muted). Rendered on Chief's page above the state panel and
// on the home under the roster. Presentational; next/link works server or client.

// phrase → where to act. First match per line wins (Chief writes one per line).
const LINKS: [RegExp, string][] = [
  [
    /replies?\s+with\s+no\s+response/i,
    "/dashboard/agents/hunter/conversations?filter=awaiting",
  ],
  [/approvals?\s+waiting/i, "/dashboard/approvals"],
  [
    /backlog\s+items?\s+past\s+due|past\s+due/i,
    "/dashboard/agents/chief#wf-backlog",
  ],
];

function linkify(line: string): ReactNode[] {
  for (const [re, href] of LINKS) {
    const m = re.exec(line);
    if (!m) continue;
    const start = m.index;
    const end = start + m[0].length;
    return [
      line.slice(0, start),
      <Link key="hl" href={href} className="wf-st-link">
        {m[0]}
      </Link>,
      line.slice(end),
    ];
  }
  return [line];
}

export function HealthStrip({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <p className="wf-health-clear">all clear</p>;
  }
  return (
    <ul className="wf-health-list">
      {lines.map((line) => (
        <li key={line} className="wf-health-item">
          <span className="wf-health-dot" aria-hidden="true" />
          <span className="wf-health-text">{linkify(line)}</span>
        </li>
      ))}
    </ul>
  );
}
