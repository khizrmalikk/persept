"use client";

import { useEffect, useRef, useState } from "react";
import type { OSAgentExtras } from "../_data/agentpage-types";
import type { OSAgent } from "../_data/agents";
import type { OSApproval, OSManualPost } from "../_data/approvals";
import type { OSCommand } from "../_data/command-types";
import type { OSFlightRow } from "../_data/copy-types";
import type { OSDev } from "../_data/dev-types";
import type { OSFrontDesk } from "../_data/frontdesk";
import type { OSKnowledge } from "../_data/knowledge-types";
import type { OSMarketing } from "../_data/marketing-types";
import type { OSWarRoom } from "../_data/warroom-types";
import { AGENT_HUE_VAR, AGENT_TINT_VAR, WINDOWS } from "../_data/windows";
import { useOS } from "./os-store";
import { type AgentKey, Persona } from "./Persona";
import { AgentPage } from "./windows/AgentPage";
import { Approvals } from "./windows/Approvals";
import { Command } from "./windows/Command";
import { Dev } from "./windows/Dev";
import { FrontDesk } from "./windows/FrontDesk";
import { Knowledge } from "./windows/Knowledge";
import { Marketing } from "./windows/Marketing";
import { WarRoom } from "./windows/WarRoom";

// The one-window-at-a-time frame: scrim + a full-bleed card with the standard
// header (owner large, collaborators as chips, percy-oversight chip on
// workspaces, a "n waiting for you" amber chip, close). The body is routed by
// `win`. Window bodies are filled in per phase; until then they show a short note.

