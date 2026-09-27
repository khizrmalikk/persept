"use client";

import {
  type CSSProperties,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ConstellationWorker } from "@/lib/workforce/types";

// ── AgentNetwork2D ──────────────────────────────────────────────────────────
// A light, flat, WebGL-free version of the old 3D constellation: the office
// centrepiece. Pure SVG (crisp + responsive via a fixed viewBox that scales to
// its container), rendered from fully-serializable props so the server page can
// stay a data-fetching server component.
//
// Layout: the hub agent sits in the CENTRE; every other agent is placed evenly
// around it on a ring; a thin faint connector joins the hub to each spoke.
// Background workers render as small satellite dots near their parent node.
//
// Motion is a gentle idle "breath" (a soft float + a slow status pulse ring),
// implemented in CSS so `prefers-reduced-motion` freezes it via the global `.wf`
// reduced-motion rule — the network stays fully rendered, just still.
//
// Interaction: hovering / focusing a node highlights it and reveals a small
// popover anchored to the node (the popover lives INSIDE the node's <g> hover
// area, so there is no hover-gap to fall through). The popover carries "open"
// and (optionally) "call" actions. Clicking the node body navigates to that
// agent's page via `onSelectAgent`.

export type NetworkAgent = {
  id: string;
  name: string;
  emoji: string | null;
  status: "idle" | "working" | "waiting" | "error" | "offline";
  statusLabel: string;
  isHub: boolean;
  pending: number;
  workers: number;
};

// SVG user-space coordinates. The viewBox is fixed; the SVG scales to fit.
const VB_W = 1000;
const VB_H = 640;
const CX = VB_W / 2;
const CY = VB_H / 2;
const HUB_R = 46; // hub node radius
const SPOKE_R = 38; // spoke node radius

// Ring radius adapts to the spoke count so ~3 agents fill the canvas nicely and
// a larger roster stays inside the frame without overlapping.
function ringRadius(spokeCount: number): number {
  if (spokeCount <= 1) return 210;
  if (spokeCount <= 4) return 232;
  if (spokeCount <= 6) return 250;
  return 268;
}

type Placed = NetworkAgent & { x: number; y: number; r: number };

// Deterministic 0..1 from a string — stagger idle motion per node without a
// hydration mismatch (same value server + client).
function seed01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function statusColorVar(status: NetworkAgent["status"]): string {
  switch (status) {
    case "working":
      return "var(--ok)";
    case "waiting":
      return "var(--accent)";
    case "error":
      return "var(--err)";
    case "offline":
      return "var(--ink-faint)";
    default:
      return "var(--ink-faint)";
  }
}

