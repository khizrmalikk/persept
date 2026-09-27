import Link from "next/link";
import { notFound } from "next/navigation";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { dueState } from "@/app/dashboard/_components/panels/dates";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import {
  getCampaign,
  getHandoffs,
  getMessages,
  slugify,
} from "@/lib/workforce/outreach";
import { getHunterHeaderStats } from "../../_data";
import "../../../../hunter.css";

export const dynamic = "force-dynamic";

const HN = "oklch(0.78 0.12 150)";
const AMBER = "var(--accent)";
const RED = "var(--err)";
function stPill(status: string): { background: string; color: string } {
  if (status === "active")
    return { background: "oklch(0.78 0.12 150 / 0.16)", color: HN };
  if (status === "paused")
    return { background: "rgba(255,255,255,0.07)", color: "var(--ink-mut)" };
  return { background: "rgba(255,255,255,0.05)", color: "var(--ink-faint)" };
}
function dueBits(next: string | undefined): { label: string; color: string } {
  const s = dueState(next);
  if (!next) return { label: "—", color: "var(--ink-faint)" };
  if (s === "overdue") return { label: `${next}`, color: RED };
  if (s === "today") return { label: "today", color: AMBER };
  return { label: next, color: "var(--ink-faint)" };
}
function prospPill(status: string): { background: string; color: string } {
  const s = (status ?? "").toLowerCase();
  if (s.includes("repl"))
    return { background: "oklch(0.8 0.14 70 / 0.16)", color: AMBER };
  if (s.includes("hand"))
    return { background: "oklch(0.8 0.16 150 / 0.14)", color: "var(--ok)" };
  if (s.includes("draft"))
    return {
      background: "oklch(0.78 0.12 220 / 0.16)",
      color: "oklch(0.84 0.09 220)",
    };
  if (s.includes("approach"))
    return { background: "oklch(0.78 0.12 150 / 0.16)", color: HN };
  return { background: "rgba(255,255,255,0.07)", color: "var(--ink-soft)" };
}

export default async function CampaignViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ stats, pending }, campaign, messages, handoffsOpen, prospectsFile] =
    await Promise.all([
      getHunterHeaderStats(),
      getCampaign(id),
      getMessages("hunter"),
      getHandoffs("hunter", ["open"]),
      getAgentFile("hunter", "PROSPECTS.md"),
    ]);
  if (!campaign) notFound();

  const slug = slugify(campaign.name);
  const rows = parseMarkdownTable(prospectsFile?.content).rows.filter(
    (r) => (r.campaign ?? "").trim() === slug,
  );
  let sent = 0;
  let replies = 0;
  for (const m of messages)
    if (m.campaign_id === campaign.id) {
      if (m.direction === "out") sent++;
      else replies++;
    }
  const companies = new Set(rows.map((r) => (r.company ?? "").toLowerCase()));
  const handoffs = handoffsOpen.filter((h) =>
    companies.has((h.company ?? "").toLowerCase()),
  ).length;

  const brief: [string, string][] = [
    ["who we’re contacting", campaign.audience],
    ["what we’re offering", campaign.offer],
    ["goal", campaign.goal],
    ["instructions for hunter", campaign.description],
  ];
  const nums: [string, number][] = [
    ["sent", sent],
    ["replies", replies],
    ["hand-offs", handoffs],
    ["prospects", rows.length],
  ];

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Link href="../campaigns" className="wf-hn-back">
            ← campaigns
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
            }}
          >
            <h2 className="wf-hn-cv-title">{campaign.name}</h2>
            <span className="wf-hn-stpill" style={stPill(campaign.status)}>
              {campaign.status}
            </span>
          </div>
        </div>
        <Link href={`./${id}/edit`} className="wf-hn-btn ghost">
          edit
        </Link>
      </div>

      <div className="wf-hn-cv-grid">
        <div className="wf-hn-panel">
          <div className="wf-hn-panel-title">brief</div>
          {brief.map(([k, v]) => (
            <div key={k}>
              <div className="wf-hn-cv-k">{k}</div>
              <div className={`wf-hn-cv-v${v ? "" : " empty"}`}>{v || "—"}</div>
            </div>
          ))}
        </div>

        <div className="wf-hn-panel">
          <div className="wf-hn-panel-title">rules</div>
          <div className="wf-hn-camp-chips">
            {campaign.rules.channels.map((ch) => (
              <span key={ch} className="wf-chip-mono">
                {ch}
              </span>
            ))}
          </div>
          <div className="wf-hn-cv-rules">
            <span style={{ color: "var(--ink-faint)" }}>daily cap</span>
            <span>{campaign.rules.daily_cap} messages</span>
            <span style={{ color: "var(--ink-faint)" }}>follow-ups</span>
            <span>
              day {campaign.rules.follow_up_days[0] ?? 3} and day{" "}
              {campaign.rules.follow_up_days[1] ?? 7}
            </span>
          </div>
          <div className="wf-hn-panel-title" style={{ marginTop: 6 }}>
            assets
          </div>
          {campaign.assets.length === 0 ? (
            <div className="wf-hn-empty">no assets yet.</div>
          ) : (
            campaign.assets.map((a) => (
              <div
                key={a.url}
                style={{ fontSize: 13, display: "flex", gap: 8 }}
              >
                <span style={{ color: "var(--ink-faint)" }}>▤</span>
                <span>{a.title || a.url}</span>
              </div>
            ))
          )}
        </div>

        <div className="wf-hn-panel">
          <div className="wf-hn-panel-title">numbers</div>
          <div className="wf-hn-cv-nums">
            {nums.map(([k, v]) => (
              <div key={k}>
                <div className="wf-hn-cv-num-v">{v}</div>
                <div className="wf-hn-cv-num-k">{k}</div>
              </div>
            ))}
          </div>
          <div
            style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5 }}
          >
            numbers count prospects and messages tagged to this campaign.
          </div>
        </div>
      </div>

      <div className="wf-hn-panel">
        <div className="wf-hn-panel-title">prospects</div>
        {rows.length === 0 ? (
          <div className="wf-hn-empty">
            no prospects tagged {slug} yet. add some from the editor.
          </div>
        ) : (
          rows.map((p) => {
            const d = dueBits(p.next_due);
            return (
              <div
                key={p.company}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) 100px 90px",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: "1px solid var(--line-soft)",
                  fontSize: 13,
                  alignItems: "center",
                }}
              >
                <span>
                  <span style={{ fontWeight: 600 }}>{p.company}</span>{" "}
                  {p.contact && (
                    <span style={{ color: "var(--ink-faint)" }}>
                      · {p.contact}
                    </span>
                  )}
                </span>
                <span>
                  {p.status && (
                    <span className="wf-hn-stpill" style={prospPill(p.status)}>
                      {p.status.replace(/[_-]+/g, " ")}
                    </span>
                  )}
                </span>
                <span className="wf-hn-mono" style={{ color: d.color }}>
                  {d.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
