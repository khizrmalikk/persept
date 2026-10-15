"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  type GColors,
  isPublic,
  NODE_TYPES,
  type OSGraph,
  SOLID_KINDS,
  type WikiNode,
  type WikiNodeType,
} from "@/lib/workforce/wiki-types";
import { type AgentKey, Persona } from "../Persona";

// The knowledge graph tab. Owns all chrome + state; dynamic-imports the WebGL
// renderer (KGraph) client-side only. Reads /api/os/graph once (embeddings already
// stripped) and the semantic-search / related / page routes on demand.

const KGraph = dynamic(() => import("./KGraph").then((m) => m.KGraph), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--mute)",
        fontSize: 13,
      }}
    >
      loading graph…
    </div>
  ),
});

const ROSTER: AgentKey[] = [
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];
const TYPE_LABEL: Record<WikiNodeType, string> = {
  entity: "entities",
  concept: "concepts",
  synthesis: "synthesis",
  source: "sources",
  report: "reports",
};

// resolve the OS CSS vars to concrete rgb() the WebGL canvas can use (handles oklch
// by round-tripping through getComputedStyle().color).
function buildColors(root: Element): GColors {
  const cs = getComputedStyle(root);
  const norm = (val: string) => {
    const tmp = document.createElement("span");
    tmp.style.color = val || "#888";
    root.appendChild(tmp);
    const rgb = getComputedStyle(tmp).color;
    tmp.remove();
    return rgb || "#888888";
  };
  const v = (name: string) => norm(cs.getPropertyValue(name).trim() || "#888");
  return {
    bg: v("--bg"),
    ink: v("--ink"),
    mute: v("--mute"),
    line: v("--line"),
    accent: v("--accent"),
    dim: norm("rgba(128,128,128,0.22)"),
    type: {
      entity: v("--ink"),
      concept: v("--c-chief"),
      synthesis: v("--accent"),
      source: v("--mute"),
      report: norm("#4a4640"),
    },
    owner: {
      chief: v("--c-chief"),
      scout: v("--c-scout"),
      hunter: v("--c-hunter"),
      scribe: v("--c-scribe"),
      muse: v("--c-muse"),
      fixer: v("--c-fixer"),
      you: v("--accent"),
    },
  };
}

