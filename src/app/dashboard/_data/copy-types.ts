// Client-safe shared types + styling for "the actual words" (bridge day 47): the
// finished copy Scribe wrote, surfaced from `copy_requests.body`. Kept apart from
// any server loader so both the marketing library tab and the front-desk deal
// panel can import these VALUES without dragging server code into the bundle.

export type OSCopyRow = {
  id: string;
  forAgent: string; // who asked for it (muse | hunter | …)
  writer: string; // who wrote it (usually scribe)
  kind: string; // email | post | dm | proposal | …
  channel: string;
  company: string;
  contact: string;
  campaign: string; // slug
  subject: string;
  body: string; // the finished copy
  when: string; // "ago"-formatted
  ts: string | null;
  // status of the piece, read from the linked approval (else the request's own
  // lifecycle): pending | approved | rejected | sent | published | drafted | …
  status: string;
};

// status chip → [bg, fg]
export const COPY_STATUS_STYLE: Record<string, [string, string]> = {
  pending: ["oklch(0.8 0.14 70 / 0.2)", "var(--ambink)"],
  approved: ["oklch(0.72 0.15 150 / 0.16)", "var(--ok)"],
  sent: ["oklch(0.72 0.15 150 / 0.16)", "var(--ok)"],
  published: ["oklch(0.72 0.15 150 / 0.16)", "var(--ok)"],
  rejected: ["oklch(0.66 0.18 28 / 0.15)", "var(--bad)"],
  drafted: ["var(--surf2)", "var(--soft)"],
};

export function copyStatusStyle(status: string): [string, string] {
  return COPY_STATUS_STYLE[status] ?? ["var(--surf2)", "var(--soft)"];
}

// ── work in flight (day-47) ───────────────────────────────────────────────────
// A copy request that hasn't reached the owner yet: Scribe is still writing, or
// asked a question, or went quiet, or refused. The strip surfaces these so a
// request doesn't vanish for an hour between the ask and the draft.
export type FlightStatus =
  | "requested"
  | "writing"
  | "question"
  | "stalled"
  | "refused";

export type OSFlightRow = {
  id: string;
  forAgent: string; // who raised it (hunter | muse | …)
  kind: string;
  who: string; // company, else the `to` recipient
  campaign: string;
  status: FlightStatus;
  ageMin: number; // minutes since the request
  approvalId: number | null; // a `question` jumps to its approval
  reason: string; // a `refused` carries its reason in the body
};

// minutes → "12 min" / "2 h" / "3 d"
export function ageLabel(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} d`;
}

export const FLIGHT_ORDER: FlightStatus[] = [
  "question",
  "refused",
  "stalled",
  "writing",
  "requested",
];
// plural phrasing for the collapsed one-liner
const FLIGHT_PHRASE: Record<FlightStatus, (n: number) => string> = {
  question: (n) => `${n} question${n === 1 ? "" : "s"} for you`,
  refused: (n) => `${n} refused`,
  stalled: (n) => `${n} stalled`,
  writing: (n) => `${n} writing`,
  requested: (n) => `${n} requested`,
};

export function inFlightSummary(rows: OSFlightRow[]): string {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const parts = FLIGHT_ORDER.filter((s) => counts[s]).map((s) =>
    FLIGHT_PHRASE[s](counts[s]),
  );
  return parts.join(" · ");
}
