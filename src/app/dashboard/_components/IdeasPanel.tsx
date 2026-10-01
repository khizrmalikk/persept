"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dismissIdea, sendAgentCommand } from "@/lib/workforce/actions";
// type-only: ideas.ts is server-only (supabaseAdmin).
import type { Idea } from "@/lib/workforce/ideas";
import { rosterById } from "@/lib/workforce/roster";
import { ago } from "@/lib/workforce/types";

export type IdeaVM = Idea & { approvalId: number | null };

function Field({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div style={{ display: "grid", gap: 2, marginTop: 6 }}>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-faint)",
        }}
      >
        {k}
      </span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-soft)" }}>
        {v}
      </span>
    </div>
  );
}

function IdeaCard({ idea }: { idea: IdeaVM }) {
  const [pending, start] = useTransition();
  const [asked, setAsked] = useState(false);
  const r = rosterById(idea.agent_id);
  const escalated = idea.status === "escalated";

  const dismiss = () => start(() => void dismissIdea(idea.id));
  const askChief = () =>
    start(async () => {
      await sendAgentCommand("chief", `decide idea ${idea.short_id} now`);
      setAsked(true);
    });

  return (
    <div className="wf-idea">
      <div className="wf-idea-top">
        <span className="wf-idea-agent">
          {r?.emoji ?? "◆"} {r?.name ?? idea.agent_id}
        </span>
        <span className="wf-idea-title">{idea.title}</span>
        <span className="wf-idea-age wf-hn-mono">{ago(idea.ts)}</span>
      </div>
      <Field k="why" v={idea.why} />
      <Field k="what" v={idea.what} />
      <Field k="needs" v={idea.needs} />
      <Field k="cost" v={idea.cost} />
      <div className="wf-idea-actions">
        {escalated ? (
          idea.approvalId != null ? (
            <Link href="/dashboard/approvals" className="wf-hn-btn ghost sm">
              waiting on you (#{idea.approvalId})
            </Link>
          ) : (
            <span className="wf-hn-note">escalated</span>
          )
        ) : (
          <button
            type="button"
            className="wf-hn-btn cream sm"
            disabled={pending || asked}
            onClick={askChief}
          >
            {asked ? "asked chief" : "ask chief"}
          </button>
        )}
        <button
          type="button"
          className="wf-hn-btn ghost sm"
          disabled={pending}
          onClick={dismiss}
        >
          dismiss
        </button>
      </div>
    </div>
  );
}

export function IdeasPanel({
  active,
  decided,
}: {
  active: IdeaVM[];
  decided: Idea[];
}) {
  const [showDecided, setShowDecided] = useState(false);
  return (
    <div className="wf-ideas">
      {active.length === 0 ? (
        <div className="wf-hn-empty">
          no ideas waiting. the team raises one when it spots something worth
          your call.
        </div>
      ) : (
        active.map((i) => <IdeaCard key={i.id} idea={i} />)
      )}

      {decided.length > 0 && (
        <div className="wf-ideas-decided">
          <button
            type="button"
            className="wf-bl-done-toggle"
            onClick={() => setShowDecided((v) => !v)}
            aria-expanded={showDecided}
          >
            recent decisions ({decided.length})
          </button>
          {showDecided &&
            decided.map((d) => (
              <div className="wf-ideas-decided-row" key={d.id}>
                <span className="wf-ideas-decided-title">{d.title}</span>
                <span className="wf-ideas-decided-reason">
                  {d.status === "done" ? "done" : "dismissed"}
                  {d.reason ? ` · ${d.reason}` : ""}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
