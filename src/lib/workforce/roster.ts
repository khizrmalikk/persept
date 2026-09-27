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
};

export const ROSTER: RosterAgent[] = [
  {
    id: "chief",
    name: "Chief",
    emoji: "🗂️",
    hue: 70,
    room: "chief of staff",
    role: "chief of staff",
  },
  {
    id: "scout",
    name: "Scout",
    emoji: "🔭",
    hue: 20,
    room: "research",
    role: "research",
  },
  {
    id: "hunter",
    name: "Hunter",
    emoji: "🎯",
    hue: 150,
    room: "outreach & sales",
    role: "outreach",
  },
  {
    id: "scribe",
    name: "Scribe",
    emoji: "📝",
    hue: 220,
    room: "proposals & clients",
    role: "proposals",
  },
  {
    id: "muse",
    name: "Muse",
    emoji: "✍️",
    hue: 110,
    room: "marketing studio",
    role: "marketing",
  },
  {
    id: "fixer",
    name: "Fixer",
    emoji: "🔧",
    hue: 290,
    room: "dev & debugging",
    role: "dev & debugging",
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
