"use client";

import { useRef, useState, useTransition } from "react";
import { latestAgentReply, sendAgentCommand } from "@/lib/workforce/actions";
// type-only: outreach.ts is server-only (supabaseAdmin).
import type { Candidate } from "@/lib/workforce/outreach";
import { when } from "@/lib/workforce/types";

const REPLY_PREFIX = "find candidates:";

// pill colour by candidate status (qualified / dropped / new-ish default)
function pill(status: string): { background: string; color: string } {
  const s = (status ?? "").toLowerCase();
  if (s.includes("qualif") || s.includes("prospect"))
    return { background: "oklch(0.8 0.16 150 / 0.14)", color: "var(--ok)" };
  if (s.includes("drop") || s.includes("reject") || s.includes("skip"))
    return { background: "rgba(255,255,255,0.05)", color: "var(--ink-faint)" };
  return { background: "rgba(255,255,255,0.07)", color: "var(--ink-soft)" };
}

export function HunterCandidatesPanel({
  campaignName,
  candidates,
}: {
  campaignName: string;
  candidates: Candidate[];
}) {
  const [pending, start] = useTransition();
  const [reply, setReply] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);

  // "find candidates now": tell Scout to search, then poll its events for the
  // "find candidates: …" reply for 60 seconds (like the review button).
  const findNow = () => {
    setReply(null);
    setAsked(true);
    done.current = false;
    start(async () => {
      const baseline = await latestAgentReply("scout", REPLY_PREFIX);
      const baseTs = baseline?.ts ?? "";
      await sendAgentCommand("scout", `find candidates for ${campaignName}`);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      for (let i = 1; i <= 12; i++) {
        timers.current.push(
          setTimeout(async () => {
            if (done.current) return;
            const r = await latestAgentReply("scout", REPLY_PREFIX);
            if (r && r.ts !== baseTs) {
              done.current = true;
              setReply(r.text);
            }
          }, i * 5000),
        );
      }
    });
  };

  return (
    <div className="wf-hn-panel">
      <div className="wf-hn-panel-head">
        <span className="wf-hn-panel-title">candidates</span>
        <button
          type="button"
          className="wf-hn-btn ghost sm"
          disabled={pending}
          onClick={findNow}
        >
          {pending ? "asking scout…" : "find candidates now"}
        </button>
      </div>

      {asked && (
        <div className="wf-hn-note" style={{ marginBottom: 4 }}>
          {reply ?? "asked scout — its findings appear here within a minute."}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="wf-hn-empty">
          no candidates yet. add search queries in the editor, or find some now.
        </div>
      ) : (
        candidates.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) 90px",
              gap: 10,
              padding: "10px 0",
              borderTop: "1px solid var(--line-soft)",
              fontSize: 13,
              alignItems: "start",
            }}
          >
            <span style={{ minWidth: 0 }}>
              {c.website ? (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ fontWeight: 600 }}
                >
                  {c.name || c.domain || "a place"}
                </a>
              ) : (
                <span style={{ fontWeight: 600 }}>{c.name || "a place"}</span>
              )}
              {c.query && (
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {c.query}
                </span>
              )}
            </span>
            <span
              style={{ fontSize: 12, color: "var(--ink-mut)", minWidth: 0 }}
            >
              {c.phone && <span>{c.phone}</span>}
              {c.emails[0] && (
                <span style={{ display: "block" }}>{c.emails[0]}</span>
              )}
              {c.rating != null && (
                <span style={{ display: "block", color: "var(--ink-faint)" }}>
                  ★ {c.rating}
                  {c.reviews != null ? ` · ${c.reviews} reviews` : ""}
                </span>
              )}
            </span>
            <span style={{ textAlign: "right" }}>
              {c.status && (
                <span className="wf-hn-stpill" style={pill(c.status)}>
                  {c.status.replace(/[_-]+/g, " ")}
                </span>
              )}
              <span
                className="wf-hn-mono"
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  marginTop: 3,
                }}
              >
                {c.ts ? when(c.ts) : ""}
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
