"use client";

import { useState, useTransition } from "react";
import {
  sendProposalViaHunter,
  setProposalStatus,
} from "@/lib/workforce/actions";
// type-only: proposals.ts is server-only (supabaseAdmin).
import type { Proposal } from "@/lib/workforce/proposals";
import { ago } from "@/lib/workforce/types";
import { Markdown } from "./Markdown";

// pre-fill and focus Scribe's chat composer (uncontrolled textarea) with a revise
// command — the composer lives in the centre column of the same page.
function reviseInChat(company: string) {
  const ta = document.getElementById(
    "composer-scribe",
  ) as HTMLTextAreaElement | null;
  if (!ta) return;
  ta.value = `revise ${company}: `;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

function ProposalCard({ p, siteUrl }: { p: Proposal; siteUrl: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState(p.contact);
  const link = `${siteUrl.replace(/\/+$/, "")}/p/${p.token}`;
  const isDraft = p.status === "draft";

  const copy = () => {
    void navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <article className="wf-prop">
      <div className="wf-prop-head">
        <span className="wf-prop-title">{p.title}</span>
        <span className={`wf-prop-status is-${p.status}`}>{p.status}</span>
      </div>
      <div className="wf-prop-meta">
        <span className="wf-prop-co">{p.company}</span>
        {p.contact && <span className="wf-prop-contact">{p.contact}</span>}
      </div>
      <dl className="wf-prop-facts">
        {p.date && (
          <div>
            <dt>date</dt>
            <dd>{p.date}</dd>
          </div>
        )}
        {p.valid_until && (
          <div>
            <dt>valid until</dt>
            <dd>{p.valid_until}</dd>
          </div>
        )}
        <div>
          <dt>views</dt>
          <dd>
            {p.view_count}
            {p.last_viewed_at && (
              <span className="wf-prop-lastview">
                {" "}
                · last {ago(p.last_viewed_at)}
              </span>
            )}
          </dd>
        </div>
        {p.updated_at && (
          <div>
            <dt>updated</dt>
            <dd>{ago(p.updated_at)}</dd>
          </div>
        )}
      </dl>

      <div className="wf-prop-actions">
        <button
          type="button"
          className="act sm secondary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "hide" : "preview"}
        </button>
        <button type="button" className="act sm secondary" onClick={copy}>
          {copied ? "copied" : "copy link"}
        </button>
        <button
          type="button"
          className="act sm"
          disabled={isDraft || pending}
          title={
            isDraft ? "approve the proposal first (approvals inbox)" : undefined
          }
          onClick={() => setSending((v) => !v)}
        >
          send via hunter
        </button>
        <button
          type="button"
          className="act sm secondary"
          disabled={pending}
          onClick={() => start(() => void setProposalStatus(p.id, "accepted"))}
        >
          mark accepted
        </button>
        <button
          type="button"
          className="act sm secondary"
          disabled={pending}
          onClick={() => start(() => void setProposalStatus(p.id, "declined"))}
        >
          mark declined
        </button>
        <button
          type="button"
          className="act sm secondary"
          onClick={() => reviseInChat(p.company)}
        >
          revise
        </button>
      </div>

      {sending && !isDraft && (
        <div className="wf-prop-send">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="recipient (name &lt;address&gt;)"
            aria-label="recipient"
          />
          <button
            type="button"
            className="act sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await sendProposalViaHunter(p.id, recipient);
                setSending(false);
              })
            }
          >
            send
          </button>
        </div>
      )}

      {open && (
        <div className="wf-prop-preview">
          <Markdown source={p.markdown} />
        </div>
      )}
    </article>
  );
}

export function ProposalsPanel({
  proposals,
  siteUrl,
}: {
  proposals: Proposal[];
  siteUrl: string;
}) {
  if (proposals.length === 0) {
    return (
      <p className="wf-of-mini-empty">
        no proposals yet; after a call, tell scribe: proposal for
        &lt;company&gt;: &lt;notes&gt;.
      </p>
    );
  }
  return (
    <div className="wf-props">
      {proposals.map((p) => (
        <ProposalCard key={p.id} p={p} siteUrl={siteUrl} />
      ))}
    </div>
  );
}
