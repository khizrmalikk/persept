"use client";

/*
 * AgentConstellation — a "living network" of AI agents rendered in 3D, and a
 * sibling to the site's signature ApertureField. A hub node (the Chief of
 * Staff / orchestrator) sits at the centre; every other agent orbits it as a
 * spoke, joined to the hub by a faint ink edge. The whole group rotates very
 * slowly (an "ambient" breath), pausing on hover, and the camera eases toward
 * the pointer for a touch of parallax life. It is now the always-on centerpiece
 * of the dashboard — the canvas fills the viewport, so the layout radius and
 * node sizes scale with the roster to fill a large area without going sparse.
 *
 * THEME IS A FULLY LIGHT, PROFESSIONAL, MATTE "editorial" look. The canvas stays
 * transparent (gl alpha, clear alpha 0) so the light dashboard paper shows
 * through — we do NOT paint a scene background. Colours are read on mount from
 * the WRAPPER div's scoped CSS vars (--hud-node-rgb, --hud-accent-rgb,
 * --hud-text, --hud-dim, --hud-bg) inside `.wf`, with LIGHT fallbacks so
 * SSR/missing vars still render the light look. There is NO additive blending
 * anywhere — additive only works on dark; on a near-white page it washes to
 * nothing. Every layer uses NORMAL blending. Glow/halo/emissive-bloom are gone:
 * orbs are MATTE LIT spheres shaded by real lights (ambient + a soft key), so
 * they read as solid, softly-shaded balls (a light matte marble) with a shaded
 * dark side + a faint rim, NOT glowing points. Working/active nodes warm toward
 * the clay accent as MATTE brightness (a small emissive warm-up), never a halo.
 *
 * NODE STYLE — one cohesive matte "marble" for EVERY agent (no mismatched
 * polyhedra): a properly LIT sphere ORB core (scene lights give it a lit side →
 * terminator → soft-shaded side so it reads as a real 3D ball on white), a
 * faint fresnel ATMOSPHERE RIM at the silhouette (a slightly larger BackSide
 * sphere, NORMAL blend, dim) so the light-grey sphere separates from the white
 * page, plus a very soft grey drop-shadow/occlusion sprite BELOW the orb (matte,
 * normal blend, not a glow) so it reads as sitting in space rather than floating.
 * Idle orbs are a soft warm-grey matte; working/active warm slightly toward the
 * clay accent. The only per-agent variation is subtle: a slight size difference
 * and a gentle per-identity idle spin — so the agents read as a FAMILY, not
 * clones. The HUB is the same orb, just a touch larger, wrapped in a 3D "network
 * sphere" (a geodesic icosphere rendered as dots-at-vertices + connecting edges,
 * matte ink) that marks it as chief.
 *
 * STATE -> VISUAL MAPPING (see Node):
 *   idle    — calm: a soft warm-GREY matte marble (neutral, no warm-up), a slow
 *             per-identity spin + bob, faint ink edge (clearly less alive).
 *   working — a WARM-UP: the matte orb warms toward the clay accent and lifts a
 *             touch in matte brightness (a small emissive warm term on the lit
 *             surface), NO glow, NO expanding ring. The node shares the SAME calm
 *             idle spin/bob (it does NOT spin up, pop, lift or swell). A damped
 *             `work` scalar (0 idle → 1 working) eases the warm-up in/out. A very
 *             subtle steady warmth shimmer rides on top (never dipping toward 0).
 *             The fresnel rim is STATIC. The old breathing beacon, additive halo,
 *             wireframe shell and travelling edge energy pulse were all REMOVED.
 *   waiting — needs a human: the orb holds STEADY warm toward clay (a held
 *             "attention" warmth), NO ring, NO shimmer. Distinct from idle (grey)
 *             and working (which shimmers).
 *   error   — warms toward red (--hud-error) + a subtle positional jitter.
 *   offline — greyed / desaturated, no motion, edge nearly invisible.
 *
 * SUB-AGENTS (ephemeral helpers a parent spins up for a task): each renders as
 * a small STABLE "moon" attached to its parent — a small lit sibling marble (lit
 * matte sphere) at a mostly-FIXED fanned-out slot near the parent (siblings
 * fan out evenly; only a very slow, small drift, NO fast orbiting/darting),
 * tethered to the parent by a short visible clay cylinder. A reconciliation
 * manager diffs the incoming ids against an internal list every render: new ids
 * animate IN (scale 0->1 with a damped overshoot + a birth ring pulse); removed
 * ids are marked "exiting" and animate OUT (scale->0 + fade + collapse ring)
 * before being pruned. A subtle slow feed-pulse streams along the tether only
 * while the sub is `working`. Nothing pops.
 *
 * SEAMLESS TRANSITIONS: each node keeps animated scalars (activation, halo,
 * energy, jitter and per-channel RGB colour) that are lerped/damped toward
 * their status target every frame in useFrame. A status change grows/brightens
 * or shrinks/dims over ~0.6-1s, both directions.
 *
 * BACKGROUND / DEPTH — the scene is deliberately kept ALIVE and FULL on the
 * light page via three ambient layers (all subtle, all light-theme):
 *   GRID     — a receding perspective FLOOR grid beneath the net (drei <Grid>),
 *              faint ink lines with a radial distance fade so it melts out toward
 *              the edges/distance (a "command-centre" floor, never a hard table
 *              rim or a loud blueprint). Own group at origin; static.
 *   DUST     — TWO parallax layers of drifting motes filling the volume around
 *              the net so it never reads as three specks in a void: a FAR layer
 *              (many tiny, slow, faint warm-grey specks behind the net) + a NEAR
 *              layer (fewer, larger, faster, slightly clay-tinted motes closer to
 *              camera). The size/speed/tint difference reads as depth. NORMAL
 *              blend, low opacity but clearly VISIBLE now (the old single whisper
 *              layer was too faint to see). Own group at origin; capped < 400.
 *   MOTION   — the whole net slowly AUTO-ROTATES (a gentle ambient yaw) when the
 *              user isn't dragging (relinquished + eased back around OrbitControls),
 *              each node bobs, the hub's network-sphere spins, the connection
 *              edges shimmer, and the dust drifts — so nothing ever looks dead.
 *
 * SCALE / CAMERA — the net is deliberately SMALL in a BIG space (like the
 * inspiration): node sizes are shrunk and the orbit sits inside a far starfield.
 * The camera opens on a small-net-in-big-space framing and OrbitControls allows
 * zooming right IN to inspect a single orb or pulling WAY OUT to see the whole
 * field (see MIN/MAX_DISTANCE + the default camera position).
 *
 * ACCESSIBILITY / PERF: respects prefers-reduced-motion (renders a correct
 * static arrangement — lit spheres placed statically, sub-agents at rest, dust
 * static, working held steady-bright, chief network-sphere placed statically —
 * still clickable); caps dpr at [1,2]; pauses the render loop when the tab is
 * hidden; reuses shared geometries/materials where it can, instances the dust,
 * and disposes what it owns; guards WebGL context loss with a graceful fallback;
 * and is SSR-safe (all window/document/WebGL access is client-only). The canvas
 * is aria-hidden — the page renders the same data as a list.
 *
 * PERF CAPS: dust <= 400 instanced points; sub-agents capped at 6 per parent
 * and 40 overall (silent cap beyond that).
 */

