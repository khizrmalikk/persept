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
import type { NetworkAgent } from "./AgentNetwork2D";

// ── AgentOfficeIso ──────────────────────────────────────────────────────────
// A stylized TOP-DOWN ISOMETRIC office as the dashboard "office" centrepiece —
// a tidy little open-plan room where you watch the AI agents work and where
// their background workers (subagents) pop in beside them.
//
// WHY NON-WEBGL: the owner iterates this via headless screenshots, and a
// previous true-3D (three.js) version couldn't be previewed. This version is
// pure SVG isometric-projected polygons: crisp, animatable, scales to any
// container, and — crucially — every agent is a real focusable <button>.
//
// PROJECTION: standard 2:1 isometric. World is a floor grid on (x, y) with an
// up axis z (height). We project to screen with
//     sx = (x - y) * TILE_W / 2
//     sy = (x + y) * TILE_H / 2 - z * TILE_H     (z raises the point on screen)
// so tiles read as diamonds and taller objects sit visually "up". Objects are
// DEPTH-SORTED by (x + y) so nearer things draw on top and it reads correctly.
//
// COMPOSITION: a bone floor with a faint grid + a soft rug, a hint of two low
// back/left walls for depth, a round meeting table + a plant for life, and one
// desk per agent arranged on a tidy ring facing inward — the hub (Chief) at the
// back-centre "head" desk, a touch bigger. Each desk carries a monitor, a chair,
// a rounded character token showing the agent EMOJI, and a clean nameplate
// (name + status pill).
//
// STATUS → VISUAL: idle = calm. working = the monitor screen glows clay + a soft
// clay ring under the desk + a gentle bob. waiting = a clay attention pulse
// above the desk. error = muted red. offline = dimmed/desaturated.
//
// SUBAGENTS (the headline): running workers grouped by parent appear as small
// worker tokens fanned in front of their agent's desk — they POP in (scale/opacity)
// and animate OUT when they stop. Capped ~5/desk. CSS-driven so reduced-motion
// freezes everything while the scene stays fully rendered + clickable.

// ── projection constants (SVG user units) ──────────────────────────────────
const TILE_W = 120; // diamond tile width  (screen)
const TILE_H = 60; // diamond tile height (screen) → 2:1 iso
const HALF_W = TILE_W / 2;
const HALF_H = TILE_H / 2;

function iso(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * HALF_W, (x + y) * HALF_H - z * TILE_H];
}

// Diamond floor-tile polygon points, centred on world (x, y).
function diamond(x: number, y: number, z = 0): string {
  const c = iso(x, y, z);
  return [
    [c[0], c[1] - HALF_H],
    [c[0] + HALF_W, c[1]],
    [c[0], c[1] + HALF_H],
    [c[0] - HALF_W, c[1]],
  ]
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
}

// A raised iso box (cuboid) → returns the three visible faces as polygon
// point-strings. w/d are footprint (world units), h is height (world units).
// Anchored so (x, y) is the box CENTRE on the floor.
function box(x: number, y: number, w: number, d: number, h: number) {
  const hw = w / 2;
  const hd = d / 2;
  // four floor corners (world), then top corners are the same + height z=h
  const bt = iso(x, y - hd, h); // back-top of top face (north corner)
  const rt = iso(x + hw, y, h); // right (east)
  const ft = iso(x, y + hd, h); // front (south)
  const lt = iso(x - hw, y, h); // left (west)
  const rb = iso(x + hw, y, 0); // right base
  const fb = iso(x, y + hd, 0); // front base
  const lb = iso(x - hw, y, 0); // left base
  const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  return {
    top: [bt, rt, ft, lt].map(pt).join(" "),
    right: [rt, ft, fb, rb].map(pt).join(" "),
    left: [ft, lt, lb, fb].map(pt).join(" "),
  };
}

