"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PerseptMark } from "@/components/ui/logo";
import { agentColor, type SidebarAgent } from "@/lib/workforce/roster";

// The left sidebar (236px): logo, workspace nav, the six agents with live status,
// and a footer card (system health + GST clock + operator + sign out). Client
// component so it can highlight the active route (usePathname) and tick the clock.

const NAV = [
  { key: "office", label: "office", glyph: "◰", href: "/dashboard" },
  {
    key: "approvals",
    label: "approvals",
    glyph: "✓",
    href: "/dashboard/approvals",
  },
  {
    key: "activity",
    label: "activity",
    glyph: "≡",
    href: "/dashboard/activity",
  },
  {
    key: "insights",
    label: "insights",
    glyph: "◔",
    href: "/dashboard/insights",
  },
  {
    key: "knowledge",
    label: "knowledge",
    glyph: "▤",
    href: "/dashboard/knowledge",
  },
];

function gst(now: Date): string {
  const g = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  return g.toTimeString().slice(0, 8);
}

export function Sidebar({
  agents,
  pending,
  operator,
  signOut,
}: {
  agents: SidebarAgent[];
  pending: number;
  operator: string;
  signOut: () => void | Promise<void>;
}) {
  const pathname = usePathname() ?? "";
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    setClock(gst(new Date()));
    const iv = setInterval(() => setClock(gst(new Date())), 1000);
    return () => clearInterval(iv);
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="wf-sb">
      <Link href="/dashboard" className="wf-sb-brand">
        <PerseptMark size={20} />
        <span className="wf-sb-word">Persept</span>
        <span className="wf-sb-sub">/ workforce</span>
      </Link>

      <nav className="wf-sb-group" aria-label="workspace">
        <div className="wf-sb-label">workspace</div>
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className={`wf-sb-item${isActive(n.href) ? " is-active" : ""}`}
          >
            <span className="wf-sb-glyph">{n.glyph}</span>
            <span className="wf-sb-item-label">{n.label}</span>
            {n.key === "approvals" && pending > 0 && (
              <span className="wf-sb-badge">{pending}</span>
            )}
          </Link>
        ))}
      </nav>

      <nav className="wf-sb-group" aria-label="agents">
        <div className="wf-sb-label">agents</div>
        {agents.map((a) => {
          const active = pathname.startsWith(`/dashboard/agents/${a.id}`);
          const c = agentColor(hueOf(a.id));
          const dot =
            a.status === "working"
              ? c
              : a.status === "waiting"
                ? "var(--accent)"
                : a.status === "soon"
                  ? "transparent"
                  : "#4a4640";
          const sub =
            a.status === "soon"
              ? "not deployed"
              : a.workers
                ? `${a.status} · ${a.workers} worker${a.workers > 1 ? "s" : ""}`
                : `${a.status} · ${a.role}`;
          return (
            <Link
              key={a.id}
              href={a.href}
              className={`wf-sb-agent${active ? " is-active" : ""}${a.status === "soon" ? " is-soon" : ""}`}
            >
              <span
                className="wf-sb-tile"
                style={{
                  background: agentColor(hueOf(a.id), 0.14),
                  boxShadow: `inset 0 0 0 1px ${agentColor(hueOf(a.id), 0.3)}`,
                }}
              >
                {a.emoji}
              </span>
              <span className="wf-sb-agent-main">
                <span className="wf-sb-agent-name">{a.name}</span>
                <span className="wf-sb-agent-sub">{sub}</span>
              </span>
              <span
                className="wf-sb-dot"
                style={{
                  background: dot,
                  boxShadow: a.status === "working" ? `0 0 8px ${c}` : "none",
                }}
              />
            </Link>
          );
        })}
      </nav>

      <div className="wf-sb-spacer" />

      <div className="wf-sb-foot">
        <div className="wf-sb-foot-row">
          <span className="wf-sb-ok-dot" />
          <span>system healthy</span>
          <span className="wf-sb-foot-clock">{clock}</span>
        </div>
        <div className="wf-sb-foot-sync">bridge live · synced 6s ago</div>
        <div className="wf-sb-user">
          <span className="wf-sb-avatar">
            {(operator[0] ?? "k").toUpperCase()}
          </span>
          <span className="wf-sb-user-name">{operator}</span>
          <form action={signOut}>
            <button type="submit" className="wf-sb-signout">
              sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

// hue lookup kept local to avoid importing the full roster map into the client
const HUE: Record<string, number> = {
  chief: 70,
  scout: 20,
  hunter: 150,
  scribe: 220,
  muse: 110,
  fixer: 290,
};
const hueOf = (id: string) => HUE[id] ?? 70;
