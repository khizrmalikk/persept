"use client";

import { useEffect, useRef } from "react";
import ForceGraph3DImport from "react-force-graph-3d";
import * as THREE from "three";
import {
  type GColors,
  type GLink,
  isPublic,
  type WikiNode,
} from "@/lib/workforce/wiki-types";

// react-force-graph-3d ships very strict generic accessor types that fight our
// `raw as NodeObj` casts; treat the component as untyped and keep the safety in
// the typed accessor bodies below.
// biome-ignore lint/suspicious/noExplicitAny: see note above
const ForceGraph3D = ForceGraph3DImport as any;

// The WebGL force graph. Isolated in its own file so GraphView can dynamic-import
// it with ssr:false (react-force-graph / three touch `window` at import). It owns
// the camera ref (double-click focus, zoom-to-fit on settle) and derives every
// node/link visual from the plain props GraphView passes.

type NodeObj = WikiNode & {
  x?: number;
  y?: number;
  z?: number;
  __threeObj?: THREE.Object3D;
};
// force-graph replaces source/target with node objects once the sim runs, but they
// are plain ids before that — handle both.
type LinkObj = {
  kind: string;
  source: string | NodeObj;
  target: string | NodeObj;
};

export function KGraph({
  graphData,
  width,
  height,
  colors,
  colorMode,
  clusterColor,
  selectedId,
  searchActive,
  matchSet,
  reduce,
  focus,
  camera,
  onNodeClick,
  onNodeDblClick,
  onBackground,
}: {
  // reference-stable (memoized in GraphView) — a new object re-inits the sim.
  graphData: { nodes: WikiNode[]; links: GLink[] };
  width: number;
  height: number;
  colors: GColors;
  colorMode: "type" | "owner" | "cluster";
  clusterColor: Record<string, string>;
  selectedId: string | null;
  searchActive: boolean;
  matchSet: Set<string>;
  reduce: boolean;
  focus: { id: string; n: number } | null;
  camera: { action: string; n: number } | null;
  onNodeClick: (id: string) => void;
  onNodeDblClick: (id: string) => void;
  onBackground: () => void;
}) {
  // biome-ignore lint/suspicious/noExplicitAny: the react-force-graph instance has no exported ref type
  const fgRef = useRef<any>(null);

  // size by degree, log scale, clamped 2…10.
  const sizeOf = (n: WikiNode) =>
    Math.max(2, Math.min(10, 2 + Math.log2(n.degree + 1) * 1.4));

  const nodeColor = (raw: object) => {
    const n = raw as NodeObj;
    if (selectedId && n.id === selectedId) return colors.accent;
    if (searchActive) return matchSet.has(n.id) ? colors.accent : colors.dim;
    if (colorMode === "cluster") return clusterColor[n.id] ?? colors.mute;
    return colorMode === "owner"
      ? (colors.owner[n.owner ?? ""] ?? colors.mute)
      : (colors.type[n.type] ?? colors.mute);
  };

  const nodeLabel = (raw: object) => {
    const n = raw as NodeObj;
    const bits = [`<b>${esc(n.title)}</b>`];
    bits.push(
      `<span style="opacity:.7">${esc(n.type)}${n.owner ? ` · ${esc(n.owner)}` : ""}</span>`,
    );
    if (isPublic(n) && n.summary)
      bits.push(`<span>${esc(n.summary.slice(0, 160))}</span>`);
    else if (!isPublic(n)) bits.push(`<span style="opacity:.6">private</span>`);
    return `<div style="max-width:260px;padding:6px 9px;border-radius:8px;background:${colors.bg};color:${colors.ink};border:1px solid ${colors.line};font-size:12px;line-height:1.4;display:flex;flex-direction:column;gap:3px">${bits.join("")}</div>`;
  };

  // a non-public page gets a dashed-looking wireframe ring; degree≥6 gets a label
  // sprite. Both extend the default sphere (nodeThreeObjectExtend). Static per node.
  const nodeThreeObject = (raw: object) => {
    const n = raw as NodeObj;
    const needRing = !isPublic(n);
    const needLabel = n.degree >= 6;
    if (!needRing && !needLabel) return undefined;
    const group = new THREE.Group();
    const r = sizeOf(n);
    if (needRing) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r * 1.9, r * 0.12, 6, 18),
        new THREE.MeshBasicMaterial({ color: colors.mute, wireframe: true }),
      );
      group.add(ring);
    }
    if (needLabel) group.add(labelSprite(n.title, colors.ink, colors.bg));
    return group;
  };

  const linkColor = (raw: object) => {
    const l = raw as LinkObj;
    return l.kind === "similar" ? colors.dim : colors.line;
  };
  const linkWidth = (raw: object) =>
    (raw as LinkObj).kind === "similar" ? 0.4 : 1;
  const endId = (e: string | NodeObj) => (typeof e === "object" ? e.id : e);
  const linkParticles = (raw: object) => {
    if (reduce || !selectedId) return 0;
    const l = raw as LinkObj;
    return endId(l.source) === selectedId || endId(l.target) === selectedId
      ? 2
      : 0;
  };

  // double-click → fly the camera to the node.
  useEffect(() => {
    if (!focus || !fgRef.current) return;
    const fg = fgRef.current;
    const n = (fg.graphData().nodes as NodeObj[]).find(
      (x) => x.id === focus.id,
    );
    if (!n || n.x == null) return;
    const dist = 120;
    const ratio = 1 + dist / Math.hypot(n.x, n.y ?? 0, n.z ?? (0 || 1));
    fg.cameraPosition(
      { x: (n.x ?? 0) * ratio, y: (n.y ?? 0) * ratio, z: (n.z ?? 0) * ratio },
      n,
      800,
    );
  }, [focus]);

  // nav controls: zoom in/out, fit-to-view, recenter.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !camera) return;
    if (camera.action === "fit") {
      fg.zoomToFit?.(600, 60);
      return;
    }
    if (camera.action === "reset") {
      fg.cameraPosition?.({ x: 0, y: 0, z: 600 }, { x: 0, y: 0, z: 0 }, 700);
      return;
    }
    const cam = fg.camera?.();
    if (cam) {
      const f = camera.action === "in" ? 0.72 : 1.38;
      fg.cameraPosition?.(
        {
          x: cam.position.x * f,
          y: cam.position.y * f,
          z: cam.position.z * f,
        },
        undefined,
        300,
      );
    }
  }, [camera]);

  return (
    <ForceGraph3D
      ref={fgRef}
      width={width}
      height={height}
      backgroundColor={colors.bg}
      graphData={graphData}
      nodeId="id"
      nodeColor={nodeColor}
      nodeVal={(n: object) => sizeOf(n as NodeObj)}
      nodeLabel={nodeLabel}
      nodeThreeObjectExtend={true}
      nodeThreeObject={nodeThreeObject}
      nodeOpacity={0.9}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkOpacity={0.5}
      linkDirectionalParticles={linkParticles}
      linkDirectionalParticleWidth={1.4}
      enablePointerInteraction={true}
      cooldownTicks={120}
      warmupTicks={40}
      onNodeClick={(n: object) => onNodeClick((n as NodeObj).id)}
      onNodeRightClick={(n: object) => onNodeDblClick((n as NodeObj).id)}
      onBackgroundClick={onBackground}
      onEngineStop={() => fgRef.current?.zoomToFit?.(400, 40)}
    />
  );
}

// a small text label as a camera-facing sprite drawn on a canvas (no extra dep).
function labelSprite(text: string, ink: string, bg: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const label = text.length > 24 ? `${text.slice(0, 23)}…` : text;
  const font = 28;
  canvas.width = 512;
  canvas.height = 64;
  if (ctx) {
    ctx.font = `600 ${font}px ui-sans-serif, system-ui, sans-serif`;
    const w = ctx.measureText(label).width + 24;
    ctx.fillStyle = bg;
    roundRect(ctx, (canvas.width - w) / 2, 10, w, 44, 10);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, canvas.width / 2, 33);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(16, 2, 1);
  sprite.position.set(0, 8, 0);
  return sprite;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