// ── palette (warm brand, from the .wf light theme) ──────────────────────────
const C = {
  floor: "#f0ebe3", // bone
  floorEdge: "#e6dfd4",
  grid: "rgba(23,20,15,0.05)",
  wall: "#e9e2d8",
  wallDark: "#ddd4c7",
  wood: "#b28a60", // desk top
  woodDark: "#9a744c", // desk side
  woodLeg: "#8a6740",
  chair: "#6f6154",
  chairDark: "#5b4e43",
  monitor: "#2a2620",
  monitorSide: "#1e1b16",
  screenIdle: "#cdd6d0",
  clay: "#cf5a34",
  clayDeep: "#a3421f",
  ok: "#2f7a4a",
  err: "#b33a2f",
  ink: "#17140f",
  inkSoft: "#57534e",
  inkFaint: "#8b8680",
  plant: "#5c7a52",
  plantDark: "#496343",
  pot: "#c08457",
  potDark: "#a06b42",
  shadow: "rgba(23,20,15,0.13)",
  token: "#ffffff",
} as const;

const MAX_DESKS = 12;
const MAX_WORKERS_PER_DESK = 5;

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

type DeskSlot = {
  agent: NetworkAgent;
  x: number; // world floor coord
  y: number;
  facing: "front" | "back" | "left" | "right"; // which way the character looks (inward)
  big: boolean; // hub gets a slightly larger desk
  depth: number; // x + y  (paint order)
};

function statusColor(status: NetworkAgent["status"]): string {
  switch (status) {
    case "working":
      return C.clay;
    case "waiting":
      return C.clay;
    case "error":
      return C.err;
    case "offline":
      return C.inkFaint;
    default:
      return C.inkFaint;
  }
}

// Arrange desks on a rounded ring inside the room, all facing the open centre.
// Hub sits at back-centre (north), a touch bigger; the rest sweep around the
// sides and front, skipping the hub's north arc so the head desk stays clear.
function placeDesks(agents: NetworkAgent[]): {
  slots: DeskSlot[];
  half: number;
} {
  const capped = agents.slice(0, MAX_DESKS);
  const hub =
    capped.find((a) => a.isHub) ??
    (capped[0] ? { ...capped[0], isHub: true } : null);
  const spokes = capped.filter((a) => a.id !== hub?.id);
  const n = spokes.length;

  // Room half-extent (world units) grows gently with roster size.
  const half = Math.min(6.5, Math.max(3.6, 2.9 + capped.length * 0.28));
  const ringR = half - 1.0;

  const slots: DeskSlot[] = [];

  if (hub) {
    slots.push({
      agent: hub,
      x: 0,
      y: -ringR,
      facing: "front",
      big: true,
      depth: 0 + -ringR,
    });
  }

  // Sweep spokes clockwise around the arc from just past north, skipping the
  // top ~0.16 so the hub's head desk isn't crowded.
  for (let i = 0; i < n; i++) {
    const t =
      Math.PI * 0.5 + // start pointing "down-ish"
      0.28 * Math.PI +
      (i / Math.max(1, n)) * (Math.PI * 2 - 0.56 * Math.PI);
    const x = Math.sin(t) * ringR;
    const y = -Math.cos(t) * ringR;
    // face inward: pick the dominant axis toward origin
    let facing: DeskSlot["facing"];
    if (Math.abs(x) > Math.abs(y)) facing = x > 0 ? "left" : "right";
    else facing = y > 0 ? "back" : "front";
    slots.push({
      agent: spokes[i],
      x,
      y,
      facing,
      big: false,
      depth: x + y,
    });
  }

  return { slots, half };
}

