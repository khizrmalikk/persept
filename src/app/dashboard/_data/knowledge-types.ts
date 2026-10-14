import type { AgentKey } from "../_components/Persona";

// Client-safe shared types for the knowledge window. Kept apart from knowledge.ts
// (the loader, which imports server-only supabaseAdmin) so the client window can
// import these VALUES/types without dragging server code into the browser bundle.

// The six agents that can be given read access (never "you").
export const KNOWLEDGE_AGENTS: Exclude<AgentKey, "you">[] = [
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];

export type OSKnowledgeFile = {
  id: string;
  name: string; // title, falling back to the filename
  type: string; // short chip, e.g. "md", "pdf"
  size: string; // human-readable
  updated: string; // relative, e.g. "3d ago"
  project: string | null; // attached Fixer project, if any
  agents: AgentKey[]; // readers (a subset of KNOWLEDGE_AGENTS)
  title: string; // raw title (preserved when toggling readers)
  summary: string; // raw summary (preserved when toggling readers)
  excerpt: string; // a short content preview
};

export type OSKnowledge = {
  files: OSKnowledgeFile[];
};
