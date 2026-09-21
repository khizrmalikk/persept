// Small pure presentation helpers for the workforce dashboard. Read-only, no I/O.

import type { Agent } from "@/lib/workforce/types";
import type { ConstellationStatus } from "@/app/dashboard/_components/AgentConstellation";

const CONSTELLATION_STATUSES: ConstellationStatus[] = [
  "idle",
  "working",
  "waiting",
  "error",
  "offline",
];

/** Clamp an arbitrary agent status string to the constellation union. */
export function toConstellationStatus(
  status: string | null | undefined,
): ConstellationStatus {
  if (status && (CONSTELLATION_STATUSES as string[]).includes(status)) {
    return status as ConstellationStatus;
  }
  return "idle";
}

/** True if this agent looks like the chief-of-staff / orchestrator (the hub). */
export function looksLikeChief(
  a: Pick<Agent, "id" | "role" | "name">,
): boolean {
  if (a.id === "chief") return true;
  return /chief/i.test(`${a.role ?? ""} ${a.name ?? ""}`);
}

/** Format a minutes value as a friendly duration: "3m", "1h 12m", "<1m". */
export function fmtMins(mins: number | null): string {
  if (mins === null) return "—";
  if (mins < 1) return "<1m";
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Format a 0..1 ratio as an integer percent, or "—" when null. */
export function fmtPct(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)}%`;
}