export function AgentNetwork2D({
  agents,
  workers = [],
  onSelectAgent,
  onCallAgent,
}: {
  agents: NetworkAgent[];
  workers?: ConstellationWorker[];
  onSelectAgent: (id: string) => void;
  onCallAgent?: (id: string) => void;
}) {
  const gradId = useId().replace(/:/g, "");
  const [active, setActive] = useState<string | null>(null);
  // Keep the popover open while the pointer moves between the node body and its
  // action buttons (both inside the same <g>), and close on a short leave delay.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(id);
  }, []);
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  }, []);

  const placed = useMemo<Placed[]>(() => {
    if (agents.length === 0) return [];
    const hub =
      agents.find((a) => a.isHub) ??
      ({ ...agents[0], isHub: true } as NetworkAgent);
    const spokes = agents.filter((a) => a.id !== hub.id);
    const R = ringRadius(spokes.length);
    // Start at the top and go clockwise; a slight offset keeps an even count
    // from looking mirror-symmetric top/bottom.
    const offset =
      -Math.PI / 2 + (spokes.length % 2 === 0 ? Math.PI / spokes.length : 0);
    const spokePlaced: Placed[] = spokes.map((a, i) => {
      const t = offset + (i / spokes.length) * Math.PI * 2;
      return {
        ...a,
        x: CX + Math.cos(t) * R,
        y: CY + Math.sin(t) * R,
        r: SPOKE_R,
      };
    });
    return [{ ...hub, x: CX, y: CY, r: HUB_R }, ...spokePlaced];
  }, [agents]);

  const hub = placed.find((p) => p.isHub) ?? placed[0];

  // Fit the viewBox to the actual content (nodes + the labels below them) so the
  // network always frames tightly: no big vertical gaps when a few agents sit on
  // a near-horizontal line, and no clipping when a larger roster rings out.
  const vb = useMemo(() => {
    const LABEL_BELOW = 54; // name + status labels sit below each node
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of placed) {
      minX = Math.min(minX, p.x - p.r);
      maxX = Math.max(maxX, p.x + p.r);
      minY = Math.min(minY, p.y - p.r);
      maxY = Math.max(maxY, p.y + p.r + LABEL_BELOW);
    }
    const padX = 96;
    const padY = 76;
    return {
      x: minX - padX,
      y: minY - padY,
      w: maxX - minX + padX * 2,
      h: maxY - minY + padY * 2,
    };
  }, [placed]);

  // Group background workers by parent so we can fan them around the node.
  const workersByParent = useMemo(() => {
    const m = new Map<string, ConstellationWorker[]>();
    for (const w of workers) {
      if (w.status !== "running") continue;
      const arr = m.get(w.parentId);
      if (arr) arr.push(w);
      else m.set(w.parentId, [w]);
    }
    return m;
  }, [workers]);

  if (placed.length === 0 || !hub) return null;

  return (
    <div className="wf-net">
      <div
        className="wf-net-box"
        style={{ "--net-ar": vb.w / vb.h } as CSSProperties}
      >
        <svg
          className="wf-net-svg"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${gradId}-glow`} cx="50%" cy="42%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="55%" stopColor="rgba(248,246,243,0.35)" />
              <stop offset="100%" stopColor="rgba(251,250,248,0)" />
            </radialGradient>
          </defs>

          {/* soft lit backdrop so the net reads as sitting on a deck, not flat */}
          <rect
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
            fill={`url(#${gradId}-glow)`}
          />

          {/* connectors hub → each spoke (drawn first, under the nodes) */}
          <g className="wf-net-edges">
            {placed.map((p) => {
              if (p.isHub) return null;
              const on = active === p.id || active === hub.id;
              return (
                <line
                  key={`edge-${p.id}`}
                  className={`wf-net-edge ${on ? "on" : ""} ${
                    p.status === "waiting" ? "waiting" : ""
                  }`}
                  x1={hub.x}
                  y1={hub.y}
                  x2={p.x}
                  y2={p.y}
                />
              );
            })}
          </g>

          {/* nodes (+ their satellites + popovers) */}
          {placed.map((p) => {
            const s01 = seed01(p.id);
            const nodeWorkers = workersByParent.get(p.id) ?? [];
            const isActive = active === p.id;
            const dotColor = statusColorVar(p.status);
            const alive = p.status === "working" || p.status === "waiting";
            return (
              <g
                key={p.id}
                className={`wf-net-node ${p.isHub ? "hub" : ""} ${
                  isActive ? "active" : ""
                } status-${p.status}`}
                style={
                  {
                    "--delay": `${(s01 * 4).toFixed(2)}s`,
                    "--dur": `${(6 + s01 * 3).toFixed(2)}s`,
                  } as React.CSSProperties
                }
              >
                {/* the floating wrapper: CSS animates translate on this <g> */}
                <g className="wf-net-float">
                  {/* satellite workers fanned near the node */}
                  {nodeWorkers.slice(0, 5).map((w, i) => {
                    const n = Math.min(nodeWorkers.length, 5);
                    const spread = Math.PI * 0.9;
                    const base = -Math.PI / 2 - spread / 2;
                    const t =
                      n === 1 ? -Math.PI / 2 : base + (i / (n - 1)) * spread;
                    const sr = p.r + 20;
                    return (
                      <circle
                        key={w.id}
                        className="wf-net-sat"
                        cx={p.x + Math.cos(t) * sr}
                        cy={p.y + Math.sin(t) * sr}
                        r={4.5}
                      >
                        <title>{w.label ?? "worker"}</title>
                      </circle>
                    );
                  })}

                  {/* status pulse ring for working / waiting nodes */}
                  {alive && (
                    <circle
                      className="wf-net-pulse"
                      cx={p.x}
                      cy={p.y}
                      r={p.r + 6}
                      style={{ stroke: dotColor }}
                    />
                  )}

                  {/* the node body */}
                  <circle
                    className="wf-net-halo"
                    cx={p.x}
                    cy={p.y}
                    r={p.r + 4}
                  />
                  <circle className="wf-net-disc" cx={p.x} cy={p.y} r={p.r} />
                  {/* emoji (centered) */}
                  <text
                    className="wf-net-emoji"
                    x={p.x}
                    y={p.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize={p.isHub ? 30 : 24}
                  >
                    {p.emoji ?? "◆"}
                  </text>

                  {/* pending badge */}
                  {p.pending > 0 && (
                    <g className="wf-net-badge">
                      <circle
                        cx={p.x + p.r * 0.72}
                        cy={p.y - p.r * 0.72}
                        r={11}
                      />
                      <text
                        x={p.x + p.r * 0.72}
                        y={p.y - p.r * 0.72}
                        dominantBaseline="central"
                        textAnchor="middle"
                        fontSize={12}
                      >
                        {p.pending}
                      </text>
                    </g>
                  )}

                  {/* name + status dot below the node */}
                  <text
                    className="wf-net-name"
                    x={p.x}
                    y={p.y + p.r + 20}
                    textAnchor="middle"
                    fontSize={15}
                  >
                    {p.name}
                  </text>
                  <circle
                    className="wf-net-status-dot"
                    cx={p.x - measureLabel(p.statusLabel) / 2 - 8}
                    cy={p.y + p.r + 38}
                    r={4}
                    style={{ fill: dotColor }}
                  />
                  <text
                    className="wf-net-status"
                    x={p.x + 4}
                    y={p.y + p.r + 38}
                    textAnchor="middle"
                    fontSize={12}
                  >
                    {p.statusLabel}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* ── interaction layer: real, keyboard-accessible HTML buttons mapped 1:1
          over the (decorative) SVG. The wrapper matches the viewBox aspect ratio
          so percentage positions track node coordinates exactly under
          xMidYMid meet scaling. Each node is a <button> (click → open agent,
          hover/focus → popover); the popover carries "open" + optional "call". */}
        <div className="wf-net-layer">
          {placed.map((p) => {
            const isActive = active === p.id;
            const dotColor = statusColorVar(p.status);
            const below = p.y < vb.y + vb.h / 2; // flip popover down for top-half nodes
            const leftPct = ((p.x - vb.x) / vb.w) * 100;
            const topPct = ((p.y - vb.y) / vb.h) * 100;
            const sizePct = ((p.r + 26) * 2) / vb.w; // hit-area diameter fraction
            return (
              <div
                key={p.id}
                className="wf-net-hotspot"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${sizePct * 100}%`,
                  aspectRatio: "1",
                }}
              >
                <button
                  type="button"
                  className="wf-net-hit-btn"
                  aria-label={`${p.name}, ${p.statusLabel}. open agent`}
                  onClick={() => onSelectAgent(p.id)}
                  onMouseEnter={() => open(p.id)}
                  onMouseLeave={scheduleClose}
                  onFocus={() => open(p.id)}
                  onBlur={scheduleClose}
                />
                {isActive && (
                  <div
                    className={`wf-net-pop ${below ? "below" : "above"}`}
                    role="dialog"
                    aria-label={`${p.name} actions`}
                    onMouseEnter={() => open(p.id)}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="wf-net-pop-head">
                      <span className="wf-net-pop-emoji" aria-hidden="true">
                        {p.emoji ?? "◆"}
                      </span>
                      <span className="wf-net-pop-name">{p.name}</span>
                    </div>
                    <div className="wf-net-pop-meta">
                      <span
                        className="wf-net-pop-dot"
                        style={{ background: dotColor }}
                      />
                      {p.statusLabel}
                    </div>
                    <div className="wf-net-pop-actions">
                      <button
                        type="button"
                        className="wf-net-pop-btn"
                        onClick={() => onSelectAgent(p.id)}
                      >
                        open
                      </button>
                      {onCallAgent && (
                        <button
                          type="button"
                          className="wf-net-pop-btn ghost"
                          onClick={() => onCallAgent(p.id)}
                        >
                          call
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Rough label width (px in viewBox units) so the status dot sits just left of
// the centered status text. 12px font, ~6.4px/char average.
function measureLabel(s: string): number {
  return Math.max(8, s.length * 6.4);
}
