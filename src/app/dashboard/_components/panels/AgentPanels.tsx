import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getDoneBacklog,
  getOpenBacklog,
  parseHealth,
} from "@/lib/workforce/backlog";
import {
  averageDraftMinutes,
  type CopyRequest,
  getCopyRequests,
} from "@/lib/workforce/copy";
import {
  getAgentFile,
  listAgentFiles,
  parseMarkdownTable,
} from "@/lib/workforce/files";
import {
  getActiveIdeas,
  getDecidedIdeas,
  getEscalatedApprovalMap,
} from "@/lib/workforce/ideas";
import { getKnowledgeForAgent } from "@/lib/workforce/knowledge";
import { getHandledLeads, getSuggestedLeads } from "@/lib/workforce/leads";
import {
  getCampaigns,
  getCandidateDomains,
  getPostCountsByCampaign,
  hostFromUrl,
  slugify,
} from "@/lib/workforce/outreach";
import { getPosts, matchPostFile, parseMusePost } from "@/lib/workforce/posts";
import { getProposals } from "@/lib/workforce/proposals";
import {
  type Agent,
  type Approval,
  ago,
  type WfEvent,
  when,
} from "@/lib/workforce/types";
import { CopyPanel } from "../CopyPanel";
import { IdeasPanel, type IdeaVM } from "../IdeasPanel";
import { BacklogPanel } from "./BacklogPanel";
import { DigestArchive } from "./DigestArchive";
import { dueState, today } from "./dates";
import { type Digest, parseDigest } from "./digest";
import { HealthStrip } from "./HealthStrip";
import { HudPanel } from "./HudPanel";
import { LatestDigest } from "./LatestDigest";
import { LeadsPanel } from "./LeadsPanel";
import { MemoryPanel } from "./MemoryPanel";
import { type MuseDraft, MuseDraftsPanel } from "./MuseDraftsPanel";
import { MusePublishedPanel, type PublishedRow } from "./MusePublishedPanel";
import { MuseSetupHelp } from "./MuseSetupHelp";
import { MuseWeekPanel, type PlanRow } from "./MuseWeekPanel";
import { OfferPanel } from "./OfferPanel";
import { PipelineSummary } from "./PipelineSummary";
import { PipelineTable, type ProspectRow } from "./PipelineTable";
import { ProposalsPanel } from "./ProposalsPanel";
import { type Review, ReviewsPanel } from "./ReviewsPanel";
import { ScribeLessonsPanel } from "./ScribeLessonsPanel";
import { SourcesPanel } from "./SourcesPanel";
import { StatePanel } from "./StatePanel";
import { TodayLog } from "./TodayLog";
import { TodaysBrief } from "./TodaysBrief";
import { WorkersPanel } from "./WorkersPanel";

// Agent-specific panel section for the detail page. Dispatches on agent.id, fetches
// each panel set's files server-side (read-only via files.ts / supabaseAdmin), and
// hands parsed/serializable data to the client children. Unknown agents get the
// generic panels only. Every panel renders its own honest empty state.
//
// Layout: panels tile in a responsive bento grid (.wf-panels). Each panel is wrapped
// in a grid cell so we can control its span WITHOUT touching the panel's own logic —
// content-heavy panels get .wf-cell-wide (span the full grid row); compact panels get
// .wf-cell (one auto-fit column). The wide/narrow choice lives here, at the layout
// boundary, so the panel components stay purely presentational.

import type { ReactNode } from "react";

// One bento cell. `wide` makes it span the full grid width (grid-column: 1 / -1).
function Cell({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "wf-cell wf-cell-wide" : "wf-cell"}>{children}</div>
  );
}

type Due = "overdue" | "today" | "future" | "";

async function HunterPanels({ agentId }: { agentId: string }) {
  const [file, copy] = await Promise.all([
    getAgentFile(agentId, "PROSPECTS.md"),
    getCopyRequests(agentId, "for"),
  ]);
  const table = parseMarkdownTable(file?.content);
  const rows = table.rows as ProspectRow[];
  const dueOf: Record<string, Due> = {};
  for (const r of rows) dueOf[r.company] = dueState(r.next_due);
  return (
    <>
      <Cell>
        <PipelineSummary table={table} fileContent={file?.content ?? null} />
      </Cell>
      {rows.length ? (
        <Cell wide>
          <HudPanel title="prospects" right={`${rows.length} rows`}>
            <PipelineTable rows={rows} dueOf={dueOf} />
          </HudPanel>
        </Cell>
      ) : null}
      <Cell wide>
        <OfferPanel agentId={agentId} />
      </Cell>
      <CopyCell requests={copy} />
    </>
  );
}

