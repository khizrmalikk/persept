// The canonical six-agent roster: id, display name, emoji, hue and room. Pure
// (no server imports) so both the sidebar and the office can use it. Per-agent
// colour is one hue at oklch(0.78 0.12 H); tints/borders reuse the same hue.
// Matches the redesign handoff.

export type RosterAgent = {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  room: string;
  role: string;
  // static roster facts for the agent page's "how work flows" + "owns / works in".
  // NOT fixtures — these describe the fixed shape of the workforce, not live state.
  mandate: string; // what this agent is for
  from: string[]; // who hands work to it
  to: string[]; // who it hands work to
};

export const ROSTER: RosterAgent[] = [
  {
    id: "percy",
    name: "Percy",
    emoji: "🗂️",
    hue: 70,
    room: "operator",
    role: "operator",
    mandate:
      "your main agent. talks with you, hands work to the team and works on your screen.",
    from: ["all agents"],
    to: ["all agents"],
  },
  {
    id: "scout",
    name: "Scout",
    emoji: "🔭",
    hue: 20,
    room: "research",
    role: "research",
    mandate: "finds prospects and signal. hands leads to Hunter.",
    from: ["Percy"],
    to: ["Hunter"],
  },
  {
    id: "hunter",
    name: "Hunter",
    emoji: "🎯",
    hue: 150,
    room: "outreach & sales",
    role: "outreach",
    mandate: "campaigns, pipeline, conversations and outbound sends.",
    from: ["Scout", "Scribe"],
    to: ["Scribe", "you"],
  },
  {
    id: "scribe",
    name: "Scribe",
    emoji: "📝",
    hue: 220,
    room: "proposals & clients",
    role: "proposals",
    mandate: "writes and revises proposals. transcribes calls.",
    from: ["Hunter"],
    to: ["Hunter"],
  },
  {
    id: "muse",
    name: "Muse",
    emoji: "✍️",
    hue: 110,
    room: "marketing studio",
    role: "marketing",
    mandate: "drafts posts and images, publishes, learns from stats.",
    from: ["Hunter", "Scout"],
    to: ["you"],
  },
  {
    id: "fixer",
    name: "Fixer",
    emoji: "🔧",
    hue: 290,
    room: "dev & debugging",
    role: "dev & debugging",
    mandate: "runs code projects, ships fixes, does research passes.",
    from: ["Percy"],
    to: ["you"],
  },
];

const BY_ID: Record<string, RosterAgent> = Object.fromEntries(
  ROSTER.map((r) => [r.id, r]),
);
export const rosterById = (id: string): RosterAgent | undefined => BY_ID[id];

// agent colour helpers. alpha < 1 → the tint/border form.
export function agentColor(hue: number, alpha = 1): string {
  return alpha >= 1
    ? `oklch(0.78 0.12 ${hue})`
    : `oklch(0.78 0.12 ${hue} / ${alpha})`;
}

export type AgentStatus = "working" | "waiting" | "idle" | "soon";

// Serializable shape the sidebar renders (colours pre-computed server-side).
export type SidebarAgent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  href: string;
  status: AgentStatus;
  workers: number;
};