import { Billboard, Grid, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type ComponentRef,
  type JSX,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { ConstellationWorker } from "@/lib/workforce/types";

// The OrbitControls instance type, resolved THROUGH drei (which owns three-stdlib)
// rather than importing "three-stdlib" directly — a direct import of that
// transitive dep fails under pnpm's isolated node_modules on Vercel.
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ConstellationStatus =
  | "idle"
  | "working"
  | "waiting"
  | "error"
  | "offline";

export type ConstellationAgent = {
  id: string;
  name: string;
  emoji: string | null;
  status: ConstellationStatus;
  isHub?: boolean; // the Chief of Staff / orchestrator, placed at the centre
};

export type ConstellationSubAgent = {
  id: string;
  parentId: string; // matches a ConstellationAgent.id
  label?: string | null;
  status?: "working" | "done" | "error"; // default "working"
};

type AgentConstellationProps = {
  agents: ConstellationAgent[];
  subAgents?: ConstellationSubAgent[]; // legacy — kept optional so nothing breaks
  // NEW — background workers (OpenClaw sub-agents). Each renders as a small
  // SATELLITE moon on its parent agent node. The app now feeds THIS prop (not
  // the legacy `subAgents`); workers reuse the same sub-agent moon machinery.
  // A worker's `id` is its session key; `status` is "running" | "done" (the app
  // only passes running workers or ones finished within the last ~10 min, then
  // drops them → the satellite fades OUT smoothly via reconciliation).
  subagents?: ConstellationWorker[];
  className?: string;
  onSelectAgent?: (id: string) => void; // called on node click
  // NEW — hover-call affordance. When present, hovering a node reveals a small
  // "call" button on its hover chip; clicking it calls onCallAgent(id) (and
  // stops propagation so it does NOT also trigger onSelectAgent navigation).
  // Wiring this to OfficeView's startCall(id) sets callAgentId → the node lights
  // up with the existing on-a-call ring + the CallPanel dock opens.
  onCallAgent?: (id: string) => void;
  // NEW — voice-call emphasis. `callAgentId` is the id of the ONE agent the
  // owner is currently in a voice call with (or null/undefined for none); that
  // node gets the "on a call" ring pulse + emphasis. `callSpeaking` is true while
  // that agent is speaking → the node warms brighter and pulses with speech
  // energy; false (agent silent / owner talking) → calm but the ring stays.
  callAgentId?: string | null;
  callSpeaking?: boolean;
  // NEW — focus / re-centre. When `focusAgentId` names an agent, the view
  // smoothly re-centres so THAT agent's node becomes the focal point in the
  // middle of the screen (the OrbitControls `target` eases toward the node's
  // current world position). null / undefined / the hub id → the target eases
  // back to the hub at the origin (the historical behaviour). While a NON-hub
  // agent is focused the ambient auto-rotate relaxes (like a user drag) so the
  // focused node is stationary and the target settles cleanly on it; the user
  // can still orbit/zoom. Reduced-motion snaps the target instead of easing.
  focusAgentId?: string | null;
};

// Map a background worker to the internal sub-agent shape so the existing moon
// machinery (fan-out placement, tether, enter/exit reconciliation, hover) can
// render it unchanged. running → "working" (bright accent, alive), done → "done"
// (fades to muted/dim, low opacity). The moon's colour treatment for these
// statuses is defined in SubAgentNode.targetColour().
function workerToSubAgent(w: ConstellationWorker): ConstellationSubAgent {
  return {
    id: w.id,
    parentId: w.parentId,
    label: w.label,
    status: w.status === "done" ? "done" : "working",
  };
}

// Caps (see file header).
const MAX_SUBAGENTS_PER_PARENT = 6;
const MAX_SUBAGENTS_TOTAL = 40;
// Dust: fine motes filling a sphere VOLUME around the origin, in TWO parallax
// layers so the space reads as populated with depth. A FAR layer (many tiny
// slow specks) sits behind the net; a NEAR layer (fewer, larger, faster,
// slightly clay-tinted) drifts closer to camera. Total capped well under 400.
const DUST_FAR_COUNT = 240;
const DUST_NEAR_COUNT = 90;
// Auto-rotate: a very slow ambient yaw of the whole net so it never looks dead.
// Relinquished to the user while they drag (see Scene), eased back after.
const AUTO_ROTATE_SPEED = 0.035; // rad/s

// ---------------------------------------------------------------------------
// Colour tokens (read from CSS custom properties on mount)
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

type Palette = {
  // Struct keys are kept the SAME so the rest of the file reads unchanged, but
  // their MEANING is now a LIGHT, matte, editorial palette:
  //   ink      → label/text tone + hub form (espresso near-black ink)
  //   inkFaint → muted / idle / offline / dim label tone (warm grey)
  //   accent   → the clay accent that working/active/call nodes warm toward
  //   paper    → label chip background (near-white light chip)
  //   error    → red (error tint)
  //   ember    → the IDLE orb tone — now a soft warm-GREY matte marble (NOT warm
  //              ember): a mid warm grey that reads as a solid light-grey ball
  //              on the near-white page.
  ink: Rgb;
  inkFaint: Rgb;
  accent: Rgb;
  paper: Rgb;
  error: Rgb;
  ember: Rgb;
};

// DARK "command deck" fallbacks — used when the scoped CSS vars are missing
// (SSR / first paint) so the glow-on-dark look renders regardless. On the warm
// near-black stage the meaning of each token flips to a LUMINOUS palette:
//   ink      → warm off-white (#eae3d8) — the GLOWING node/label tone. Nodes
//              self-illuminate as soft off-white orbs, so "ink" is now light.
//   inkFaint → warm dim (#8f8578) — muted/offline/dim label tone on dark.
//   accent   → clay (#d66a40) — working/active/call warm toward a clay glow.
//   paper    → the warm near-black stage (#191510) — used only as a label-chip
//              base (translucent dark chip) and to derive tints; NOT painted.
//   error    → red (error tint).
//   ember    → the IDLE orb tone — a warm off-white glow, dimmer than the label
//              off-white so idle reads calm but still luminous on dark.
const FALLBACK_PALETTE: Palette = {
  ink: [234, 227, 216], // warm off-white #eae3d8 (glowing nodes + labels)
  inkFaint: [143, 133, 120], // warm dim #8f8578 (idle/offline/dim labels)
  accent: [214, 106, 64], // clay #d66a40 (working / active / call glow)
  paper: [25, 21, 16], // warm near-black #191510 stage tone
  error: [214, 96, 82], // red (error tint) — a hair brighter to glow on dark
  ember: [214, 205, 190], // warm off-white idle marble (luminous, calm)
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

// Parse either a hex (#rrggbb) or an "r, g, b" / "rgb(r,g,b)" / rgba string.
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

function readVarColour(el: HTMLElement, name: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  return parseColour(raw) ?? fallback;
}

// Blend a toward b by t (0..1). Used to derive the ember from the accent.
function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Read the dashboard-scoped LIGHT theme from the component's WRAPPER element
// (which lives inside `.wf`), NOT document.documentElement, so the scoped vars
// actually resolve. All vars have sensible LIGHT fallbacks. The accent prefers
// --hud-accent-rgb, falling back to --hud-node-rgb (the historical name) then
// the light clay fallback. `paper` reads --hud-bg (the light page tone) so the
// hover chip sits on the same near-white surface as the page.
function readPalette(el: HTMLElement | null): Palette {
  if (typeof document === "undefined" || !el) return FALLBACK_PALETTE;
  const accent = readVarColour(
    el,
    "--hud-accent-rgb",
    readVarColour(el, "--hud-node-rgb", FALLBACK_PALETTE.accent),
  );
  const text = readVarColour(el, "--hud-text", FALLBACK_PALETTE.ink);
  const dim = readVarColour(el, "--hud-dim", FALLBACK_PALETTE.inkFaint);
  const error = readVarColour(el, "--hud-error", FALLBACK_PALETTE.error);
  const paper = readVarColour(el, "--hud-bg", FALLBACK_PALETTE.paper);
  // The IDLE marble on the DARK stage is a warm OFF-WHITE glow: it self-
  // illuminates (emissive) so it reads as a softly glowing orb hanging on the
  // near-black deck. It is derived from the glowing off-white node tone (`text`
  // → ink) nudged a hair toward the warm dim + a whisper of clay, so idle sits
  // calm and slightly dimmer than a fully-lit working orb — luminous, not neon.
  // Kept well away from full accent so idle never looks "working".
  const glowWhite = mixRgb(text, accent, 0.05); // off-white with a clay whisper
  const ember = mixRgb(glowWhite, dim, 0.14); // idle: luminous but calm

  return {
    ink: text,
    inkFaint: dim,
    accent,
    paper,
    error,
    ember,
  };
}

const to01 = (rgb: Rgb): Rgb => [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];

// ---------------------------------------------------------------------------
// Deterministic identity — a stable string hash so an agent's subtle per-node
// variation (size, ring tilt/phase, idle spin/bob) is the SAME across every
// 6-second server refresh. Never uses Math.random for identity (that would
// flicker on re-render). All agents now share ONE cohesive orb form; identity
// no longer picks a distinct geometry, only these gentle motion/shape offsets,
// so the roster reads as a family of glowing planets rather than mismatched
// shapes.
// ---------------------------------------------------------------------------

// FNV-1a-ish 32-bit string hash — small, deterministic, well-spread.
function hashId(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A stable 0..1 value from the hash, offset per channel so different signature
// parameters (axis, speed, phase) don't correlate.
function hash01(id: string, salt: number): number {
  return (hashId(`${id}#${salt}`) % 10000) / 10000;
}

type IdentitySignature = {
  axis: THREE.Vector3; // per-identity idle rotation axis
  spin: number; // per-identity idle rotation speed (rad/s)
  bobPhase: number; // per-identity bob offset
  bobRate: number; // per-identity bob frequency
  sizeVar: number; // subtle per-node size multiplier (~0.9..1.1)
};

function identitySignature(agent: ConstellationAgent): IdentitySignature {
  const ax = hash01(agent.id, 1) * 2 - 1;
  const ay = hash01(agent.id, 2) * 2 - 1;
  const az = hash01(agent.id, 3) * 2 - 1;
  const axis = new THREE.Vector3(ax, ay, az);
  if (axis.lengthSq() < 1e-4) axis.set(0, 1, 0);
  axis.normalize();
  return {
    axis,
    spin: 0.12 + hash01(agent.id, 4) * 0.22, // gentle idle rotation
    bobPhase: hash01(agent.id, 5) * Math.PI * 2,
    bobRate: 0.7 + hash01(agent.id, 6) * 0.5,
    // subtle family variation — never enough to make one orb look "different"
    sizeVar: 0.9 + hash01(agent.id, 7) * 0.2,
  };
}

// ---------------------------------------------------------------------------
// Per-status target profile — the single source of truth for the state->visual
// mapping. Every scalar here is lerped toward, never snapped.
// ---------------------------------------------------------------------------

type StatusTarget = {
  activation: number; // 0..1 overall liveliness (drives scale + brightness)
  halo: number; // 0..1 halo sprite opacity multiplier
  energy: number; // 0..1 how strongly the edge energy pulse flows to the hub
  steady: number; // 0..1 held "attention" brightness (waiting) — NO shimmer, NO ring
  jitter: number; // px-ish positional jitter amplitude (error)
  compute: number; // 0..1 working-ness → the light-up brightness (`work`)
  colour: (p: Palette) => Rgb; // base sphere colour target (0..255)
  edge: number; // 0..1 edge visibility multiplier
};

function statusTarget(status: ConstellationStatus): StatusTarget {
  switch (status) {
    case "working":
      return {
        activation: 1,
        halo: 1,
        energy: 1,
        steady: 0,
        jitter: 0,
        compute: 1,
        // brightens toward the clay accent
        colour: (p) => p.accent,
        edge: 1,
      };
    case "waiting":
      // needs a human: a bright, STEADY "attention" light-up — clearly lit
      // (as bright as working's peak) but with NO shimmer and NO ring. The
      // steady term drives the core emissive + halo high and constant, so it
      // stands out from idle (dim) and from working (which breathes/shimmers).
      return {
        activation: 1,
        halo: 1,
        energy: 0, // NO travelling energy — distinct from working
        steady: 1,
        jitter: 0,
        compute: 0,
        colour: (p) => p.accent,
        edge: 0.8,
      };
    case "error":
      return {
        activation: 0.5,
        halo: 0.3,
        energy: 0,
        steady: 0,
        jitter: 1, // subtle jitter
        compute: 0,
        colour: (p) => p.error,
        edge: 0.7,
      };
    case "offline":
      return {
        activation: 0.06, // very dim, tiny
        halo: 0,
        energy: 0,
        steady: 0,
        jitter: 0,
        compute: 0,
        colour: (p) => p.inkFaint,
        edge: 0.08, // edge nearly invisible
      };
    default: // idle — calm dim ember glow (warm, low, small)
      return {
        activation: 0.22,
        halo: 0,
        energy: 0,
        steady: 0,
        jitter: 0,
        compute: 0,
        colour: (p) => p.ember,
        edge: 0.5,
      };
  }
}

// ---------------------------------------------------------------------------
// Layout — hub at origin, spokes on an orbit ring with a little z depth. The
// radius and node sizes scale with the roster so a small team fills a big
// canvas and a large team stays legible.
// ---------------------------------------------------------------------------

type Placed = {
  agent: ConstellationAgent;
  position: THREE.Vector3;
  isHub: boolean;
};

type Layout = {
  hub: Placed | null;
  spokes: Placed[];
  radius: number;
  nodeScale: number; // multiplier applied to base node sizes
};

function useLayout(agents: ConstellationAgent[]): Layout {
  return useMemo(() => {
    if (agents.length === 0)
      return { hub: null, spokes: [], radius: 4.6, nodeScale: 1 };
    // hub = the isHub agent, else the first agent
    const hubIndex = Math.max(
      0,
      agents.findIndex((a) => a.isHub),
    );
    const hubAgent = agents[hubIndex];
    const spokeAgents = agents.filter((_, i) => i !== hubIndex);
    const count = spokeAgents.length;

    // The net is a CENTERED, DELIBERATE focal group: with only ~3 agents it must
    // still fill the frame and read as intentional, not three specks in a void.
    // The orbit ring is kept TIGHT (nodes cluster into a balanced constellation)
    // and only opens a little as the roster grows so nodes never crowd. The dust
    // volume scales off this radius.
    const radius = Math.min(5.4, Math.max(2.9, 2.3 + count * 0.42));
    // Nodes are LARGE enough to read as premium polished objects; they shrink a
    // touch as the roster grows so a big team stays airy and legible.
    const nodeScale = Math.max(0.82, Math.min(1.15, 1.22 - count * 0.03));

    const hub: Placed = {
      agent: hubAgent,
      position: new THREE.Vector3(0, 0, 0),
      isHub: true,
    };

    const spokes: Placed[] = spokeAgents.map((agent, i) => {
      const angle = count > 0 ? (i / count) * Math.PI * 2 : 0;
      // gentle, deterministic z depth so it reads as 3D without chaos
      const z = Math.sin(angle * 2.0 + i * 0.7) * (radius * 0.26);
      const y = Math.sin(angle) * radius;
      // widen the horizontal spread so the roster uses the width of the screen
      // (the office rails sit top-left/right; the wide constellation fills below)
      const x = Math.cos(angle) * radius * 1.55;
      return {
        agent,
        position: new THREE.Vector3(x, y, z),
        isHub: false,
      };
    });

    return { hub, spokes, radius, nodeScale };
  }, [agents]);
}

// ---------------------------------------------------------------------------
// Shared resources — geometries + halo/soft sprite textures reused by every
// node. Created once, disposed on unmount. Materials stay per-node because
// each animates its own colour/opacity.
// ---------------------------------------------------------------------------

type SharedResources = {
  // One cohesive orb core shared by EVERY agent (planet-like). Created once,
  // disposed once. `orb` is the solid emissive sphere. The hub reuses the same
  // orb (just scaled up), so there is no separate polyhedra library any more.
  // The per-node Saturn-like orbital ring was REMOVED — agents are nodes, not
  // planets — so no `orbitRing` geometry exists here.
  sphere: THREE.SphereGeometry; // unit sphere reused for beads/motes
  orb: THREE.SphereGeometry; // the node core (smooth glowing planet)
  rimShell: THREE.SphereGeometry; // slightly larger BackSide sphere → fresnel rim
  dotGeo: THREE.SphereGeometry; // tiny sphere for dust + hub network-sphere dots
  haloTexture: THREE.Texture | null;
  backdropTexture: THREE.Texture | null; // soft radial pool for the stage depth
  // Hub-only "network sphere": a geodesic icosphere marking the chief as a
  // sphere BUILT FROM CONNECTED NODES — a shared icosphere geometry gives its
  // unique vertices (dots, instanced) and its de-duplicated edges (thin lines).
  hubNet: {
    vertices: THREE.Vector3[]; // unique icosphere vertices (unit radius)
    edgesGeo: THREE.BufferGeometry; // LineSegments geometry along the icosphere edges
  };
  // In-scene HUD reticles — a thin unit RING (radius ~1) + a set of short
  // radial TICK marks around it (LineSegments), both unit-radius so a reticle
  // can be scaled per node/hub. Shared + disposed once. `dash` is a dashed
  // targeting ring (a second thin ring drawn dashed via a texture-free line
  // pattern — we approximate with a segmented ring geometry).
  reticleRing: THREE.RingGeometry; // a thin flat ring (billboarded)
  reticleTicks: THREE.BufferGeometry; // short radial ticks around the ring
};

function makeSoftDotTexture(): THREE.Texture | null {
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
  // soft accent halo — full at centre, fully transparent at the edge
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// A large, very-soft radial gradient texture used for the STAGE BACKDROP: a
// gentle warm pool of light behind the constellation so the off-white page reads
// as a lit stage with depth rather than a dead flat void. Warm near the centre,
// fully transparent at the edges, so it never draws a hard shape and never
// fights the overlay cards (it stays behind the group, low opacity). The colour
// is applied via the material tint; this texture is just the falloff (white →
// transparent) so it can be reused for a subtle grounding pool too.
function makeRadialSoftTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
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
  // a gentle plateau then a long, smooth falloff — no hard ring
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.28, "rgba(255,255,255,0.82)");
  g.addColorStop(0.62, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Build the hub-only "network sphere" data from an IcosahedronGeometry: its
// UNIQUE vertices (a small dot is drawn at each) and its DE-DUPLICATED edges
// (thin lines connecting the vertices) so it reads as a sphere built from
// connected nodes. Detail 1 → 42 vertices / 120 edges — enough to read as a
// geodesic net without clutter. Returns unit-radius data; scaled per-hub.
function makeHubNet(): {
  vertices: THREE.Vector3[];
  edgesGeo: THREE.BufferGeometry;
} {
  const ico = new THREE.IcosahedronGeometry(1, 1);
  const pos = ico.getAttribute("position") as THREE.BufferAttribute;

  // De-duplicate coincident vertices (Icosahedron is non-indexed, so faces
  // share positions) into a unique vertex list, keyed by rounded coordinates.
  const key = (x: number, y: number, z: number) =>
    `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
  const uniqueIndex = new Map<string, number>();
  const vertices: THREE.Vector3[] = [];
  const triIndices: number[] = []; // triangle corner → unique-vertex index
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = key(x, y, z);
    let idx = uniqueIndex.get(k);
    if (idx === undefined) {
      idx = vertices.length;
      uniqueIndex.set(k, idx);
      vertices.push(new THREE.Vector3(x, y, z));
    }
    triIndices.push(idx);
  }

  // Collect de-duplicated edges from the triangles (each edge stored once).
  const edgeSet = new Set<string>();
  const edgePositions: number[] = [];
  const addEdge = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const ek = `${lo}-${hi}`;
    if (edgeSet.has(ek)) return;
    edgeSet.add(ek);
    const va = vertices[lo];
    const vb = vertices[hi];
    edgePositions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  };
  for (let i = 0; i < triIndices.length; i += 3) {
    const a = triIndices[i];
    const b = triIndices[i + 1];
    const c = triIndices[i + 2];
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  ico.dispose(); // only needed to derive the data above

  const edgesGeo = new THREE.BufferGeometry();
  edgesGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(edgePositions, 3),
  );
  return { vertices, edgesGeo };
}

// Build a set of short RADIAL tick marks arranged around a unit circle (in the
// XY plane, unit radius) as a single LineSegments geometry — an in-scene HUD
// detail. `count` ticks, each a short segment from `inner` to `outer` radius,
// with every Nth tick (major) drawn a touch longer via `majorEvery`/`majorLen`.
// Unit-radius so a reticle can be scaled per node/hub; disposed once (shared).
function makeReticleTicks(
  count: number,
  inner: number,
  outer: number,
  majorEvery: number,
  majorOuter: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const isMajor = majorEvery > 0 && i % majorEvery === 0;
    const ro = isMajor ? majorOuter : outer;
    pts.push(ca * inner, sa * inner, 0, ca * ro, sa * ro, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function useSharedResources(): SharedResources {
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  // The single planet-like core, shared by every agent (hub included). Higher
  // segment count so the emissive orb reads smooth up close on zoom-in.
  const orb = useMemo(() => new THREE.SphereGeometry(1, 40, 40), []);
  // Slightly larger sphere rendered BackSide with a fresnel gradient material →
  // a soft atmosphere rim hugging the silhouette so the ball reads round + 3D.
  const rimShell = useMemo(() => new THREE.SphereGeometry(1.16, 40, 40), []);
  const dotGeo = useMemo(() => new THREE.SphereGeometry(1, 12, 12), []);
  const haloTexture = useMemo(() => makeSoftDotTexture(), []);
  const backdropTexture = useMemo(() => makeRadialSoftTexture(), []);
  // Hub-only connected-node sphere data (unique vertices + de-duped edges).
  const hubNet = useMemo(() => makeHubNet(), []);
  // In-scene HUD reticle geometry: a thin flat ring (unit radius) + a set of
  // short radial ticks around it. Both unit-radius, scaled per reticle.
  const reticleRing = useMemo(() => new THREE.RingGeometry(0.97, 1.0, 96), []);
  const reticleTicks = useMemo(
    () => makeReticleTicks(36, 1.04, 1.1, 3, 1.16),
    [],
  );

  useEffect(() => {
    return () => {
      sphere.dispose();
      orb.dispose();
      rimShell.dispose();
      dotGeo.dispose();
      haloTexture?.dispose();
      backdropTexture?.dispose();
      hubNet.edgesGeo.dispose();
      reticleRing.dispose();
      reticleTicks.dispose();
    };
  }, [
    sphere,
    orb,
    rimShell,
    dotGeo,
    haloTexture,
    backdropTexture,
    hubNet,
    reticleRing,
    reticleTicks,
  ]);

  return {
    sphere,
    orb,
    rimShell,
    dotGeo,
    haloTexture,
    backdropTexture,
    hubNet,
    reticleRing,
    reticleTicks,
  };
}

// A tiny fresnel rim material: on a BackSide sphere it tints only the edge
// where the surface faces away from the camera. On the DARK command-deck stage
// this is a BRIGHT halo GLOW hugging the silhouette — a light rim reads clearly
// on near-black (unlike on white, where it vanished), so each orb gets a soft
// luminous edge. ADDITIVE blending is now correct (glow adds light on the dark
// stage); the rim colour is the warm off-white / clay node tone at full
// brightness, not a darkened contour. No postprocessing, no new deps — just a
// small inline ShaderMaterial. Colour + strength are set per-frame.
function makeRimMaterial(colour: Rgb): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(...to01(colour)) },
      uStrength: { value: 0.7 },
      uPower: { value: 2.4 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      uniform vec3 uColor;
      uniform float uStrength;
      uniform float uPower;
      void main() {
        // BackSide: flip the normal so the fresnel term peaks at the silhouette
        float f = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir))), uPower);
        gl_FragColor = vec4(uColor * f * uStrength, f * uStrength);
      }
    `,
  });
}

const damp = THREE.MathUtils.damp;

// ---------------------------------------------------------------------------
// DustField — many SMALL points distributed through a sphere VOLUME (not a thin
// shell) around the scene origin (the OrbitControls target), each drifting very
// slowly so it reads as fine dust motes hanging in the air rather than
// stars/planets. One InstancedMesh of tiny soft dots, NORMAL blend on the light
// page, a faint warm GREY (a lerp of --hud-dim toward --hud-text so it's a
// whisper of texture, never dirt on white). Distribution + per-mote drift are
// deterministic (a small seeded PRNG) so the field is stable across the 6s
// refreshes. Lives in its OWN group at origin (see Scene) so orbiting the
// camera reads naturally. Positions are rewritten each frame with a small
// per-point sine drift (slow, low amplitude). Capped at DUST_COUNT (<= 400).
// ---------------------------------------------------------------------------

// Deterministic point INSIDE a sphere of the given radius (uniform-ish volume
// fill via cube-root radius weighting so motes aren't bunched at the centre).
function volumePoint(rnd: () => number, radius: number): THREE.Vector3 {
  const u = rnd();
  const v = rnd();
  const theta = u * Math.PI * 2;
  const z = v * 2 - 1; // cos(phi) uniform in [-1,1]
  const ring = Math.sqrt(Math.max(0, 1 - z * z));
  // cube root → uniform density through the VOLUME (not clustered near origin)
  const r = radius * Math.cbrt(rnd());
  return new THREE.Vector3(
    Math.cos(theta) * ring * r,
    Math.sin(theta) * ring * r,
    z * r,
  );
}

// One drifting-mote layer. Rendered by DustField twice (far + near) for parallax
// depth. Each mote wanders on a slow per-axis sine so the field reads as fine
// motes hanging in the air, never static grain. Deterministic seeding (per-layer
// PRNG seed) keeps the field stable across the 6s server refreshes.
function DustLayer({
  count,
  seed,
  minR,
  maxR,
  sizeMin,
  sizeMax,
  driftScale,
  speedScale,
  opacity,
  tint,
  reduced,
  dotGeo,
  radius,
  haloTexture,
}: {
  count: number;
  seed: number;
  minR: number; // inner radius of the volume shell (so motes surround the net)
  maxR: number;
  sizeMin: number;
  sizeMax: number;
  driftScale: number; // multiplier on drift amplitude
  speedScale: number; // multiplier on drift frequency
  opacity: number;
  tint: Rgb;
  reduced: boolean;
  dotGeo: THREE.BufferGeometry;
  radius: number;
  haloTexture: THREE.Texture | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // deterministic distribution + per-mote drift params (seeded PRNG)
  const seeds = useMemo(() => {
    const out: {
      pos: THREE.Vector3;
      size: number;
      amp: THREE.Vector3;
      freq: THREE.Vector3;
      phase: THREE.Vector3;
    }[] = [];
    let s = seed;
    const rnd = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = 0; i < count; i++) {
      // place in a spherical SHELL between minR..maxR so motes surround the net
      const dir = volumePoint(rnd, 1).normalize();
      const rr = minR + (maxR - minR) * Math.cbrt(rnd());
      const pos = dir.multiplyScalar(rr);
      const drift = radius * (0.03 + rnd() * 0.06) * driftScale;
      out.push({
        pos,
        size: radius * (sizeMin + rnd() * (sizeMax - sizeMin)),
        amp: new THREE.Vector3(
          drift * (0.6 + rnd()),
          drift * (0.6 + rnd()),
          drift * (0.6 + rnd()),
        ),
        // slow frequencies so the drift is a gentle wander, never a jitter
        freq: new THREE.Vector3(
          (0.06 + rnd() * 0.14) * speedScale,
          (0.06 + rnd() * 0.14) * speedScale,
          (0.06 + rnd() * 0.14) * speedScale,
        ),
        phase: new THREE.Vector3(
          rnd() * Math.PI * 2,
          rnd() * Math.PI * 2,
          rnd() * Math.PI * 2,
        ),
      });
    }
    return out;
  }, [
    count,
    seed,
    minR,
    maxR,
    sizeMin,
    sizeMax,
    driftScale,
    speedScale,
    radius,
  ]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint01 = useMemo(() => to01(tint), [tint]);

  // Write instance matrices at time `t` (drift applied). Static when reduced.
  const layout = (t: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < seeds.length; i++) {
      const sd = seeds[i];
      dummy.position.set(
        sd.pos.x + Math.sin(t * sd.freq.x + sd.phase.x) * sd.amp.x,
        sd.pos.y + Math.sin(t * sd.freq.y + sd.phase.y) * sd.amp.y,
        sd.pos.z + Math.sin(t * sd.freq.z + sd.phase.z) * sd.amp.z,
      );
      dummy.scale.setScalar(sd.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => {
    layout(0);
    if (matRef.current) matRef.current.opacity = opacity;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeds, opacity]);

  // gentle slow drift: rewrite positions each frame (cheap at <= 400 instances)
  useFrame((state) => {
    if (reduced) return;
    layout(state.clock.elapsedTime);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[dotGeo, undefined, count]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        ref={matRef}
        map={haloTexture ?? undefined}
        color={new THREE.Color(...tint01)}
        transparent
        opacity={opacity}
        depthWrite={false}
        // ADDITIVE on the dark stage → the motes read as glowing stars/specks
        // adding light to the near-black deck, not grey dust on paper.
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// DustField — TWO parallax layers of drifting motes filling the volume around
// the (small) net so the light scene feels POPULATED, not empty. The FAR layer
// is many tiny, slow, faint warm-grey specks sitting well behind the net; the
// NEAR layer is fewer, larger, a touch faster and slightly clay-tinted, drifting
// closer to the camera — the size/speed/tint difference reads as depth. Lives in
// its OWN group at origin (see Scene) so orbiting the camera reads naturally.
function DustField({
  palette,
  reduced,
  dotGeo,
  radius,
  haloTexture,
}: {
  palette: Palette;
  reduced: boolean;
  dotGeo: THREE.BufferGeometry;
  radius: number;
  haloTexture: THREE.Texture | null;
}) {
  // FAR motes: warm off-white STARS (the glowing node tone, slightly dimmed
  // toward the warm dim) — additive, so they read as faint points of light
  // scattered behind the net on the dark deck.
  const farTint = useMemo(
    () => mixRgb(palette.ink, palette.inkFaint, 0.3),
    [palette],
  );
  // NEAR motes: a few clay-tinted glowing specks (off-white lerped toward the
  // accent) so the near field carries the brand warmth and separates from the
  // far field's cooler off-white.
  const nearTint = useMemo(
    () => mixRgb(palette.ink, palette.accent, 0.5),
    [palette],
  );

  return (
    <group>
      {/* FAR — many tiny slow specks well behind + around the net */}
      <DustLayer
        count={DUST_FAR_COUNT}
        seed={74747}
        minR={radius * 1.6}
        maxR={radius * 5.2}
        sizeMin={0.007}
        sizeMax={0.016}
        driftScale={0.8}
        speedScale={0.85}
        opacity={0.55}
        tint={farTint}
        reduced={reduced}
        dotGeo={dotGeo}
        radius={radius}
        haloTexture={haloTexture}
      />
      {/* NEAR — fewer, larger, faster, clay-tinted motes closer to camera */}
      <DustLayer
        count={DUST_NEAR_COUNT}
        seed={20261}
        minR={radius * 1.2}
        maxR={radius * 3.0}
        sizeMin={0.02}
        sizeMax={0.038}
        driftScale={1.9}
        speedScale={1.6}
        opacity={0.5}
        tint={nearTint}
        reduced={reduced}
        dotGeo={dotGeo}
        radius={radius}
        haloTexture={haloTexture}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// StageBackdrop — a large, very-soft radial pool of warm light billboarded
// behind the constellation so the off-white page reads as a LIT STAGE with
// depth, not a dead flat void. It is deliberately huge and faint: a gentle warm
// glow blooms from behind the group and falls off to nothing well before the
// edges, so it adds atmosphere without ever drawing a shape or fighting the
// overlay cards. NORMAL blend (additive would vanish on white), depthWrite off,
// rendered FIRST (low renderOrder) so every node sits in front of it. Static —
// no per-frame work; billboarded once via drei so it always faces the camera.
// Warm tint = a soft blend of the paper toward the clay accent (barely-there).
// ---------------------------------------------------------------------------

function StageBackdrop({
  palette,
  radius,
  backdropTexture,
}: {
  palette: Palette;
  radius: number;
  backdropTexture: THREE.Texture | null;
}) {
  // On the DARK deck the pool is a warm clay/off-white BLOOM: a soft glow of
  // warm light blooming from behind the net so the near-black stage reads as a
  // lit command deck with depth, never a dead flat void. Tint = the clay accent
  // pulled toward the off-white node tone so it's "warm light", not a coloured
  // disc; ADDITIVE so it adds a gentle glow to the deck (never a grey plate).
  const glowTint = useMemo(
    () => to01(mixRgb(palette.accent, palette.ink, 0.45)),
    [palette],
  );
  if (!backdropTexture) return null;
  // scale the pool to comfortably surround the net; pushed back in z so it sits
  // clearly behind the group and reads as depth.
  const size = radius * 7.5;
  return (
    <Billboard position={[0, 0, -radius * 1.4]} renderOrder={-10}>
      <mesh scale={[size, size * 0.82, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={backdropTexture}
          color={new THREE.Color(...glowTint)}
          transparent
          opacity={0.28}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}

// ---------------------------------------------------------------------------
// SceneGrid — a subtle receding perspective FLOOR grid beneath the constellation
// that gives the light scene depth and a "command-centre" floor without ever
// reading as a hard table edge or a loud blueprint. Uses drei's <Grid> (a single
// shader-plane, no per-frame work) with a radial distance fade so the lines melt
// out toward the edges + distance. Very faint ink lines on the near-white page
// (cellColor slightly lighter than the sectionColor major lines). Positioned as
// a floor a little below the net origin, sized to comfortably surround it. Lives
// in its OWN group at origin (outside the rotating node group) so orbiting the
// camera reads as looking around a fixed floor. Static — no rAF; it stays under
// reduced-motion so the scene still reads rich when motion is off.
// ---------------------------------------------------------------------------

function SceneGrid({ palette, radius }: { palette: Palette; radius: number }) {
  // GLOWING floor lines on the dark deck: warm off-white cell lines rising out
  // of the near-black stage (paper → ink), kept faint so the grid is a receding
  // command-deck floor, not a loud blueprint. Major (section) lines are a touch
  // stronger AND warmed toward the clay accent so the deck reads warm, not cold.
  const cellColor = useMemo(
    () => `rgb(${mixRgb(palette.paper, palette.ink, 0.22).join(",")})`,
    [palette],
  );
  const sectionColor = useMemo(
    () =>
      `rgb(${mixRgb(palette.paper, mixRgb(palette.ink, palette.accent, 0.4), 0.4).join(",")})`,
    [palette],
  );
  // floor sits a little below the net so nodes read as hovering above it; the
  // grid extends well past the spokes and fades out long before its edge.
  const floorY = -radius * 0.95;
  const gridSize = radius * 12;
  return (
    <group position={[0, floorY, 0]}>
      <Grid
        args={[gridSize, gridSize]}
        cellSize={radius * 0.5}
        cellThickness={0.6}
        cellColor={cellColor}
        sectionSize={radius * 2}
        sectionThickness={1}
        sectionColor={sectionColor}
        // radial distance fade → the grid melts out toward the edges + distance
        // so it never draws a hard table rim or fights the overlay cards.
        fadeDistance={radius * 9}
        fadeStrength={2}
        fadeFrom={0}
        // always face the camera-ish behaviour off; keep it a true floor. The
        // grid material is transparent + depthWrite off so nodes/dust in front
        // are never occluded by the floor plane.
        followCamera={false}
        infiniteGrid={false}
        side={THREE.DoubleSide}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Edge — a thin, low-opacity INK/GREY line hub<->node (NOT glowing). Purely
// structural: its opacity tracks the node's edge visibility (fainter when idle,
// a touch stronger when active). NORMAL blend, dim, so it reads as a hairline
// connector on the light page. The travelling "energy" pulse/bead that used to
// run along a WORKING node's edge was REMOVED — working now changes matte warmth
// only on the orb, with NO travelling motion on its edge.
// ---------------------------------------------------------------------------

function Edge({
  from,
  to,
  palette,
  target,
  reduced,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  palette: Palette;
  target: StatusTarget;
  reduced: boolean;
}) {
  const lineMat = useRef<THREE.LineBasicMaterial>(null);

  // animated scalar
  const edgeVis = useRef(target.edge);
  // a stable per-edge phase so the connectors don't all shimmer in lockstep —
  // derived from the endpoint so it's deterministic across the 6s refreshes.
  const shimmerPhase = useMemo(
    () => (to.x * 12.9898 + to.y * 78.233 + to.z * 37.719) % (Math.PI * 2),
    [to],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [from.x, from.y, from.z, to.x, to.y, to.z],
        3,
      ),
    );
    return g;
  }, [from, to]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // edges are LUMINOUS warm-off-white hairlines on the dark deck (the glowing
  // node tone, warmed a touch toward clay) — additive, so they read as glowing
  // connectors linking the orbs to the hub, clearly visible on near-black.
  const edge01 = useMemo(
    () => to01(mixRgb(palette.ink, palette.accent, 0.28)),
    [palette],
  );

  // static render for reduced motion — set once from the target. Low opacity so
  // the connector stays a glowing hairline, not a bold spoke.
  useEffect(() => {
    if (!reduced) return;
    if (lineMat.current) lineMat.current.opacity = 0.14 + target.edge * 0.28;
  }, [reduced, target.edge]);

  useFrame((state, delta) => {
    if (reduced) return;
    edgeVis.current = damp(edgeVis.current, target.edge, 3, delta);
    if (lineMat.current) {
      // a gentle shimmer rides on the base opacity so the connectors read as
      // quietly alive (a soft breathing highlight), never dipping so far that
      // the hairline vanishes. Subtle — it should whisper, not blink.
      const shimmer =
        0.85 + Math.sin(state.clock.elapsedTime * 1.1 + shimmerPhase) * 0.15;
      lineMat.current.opacity = (0.13 + edgeVis.current * 0.28) * shimmer;
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        ref={lineMat}
        color={new THREE.Color(...edge01)}
        transparent
        opacity={0.14 + target.edge * 0.28}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ---------------------------------------------------------------------------
// HubNetSphere — the coordinator's signature: a 3D "network sphere" wrapping
// the hub's core orb, marking it as chief. Built from a geodesic icosphere
// (see makeHubNet): a small dot at each unique VERTEX (one InstancedMesh) and
// thin LINES along the de-duplicated edges (one LineSegments), so it reads as
// a sphere BUILT FROM CONNECTED NODES. Its radius is a bit larger than the hub
// orb so it encloses it. Matte INK-toned + subtle (NORMAL blend, dim so it reads
// as a fine ink net on the light page, not a glow). Motion is minimal —
// STATIC by default (the owner disliked the old constantly-spinning ring); a
// VERY slow rotation is applied only when not reduced-motion, small enough to
// read as "alive" without spinning. Geometry is shared/owned by resources; the
// two materials here are owned + disposed on unmount.
// ---------------------------------------------------------------------------

function HubNetSphere({
  baseSize,
  palette,
  reduced,
  hubNet,
  dotGeo,
}: {
  baseSize: number;
  palette: Palette;
  reduced: boolean;
  hubNet: SharedResources["hubNet"];
  dotGeo: THREE.BufferGeometry;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dotsRef = useRef<THREE.InstancedMesh>(null);
  const dotsMat = useRef<THREE.MeshBasicMaterial>(null);
  const linesMat = useRef<THREE.LineBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // the chief's net GLOWS on the dark deck: a warm off-white lattice (the node
  // tone, nudged a touch toward clay) — additive, so the hub's network-sphere
  // reads as a fine luminous geodesic net enclosing the chief orb.
  const netInk = useMemo(
    () => to01(mixRgb(palette.ink, palette.accent, 0.22)),
    [palette],
  );

  // encloses the hub orb (orb is scaled by ~baseSize*(0.72..1.2)); the net sits
  // a little outside it so the orb reads as being "held" inside the sphere.
  const netRadius = baseSize * 1.55;
  const dotCount = hubNet.vertices.length;

  // place a small dot at each unique icosphere vertex
  const layout = () => {
    const mesh = dotsRef.current;
    if (!mesh) return;
    for (let i = 0; i < dotCount; i++) {
      const v = hubNet.vertices[i];
      dummy.position.set(v.x * netRadius, v.y * netRadius, v.z * netRadius);
      dummy.scale.setScalar(baseSize * 0.07);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => {
    layout();
    // luminous net — dots a touch brighter than the connecting lines
    if (dotsMat.current) dotsMat.current.opacity = 0.7;
    if (linesMat.current) linesMat.current.opacity = 0.32;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSize, netRadius, dotCount]);

  useFrame((_, delta) => {
    if (reduced) return;
    // VERY slow rotation — barely perceptible, keeps the chief feeling alive
    // without the constant spinning the owner disliked.
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* edges: thin lines connecting the vertices → the "network" wireframe.
          Geometry is unit-radius (shared), so this line group is scaled to
          netRadius to match the instanced dots (whose matrices are already
          written at netRadius by layout()). */}
      <group scale={netRadius}>
        <lineSegments geometry={hubNet.edgesGeo}>
          <lineBasicMaterial
            ref={linesMat}
            color={new THREE.Color(...netInk)}
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* a small dot at each vertex — instanced. layout() writes each instance
          matrix at netRadius (position) with a small fixed dot scale, so this
          mesh is left UNSCALED to avoid compounding the radius. */}
      <instancedMesh
        ref={dotsRef}
        args={[dotGeo, undefined, dotCount]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          ref={dotsMat}
          color={new THREE.Color(...netInk)}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// HudReticle — an in-scene HUD detail billboarded around a node: a thin glowing
// targeting RING plus a set of short radial TICK marks that rotate slowly, and
// a smaller counter-rotating inner tick set, so each orb reads as being "tracked"
// by the command deck. Warm/clay/off-white, ADDITIVE (glows on the dark stage),
// elegant not busy. Two sizes are used: a larger, richer reticle around the hub
// (with the tick ring) and a smaller, quieter tick-ring around each agent node.
// Rotation freezes under reduced-motion (still drawn, static). `pointer-events`
// N/A (no handlers). Geometry is shared (resources); the two thin materials here
// are owned + disposed on unmount.
// ---------------------------------------------------------------------------

function HudReticle({
  radius,
  palette,
  reduced,
  reticleRing,
  reticleTicks,
  hub = false,
}: {
  radius: number; // world-space radius the reticle should sit at
  palette: Palette;
  reduced: boolean;
  reticleRing: THREE.RingGeometry;
  reticleTicks: THREE.BufferGeometry;
  hub?: boolean;
}) {
  const ticksRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const ticksMat = useRef<THREE.LineBasicMaterial>(null);
  const innerMat = useRef<THREE.LineBasicMaterial>(null);

  // reticle tone: warm off-white nudged toward clay so it reads warm, luminous,
  // and clearly HUD — never cyan/neon. The hub reticle leans a hair more clay.
  const tone = useMemo(
    () => to01(mixRgb(palette.ink, palette.accent, hub ? 0.4 : 0.28)),
    [palette, hub],
  );

  useFrame((_, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 1 / 30);
    // the outer tick ring rotates slowly one way; the inner set counter-rotates
    // a touch faster — a calm, elegant "tracking" motion, never a fast spin.
    if (ticksRef.current) ticksRef.current.rotation.z += dt * 0.12;
    if (innerRef.current) innerRef.current.rotation.z -= dt * 0.2;
  });

  return (
    <Billboard>
      {/* thin glowing targeting ring */}
      <mesh geometry={reticleRing} scale={radius}>
        <meshBasicMaterial
          ref={ringMat}
          color={new THREE.Color(...tone)}
          transparent
          opacity={hub ? 0.32 : 0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* outer radial tick marks — rotate slowly */}
      <group ref={ticksRef}>
        <lineSegments geometry={reticleTicks} scale={radius}>
          <lineBasicMaterial
            ref={ticksMat}
            color={new THREE.Color(...tone)}
            transparent
            opacity={hub ? 0.42 : 0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* inner counter-rotating tick set (smaller, quieter) — hub only, adds the
          "rich" command-deck detail without cluttering every node */}
      {hub && (
        <group ref={innerRef}>
          <lineSegments geometry={reticleTicks} scale={radius * 0.72}>
            <lineBasicMaterial
              ref={innerMat}
              color={new THREE.Color(...tone)}
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
      )}
    </Billboard>
  );
}

// ---------------------------------------------------------------------------
// Sub-agent reconciliation — diff incoming ids against an internal list so we
// can play enter/exit animations. Removed ids are kept as "exiting" until their
// exit anim completes, then pruned.
// ---------------------------------------------------------------------------

type SubStatus = "working" | "done" | "error";

type SubItem = {
  id: string;
  label: string | null;
  status: SubStatus;
  slot: number; // orbit slot index (stable while alive)
  phase: "enter" | "live" | "exit";
  born: number; // wall-clock-ish seconds when it appeared (for flourish)
};

function useSubAgentManager(
  incoming: ConstellationSubAgent[],
  nowRef: React.RefObject<number>,
): SubItem[] {
  // internal reconciled list; mutated in place, snapshot returned for render
  const listRef = useRef<SubItem[]>([]);
  const [, force] = useState(0);

  // recompute on incoming change (structural signature)
  const signature = incoming
    .map((s) => `${s.id}:${s.status ?? "working"}`)
    .join("|");

  useEffect(() => {
    const list = listRef.current;
    const now = nowRef.current ?? 0;
    const incomingIds = new Set(incoming.map((s) => s.id));

    // update/insert
    for (const s of incoming) {
      const existing = list.find((x) => x.id === s.id);
      const status: SubStatus = s.status ?? "working";
      if (existing) {
        existing.status = status;
        existing.label = s.label ?? null;
        // if it had started exiting but reappeared, bring it back
        if (existing.phase === "exit") existing.phase = "live";
      } else {
        // find a free slot (lowest unused index)
        const used = new Set(
          list.filter((x) => x.phase !== "exit").map((x) => x.slot),
        );
        let slot = 0;
        while (used.has(slot)) slot++;
        list.push({
          id: s.id,
          label: s.label ?? null,
          status,
          slot,
          phase: "enter",
          born: now,
        });
      }
    }

    // mark removed as exiting
    for (const item of list) {
      if (!incomingIds.has(item.id) && item.phase !== "exit") {
        item.phase = "exit";
      }
    }

    force((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // expose a pruning hook: children call back when their exit anim finishes
  const prune = (id: string) => {
    const list = listRef.current;
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) {
      list.splice(idx, 1);
      force((n) => n + 1);
    }
  };
  // stash prune on the list snapshot via closure — return both
  (listRef as unknown as { prune?: (id: string) => void }).prune = prune;

  return listRef.current;
}

// ---------------------------------------------------------------------------
// SubAgentNode — a small STABLE "moon" attached to its parent by a visible
// tether. It sits at a calm, mostly-fixed fanned-out slot near the parent (a
// very slow drift only, NO fast orbiting/darting). It grows/fades IN on spawn
// and shrinks/fades OUT on despawn, and is a small sibling of the main lit
// marble (lit matte sphere) tinted grey/clay per its status colour. A faint
// matte occlusion sprite sits under it (normal blend, NOT a glow) so it reads as
// a solid ball on white. A subtle slow feed-pulse streams along the tether only
// while it is `working`.
// ---------------------------------------------------------------------------

function SubAgentNode({
  item,
  count,
  parentSize,
  palette,
  reduced,
  onSelectParent,
  sphere,
  haloTexture,
  onExited,
}: {
  item: SubItem;
  count: number; // number of live siblings (for stable fan-out placement)
  parentSize: number;
  palette: Palette;
  reduced: boolean;
  onSelectParent?: () => void;
  sphere: THREE.BufferGeometry;
  haloTexture: THREE.Texture | null;
  onExited: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const meshMat = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMat = useRef<THREE.SpriteMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const tetherRef = useRef<THREE.Mesh>(null);
  const tetherMat = useRef<THREE.MeshBasicMaterial>(null);
  // a calm feed-pulse that streams parent → sub along the tether while working
  const flowRef = useRef<THREE.Mesh>(null);
  const flowMat = useRef<THREE.MeshBasicMaterial>(null);
  // hover reveals a small dim label (worker's label, else last 8 chars of id) —
  // same drei Html mechanism the agent nodes use, but hover-only (no always-on
  // label) so satellites don't clutter the scene.
  const [hovered, setHovered] = useState(false);

  // animated scalars
  const scale = useRef(reduced ? 1 : 0); // spawn from 0
  const opacity = useRef(reduced ? 1 : 0);
  const ring = useRef(0); // birth/collapse ring pulse (drives a scaling ring)
  const colour = useRef<Rgb>([...palette.accent]);
  const exitedRef = useRef(false);
  const exitRingFired = useRef(false); // collapse ring kicked once on exit start
  const flowPhase = useRef(0); // 0..1 feeding-highlight travel

  // distance of the moon from its parent — mostly fixed. ~1.6x the parent size
  // so the satellite reads as a small companion hugging its node.
  const orbitR = parentSize * 1.6;
  // a stable per-slot phase for the very slow drift + a per-node drift offset so
  // siblings don't breathe in lockstep. NOT a fast orbit — see slotPosition.
  const slotPhase = useMemo(() => Math.random() * Math.PI * 2, []);

  // cursor pointer on hover (matches the agent nodes)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  const accent01 = useMemo(() => to01(palette.accent), [palette]);
  // luminous warm-off-white/clay for the tether + glow bloom (the node tone
  // nudged toward clay) so the link + bloom read as glowing on the dark deck.
  const linkInk = useMemo(
    () => to01(mixRgb(palette.ink, palette.accent, 0.3)),
    [palette],
  );
  const tetherUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tetherDir = useMemo(() => new THREE.Vector3(), []);
  const moteVec = useMemo(() => new THREE.Vector3(), []);

  // ring geometry for the birth/collapse pulse — small, owned + disposed here
  const pulseGeo = useMemo(() => new THREE.RingGeometry(0.9, 1.08, 32), []);
  // a thin cylinder used as the tether so the link has real, camera-independent
  // thickness (WebGL line width is unreliably clamped to 1px).
  const cylGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  useEffect(() => {
    return () => {
      pulseGeo.dispose();
      cylGeo.dispose();
    };
  }, [pulseGeo, cylGeo]);

  // orient the cylinder tether from the parent origin (0,0,0 local) to this
  // sub-agent's live position, so the connection is always clearly drawn.
  const orientTether = () => {
    const gp = groupRef.current;
    const mesh = tetherRef.current;
    if (!gp || !mesh) return;
    tetherDir.set(gp.position.x, gp.position.y, gp.position.z);
    const len = tetherDir.length();
    if (len <= 1e-4) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.copy(tetherDir).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(tetherUp, tetherDir.normalize());
    const thick = Math.max(0.012, parentSize * 0.05);
    mesh.scale.set(thick, len, thick);
  };

  // status colour target. WORKER states: running → "working" (bright clay
  // accent, clearly active); done → "done" (fade to a MUTED warm-grey/dim tone).
  const targetColour = (): Rgb => {
    switch (item.status) {
      case "done":
        return palette.inkFaint; // muted / dim — a settled, finished worker
      case "error":
        return palette.error;
      default:
        return palette.accent; // running / working — bright, clearly active
    }
  };

  // STABLE fanned-out slot: distribute siblings evenly around the parent at a
  // FIXED base angle (by slot index), with only a very slow, small drift so the
  // moon feels alive without ever darting or fast-orbiting. `out` is a stable
  // vector written into `groupRef.position`.
  const slotPosition = (t: number, out: THREE.Vector3) => {
    const baseAngle =
      (item.slot / Math.max(1, count)) * Math.PI * 2 + slotPhase;
    // very slow drift: a tiny wander of the angle + radius, NOT a revolution
    const drift = Math.sin(t * 0.22 + slotPhase) * 0.12; // ~±7° sway
    const a = baseAngle + drift;
    const r = orbitR * (1 + Math.sin(t * 0.3 + item.slot) * 0.04);
    // a gentle, stable z so siblings don't all sit in one plane
    const z = Math.sin(baseAngle * 1.3 + item.slot) * orbitR * 0.16;
    out.set(Math.cos(a) * r, Math.sin(a) * r, z);
  };

  // Static render for reduced motion — placed at its slot, full scale, no rAF.
  // running/working = bright accent; done = muted/dim + low opacity (matches the
  // animated treatment), so the reduced arrangement reads the same states.
  useEffect(() => {
    if (!reduced) return;
    if (groupRef.current) slotPosition(0, groupRef.current.position);
    orientTether();
    const [r, g, b] = to01(targetColour());
    const stateFade = item.status === "done" ? 0.45 : 1;
    if (meshRef.current) meshRef.current.scale.setScalar(parentSize * 0.34);
    if (meshMat.current) {
      meshMat.current.color.setRGB(r, g, b);
      meshMat.current.emissive.setRGB(r, g, b);
      // sub-agents are LUMINOUS little moons — they self-illuminate as small
      // glowing orbs on the dark deck (done ones sit dimmer/finished).
      meshMat.current.emissiveIntensity =
        (item.status === "done" ? 0.4 : 0.65) * stateFade;
      meshMat.current.opacity = stateFade;
    }
    // soft additive glow bloom around the moon (its own tone) — a small halo
    if (haloMat.current) haloMat.current.opacity = 0.3 * stateFade;
    if (haloRef.current) haloRef.current.scale.setScalar(parentSize * 0.95);
    if (tetherMat.current) tetherMat.current.opacity = 0.4 * stateFade;
    if (ringMat.current) ringMat.current.opacity = 0;
    // no feeding flow in the reduced-motion static view
    if (flowRef.current) flowRef.current.visible = false;
    // exit items shouldn't linger in the static view
    if (item.phase === "exit") onExited(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, item.phase, item.status]);

  useFrame((state, delta) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;

    // ---- targets by phase ----
    const wantScale = item.phase === "exit" ? 0 : 1;
    const wantOpacity = item.phase === "exit" ? 0 : 1;

    // spawn overshoot: damp toward 1.08 briefly, then settle to 1 — approximated
    // by damping to a small overshoot during the first ~0.3s of life.
    const age = t - item.born;
    const overshoot = item.phase === "enter" && age < 0.35 ? 1.14 : wantScale;
    scale.current = damp(scale.current, overshoot, 9, delta);
    opacity.current = damp(opacity.current, wantOpacity, 8, delta);

    // birth/collapse ring pulse: kick to 1 on enter, and again the moment exit
    // begins (a small collapse ring as it's reabsorbed), then decay to 0
    if (item.phase === "enter" && age < 0.05) ring.current = 1;
    if (item.phase === "exit" && !exitRingFired.current) {
      exitRingFired.current = true;
      ring.current = 1;
    }
    ring.current = damp(ring.current, 0, 2.2, delta);

    // promote enter -> live once settled
    if (
      item.phase === "enter" &&
      age > 0.4 &&
      Math.abs(scale.current - 1) < 0.04
    ) {
      item.phase = "live";
    }

    // prune once exit anim has essentially finished
    if (item.phase === "exit" && scale.current < 0.04 && !exitedRef.current) {
      exitedRef.current = true;
      onExited(item.id);
    }

    // ---- position: STABLE fanned-out slot with only a slow, small drift ----
    if (groupRef.current) slotPosition(t, groupRef.current.position);

    // ---- colour damp ----
    const tc = targetColour();
    colour.current[0] = damp(colour.current[0], tc[0], 4, delta);
    colour.current[1] = damp(colour.current[1], tc[1], 4, delta);
    colour.current[2] = damp(colour.current[2], tc[2], 4, delta);
    const cr = colour.current[0] / 255;
    const cg = colour.current[1] / 255;
    const cb = colour.current[2] / 255;

    // done workers settle to a MUTED, low-opacity moon (finished, resting);
    // running/working stay at full opacity (clearly active). This multiplies
    // the mesh/halo/tether opacity on top of the enter/exit fade (opacity.current).
    const stateFade = item.status === "done" ? 0.45 : 1;

    // working sub-agents gently pulse; error jitters a touch; done is calm
    let pulse = 1;
    let jitterX = 0;
    let jitterY = 0;
    if (item.status === "working") {
      pulse = 1 + Math.sin(t * 4 + item.slot) * 0.08;
    } else if (item.status === "error") {
      jitterX = Math.sin(t * 44 + item.slot) * 0.015;
      jitterY = Math.cos(t * 39 + item.slot) * 0.015;
    }

    if (meshRef.current) {
      meshRef.current.position.set(jitterX, jitterY, 0);
      meshRef.current.scale.setScalar(
        parentSize * 0.34 * scale.current * pulse,
      );
    }
    if (meshMat.current) {
      meshMat.current.color.setRGB(cr, cg, cb);
      meshMat.current.emissive.setRGB(cr, cg, cb);
      // sub-agents are LUMINOUS little moons — they self-illuminate as small
      // glowing orbs on the dark deck. Working blooms a touch (subtle shimmer
      // that never dips to 0); done sits dimmer/finished; error stays calm.
      const glow =
        item.status === "working"
          ? 0.6 + (Math.sin(t * 2.2 + item.slot) * 0.5 + 0.5) * 0.25
          : item.status === "done"
            ? 0.4
            : 0.6;
      meshMat.current.emissiveIntensity = glow * opacity.current * stateFade;
      meshMat.current.opacity = opacity.current * stateFade;
    }

    // soft additive glow bloom around the moon (its own tone) so it reads as a
    // small luminous orb on the dark deck. Steady-ish opacity (no pulsing ring).
    if (haloRef.current && haloMat.current) {
      const base = item.status === "done" ? 0.2 : 0.32;
      haloMat.current.opacity = base * opacity.current * stateFade;
      haloRef.current.scale.setScalar(parentSize * 0.95 * scale.current);
    }

    // tether: a thin cylinder from the parent origin to this sub-agent, re-
    // oriented each frame so the connection is always clearly drawn.
    orientTether();
    if (tetherMat.current) {
      // glowing warm link; a gentle flicker while working (additive on dark).
      const flick =
        item.status === "working"
          ? 0.42 + Math.abs(Math.sin(t * 5 + item.slot)) * 0.2
          : 0.36;
      tetherMat.current.opacity = flick * opacity.current * stateFade;
    }

    // ---- calm feed-pulse: a single soft bead that streams parent → sub along
    //      the tether ONLY while the sub is WORKING, so the link reads as gently
    //      active feeding. Slow, one at a time — not a stream. ----
    if (flowRef.current && flowMat.current) {
      const feeding = item.status === "working" && item.phase === "live";
      if (feeding) {
        // slow advance over a range > 1 so there is a calm rest between pulses
        flowPhase.current = (flowPhase.current + delta * 0.45) % 1.8;
        const gp = groupRef.current;
        const p = flowPhase.current;
        if (gp && p <= 1) {
          moteVec.set(gp.position.x, gp.position.y, gp.position.z);
          flowRef.current.position.copy(moteVec).multiplyScalar(p); // 0 parent → 1 sub
          const env = Math.sin(p * Math.PI); // fade in/out along the run
          flowRef.current.visible = env > 0.02;
          flowMat.current.opacity = env * 0.7 * opacity.current;
          const fs = parentSize * 0.1 * (0.6 + env * 0.6);
          flowRef.current.scale.setScalar(fs);
        } else {
          flowRef.current.visible = false; // the rest between pulses
        }
      } else {
        flowRef.current.visible = false;
      }
    }

    // birth/collapse ring
    if (ringRef.current && ringMat.current) {
      const r = ring.current;
      ringMat.current.opacity = r * 0.7;
      // expands outward on birth; on exit it collapses (scale shrinks with node)
      const grow =
        item.phase === "exit"
          ? parentSize * 0.34 * (0.4 + (1 - scale.current) * 0.8)
          : parentSize * 0.34 * (0.6 + (1 - r) * 1.6);
      ringRef.current.scale.setScalar(Math.max(0.001, grow));
    }
  });

  const [cr0, cg0, cb0] = to01(targetColour());

  // hover label text: the worker's label, else the last 8 chars of its id
  // (the session key) so an unlabelled worker is still identifiable.
  const hoverLabel = item.label?.trim() || item.id.slice(-8);

  return (
    <>
      {/* tether: a thin glowing warm cylinder linking this sub-agent to its
          parent (ADDITIVE on the dark deck). */}
      <mesh ref={tetherRef} geometry={cylGeo}>
        <meshBasicMaterial
          ref={tetherMat}
          color={new THREE.Color(...linkInk)}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* calm feed-pulse: a small glowing clay bead streaming parent → sub while
          working (ADDITIVE — a soft glowing spark on the dark deck) */}
      <mesh ref={flowRef} geometry={sphere} visible={false}>
        <meshBasicMaterial
          ref={flowMat}
          color={new THREE.Color(...accent01)}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={groupRef}>
        {/* birth / collapse ring pulse (billboarded) — glowing clay, additive */}
        <Billboard>
          <mesh ref={ringRef} geometry={pulseGeo} scale={0.001}>
            <meshBasicMaterial
              ref={ringMat}
              color={new THREE.Color(...accent01)}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>

        {/* soft additive glow bloom around the moon (its own warm tone) so it
            reads as a small luminous orb on the dark deck. Centred on the moon. */}
        {haloTexture && (
          <sprite ref={haloRef} scale={parentSize * 0.95}>
            <spriteMaterial
              ref={haloMat}
              map={haloTexture}
              color={new THREE.Color(...linkInk)}
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        )}

        {/* the sub-agent node — a small LIT MATTE marble sibling of the main orb */}
        <mesh
          ref={meshRef}
          geometry={sphere}
          scale={parentSize * 0.34}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectParent?.();
          }}
        >
          <meshStandardMaterial
            ref={meshMat}
            color={new THREE.Color(cr0, cg0, cb0)}
            emissive={new THREE.Color(cr0, cg0, cb0)}
            emissiveIntensity={0.6}
            // matches the parent orbs' glowing look on the dark deck (soft
            // specular sheen + high emissive so the moon self-illuminates)
            roughness={0.44}
            metalness={0.05}
            transparent
            opacity={0}
          />
        </mesh>

        {/* hover-only label — small + dim, same drei Html mechanism the agent
            nodes use. Hidden while exiting so a fading-out worker doesn't linger
            a label. No always-on label for workers (keeps the scene uncluttered). */}
        {hovered && item.phase !== "exit" && (
          <Html
            center
            distanceFactor={10}
            position={[0, parentSize * 0.9, 0]}
            style={{ pointerEvents: "none" }}
            zIndexRange={[9, 0]}
          >
            <div
              style={{
                whiteSpace: "nowrap",
                // warm off-white (--hud-text, ~rgb(234,227,216)) — matches the
                // main agent name labels so the sub-agent label reads clearly on
                // the dark stage (the old --hud-dim warm-grey was unreadable).
                color: `rgb(${palette.ink.join(",")})`,
                fontFamily:
                  'var(--font-geist-mono), ui-monospace, "SFMono-Regular", monospace',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.04em",
                lineHeight: 1,
                opacity: 1,
                // dark deck: a stronger near-black halo lifts the off-white
                // label off the glow so it pops (matches the main label halo).
                textShadow: `0 1px 6px rgba(${palette.paper.join(",")},0.98), 0 0 3px rgba(${palette.paper.join(",")},0.95)`,
                transform: "translateZ(0)",
              }}
            >
              {hoverLabel}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Node — the agent's lit MATTE orb core (+ fresnel rim), a soft matte occlusion,
// the hub-only network sphere, hover label + click, its sub-agents, and (NEW) an
// "on a call" treatment. All state is expressed through damped scalars so
// transitions are seamless. The orb is properly LIT by the scene lights so it
// reads as a 3D matte ball on white; emissive is only a small warm-up on top.
// The WORKING state adds NO motion and NO expanding ring — it is a grey→clay
// WARM-UP: the core emissive warms, eased in/out by a damped `work` scalar
// (0 idle → 1 working), with a faint steady shimmer on top. The fresnel rim is
// STATIC.
//
// CALL (NEW): when this node is the one on a voice call (`isCallNode`), a soft
// expanding concentric RING pulse (matte clay, fading outward, ~1.5s loop)
// emanates from it and the orb gently enlarges/emphasises — marking "you are in
// a call with this agent". While `callSpeaking` is true the orb warms BRIGHTER
// toward clay and pulses subtly with speech energy; while false it stays calm
// but still shows the call ring. Both are damped so the speaking/quiet handoff
// is smooth. Respects reduced-motion (static emphasis, no rAF ring).
// ---------------------------------------------------------------------------

function Node({
  placed,
  palette,
  reduced,
  nodeScale,
  onSelect,
  onCallAgent,
  subAgents,
  nowRef,
  resources,
  isCallNode = false,
  callSpeaking = false,
  registerNode,
}: {
  placed: Placed;
  palette: Palette;
  reduced: boolean;
  nodeScale: number;
  onSelect?: (id: string) => void;
  onCallAgent?: (id: string) => void;
  subAgents: ConstellationSubAgent[];
  nowRef: React.RefObject<number>;
  resources: SharedResources;
  isCallNode?: boolean;
  callSpeaking?: boolean;
  // NEW — register this node's positioned group by agent id so the Scene can
  // read the node's live WORLD position (it sits inside the auto-rotating
  // group) to ease the OrbitControls target onto it when it's focused.
  registerNode?: (id: string, group: THREE.Group | null) => void;
}) {
  const { sphere, orb, rimShell } = resources;
  const { agent, position, isHub } = placed;
  const target = useMemo(() => statusTarget(agent.status), [agent.status]);

  // deterministic identity → subtle size/ring/spin variation (stable across the
  // 6-second refreshes because it's derived from the agent id, not random).
  // Every agent now uses the SAME orb geometry — only these gentle offsets
  // differ, so the roster reads as a family of glowing planets.
  const signature = useMemo(() => identitySignature(agent), [agent]);
  // one shared orb form for all agents (hub included, just larger via baseSize)
  const coreGeo = orb;

  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null); // holds the core + shell, spins on the signature axis
  const sphereRef = useRef<THREE.Mesh>(null); // the orb core (name kept for continuity)
  const sphereMat = useRef<THREE.MeshStandardMaterial>(null);
  const rimRef = useRef<THREE.Mesh>(null); // fresnel atmosphere rim (BackSide)
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMat = useRef<THREE.SpriteMaterial>(null);
  // NEW — the "on a call" concentric ring pulse (two rings offset half a cycle
  // so a soft pulse is always expanding). Billboarded, matte clay, normal blend.
  const callRingARef = useRef<THREE.Mesh>(null);
  const callRingAMat = useRef<THREE.MeshBasicMaterial>(null);
  const callRingBRef = useRef<THREE.Mesh>(null);
  const callRingBMat = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  // animated scalars (all lerped) — persisted across frames via refs
  const activation = useRef(target.activation);
  const halo = useRef(target.halo);
  const steady = useRef(target.steady); // 0..1 held "attention" glow (waiting)
  const compute = useRef(target.compute); // 0 idle → 1 working (drives glow/spin)
  const jitter = useRef(0);
  const hoverLift = useRef(0);
  const colour = useRef<Rgb>([...target.colour(palette)]);
  // NEW — damped call scalars: `call` (0..1) is "this node is on a call"; `speak`
  // (0..1) is "the agent is currently speaking". Both are damped so the ring
  // appears/disappears smoothly and the speaking brighten fades in/out, never
  // snapping between quiet and loud.
  const call = useRef(isCallNode ? 1 : 0);
  const speak = useRef(isCallNode && callSpeaking ? 1 : 0);

  // a thin ring geometry for the call pulse — owned + disposed here.
  const callRingGeo = useMemo(() => new THREE.RingGeometry(0.86, 1.0, 48), []);
  useEffect(() => () => callRingGeo.dispose(), [callRingGeo]);

  const bobPhase = signature.bobPhase;

  // Nodes are SUBSTANTIAL polished objects so the constellation fills the frame
  // and reads as a deliberate focal group. The hub reads clearly larger so the
  // centre holds; spokes vary subtly in size per-identity so the family isn't
  // uniform clones.
  const baseSize = (isHub ? 0.68 : 0.46 * signature.sizeVar) * nodeScale;

  // cursor pointer on hover
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  // register this node's positioned group with the Scene (by agent id) so the
  // Scene can read its live WORLD position for the focus re-centre, and clear it
  // on unmount / id change so a removed agent never leaves a dangling ref.
  const agentId = agent.id;
  useEffect(() => {
    registerNode?.(agentId, groupRef.current);
    return () => registerNode?.(agentId, null);
  }, [agentId, registerNode]);

  const accent01 = useMemo(() => to01(palette.accent), [palette]);

  // per-node fresnel rim material — owned here, disposed on unmount. Colour is
  // updated per-frame to track the node's status colour (clay/red/dim).
  const rimMaterial = useMemo(
    () => makeRimMaterial(target.colour(palette)),
    // create once per node; colour is animated in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => rimMaterial.dispose(), [rimMaterial]);

  // ---- sub-agents (reconciled with enter/exit) ----
  const capped = useMemo(
    () => subAgents.slice(0, MAX_SUBAGENTS_PER_PARENT),
    [subAgents],
  );
  const subItems = useSubAgentManager(capped, nowRef);
  const liveCount = subItems.filter((s) => s.phase !== "exit").length;
  const pruneSub = ((subItems as unknown as { prune?: (id: string) => void })
    .prune ?? (() => {})) as (id: string) => void;

  // GLOW-BLOOM tint (was a grounding shadow on the light page): on the dark deck
  // the sprite under/behind the orb is a soft additive BLOOM in the node's own
  // warm tone (off-white, nudged toward clay) so each orb sits in a gentle pool
  // of its own light on the near-black stage rather than casting a shadow.
  const occ01 = useMemo(
    () => to01(mixRgb(palette.ink, palette.accent, 0.18)),
    [palette],
  );

  // Static arrangement for reduced motion — set visuals once, no rAF. Each agent
  // is a lit MATTE orb at rest; a WORKING node simply WARMS toward clay (a small
  // steady emissive warm-up) — no pulsing, no ring. On a CALL, a static emphasis:
  // the orb is a touch larger and the two call rings sit expanded + faint (no
  // rAF pulse); speaking adds a steady extra warmth.
  useEffect(() => {
    if (!reduced) return;
    const [r, g, b] = to01(target.colour(palette));
    const act = Math.max(target.activation, isHub ? 0.35 : 0.12);
    const work = target.compute; // 0 idle → 1 working (static, no rAF)
    const held = target.steady; // 0..1 waiting attention (static, no rAF)
    const onCall = isCallNode ? 1 : 0;
    const speaking = isCallNode && callSpeaking ? 1 : 0;
    // call emphasis: the orb enlarges a touch when on a call
    const emphasis = 1 + onCall * 0.14;
    if (sphereRef.current)
      sphereRef.current.scale.setScalar(
        baseSize * (0.7 + act * 0.6) * emphasis,
      );
    if (sphereMat.current) {
      sphereMat.current.color.setRGB(r, g, b);
      sphereMat.current.emissive.setRGB(r, g, b);
      // LUMINOUS emissive — the orb self-illuminates as a glowing off-white orb
      // on the dark deck. Idle already glows softly; working/waiting warm toward
      // clay and bloom brighter; speaking blooms brightest.
      sphereMat.current.emissiveIntensity =
        0.55 + act * 0.25 + work * 0.55 + held * 0.55 + speaking * 0.6;
    }
    // fresnel atmosphere rim — STATIC + luminous, a soft halo edge (no pulse).
    if (rimRef.current) rimRef.current.scale.setScalar(baseSize * emphasis);
    {
      const u = rimMaterial.uniforms;
      // BRIGHT rim in the node's own tone — a light halo edge reads clearly on
      // the dark deck (additive), so no ink-darkening is needed.
      u.uColor.value.setRGB(r, g, b);
      u.uStrength.value = 0.75; // luminous, constant — a soft halo, not a ring
    }
    // soft additive glow bloom under/behind the orb (in the node's own tone).
    if (haloMat.current) {
      haloMat.current.color.setRGB(occ01[0], occ01[1], occ01[2]);
      haloMat.current.opacity = 0.4 + work * 0.2 + held * 0.2 + speaking * 0.25;
    }
    if (haloRef.current) haloRef.current.scale.setScalar(baseSize * 2.6);
    // static call rings: expanded + glowing (no rAF pulse), clay.
    const [ar, ag, ab] = to01(palette.accent);
    if (callRingAMat.current) {
      callRingAMat.current.color.setRGB(ar, ag, ab);
      callRingAMat.current.opacity = onCall * 0.4;
    }
    if (callRingARef.current)
      callRingARef.current.scale.setScalar(baseSize * 2.0);
    if (callRingBMat.current) {
      callRingBMat.current.color.setRGB(ar, ag, ab);
      callRingBMat.current.opacity = onCall * 0.22;
    }
    if (callRingBRef.current)
      callRingBRef.current.scale.setScalar(baseSize * 2.9);
  }, [
    reduced,
    target,
    palette,
    baseSize,
    isHub,
    rimMaterial,
    isCallNode,
    callSpeaking,
    occ01,
  ]);

  useFrame((state, delta) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    // clamp dt so a stutter (tab refocus, GC pause) can't make the spring blow up
    const dt = Math.min(delta, 1 / 30);

    // ---- lerp every scalar toward its status target (seamless) ----
    activation.current = damp(
      activation.current,
      target.activation,
      3.5,
      delta,
    );
    halo.current = damp(halo.current, target.halo, 4, delta);
    steady.current = damp(steady.current, target.steady, 4, delta);
    // `work` (0 idle → 1 working) is damped from compute — this is the damped
    // scalar that eases the beacon breath in on entering working and settles it
    // back to the steady idle glow on leaving (see `breath` below). Never snaps.
    compute.current = damp(compute.current, target.compute, 3.5, delta);
    jitter.current = damp(jitter.current, target.jitter, 6, delta);
    hoverLift.current = damp(hoverLift.current, hovered ? 1 : 0, 8, delta);
    // NEW — damp the call scalars so the ring + speaking brighten fade smoothly.
    // `call` rises when this is the call node; `speak` rises while it's speaking
    // (and can only be non-zero while on a call).
    call.current = damp(call.current, isCallNode ? 1 : 0, 5, delta);
    speak.current = damp(
      speak.current,
      isCallNode && callSpeaking ? 1 : 0,
      6,
      delta,
    );

    const tCol = target.colour(palette);
    colour.current[0] = damp(colour.current[0], tCol[0], 4, delta);
    colour.current[1] = damp(colour.current[1], tCol[1], 4, delta);
    colour.current[2] = damp(colour.current[2], tCol[2], 4, delta);
    const cr = colour.current[0] / 255;
    const cg = colour.current[1] / 255;
    const cb = colour.current[2] / 255;

    const act = activation.current;
    // `work` = damped 0 (idle) → 1 (working). It eases the LIGHT-UP in on
    // entering working and settles it back to the steady dim idle glow on
    // leaving — never a snap. (compute.current is this exact damped scalar.)
    const work = compute.current;

    // ---- LIGHT-UP — the ONLY thing a working node changes is BRIGHTNESS ----
    // Idle nodes sit a little DIM; a working node simply LIGHTS UP (brighter
    // core + brighter halo), eased via `work`. There is NO expanding/contracting
    // ring or halo — brightness only. A very subtle steady shimmer (small,
    // never dipping toward 0) rides on top while working so it feels alive
    // without any scale motion. `lit` in ~[0,1] is the working brightness.
    const shimmer = 0.9 + Math.sin(t * 2.4 + bobPhase) * 0.1; // ~0.8..1.0
    const lit = work * shimmer; // dim (0) → bright (~1), never pulses OUT
    // WAITING — a bright, STEADY "attention" light-up (needs a human). Unlike
    // `lit`, `held` has NO shimmer: it rises and holds constant, so a waiting
    // node reads as clearly lit and calm — distinct from working's shimmer and
    // from idle's dimness. No ring, no scale/pulse — brightness only.
    const held = steady.current;

    // ---- CALL scalars → derived terms ----
    const onCall = call.current; // 0..1 damped "on a call"
    // speech energy: while speaking, a lively but bounded pulse; while quiet it
    // damps toward 0. `speakLevel` drives the extra warmth + a subtle size pulse.
    const speakEnergy =
      speak.current * (0.75 + (Math.sin(t * 9.0) * 0.5 + 0.5) * 0.25);
    // call emphasis: the orb gently enlarges while on a call (steady), with a
    // small extra swell riding on speech energy so speaking reads as "louder".
    const callEmphasis = 1 + onCall * 0.12 + speakEnergy * 0.06;

    // ---- position: calm shared idle bob (per-identity phase+rate) + hover lift
    //      + error jitter. This is IDENTICAL for idle and working — working adds
    //      NO extra motion (no lift, no punch); it only breathes light. ----
    if (groupRef.current) {
      const bob =
        Math.sin(t * signature.bobRate + bobPhase) * 0.12 * (0.4 + act);
      const jx =
        jitter.current > 0.01
          ? (Math.sin(t * 37 + bobPhase) + Math.sin(t * 53)) *
            0.03 *
            jitter.current
          : 0;
      const jy =
        jitter.current > 0.01
          ? Math.cos(t * 41 + bobPhase) * 0.03 * jitter.current
          : 0;
      const lift = hoverLift.current * 0.25;
      groupRef.current.position.set(
        position.x + jx,
        position.y + bob + jy + lift,
        position.z,
      );
    }

    // ---- signature rotation: every agent shares ONE calm per-identity idle
    //      spin about its own axis for 3D life. This is NOT the working
    //      indicator — it is IDENTICAL for idle and working nodes. The working
    //      state adds NO motion; it only breathes LIGHT (see below). ----
    if (spinRef.current) {
      spinRef.current.rotateOnAxis(signature.axis, signature.spin * dt);
    }

    // ---- core scale: activation + hover only. NO working punch, NO breath
    //      scale — the orb does not change size when working; only its light
    //      breathes. Size is identical for idle and working. ----
    // scale = activation + hover + CALL emphasis. Still no working "punch": the
    // orb only enlarges for hover and for being on a call (the call emphasis),
    // never for entering the working state.
    if (sphereRef.current) {
      const s =
        baseSize *
        (0.72 + act * 0.5) *
        (1 + hoverLift.current * 0.08) *
        callEmphasis;
      sphereRef.current.scale.setScalar(s);
    }
    if (sphereMat.current) {
      // LUMINOUS emissive: the orb SELF-ILLUMINATES as a glowing off-white orb
      // on the dark deck. Idle already glows softly (never dark); working BLOOMS
      // BRIGHTER + warmer toward clay via `lit`; waiting holds a steady brighter
      // glow via `held`. On a CALL, speaking (`speakEnergy`) blooms the orb
      // brightest — the "lights up when speaking, calm when quiet" behaviour —
      // damped so the handoff is smooth.
      sphereMat.current.color.setRGB(cr, cg, cb);
      sphereMat.current.emissive.setRGB(cr, cg, cb);
      sphereMat.current.emissiveIntensity =
        0.55 + act * 0.25 + lit * 0.55 + held * 0.55 + speakEnergy * 0.6;
    }

    // ---- fresnel atmosphere rim: faint + steady, only for 3D roundness AND to
    //      separate a light-grey matte ball from the near-white page. Its
    //      STRENGTH is constant; its scale hugs the core (same activation/hover/
    //      call scale as the orb) so it stays a silhouette rim, never a ring. ----
    if (rimRef.current) {
      const u = rimMaterial.uniforms;
      // a BRIGHT rim in the node's own tone (off-white / clay) — on the dark
      // deck an additive light rim reads clearly as a soft halo edge, so no
      // ink-darkening is needed. Warmer/active nodes glow a touch stronger.
      u.uColor.value.setRGB(cr, cg, cb);
      u.uStrength.value = 0.7 + lit * 0.25 + held * 0.2 + speakEnergy * 0.25;
      const rimS =
        baseSize *
        (0.72 + act * 0.5) *
        (1 + hoverLift.current * 0.08) *
        callEmphasis;
      rimRef.current.scale.setScalar(rimS);
    }

    // ---- glow bloom: a soft additive sprite around the orb (in the node's own
    //      tone) so each orb sits in a gentle pool of its own light on the dark
    //      deck. Brightens a touch when working/waiting/speaking; steady scale so
    //      it never reads as a pulsing ring. ----
    if (haloRef.current && haloMat.current) {
      haloMat.current.color.setRGB(occ01[0], occ01[1], occ01[2]);
      haloMat.current.opacity =
        0.4 + lit * 0.2 + held * 0.2 + speakEnergy * 0.25;
      haloRef.current.scale.setScalar(baseSize * 2.6);
    }

    // ---- CALL rings: two soft concentric RingGeometry pulses that expand
    //      outward from the node and fade as they grow (~1.5s loop, half a cycle
    //      apart so one is always emanating). Matte clay, NORMAL blend. Visible
    //      only while on a call (opacity scaled by `onCall`); brighter while
    //      speaking. Billboarded so they always face the camera as clean rings. ----
    const [ar, ag, ab] = to01(palette.accent);
    const RING_PERIOD = 1.5; // seconds per pulse
    const ringFor = (
      meshRef: React.RefObject<THREE.Mesh | null>,
      matRef: React.RefObject<THREE.MeshBasicMaterial | null>,
      phaseOffset: number,
    ) => {
      const m = meshRef.current;
      const mm = matRef.current;
      if (!m || !mm) return;
      if (onCall < 0.01) {
        mm.opacity = 0;
        return;
      }
      // p in [0,1): 0 at the node edge → 1 fully expanded + faded out
      const p = (((t / RING_PERIOD + phaseOffset) % 1) + 1) % 1;
      const ringScale = baseSize * (1.4 + p * 2.4);
      m.scale.setScalar(ringScale);
      mm.color.setRGB(ar, ag, ab);
      // fade in briefly then out as it expands; overall gated by onCall +
      // brightened while speaking. Additive on the dark deck → a glowing ring.
      const env = Math.sin(p * Math.PI); // 0→1→0 across the run
      const bright = 0.4 + speak.current * 0.4;
      mm.opacity = env * bright * onCall;
    };
    ringFor(callRingARef, callRingAMat, 0);
    ringFor(callRingBRef, callRingBMat, 0.5);
  });

  const [cr0, cg0, cb0] = to01(target.colour(palette));

  return (
    <group ref={groupRef} position={position}>
      {/* the core + shell live in a group that spins on the identity axis */}
      <group ref={spinRef}>
        {/* interactive core — the agent's distinct identity form */}
        <mesh
          ref={sphereRef}
          geometry={coreGeo}
          scale={baseSize}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(agent.id);
          }}
        >
          <meshStandardMaterial
            ref={sphereMat}
            color={new THREE.Color(cr0, cg0, cb0)}
            emissive={new THREE.Color(cr0, cg0, cb0)}
            emissiveIntensity={0.55}
            // glowing orb on the dark deck: a low roughness keeps a soft specular
            // sheen from the gentle key light (a little form so it isn't a flat
            // self-lit disc) while the high emissive makes it self-illuminate as
            // a luminous off-white orb. Still 0 metalness — it's a soft orb, not
            // chrome.
            roughness={0.42}
            metalness={0.05}
          />
        </mesh>

        {/* fresnel atmosphere rim — a slightly larger BackSide sphere lit only
            at the silhouette, so the ball reads round + 3D even when small/idle.
            Its strength is faint + STATIC (roundness only, never a pulsing edge
            ring). material is owned per-node (rimMaterial), disposed on unmount. */}
        <mesh
          ref={rimRef}
          geometry={rimShell}
          scale={baseSize}
          material={rimMaterial}
        />
      </group>

      {/* hub signature — a 3D connected-node "network sphere" enclosing the orb */}
      {isHub && (
        <HubNetSphere
          baseSize={baseSize}
          palette={palette}
          reduced={reduced}
          hubNet={resources.hubNet}
          dotGeo={resources.dotGeo}
        />
      )}

      {/* in-scene HUD reticle: a larger, richer targeting ring + rotating ticks
          around the HUB, and a smaller quiet tick-ring around each agent node —
          so every orb reads as "tracked" by the command deck. Billboarded,
          glowing warm/clay, freezes under reduced-motion. */}
      <HudReticle
        radius={baseSize * (isHub ? 2.6 : 2.1)}
        palette={palette}
        reduced={reduced}
        reticleRing={resources.reticleRing}
        reticleTicks={resources.reticleTicks}
        hub={isHub}
      />

      {/* soft additive GLOW BLOOM — a warm pool of the orb's own light behind it
          (ADDITIVE) so each orb reads as luminous, sitting in a gentle halo on
          the near-black deck. Centred on the orb (not offset below) so it reads
          as a glow, not a shadow; depthWrite off so it never occludes. */}
      {resources.haloTexture && (
        <sprite ref={haloRef} scale={baseSize * 2.6}>
          <spriteMaterial
            ref={haloMat}
            map={resources.haloTexture}
            color={new THREE.Color(...occ01)}
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* NEW — "on a call" concentric RING pulses. Two billboarded clay rings
          offset half a cycle apart so a soft pulse is always emanating outward
          from the node (~1.5s loop). Fully driven per-frame (opacity 0 when not
          on a call). ADDITIVE — a glowing clay ring blooming out on the dark
          deck. */}
      <Billboard>
        <mesh ref={callRingARef} geometry={callRingGeo} scale={baseSize * 1.4}>
          <meshBasicMaterial
            ref={callRingAMat}
            color={new THREE.Color(...accent01)}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={callRingBRef} geometry={callRingGeo} scale={baseSize * 1.4}>
          <meshBasicMaterial
            ref={callRingBMat}
            color={new THREE.Color(...accent01)}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      {/* sub-agents live in the node's local group, inheriting bob/position */}
      {subItems.map((item) => (
        <SubAgentNode
          key={item.id}
          item={item}
          count={Math.max(1, liveCount)}
          parentSize={baseSize}
          palette={palette}
          reduced={reduced}
          onSelectParent={() => onSelect?.(agent.id)}
          sphere={sphere}
          haloTexture={resources.haloTexture}
          onExited={pruneSub}
        />
      ))}

      {/* persistent small label — always-on billboarded node pill (mono, dim)
          so a small orb is still identifiable at a glance, like the inspiration.
          Hidden while hovered (the richer hover label takes over) to avoid two
          stacked pills. distanceFactor keeps it small and it fades out when the
          camera pulls far away so the field never clutters. */}
      {!hovered && (
        <Html
          center
          distanceFactor={14}
          position={[0, baseSize + 0.5, 0]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              color: `rgb(${palette.ink.join(",")})`,
              fontFamily:
                'var(--font-geist-mono), ui-monospace, "SFMono-Regular", monospace',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.04em",
              lineHeight: 1,
              opacity: 0.9,
              // dark deck: a near-black halo behind the off-white label lifts it
              // off the busy scene so it stays legible over glow + grid.
              textShadow: `0 1px 6px rgba(${palette.paper.join(",")},0.95), 0 0 2px rgba(${palette.paper.join(",")},0.9)`,
              transform: "translateZ(0)",
            }}
          >
            {agent.name}
          </div>
        </Html>
      )}

      {/* hover label — agent name + optional emoji + (NEW) a small call button.
          The chip itself keeps pointerEvents:"none" so dragging over it never
          swallows an OrbitControls drag; ONLY the call button re-enables
          pointerEvents so it stays clickable. The button calls onCallAgent(id)
          and stops propagation so it does NOT also trigger the node's
          onSelectAgent navigation. */}
      {hovered && (
        <Html
          center
          distanceFactor={10}
          position={[0, baseSize + 0.7, 0]}
          // pointerEvents disabled on the wrapper: only the call button below
          // re-enables them, so the chip never eats drags outside that button.
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              padding: "4px 10px",
              borderRadius: 999,
              // dark chip: a translucent near-black surface, glowing off-white
              // text, a thin clay border and a soft clay glow so the chip reads
              // as a lit HUD readout on the dark deck.
              background: `rgba(${palette.paper.join(",")},0.82)`,
              color: `rgb(${palette.ink.join(",")})`,
              border: `1px solid rgba(${palette.accent.join(",")},0.5)`,
              boxShadow: `0 6px 20px -6px rgba(0,0,0,0.7), 0 0 12px -2px rgba(${palette.accent.join(",")},0.35)`,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
              transform: "translateZ(0)",
            }}
          >
            {agent.emoji ? <span aria-hidden>{agent.emoji}</span> : null}
            <span>{agent.name}</span>
            {onCallAgent && (
              <button
                type="button"
                aria-label={`call ${agent.name}`}
                title={`call ${agent.name}`}
                // re-enable pointer events ONLY on the button (the chip wrapper
                // has them off). onPointerDown stops the event so the R3F node's
                // pointer handlers + OrbitControls never see it; onClick fires
                // the call and prevents the node's onSelect navigation.
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onCallAgent(agent.id);
                }}
                onPointerOver={(e) => {
                  e.currentTarget.style.background = `rgba(${palette.accent.join(",")},0.9)`;
                  e.currentTarget.style.color = `rgb(${palette.paper.join(",")})`;
                }}
                onPointerOut={(e) => {
                  e.currentTarget.style.background = `rgba(${palette.accent.join(",")},0.18)`;
                  e.currentTarget.style.color = "#f2ede4";
                }}
                style={{
                  pointerEvents: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginLeft: 2,
                  padding: "3px 8px",
                  borderRadius: 999,
                  cursor: "pointer",
                  background: `rgba(${palette.accent.join(",")},0.18)`,
                  color: "#f2ede4",
                  border: `1px solid rgba(${palette.accent.join(",")},0.6)`,
                  fontFamily:
                    'var(--font-geist-mono), ui-monospace, "SFMono-Regular", monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {/* phone glyph (decorative) + label */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  width={11}
                  height={11}
                  style={{ display: "block" }}
                >
                  <title>call</title>
                  <path
                    d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                call
              </button>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene — assembles dust + hub + spokes + edges + sub-agents and pauses the
// render loop when the tab is hidden. The camera is fully user-controlled via
// OrbitControls (no automatic rotation).
// ---------------------------------------------------------------------------

function Scene({
  agents,
  subAgents,
  palette,
  reduced,
  onSelectAgent,
  onCallAgent,
  callAgentId,
  callSpeaking,
  focusAgentId,
}: {
  agents: ConstellationAgent[];
  subAgents: ConstellationSubAgent[];
  palette: Palette;
  reduced: boolean;
  onSelectAgent?: (id: string) => void;
  onCallAgent?: (id: string) => void;
  callAgentId?: string | null;
  callSpeaking?: boolean;
  focusAgentId?: string | null;
}) {
  const { hub, spokes, radius, nodeScale } = useLayout(agents);
  const resources = useSharedResources();
  const rotationRef = useRef<THREE.Group>(null);
  const parallaxRef = useRef<THREE.Group>(null);
  const { invalidate, gl } = useThree();
  // true while the user is actively dragging OrbitControls — auto-rotate stands
  // down while they interact and eases back in afterwards.
  const draggingRef = useRef(false);

  // ---- focus / re-centre plumbing ----
  // a ref to OrbitControls so we can ease its `target` onto a focused node.
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // registry of each node's positioned group, keyed by agent id, so we can read
  // the focused node's live WORLD position (it sits inside the auto-rotating
  // group, so its world position moves as the net yaws).
  const nodeGroups = useRef<Map<string, THREE.Group>>(new Map());
  const registerNode = useMemo(
    () => (id: string, group: THREE.Group | null) => {
      if (group) nodeGroups.current.set(id, group);
      else nodeGroups.current.delete(id);
    },
    [],
  );
  // scratch vectors reused each frame (no per-frame allocation)
  const focusWorld = useMemo(() => new THREE.Vector3(), []);
  const originVec = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  // the hub id (focusing the hub, or null, eases the target back to the origin —
  // the historical centred behaviour).
  const hubId = hub?.agent.id ?? null;
  // whether a NON-hub agent is currently focused → treat like a user drag so the
  // ambient auto-rotate relaxes and the focused node holds still for the target.
  const nonHubFocused = !!focusAgentId && focusAgentId !== hubId;

  // a shared clock value so the sub-agent manager can stamp "born" times without
  // its own useFrame (it runs in an effect, outside the render loop).
  const nowRef = useRef(0);

  // group sub-agents by parent once per change
  const subsByParent = useMemo(() => {
    const map = new Map<string, ConstellationSubAgent[]>();
    let total = 0;
    for (const s of subAgents) {
      if (total >= MAX_SUBAGENTS_TOTAL) break;
      const arr = map.get(s.parentId) ?? [];
      if (arr.length >= MAX_SUBAGENTS_PER_PARENT) continue;
      arr.push(s);
      map.set(s.parentId, arr);
      total++;
    }
    return map;
  }, [subAgents]);

  // Pause rendering when tab hidden; resume when visible. frameloop="demand".
  useEffect(() => {
    if (reduced) {
      const rafs: number[] = [];
      let remaining = 3;
      const paintOnce = () => {
        invalidate();
        remaining -= 1;
        if (remaining > 0) rafs.push(requestAnimationFrame(paintOnce));
      };
      paintOnce();
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

  // Graceful handling of WebGL context loss — prevent the default crash.
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost, false);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  // Keep the shared clock stamped for sub-agent timing, and apply a very slow
  // ambient AUTO-ROTATE to the whole net (yaw) so the scene always reads as
  // alive. It stands down while the user is dragging OrbitControls (draggingRef)
  // and eases back in afterwards via a damped 0→1 gate, so control never fights
  // the drift. Frozen entirely under reduced-motion.
  const autoGate = useRef(1);
  useFrame((state, delta) => {
    nowRef.current = state.clock.elapsedTime;
    if (reduced) return;

    // ---- focus / re-centre: ease the OrbitControls target onto the focused
    //      node's live WORLD position (or back to the origin for hub/null). A
    //      non-hub focus also relaxes the auto-rotate (treated like a drag) so
    //      the focused node holds still and the target settles cleanly on it.
    const controls = controlsRef.current;
    let focusResolved = false;
    if (controls) {
      if (nonHubFocused && focusAgentId) {
        const group = nodeGroups.current.get(focusAgentId);
        if (group) {
          // the node sits inside the rotating group; getWorldPosition folds in
          // the current yaw so we track its true on-screen position.
          group.getWorldPosition(focusWorld);
          controls.target.set(
            damp(controls.target.x, focusWorld.x, 4, delta),
            damp(controls.target.y, focusWorld.y, 4, delta),
            damp(controls.target.z, focusWorld.z, 4, delta),
          );
          focusResolved = true;
        }
      }
      if (!focusResolved) {
        // hub / null / (focus id not yet registered) → ease back to the origin.
        controls.target.set(
          damp(controls.target.x, originVec.x, 4, delta),
          damp(controls.target.y, originVec.y, 4, delta),
          damp(controls.target.z, originVec.z, 4, delta),
        );
      }
      controls.update();
    }

    // ease the auto-rotate out while dragging OR while a non-hub agent is
    // focused (so the focused node is stationary), back in when released and
    // focus returns to the hub/null.
    const standDown = draggingRef.current || nonHubFocused;
    autoGate.current = damp(autoGate.current, standDown ? 0 : 1, 4, delta);
    if (rotationRef.current) {
      rotationRef.current.rotation.y +=
        AUTO_ROTATE_SPEED * autoGate.current * Math.min(delta, 1 / 30);
    }
  });

  // Reduced-motion: SNAP the target instead of easing (no rAF loop runs). Snap
  // to the focused node's world position (or the origin for hub/null) whenever
  // the focus changes, then repaint so the static frame reflects it. In reduced
  // mode the net doesn't auto-rotate (rotation.y stays 0), so a node's world
  // position equals its placed spoke position.
  useEffect(() => {
    if (!reduced) return;
    const controls = controlsRef.current;
    if (!controls) return;
    if (nonHubFocused && focusAgentId) {
      const group = nodeGroups.current.get(focusAgentId);
      if (group) {
        group.getWorldPosition(focusWorld);
        controls.target.copy(focusWorld);
      } else {
        controls.target.copy(originVec);
      }
    } else {
      controls.target.copy(originVec);
    }
    controls.update();
    invalidate();
  }, [reduced, nonHubFocused, focusAgentId, focusWorld, originVec, invalidate]);

  if (!hub) return null;

  return (
    <>
      {/* GLOW-ON-DARK lighting — the orbs SELF-ILLUMINATE (high emissive, see
          Node), so the scene lights only add a little FORM (a soft gradient +
          specular sheen) on top of the glow so an orb isn't a flat self-lit
          disc. Ambient is kept LOW so the near-black deck stays dark and the
          glowing orbs pop; a gentle warm key from upper-right gives a soft
          lit-side → terminator gradient and a specular highlight; a low warm
          point-fill lifts the shaded side just off black; a faint back light
          gives a hair of rim. The luminous look comes from emissive + additive
          rims/halos, NOT from these lights. */}
      <ambientLight intensity={0.28} color={0xffe9d6} />
      {/* key: a soft warm "sun" from upper-right — gentle gradient + a specular
          sheen so the glowing orb still reads as a rounded 3D form */}
      <directionalLight position={[5, 7, 8]} intensity={1.1} color={0xfff0dc} />
      {/* fill: a low warm point light from the opposite/front side so the shaded
          side sits just off black (a warm, deep gradient), not a hole */}
      <pointLight
        position={[-7, -3, 7]}
        intensity={7}
        distance={80}
        decay={2}
        color={0xffd9b8}
      />
      {/* rim: a faint back light lifting the far silhouette for roundness */}
      <directionalLight
        position={[-4, 6, -9]}
        intensity={0.5}
        color={0xffe6cf}
      />

      {/* user-driven camera: scroll to zoom, drag to rotate, right-drag/two-finger
          to pan. minDistance is small so you can zoom right IN to inspect a
          single orb; maxDistance is large so you can pull WAY OUT and see the
          whole small net inside the big starfield. */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        // initial target: the centre. After mount the Scene useFrame eases this
        // toward the focused node (or back to the origin) each frame.
        target={[0, 0, 0]}
        enablePan
        enableZoom
        enableRotate
        enableDamping={!reduced}
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        panSpeed={0.6}
        minDistance={2.5}
        maxDistance={40}
        // stand the ambient auto-rotate down while the user drags, ease it back
        // in when they let go (see the Scene useFrame autoGate).
        onStart={() => {
          draggingRef.current = true;
        }}
        onEnd={() => {
          draggingRef.current = false;
        }}
      />

      {/* Stage backdrop: a large, faint warm pool of light behind the group so
          the off-white page reads as a LIT STAGE with depth (not a dead flat
          void). Static, billboarded, well behind the net. */}
      <StageBackdrop
        palette={palette}
        radius={radius}
        backdropTexture={resources.backdropTexture}
      />

      {/* Receding perspective floor grid beneath the net — gives the light
          scene depth + a "command-centre" floor. Faint ink lines with a radial
          distance fade so it melts out toward the edges (never a hard rim). In
          its OWN group at origin so orbiting reads as a fixed floor; stays under
          reduced-motion so the scene keeps its depth when motion is off. */}
      <SceneGrid palette={palette} radius={radius} />

      {/* Dust lives in its OWN group at the scene origin (the OrbitControls
          target), OUTSIDE the parallax/rotation node group, so orbiting the
          camera reads naturally — fine motes hanging in the volume around the
          net, drifting slowly. */}
      <DustField
        palette={palette}
        reduced={reduced}
        dotGeo={resources.dotGeo}
        radius={radius}
        haloTexture={resources.haloTexture}
      />

      <group ref={parallaxRef}>
        <group ref={rotationRef}>
          {/* edges first (behind nodes) */}
          {spokes.map((spoke) => (
            <Edge
              key={`edge-${spoke.agent.id}`}
              from={hub.position}
              to={spoke.position}
              palette={palette}
              target={statusTarget(spoke.agent.status)}
              reduced={reduced}
            />
          ))}

          {/* hub — call props: it's the call node iff its id matches callAgentId */}
          <Node
            key={hub.agent.id}
            placed={hub}
            palette={palette}
            reduced={reduced}
            nodeScale={nodeScale}
            onSelect={onSelectAgent}
            onCallAgent={onCallAgent}
            subAgents={subsByParent.get(hub.agent.id) ?? []}
            nowRef={nowRef}
            resources={resources}
            isCallNode={!!callAgentId && hub.agent.id === callAgentId}
            callSpeaking={
              !!callAgentId && hub.agent.id === callAgentId && !!callSpeaking
            }
            registerNode={registerNode}
          />

          {/* spoke nodes — only the one matching callAgentId is the call node */}
          {spokes.map((spoke) => (
            <Node
              key={spoke.agent.id}
              placed={spoke}
              palette={palette}
              reduced={reduced}
              nodeScale={nodeScale}
              onSelect={onSelectAgent}
              onCallAgent={onCallAgent}
              subAgents={subsByParent.get(spoke.agent.id) ?? []}
              nowRef={nowRef}
              resources={resources}
              isCallNode={!!callAgentId && spoke.agent.id === callAgentId}
              callSpeaking={
                !!callAgentId &&
                spoke.agent.id === callAgentId &&
                !!callSpeaking
              }
              registerNode={registerNode}
            />
          ))}
        </group>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// AgentConstellation — the exported wrapper. SSR-safe: the <Canvas> only
// mounts client-side (after the mount effect), so nothing WebGL runs on the
// server. Fills its container; the parent sets the size (now the full viewport).
// ---------------------------------------------------------------------------

export function AgentConstellation({
  agents,
  subAgents = [],
  subagents = [],
  className,
  onSelectAgent,
  onCallAgent,
  callAgentId = null,
  callSpeaking = false,
  focusAgentId = null,
}: AgentConstellationProps): JSX.Element {
  // Background workers → internal sub-agent moons, merged with any legacy
  // `subAgents`. Workers are the live source now; the legacy prop is kept only
  // so existing callers don't break. Reusing the sub-agent pipeline gives us the
  // fan-out placement, tether, hover and enter/exit fade for free.
  const mergedSubAgents = useMemo<ConstellationSubAgent[]>(
    () => [...subAgents, ...subagents.map(workerToSubAgent)],
    [subAgents, subagents],
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [palette, setPalette] = useState<Palette>(FALLBACK_PALETTE);
  const [webglFailed, setWebglFailed] = useState(false);

  // client-only: read the dashboard-scoped Jarvis theme from THIS wrapper div
  // (inside `.wf`, where the scoped vars are defined) + reduced-motion, once
  // mounted. Reading document.documentElement would miss the scoped vars.
  useEffect(() => {
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

  // SSR / pre-mount: render an empty, correctly-sized, aria-hidden box. The ref
  // is attached here so getComputedStyle resolves the scoped vars on mount.
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

  // WebGL fallback — never crash the page.
  if (webglFailed) {
    return (
      <div
        ref={wrapperRef}
        className={className}
        style={{
          ...wrapperStyle,
          display: "grid",
          placeItems: "center",
          color: `rgb(${palette.inkFaint.join(",")})`,
          fontSize: 13,
        }}
        aria-hidden="true"
      >
        Visualisation unavailable
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={wrapperStyle}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        // demand loop in both cases: when animating we invalidate() each frame
        // ourselves while the tab is visible (Scene effect), so rendering
        // naturally stops when the tab is hidden. When reduced-motion we render
        // exactly a few frames of the correct static arrangement.
        frameloop="demand"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        // opens on a CENTERED, FILLED framing: the constellation reads as a
        // balanced focal group that occupies the middle of the canvas, with a
        // slight y/z offset so it reads as 3D depth immediately. The user can
        // still zoom in to inspect one orb or pull out (OrbitControls min/max).
        camera={{ position: [0, 0.6, 16.5], fov: 42 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // fully transparent — paper shows through
        }}
        onError={() => setWebglFailed(true)}
      >
        <Scene
          agents={agents}
          subAgents={mergedSubAgents}
          palette={palette}
          reduced={reduced}
          onSelectAgent={onSelectAgent}
          onCallAgent={onCallAgent}
          callAgentId={callAgentId}
          callSpeaking={callSpeaking}
          focusAgentId={focusAgentId}
        />
      </Canvas>
    </div>
  );
}

export default AgentConstellation;
