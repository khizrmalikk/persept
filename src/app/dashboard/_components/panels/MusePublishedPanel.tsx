import {
  markPostPostedFromForm,
  savePostStatsFromForm,
} from "@/lib/workforce/actions";
import type { PostChannel, PostStats, PostStatus } from "@/lib/workforce/posts";

// "Published" — rows from the `posts` table, newest first: channel, first line,
// date, link (linkedin), status. An approved-for-manual (instagram) row gets a
// "posted" button (sets posted_by_owner + tells Muse). Every row has an inline
// stats form that saves to `posts.stats` and tells Muse `stats <slug>: …`.
//
// Presentational + server-action forms only (no client JS). `slug` is matched
// server-side from the post text to a posts/*.md file; empty when unmatched (the
// action then skips the Muse message but still writes the row).

export type PublishedRow = {
  id: string;
  channel: PostChannel;
  firstLine: string;
  date: string; // preformatted
  url: string | null;
  status: PostStatus;
  slug: string;
  stats: PostStats;
};

const STATUS_LABEL: Record<PostStatus, string> = {
  published: "published",
  approved_manual: "approved · post by hand",
  posted_by_owner: "posted",
};

function StatsForm({ row }: { row: PublishedRow }) {
  const s = row.stats;
  const fields: { key: keyof PostStats; label: string }[] = [
    { key: "impressions", label: "impressions" },
    { key: "reactions", label: "reactions" },
    { key: "comments", label: "comments" },
    { key: "replies", label: "replies" },
  ];
  const summary = fields
    .filter((f) => typeof s[f.key] === "number")
    .map((f) => `${s[f.key]} ${f.label}`)
    .join(" · ");
  return (
    <details className="wf-muse-stats">
      <summary>{summary || "add stats"}</summary>
      <form action={savePostStatsFromForm} className="wf-muse-stats-form">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="slug" value={row.slug} />
        {fields.map((f) => (
          <label key={f.key} className="wf-muse-stats-field">
            <span>{f.label}</span>
            <input
              type="number"
              name={f.key}
              min={0}
              defaultValue={
                typeof s[f.key] === "number" ? String(s[f.key]) : ""
              }
              placeholder="—"
            />
          </label>
        ))}
        <button className="act sm" type="submit">
          save
        </button>
      </form>
    </details>
  );
}

export function MusePublishedPanel({ rows }: { rows: PublishedRow[] }) {
  if (rows.length === 0) {
    return <p className="wf-of-mini-empty">nothing published yet.</p>;
  }
  return (
    <ul className="wf-muse-published">
      {rows.map((r) => (
        <li key={r.id} className="wf-muse-pub-row">
          <div className="wf-muse-pub-main">
            <span className={`wf-chip sm is-${r.channel}`}>{r.channel}</span>
            <span className="wf-muse-pub-line" title={r.firstLine}>
              {r.firstLine}
            </span>
          </div>
          <div className="wf-muse-pub-meta">
            <span className="wf-muse-pub-date mono">{r.date}</span>
            <span className={`wf-muse-pub-status is-${r.status}`}>
              {STATUS_LABEL[r.status]}
            </span>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="wf-of-link"
              >
                view →
              </a>
            )}
            {r.status === "approved_manual" && (
              <form action={markPostPostedFromForm}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="slug" value={r.slug} />
                <button className="act sm" type="submit">
                  posted
                </button>
              </form>
            )}
          </div>
          <StatsForm row={r} />
        </li>
      ))}
    </ul>
  );
}
