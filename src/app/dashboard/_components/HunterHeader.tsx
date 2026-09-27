"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hunter workspace header: identity (green hue 150) + a stat row + the tabs
// (chat · prospects · conversations · approvals · campaigns), underlined in
// Hunter green, with an amber approvals badge. Shared across every hunter route.

export type HunterStats = {
  prospects: number;
  replied: number;
  handoffs: number;
  waiting: number;
  workers: number;
};

const BASE = "/dashboard/agents/hunter";

export function HunterHeader({
  stats,
  pending,
}: {
  stats: HunterStats;
  pending: number;
}) {
  const p = usePathname() ?? "";
  const working = stats.workers > 0;
  const statusLine = working
    ? `working · ${stats.workers} worker${stats.workers > 1 ? "s" : ""}`
    : "idle";

  const onCampaigns = p.startsWith(`${BASE}/campaigns`);
  const onProspects = p.startsWith(`${BASE}/prospects`);
  const onConvos = p.startsWith(`${BASE}/conversations`);
  const onApprovals = p.startsWith(`${BASE}/approvals`);
  const onChat = !onCampaigns && !onProspects && !onConvos && !onApprovals;

  const tabs: {
    label: string;
    href: string;
    active: boolean;
    badge?: number;
  }[] = [
    { label: "chat", href: BASE, active: onChat },
    { label: "prospects", href: `${BASE}/prospects`, active: onProspects },
    {
      label: "conversations",
      href: `${BASE}/conversations`,
      active: onConvos,
    },
    {
      label: "approvals",
      href: `${BASE}/approvals`,
      active: onApprovals,
      badge: pending || undefined,
    },
    { label: "campaigns", href: `${BASE}/campaigns`, active: onCampaigns },
  ];

  const statRow: [string, number, boolean][] = [
    ["prospects", stats.prospects, false],
    ["replied", stats.replied, false],
    ["hand-offs", stats.handoffs, false],
    ["waiting on you", stats.waiting, stats.waiting > 0],
    ["workers", stats.workers, false],
  ];

  return (
    <header className="wf-hn-head">
      <div className="wf-hn-id">
        <span className={`wf-hn-avatar${working ? " is-working" : ""}`}>
          🎯
        </span>
        <div className="wf-hn-idmain">
          <div className="wf-hn-idrow">
            <h1 className="wf-hn-name">Hunter</h1>
            <span className="wf-hn-status">
              <span className="dot" />
              {statusLine}
            </span>
            <span className="wf-hn-room">outreach &amp; sales</span>
          </div>
          <div className="wf-hn-tagline">
            the one who does outreach. drafts first touches and follow-ups,
            reads replies, hands off the hot ones.
          </div>
        </div>
        <div className="wf-hn-stats">
          {statRow.map(([k, v, amber]) => (
            <div key={k}>
              <div
                className="wf-hn-stat-v"
                style={amber ? { color: "var(--accent)" } : undefined}
              >
                {v}
              </div>
              <div className="wf-hn-stat-k">{k}</div>
            </div>
          ))}
        </div>
      </div>
      <nav className="wf-hn-tabs" aria-label="hunter">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`wf-hn-tab${t.active ? " is-active" : ""}`}
            aria-current={t.active ? "page" : undefined}
          >
            {t.label}
            {t.badge ? (
              <span className="wf-hn-tab-badge">{t.badge}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </header>
  );
}
