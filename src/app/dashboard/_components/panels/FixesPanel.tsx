"use client";

import { useState, useTransition } from "react";
import { retryFix } from "@/lib/workforce/actions";
// type-only: fixes.ts is server-only (supabaseAdmin).
import type { Fix } from "@/lib/workforce/fixes";
import { when } from "@/lib/workforce/types";

export type FixShot = { name: string; url: string };

function FixRow({ fix, shots }: { fix: Fix; shots: FixShot[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="wf-fix">
      <button
        type="button"
        className="wf-fix-top"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`wf-fix-status is-${fix.status}`}>{fix.status}</span>
        <span className="wf-chip-mono">{fix.kind}</span>
        {fix.project && <span className="wf-chip-mono">{fix.project}</span>}
        <span className="wf-fix-title">{fix.title || "(untitled)"}</span>
        <span className="wf-fix-meta mono">
          {fix.requested_by}
          {fix.ts ? ` · ${when(fix.ts)}` : ""}
        </span>
      </button>
      {open && (
        <div className="wf-fix-body">
          {fix.spec && (
            <div className="wf-fix-spec">
              <span className="wf-fix-label">spec</span>
              {fix.spec}
            </div>
          )}
          {fix.summary && <div className="wf-fix-summary">{fix.summary}</div>}
          {fix.checks.length > 0 && (
            <ul className="wf-fix-checks">
              {fix.checks.map((c, i) => (
                <li key={`${c.cmd}-${i}`} className={c.ok ? "ok" : "bad"}>
                  <span className="wf-fix-check-cmd">
                    {c.ok ? "✓" : "✗"} {c.cmd}
                  </span>
                  {!c.ok && c.tail && (
                    <pre className="wf-fix-tail">{c.tail}</pre>
                  )}
                </li>
              ))}
            </ul>
          )}
          {shots.length > 0 && (
            <div className="wf-fix-shots">
              {shots.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer">
                  {/* biome-ignore lint/performance/noImgElement: signed storage URL, not a build-time asset */}
                  <img src={s.url} alt={s.name} className="wf-fix-shot" />
                </a>
              ))}
            </div>
          )}
          {fix.pr_url && (
            <a
              href={fix.pr_url}
              target="_blank"
              rel="noreferrer"
              className="wf-hn-link"
            >
              {fix.pr_number ? `PR #${fix.pr_number}` : "pull request"} ↗
            </a>
          )}
          {fix.error && <pre className="wf-fix-error">{fix.error}</pre>}
          {fix.status === "failed" && (
            <div>
              <button
                type="button"
                className="wf-hn-btn ghost sm"
                disabled={pending}
                onClick={() => start(() => void retryFix(fix.short_id))}
              >
                {pending ? "…" : "retry"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FixesPanel({
  fixes,
  shotsByFix,
}: {
  fixes: Fix[];
  shotsByFix: Record<string, FixShot[]>;
}) {
  if (!fixes.length) {
    return <p className="wf-of-mini-empty">no fixes yet.</p>;
  }
  return (
    <div className="wf-fixes">
      {fixes.map((f) => (
        <FixRow key={f.id} fix={f} shots={shotsByFix[f.id] ?? []} />
      ))}
    </div>
  );
}
