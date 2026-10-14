import type { WindowKey } from "../_components/os-store";
import type { AgentKey } from "../_components/Persona";

// Window metadata — owner, collaborators, category chip, subtitle and the dock
// glyph. Mirrors the handoff's WIN/DOCKWS. The window header shows one owner
// large, collaborators as chips, and (on workspaces) a dashed chief-oversight
// chip. Approvals + Knowledge are global (no single owner). v3 §2/§6: dock,
// header and palette icon tiles are all monochrome (the --tile1→--tile2
// gradient), so per-window tile fills are gone — approvals is the one accent
// glyph, handled at the call sites.

export type WinMeta = {
  key: WindowKey;
  name: string;
  sub: string;
  owner: AgentKey | null;
  collab: AgentKey[];
  cat: string;
  glyph: string; // 24x24 stroke path
  // oversight chip shows on every workspace except Command (Chief owns it) and
  // the two globals (Approvals, Knowledge).
  oversight: boolean;
};

export const WINDOWS: Record<Exclude<WindowKey, "agent">, WinMeta> = {
  command: {
    key: "command",
    name: "command",
    sub: "everything the team is doing, in one place",
    owner: "chief",
    collab: [],
    cat: "command",
    glyph: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5",
    oversight: false,
  },
  frontdesk: {
    key: "frontdesk",
    name: "front desk",
    sub: "leads become deals become signed pilots",
    owner: "hunter",
    collab: ["scout", "scribe"],
    cat: "deals · research desk",
    glyph:
      "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
    oversight: true,
  },
  marketing: {
    key: "marketing",
    name: "marketing",
    sub: "posts, campaigns and the assets behind them",
    owner: "muse",
    collab: ["hunter", "scribe", "scout"],
    cat: "content studio · campaigns",
    glyph: "M3 10v4h3l6 4V6L6 10zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
    oversight: true,
  },
  dev: {
    key: "dev",
    name: "dev",
    sub: "what Fixer is building, fixing and shipping",
    owner: "fixer",
    collab: [],
    cat: "projects",
    glyph: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
    oversight: true,
  },
  knowledge: {
    key: "knowledge",
    name: "knowledge",
    sub: "files every agent can read, and who reads what",
    owner: null,
    collab: [],
    cat: "shared",
    glyph:
      "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5zM7 8h2M16 8h1M16 12h1",
    oversight: false,
  },
  approvals: {
    key: "approvals",
    name: "approvals",
    sub: "agents draft and prepare. you press send, merge, publish and pay.",
    owner: null,
    collab: [],
    cat: "global",
    glyph: "M5 12l5 5 9-10",
    oversight: false,
  },
  warroom: {
    key: "warroom",
    name: "war room",
    sub: "every goal, where it's heading, and what moves it",
    owner: null,
    collab: [],
    cat: "global · goals",
    glyph: "M4 4v16h16M8 15l3.5-4.5 3 2.5L20 7",
    oversight: false,
  },
};

// Dock order, left of the divider: workspaces then the approvals tile.
export const DOCK_WS: Exclude<WindowKey, "agent">[] = [
  "command",
  "frontdesk",
  "marketing",
  "dev",
  "knowledge",
];

export const AGENT_HUE_VAR: Record<AgentKey, string> = {
  chief: "--c-chief",
  scout: "--c-scout",
  hunter: "--c-hunter",
  scribe: "--c-scribe",
  muse: "--c-muse",
  fixer: "--c-fixer",
  you: "--accent",
};
export const AGENT_TINT_VAR: Record<AgentKey, string> = {
  chief: "--t-chief",
  scout: "--t-scout",
  hunter: "--t-hunter",
  scribe: "--t-scribe",
  muse: "--t-muse",
  fixer: "--t-fixer",
  you: "--t-chief",
};
