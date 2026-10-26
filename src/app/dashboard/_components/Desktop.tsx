"use client";

import { useEffect, useState } from "react";
import { PercyBusDriver } from "@/components/percy/PercyBusDriver";
import type { OSAgentExtras } from "../_data/agentpage-types";
import type { OSAgent, OSVps } from "../_data/agents";
import type { OSApproval, OSManualPost } from "../_data/approvals";
import type { OSCommand } from "../_data/command-types";
import type { OSFlightRow } from "../_data/copy-types";
import type { OSDesktop } from "../_data/desktop-types";
import type { OSDev } from "../_data/dev-types";
import type { OSFrontDesk } from "../_data/frontdesk";
import type { OSKnowledge } from "../_data/knowledge-types";
import type { OSMarketing } from "../_data/marketing-types";
import type { OSOp } from "../_data/ops";
import type { OSPlan } from "../_data/plans";
import type { OSThreadMsg } from "../_data/threads";
import type { OSWarRoom } from "../_data/warroom-types";
import { DOCK_WS, WINDOWS } from "../_data/windows";
import { AboutSheet } from "./AboutSheet";
import { BootScreen } from "./BootScreen";
import { CallProvider } from "./CallPanel";
import { DesktopContextMenu } from "./DesktopContextMenu";
import { DesktopGround, type OSPipeline } from "./DesktopGround";
import { LiveProvider } from "./LiveView";
import { LockScreen } from "./LockScreen";
import { MenuBar } from "./MenuBar";
import { NotificationBanners } from "./NotificationBanners";
import { useOS } from "./os-store";
import { Palette } from "./Palette";
import { PercyDrawer } from "./PercyDrawer";
import { Persona } from "./Persona";
import { SystemMonitor } from "./SystemMonitor";
import { TickPoller } from "./TickPoller";
import { WindowFrame } from "./WindowFrame";

const DOT: Record<string, string> = {
  working: "var(--dot-working)",
  waiting: "var(--dot-waiting)",
  idle: "var(--dot-idle)",
  soon: "var(--dot-soon)",
};

