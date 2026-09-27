import Link from "next/link";
import { notFound } from "next/navigation";
import { HunterTabs } from "@/app/dashboard/_components/HunterTabs";
import { Conversations } from "@/app/dashboard/_components/panels/Conversations";
import { dueState } from "@/app/dashboard/_components/panels/dates";
import {
  PipelineTable,
  type ProspectRow,
} from "@/app/dashboard/_components/panels/PipelineTable";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import {
  type CampaignAsset,
  getCampaign,
  getHandoffs,
  getMessages,
  getOpenHandoffCount,
  groupThreads,
  slugify,
} from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function Asset({ asset }: { asset: CampaignAsset }) {
  const { url, type, title, use } = asset;
  let media: React.ReactNode;
  if (type === "video") {
    const yt = youtubeId(url);
    const vm = vimeoId(url);
    if (yt)
      media = (
        <iframe
          className="wf-cv-asset-embed"
          src={`https://www.youtube.com/embed/${yt}`}
          title={title || "video"}
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    else if (vm)
      media = (
        <iframe
          className="wf-cv-asset-embed"
          src={`https://player.vimeo.com/video/${vm}`}
          title={title || "video"}
          allowFullScreen
        />
      );
    else if (/\.mp4($|\?)/i.test(url))
      media = (
        // biome-ignore lint/a11y/useMediaCaption: owner-supplied asset, no captions
        <video
          className="wf-cv-asset-embed"
          src={url}
          controls
          preload="metadata"
        />
      );
  } else if (type === "image") {
    // biome-ignore lint/performance/noImgElement: arbitrary external asset URL
    media = <img className="wf-cv-asset-img" src={url} alt={title || ""} />;
  }
  return (
    <li className="wf-cv-asset">
      {media ?? (
        <a
          className="wf-cv-asset-link"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {url}
        </a>
      )}
      <div className="wf-cv-asset-meta">
        <span className="wf-chip sm">{type}</span>
        <span className="wf-cv-asset-title">{title || "untitled"}</span>
      </div>
      {use && <p className="wf-cv-asset-use">{use}</p>}
    </li>
  );
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [messages, handoffsOpen, prospectsFile, handoffCount] =
    await Promise.all([
      getMessages("hunter"),
      getHandoffs("hunter", ["open"]),
      getAgentFile("hunter", "PROSPECTS.md"),
      getOpenHandoffCount("hunter"),
    ]);

  const slug = slugify(campaign.name);
  const allRows = parseMarkdownTable(prospectsFile?.content)
    .rows as ProspectRow[];
  const rows = allRows.filter((r) => (r.campaign ?? "").trim() === slug);
  const dueOf: Record<string, ReturnType<typeof dueState>> = {};
  for (const r of rows) dueOf[r.company] = dueState(r.next_due);

  const campMsgs = messages.filter((m) => m.campaign_id === campaign.id);
  const threads = groupThreads(campMsgs);
  const sent = campMsgs.filter((m) => m.direction === "out").length;
  const replies = campMsgs.filter((m) => m.direction === "in").length;
  const handoffs = handoffsOpen.filter((h) =>
    rows.some(
      (r) =>
        (r.company ?? "").toLowerCase() === (h.company ?? "").toLowerCase(),
    ),
  ).length;

  const editHref = `/dashboard/agents/hunter/campaigns/${campaign.id}/edit`;

  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-head">
        <HunterTabs handoffCount={handoffCount} />
      </div>
      <div className="wf-hub-scroll">
        <div className="wf-cv">
          <header className="wf-cv-head">
            <Link href="/dashboard/agents/hunter/campaigns" className="wf-back">
              ← campaigns
            </Link>
            <div className="wf-cv-title-row">
              <h1 className="wf-cv-title">{campaign.name}</h1>
              <span className={`wf-campaign-status is-${campaign.status}`}>
                {campaign.status}
              </span>
              <Link href={editHref} className="act secondary wf-cv-edit">
                edit
              </Link>
            </div>
            {campaign.goal && <p className="wf-cv-goal">{campaign.goal}</p>}
          </header>

          <div className="wf-cv-cards">
            <section className="wf-of-panel">
              <div className="wf-of-panel-head">
                <h2>brief</h2>
              </div>
              <div className="wf-of-panel-body wf-cv-brief">
                <Field label="who we're contacting" value={campaign.audience} />
                <Field label="what we're offering" value={campaign.offer} />
                <Field
                  label="instructions for hunter"
                  value={campaign.description}
                />
              </div>
            </section>

            <section className="wf-of-panel">
              <div className="wf-of-panel-head">
                <h2>rules</h2>
              </div>
              <div className="wf-of-panel-body wf-cv-rules">
                <div className="wf-cv-chips">
                  {campaign.rules.channels.map((ch) => (
                    <span key={ch} className="wf-chip sm">
                      {ch}
                    </span>
                  ))}
                </div>
                <Field
                  label="daily cap"
                  value={String(campaign.rules.daily_cap)}
                />
                <Field
                  label="follow-up days"
                  value={campaign.rules.follow_up_days.join(", ")}
                />
              </div>
            </section>

            <section className="wf-of-panel">
              <div className="wf-of-panel-head">
                <h2>numbers</h2>
              </div>
              <div className="wf-of-panel-body">
                <dl className="wf-campaign-counts wf-cv-counts">
                  <div>
                    <dt>sent</dt>
                    <dd className="mono">{sent}</dd>
                  </div>
                  <div>
                    <dt>replies</dt>
                    <dd className="mono">{replies}</dd>
                  </div>
                  <div>
                    <dt>hand-offs</dt>
                    <dd className="mono">{handoffs}</dd>
                  </div>
                  <div>
                    <dt>prospects</dt>
                    <dd className="mono">{rows.length}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>

          {campaign.assets.length > 0 && (
            <section className="wf-of-panel">
              <div className="wf-of-panel-head">
                <h2>
                  assets
                  <span className="wf-of-panel-count">
                    {campaign.assets.length}
                  </span>
                </h2>
              </div>
              <div className="wf-of-panel-body">
                <ul className="wf-cv-assets">
                  {campaign.assets.map((a, i) => (
                    <Asset key={`${a.url}-${i}`} asset={a} />
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="wf-of-panel">
            <div className="wf-of-panel-head">
              <h2>
                prospects
                {rows.length > 0 && (
                  <span className="wf-of-panel-count">{rows.length}</span>
                )}
              </h2>
            </div>
            <div className="wf-of-panel-body">
              {rows.length > 0 ? (
                <PipelineTable rows={rows} dueOf={dueOf} />
              ) : (
                <p className="wf-of-mini-empty">
                  no prospects tagged <span className="mono">{slug}</span> yet.
                  add some from the editor.
                </p>
              )}
            </div>
          </section>

          <section className="wf-of-panel">
            <div className="wf-of-panel-head">
              <h2>conversations</h2>
            </div>
            <div className="wf-of-panel-body">
              <Conversations threads={threads} handedOff={new Set<string>()} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="wf-cv-field">
      <dt>{label}</dt>
      <dd>{value || <span className="wf-of-mini-empty">—</span>}</dd>
    </div>
  );
}
