"use client";

import type { ReactNode } from "react";
import { restartAgent } from "@/lib/workforce/actions";
import type { OSAgent, OSVps } from "../_data/agents";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// v3 §4 menu bar (36px). Left → right: persept · {current window} · go · agents ·
// view. Clicking a title opens its menu; while one is open, hovering another
// switches to it; outside-click or Esc (handled in os-store) closes. Right side:
// the status item (opens the system monitor), search ⌘K, theme, bell, clock,
// owner avatar. The system-monitor popover itself is rendered by Desktop.

const DOT: Record<string, string> = {
  working: "var(--dot-working)",
  waiting: "var(--dot-waiting)",
  idle: "var(--dot-idle)",
  soon: "var(--dot-soon)",
};

export function MenuBar({
  agents,
  pending,
  working,
  vps,
  clock,
  ctxLabel,
}: {
  agents: OSAgent[];
  pending: number;
  working: number;
  vps: OSVps | null;
  clock: string;
  // the current window's display name (or "desktop") — computed in Desktop.
  ctxLabel: string;
}) {
  const os = useOS();
  const open = os.menu;
  // clicking a title toggles its menu; hovering another title while one is open
  // switches to it (the classic macOS menu-bar behaviour).
  const onTitleClick = (id: string) => os.setMenu(open === id ? null : id);
  const onTitleEnter = (id: string) => {
    if (open && open !== id) os.setMenu(id);
  };

  const cpu = vps ? `${vps.cpuPct}%` : "—";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 36,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "0 10px",
        background: "var(--menubar)",
        backdropFilter: "blur(16px) saturate(1.4)",
        borderBottom: "1px solid var(--line)",
        fontSize: 13,
      }}
    >
      {/* click-away catcher while any menu is open (sits under the panels) */}
      {open && (
        <button
          type="button"
          aria-label="close menu"
          onClick={() => os.setMenu(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            background: "transparent",
            border: "none",
            cursor: "default",
          }}
        />
      )}

      {/* ── persept ─────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <button
          type="button"
          className={`os-menu-title os-display${open === "persept" ? " is-open" : ""}`}
          style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.035em" }}
          onClick={() => onTitleClick("persept")}
          onMouseEnter={() => onTitleEnter("persept")}
          aria-haspopup="menu"
          aria-expanded={open === "persept"}
        >
          <svg
            width="16"
            height="17"
            viewBox="10.31 8 79.38 84"
            aria-hidden="true"
          >
            <path
              d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
              fill="var(--accent)"
            />
            <path
              fillRule="evenodd"
              d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
              fill="var(--accent)"
            />
          </svg>
          persept
        </button>
        {open === "persept" && (
          <Panel>
            <Row label="about persept os" onClick={os.openAbout} />
            <Row label="system monitor" onClick={os.openMonitor} />
            <Row
              label={os.theme === "dark" ? "light mode" : "dark mode"}
              onClick={() => {
                os.toggleTheme();
                os.setMenu(null);
              }}
            />
            <Sep />
            <Row
              label="restart all agents"
              onClick={() => {
                if (
                  window.confirm(
                    "Restart all agents? Percy resets each runner.",
                  )
                ) {
                  for (const a of agents) {
                    if (a.id !== "percy") void restartAgent(a.id);
                  }
                  os.showToast("Percy is resetting the team");
                }
                os.setMenu(null);
              }}
            />
            <Row label="lock screen" shortcut="⌥L" onClick={os.lock} />
          </Panel>
        )}
      </div>

      {/* ── {current window} ────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <button
          type="button"
          className={`os-menu-title os-display${open === "window" ? " is-open" : ""}`}
          style={{ fontWeight: 700 }}
          onClick={() => onTitleClick("window")}
          onMouseEnter={() => onTitleEnter("window")}
          aria-haspopup="menu"
          aria-expanded={open === "window"}
        >
          {ctxLabel}
        </button>
        {open === "window" && (
          <Panel>
            {os.win === null ? (
              <>
                {/* desktop context: no window to act on */}
                <Row
                  label={os.view.widgets ? "hide widgets" : "show widgets"}
                  onClick={() => {
                    // Phase 4: toggling view.widgets will hide the widgets.
                    os.toggleView("widgets");
                    os.setMenu(null);
                  }}
                />
                <Sep />
                <Row
                  label="ask percy…"
                  shortcut="⌘K"
                  onClick={() => {
                    os.openPal();
                    os.setMenu(null);
                  }}
                />
                <Row
                  label="talk to percy"
                  shortcut="⌘J"
                  onClick={() => {
                    os.openDrawer("percy");
                    os.setMenu(null);
                  }}
                />
              </>
            ) : (
              <>
                <Row
                  label="minimise"
                  onClick={() => {
                    os.minimize();
                    os.setMenu(null);
                  }}
                />
                <Row
                  label={os.zoomed ? "restore" : "zoom"}
                  onClick={() => {
                    os.toggleZoom();
                    os.setMenu(null);
                  }}
                />
                <Row
                  label="close"
                  shortcut="esc"
                  onClick={() => {
                    os.close();
                    os.setMenu(null);
                  }}
                />
                <Sep />
                <Row label="show desktop" shortcut="⌥0" onClick={os.close} />
              </>
            )}
          </Panel>
        )}
      </div>

      {/* ── go ──────────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TitleBtn
          id="go"
          label="go"
          open={open}
          onClick={onTitleClick}
          onEnter={onTitleEnter}
        />
        {open === "go" && (
          <Panel>
            <GoRow
              label="desktop"
              shortcut="⌥0"
              dot={os.win === null}
              onClick={os.close}
            />
            <GoRow
              label="command"
              shortcut="⌥1"
              dot={os.win === "command"}
              onClick={() => os.open("command")}
            />
            <GoRow
              label="front desk"
              shortcut="⌥2"
              dot={os.win === "frontdesk"}
              onClick={() => os.open("frontdesk")}
            />
            <GoRow
              label="marketing"
              shortcut="⌥3"
              dot={os.win === "marketing"}
              onClick={() => os.open("marketing")}
            />
            <GoRow
              label="dev"
              shortcut="⌥4"
              dot={os.win === "dev"}
              onClick={() => os.open("dev")}
            />
            <GoRow
              label="knowledge"
              shortcut="⌥5"
              dot={os.win === "knowledge"}
              onClick={() => os.open("knowledge")}
            />
            <GoRow
              label="war room"
              shortcut="⌥6"
              dot={os.win === "warroom"}
              onClick={() => os.open("warroom")}
            />
            <GoRow
              label="approvals"
              shortcut="⌥7"
              dot={os.win === "approvals"}
              badge={pending || undefined}
              onClick={() => os.open("approvals")}
            />
            <Sep />
            <Row
              label="search"
              shortcut="⌘K"
              onClick={() => {
                os.openPal();
                os.setMenu(null);
              }}
            />
          </Panel>
        )}
      </div>

      {/* ── agents ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TitleBtn
          id="agents"
          label="agents"
          open={open}
          onClick={onTitleClick}
          onEnter={onTitleEnter}
        />
        {open === "agents" && (
          <Panel minWidth={280}>
            <div className="os-menu-head">your workforce</div>
            {agents.map((a) => (
              <button
                key={a.id}
                type="button"
                className="os-menu-row"
                onClick={() => os.openAgent(a.id)}
              >
                <span style={{ position: "relative", flex: "none" }}>
                  <Persona agent={a.id} size={20} />
                  <span
                    style={{
                      position: "absolute",
                      right: -1,
                      bottom: -1,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: DOT[a.status],
                      border: "1.5px solid var(--surf)",
                    }}
                  />
                </span>
                <span className="os-menu-label" style={{ fontWeight: 600 }}>
                  {a.name}
                </span>
                <span className="os-menu-key">{a.status}</span>
              </button>
            ))}
            <Sep />
            <Row
              label="talk to percy"
              onClick={() => {
                os.openDrawer("percy");
                os.setMenu(null);
              }}
            />
            <Row label="system monitor" onClick={os.openMonitor} />
          </Panel>
        )}
      </div>

      {/* ── view ────────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TitleBtn
          id="view"
          label="view"
          open={open}
          onClick={onTitleClick}
          onEnter={onTitleEnter}
        />
        {open === "view" && (
          <Panel>
            <CheckRow
              label="heat map"
              checked={os.view.heatMap}
              onClick={() => os.toggleView("heatMap")}
            />
            <CheckRow
              label="data links"
              checked={os.view.dataLinks}
              onClick={() => os.toggleView("dataLinks")}
            />
            <CheckRow
              label="desktop widgets"
              checked={os.view.widgets}
              onClick={() => os.toggleView("widgets")}
            />
            <CheckRow
              label="notification banners"
              checked={os.view.banners}
              onClick={() => os.toggleView("banners")}
            />
            <Sep />
            <Row
              label={os.theme === "dark" ? "light mode" : "dark mode"}
              onClick={() => {
                os.toggleTheme();
                os.setMenu(null);
              }}
            />
          </Panel>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* right cluster — one even gap, independent of the left menu titles, so
          the status group + icons + clock + avatar read as a tidy row (v3). */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* ── status item (opens the system monitor) ────────────────────────── */}
        <button
          type="button"
          className={`os-status-item${os.monitorOpen ? " is-open" : ""}`}
          onClick={os.openMonitor}
          title="system monitor"
          style={{ position: "relative", zIndex: 2 }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--dot-working)",
            }}
          />
          <span style={{ fontSize: 12.5 }}>{working} of 6 working</span>
          <span
            className="os-mono"
            style={{ fontSize: 11.5, color: "var(--soft)" }}
          >
            cpu {cpu}
          </span>
          <Sparkline />
        </button>

        {/* ── search · theme · bell · clock · avatar ──────────────────────────── */}
        <button
          type="button"
          onClick={os.openPal}
          title="search ⌘K"
          style={iconBtn}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="os-mono" style={{ fontSize: 11 }}>
            ⌘K
          </span>
        </button>
        <button
          type="button"
          onClick={os.toggleTheme}
          title="light / dark"
          style={iconBtn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path
              d={
                os.theme === "dark"
                  ? "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
                  : "M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L5 5M18 6l1-1M6 18l-1 1M18 18l1 1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
              }
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={os.toggleNotif}
          title="notifications"
          style={{ ...iconBtn, position: "relative" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9a6 6 0 0 1 12 0c0 6 3 7 3 7H3s3-1 3-7M10 20a2 2 0 0 0 4 0" />
          </svg>
          {pending > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                minWidth: 14,
                height: 14,
                padding: "0 3px",
                borderRadius: 7,
                background: "var(--accent)",
                color: "var(--onacc)",
                fontSize: 9,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {pending}
            </span>
          )}
        </button>
        <span style={{ whiteSpace: "nowrap", fontSize: 12.5 }}>{clock}</span>
        <Persona agent="you" size={22} />
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "var(--soft)",
  background: "transparent",
  border: "none",
  padding: 0,
  position: "relative",
  zIndex: 2,
};

// a plain bar title (go / agents / view)
function TitleBtn({
  id,
  label,
  open,
  onClick,
  onEnter,
}: {
  id: string;
  label: string;
  open: string | null;
  onClick: (id: string) => void;
  onEnter: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`os-menu-title${open === id ? " is-open" : ""}`}
      style={{ fontWeight: 500 }}
      onClick={() => onClick(id)}
      onMouseEnter={() => onEnter(id)}
      aria-haspopup="menu"
      aria-expanded={open === id}
    >
      {label}
    </button>
  );
}

