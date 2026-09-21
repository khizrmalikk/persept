"use client";

import { useState } from "react";
import { DigestCards } from "./DigestCards";
import type { Digest } from "./digest";

// The previous digests as a list of dates; clicking a date shows that digest in the
// same card layout. All digests are parsed server-side and passed in — this only
// switches which one is shown (no fetch, no state lib).
export function DigestArchive({
  digests,
  museEnabled,
}: {
  digests: Digest[];
  museEnabled: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  if (!digests.length) {
    return <p className="empty">no earlier digests yet</p>;
  }
  const shown = digests.find((d) => d.date === active) ?? null;
  return (
    <div className="wf-archive">
      <div className="wf-archive-dates">
        {digests.map((d) => (
          <button
            type="button"
            key={d.date}
            className={`wf-archive-date${active === d.date ? " active" : ""}`}
            onClick={() => setActive(active === d.date ? null : d.date)}
          >
            {d.date}
          </button>
        ))}
      </div>
      {shown ? (
        <div className="wf-archive-body">
          {shown.header ? <p className="wf-di-header">{shown.header}</p> : null}
          <DigestCards digest={shown} museEnabled={museEnabled} />
        </div>
      ) : (
        <p className="wf-archive-hint muted">pick a date to read that digest</p>
      )}
    </div>
  );
}
