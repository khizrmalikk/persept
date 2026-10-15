// Client-safe shared types for the knowledge graph (bridge day-38). The vault is
// mirrored into wiki_nodes / wiki_edges / wiki_meta; the dashboard reads them and
// builds the 3D graph. The `embedding` vector NEVER reaches the client — it is
// stripped server-side, so it is absent from WikiNode here.

export type WikiNodeType =
  | "entity"
  | "concept"
  | "synthesis"
  | "source"
  | "report";

export type WikiNode = {
  id: string; // page id, e.g. entities/company-la-brisa-dubai
  path: string;
  type: WikiNodeType;
  title: string;
  entityType: string; // company | campaign | goal | project | agent | person | …
  owner: string | null; // agent id or null
  tags: string[];
  privacy: string; // public | local-private | …
  summary: string;
  words: number;
  degree: number;
  mtime: string | null;
  updatedAt: string | null;
};

export type WikiEdgeKind =
  | "link"
  | "related"
  | "part-of"
  | "contact"
  | "worked-by"
  | "similar"
  | "manual";

export type WikiEdge = {
  source: string;
  target: string;
  kind: WikiEdgeKind;
  weight: number;
};

export type WikiMeta = {
  nodes: number;
  edges: number;
  embedded: number;
  syncedAt: string | null;
};

export type OSGraph = {
  nodes: WikiNode[];
  edges: WikiEdge[];
  meta: WikiMeta | null;
};

export const NODE_TYPES: WikiNodeType[] = [
  "entity",
  "concept",
  "synthesis",
  "source",
  "report",
];

// a page is public unless its privacy says otherwise.
export const isPublic = (n: { privacy: string }): boolean =>
  !n.privacy || n.privacy.toLowerCase() === "public";

// ── graph-render shared values (kept here, client-safe, so GraphView never has to
// import a VALUE from KGraph — that would pull react-force-graph/three into SSR) ──

export type GLink = {
  source: string;
  target: string;
  kind: string;
  weight: number;
};
export type GColors = {
  bg: string;
  ink: string;
  mute: string;
  line: string;
  accent: string;
  dim: string;
  type: Record<string, string>;
  owner: Record<string, string>;
};
// edge kinds drawn as solid lines (everything except `similar`, which is dashed
// and hidden by default).
export const SOLID_KINDS = new Set([
  "link",
  "related",
  "part-of",
  "contact",
  "worked-by",
  "manual",
]);
