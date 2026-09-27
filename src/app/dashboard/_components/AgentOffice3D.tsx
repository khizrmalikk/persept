"use client";

/*
 * AgentOffice3D — the dashboard "office" centrepiece: a stylized, low-poly,
 * top-down/isometric 3D OFFICE ROOM (React-Three-Fiber) where you watch the AI
 * workforce work. Each agent "sits" at a desk around the room; when an agent
 * spawns background workers (subagents) small worker figures pop in near that
 * desk, potter about, and leave when the work is done.
 *
 * THEME — a bright, warm, LIGHT daytime office (this is a light-theme app, NOT a
 * dark scene). The canvas is transparent (clearAlpha 0) so the light dashboard
 * paper shows through, and the scene itself is built from warm neutrals: a bone
 * floor, soft clay-tinted low walls, wood-toned desks, off-white chairs. The
 * brand clay accent (#cf5a34) is reserved for ACTIVE/working state — a desk
 * monitor glows clay while its agent works. Colours are read on mount from the
 * dashboard-scoped CSS vars inside `.wf` (--hud-accent-rgb, --hud-text,
 * --hud-dim, --hud-bg) with LIGHT fallbacks so SSR / missing vars still render
 * the intended warm-light look.
 *
 * CAMERA — a fixed OrthographicCamera at a 3/4 top-down ISOMETRIC angle. Ortho
 * (not perspective) gives the clean, undistorted "tidy open-plan office" look
 * and frames the whole room predictably — important because the first feedback
 * is a STATIC SCREENSHOT. Gentle OrbitControls let the user look around (limited
 * polar angle + zoom so they can't flip under the floor or lose the room), but
 * the DEFAULT framing is deliberately great on its own.
 *
 * STATE -> VISUAL (per agent, see AgentDesk):
 *   idle    — calm: character still (a slow breath), monitor dim/off, no accent.
 *   working — the desk MONITOR glows clay + a soft clay indicator ring under the
 *             chair pulses, and the character does a gentle "typing" bob.
 *   waiting — a clay ATTENTION pulse floats above the desk (needs a human).
 *   error   — the monitor + indicator go a muted red; a tiny nervous jitter.
 *   offline — the whole desk group dims + desaturates; no motion.
 *
 * SUBAGENTS (the headline visual) — background workers (the `workers` prop,
 * grouped by parentId) render as small rounded worker tokens near their parent
 * agent's desk. A reconciliation manager diffs incoming worker ids each render:
 * NEW ids POP in (scale 0->1 with a springy overshoot); REMOVED ids animate OUT
 * (scale->0 + fade) before being pruned. Live workers potter with a gentle
 * bob/drift so the desk area feels busy but calm. Capped per-parent + overall.
 *
 * INTERACTION — hover a desk → it lifts + brightens and its nameplate emphasises;
 * CLICK a desk → onSelectAgent(id) (opens that agent's page). The nameplate
 * carries the affordance; the canvas is aria-hidden and the office page renders
 * the same agents as accessible controls elsewhere.
 *
 * ROBUSTNESS (this must NOT break — first feedback is a screenshot):
 *   - SSR-safe: the <Canvas> only mounts client-side (mounted state), so no WebGL
 *     runs on the server.
 *   - WebGL failure (context creation error OR context loss) → we render
 *     <AgentNetwork2D {...sameProps} /> as the fallback, so the office still shows
 *     the same agents + workers as a flat SVG network. Never a blank page.
 *   - dpr capped [1,2]; frameloop="demand" with a self-invalidating loop that
 *     PAUSES when the tab is hidden; every geometry/material/texture created here
 *     is disposed on unmount; worker + desk counts are capped.
 *   - prefers-reduced-motion: all motion freezes but the scene stays fully
 *     rendered + readable (a correct static arrangement), still clickable.
 *
 * NO new dependencies — three / @react-three/fiber / @react-three/drei only.
 */

import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  type JSX,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { ConstellationWorker } from "@/lib/workforce/types";
import { AgentNetwork2D, type NetworkAgent } from "./AgentNetwork2D";

const damp = THREE.MathUtils.damp;

// ---------------------------------------------------------------------------
// Public API — mirrors AgentNetwork2D so OfficeView can pass the SAME props.
// ---------------------------------------------------------------------------

export type OfficeStatus = "idle" | "working" | "waiting" | "error" | "offline";

type AgentOffice3DProps = {
  agents: NetworkAgent[];
  workers?: ConstellationWorker[];
  onSelectAgent: (id: string) => void;
  onCallAgent?: (id: string) => void;
  className?: string;
};

// Caps (perf + legibility).
const MAX_DESKS = 12; // beyond this the perimeter gets crowded; extra agents drop
const MAX_WORKERS_PER_PARENT = 5;
const MAX_WORKERS_TOTAL = 24;

// ---------------------------------------------------------------------------
// Palette — read the warm LIGHT theme from the wrapper's scoped `.wf` CSS vars.
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

type Palette = {
  ink: Rgb; // text / nameplate ink
  dim: Rgb; // muted / offline
  accent: Rgb; // clay — working / active highlight
  paper: Rgb; // page bg tone (nameplate chip base)
  error: Rgb; // muted red
  // Derived scene tones:
  floor: Rgb; // bone floor
  wall: Rgb; // soft warm wall
  wood: Rgb; // desk wood
  chair: Rgb; // off-white chair
  plant: Rgb; // muted sage-ish green (kept warm/neutral)
};

// LIGHT fallbacks so SSR / first paint / missing vars still render warm+light.
const FALLBACK: Palette = {
  ink: [23, 20, 15],
  dim: [139, 134, 128],
  accent: [207, 90, 52],
  paper: [251, 250, 248],
  error: [179, 58, 47],
  floor: [240, 235, 227],
  wall: [233, 226, 216],
  wood: [178, 138, 96],
  chair: [246, 243, 238],
  plant: [122, 142, 108],
};