// label-propagation community detection → a distinct colour per congregation. The
// force layout pulls structural communities together, so colouring by community
// matches the visible clusters. Small communities (<3) stay muted so only the real
// congregations light up.
function clusterColorMap(
  nodes: WikiNode[],
  links: { source: string; target: string }[],
  mute: string,
): Record<string, string> {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const l of links) {
    if (adj.has(l.source) && adj.has(l.target)) {
      adj.get(l.source)?.push(l.target);
      adj.get(l.target)?.push(l.source);
    }
  }
  const label = new Map(nodes.map((n) => [n.id, n.id]));
  for (let it = 0; it < 12; it++) {
    let changed = false;
    for (const n of nodes) {
      const nb = adj.get(n.id);
      if (!nb || !nb.length) continue;
      const cnt = new Map<string, number>();
      for (const x of nb) {
        const l = label.get(x);
        if (l) cnt.set(l, (cnt.get(l) ?? 0) + 1);
      }
      let best = label.get(n.id) ?? n.id;
      let bc = -1;
      for (const [l, c] of cnt)
        if (c > bc || (c === bc && l < best)) {
          best = l;
          bc = c;
        }
      if (best !== label.get(n.id)) {
        label.set(n.id, best);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const size = new Map<string, number>();
  for (const l of label.values()) size.set(l, (size.get(l) ?? 0) + 1);
  const big = [...size.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);
  const colorByLabel = new Map<string, string>();
  big.forEach((l, i) => {
    colorByLabel.set(l, `hsl(${Math.round((i * 137.508) % 360)} 62% 58%)`);
  });
  const out: Record<string, string> = {};
  for (const [id, l] of label) out[id] = colorByLabel.get(l) ?? mute;
  return out;
}

const ago = (iso: string | null): string => {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "never";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function GraphView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<OSGraph | null>(null);
  const [colors, setColors] = useState<GColors | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [colorMode, setColorMode] = useState<"type" | "owner" | "cluster">(
    "type",
  );
  const [camera, setCamera] = useState<{ action: string; n: number } | null>(
    null,
  );
  const [showSimilar, setShowSimilar] = useState(false);
  const [typeFilter, setTypeFilter] = useState<Set<WikiNodeType>>(new Set());
  const [ownerFilter, setOwnerFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [semanticIds, setSemanticIds] = useState<Set<string>>(new Set());
  const [degraded, setDegraded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [page, setPage] = useState<{ summary: string; body: string } | null>(
    null,
  );
  const [related, setRelated] = useState<WikiNode[]>([]);
  // the WebGL canvas crashes without hardware acceleration (e.g. a headless or
  // GPU-less environment); detect it so the tab degrades to a notice instead.
  const [webgl, setWebgl] = useState<boolean | null>(null);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // detect WebGL once
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      setWebgl(!!gl);
    } catch {
      setWebgl(false);
    }
  }, []);

  // fetch the graph once
  useEffect(() => {
    let live = true;
    fetch("/api/os/graph", { cache: "no-store" })
      .then((r) => r.json())
      .then((g: OSGraph) => {
        if (live) setGraph(g);
      })
      .catch(() => {
        if (live) setGraph({ nodes: [], edges: [], meta: null });
      });
    return () => {
      live = false;
    };
  }, []);

  // resolve colors + measure, re-measuring on resize
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.closest(".os-root") ?? document.documentElement;
    setColors(buildColors(root));
    const ro = new ResizeObserver(() => {
      const r = host.getBoundingClientRect();
      setDims({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // side panel: fetch page content + related when a node is selected
  useEffect(() => {
    if (!selectedId) {
      setPage(null);
      setRelated([]);
      return;
    }
    let live = true;
    const id = encodeURIComponent(selectedId);
    fetch(`/api/os/graph/page?id=${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((p: { summary?: string; body?: string }) => {
        if (live) setPage({ summary: p.summary ?? "", body: p.body ?? "" });
      })
      .catch(() => live && setPage(null));
    fetch(`/api/os/graph/related?id=${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ids?: string[] }) => {
        if (!live) return;
        const byId = new Map((graph?.nodes ?? []).map((n) => [n.id, n]));
        setRelated(
          (d.ids ?? []).map((i) => byId.get(i)).filter(Boolean) as WikiNode[],
        );
      })
      .catch(() => live && setRelated([]));
    return () => {
      live = false;
    };
  }, [selectedId, graph]);

  const nodes = graph?.nodes ?? [];
  const selected = selectedId
    ? (nodes.find((n) => n.id === selectedId) ?? null)
    : null;
  const ownersPresent = useMemo(
    () => new Set(nodes.map((n) => n.owner).filter(Boolean) as string[]),
    [nodes],
  );

  // reference-stable graphData: only changes when the data or the filters change.
  const graphData = useMemo(() => {
    const vis = nodes.filter(
      (n) =>
        (typeFilter.size === 0 || typeFilter.has(n.type)) &&
        (ownerFilter.size === 0 ||
          (n.owner != null && ownerFilter.has(n.owner))),
    );
    const visIds = new Set(vis.map((n) => n.id));
    const links = (graph?.edges ?? [])
      .filter((e) => visIds.has(e.source) && visIds.has(e.target))
      .filter((e) => showSimilar || SOLID_KINDS.has(e.kind));
    return { nodes: vis, links };
  }, [nodes, graph, typeFilter, ownerFilter, showSimilar]);

  // per-node cluster colour (only computed when the cluster mode is on).
  const clusterColor = useMemo(
    () =>
      colorMode === "cluster" && colors
        ? clusterColorMap(
            nodes,
            (graph?.edges ?? []).filter((e) => SOLID_KINDS.has(e.kind)),
            colors.mute,
          )
        : {},
    [colorMode, nodes, graph, colors],
  );

  // search highlight: semantic ids if a semantic run is active, else title/tag text match.
  const q = search.trim().toLowerCase();
  const matchSet = useMemo(() => {
    if (semanticIds.size) return semanticIds;
    if (!q) return new Set<string>();
    return new Set(
      nodes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q)),
        )
        .map((n) => n.id),
    );
  }, [q, semanticIds, nodes]);
  const searchActive = q.length > 0 || semanticIds.size > 0;

  const runSemantic = async () => {
    if (!q) return;
    try {
      const r = await fetch("/api/os/graph/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: search.trim() }),
      });
      const d = (await r.json()) as { ids?: string[]; degraded?: boolean };
      setDegraded(!!d.degraded);
      setSemanticIds(new Set(d.ids ?? []));
    } catch {
      setDegraded(true);
    }
  };

  const toggle = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  };

  const meta = graph?.meta;
  const stale =
    meta?.syncedAt &&
    Date.now() - new Date(meta.syncedAt).getTime() > 60 * 60 * 1000;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 16px",
          borderBottom: "1px solid var(--line)",
          fontSize: 12.5,
          color: "var(--soft)",
          flexWrap: "wrap",
        }}
      >
        <span className="os-mono" style={{ fontSize: 11 }}>
          {meta ? `${meta.nodes} pages · ${meta.edges} links` : "…"} · synced{" "}
          {ago(meta?.syncedAt ?? null)}
        </span>
        {stale && (
          <span style={{ color: "var(--ambink)" }}>
            vault hasn&apos;t synced in over an hour
          </span>
        )}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Chip
            on={colorMode !== "type"}
            onClick={() =>
              setColorMode(
                colorMode === "type"
                  ? "owner"
                  : colorMode === "owner"
                    ? "cluster"
                    : "type",
              )
            }
          >
            colour: {colorMode}
          </Chip>
          <Chip on={showSimilar} onClick={() => setShowSimilar((v) => !v)}>
            similar links
          </Chip>
          <Chip
            on={false}
            onClick={() => {
              setTypeFilter(new Set<WikiNodeType>(["entity"]));
              setOwnerFilter(new Set());
            }}
          >
            entities only
          </Chip>
          <Chip
            on={false}
            onClick={() => {
              setTypeFilter(new Set<WikiNodeType>(["source", "concept"]));
              setOwnerFilter(new Set());
            }}
          >
            docs
          </Chip>
        </div>
      </div>

      {/* filter + search bar */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderBottom: "1px solid var(--line)",
          flexWrap: "wrap",
        }}
      >
        {NODE_TYPES.map((t) => (
          <Chip
            key={t}
            on={typeFilter.has(t)}
            onClick={() => setTypeFilter((s) => toggle(s, t))}
          >
            {TYPE_LABEL[t]}
          </Chip>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--line)" }} />
        {ROSTER.filter((a) => ownersPresent.has(a)).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setOwnerFilter((s) => toggle(s, a))}
            title={a}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              opacity: ownerFilter.size === 0 || ownerFilter.has(a) ? 1 : 0.3,
              boxShadow: ownerFilter.has(a)
                ? `0 0 0 2px var(--c-${a})`
                : "none",
              borderRadius: "50%",
            }}
          >
            <Persona agent={a} size={22} />
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSemanticIds(new Set());
            setDegraded(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSemantic();
          }}
          placeholder="filter by title/tag · enter for semantic search"
          style={{
            marginLeft: "auto",
            width: 300,
            maxWidth: "50%",
            padding: "7px 11px",
            borderRadius: 9,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
        {degraded && (
          <span style={{ fontSize: 11.5, color: "var(--ambink)" }}>
            semantic search needs OPENAI_API_KEY
          </span>
        )}
      </div>

      {/* canvas + side panel */}
      <div
        style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}
      >
        <div
          ref={hostRef}
          style={{ flex: 1, minWidth: 0, position: "relative" }}
        >
          {webgl === false ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--mute)",
                fontSize: 13,
                textAlign: "center",
                padding: 40,
              }}
            >
              the 3D graph needs WebGL (hardware acceleration).{" "}
              {meta?.nodes ?? 0} pages are in the vault.
            </div>
          ) : colors && dims.w > 0 && nodes.length > 0 && webgl ? (
            <>
              <KGraph
                graphData={graphData}
                width={dims.w}
                height={dims.h}
                colors={colors}
                colorMode={colorMode}
                clusterColor={clusterColor}
                selectedId={selectedId}
                searchActive={searchActive}
                matchSet={matchSet}
                reduce={!!reduce}
                focus={focus}
                camera={camera}
                onNodeClick={(id) => setSelectedId(id)}
                onNodeDblClick={(id) => setFocus({ id, n: Date.now() })}
                onBackground={() => setSelectedId(null)}
              />
              {/* nav controls */}
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  bottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {(
                  [
                    ["in", "+", "zoom in"],
                    ["out", "−", "zoom out"],
                    ["fit", "⤢", "fit all"],
                    ["reset", "⌖", "recenter"],
                  ] as const
                ).map(([action, glyph, title]) => (
                  <button
                    key={action}
                    type="button"
                    title={title}
                    onClick={() => setCamera({ action, n: Date.now() })}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      border: "1px solid var(--line)",
                      background: "var(--surf)",
                      color: "var(--ink)",
                      fontSize: 16,
                      lineHeight: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--mute)",
                fontSize: 13,
              }}
            >
              {graph && nodes.length === 0
                ? "the vault graph is empty."
                : "loading graph…"}
            </div>
          )}
        </div>

        {/* side panel */}
        {selected && (
          <div
            style={{
              flex: "none",
              width: 360,
              borderLeft: "1px solid var(--line)",
              overflow: "auto",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--surf)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="os-mono"
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--mute)",
                  }}
                >
                  {selected.type}
                  {selected.entityType ? ` · ${selected.entityType}` : ""}
                  {!isPublic(selected) ? " · private" : ""}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                  {selected.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--soft)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>
            {selected.owner && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 12.5,
                }}
              >
                <Persona agent={selected.owner as AgentKey} size={20} />
                <span style={{ color: "var(--soft)" }}>{selected.owner}</span>
              </div>
            )}
            {selected.tags.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {selected.tags.slice(0, 12).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--surf2)",
                      color: "var(--soft)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {isPublic(selected) ? (
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--soft)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {page?.body ||
                  page?.summary ||
                  selected.summary ||
                  "no summary."}
              </p>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--mute)", margin: 0 }}>
                this page is private — summary hidden.
              </p>
            )}
            <div
              className="os-mono"
              style={{ fontSize: 10, color: "var(--mute)" }}
            >
              {selected.words} words · degree {selected.degree}
            </div>
            {related.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  className="os-mono"
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--mute)",
                  }}
                >
                  related
                </span>
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    style={{
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--line)",
                      padding: "6px 0",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontSize: 12.5,
                    }}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 11.5,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`,
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--bg)" : "var(--soft)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
