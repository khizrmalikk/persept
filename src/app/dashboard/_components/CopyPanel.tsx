"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";
// type-only: copy.ts is server-only (supabaseAdmin).
import type { CopyRequest } from "@/lib/workforce/copy";
import { ago } from "@/lib/workforce/types";

const STUCK_MS = 15 * 60 * 1000;

function pill(status: string): { background: string; color: string } {
  if (status === "drafted")
    return { background: "oklch(0.8 0.16 150 / 0.14)", color: "var(--ok)" };
  if (status === "writing")
    return {
      background: "oklch(0.78 0.12 220 / 0.16)",
      color: "oklch(0.84 0.09 220)",
    };
  if (status === "question" || status === "refused")
    return { background: "oklch(0.8 0.14 70 / 0.16)", color: "var(--accent)" };
  if (status === "stalled")
    return { background: "oklch(0.72 0.17 25 / 0.16)", color: "var(--err)" };
  return { background: "rgba(255,255,255,0.07)", color: "var(--ink-soft)" };
}

function Row({ req, nowMs }: { req: CopyRequest; nowMs: number }) {
  const [pending, start] = useTransition();
  const [asked, setAsked] = useState(false);
  const startedMs = req.ts ? new Date(req.ts).getTime() : nowMs;
  const stuck = req.status === "writing" && nowMs - startedMs > STUCK_MS;
  const refused = req.status === "refused";
  const stalled = req.status === "stalled";
  const label = req.company || req.context.split("\n")[0] || req.to || "—";

  const resend = () =>
    start(async () => {
      await sendAgentCommand("scribe", `rewrite copy request ${req.short_id}`);
      setAsked(true);
    });

  return (
    <div className="wf-copy-row">
      <div className="wf-copy-top">
        {(stuck || refused || stalled) && (
          <span className={`wf-copy-dot${stalled ? " is-red" : ""}`} />
        )}
        <span className="wf-chip-mono">{req.kind || "copy"}</span>
        {req.channel && <span className="wf-chip-mono">{req.channel}</span>}
        <span className="wf-copy-label">{label}</span>
        <span className="wf-copy-age wf-hn-mono">{ago(req.ts)}</span>
        <span className="wf-hn-stpill" style={pill(req.status)}>
          {req.status}
        </span>
      </div>
      {refused && req.body && <div className="wf-copy-refused">{req.body}</div>}
      {req.status === "drafted" && (req.subject || req.approval_id != null) && (
        <div className="wf-copy-drafted">
          {req.approval_id != null && (
            <Link href="/dashboard/approvals" className="wf-hn-link">
              approval #{req.approval_id}
            </Link>
          )}
          {req.subject && (
            <span className="wf-copy-subject">{req.subject}</span>
          )}
        </div>
      )}
      {(stuck || stalled) && (
        <div className="wf-copy-stuck">
          <span className="wf-hn-note">
            {stalled
              ? req.resent_at
                ? `stalled · resent ${ago(req.resent_at)}`
                : "writer stalled"
              : "stuck in writing over 15 min"}
          </span>
          <button
            type="button"
            className="wf-hn-btn ghost sm"
            disabled={pending || asked}
            onClick={resend}
          >
            {asked ? "resent" : "resend"}
          </button>
        </div>
      )}
    </div>
  );
}

export function CopyPanel({
  requests,
  nowMs,
}: {
  requests: CopyRequest[];
  nowMs: number;
}) {
  if (requests.length === 0) {
    return <div className="wf-hn-empty">no copy requests yet.</div>;
  }
  return (
    <div className="wf-copy">
      {requests.map((r) => (
        <Row key={r.id} req={r} nowMs={nowMs} />
      ))}
    </div>
  );
}
