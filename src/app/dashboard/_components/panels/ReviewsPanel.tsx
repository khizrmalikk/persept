"use client";

import { useState, useTransition } from "react";
import {
  backlogDoneFromForm,
  backlogDropFromForm,
  sendAgentCommand,
} from "@/lib/workforce/actions";
// type-only: backlog.ts is server-only (supabaseAdmin).
import type { BacklogItem } from "@/lib/workforce/backlog";
import { Markdown } from "./Markdown";

// Chief's weekly workforce review: the newest improvements/*.md rendered with the
// shared Markdown component, a date selector for older ones, and a "run the review
// now" button (a plain sendAgentCommand). Under the review, the backlog items whose
// title starts with "workforce: " are a checklist — accept (done) / discard (drop)
// each proposal in one click, using the normal backlog actions.

export type Review = { date: string; markdown: string };

export function ReviewsPanel({
  reviews,
  proposals,
}: {
  reviews: Review[];
  proposals: BacklogItem[];
}) {
  const [idx, setIdx] = useState(0);
  const [running, start] = useTransition();
  const [ran, setRan] = useState(false);
  const current = reviews[idx];

  const runNow = () =>
    start(async () => {
      await sendAgentCommand(
        "chief",
        "write the weekly workforce review now, exactly as in AGENTS.md",
      );
      setRan(true);
    });

  return (
    <div className="wf-review">
      <div className="wf-review-top">
        {reviews.length > 1 && (
          <label className="wf-review-pick">
            <span className="sr-only">choose a review</span>
            <select
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
            >
              {reviews.map((r, i) => (
                <option key={r.date} value={i}>
                  {r.date}
                  {i === 0 ? " · latest" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="act sm"
          onClick={runNow}
          disabled={running}
        >
          {running ? "asking chief…" : "run the review now"}
        </button>
      </div>

      {ran && (
        <p className="wf-review-ran">
          asked chief — the review appears here in a few minutes.
        </p>
      )}

      {current ? (
        <div className="wf-review-body">
          <Markdown source={current.markdown} />
        </div>
      ) : (
        <p className="wf-of-mini-empty">
          no review yet; the first runs Friday 17:00.
        </p>
      )}

      {proposals.length > 0 && (
        <div className="wf-review-props">
          <h4 className="wf-review-props-head">proposed changes</h4>
          <ul className="wf-review-checklist">
            {proposals.map((p) => (
              <li key={p.id} className="wf-review-check">
                <span
                  className="wf-review-check-title"
                  title={p.detail || undefined}
                >
                  {p.title.replace(/^workforce:\s*/i, "")}
                </span>
                <span className="wf-review-check-actions">
                  <form action={backlogDoneFromForm}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="act sm">
                      accept
                    </button>
                  </form>
                  <form action={backlogDropFromForm}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="act sm secondary">
                      discard
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
