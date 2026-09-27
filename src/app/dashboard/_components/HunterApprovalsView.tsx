"use client";

import { useState } from "react";
import {
  approveFromForm,
  rejectFromForm,
  sendApprovedEdit,
} from "@/lib/workforce/actions";

export type HunterApproval = {
  id: number;
  to: string;
  channel: string;
  subject: string;
  risk: "low" | "medium" | "high";
  reason: string;
  when: string;
  body: string;
  held: boolean;
  publish: boolean;
};

const RISK: Record<string, [string, string]> = {
  low: ["rgba(255,255,255,0.07)", "var(--ink-soft)"],
  medium: ["oklch(0.8 0.14 70 / 0.16)", "var(--accent)"],
  high: ["oklch(0.72 0.17 25 / 0.18)", "var(--err)"],
};

function Card({ a }: { a: HunterApproval }) {
  const [editing, setEditing] = useState(false);
  const [riskBg, riskFg] = RISK[a.risk];
  const sendLabel = a.held ? "release" : a.publish ? "publish" : "send";

  return (
    <div className="wf-hn-appr">
      <div className="wf-hn-appr-head">
        <span className="wf-hn-appr-k">to</span>
        <span style={{ fontWeight: 600 }}>{a.to}</span>
        <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <span className="wf-chip-mono">{a.channel}</span>
          <span
            className="wf-hn-riskpill"
            style={{ background: riskBg, color: riskFg }}
          >
            {a.risk} risk
          </span>
        </span>
        <span className="wf-hn-appr-k">subject</span>
        <span>{a.subject || "—"}</span>
        <span />
        <span className="wf-hn-appr-k">why</span>
        <span style={{ color: "var(--ink-mut)" }}>{a.reason}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ink-faint)",
            textAlign: "right",
          }}
        >
          {a.when}
        </span>
      </div>

      {editing ? (
        <form action={sendApprovedEdit}>
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="agent" value="hunter" />
          <div style={{ padding: "18px 20px 0" }}>
            <textarea
              name="text"
              className="wf-hn-appr-edit"
              defaultValue={a.body}
            />
          </div>
          <div className="wf-hn-appr-actions">
            <button type="submit" className="wf-hn-btn amber lg">
              send edited version
            </button>
            <button
              type="button"
              className="wf-hn-btn ghost lg"
              onClick={() => setEditing(false)}
            >
              cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="wf-hn-appr-body">{a.body || "(no message body)"}</div>
          <div className="wf-hn-appr-actions">
            <form action={approveFromForm} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="agent" value="hunter" />
              <button type="submit" className="wf-hn-btn amber lg">
                {sendLabel}
              </button>
            </form>
            <button
              type="button"
              className="wf-hn-btn ghost lg"
              onClick={() => setEditing(true)}
            >
              {a.held ? "edit first" : "edit & send"}
            </button>
            <form action={rejectFromForm} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="agent" value="hunter" />
              <button type="submit" className="wf-hn-btn danger lg">
                reject
              </button>
            </form>
            {a.held && (
              <span className="wf-hn-note">
                held · daily cap reached (5 of 5)
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function HunterApprovalsView({
  approvals,
}: {
  approvals: HunterApproval[];
}) {
  return (
    <div className="wf-hn-approvals">
      <div style={{ fontSize: 14, color: "var(--ink-mut)" }}>
        every outbound message waits here. send it, edit it first, or reject it
        with a note.
      </div>
      {approvals.length === 0 ? (
        <div className="wf-hn-appr-empty">
          nothing waiting for you. hunter is working inside its limits.
        </div>
      ) : (
        approvals.map((a) => <Card key={a.id} a={a} />)
      )}
    </div>
  );
}
