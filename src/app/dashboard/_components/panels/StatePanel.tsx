import Link from "next/link";
import type { ReactNode } from "react";
import { isStale, parseState } from "@/lib/workforce/backlog";
import type { Agent } from "@/lib/workforce/types";
import { RosterStrip } from "./RosterStrip";

// Chief's live state, rendered from the bridge-mirrored STATE.md (read-only). The
// file is split on "## " headings: "agents" becomes the roster strip; "waiting on
// the owner" gets approval/hand-off numbers linked; the rest render as plain lists.
// A muted "state file is stale" shows when the mirror is older than 15 minutes.

// Link approval / hand-off number references inside a "waiting on the owner" line.
function linkify(line: string): ReactNode[] {
  const re = /((?:approval|hand-?off)s?\s*#?\d+)/gi;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null = re.exec(line);
  let k = 0;
  while (m !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const token = m[0];
    const href = /hand-?off/i.test(token)
      ? "/dashboard/agents/hunter"
      : "/dashboard/approvals";
    out.push(
      <Link key={`l${k}`} href={href} className="wf-st-link">
        {token}
      </Link>,
    );
    last = m.index + token.length;
    k += 1;
    m = re.exec(line);
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function StatePanel({
  content,
  updatedAt,
  agents,
}: {
  content: string | null;
  updatedAt: string | null;
  agents: Agent[];
}) {
  const has = !!content?.trim();
  const { asOf, sections } = parseState(content);
  const stale = isStale(updatedAt);

  return (
    <div className="wf-st">
      {/* the "agents" section IS the roster strip (shown always, so it doesn't
          vanish when STATE.md hasn't been mirrored yet) */}
      <RosterStrip agents={agents} />

      {!has ? (
        <p className="wf-of-mini-empty">
          the bridge has not written STATE.md yet
        </p>
      ) : (
        <>
          <div className="wf-st-head">
            {asOf && <span className="wf-st-asof">{asOf}</span>}
            {stale && <span className="wf-st-stale">state file is stale</span>}
          </div>
          {sections
            .filter((s) => !/agent/.test(s.title))
            .map((s) => {
              const isWaiting = /wait/.test(s.title);
              return (
                <section key={s.title} className="wf-st-section">
                  <h4 className="wf-st-title">{s.title}</h4>
                  {s.lines.length === 0 ? (
                    <p className="wf-st-empty">—</p>
                  ) : (
                    <ul className="wf-st-list">
                      {s.lines.map((line, i) => (
                        <li key={`${s.title}-${i}`}>
                          {isWaiting ? linkify(line) : line}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
        </>
      )}
    </div>
  );
}