export function Desktop({
  agents,
  pending,
  working,
  vps,
  approvals,
  manual,
  inFlight,
  frontdesk,
  desktop,
  marketing,
  dev,
  knowledge,
  command,
  warroom,
  agentExtras,
  threads,
  ops,
  plans,
}: {
  agents: OSAgent[];
  pending: number;
  working: number;
  vps: OSVps | null;
  approvals: OSApproval[];
  manual: OSManualPost[];
  inFlight: OSFlightRow[];
  frontdesk: OSFrontDesk;
  desktop: OSDesktop;
  marketing: OSMarketing;
  dev: OSDev;
  knowledge: OSKnowledge;
  command: OSCommand;
  warroom: OSWarRoom;
  agentExtras: Record<string, OSAgentExtras>;
  threads: Record<string, OSThreadMsg[]>;
  ops: OSOp[];
  plans: OSPlan[];
}) {
  const os = useOS();
  const [hov, setHov] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  // live-ish clock, client-only to avoid hydration mismatch
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const mons = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const p = (n: number) => String(n).padStart(2, "0");
      setClock(
        `${days[d.getDay()]} ${d.getDate()} ${mons[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`,
      );
    };
    fmt();
    const t = setInterval(fmt, 30_000);
    return () => clearInterval(t);
  }, []);

  // pipeline summary for the desktop widget
  const pipeline: OSPipeline = {
    value: frontdesk.pipelineValue,
    deals: frontdesk.deals.filter((d) => d.stage !== "won").length,
    bars: ["prospect", "contacted", "replied", "proposal", "won"].map((s) => ({
      label: s,
      count: frontdesk.deals.filter((d) => d.stage === s).length,
    })),
    wonThisMonth: frontdesk.wonThisMonth,
    collected: frontdesk.money.collectedAed,
  };
  const ctxLabel =
    os.win === "agent"
      ? (agents.find((a) => a.id === os.sub.k)?.name ?? "agent")
      : os.win
        ? WINDOWS[os.win].name
        : "desktop";

  return (
    <LiveProvider plans={plans}>
      <CallProvider>
        {/* live-update heartbeat: refreshes server data only when the tick changes */}
        <TickPoller />
        {/* single writer of the shared Percy avatar's mode (window.PercyBus) */}
        <PercyBusDriver
          percyWorking={agents.some(
            (a) => a.id === "percy" && a.status === "working",
          )}
        />

        {/* ── desktop ground: the vps map + widgets ──────────────────────────── */}
        <DesktopGround
          agents={agents}
          vps={vps}
          approvals={approvals}
          desktop={desktop}
          warroom={warroom}
          pipeline={pipeline}
        />

        {/* ── menu bar (v3 §4) ───────────────────────────────────────────────── */}
        <MenuBar
          agents={agents}
          pending={pending}
          working={working}
          vps={vps}
          clock={clock}
          ctxLabel={ctxLabel}
        />

        {/* ── system monitor (v3 §5) ─────────────────────────────────────────── */}
        <SystemMonitor agents={agents} vps={vps} ops={ops} />

        {/* ── window ─────────────────────────────────────────────────────────── */}
        <WindowFrame
          agents={agents}
          pending={pending}
          approvals={approvals}
          manual={manual}
          inFlight={inFlight}
          frontdesk={frontdesk}
          marketing={marketing}
          dev={dev}
          knowledge={knowledge}
          command={command}
          warroom={warroom}
          agentExtras={agentExtras}
        />

        {/* ── percy drawer ───────────────────────────────────────────────────── */}
        <PercyDrawer agents={agents} threads={threads} />

        {/* ── percy button (hidden while a window is zoomed, §6) ─────────────── */}
        {!os.drawer && !os.zoomed && (
          <button
            type="button"
            data-pc="pill"
            onClick={() => os.toggleDrawer("percy")}
            style={{
              position: "absolute",
              right: 14,
              bottom: 10,
              zIndex: 26,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 5,
              borderRadius: 14,
              background: "var(--dock)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <Persona
              agent="percy"
              size={36}
              ring
              status={agents.find((a) => a.id === "percy")?.status ?? ""}
            />
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                textAlign: "left",
                width: 140,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>Percy</span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--soft)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pending > 0
                  ? `${pending} waiting for you`
                  : "hold ⌘⌥ to talk · ⌘J"}
              </span>
            </span>
          </button>
        )}

        {/* ── dock ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            zIndex: 20,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 17,
            background: "var(--dock)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <DockTile
            label="desktop"
            active={!os.win}
            minimized={false}
            hov={hov}
            setHov={setHov}
            onClick={os.close}
            variant="solid"
            fg="var(--bg)"
            glyph="M4 6h16M4 12h16M4 18h10"
          />
          {DOCK_WS.map((k) => {
            const w = WINDOWS[k];
            return (
              <DockTile
                key={k}
                label={w.name}
                active={os.win === k}
                minimized={os.win === k && os.minimized}
                hov={hov}
                setHov={setHov}
                onClick={() => os.open(k)}
                variant="mono"
                fg="var(--ink)"
                glyph={w.glyph}
              />
            );
          })}
          <Divider />
          <DockTile
            label="war room"
            active={os.win === "warroom"}
            minimized={os.win === "warroom" && os.minimized}
            hov={hov}
            setHov={setHov}
            onClick={() => os.open("warroom")}
            variant="mono"
            fg="var(--ink)"
            glyph={WINDOWS.warroom.glyph}
          />
          <DockTile
            label="approvals"
            active={os.win === "approvals"}
            minimized={os.win === "approvals" && os.minimized}
            hov={hov}
            setHov={setHov}
            onClick={() => os.open("approvals")}
            variant="mono"
            fg="var(--accent)"
            glyph={WINDOWS.approvals.glyph}
            badge={pending || undefined}
            accentBadge
          />
          <Divider />
          {agents.map((a) => (
            <div
              key={a.id}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {hov === `ag-${a.id}` && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 54,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: "7px 11px",
                    borderRadius: 10,
                    background: "var(--ink)",
                    color: "var(--bg)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                    {a.name} · {a.status}
                  </span>
                  <span style={{ fontSize: 11.5, opacity: 0.75 }}>
                    {a.task || "nothing running"}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="os-dock-tile"
                onClick={() => os.openAgent(a.id)}
                onMouseEnter={() => setHov(`ag-${a.id}`)}
                onMouseLeave={() => setHov(null)}
                aria-label={`open ${a.name}`}
                style={{
                  cursor: "pointer",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                }}
              >
                <Persona agent={a.id} size={40} status={a.status} />
              </button>
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  marginTop: 3,
                  background: DOT[a.status],
                }}
              />
            </div>
          ))}
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="os-dock-tile os-tile-mono"
              onClick={os.openPal}
              title="search ⌘K"
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <svg
                width="21"
                height="21"
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
            </button>
            <span style={{ width: 4, height: 4, marginTop: 4 }} />
          </div>
        </div>

        {/* ── notification banners (v3 §8) ───────────────────────────────────── */}
        <NotificationBanners
          feed={desktop.feed}
          suppressed={
            !os.view.banners ||
            os.locked ||
            os.booting ||
            os.notif ||
            os.pal ||
            os.monitorOpen
          }
        />

        {/* ── notifications ──────────────────────────────────────────────────── */}
        {os.notif && <Notifications agents={agents} pending={pending} />}

        {/* ── command palette ────────────────────────────────────────────────── */}
        {os.pal && (
          <Palette
            agents={agents}
            deals={frontdesk.deals.map((d) => ({
              key: d.key,
              company: d.company,
              stage: d.stage,
            }))}
            projects={dev.repos.map((r) => ({ id: r.id, name: r.name }))}
          />
        )}

        {/* ── toast ──────────────────────────────────────────────────────────── */}
        {os.toast && (
          <div
            className="os-popin-cx"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 77,
              transform: "translateX(-50%)",
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 4px 4px 11px",
              borderRadius: 8,
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              whiteSpace: "nowrap",
            }}
          >
            {os.toast}
            <button
              type="button"
              aria-label="dismiss"
              onClick={os.dismissToast}
              className="os-toast-x"
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                border: "none",
                background: "transparent",
                color: "var(--bg)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                opacity: 0.6,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
                <path
                  d="M1 1 L8 8 M8 1 L1 8"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* ── desktop context menu (v3 §7) ───────────────────────────────────── */}
        {os.ctxMenu && <DesktopContextMenu />}

        {/* ── about sheet (v3 §10) ───────────────────────────────────────────── */}
        {os.aboutOpen && <AboutSheet vps={vps} working={working} />}

        {/* ── lock screen (v3 §9) ────────────────────────────────────────────── */}
        {os.locked && (
          <LockScreen
            approvals={approvals}
            working={working}
            pending={pending}
          />
        )}

        {/* ── boot screen (v3 §3) — on top of everything, first-load only ────── */}
        {os.booting && <BootScreen />}
      </CallProvider>
    </LiveProvider>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 34,
        background: "var(--line)",
        margin: "0 3px 7px",
        alignSelf: "flex-end",
      }}
    />
  );
}