function Panel({
  children,
  minWidth,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="os-menu-panel" style={minWidth ? { minWidth } : undefined}>
      {children}
    </div>
  );
}

// a thin separator between menu groups
function Sep() {
  return <div className="os-menu-sep" aria-hidden="true" />;
}

function Row({
  label,
  shortcut,
  onClick,
  disabled,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="os-menu-row"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="os-menu-label">{label}</span>
      {shortcut && <span className="os-menu-key">{shortcut}</span>}
    </button>
  );
}

// a go-menu row: a leading dot marks the current window; optional pending badge.
function GoRow({
  label,
  shortcut,
  dot,
  badge,
  onClick,
}: {
  label: string;
  shortcut: string;
  dot: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button type="button" className="os-menu-row" onClick={onClick}>
      <span className="os-menu-mark" aria-hidden="true">
        {dot ? "•" : ""}
      </span>
      <span className="os-menu-label">{label}</span>
      {badge != null && (
        <span
          style={{
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--onacc)",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge}
        </span>
      )}
      <span className="os-menu-key">{shortcut}</span>
    </button>
  );
}

// a view-menu row: a leading ✓ when the toggle is on.
function CheckRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="os-menu-row" onClick={onClick}>
      <span className="os-menu-mark" aria-hidden="true">
        {checked ? "✓" : ""}
      </span>
      <span className="os-menu-label">{label}</span>
    </button>
  );
}

// the 34×12 status sparkline — static line in --ink (accent is kept for things
// that need you, §12).
function Sparkline() {
  return (
    <svg width="34" height="12" viewBox="0 0 34 12" aria-hidden="true">
      <path
        d="M0 9 L5 7 L9 8 L13 4 L17 6 L21 3 L25 5 L29 2 L34 4"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
