"use client";

import { useState, useTransition } from "react";
import {
  acceptLead,
  dismissLead,
  sendAgentCommand,
  undoChiefAccept,
  undoChiefDismiss,
} from "@/lib/workforce/actions";
// type-only import: leads.ts is server-only (supabaseAdmin).
import type { Lead } from "@/lib/workforce/leads";
import { ago } from "@/lib/workforce/types";

const RUN_MSG = "run the weekly prospecting run now, exactly as in AGENTS.md";
const TRIAGE_HOURS = Number(process.env.NEXT_PUBLIC_TRIAGE_AFTER_HOURS) || 24;

// One decided lead: who decided it ("chief"/"you"), the reason, and — for a lead
// Chief decided — an undo that flips it (accept→park, dismiss→add to hunter).
function HandledRow({ l }: { l: Lead }) {
  const [pending, start] = useTransition();
  const byChief = l.decided_by === "chief";
  const accepted = l.status === "sent_to_hunter";
  const undo = () =>
    start(async () => {
      if (accepted) await undoChiefAccept(l.id, l.company);
      else await undoChiefDismiss(l.id);
    });
  return (
    <li className="wf-leads-handleditem">
      <div className="wf-leads-handled-main">
        <span className="wf-leads-handled-co">{l.company}</span>
        <span className={`wf-lead-decider is-${byChief ? "chief" : "owner"}`}>
          {byChief ? "chief" : "you"}
        </span>
        <span
          className={`wf-leads-handled-status ${accepted ? "ok" : "muted"}`}
        >
          {accepted ? "sent to hunter" : "dismissed"}
        </span>
        {byChief && (
          <button
            type="button"
            className="act sm secondary"
            disabled={pending}
            onClick={undo}
          >
            {pending ? "…" : "undo"}
          </button>
        )}
      </div>
      {l.reason && <p className="wf-lead-reason">{l.reason}</p>}
    </li>
  );
}

function LeadRow({
  lead,
  checked,
  fromCandidate,
  onToggle,
}: {
  lead: Lead;
  checked: boolean;
  fromCandidate: boolean;
  onToggle: (id: string, on: boolean) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <li className="wf-lead">
      <input
        type="checkbox"
        className="wf-lead-check"
        checked={checked}
        aria-label={`select ${lead.company}`}
        onChange={(e) => onToggle(lead.id, e.target.checked)}
      />
      <div className="wf-lead-body">
        <div className="wf-lead-head">
          {lead.website ? (
            <a
              className="wf-lead-co"
              href={lead.website}
              target="_blank"
              rel="noreferrer noopener"
            >
              {lead.company}
            </a>
          ) : (
            <span className="wf-lead-co">{lead.company || "a company"}</span>
          )}
          {lead.size && <span className="wf-lead-size">{lead.size}</span>}
          {lead.channel && <span className="wf-chip sm">{lead.channel}</span>}
          {lead.campaign && (
            <span className="wf-chip sm ghost">{lead.campaign}</span>
          )}
          {fromCandidate && (
            <span
              className="wf-chip sm ghost"
              title="matched the morning search"
            >
              from candidates
            </span>
          )}
          <span className="wf-lead-age mono">{ago(lead.ts)}</span>
        </div>
        {lead.contact && <p className="wf-lead-contact">{lead.contact}</p>}
        {lead.angle && <p className="wf-lead-angle">{lead.angle}</p>}
        {(lead.evidence || lead.source_url) && (
          <p className="wf-lead-evidence">
            {lead.evidence}
            {lead.source_url && (
              <a
                className="wf-lead-src"
                href={lead.source_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                source ↗
              </a>
            )}
          </p>
        )}
        <div className="wf-lead-actions">
          <button
            type="button"
            className="act sm"
            disabled={pending}
            onClick={() => start(() => void acceptLead(lead.id))}
          >
            add to hunter
          </button>
          <button
            type="button"
            className="act sm secondary"
            disabled={pending}
            onClick={() => start(() => void dismissLead(lead.id))}
          >
            dismiss
          </button>
        </div>
      </div>
    </li>
  );
}

export function LeadsPanel({
  suggested,
  handled,
  fromCandidateIds = [],
}: {
  suggested: Lead[];
  handled: Lead[];
  fromCandidateIds?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showHandled, setShowHandled] = useState(false);
  const [chiefOnly, setChiefOnly] = useState(false);
  const [pending, start] = useTransition();
  const candidateIds = new Set(fromCandidateIds);
  const handledList = chiefOnly
    ? handled.filter((l) => l.decided_by === "chief")
    : handled;

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // bulk accept: one acceptLead per selected id, 400 ms apart (the bridge relays
  // one message per action).
  const acceptSelected = () => {
    const ids = suggested.map((l) => l.id).filter((id) => selected.has(id));
    if (!ids.length) return;
    start(async () => {
      for (let i = 0; i < ids.length; i++) {
        await acceptLead(ids[i]);
        if (i < ids.length - 1) await new Promise((r) => setTimeout(r, 400));
      }
      setSelected(new Set());
    });
  };

  const runNow = () => start(() => void sendAgentCommand("scout", RUN_MSG));

  return (
    <div className="wf-leads">
      {suggested.length > 0 && (
        <div className="wf-leads-waiting">
          {suggested.length} lead{suggested.length === 1 ? "" : "s"} waiting for
          you · chief decides anything older than {TRIAGE_HOURS}h
        </div>
      )}
      <div className="wf-leads-top">
        <button
          type="button"
          className="act sm secondary"
          disabled={pending}
          onClick={runNow}
        >
          run prospecting now
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            className="act sm"
            disabled={pending}
            onClick={acceptSelected}
          >
            add selected to hunter ({selected.size})
          </button>
        )}
      </div>

      {suggested.length === 0 ? (
        <p className="wf-of-mini-empty">
          scout has not proposed any leads yet; the weekly run is Sunday 07:00.
        </p>
      ) : (
        <>
          <ul className="wf-lead-list">
            {suggested.map((l) => (
              <LeadRow
                key={l.id}
                lead={l}
                checked={selected.has(l.id)}
                fromCandidate={candidateIds.has(l.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
          <p className="wf-leads-note">
            hunter adds it to the pipeline within a minute.
          </p>
        </>
      )}

      {handled.length > 0 && (
        <div className="wf-leads-handled">
          <div className="wf-leads-handled-bar">
            <button
              type="button"
              className="wf-bl-done-toggle"
              onClick={() => setShowHandled((v) => !v)}
              aria-expanded={showHandled}
            >
              handled ({handled.length})
            </button>
            {showHandled && handled.some((l) => l.decided_by === "chief") && (
              <button
                type="button"
                className={`wf-hn-fchip${chiefOnly ? " on" : ""}`}
                onClick={() => setChiefOnly((v) => !v)}
                aria-pressed={chiefOnly}
              >
                decided by chief
              </button>
            )}
          </div>
          {showHandled && (
            <ul className="wf-leads-handledlist">
              {handledList.map((l) => (
                <HandledRow key={l.id} l={l} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