function hexToRgb(hex: string): Rgb | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return [r, g, b];
}
function parseColour(raw: string): Rgb | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("#")) return hexToRgb(s);
  const m = s.match(/-?\d+(?:\.\d+)?/g);
  if (m && m.length >= 3) {
    const r = Math.round(Number.parseFloat(m[0]));
    const g = Math.round(Number.parseFloat(m[1]));
    const b = Math.round(Number.parseFloat(m[2]));
    if ([r, g, b].every((n) => !Number.isNaN(n))) return [r, g, b];
  }
  return null;
}
function readVar(el: HTMLElement, name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  return parseColour(raw) ?? fallback;
}
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}
const to01 = (rgb: Rgb): Rgb => [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
const col = (rgb: Rgb) => new THREE.Color(...to01(rgb));

function readPalette(el: HTMLElement | null): Palette {
  if (typeof document === "undefined" || !el) return FALLBACK;
  const accent = readVar(
    el,
    "--hud-accent-rgb",
    readVar(el, "--hud-node-rgb", FALLBACK.accent),
  );
  const ink = readVar(el, "--hud-text", FALLBACK.ink);
  const dim = readVar(el, "--hud-dim", FALLBACK.dim);
  const error = readVar(el, "--hud-err", FALLBACK.error);
  const paper = readVar(el, "--hud-bg", FALLBACK.paper);
  // Derive the warm scene tones from paper/ink/accent so the room always reads
  // as a cohesive family even if the theme shifts. Floor = paper nudged toward
  // ink (a warm bone); wall = a hair warmer/darker; wood/chair/plant fixed warm.
  const floor = mix(paper, ink, 0.09);
  const wall = mix(paper, ink, 0.13);
  const wood = mix([178, 138, 96], accent, 0.12);
  const chair = mix(paper, ink, 0.03);
  const plant: Rgb = [122, 142, 108];
  return { ink, dim, accent, paper, error, floor, wall, wood, chair, plant };
}

// ---------------------------------------------------------------------------
// Deterministic identity — a stable string hash so an agent's per-desk motion
// offsets (breath phase, tiny drift) are the SAME across every 6s server
// refresh. Never Math.random for identity (that would flicker on re-render).
// ---------------------------------------------------------------------------

function hashId(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function hash01(id: string, salt: number): number {
  return (hashId(`${id}#${salt}`) % 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Per-status visual profile — the single source of truth for state -> look.
// ---------------------------------------------------------------------------

type StatusProfile = {
  work: number; // 0..1 "typing"/monitor-on brightness (working)
  waitPulse: number; // 0..1 attention pulse above the desk (waiting)
  isError: boolean;
  dimAmt: number; // 0..1 how much the whole desk dims (offline)
  jitter: number; // px-ish nervous jitter (error)
  screen: (p: Palette) => Rgb; // monitor screen tint
};

function statusProfile(status: OfficeStatus): StatusProfile {
  switch (status) {
    case "working":
      return {
        work: 1,
        waitPulse: 0,
        isError: false,
        dimAmt: 0,
        jitter: 0,
        screen: (p) => p.accent,
      };
    case "waiting":
      return {
        work: 0.15,
        waitPulse: 1,
        isError: false,
        dimAmt: 0,
        jitter: 0,
        screen: (p) => p.accent,
      };
    case "error":
      return {
        work: 0.2,
        waitPulse: 0,
        isError: true,
        dimAmt: 0,
        jitter: 1,
        screen: (p) => p.error,
      };
    case "offline":
      return {
        work: 0,
        waitPulse: 0,
        isError: false,
        dimAmt: 1,
        jitter: 0,
        screen: (p) => p.dim,
      };
    default: // idle
      return {
        work: 0,
        waitPulse: 0,
        isError: false,
        dimAmt: 0,
        jitter: 0,
        screen: (p) => mix(p.paper, p.ink, 0.25),
      };
  }
}

// ---------------------------------------------------------------------------
// Layout — desks arranged tidily around the PERIMETER of a square room, facing
// inward toward the open centre (like the reference open-plan office). The hub
// (Chief) takes the "head" desk (back-centre, a touch larger). Room size scales
// gently with the roster so a small team isn't lost and a big team stays tidy.
// ---------------------------------------------------------------------------

type DeskSlot = {
  agent: NetworkAgent;
  pos: [number, number]; // x,z on the floor
  rotY: number; // yaw so the desk faces the room centre
  isHub: boolean;
};

type OfficeLayout = {
  desks: DeskSlot[];
  half: number; // half-extent of the room floor (walls sit at ±half)
  workerSpots: Map<string, [number, number][]>; // parentId → local spots (desk-relative, world coords precomputed per worker slot)
};

function useLayout(agents: NetworkAgent[]): OfficeLayout {
  return useMemo(() => {
    const capped = agents.slice(0, MAX_DESKS);
    if (capped.length === 0) {
      return { desks: [], half: 6, workerSpots: new Map() };
    }
    const hubIndex = Math.max(
      0,
      capped.findIndex((a) => a.isHub),
    );
    const hub = capped[hubIndex];
    const others = capped.filter((_, i) => i !== hubIndex);

    // Room grows a little with the roster so desks never crowd the walls.
    const n = capped.length;
    const half = Math.min(9, Math.max(5.2, 4.4 + n * 0.35));

    // We place desks on a rounded-rectangle "ring" just inside the walls, facing
    // the centre. The hub sits at the BACK-centre (the head of the room); the
    // rest distribute evenly around the remaining perimeter.
    const ringR = half - 1.35; // desk band sits inside the walls
    const desks: DeskSlot[] = [];

    // Hub: back-centre, facing the camera/centre (−z is "back").
    desks.push({
      agent: hub,
      pos: [0, -ringR],
      rotY: 0, // faces +z (toward the open centre / camera)
      isHub: true,
    });

    // Others: spread around the remaining ~300° of the ring (skip the top-centre
    // arc the hub occupies) so they fan down the two sides and across the front.
    const count = others.length;
    others.forEach((agent, i) => {
      // angle sweeps from just past the hub, around the sides, across the front.
      // 0 = back (−z). We start at ~40° and go around to ~320°, avoiding the hub.
      const t =
        count === 1 ? Math.PI : (0.16 + (i / count) * 0.68) * Math.PI * 2;
      const x = Math.sin(t) * ringR;
      const z = -Math.cos(t) * ringR;
      // face the centre: yaw so the desk's front (+z local) points at origin.
      const rotY = Math.atan2(x, z) + Math.PI;
      desks.push({ agent, pos: [x, z], rotY, isHub: false });
    });

    // Worker spots: a small fan of local offsets in front of each desk (toward
    // the room centre) where subagents cluster. Precompute a handful; the worker
    // manager assigns each live worker a slot index.
    const workerSpots = new Map<string, [number, number][]>();
    for (const d of desks) {
      const spots: [number, number][] = [];
      const [dx, dz] = d.pos;
      // direction from desk toward centre (unit)
      const len = Math.hypot(dx, dz) || 1;
      const inX = -dx / len;
      const inZ = -dz / len;
      // perpendicular (for fanning left/right)
      const perpX = -inZ;
      const perpZ = inX;
      for (let s = 0; s < MAX_WORKERS_PER_PARENT; s++) {
        const lane = s - (MAX_WORKERS_PER_PARENT - 1) / 2; // centred fan
        const fwd = 1.5 + (s % 2) * 0.55; // stagger depth so they don't line up
        spots.push([
          dx + inX * fwd + perpX * lane * 0.62,
          dz + inZ * fwd + perpZ * lane * 0.62,
        ]);
      }
      workerSpots.set(d.agent.id, spots);
    }

    return { desks, half, workerSpots };
  }, [agents]);
}

// ---------------------------------------------------------------------------
// Shared resources — geometries reused across every desk/character/worker.
// Created once, disposed on unmount.
// ---------------------------------------------------------------------------

type Resources = {
  // character
  head: THREE.SphereGeometry;
  // worker token
  workerBody: THREE.CapsuleGeometry;
  // props
  plantPot: THREE.CylinderGeometry;
  plantLeaf: THREE.IcosahedronGeometry;
  ring: THREE.RingGeometry; // floor indicator under working chairs
  softDot: THREE.Texture | null;
};

function makeSoftDot(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.6, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function useResources(): Resources {
  const head = useMemo(() => new THREE.SphereGeometry(0.34, 20, 20), []);
  const workerBody = useMemo(
    () => new THREE.CapsuleGeometry(0.18, 0.28, 6, 12),
    [],
  );
  const plantPot = useMemo(
    () => new THREE.CylinderGeometry(0.28, 0.34, 0.5, 16),
    [],
  );
  const plantLeaf = useMemo(() => new THREE.IcosahedronGeometry(0.5, 0), []);
  const ring = useMemo(() => new THREE.RingGeometry(0.66, 0.82, 40), []);
  const softDot = useMemo(() => makeSoftDot(), []);

  useEffect(() => {
    return () => {
      head.dispose();
      workerBody.dispose();
      plantPot.dispose();
      plantLeaf.dispose();
      ring.dispose();
      softDot?.dispose();
    };
  }, [head, workerBody, plantPot, plantLeaf, ring, softDot]);

  return { head, workerBody, plantPot, plantLeaf, ring, softDot };
}

// ---------------------------------------------------------------------------
// Room — the floor, low warm back+left walls (an open-plan corner so the front
// stays open to the camera), a soft baseboard, a rug in the centre, a couple of
// plants and a small round meeting/coffee table for life. Static (no motion).
// ---------------------------------------------------------------------------

function Room({
  palette,
  half,
  res,
}: {
  palette: Palette;
  half: number;
  res: Resources;
}) {
  const floorCol = useMemo(() => col(palette.floor), [palette.floor]);
  const wallCol = useMemo(() => col(palette.wall), [palette.wall]);
  const baseboardCol = useMemo(
    () => col(mix(palette.wall, palette.ink, 0.14)),
    [palette.wall, palette.ink],
  );
  const rugCol = useMemo(
    () => col(mix(palette.floor, palette.accent, 0.08)),
    [palette.floor, palette.accent],
  );
  const potCol = useMemo(
    () => col(mix(palette.wood, palette.ink, 0.1)),
    [palette.wood, palette.ink],
  );
  const leafCol = useMemo(() => col(palette.plant), [palette.plant]);
  const tableCol = useMemo(() => col(palette.wood), [palette.wood]);
  const tableTopCol = useMemo(
    () => col(mix(palette.chair, palette.wood, 0.2)),
    [palette.chair, palette.wood],
  );

  const wallH = 1.9;
  const wallT = 0.18;

  // plants sit in two back corners; table in the open centre.
  const plantPositions: [number, number][] = [
    [-half + 0.9, -half + 0.9],
    [half - 0.9, -half + 0.9],
  ];

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color={floorCol} roughness={0.95} />
      </mesh>

      {/* centre rug — a soft clay-tinted round mat for warmth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.4]}>
        <circleGeometry args={[half * 0.42, 48]} />
        <meshStandardMaterial color={rugCol} roughness={1} />
      </mesh>

      {/* back wall (−z) */}
      <mesh position={[0, wallH / 2, -half]} receiveShadow>
        <boxGeometry args={[half * 2, wallH, wallT]} />
        <meshStandardMaterial color={wallCol} roughness={0.9} />
      </mesh>
      {/* back baseboard */}
      <mesh position={[0, 0.09, -half + wallT * 0.5 + 0.005]}>
        <boxGeometry args={[half * 2, 0.18, 0.04]} />
        <meshStandardMaterial color={baseboardCol} roughness={0.9} />
      </mesh>

      {/* left wall (−x) */}
      <mesh position={[-half, wallH / 2, 0]} receiveShadow>
        <boxGeometry args={[wallT, wallH, half * 2]} />
        <meshStandardMaterial color={wallCol} roughness={0.9} />
      </mesh>
      {/* left baseboard */}
      <mesh position={[-half + wallT * 0.5 + 0.005, 0.09, 0]}>
        <boxGeometry args={[0.04, 0.18, half * 2]} />
        <meshStandardMaterial color={baseboardCol} roughness={0.9} />
      </mesh>

      {/* right wall (+x) — kept LOW (half height) so the room stays open/airy on
          the camera side and light floods in */}
      <mesh position={[half, wallH * 0.32, 0]} receiveShadow>
        <boxGeometry args={[wallT, wallH * 0.64, half * 2]} />
        <meshStandardMaterial color={wallCol} roughness={0.9} />
      </mesh>

      {/* plants in the back corners */}
      {plantPositions.map(([px, pz]) => (
        <group key={`plant-${px}-${pz}`} position={[px, 0, pz]}>
          <mesh geometry={res.plantPot} position={[0, 0.25, 0]} castShadow>
            <meshStandardMaterial color={potCol} roughness={0.85} />
          </mesh>
          <mesh
            geometry={res.plantLeaf}
            position={[0, 0.78, 0]}
            scale={[0.9, 1.15, 0.9]}
            castShadow
          >
            <meshStandardMaterial
              color={leafCol}
              roughness={0.85}
              flatShading
            />
          </mesh>
          <mesh
            geometry={res.plantLeaf}
            position={[0.16, 1.05, -0.05]}
            scale={0.6}
            castShadow
          >
            <meshStandardMaterial
              color={leafCol}
              roughness={0.85}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* central round meeting/coffee table */}
      <group position={[0, 0, 0.4]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} />
          <meshStandardMaterial color={tableCol} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.6, 12]} />
          <meshStandardMaterial color={tableCol} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.64, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.72, 0.08, 40]} />
          <meshStandardMaterial color={tableTopCol} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// AgentDesk — one desk + chair + monitor + a seated character token for an
// agent, plus its subagent workers. Owns its animated scalars (hover, work,
// wait, error jitter, dim) and lerps them each frame. Registers a click/hover
// target so the whole desk is interactive.
// ---------------------------------------------------------------------------

function AgentDesk({
  slot,
  palette,
  reduced,
  res,
  workers,
  workerSpots,
  hovered,
  onHover,
  onSelect,
}: {
  slot: DeskSlot;
  palette: Palette;
  reduced: boolean;
  res: Resources;
  workers: ConstellationWorker[];
  workerSpots: [number, number][];
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const { agent } = slot;
  const profile = useMemo(() => statusProfile(agent.status), [agent.status]);

  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const waitRef = useRef<THREE.Mesh>(null);
  const waitMat = useRef<THREE.MeshBasicMaterial>(null);

  // animated scalars
  const hoverAmt = useRef(0);
  const workAmt = useRef(profile.work);
  const waitAmt = useRef(profile.waitPulse);
  const dimAmt = useRef(profile.dimAmt);

  // per-identity motion offsets (stable across refreshes)
  const breathPhase = useMemo(
    () => hash01(agent.id, 1) * Math.PI * 2,
    [agent.id],
  );
  const breathRate = useMemo(() => 0.9 + hash01(agent.id, 2) * 0.4, [agent.id]);

  // colours
  const deskScale = slot.isHub ? 1.12 : 1;
  const bodyCol = useMemo(
    () => col(mix(palette.chair, palette.ink, slot.isHub ? 0.1 : 0.05)),
    [palette.chair, palette.ink, slot.isHub],
  );
  const chairCol = useMemo(
    () => col(mix(palette.chair, palette.ink, 0.16)),
    [palette.chair, palette.ink],
  );
  const deskCol = useMemo(() => col(palette.wood), [palette.wood]);
  const deskTopCol = useMemo(
    () => col(mix(palette.wood, palette.paper, 0.35)),
    [palette.wood, palette.paper],
  );
  const monitorFrame = useMemo(
    () => col(mix(palette.ink, palette.paper, 0.25)),
    [palette.ink, palette.paper],
  );
  const screenBase = useMemo(() => profile.screen(palette), [profile, palette]);
  const idleScreen = useMemo(
    () => mix(palette.paper, palette.ink, 0.22),
    [palette.paper, palette.ink],
  );
  const waitCol = useMemo(() => col(palette.accent), [palette.accent]);

  // static setup for reduced-motion (set the target look once, no rAF).
  useEffect(() => {
    if (!reduced) return;
    const w = profile.work;
    if (screenMat.current) {
      const c = mix(
        idleScreen,
        screenBase,
        Math.max(w, profile.isError ? 1 : profile.waitPulse * 0.6),
      );
      screenMat.current.color.set(...to01(c));
      screenMat.current.emissive.set(...to01(screenBase));
      screenMat.current.emissiveIntensity = 0.15 + w * 0.55;
    }
    if (ringMat.current)
      ringMat.current.opacity = w * 0.5 + profile.waitPulse * 0.3;
    if (waitMat.current) waitMat.current.opacity = profile.waitPulse * 0.7;
    if (groupRef.current) {
      const s = deskScale * (1 - profile.dimAmt * 0.04);
      groupRef.current.scale.setScalar(s);
    }
  }, [reduced, profile, screenBase, idleScreen, deskScale]);

  useFrame((state, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    hoverAmt.current = damp(hoverAmt.current, hovered ? 1 : 0, 10, dt);
    workAmt.current = damp(workAmt.current, profile.work, 4, dt);
    waitAmt.current = damp(waitAmt.current, profile.waitPulse, 4, dt);
    dimAmt.current = damp(dimAmt.current, profile.dimAmt, 3, dt);

    const w = workAmt.current;

    // desk lift + scale on hover
    if (groupRef.current) {
      const lift = hoverAmt.current * 0.14;
      groupRef.current.position.y = lift;
      const s =
        deskScale * (1 + hoverAmt.current * 0.03) * (1 - dimAmt.current * 0.04);
      groupRef.current.scale.setScalar(s);
    }

    // character breath + typing bob + error jitter
    if (characterRef.current) {
      const breath = Math.sin(t * breathRate + breathPhase) * 0.02;
      const typing = w * Math.sin(t * 9 + breathPhase) * 0.035;
      const jitter =
        profile.jitter > 0 ? Math.sin(t * 30 + breathPhase) * 0.012 : 0;
      characterRef.current.position.y = 0.62 + breath + typing;
      characterRef.current.position.x = jitter;
      characterRef.current.rotation.z = typing * 0.4;
    }

    // monitor screen: idle→base blend + emissive glow
    if (screenMat.current) {
      const lit = Math.max(w, profile.isError ? 0.9 : waitAmt.current * 0.6);
      const shimmer = 0.92 + Math.sin(t * 3 + breathPhase) * 0.08;
      const c = mix(idleScreen, screenBase, lit);
      screenMat.current.color.set(...to01(c));
      screenMat.current.emissive.set(...to01(screenBase));
      screenMat.current.emissiveIntensity =
        0.12 +
        w * 0.55 * shimmer +
        (profile.isError ? 0.35 : 0) +
        waitAmt.current * 0.25;
    }

    // floor indicator ring under the chair: pulses while working; steady soft
    // while waiting.
    if (ringMat.current) {
      const pulse = 0.35 + Math.sin(t * 2.4 + breathPhase) * 0.15;
      ringMat.current.opacity =
        w * (0.45 + pulse * 0.4) + waitAmt.current * 0.28;
      ringMat.current.color.set(
        ...to01(profile.isError ? palette.error : palette.accent),
      );
    }

    // waiting attention pulse floating above the desk
    if (waitRef.current && waitMat.current) {
      const bob = Math.sin(t * 2.2 + breathPhase) * 0.06;
      waitRef.current.position.y = 2.15 + bob;
      const p = 0.4 + Math.sin(t * 2.8 + breathPhase) * 0.35;
      waitMat.current.opacity = waitAmt.current * p;
      const sc = 1 + waitAmt.current * (0.2 + Math.sin(t * 2.8) * 0.15);
      waitRef.current.scale.setScalar(sc);
    }
  });

  return (
    <group
      position={[slot.pos[0], 0, slot.pos[1]]}
      rotation={[0, slot.rotY, 0]}
    >
      <group ref={groupRef}>
        {/* whole-desk interaction target (invisible), sized to cover desk+chair. */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F <mesh> is a 3D object, not a DOM element — pointer handlers are three.js raycast events, and the canvas is aria-hidden with an accessible fallback elsewhere. */}
        <mesh
          position={[0, 0.9, 0.1]}
          visible={false}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(agent.id);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(agent.id);
          }}
        >
          <boxGeometry args={[1.9, 1.9, 2.2]} />
        </mesh>

        {/* ── desk ─────────────────────────────────────────────── */}
        {/* desk top (in front of the chair, toward the room centre = +z local) */}
        <RoundedBox
          args={[1.7, 0.09, 0.72]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.78, 0.78]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={deskTopCol} roughness={0.55} />
        </RoundedBox>
        {/* desk legs */}
        {[
          [-0.78, 0.62],
          [0.78, 0.62],
          [-0.78, 0.94],
          [0.78, 0.94],
        ].map(([lx, lz]) => (
          <mesh key={`leg-${lx}-${lz}`} position={[lx, 0.39, lz]}>
            <boxGeometry args={[0.07, 0.78, 0.07]} />
            <meshStandardMaterial color={deskCol} roughness={0.7} />
          </mesh>
        ))}

        {/* monitor on the desk, facing the seated character (−z local) */}
        <group position={[0, 0.83, 0.92]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[0.02, 0.34, 0.02]} />
            <meshStandardMaterial color={monitorFrame} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.3, 0.06, 0.16]} />
            <meshStandardMaterial color={monitorFrame} roughness={0.6} />
          </mesh>
          {/* screen — tilts slightly toward the character; this glows clay when
              working. Front face (−z) shows the emissive glow. */}
          <group position={[0, 0.66, -0.02]} rotation={[0.12, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.72, 0.46, 0.04]} />
              <meshStandardMaterial color={monitorFrame} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, -0.025]}>
              <planeGeometry args={[0.62, 0.36]} />
              <meshStandardMaterial
                ref={screenMat}
                color={col(idleScreen)}
                emissive={col(screenBase)}
                emissiveIntensity={0.12}
                roughness={0.4}
                side={THREE.FrontSide}
              />
            </mesh>
          </group>
        </group>

        {/* ── chair ────────────────────────────────────────────── */}
        <group position={[0, 0, -0.05]}>
          {/* seat */}
          <RoundedBox
            args={[0.62, 0.12, 0.6]}
            radius={0.05}
            smoothness={3}
            position={[0, 0.46, 0]}
            castShadow
          >
            <meshStandardMaterial color={chairCol} roughness={0.7} />
          </RoundedBox>
          {/* backrest */}
          <RoundedBox
            args={[0.6, 0.6, 0.1]}
            radius={0.05}
            smoothness={3}
            position={[0, 0.78, -0.28]}
            castShadow
          >
            <meshStandardMaterial color={chairCol} roughness={0.7} />
          </RoundedBox>
          {/* chair post */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.44, 10]} />
            <meshStandardMaterial color={monitorFrame} roughness={0.6} />
          </mesh>
        </group>

        {/* ── character token (seated) ─────────────────────────── */}
        {/* a friendly rounded low-poly figure: capsule torso + sphere head */}
        <group ref={characterRef} position={[0, 0.62, -0.05]}>
          {/* torso */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <capsuleGeometry args={[0.24, 0.36, 6, 14]} />
            <meshStandardMaterial color={bodyCol} roughness={0.7} />
          </mesh>
          {/* head */}
          <mesh geometry={res.head} position={[0, 0.78, 0.02]} castShadow>
            <meshStandardMaterial
              color={col(mix(palette.chair, palette.wood, 0.35))}
              roughness={0.65}
            />
          </mesh>
        </group>

        {/* floor indicator ring under the chair (working / waiting glow) */}
        <mesh
          geometry={res.ring}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, -0.05]}
        >
          <meshBasicMaterial
            ref={ringMat}
            color={col(palette.accent)}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* waiting attention pulse floating above the desk */}
        <mesh ref={waitRef} position={[0, 2.15, 0.4]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshBasicMaterial
            ref={waitMat}
            color={waitCol}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* ── nameplate ────────────────────────────────────────── */}
        <Html
          position={[0, slot.isHub ? 2.5 : 2.25, 0.2]}
          center
          distanceFactor={9}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
          occlude={false}
        >
          <Nameplate
            agent={agent}
            palette={palette}
            hovered={hovered}
            hub={slot.isHub}
          />
        </Html>
      </group>

      {/* ── subagent workers (in world/desk-local space, in front of the desk) ── */}
      <WorkerSwarm
        workers={workers}
        spots={workerSpots}
        deskPos={slot.pos}
        deskRotY={slot.rotY}
        palette={palette}
        reduced={reduced}
        res={res}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Nameplate — a small floating HTML chip (emoji + name + status pill). Styled