export function AgentOfficeIso({
  agents,
  workers = [],
  onSelectAgent,
  onCallAgent,
  className,
}: {
  agents: NetworkAgent[];
  workers?: ConstellationWorker[];
  onSelectAgent: (id: string) => void;
  onCallAgent?: (id: string) => void;
  className?: string;
}) {
  const rid = useId().replace(/:/g, "");
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(id);
  }, []);
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  }, []);

  const { slots, half } = useMemo(() => placeDesks(agents), [agents]);

  // Running workers grouped by parent (capped per desk, stable order).
  const workersByParent = useMemo(() => {
    const m = new Map<string, ConstellationWorker[]>();
    for (const w of workers) {
      if (w.status !== "running") continue;
      const arr = m.get(w.parentId);
      if (arr) {
        if (arr.length < MAX_WORKERS_PER_DESK) arr.push(w);
      } else m.set(w.parentId, [w]);
    }
    return m;
  }, [workers]);

  // Depth-sort desks so nearer (larger x+y) paint last / on top.
  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.depth - b.depth),
    [slots],
  );

  // ── viewBox: project the room bounds + a margin so the whole scene is framed
  //    with no dead space and scales to fit its container. ──────────────────
  const vb = useMemo(() => {
    const corners: [number, number][] = [
      iso(-half, -half),
      iso(half, -half),
      iso(half, half),
      iso(-half, half),
      // walls rise, characters/plants sit above the floor → pad top generously
      iso(-half, -half, 2.2),
      iso(half, -half, 2.2),
    ];
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const [cx, cy] of corners) {
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);
    }
    // extra headroom for floating nameplates
    const padX = 90;
    const padTop = 150;
    const padBottom = 96;
    return {
      x: minX - padX,
      y: minY - padTop,
      w: maxX - minX + padX * 2,
      h: maxY - minY + padTop + padBottom,
    };
  }, [half]);

  if (slots.length === 0) return null;

  // Floor tile grid (world integer-ish steps across the room).
  const gridLines: string[] = [];
  const step = 1;
  for (let g = -Math.ceil(half); g <= Math.ceil(half); g += step) {
    // lines parallel to x
    gridLines.push(
      `M ${iso(-half, g)[0].toFixed(1)} ${iso(-half, g)[1].toFixed(1)} L ${iso(half, g)[0].toFixed(1)} ${iso(half, g)[1].toFixed(1)}`,
    );
    gridLines.push(
      `M ${iso(g, -half)[0].toFixed(1)} ${iso(g, -half)[1].toFixed(1)} L ${iso(g, half)[0].toFixed(1)} ${iso(g, half)[1].toFixed(1)}`,
    );
  }

  const floorPoly = [
    iso(-half, -half),
    iso(half, -half),
    iso(half, half),
    iso(-half, half),
  ]
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");

  // Back walls (north + west), low, warm.
  const wallH = 1.15;
  const backWall = box(0, -half - 0.05, half * 2, 0.1, wallH);
  const leftWall = box(-half - 0.05, 0, 0.1, half * 2, wallH);

  return (
    <div className={`wf-officeiso ${className ?? ""}`}>
      <div
        className="wf-officeiso-box"
        style={{ "--iso-ar": vb.w / vb.h } as CSSProperties}
      >
        <svg
          className="wf-officeiso-svg"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${rid}-lit`} cx="50%" cy="30%" r="72%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id={`${rid}-rug`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(207,90,52,0.10)" />
              <stop offset="100%" stopColor="rgba(207,90,52,0.045)" />
            </linearGradient>
          </defs>

          {/* soft lit wash so the room reads as a stage, not a flat cut-out */}
          <rect
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
            fill={`url(#${rid}-lit)`}
          />

          {/* ── back walls (drawn first, behind the floor edge) ───────────── */}
          <polygon points={leftWall.top} fill={C.wallDark} />
          <polygon points={leftWall.right} fill={C.wall} />
          <polygon points={backWall.top} fill={C.wallDark} />
          <polygon points={backWall.right} fill={C.wall} />

          {/* ── floor ─────────────────────────────────────────────────────── */}
          <polygon
            points={floorPoly}
            fill={C.floor}
            stroke={C.floorEdge}
            strokeWidth={2}
          />
          {/* subtle grid */}
          <path
            d={gridLines.join(" ")}
            fill="none"
            stroke={C.grid}
            strokeWidth={1}
          />
          {/* centre rug */}
          <polygon
            points={[
              iso(-half * 0.42, -half * 0.42),
              iso(half * 0.42, -half * 0.42),
              iso(half * 0.42, half * 0.42),
              iso(-half * 0.42, half * 0.42),
            ]
              .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
              .join(" ")}
            fill={`url(#${rid}-rug)`}
            stroke="rgba(207,90,52,0.16)"
            strokeWidth={1.5}
          />

          {/* ── centre life: round meeting table + a plant (depth-placed) ──── */}
          <MeetingTable x={0} y={0} />
          <Plant x={half - 0.6} y={-half + 0.6} />

          {/* ── desks + agents, painted back-to-front ─────────────────────── */}
          {sortedSlots.map((slot) => {
            const workersHere = workersByParent.get(slot.agent.id) ?? [];
            return (
              <Desk
                key={slot.agent.id}
                slot={slot}
                workers={workersHere}
                active={active === slot.agent.id}
              />
            );
          })}
        </svg>

        {/* ── interaction layer: real keyboard-accessible buttons mapped 1:1
             over the (decorative) SVG. The box matches the viewBox aspect ratio,
             so % positions track projected desk coords exactly under
             xMidYMid meet scaling. Each desk = a <button> (click → open agent,
             hover/focus → popover). ─────────────────────────────────────── */}
        <div className="wf-officeiso-layer">
          {slots.map((slot) => {
            const p = slot.agent;
            const isActive = active === p.id;
            // hit centre = top of the character token above the desk
            const [hx, hy] = iso(slot.x, slot.y, 0.55);
            const leftPct = ((hx - vb.x) / vb.w) * 100;
            const topPct = ((hy - vb.y) / vb.h) * 100;
            const wPct = ((slot.big ? 132 : 112) / vb.w) * 100;
            const hPct = ((slot.big ? 128 : 108) / vb.h) * 100;
            const below = hy < vb.y + vb.h * 0.46;
            const dot = statusColor(p.status);
            return (
              <div
                key={p.id}
                className="wf-officeiso-hotspot"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${wPct}%`,
                  height: `${hPct}%`,
                }}
              >
                <button
                  type="button"
                  className={`wf-officeiso-hit ${isActive ? "active" : ""}`}
                  aria-label={`${p.name}, ${p.statusLabel}. open agent`}
                  onClick={() => onSelectAgent(p.id)}
                  onMouseEnter={() => open(p.id)}
                  onMouseLeave={scheduleClose}
                  onFocus={() => open(p.id)}
                  onBlur={scheduleClose}
                />
                {isActive && (
                  <div
                    className={`wf-officeiso-pop ${below ? "below" : "above"}`}
                    role="dialog"
                    aria-label={`${p.name} actions`}
                    onMouseEnter={() => open(p.id)}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="wf-officeiso-pop-head">
                      <span
                        className="wf-officeiso-pop-emoji"
                        aria-hidden="true"
                      >
                        {p.emoji ?? "◆"}
                      </span>
                      <span className="wf-officeiso-pop-name">{p.name}</span>
                    </div>
                    <div className="wf-officeiso-pop-meta">
                      <span
                        className="wf-officeiso-pop-dot"
                        style={{ background: dot }}
                      />
                      {p.statusLabel}
                    </div>
                    <div className="wf-officeiso-pop-actions">
                      <button
                        type="button"
                        className="wf-officeiso-pop-btn"
                        onClick={() => onSelectAgent(p.id)}
                      >
                        open
                      </button>
                      {onCallAgent && (
                        <button
                          type="button"
                          className="wf-officeiso-pop-btn ghost"
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

// ── a single desk: shadow + desk box + monitor + chair + character token +
//    subagent workers + a floating nameplate. All decorative SVG. ───────────
function Desk({
  slot,
  workers,
  active,
}: {
  slot: DeskSlot;
  workers: ConstellationWorker[];
  active: boolean;
}) {
  const p = slot.agent;
  const s01 = seed01(p.id);
  const scale = slot.big ? 1.14 : 1;
  const status = p.status;
  const working = status === "working";
  const waiting = status === "waiting";
  const error = status === "error";
  const offline = status === "offline";
  const dot = statusColor(status);

  // desk footprint (world units) — the desk sits a touch behind the character
  // (toward the wall the character faces away from) so the character reads as
  // seated at it, looking inward.
  const dw = 1.5 * scale;
  const dd = 0.82 * scale;
  const deskH = 0.46;

  // offset the desk from the seat centre depending on facing, so the desk is
  // between the character and the outer wall.
  const off = 0.5 * scale;
  let deskX = slot.x;
  let deskY = slot.y;
  if (slot.facing === "front") deskY = slot.y - off;
  else if (slot.facing === "back") deskY = slot.y + off;
  else if (slot.facing === "left") deskX = slot.x - off;
  else deskX = slot.x + off;

  const desk = box(deskX, deskY, dw, dd, deskH);
  const [screenX, screenY] = iso(deskX, deskY, deskH);

  // character token base position (on the floor at the seat centre)
  const [tokBaseX, tokBaseY] = iso(slot.x, slot.y, 0);

  // grounding shadow footprint (a flat diamond under seat + desk)
  const shadow = diamond(slot.x, slot.y, 0.001);

  return (
    <g
      className={`wf-desk status-${status} ${active ? "active" : ""} ${
        slot.big ? "hub" : ""
      }`}
      style={
        {
          "--d": `${(s01 * 1.6).toFixed(2)}s`,
          "--dur": `${(3.4 + s01 * 1.4).toFixed(2)}s`,
          opacity: offline ? 0.55 : 1,
          filter: offline ? "saturate(0.45)" : undefined,
        } as CSSProperties
      }
    >
      {/* grounding shadow */}
      <polygon className="wf-desk-shadow" points={shadow} fill={C.shadow} />

      {/* working ring on the floor under the desk */}
      {(working || waiting) && (
        <ellipse
          className="wf-desk-ring"
          cx={tokBaseX}
          cy={tokBaseY + 4}
          rx={HALF_W * 0.86}
          ry={HALF_H * 0.86}
          fill="none"
          stroke={dot}
          strokeWidth={2.5}
        />
      )}

      {/* the desk box */}
      <g className="wf-desk-body">
        <polygon points={desk.left} fill={C.woodDark} />
        <polygon points={desk.right} fill={C.woodDark} />
        <polygon points={desk.top} fill={C.wood} />
        {/* desk legs (thin dark posts at the two front-visible corners) */}
        <DeskLeg x={deskX} y={deskY} dw={dw} dd={dd} h={deskH} />
      </g>

      {/* monitor sitting on the desk (screen = the status signal) */}
      <Monitor x={screenX} y={screenY} working={working} error={error} />

      {/* the character token: a friendly rounded avatar with the agent emoji.
          The outer <g> carries the projected position; the inner bob wrapper
          carries the working animation so it composes cleanly. */}
      <g className="wf-token" transform={`translate(${tokBaseX} ${tokBaseY})`}>
        {/* chair back behind the token */}
        <Chair />
        <g className={`wf-token-bob ${working ? "working" : ""}`}>
          {/* body capsule */}
          <ellipse
            cx={0}
            cy={-14}
            rx={19 * scale}
            ry={22 * scale}
            fill={C.token}
            stroke="rgba(23,20,15,0.10)"
            strokeWidth={1.5}
          />
          {/* head circle carrying the emoji */}
          <circle
            cx={0}
            cy={-26 * scale}
            r={17 * scale}
            fill={C.token}
            stroke="rgba(23,20,15,0.10)"
            strokeWidth={1.5}
          />
          <text
            className="wf-token-emoji"
            x={0}
            y={-26 * scale}
            dominantBaseline="central"
            textAnchor="middle"
            fontSize={20 * scale}
          >
            {p.emoji ?? "◆"}
          </text>
        </g>

        {/* waiting: a clay attention pulse floating above the head */}
        {waiting && (
          <g
            className="wf-token-attn"
            transform={`translate(0 ${-52 * scale})`}
          >
            <circle className="wf-attn-pulse" r={9} fill="none" stroke={dot} />
            <circle r={5} fill={dot} />
            <text
              x={0}
              y={0.5}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={8}
              fill="#fff"
              fontWeight={700}
            >
              !
            </text>
          </g>
        )}
      </g>

      {/* subagent worker tokens fanned in front of the desk (toward centre) */}
      <WorkerSwarm slot={slot} workers={workers} />

      {/* floating nameplate above the character */}
      <g
        className="wf-nameplate"
        transform={`translate(${tokBaseX} ${tokBaseY - 78 * scale})`}
      >
        <NamePlate
          name={p.name}
          label={p.statusLabel}
          dot={dot}
          big={slot.big}
        />
      </g>
    </g>
  );
}

// two visible legs of the desk (front-left + front-right) as thin posts.
function DeskLeg({
  x,
  y,
  dw,
  dd,
  h,
}: {
  x: number;
  y: number;
  dw: number;
  dd: number;
  h: number;
}) {
  const hw = dw / 2;
  const hd = dd / 2;
  // Two short verticals from the front corners down to the floor — cheap + reads.
  const fl = iso(x - hw + 0.06, y + hd - 0.06, 0);
  const flTop = iso(x - hw + 0.06, y + hd - 0.06, h);
  const fr = iso(x + hw - 0.06, y + hd - 0.06, 0);
  const frTop = iso(x + hw - 0.06, y + hd - 0.06, h);
  return (
    <>
      <line
        x1={fl[0]}
        y1={fl[1]}
        x2={flTop[0]}
        y2={flTop[1]}
        stroke={C.woodLeg}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={fr[0]}
        y1={fr[1]}
        x2={frTop[0]}
        y2={frTop[1]}
        stroke={C.woodLeg}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  );
}

// A simple monitor: a dark stand + a screen plane that glows with status.
function Monitor({
  x,
  y,
  working,
  error,
}: {
  x: number;
  y: number;
  working: boolean;
  error: boolean;
}) {
  const screenFill = error ? C.err : working ? C.clay : C.screenIdle;
  return (
    <g
      className={`wf-monitor ${working ? "working" : ""}`}
      transform={`translate(${x} ${y - 6})`}
    >
      {/* stand */}
      <rect x={-2} y={-6} width={4} height={12} fill={C.monitorSide} rx={1} />
      {/* bezel — a small upright screen facing the camera/centre */}
      <rect
        x={-17}
        y={-34}
        width={34}
        height={26}
        rx={3}
        fill={C.monitor}
        stroke={C.monitorSide}
        strokeWidth={1}
      />
      {/* screen */}
      <rect
        className="wf-monitor-screen"
        x={-13.5}
        y={-30.5}
        width={27}
        height={19}
        rx={2}
        fill={screenFill}
        style={{ "--glow": working ? 1 : 0 } as CSSProperties}
      />
      {/* a couple of "content" bars on an active screen */}
      {(working || error) && (
        <g opacity={0.72}>
          <rect
            x={-9}
            y={-26}
            width={14}
            height={2.2}
            rx={1}
            fill="rgba(255,255,255,0.85)"
          />
          <rect
            x={-9}
            y={-21.5}
            width={10}
            height={2.2}
            rx={1}
            fill="rgba(255,255,255,0.6)"
          />
          <rect
            x={-9}
            y={-17}
            width={12}
            height={2.2}
            rx={1}
            fill="rgba(255,255,255,0.45)"
          />
        </g>
      )}
    </g>
  );
}

// A little chair drawn behind the character token (seat + back post).
function Chair() {
  return (
    <g className="wf-chair" opacity={0.9}>
      {/* seat */}
      <ellipse cx={0} cy={6} rx={20} ry={11} fill={C.chair} />
      <ellipse cx={0} cy={4} rx={20} ry={11} fill={C.chairDark} />
      {/* backrest suggestion */}
      <rect x={-15} y={-20} width={30} height={10} rx={5} fill={C.chairDark} />
    </g>
  );
}

// A round meeting table for life in the centre.
function MeetingTable({ x, y }: { x: number; y: number }) {
  const [cx, cy] = iso(x, y, 0);
  const [tx, ty] = iso(x, y, 0.42);
  return (
    <g className="wf-table">
      {/* shadow */}
      <ellipse
        cx={cx}
        cy={cy + 4}
        rx={HALF_W * 0.62}
        ry={HALF_H * 0.62}
        fill={C.shadow}
      />
      {/* pedestal */}
      <line
        x1={cx}
        y1={cy}
        x2={tx}
        y2={ty}
        stroke={C.woodLeg}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* table top */}
      <ellipse
        cx={tx}
        cy={ty}
        rx={HALF_W * 0.6}
        ry={HALF_H * 0.6}
        fill={C.wood}
        stroke={C.woodDark}
        strokeWidth={2}
      />
      <ellipse
        cx={tx}
        cy={ty - 2}
        rx={HALF_W * 0.6}
        ry={HALF_H * 0.6}
        fill={C.wood}
      />
    </g>
  );
}

// A potted plant.
function Plant({ x, y }: { x: number; y: number }) {
  const [cx, cy] = iso(x, y, 0);
  return (
    <g className="wf-plant" transform={`translate(${cx} ${cy})`}>
      <ellipse cx={0} cy={4} rx={16} ry={8} fill={C.shadow} />
      {/* pot */}
      <path
        d="M -11 -2 L 11 -2 L 8 16 L -8 16 Z"
        fill={C.pot}
        stroke={C.potDark}
        strokeWidth={1}
      />
      {/* foliage */}
      <circle cx={0} cy={-14} r={13} fill={C.plant} />
      <circle cx={-8} cy={-6} r={9} fill={C.plantDark} />
      <circle cx={9} cy={-7} r={8} fill={C.plant} />
      <circle cx={2} cy={-20} r={8} fill={C.plantDark} />
    </g>
  );
}

// A floating light nameplate chip (name + status pill).
function NamePlate({
  name,
  label,
  dot,
  big,
}: {
  name: string;
  label: string;
  dot: string;
  big: boolean;
}) {
  const nameW = Math.max(64, name.length * 8.2 + 24);
  const labelW = label.length * 6.2 + 22;
  const w = Math.max(nameW, labelW);
  return (
    <g>
      {/* connector stem */}
      <line
        x1={0}
        y1={26}
        x2={0}
        y2={40}
        stroke="rgba(23,20,15,0.14)"
        strokeWidth={1.5}
      />
      {/* card */}
      <rect
        className="wf-nameplate-card"
        x={-w / 2}
        y={-6}
        width={w}
        height={40}
        rx={9}
        fill="#ffffff"
        stroke="rgba(23,20,15,0.10)"
        strokeWidth={1}
      />
      <text
        x={0}
        y={7}
        textAnchor="middle"
        fontSize={big ? 12.5 : 11.5}
        fontWeight={600}
        fill={C.ink}
      >
        {name}
      </text>
      {/* status pill */}
      <circle cx={-labelW / 2 + 8} cy={22} r={3.4} fill={dot} />
      <text x={4} y={24} textAnchor="middle" fontSize={9.5} fill={C.inkSoft}>
        {label}
      </text>
    </g>
  );
}

// ── the subagent swarm: workers pop in beside the desk, potter, and pop out.
//    Placed in a fan on the floor toward the OPEN CENTRE from the seat, so they
//    read as "beside" the agent, not on top of the desk. Pop-in / pop-out is
//    CSS keyed off enter/exit classes; reduced-motion freezes them shown. ─────
function WorkerSwarm({
  slot,
  workers,
}: {
  slot: DeskSlot;
  workers: ConstellationWorker[];
}) {
  // fan the workers on the floor between the seat and the room centre.
  // direction toward origin:
  const dirX = slot.x === 0 ? 0 : -Math.sign(slot.x);
  const dirY = slot.y === 0 ? 0 : -Math.sign(slot.y);
  const list = workers.slice(0, MAX_WORKERS_PER_DESK);
  const n = list.length;

  return (
    <g className="wf-swarm">
      {list.map((w, i) => {
        // stagger a small arc of spots inward + sideways
        const along = 0.62 + (i % 2) * 0.34; // depth toward centre
        const side = ((i - (n - 1) / 2) * 0.42) / Math.max(1, 1); // spread
        // world spot: seat + inward*along + perpendicular*side
        const px = slot.x + dirX * along + (dirY !== 0 ? side : 0);
        const py = slot.y + dirY * along + (dirX !== 0 ? side : 0);
        const [sx, sy] = iso(px, py, 0);
        const seed = seed01(w.id);
        return (
          <g
            key={w.id}
            className="wf-worker"
            transform={`translate(${sx} ${sy})`}
            style={
              {
                "--wd": `${(seed * 1.2).toFixed(2)}s`,
                "--wdur": `${(2.2 + seed * 1.2).toFixed(2)}s`,
              } as CSSProperties
            }
          >
            {/* shadow (steady) */}
            <ellipse cx={0} cy={2} rx={10} ry={5} fill={C.shadow} />
            {/* pop wrapper (scale/opacity in) → nested potter (idle drift) */}
            <g className="wf-worker-pop">
              <g className="wf-worker-body">
                {/* small clay-tinted token */}
                <circle
                  cx={0}
                  cy={-8}
                  r={9}
                  fill="#fff"
                  stroke="rgba(207,90,52,0.55)"
                  strokeWidth={2}
                />
                <circle cx={0} cy={-8} r={3.4} fill={C.clay} />
              </g>
            </g>
            <title>{w.label ?? "worker"}</title>
          </g>
        );
      })}
    </g>
  );
}
