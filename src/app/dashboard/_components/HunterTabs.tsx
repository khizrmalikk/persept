"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hunter's real pages (routes, not tabs): the chat workspace, the campaigns board
// and the prospects list. This segmented control links between them and marks the
// active one from the URL. Rendered at the top of each page.
export function HunterTabs({ handoffCount = 0 }: { handoffCount?: number }) {
  const p = usePathname();
  const base = "/dashboard/agents/hunter";
  const onCampaigns = p.startsWith(`${base}/campaigns`);
  const onProspects = p.startsWith(`${base}/prospects`);
  const onConversations = p.startsWith(`${base}/conversations`);
  const onChat = !onCampaigns && !onProspects && !onConversations;
  const tabs = [
    { href: base, label: "chat", active: onChat },
    { href: `${base}/campaigns`, label: "campaigns", active: onCampaigns },
    { href: `${base}/prospects`, label: "prospects", active: onProspects },
    {
      href: `${base}/conversations`,
      label: "conversations",
      active: onConversations,
    },
    // approvals already has its own page — just link to it
    { href: "/dashboard/approvals", label: "approvals", active: false },
  ];
  return (
    <nav className="wf-hub-tabs" aria-label="hunter">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`wf-hub-tab${t.active ? " is-active" : ""}`}
          aria-current={t.active ? "page" : undefined}
        >
          {t.label}
          {t.label === "chat" && handoffCount > 0 && (
            <span className="wf-hub-tab-badge">{handoffCount}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