function DockTile({
  label,
  active,
  minimized,
  hov,
  setHov,
  onClick,
  variant,
  fg,
  glyph,
  badge,
  accentBadge,
}: {
  label: string;
  active: boolean;
  // v3 §2/§6: indicator dot is --ink when this window is open now, --mute when
  // it's open-but-minimised, transparent otherwise.
  minimized: boolean;
  hov: string | null;
  setHov: (v: string | null) => void;
  onClick: () => void;
  // v3 §2: "solid" = the desktop tile (solid --ink, --bg glyph); "mono" = the
  // monochrome workspace/approvals tiles (the --tile1/--tile2 gradient via the
  // .os-tile-mono class). Glyph colour comes in via `fg`.
  variant: "solid" | "mono";
  fg: string;
  glyph: string;
  badge?: number;
  // approvals badge is accent-on-onacc; every other badge is --ink on --bg.
  accentBadge?: boolean;
}) {
  const id = `ws-${label}`;
  const solid = variant === "solid";
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {hov === id && (
        <div
          style={{
            position: "absolute",
            bottom: 56,
            padding: "5px 10px",
            borderRadius: 8,
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
      <button
        type="button"
        className={solid ? "os-dock-tile" : "os-dock-tile os-tile-mono"}
        onClick={onClick}
        onMouseEnter={() => setHov(id)}
        onMouseLeave={() => setHov(null)}
        aria-label={label}
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: solid ? "var(--ink)" : undefined,
          border: solid ? "none" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={fg}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={glyph} />
        </svg>
      </button>
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 17,
            height: 17,
            padding: "0 5px",
            borderRadius: 10,
            background: accentBadge ? "var(--accent)" : "var(--ink)",
            color: accentBadge ? "var(--onacc)" : "var(--bg)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--surf)",
          }}
        >
          {badge}
        </span>
      ) : null}
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          marginTop: 3,
          background: active
            ? minimized
              ? "var(--mute)"
              : "var(--ink)"
            : "transparent",
        }}
      />
    </div>
  );
}

function Notifications({
  agents,
  pending,
}: {
  agents: OSAgent[];
  pending: number;
}) {
  const os = useOS();
  const waiting = agents.filter((a) => a.status === "waiting");
  return (
    <>
      <button
        type="button"
        aria-label="close notifications"
        onClick={os.closeOverlays}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          background: "transparent",
          border: "none",
          cursor: "default",
        }}
      />
      <div
        className="os-popin"
        style={{
          position: "absolute",
          top: 44,
          right: 12,
          width: 370,
          zIndex: 41,
          background: "var(--surf)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          boxShadow: "var(--shadow)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "calc(100% - 140px)",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            className="os-display"
            style={{ fontWeight: 800, fontSize: 20 }}
          >
            notifications
          </span>
          <span style={{ fontSize: 12, color: "var(--mute)" }}>today</span>
        </div>
        <span
          className="os-mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ambink)",
          }}
        >
          needs your tap · {pending}
        </span>
        {pending === 0 && (
          <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
            nothing waiting. new requests land here.
          </span>
        )}
        {waiting.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => os.open("approvals")}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: 9,
              borderRadius: 12,
              background: "var(--surf2)",
              cursor: "pointer",
              border: "none",
              textAlign: "left",
              color: "var(--ink)",
            }}
          >
            <Persona agent={a.id} size={28} />
            <span
              style={{ fontSize: 12.5, flex: 1, minWidth: 0, lineHeight: 1.3 }}
            >
              {a.name} has something waiting for you
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
