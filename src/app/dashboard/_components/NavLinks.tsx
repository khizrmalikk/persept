"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type NavAgent = { id: string; name: string; emoji: string | null };

// Agents-first top nav: `office` (carrying the pending-approvals count as a
// badge, since approvals now live on the office dash) then one tab per agent,
// then a small accessible "more" dropdown holding the secondary sections
// (insights / activity). Approvals is intentionally NOT a nav item.
export function NavLinks({
  pending,
  agents,
  badges,
}: {
  pending: number;
  agents: NavAgent[];
  badges?: Record<string, number>;
}) {
  const p = usePathname();
  const is = (h: string) =>
    h === "/dashboard" ? p === "/dashboard" : p.startsWith(h);

  const more = [
    { href: "/dashboard/insights", label: "insights" },
    { href: "/dashboard/activity", label: "activity" },
  ];
  const moreActive = more.some((m) => is(m.href));

  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape (accessible dropdown behaviour).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Any route change closes the menu.
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on pathname change
  useEffect(() => setOpen(false), [p]);

  return (
    <>
      <Link
        className={`link ${is("/dashboard") ? "active" : ""}`}
        href="/dashboard"
      >
        office
        {pending > 0 && <span className="badge">{pending}</span>}
      </Link>

      {agents.map((a) => {
        const badge = badges?.[a.id] ?? 0;
        return (
          <Link
            key={a.id}
            className={`link ${is(`/dashboard/agents/${a.id}`) ? "active" : ""}`}
            href={`/dashboard/agents/${a.id}`}
            title={a.name}
          >
            <span className="tb-agent-emoji" aria-hidden="true">
              {a.emoji ?? "•"}
            </span>
            {a.name}
            {badge > 0 && <span className="badge">{badge}</span>}
          </Link>
        );
      })}

      <div className="tb-more" ref={wrapRef}>
        <button
          type="button"
          className={`link tb-more-btn ${moreActive ? "active" : ""} ${
            open ? "open" : ""
          }`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          more
          <svg
            className="tb-more-chev"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div className="tb-more-menu" id={menuId} role="menu">
            {more.map((m) => (
              <Link
                key={m.href}
                role="menuitem"
                className={`tb-more-item ${is(m.href) ? "active" : ""}`}
                href={m.href}
              >
                {m.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