// The "copy" panel (Hunter / Muse / Scribe): requests to Scribe with status,
// approval links and a resend for anything stuck writing. `nowMs` is stamped on
// the server so the 15-min "stuck" check can't cause a hydration mismatch.
function CopyCell({
  requests,
  right,
}: {
  requests: CopyRequest[];
  right?: string;
}) {
  return (
    <Cell wide>
      <HudPanel
        title="copy"
        right={right ?? (requests.length ? `${requests.length}` : undefined)}
      >
        <CopyPanel requests={requests} nowMs={Date.now()} />
      </HudPanel>
    </Cell>
  );
}

async function ScoutPanels({
  agentId,
  museEnabled,
}: {
  agentId: string;
  museEnabled: boolean;
}) {
  const [files, suggested, handled, candidateDomains] = await Promise.all([
    listAgentFiles(agentId, "memory/digests/"),
    getSuggestedLeads(),
    getHandledLeads(20),
    getCandidateDomains(),
  ]);
  const parsed: Digest[] = files.map((f) => parseDigest(f.path, f.content));
  const latest = parsed[0] ?? null;
  const archive = parsed.slice(1, 7); // previous six
  // companies with a suggested lead → digest sales items that name one get a chip
  const leadCompanies = suggested.map((l) => l.company).filter(Boolean);
  // leads whose website domain matches a candidate row came from the morning search
  const fromCandidateIds = suggested
    .filter((l) => {
      const d = hostFromUrl(l.website);
      return d !== "" && candidateDomains.has(d);
    })
    .map((l) => l.id);
  return (
    <>
      <Cell wide>
        {/* anchor target for the digest "in leads" chips */}
        <div id="wf-leads-anchor">
          <HudPanel
            title="leads"
            right={suggested.length ? `${suggested.length} new` : undefined}
          >
            <LeadsPanel
              suggested={suggested}
              handled={handled}
              fromCandidateIds={fromCandidateIds}
            />
          </HudPanel>
        </div>
      </Cell>
      <Cell wide>
        <LatestDigest
          digest={latest}
          museEnabled={museEnabled}
          leadCompanies={leadCompanies}
        />
      </Cell>
      <Cell wide>
        <HudPanel title="digest archive" right="last 6">
          <DigestArchive
            digests={archive}
            museEnabled={museEnabled}
            leadCompanies={leadCompanies}
          />
        </HudPanel>
      </Cell>
      <Cell>
        <SourcesPanel agentId={agentId} />
      </Cell>
    </>
  );
}

async function ScribePanels({ agentId }: { agentId: string }) {
  const [proposals, knowledge, copy] = await Promise.all([
    getProposals(agentId),
    getKnowledgeForAgent(agentId, 3),
    getCopyRequests(agentId, "writer"),
  ]);
  const avgMin = averageDraftMinutes(copy);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return (
    <>
      <Cell wide>
        <HudPanel
          title="proposals"
          right={proposals.length ? `${proposals.length}` : undefined}
        >
          <ProposalsPanel proposals={proposals} siteUrl={siteUrl} />
        </HudPanel>
      </Cell>
      <Cell>
        <HudPanel
          title="knowledge"
          right={
            <Link href="/dashboard/knowledge" className="wf-hn-link">
              {knowledge.count ? `${knowledge.count} files` : "manage"} →
            </Link>
          }
        >
          {knowledge.files.length === 0 ? (
            <div className="wf-hn-empty">
              no files yet. add reference material on the knowledge page.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {knowledge.files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    padding: "4px 0",
                  }}
                >
                  <span style={{ color: "var(--ink-faint)" }}>▤</span>
                  <span>{f.title}</span>
                </div>
              ))}
            </div>
          )}
        </HudPanel>
      </Cell>
      <CopyCell
        requests={copy}
        right={avgMin != null ? `avg ${avgMin} min to draft` : undefined}
      />
      <Cell wide>
        <ScribeLessonsPanel agentId={agentId} />
      </Cell>
    </>
  );
}

