"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";

// Sortable + expandable prospect table. Data comes in as a prop (parsed server-side
// from PROSPECTS.md); the client only sorts, expands, and fires quick-action messages
// to hunter. It never fetches. Quick actions send exactly:
//   mark sent → "sent <company>"
//   log reply → "reply from <company>: <text>"
//   park      → "park <company>"

export type ProspectRow = Record<string, string>;

type SortKey = "priority" | "status" | "next_due";
type Due = "overdue" | "today" | "future" | "";

function normStatus(s: string): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function trunc(s: string, n: number): string {
  const v = (s ?? "").trim();
  return v.length > n ? `${v.slice(0, n - 1)}…` : v;
}

export function PipelineTable({
  rows,
  dueOf,
}: {
  rows: ProspectRow[];
  dueOf: Record<string, Due>;
}) {
  const [sort, setSort] = useState<SortKey>("priority");
  const [asc, setAsc] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [replyKey, setReplyKey] = useState<string | null>(null);
  const [campaign, setCampaign] = useState("");
  const [search, setSearch] = useState("");
  const [pending, start] = useTransition();

  // Distinct campaign slugs present in the list, for the filter above the table.
  const campaigns = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      const c = (r.campaign ?? "").trim();
      if (c) seen.add(c);
    }
    return [...seen].sort();
  }, [rows]);

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const copy = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !campaign || (r.campaign ?? "").trim() === campaign)
      .filter(({ r }) => {
        if (!q) return true;
        // search across the human-readable columns
        return ["company", "contact", "channel", "angle", "notes", "address"]
          .map((k) => (r[k] ?? "").toLowerCase())
          .some((v) => v.includes(q));
      });
    copy.sort((a, b) => {
      const av = (a.r[sort] ?? "").toLowerCase();
      const bv = (b.r[sort] ?? "").toLowerCase();
      const c = av < bv ? -1 : av > bv ? 1 : a.i - b.i;
      return asc ? c : -c;
    });
    return copy.map((x) => x.r);
  }, [rows, sort, asc, campaign, search]);

  const clickHead = (k: SortKey) => {
    if (sort === k) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(true);
    }
  };

  const send = (text: string) =>
    start(() => void sendAgentCommand("hunter", text));

  const head = (k: SortKey, label: string) => (
    <th
      className={`wf-sortable${sort === k ? " active" : ""}`}
      onClick={() => clickHead(k)}
      aria-sort={sort === k ? (asc ? "ascending" : "descending") : "none"}
    >
      {label}
      {sort === k ? (
        <span className="wf-sort-caret">{asc ? "▲" : "▼"}</span>
      ) : null}
    </th>
  );

  return (
    <div className="wf-pipeline">
      <div className="wf-pipe-search">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search prospects (company, contact, angle…)"
          aria-label="search prospects"
        />
        {search && (
          <span className="wf-pipe-search-count">
            {sorted.length} match{sorted.length === 1 ? "" : "es"}
          </span>
        )}
      </div>
      {campaigns.length > 0 && (
        <div className="wf-pipe-filter">
          <span className="wf-pipe-filter-label">campaign</span>
          <button
            type="button"
            className={`wf-chip${campaign === "" ? " is-active" : ""}`}
            onClick={() => setCampaign("")}
          >
            all
          </button>
          {campaigns.map((c) => (
            <button
              key={c}
              type="button"
              className={`wf-chip${campaign === c ? " is-active" : ""}`}
              onClick={() => setCampaign(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <table className="table wf-pipe-table">
        <thead>
          <tr>
            {head("priority", "pri")}
            <th>company</th>
            <th>contact</th>
            <th>channel</th>
            {campaigns.length > 0 && <th>campaign</th>}
            {head("status", "status")}
            {head("next_due", "next due")}
            <th>angle</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const key = `${r.company ?? "row"}-${i}`;
            const open = openKey === key;
            const due = dueOf[r.company] ?? "";
            const dueCls =
              due === "overdue" ? "err" : due === "today" ? "accent" : "muted";
            return (
              <Fragment key={key}>
                <tr
                  className={`wf-pipe-row${open ? " open" : ""}`}
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => {
                    setOpenKey(open ? null : key);
                    setReplyKey(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenKey(open ? null : key);
                      setReplyKey(null);
                    }
                  }}
                >
                  <td className="muted">{r.priority}</td>
                  <td>{r.company}</td>
                  <td className="muted">{r.contact}</td>
                  <td className="muted">{r.channel}</td>
                  {campaigns.length > 0 && (
                    <td>
                      {r.campaign ? (
                        <span className="wf-chip sm">{r.campaign}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  )}
                  <td>
                    <span className="kind">
                      {normStatus(r.status).replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className={dueCls}>{r.next_due || "—"}</td>
                  <td className="muted" title={r.angle}>
                    {trunc(r.angle, 80)}
                  </td>
                </tr>
                {open ? (
                  <tr className="wf-pipe-detail">
                    <td colSpan={campaigns.length > 0 ? 8 : 7}>
                      <dl className="wf-detail-grid">
                        <dt>angle</dt>
                        <dd>{r.angle || "—"}</dd>
                        <dt>address</dt>
                        <dd>{r.address || "—"}</dd>
                        <dt>notes</dt>
                        <dd>{r.notes || "—"}</dd>
                      </dl>
                      <div className="wf-quick">
                        <button
                          type="button"
                          className="act secondary"
                          disabled={pending}
                          onClick={() => send(`sent ${r.company}`)}
                        >
                          mark sent
                        </button>
                        <button
                          type="button"
                          className="act secondary"
                          disabled={pending}
                          onClick={() =>
                            setReplyKey(replyKey === key ? null : key)
                          }
                        >
                          log reply
                        </button>
                        <button
                          type="button"
                          className="act secondary"
                          disabled={pending}
                          onClick={() => send(`hand ${r.company} to me`)}
                        >
                          hand to me
                        </button>
                        <button
                          type="button"
                          className="act secondary"
                          disabled={pending}
                          onClick={() => send(`park ${r.company}`)}
                        >
                          park
                        </button>
                      </div>
                      {replyKey === key ? (
                        <form
                          className="wf-reply"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const ta =
                              e.currentTarget.elements.namedItem("reply");
                            const text =
                              ta instanceof HTMLTextAreaElement
                                ? ta.value.trim()
                                : "";
                            if (!text) return;
                            send(`reply from ${r.company}: ${text}`);
                            setReplyKey(null);
                          }}
                        >
                          <textarea
                            name="reply"
                            rows={2}
                            placeholder={`reply from ${r.company}…`}
                          />
                          <button
                            type="submit"
                            className="act"
                            disabled={pending}
                          >
                            send
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="wf-quick-note">
        actions are sent to hunter as messages; the table updates on its next
        write (up to a minute)
      </p>
    </div>
  );
}