// inline so it never depends on external CSS; reads as a clean light card.
// ---------------------------------------------------------------------------

function statusPill(
  status: OfficeStatus,
  palette: Palette,
): {
  label: string;
  color: string;
} {
  const rgb = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  switch (status) {
    case "working":
      return { label: "working", color: rgb(palette.accent) };
    case "waiting":
      return { label: "waiting", color: rgb(palette.accent) };
    case "error":
      return { label: "error", color: rgb(palette.error) };
    case "offline":
      return { label: "offline", color: rgb(palette.dim) };
    default:
      return { label: "idle", color: rgb(palette.dim) };
  }
}

function Nameplate({
  agent,
  palette,
  hovered,
  hub,
}: {
  agent: NetworkAgent;
  palette: Palette;
  hovered: boolean;
  hub: boolean;
}) {
  const rgb = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const pill = statusPill(agent.status, palette);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: hub ? "7px 12px" : "5px 10px",
        borderRadius: 12,
        background: rgb(palette.paper, 0.94),
        border: `1px solid ${hovered ? rgb(palette.accent, 0.6) : rgb(palette.ink, 0.12)}`,
        boxShadow: hovered
          ? `0 8px 22px -8px ${rgb(palette.ink, 0.35)}`
          : `0 4px 14px -8px ${rgb(palette.ink, 0.28)}`,
        transform: hovered ? "translateY(-2px)" : "none",
        transition:
          "transform .18s ease, border-color .18s ease, box-shadow .18s ease",
        fontFamily: "var(--font-display, system-ui), system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: hub ? 18 : 15, lineHeight: 1 }} aria-hidden>
        {agent.emoji ?? "◆"}
      </span>
      <span
        style={{
          fontSize: hub ? 14 : 12.5,
          fontWeight: 600,
          color: rgb(palette.ink),
          letterSpacing: "-0.01em",
        }}
      >
        {agent.name}
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10.5,
          color: rgb(palette.dim),
          paddingLeft: 6,
          borderLeft: `1px solid ${rgb(palette.ink, 0.1)}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: pill.color,
            boxShadow:
              agent.status === "working" || agent.status === "waiting"
                ? `0 0 6px ${pill.color}`
                : "none",
          }}
        />
        {pill.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkerSwarm — manages the subagent tokens for ONE parent desk. Diffs the
// incoming running-worker ids each render: new ids enter (scale 0→1 springy
// overshoot), removed ids exit (scale→0 + fade) then prune. Each live worker
// sits at an assigned fan slot in front of the desk and potters gently.
//
// NOTE: worker positions are computed in the PARENT desk's LOCAL space (the desk
// group is already positioned + rotated), so the spots' world coords are baked
// as desk-relative offsets; we convert the absolute floor spot back to local.
// ---------------------------------------------------------------------------

type WorkerVisual = {
  id: string;
  label: string | null;
  slot: number;
  phase: "enter" | "live" | "exit";
  born: number;
  scale: number; // damped
  opacity: number; // damped
};

function WorkerSwarm({
  workers,
  spots,
  deskPos,
  deskRotY,
  palette,
  reduced,
  res,
}: {
  workers: ConstellationWorker[];
  spots: [number, number][]; // absolute floor coords per slot
  deskPos: [number, number];
  deskRotY: number;
  palette: Palette;
  reduced: boolean;
  res: Resources;
}) {
  // Convert each absolute floor spot into the desk group's LOCAL frame (undo the
  // desk translation + rotation) so we can place workers inside the desk group.
  const localSpots = useMemo(() => {
    const [dx, dz] = deskPos;
    const cos = Math.cos(-deskRotY);
    const sin = Math.sin(-deskRotY);
    return spots.map(([sx, sz]) => {
      const rx = sx - dx;
      const rz = sz - dz;
      // rotate by −rotY (inverse of the group's +rotY)
      return [rx * cos - rz * sin, rx * sin + rz * cos] as [number, number];
    });
  }, [spots, deskPos, deskRotY]);

  // Running workers only, capped, in a stable order → assign slots by index.
  const running = useMemo(() => {
    return workers
      .filter((w) => w.status === "running")
      .slice(0, MAX_WORKERS_PER_PARENT);
  }, [workers]);

  // Reconciled visual list (persists across renders via ref).
  const visualsRef = useRef<WorkerVisual[]>([]);
  const [, force] = useState(0);
  const nowRef = useRef(0);

  useEffect(() => {
    const now = nowRef.current;
    const incoming = new Map(running.map((w, i) => [w.id, i]));
    const list = visualsRef.current;
    // mark exits
    for (const v of list) {
      if (!incoming.has(v.id) && v.phase !== "exit") {
        v.phase = "exit";
      }
    }
    // add / revive
    running.forEach((w, i) => {
      const existing = list.find((v) => v.id === w.id);
      if (existing) {
        existing.slot = i;
        existing.label = w.label;
        if (existing.phase === "exit") existing.phase = "live";
      } else {
        list.push({
          id: w.id,
          label: w.label,
          slot: i,
          phase: "enter",
          born: now,
          scale: 0.001,
          opacity: 0,
        });
      }
    });
    // total cap safety
    if (list.length > MAX_WORKERS_TOTAL) {
      list.splice(0, list.length - MAX_WORKERS_TOTAL);
    }
    force((n) => n + 1);
  }, [running]);

  const bodyCol = useMemo(
    () => col(mix(palette.accent, palette.paper, 0.15)),
    [palette.accent, palette.paper],
  );
  const headCol = useMemo(
    () => col(mix(palette.accent, palette.ink, 0.1)),
    [palette.accent, palette.ink],
  );

  // In reduced-motion, set worker scale/opacity to their resting state once.
  // `running` is the change signal — when the worker set changes under reduced
  // motion we must re-settle (revived → rest, removed → pruned immediately)
  // since no rAF loop is running to animate them out.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `running` is the change signal that re-settles the static (no-rAF) reduced-motion arrangement
  useEffect(() => {
    if (!reduced) return;
    for (const v of visualsRef.current) {
      v.scale = v.phase === "exit" ? 0 : 1;
      v.opacity = v.phase === "exit" ? 0 : 1;
    }
    // prune exits immediately in reduced mode
    visualsRef.current = visualsRef.current.filter((v) => v.phase !== "exit");
    force((n) => n + 1);
  }, [reduced, running]);

  return (
    <>
      {visualsRef.current.map((v) => (
        <WorkerToken
          key={v.id}
          visual={v}
          local={localSpots[v.slot] ?? localSpots[0] ?? [0, 1.5]}
          bodyCol={bodyCol}
          headCol={headCol}
          res={res}
          reduced={reduced}
          nowRef={nowRef}
          onPruned={(id) => {
            visualsRef.current = visualsRef.current.filter((x) => x.id !== id);
            force((n) => n + 1);
          }}
        />
      ))}
    </>
  );
}

function WorkerToken({
  visual,
  local,
  bodyCol,
  headCol,
  res,
  reduced,
  nowRef,
  onPruned,
}: {
  visual: WorkerVisual;
  local: [number, number];
  bodyCol: THREE.Color;
  headCol: THREE.Color;
  res: Resources;
  reduced: boolean;
  nowRef: React.MutableRefObject<number>;
  onPruned: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const phaseSeed = useMemo(
    () => hash01(visual.id, 1) * Math.PI * 2,
    [visual.id],
  );

  // static placement for reduced-motion
  useEffect(() => {
    if (!reduced) return;
    const g = groupRef.current;
    if (!g) return;
    g.position.set(local[0], 0, local[1]);
    g.scale.setScalar(visual.phase === "exit" ? 0 : 1);
    if (bodyMat.current) bodyMat.current.opacity = 1;
    if (headMat.current) headMat.current.opacity = 1;
  }, [reduced, local, visual.phase]);

  useFrame((state, delta) => {
    if (reduced) return;
    nowRef.current = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    const targetScale = visual.phase === "exit" ? 0 : 1;
    const targetOpacity = visual.phase === "exit" ? 0 : 1;

    // springy overshoot on enter via a slightly under-damped approach
    if (visual.phase === "enter") {
      visual.scale = damp(visual.scale, 1.12, 9, dt);
      if (visual.scale > 1.02) visual.phase = "live";
    } else {
      visual.scale = damp(visual.scale, targetScale, 8, dt);
    }
    visual.opacity = damp(visual.opacity, targetOpacity, 8, dt);

    const g = groupRef.current;
    if (g) {
      // gentle potter: bob + tiny circular drift around the assigned slot
      const bob = Math.abs(Math.sin(t * 3.2 + phaseSeed)) * 0.06;
      const dx = Math.sin(t * 0.8 + phaseSeed) * 0.08;
      const dz = Math.cos(t * 0.7 + phaseSeed) * 0.08;
      g.position.set(local[0] + dx, bob, local[1] + dz);
      g.scale.setScalar(Math.max(0.001, visual.scale));
      g.rotation.y = t * 0.6 + phaseSeed;
    }
    if (bodyMat.current) bodyMat.current.opacity = visual.opacity;
    if (headMat.current) headMat.current.opacity = visual.opacity;

    // prune once fully faded out
    if (visual.phase === "exit" && visual.scale < 0.04) {
      onPruned(visual.id);
    }
  });

  return (
    <group ref={groupRef} position={[local[0], 0, local[1]]}>
      {/* small rounded worker: capsule body + little head */}
      <mesh geometry={res.workerBody} position={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial
          ref={bodyMat}
          color={bodyCol}
          roughness={0.6}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshStandardMaterial
          ref={headMat}
          color={headCol}
          roughness={0.6}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene — assembles lights + room + desks + workers, and drives the demand
// render loop (self-invalidating; pauses when the tab is hidden). Reduced-motion
// paints a few static frames instead of looping.
// ---------------------------------------------------------------------------

function Scene({
  agents,
  workers,
  palette,
  reduced,
  onSelectAgent,
}: {
  agents: NetworkAgent[];
  workers: ConstellationWorker[];
  palette: Palette;
  reduced: boolean;
  onSelectAgent: (id: string) => void;
}) {
  const { desks, half, workerSpots } = useLayout(agents);
  const res = useResources();
  const { invalidate, gl } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // group workers by parent (running only), capped overall
  const workersByParent = useMemo(() => {
    const m = new Map<string, ConstellationWorker[]>();
    let total = 0;
    for (const w of workers) {
      if (w.status !== "running") continue;
      if (total >= MAX_WORKERS_TOTAL) break;
      const arr = m.get(w.parentId) ?? [];
      if (arr.length >= MAX_WORKERS_PER_PARENT) continue;
      arr.push(w);
      m.set(w.parentId, arr);
      total++;
    }
    return m;
  }, [workers]);

  // demand loop: self-invalidate each frame while visible; pause when hidden.
  useEffect(() => {
    if (reduced) {
      const rafs: number[] = [];
      let remaining = 3;
      const paint = () => {
        invalidate();
        remaining -= 1;
        if (remaining > 0) rafs.push(requestAnimationFrame(paint));
      };
      paint();
      return () => {
        for (const id of rafs) cancelAnimationFrame(id);
      };
    }
    let raf = 0;
    let running = true;
    const tick = () => {
      if (!running) return;
      invalidate();
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [invalidate, reduced]);

  // graceful WebGL context-loss handling (prevent the default crash; the wrapper
  // flips to the 2D fallback on the loss event too).
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost, false);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  // Shadow tuning: soft, light contact shadows — configured once.
  const dirRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* bright daytime lighting: strong warm ambient (keeps the light theme
          light — no moody shadows) + a soft key from upper-front-right for
          gentle contact shadows + a cool fill so shaded sides stay light. */}
      <ambientLight intensity={0.85} color={0xfff6ec} />
      <hemisphereLight
        intensity={0.55}
        color={0xffffff}
        groundColor={col(mix(palette.floor, palette.ink, 0.15))}
      />
      <directionalLight
        ref={dirRef}
        position={[half * 0.9, half * 1.8, half * 1.2]}
        intensity={1.15}
        color={0xfff2e2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0008}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -half * 1.6,
            half * 1.6,
            half * 1.6,
            -half * 1.6,
            0.5,
            half * 6,
          ]}
        />
      </directionalLight>
      {/* a low warm fill from the open (camera) side so nothing goes muddy */}
      <directionalLight
        position={[-half, half * 0.8, half * 1.6]}
        intensity={0.4}
        color={0xffe9d6}
      />

      {/* Isometric-ish orbit: limited polar so you can't flip under the floor,
          limited zoom so the room stays framed. The default camera (set on the
          Canvas) already frames it well; this just lets the user look around. */}
      <OrbitControls
        makeDefault
        target={[0, 0.6, 0.2]}
        enablePan={false}
        enableZoom
        enableRotate
        enableDamping={!reduced}
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.46}
        minZoom={0.55}
        maxZoom={1.9}
      />

      <Room palette={palette} half={half} res={res} />

      {desks.map((slot) => (
        <AgentDesk
          key={slot.agent.id}
          slot={slot}
          palette={palette}
          reduced={reduced}
          res={res}
          workers={workersByParent.get(slot.agent.id) ?? []}
          workerSpots={workerSpots.get(slot.agent.id) ?? []}
          hovered={hoveredId === slot.agent.id}
          onHover={setHoveredId}
          onSelect={onSelectAgent}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// AgentOffice3D — exported wrapper. SSR-safe (Canvas mounts client-only), and
// Error boundary around the <Canvas>: a WebGL context-creation throw (no GPU,
// blocked, broken driver) surfaces as a render error, which the preflight probe
// and onError don't always catch. This renders the 2D fallback instead so the
// office never blanks.
class CanvasBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// WebGL failure → the AgentNetwork2D fallback so the office never blanks.
// ---------------------------------------------------------------------------

export function AgentOffice3D({
  agents,
  workers = [],
  onSelectAgent,
  onCallAgent,
  className,
}: AgentOffice3DProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [palette, setPalette] = useState<Palette>(FALLBACK);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    // Pre-flight WebGL capability probe: if a context can't be created at all
    // (headless, no-GPU, old device, blocked), skip the Canvas entirely and go
    // straight to the 2D fallback. `onError`/`webglcontextlost` only cover a
    // context that was created then failed/lost — not creation failure itself.
    let webglOk = false;
    try {
      const probe = document.createElement("canvas");
      webglOk = !!(
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
      );
    } catch {
      webglOk = false;
    }
    if (!webglOk) {
      setWebglFailed(true);
      setMounted(true);
      return;
    }
    setPalette(readPalette(wrapperRef.current));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    setMounted(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
  };

  // SSR / pre-mount: an empty, correctly-sized, aria-hidden box (the ref is
  // attached so getComputedStyle resolves the scoped vars on mount).
  if (!mounted) {
    return (
      <div
        ref={wrapperRef}
        className={className}
        style={wrapperStyle}
        aria-hidden="true"
      />
    );
  }

  // WebGL fallback — reuse the existing flat SVG network with the SAME data so
  // the office still shows every agent + worker. Never a blank page.
  if (webglFailed) {
    return (
      <div ref={wrapperRef} className={className} style={wrapperStyle}>
        <AgentNetwork2D
          agents={agents}
          workers={workers}
          onSelectAgent={onSelectAgent}
          onCallAgent={onCallAgent}
        />
      </div>
    );
  }

  // The ortho camera framing that makes the DEFAULT static screenshot great: a
  // classic 3/4 top-down isometric look. Positioned up + toward +x/+z, aimed at
  // the room centre; `zoom` sized so the room fills the frame. drei/three read
  // the OrthographicCamera props off the Canvas `orthographic` shorthand.
  return (
    <div
      ref={wrapperRef}
      className={className}
      style={wrapperStyle}
      aria-hidden="true"
    >
      <CanvasBoundary
        fallback={
          <AgentNetwork2D
            agents={agents}
            workers={workers}
            onSelectAgent={onSelectAgent}
            onCallAgent={onCallAgent}
          />
        }
      >
        <Canvas
          dpr={[1, 2]}
          shadows
          frameloop="demand"
          orthographic
          camera={{
            position: [11, 11, 12],
            zoom: 44,
            near: 0.1,
            far: 200,
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0); // transparent — light paper shows through
          }}
          onError={() => setWebglFailed(true)}
        >
          <Scene
            agents={agents}
            workers={workers}
            palette={palette}
            reduced={reduced}
            onSelectAgent={onSelectAgent}
          />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}

export default AgentOffice3D;
