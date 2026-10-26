import type { AgentKey } from "../_components/Persona";

// Client-safe types for the desktop widgets (goals / activity feed / today's
// runs). Kept apart from desktop.ts (server loader) per the client/server split.

export type OSGoal = {
  label: string;
  period: string;
  value: number;
  target: number;
};

export type OSEvent = {
  id: string;
  agent: AgentKey;
  kind: string;
  text: string;
  when: string;
};

export type OSRun = {
  minutes: number; // minutes since midnight (Dubai)
  agent: AgentKey;
  name: string;
  status: "planned" | "running" | "done" | "failed" | "missed";
  why: string; // tooltip ("scheduled", "the owner asked for it", "…, 23 min late")
  reply: string; // shown on click when the run finished
  error: string; // shown on click when the run failed
};

export type OSDesktop = {
  goals: OSGoal[];
  feed: OSEvent[];
  runs: OSRun[];
};
