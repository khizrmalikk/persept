"use client";

import { useState, useTransition } from "react";
import {
  acceptLead,
  dismissLead,
  sendAgentCommand,
} from "@/lib/workforce/actions";
// type-only import: leads.ts is server-only (supabaseAdmin).
import type { Lead } from "@/lib/workforce/leads";
import { ago } from "@/lib/workforce/types";

const RUN_MSG = "run the weekly prospecting run now, exactly as in AGENTS.md";

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
  const [pending, start] = useTransition();
  const candidateIds = new Set(fromCandidateIds);

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
          <button
            type="button"
            className="wf-bl-done-toggle"
            onClick={() => setShowHandled((v) => !v)}
            aria-expanded={showHandled}
          >
            handled ({handled.length})
          </button>
          {showHandled && (
            <ul className="wf-leads-handledlist">
              {handled.map((l) => (
                <li key={l.id} className="wf-leads-handleditem">
                  <span className="wf-leads-handled-co">{l.company}</span>
                  <span
                    className={`wf-leads-handled-status ${
                      l.status === "sent_to_hunter" ? "ok" : "muted"
                    }`}
                  >
                    {l.status === "sent_to_hunter"
                      ? "sent to hunter"
                      : "dismissed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
