"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom tab bar (< 768px): office · approvals (amber count badge) · chat.
// Navigates by route (same routes as desktop). Active from usePathname.

export function MobileTabBar({
  pending,
  chatHref,
}: {
  pending: number;
  chatHref: string;
}) {
  const path = usePathname() ?? "";
  const office = path === "/dashboard";
  const approvals = path.startsWith("/dashboard/approvals");
  const chat = path.startsWith("/dashboard/agents");
  return (
    <nav className="wf-mtab" aria-label="sections">
      <Link
        href="/dashboard"
        className={`wf-mtab-btn${office ? " is-active" : ""}`}
        aria-current={office ? "page" : undefined}
      >
        <span className="wf-mtab-ico wf-mtab-grid" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>office</span>
      </Link>
      <Link
        href="/dashboard/approvals"
        className={`wf-mtab-btn${approvals ? " is-active" : ""}`}
        aria-current={approvals ? "page" : undefined}
      >
        <span className="wf-mtab-ico wf-mtab-box" aria-hidden="true">
          {pending > 0 && <span className="wf-mtab-badge">{pending}</span>}
        </span>
        <span>approvals</span>
      </Link>
      <Link
        href={chatHref}
        className={`wf-mtab-btn${chat ? " is-active" : ""}`}
        aria-current={chat ? "page" : undefined}
      >
        <span className="wf-mtab-ico wf-mtab-bubble" aria-hidden="true" />
        <span>chat</span>
      </Link>
    </nav>
  );
}