export function WindowFrame({
  agents,
  pending,
  approvals,
  manual,
  inFlight,
  frontdesk,
  marketing,
  dev,
  knowledge,
  command,
  warroom,
  agentExtras,
}: {
  agents: OSAgent[];
  pending: number;
  approvals: OSApproval[];
  manual: OSManualPost[];
  inFlight: OSFlightRow[];
  frontdesk: OSFrontDesk;
  marketing: OSMarketing;
  dev: OSDev;
  knowledge: OSKnowledge;
  command: OSCommand;
  warroom: OSWarRoom;
  agentExtras: Record<string, OSAgentExtras>;
}) {
  const os = useOS();

  // v3 §6 exit motion. Close and minimise both animate the frame out before the
  // store changes: close() unmounts the frame, minimize() hides it (keeping
  // win/sub). We hold a local phase, run the matching CSS, then commit. A key on
  // os.win+sub resets this per window so a fresh open always animates in.
  const [exit, setExit] = useState<null | "close" | "min">(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // if the window changes underneath us (e.g. open() while minimising), drop the
  // pending exit so the new window shows.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on identity change
  useEffect(() => {
    setExit(null);
    window.clearTimeout(timer.current);
  }, [os.win, os.sub]);

  if (!os.win) return null;
  // minimised: keep state, render nothing (the dock dot stands in for it).
  if (os.minimized && exit !== "min") return null;

  const beginClose = () => {
    if (exit) return;
    setExit("close");
    timer.current = window.setTimeout(() => os.close(), 160);
  };
  const beginMinimize = () => {
    if (exit) return;
    setExit("min");
    timer.current = window.setTimeout(() => {
      os.minimize();
      setExit(null);
    }, 260);
  };

  const drawerOpen = os.drawer;
  const zoomed = os.zoomed;
  const nameOf = (k: AgentKey) =>
    k === "you" ? "you" : (agents.find((a) => a.id === k)?.name ?? k);

  const isAgent = os.win === "agent";
  const agentKey: AgentKey = os.sub.k ?? "percy";
  const meta = os.win !== "agent" ? WINDOWS[os.win] : null;

  const owner: AgentKey | null = isAgent ? agentKey : (meta?.owner ?? null);
  const title = isAgent ? nameOf(agentKey) : (meta?.name ?? "");
  const cat = isAgent
    ? (agents.find((a) => a.id === agentKey)?.room ?? "agent")
    : (meta?.cat ?? "");
  const sub = isAgent
    ? (agents.find((a) => a.id === agentKey)?.mandate ?? "")
    : (meta?.sub ?? "");
  const collab: AgentKey[] = isAgent ? [] : (meta?.collab ?? []);
  const oversight = isAgent ? false : (meta?.oversight ?? false);
  const glyph = meta && !owner ? meta.glyph : null;
  // v3 §6/§2: the non-owner header glyph tile is the monochrome dock tile (via
  // .os-header-tile); approvals keeps its accent glyph. dockBg is retired.
  const accentGlyph = os.win === "approvals";

  // per-window "waiting for you" count: workspaces count by their workspace tag,
  // an agent window counts that agent's live approvals, else the total.
  const apN = isAgent
    ? approvals.filter((a) => !a.held && a.agent === agentKey).length
    : os.win === "frontdesk" ||
        os.win === "marketing" ||
        os.win === "dev" ||
        os.win === "command"
      ? approvals.filter((a) => !a.held && a.workspace === os.win).length
      : pending;

  // v3 §6 geometry. Normal: inset frame (inset by the drawer when open). Zoomed:
  // fills everything below the 36px menu bar to the viewport edges, radius 0,
  // above the dock — but stops 454px short when the Percy drawer is open.
  const geom: React.CSSProperties = zoomed
    ? {
        left: 0,
        right: drawerOpen ? 454 : 0,
        top: 36,
        bottom: 0,
        borderRadius: 0,
        zIndex: 25,
      }
    : {
        left: 14,
        right: drawerOpen ? 468 : 14,
        top: 46,
        bottom: 90,
        borderRadius: 20,
        zIndex: 16,
      };
  const winClass =
    exit === "close"
      ? "os-window is-closing"
      : exit === "min"
        ? "os-window is-minimizing"
        : "os-window";

  return (
    <>
      <button
        type="button"
        className="os-win-scrim"
        aria-label="close window"
        onClick={beginClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 15,
          background: "var(--scrim)",
          backdropFilter: "blur(3px)",
          border: "none",
          cursor: "default",
        }}
      />
      <section
        className={winClass}
        style={{
          position: "absolute",
          ...geom,
          background: "var(--surf)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header — double-click toggles zoom (§6). Keyboard users get the same
            via the zoom traffic-light button, so the dbl-click is a pure extra. */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: dbl-click zoom duplicates the keyboard-reachable zoom button */}
        <header
          onDoubleClick={os.toggleZoom}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px 12px 14px",
            borderBottom: "1px solid var(--line)",
            minHeight: 66,
          }}
        >
          {/* v3 §6 traffic-light controls: close · minimise · zoom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "none",
            }}
          >
            <button
              type="button"
              className="os-traffic is-close"
              onClick={beginClose}
              aria-label="close window"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <button
              type="button"
              className="os-traffic is-min"
              onClick={beginMinimize}
              aria-label="minimise window"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 12h12" />
              </svg>
            </button>
            <button
              type="button"
              className="os-traffic is-zoom"
              onClick={os.toggleZoom}
              aria-label={zoomed ? "restore window" : "zoom window"}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {zoomed ? (
                  <path d="M9 9H5M9 9V5M9 9L4 4M15 15h4M15 15v4M15 15l5 5" />
                ) : (
                  <path d="M5 9V5h4M19 15v4h-4M5 5l5 5M19 19l-5-5" />
                )}
              </svg>
            </button>
          </div>
          {owner ? (
            <Persona agent={owner} size={42} ring />
          ) : (
            <span
              className={accentGlyph ? undefined : "os-header-tile"}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: accentGlyph ? "var(--accent)" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke={accentGlyph ? "var(--onacc)" : "var(--ink)"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={glyph ?? ""} />
              </svg>
            </span>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="os-display"
                style={{ fontWeight: 800, fontSize: 22, whiteSpace: "nowrap" }}
              >
                {title}
              </span>
              <span
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: owner
                    ? `var(${AGENT_TINT_VAR[owner]})`
                    : "var(--surf2)",
                  color: owner ? `var(${AGENT_HUE_VAR[owner]})` : "var(--mute)",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </span>
            </div>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--soft)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sub}
            </span>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={os.refresh}
              title="refresh this window (⌘R)"
              aria-label="refresh this window"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--soft)",
                cursor: "pointer",
                flex: "none",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
              </svg>
            </button>
            {collab.map((c) => (
              <span
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px 3px 3px",
                  borderRadius: 999,
                  background: `var(${AGENT_TINT_VAR[c]})`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: `var(${AGENT_HUE_VAR[c]})`,
                  whiteSpace: "nowrap",
                }}
              >
                <Persona agent={c} size={22} />
                {nameOf(c)}
              </span>
            ))}
            {oversight && (
              <span
                title="Percy can see and act on everything here"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px 3px 3px",
                  borderRadius: 999,
                  border: "1px dashed var(--line)",
                  fontSize: 11.5,
                  color: "var(--soft)",
                  whiteSpace: "nowrap",
                }}
              >
                <Persona agent="percy" size={20} />
                percy · oversight
              </span>
            )}
            {os.win !== "approvals" && apN > 0 && (
              <button
                type="button"
                onClick={() => os.open("approvals")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "oklch(0.8 0.14 70 / 0.18)",
                  color: "var(--ambink)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {apN} waiting for you
              </button>
            )}
          </div>
        </header>

        {/* body */}
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <WindowBody
            agents={agents}
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
        </div>
      </section>
    </>
  );
}

function WindowBody({
  agents,
  approvals,
  manual,
  inFlight,
  frontdesk,
  marketing,
  dev,
  knowledge,
  command,
  warroom,
  agentExtras,
}: {
  agents: OSAgent[];
  approvals: OSApproval[];
  manual: OSManualPost[];
  inFlight: OSFlightRow[];
  frontdesk: OSFrontDesk;
  marketing: OSMarketing;
  dev: OSDev;
  knowledge: OSKnowledge;
  command: OSCommand;
  warroom: OSWarRoom;
  agentExtras: Record<string, OSAgentExtras>;
}) {
  const os = useOS();
  switch (os.win) {
    case "approvals":
      return (
        <Approvals approvals={approvals} manual={manual} inFlight={inFlight} />
      );
    case "frontdesk":
      return <FrontDesk data={frontdesk} approvals={approvals} />;
    case "command":
      return <Command data={command} />;
    case "warroom":
      return <WarRoom data={warroom} approvals={approvals} />;
    case "marketing":
      return <Marketing data={marketing} />;
    case "dev":
      return <Dev data={dev} />;
    case "knowledge":
      return <Knowledge data={knowledge} />;
    case "agent":
      return <AgentPage agents={agents} extras={agentExtras} />;
    default:
      return null;
  }
}
