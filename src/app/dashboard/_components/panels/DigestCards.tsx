"use client";

import { useState, useTransition } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";
import type { Digest, DigestFor, DigestItem, DigestTag } from "./digest";

// Renders a parsed digest as item cards, with optional for:/tag: filter chips above.
// Client-only interactivity (filtering + quick actions); the digest is already parsed
// server-side and passed in. Quick actions send exactly:
//   send to hunter → "add prospect angle from scout: <title> — <meaning> — <url>"

const FORS: (DigestFor | "all")[] = ["all", "gyst", "workforce"];
const TAGS: (DigestTag | "all")[] = [
  "all",
  "content",
  "sales",
  "product",
  "watch",
];

function ItemCard({
  item,
  museEnabled,
  leadCompanies,
}: {
  item: DigestItem;
  museEnabled: boolean;
  leadCompanies?: string[];
}) {
  const [pending, start] = useTransition();
  const thin = !item.title && !item.url;
  // a sales item that names a company Scout already turned into a lead
  const inLeads =
    item.tag === "sales" &&
    (leadCompanies ?? []).some((c) => {
      const cc = c.trim().toLowerCase();
      return cc && `${item.title} ${item.meaning}`.toLowerCase().includes(cc);
    });
  const toHunter = () =>
    start(
      () =>
        void sendAgentCommand(
          "hunter",
          `add prospect angle from scout: ${item.title} — ${item.meaning} — ${item.url}`,
        ),
    );
  const toMuse = () =>
    start(
      () =>
        void sendAgentCommand(
          "muse",
          `from scout: ${item.title} — ${item.meaning}`,
        ),
    );

  if (thin) {
    return (
      <div className="wf-di-card is-raw">
        <pre className="wf-log-pre">{item.raw}</pre>
      </div>
    );
  }
  return (
    <article className="wf-di-card">
      <div className="wf-di-head">
        <span className="wf-di-n">{item.n}</span>
        <h4 className="wf-di-title">{item.title}</h4>
      </div>
      {item.meaning ? <p className="wf-di-meaning">{item.meaning}</p> : null}
      {(item.for || item.tag || item.source || inLeads) && (
        <div className="wf-di-tags">
          {item.for ? (
            <span className="wf-di-tag is-for">{item.for}</span>
          ) : null}
          {item.tag ? <span className="wf-di-tag">{item.tag}</span> : null}
          {inLeads && (
            <a className="wf-di-inleads" href="#wf-leads-anchor">
              in leads
            </a>
          )}
          {item.source ? (
            <span className="wf-di-src">{item.source}</span>
          ) : null}
        </div>
      )}
      <div className="wf-di-foot">
        {item.url ? (
          <a
            className="wf-di-link"
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            open source ↗
          </a>
        ) : (
          <span className="wf-di-nolink">no link</span>
        )}
        <span className="wf-di-actions">
          <button
            type="button"
            className="act sm secondary"
            disabled={pending}
            onClick={toHunter}
          >
            → hunter
          </button>
          <button
            type="button"
            className="act sm secondary"
            disabled={!museEnabled || pending}
            onClick={toMuse}
            title={museEnabled ? undefined : "muse is not enabled yet"}
          >
            → muse
          </button>
        </span>
      </div>
    </article>
  );
}

export function DigestCards({
  digest,
  museEnabled,
  filters = false,
  leadCompanies,
}: {
  digest: Digest;
  museEnabled: boolean;
  filters?: boolean;
  leadCompanies?: string[];
}) {
  const [forF, setForF] = useState<(typeof FORS)[number]>("all");
  const [tagF, setTagF] = useState<(typeof TAGS)[number]>("all");

  const items = digest.items.filter(
    (it) =>
      (forF === "all" || it.for === forF) &&
      (tagF === "all" || it.tag === tagF),
  );

  return (
    <div className="wf-digest">
      {digest.lead ? <p className="wf-di-lead">{digest.lead}</p> : null}
      {filters ? (
        <div className="wf-digest-filters">
          <div className="wf-di-filter-row">
            <span className="wf-di-filter-label">for</span>
            {FORS.map((f) => (
              <button
                type="button"
                key={f}
                className={`wf-chip${forF === f ? " is-active" : ""}`}
                onClick={() => setForF(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="wf-di-filter-row">
            <span className="wf-di-filter-label">tag</span>
            {TAGS.map((t) => (
              <button
                type="button"
                key={t}
                className={`wf-chip${tagF === t ? " is-active" : ""}`}
                onClick={() => setTagF(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {items.length ? (
        items.map((it) => (
          <ItemCard
            key={`${it.n}-${it.title}`}
            item={it}
            museEnabled={museEnabled}
            leadCompanies={leadCompanies}
          />
        ))
      ) : (
        <p className="empty">nothing matches this filter</p>
      )}
    </div>
  );
}
