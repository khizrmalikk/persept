import Link from "next/link";
import type { Campaign } from "@/lib/workforce/outreach";

export type CampaignStat = {
  sent: number;
  replies: number;
  handoffs: number;
  prospects: number;
};

const BASE = "/dashboard/agents/hunter/campaigns";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Hunter's campaigns board — a grid of cards. Clicking a card opens that
// campaign's page; the pencil opens its editor. Counts (sent / replies /
// hand-offs / prospects) are computed server-side and passed in as `stats`.
export function CampaignsPanel({
  campaigns,
  stats,
}: {
  campaigns: Campaign[];
  stats: Record<string, CampaignStat>;
}) {
  return (
    <section className="wf-campaigns" aria-label="campaigns">
      <div className="wf-campaigns-head">
        <h1 className="wf-campaigns-title">campaigns</h1>
        <Link className="act" href={`${BASE}/new`}>
          new campaign
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <p className="wf-of-mini-empty">
          no campaigns yet. create one to give hunter a goal, an offer and
          assets to work from.
        </p>
      ) : (
        <div className="wf-campaign-grid">
          {campaigns.map((c) => {
            const s = stats[c.id] ?? {
              sent: 0,
              replies: 0,
              handoffs: 0,
              prospects: 0,
            };
            return (
              <article key={c.id} className="wf-campaign-card">
                {/* stretched hit-area link → the campaign page (kept separate from
                    the edit link so we never nest anchors) */}
                <Link
                  href={`${BASE}/${c.id}`}
                  className="wf-campaign-card-hit"
                  aria-label={`open ${c.name}`}
                />
                <Link
                  href={`${BASE}/${c.id}/edit`}
                  className="wf-campaign-card-edit"
                  aria-label={`edit ${c.name}`}
                >
                  <EditIcon />
                </Link>
                <div className="wf-campaign-card-top">
                  <span className="wf-campaign-name">{c.name}</span>
                  <span className={`wf-campaign-status is-${c.status}`}>
                    {c.status}
                  </span>
                </div>
                {c.goal && <p className="wf-campaign-goal">{c.goal}</p>}
                <dl className="wf-campaign-counts">
                  <div>
                    <dt>sent</dt>
                    <dd className="mono">{s.sent}</dd>
                  </div>
                  <div>
                    <dt>replies</dt>
                    <dd className="mono">{s.replies}</dd>
                  </div>
                  <div>
                    <dt>hand-offs</dt>
                    <dd className="mono">{s.handoffs}</dd>
                  </div>
                  <div>
                    <dt>prospects</dt>
                    <dd className="mono">{s.prospects}</dd>
                  </div>
                </dl>
                {c.assets.length > 0 && (
                  <div className="wf-campaign-assets-hint">
                    {c.assets.length} asset{c.assets.length === 1 ? "" : "s"}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
