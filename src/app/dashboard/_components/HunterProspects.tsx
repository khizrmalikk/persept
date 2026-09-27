"use client";

import { useMemo, useState } from "react";

export type ProspectVM = {
  pri: string;
  company: string;
  contact: string;
  channel: string;
  campaign: string;
  status: string;
  statusBg: string;
  statusFg: string;
  dueLabel: string;
  dueColor: string;
  angle: string;
};

// Prospects tab body: the search box + campaign chips + the sortable table. Rows
// arrive pre-enriched from the server (due colours computed there to avoid a
// hydration mismatch on "today").
export function HunterProspects({
  rows,
  campaigns,
}: {
  rows: ProspectVM[];
  campaigns: string[];
}) {
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState("all");

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (camp === "all" || r.campaign === camp) &&
        (!query ||
          `${r.company} ${r.contact} ${r.angle}`.toLowerCase().includes(query)),
    );
  }, [rows, q, camp]);

  const chips = ["all", ...campaigns];

  return (
    <div className="wf-hn-tablewrap">
      <div className="wf-hn-toolbar">
        <input
          className="wf-hn-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search prospects (company, contact, angle…)"
        />
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className={`wf-hn-fchip${camp === c ? " on" : ""}`}
            onClick={() => setCamp(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="wf-hn-tscroll">
        <div className="wf-hn-tinner">
          <div className="wf-hn-thead">
            <span>pri</span>
            <span>company</span>
            <span>contact</span>
            <span>channel</span>
            <span>campaign</span>
            <span>status</span>
            <span>next due</span>
            <span>angle</span>
          </div>
          {shown.map((p) => (
            <div className="wf-hn-trow" key={`${p.company}-${p.contact}`}>
              <span
                className="wf-hn-mono"
                style={{ color: "var(--ink-faint)" }}
              >
                {p.pri}
              </span>
              <span style={{ fontWeight: 600 }}>{p.company}</span>
              <span style={{ color: "var(--ink-soft)" }}>{p.contact}</span>
              <span className="wf-hn-mono">{p.channel}</span>
              <span
                className="wf-hn-mono"
                style={{ color: "var(--ink-mut)", fontSize: 10 }}
              >
                {p.campaign}
              </span>
              <span>
                {p.status && (
                  <span
                    className="wf-hn-stpill"
                    style={{ background: p.statusBg, color: p.statusFg }}
                  >
                    {p.status}
                  </span>
                )}
              </span>
              <span className="wf-hn-mono" style={{ color: p.dueColor }}>
                {p.dueLabel}
              </span>
              <span
                style={{
                  color: "var(--ink-mut)",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {p.angle}
              </span>
            </div>
          ))}
          {shown.length === 0 && (
            <div style={{ padding: "24px 18px" }} className="wf-hn-empty">
              no prospects match that search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
