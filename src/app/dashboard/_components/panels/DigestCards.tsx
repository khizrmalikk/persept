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
}: {
  item: DigestItem;
  museEnabled: boolean;
}) {
  const [pending, start] = useTransition();
  const thin = !item.title && !item.url;
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
      <div className="wf-digest-item raw">
        <pre className="wf-log-pre">{item.raw}</pre>
      </div>
    );
  }
  return (
    <div className="wf-digest-item">
      <div className="wf-di-head">
        <span className="wf-di-n">{item.n}</span>
        <span className="wf-di-title">{item.title}</span>
      </div>
      {item.meaning ? <p className="wf-di-meaning">{item.meaning}</p> : null}
      <div className="wf-di-chips">
        {item.for ? <span className="kind">for: {item.for}</span> : null}
        {item.tag ? <span className="kind">tag: {item.tag}</span> : null}
        {item.source ? <span className="wf-di-src">{item.source}</span> : null}
      </div>
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
          <span className="muted">no link</span>
        )}
        <span className="wf-di-actions">
          <button
            type="button"
            className="act secondary"
            disabled={pending}
            onClick={toHunter}
          >
            send to hunter
          </button>
          <button
            type="button"
            className="act secondary"
            disabled={!museEnabled || pending}
            onClick={toMuse}
            title={museEnabled ? undefined : "muse is not enabled yet"}
          >
            send to muse
          </button>
        </span>
      </div>
    </div>
  );
}

export function DigestCards({
  digest,
  museEnabled,
  filters = false,
}: {
  digest: Digest;
  museEnabled: boolean;
  filters?: boolean;
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
          <div className="chips">
            {FORS.map((f) => (
              <button
                type="button"
                key={f}
                className={`chip-link${forF === f ? " active" : ""}`}
                onClick={() => setForF(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="chips">
            {TAGS.map((t) => (
              <button
                type="button"
                key={t}
                className={`chip-link${tagF === t ? " active" : ""}`}
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
          />
        ))
      ) : (
        <p className="empty">nothing matches this filter</p>
      )}
    </div>
  );
}
