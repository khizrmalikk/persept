"use client";

import { type ReactNode, useCallback, useEffect, useId, useState } from "react";

// The agent detail page is a two-part workspace: a BIG chat surface as the
// centerpiece and a COLLAPSIBLE info sidebar holding everything about the agent.
// A function (the send action / server-rendered panels) can't cross the
// server→client boundary as JSX-with-behaviour, so the server page renders both
// halves and hands them here as ReactNodes; this client shell owns ONLY the
// sidebar's open/closed state and its a11y wiring.
//
// - Desktop (≥1024px): sidebar docked on the right, open by default. Collapsing
//   it lets the chat expand to fill the whole width (a strong "AI agent" feel).
// - Mobile (<1024px): the sidebar is a slide-over sheet, closed by default,
//   toggled by the same button (which floats over the chat) + a backdrop.

type Props = {
  agentName: string;
  chat: ReactNode;
  sidebar: ReactNode;
};

// SSR-safe desktop check. Renders `false` on the server + first client paint so
// markup matches (no hydration mismatch), then resolves in an effect. We default
// the sidebar OPEN on desktop and CLOSED on mobile, so we only need to know the
// breakpoint once, at mount, to set the initial open state.
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function AgentWorkspace({ agentName, chat, sidebar }: Props) {
  const isDesktop = useIsDesktop();
  // `null` = "not decided yet" (before the breakpoint resolves). Once we know the
  // viewport, default open on desktop / closed on mobile. The user can override
  // either way; we only auto-set when crossing the breakpoint.
  const [open, setOpen] = useState<boolean | null>(null);
  const sidebarId = useId();

  // Sync the default with the breakpoint. Runs whenever `isDesktop` flips, so
  // rotating a tablet or resizing across 1024px restores the natural default
  // (open on desktop, closed on mobile) rather than stranding a mobile sheet open.
  useEffect(() => {
    setOpen(isDesktop);
  }, [isDesktop]);

  const isOpen = open ?? false;

  const close = useCallback(() => setOpen(false), []);

  // Escape closes the mobile sheet (only meaningful when it's an overlay).
  useEffect(() => {
    if (!isOpen || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isDesktop, close]);

  return (
    <div
      className={`wf-ws ${isOpen ? "sb-open" : "sb-closed"}`}
      data-open={isOpen ? "true" : "false"}
    >
      {/* ── Chat: the dominant surface. Expands to full width when collapsed. ── */}
      <div className="wf-ws-chat">{chat}</div>

      {/* ── Sidebar toggle: a real button, floats over the chat top-right. ──── */}
      <button
        type="button"
        className="wf-ws-toggle"
        aria-expanded={isOpen}
        aria-controls={sidebarId}
        aria-label={
          isOpen ? `hide ${agentName} details` : `show ${agentName} details`
        }
        onClick={() => setOpen((v) => !(v ?? false))}
      >
        {isOpen ? (
          // chevron pointing toward the sidebar edge (collapse)
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // info glyph (expand)
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 11v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="7.5" r="1.15" fill="currentColor" />
          </svg>
        )}
        <span className="wf-ws-toggle-label">
          {isOpen ? "hide" : "details"}
        </span>
      </button>

      {/* ── Backdrop: only paints/interacts on mobile when the sheet is open. ─ */}
      <button
        type="button"
        className="wf-ws-backdrop"
        aria-label="close details"
        tabIndex={isOpen && !isDesktop ? 0 : -1}
        onClick={close}
      />

      {/* ── Info sidebar: everything about the agent, kept scannable. ──────── */}
      <aside
        id={sidebarId}
        className="wf-ws-side"
        aria-label={`${agentName} details`}
        aria-hidden={!isOpen}
        // When collapsed, take it out of the tab order + a11y tree entirely.
        // React 19 supports the boolean `inert` prop natively.
        inert={!isOpen}
      >
        <div className="wf-ws-side-head">
          <span className="wf-ws-side-title">details</span>
          <button
            type="button"
            className="wf-ws-side-close"
            aria-label="hide details"
            onClick={close}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="wf-ws-side-scroll">{sidebar}</div>
      </aside>
    </div>
  );
}