async function MusePanels({ agentId }: { agentId: string }) {
  const [
    planFiles,
    postFiles,
    posts,
    { data: apRows },
    copy,
    campaigns,
    postCounts,
  ] = await Promise.all([
    listAgentFiles(agentId, "plan/"),
    listAgentFiles(agentId, "posts/"),
    getPosts(agentId),
    supabaseAdmin()
      .from("approvals")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "pending")
      .order("ts", { ascending: true }),
    getCopyRequests(agentId, "for"),
    getCampaigns(agentId),
    getPostCountsByCampaign(),
  ]);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  // "This week" — the newest plan file (files sort desc by path), as a table.
  const planFile = planFiles[0] ?? null;
  const planTable = parseMarkdownTable(planFile?.content);
  const planRows: PlanRow[] = planTable.rows.map((r) => ({
    day: r.day ?? r.date ?? "",
    channel: r.channel ?? "",
    angle: r.angle ?? r.idea ?? r.topic ?? "",
    source: r.source ?? r.from ?? "",
  }));

  // Match a draft / post body to its posts/*.md file for the slug + image brief.
  const files = postFiles.map((f) => ({ path: f.path, content: f.content }));

  // "Drafts" — pending Muse approvals, flattened into post cards.
  const approvals = (apRows as Approval[] | null) ?? [];
  const drafts: MuseDraft[] = approvals.map((ap) => {
    const parsed = parseMusePost(ap.draft) ?? {
      channel: "linkedin" as const,
      image: null,
      comment: null,
      body: ap.draft ?? "",
    };
    const matched = matchPostFile(parsed.body, files);
    return {
      approvalId: ap.id,
      agentId,
      channel: parsed.channel,
      body: parsed.body,
      image: parsed.image ?? matched?.image ?? null,
      comment: parsed.comment,
      slug: matched?.slug ?? null,
      imageBrief: matched?.image_brief ?? null,
      action: ap.action,
      ago: ago(ap.ts),
    };
  });

  // "Published" — rows from the posts table.
  const published: PublishedRow[] = posts.map((p) => {
    const firstLine =
      p.text
        .split("\n")
        .find((l) => l.trim() !== "")
        ?.trim() ?? "(no text)";
    return {
      id: p.id,
      channel: p.channel,
      firstLine,
      date: when(p.published_at ?? p.ts),
      url: p.url,
      status: p.status,
      slug: matchPostFile(p.text, files)?.slug ?? "",
      stats: p.stats,
    };
  });

  return (
    <>
      <Cell wide>
        <HudPanel
          title="campaigns"
          right={
            <Link
              href="/dashboard/agents/hunter/campaigns/new?owner=muse"
              className="wf-hn-link"
            >
              new campaign →
            </Link>
          }
        >
          {activeCampaigns.length === 0 ? (
            <div className="wf-hn-empty">
              no active campaigns. start one and its platforms and posts show
              here.
            </div>
          ) : (
            <div className="wf-muse-camps">
              {activeCampaigns.map((c) => {
                const slug = slugify(c.name);
                const postCount =
                  postCounts[slug] ?? postCounts[c.name.toLowerCase()] ?? 0;
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/agents/hunter/campaigns/${c.id}`}
                    className="wf-muse-camp"
                  >
                    <div className="wf-muse-camp-top">
                      <span className="wf-muse-camp-name">{c.name}</span>
                      <span className="wf-muse-camp-posts">
                        {postCount} post{postCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="wf-hn-camp-chips">
                      {c.rules.platforms.length === 0 ? (
                        <span className="wf-hn-note">no platforms yet</span>
                      ) : (
                        c.rules.platforms.map((p) => (
                          <span key={p} className="wf-chip-mono">
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </HudPanel>
      </Cell>
      <Cell wide>
        <HudPanel
          title="this week"
          right={
            <span className="wf-muse-head-right">
              {planRows.length ? `${planRows.length} planned` : null}
              <MuseSetupHelp />
            </span>
          }
        >
          <MuseWeekPanel rows={planRows} planText={planFile?.content ?? ""} />
        </HudPanel>
      </Cell>
      <Cell wide>
        <HudPanel
          title="drafts"
          right={drafts.length ? `${drafts.length} waiting` : undefined}
        >
          <MuseDraftsPanel drafts={drafts} />
        </HudPanel>
      </Cell>
      <Cell wide>
        <HudPanel
          title="published"
          right={published.length ? `${published.length}` : undefined}
        >
          <MusePublishedPanel rows={published} />
        </HudPanel>
      </Cell>
      <CopyCell requests={copy} />
    </>
  );
}

async function ChiefPanels({
  agentId,
  agents,
}: {
  agentId: string;
  agents: Agent[];
}) {
  const [
    { data },
    stateFile,
    reviewFiles,
    openItems,
    doneItems,
    activeIdeas,
    decidedIdeas,
  ] = await Promise.all([
    supabaseAdmin()
      .from("events")
      .select("*")
      .eq("agent_id", agentId)
      .eq("kind", "message")
      .order("ts", { ascending: false })
      .limit(60),
    getAgentFile(agentId, "STATE.md"),
    listAgentFiles(agentId, "improvements/"),
    getOpenBacklog(),
    getDoneBacklog(20),
    getActiveIdeas(),
    getDecidedIdeas(20),
  ]);
  const events = (data as WfEvent[] | null) ?? [];
  const t = today();

  // Escalated ideas → the open approval Chief raised for each (matched by short_id).
  const escalatedShortIds = activeIdeas
    .filter((i) => i.status === "escalated")
    .map((i) => i.short_id);
  const approvalByShortId = await getEscalatedApprovalMap(escalatedShortIds);
  const ideaVMs: IdeaVM[] = activeIdeas.map((i) => ({
    ...i,
    approvalId:
      i.status === "escalated" ? (approvalByShortId[i.short_id] ?? null) : null,
  }));

  // Health: the "## Health" lines from STATE.md (empty = all clear).
  const health = parseHealth(stateFile?.content);

  // Weekly reviews: improvements/YYYY-MM-DD.md, newest first (listAgentFiles sorts
  // path desc). Proposals = open backlog items titled "workforce: …".
  const reviews: Review[] = reviewFiles.map((f) => ({
    date:
      f.path.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ??
      f.path.split("/").pop()?.replace(/\.md$/i, "") ??
      "review",
    markdown: f.content,
  }));
  const proposals = openItems.filter((i) => /^workforce:/i.test(i.title));

  const isAssistantMsg = (e: WfEvent) =>
    (e.payload as { role?: string } | null)?.role !== "user" &&
    !(e.summary ?? "").startsWith("owner");

  // Latest assistant "good morning" from chief, only if it's from today (Dubai).
  const briefText = (() => {
    for (const e of events) {
      const p = (e.payload ?? {}) as { role?: string; text?: string };
      const text = p.text ?? e.summary ?? "";
      if (!isAssistantMsg(e)) continue;
      if (!/^\s*good morning/i.test(text)) continue;
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
      }).format(new Date(e.ts));
      return day === t ? text : null;
    }
    return null;
  })();

  // Evening note: latest assistant message that opens "end of day" or mentions
  // "still waiting on you".
  const eveningNote = (() => {
    for (const e of events) {
      const p = (e.payload ?? {}) as { role?: string; text?: string };
      const text = p.text ?? e.summary ?? "";
      if (!isAssistantMsg(e)) continue;
      if (/^\s*end of day/i.test(text) || /still waiting on you/i.test(text))
        return text;
    }
    return null;
  })();

  const handOpts = agents.map((a) => ({
    id: a.id,
    emoji: a.emoji ?? "◆",
    name: a.name ?? a.id,
  }));

  return (
    <>
      <Cell wide>
        <TodaysBrief text={briefText} eveningNote={eveningNote} />
      </Cell>
      <Cell wide>
        <div id="wf-ideas">
          <HudPanel
            title="ideas from the team"
            right={ideaVMs.length ? `${ideaVMs.length} waiting` : undefined}
          >
            <IdeasPanel active={ideaVMs} decided={decidedIdeas} />
          </HudPanel>
        </div>
      </Cell>
      <Cell wide>
        <HudPanel
          title="weekly review"
          right={reviews.length ? reviews[0].date : undefined}
        >
          <ReviewsPanel reviews={reviews} proposals={proposals} />
        </HudPanel>
      </Cell>
      <Cell wide>
        <div id="wf-backlog">
          <HudPanel title="backlog" right={`${openItems.length} open`}>
            <BacklogPanel
              items={openItems}
              done={doneItems}
              agents={handOpts}
            />
          </HudPanel>
        </div>
      </Cell>
      <Cell wide>
        <HudPanel
          title="health"
          right={health.length ? `${health.length}` : "all clear"}
        >
          <HealthStrip lines={health} />
        </HudPanel>
      </Cell>
      <Cell wide>
        <HudPanel title="state" right="live">
          <StatePanel
            content={stateFile?.content ?? null}
            updatedAt={stateFile?.updated_at ?? null}
            agents={agents}
          />
        </HudPanel>
      </Cell>
    </>
  );
}

export async function AgentPanels({
  agent,
  agents,
  museEnabled,
}: {
  agent: Agent;
  agents: Agent[];
  museEnabled: boolean;
}) {
  const id = agent.id;
  return (
    <section className="wf-panels">
      {id === "hunter" ? <HunterPanels agentId={id} /> : null}
      {id === "scout" ? (
        <ScoutPanels agentId={id} museEnabled={museEnabled} />
      ) : null}
      {id === "chief" ? <ChiefPanels agentId={id} agents={agents} /> : null}
      {id === "scribe" ? <ScribePanels agentId={id} /> : null}
      {id === "muse" ? <MusePanels agentId={id} /> : null}
      {/* background workers — every agent, directly under its own panels */}
      <Cell>
        <WorkersPanel agentId={id} />
      </Cell>
      {/* generic — every agent (compact, one per column) */}
      <Cell>
        <MemoryPanel agentId={id} />
      </Cell>
      <Cell>
        <TodayLog agentId={id} />
      </Cell>
    </section>
  );
}
