import type { OSMoney } from "@/lib/workforce/stripe-types";
import type { AgentKey } from "../_components/Persona";

// Client-safe types + the PURE projection maths for the war room (goals
// overlook). Kept apart from warroom.ts (the loader, which imports server-only
// supabaseAdmin) so the client window can import these VALUES without dragging
// server code into the browser bundle. Ported from the v2 handoff store
// (goalStats / fmtGoal / STAGEP / STC) so the terminal computes "now" on the
// client and stays live.

export type GoalModel = "pace" | "pipeline";
// day-32 sources. won-count/won-value are computed from `prospects` in goalStats;
// the live sources (prospects-count/replied-count/calls-count) are kept current
// by the bridge in `goals.cur`, so the maths reads `g.cur` for them (like manual).
export type GoalSrc =
  | "manual"
  | "won-count"
  | "won-value"
  | "prospects-count"
  | "replied-count"
  | "calls-count"
  // day-40 Stripe live sources — the bridge keeps `goals.cur` current, so the
  // maths reads `g.cur` for these exactly like the other live sources.
  | "stripe-mrr"
  | "stripe-month"
  | "stripe-customers";
export type GoalStatus = "hit" | "new" | "on track" | "at risk" | "behind";
export type GoalUnit = "" | "AED";
export type StepStatus = "todo" | "doing" | "waiting" | "done";

export type OSGoalStep = {
  id: string;
  t: string; // the step, short
  a: AgentKey; // who does it
  when: string; // "today", "by fri", "15 nov", …
  st: StepStatus;
  bl: boolean; // already pushed to the backlog
};

export type OSGoalPhase = {
  id: string;
  n: string; // phase name
  a: AgentKey; // owner of the phase
  from: number; // weeks from today (may be negative = started already)
  to: number; // weeks from today
  m: string; // milestone reached at the end
};

export type OSWarGoal = {
  id: string;
  n: string; // the goal, e.g. "pilots signed"
  tag: string; // short tag for chips
  unit: GoalUnit;
  src: GoalSrc;
  model: GoalModel;
  target: number;
  cur: number; // stored value (used when src === "manual")
  start: string; // ISO date
  due: string; // ISO date
  owner: AgentKey;
  team: AgentKey[];
  plan: OSGoalStep[];
  road: OSGoalPhase[];
  hist: [number, number][]; // [days-since-start, value] weekly snapshots
  summary: string;
  planAt: string; // when Chief re-plans, e.g. "mon" (shown in the roadmap line)
  planning: boolean;
  stale: boolean;
  madeBy: string; // "you" | "chief"
};

export type OSWarDeal = { stage: string; value: number };

// pending approvals / failed fixes / due backlog, with an estimated per-goal
// impact. The client computes the final score (needs live stats) and sorts.
export type OSRawMover = {
  id: string;
  a: AgentKey;
  title: string;
  why: string;
  cta: string;
  // derived kinds (approve/openap/fix/bl) + "mover" = a Chief-authored goal_movers
  // row, tapping it sends `ask` to agent `a` and marks the mover done.
  kind: "approve" | "openap" | "fix" | "bl" | "mover";
  apId?: number;
  apAgent?: AgentKey;
  fixId?: string;
  blTab?: string;
  moverId?: string; // goal_movers row id (kind === "mover")
  ask?: string; // message sent to the agent when tapped
  fx: { gid: string; delta: number }[];
};

export type OSTicker = {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "neutral" | "amber";
  spark: number[];
  win: string | null; // window to open on click
  tab?: string;
};

export type OSWarRoom = {
  goals: OSWarGoal[];
  open: OSWarDeal[]; // open deals (stage in STAGE_ODDS) for the pipeline model
  wonCount: number;
  wonValue: number;
  movers: OSRawMover[];
  ticker: OSTicker[];
  // day-42: the money tab lives here now. `deals` is a lite prospect list for the
  // payment-link picker and for naming linked payments.
  money: OSMoney;
  deals: { key: string; company: string; stage: string }[];
};

export type OSGoalStats = {
  cur: number;
  T: number; // total days start→due
  el: number; // elapsed days
  left: number; // days left
  wl: number; // weeks left
  hist: [number, number][]; // snapshots clipped to el, plus [el, cur]
  pace: number; // per-week over the last 4 weeks
  need: number; // per-week needed to hit target
  E: number; // expected additional value by the deadline
  sd: number; // its standard deviation
  proj: number; // cur + E
  lo: number;
  hi: number;
  ratio: number; // proj / target
  prob: number | null; // odds of hitting it (null while fresh)
  status: GoalStatus;
  fresh: boolean;
  pct: number; // cur / target, clamped
  d7: number; // change over the last week
};

// ── constants ──────────────────────────────────────────────────────────────
export const MONS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const DAY = 86400000;

// open-stage odds of eventually closing (won/lost are realized, not in here)
export const STAGE_ODDS: Record<string, number> = {
  prospect: 0.05,
  contacted: 0.1,
  replied: 0.2,
  call: 0.3,
  proposal: 0.4,
};

// status → [foreground, background] tokens
export const STC: Record<GoalStatus, [string, string]> = {
  "on track": ["var(--ok)", "oklch(0.72 0.15 150 / 0.16)"],
  hit: ["var(--ok)", "oklch(0.72 0.15 150 / 0.16)"],
  "at risk": ["var(--ambink)", "oklch(0.8 0.14 70 / 0.18)"],
  behind: ["var(--bad)", "oklch(0.66 0.18 28 / 0.15)"],
  new: ["var(--soft)", "var(--surf2)"],
};

// how much a mover's impact counts, weighted up for goals that are slipping
export const WEIGHT: Record<GoalStatus, number> = {
  behind: 1.5,
  "at risk": 1.2,
  "on track": 0.6,
  new: 1,
  hit: 0.2,
};

export const STEP_STYLE: Record<StepStatus, [string, string, string]> = {
  todo: ["var(--mute)", "transparent", "to do"],
  doing: ["var(--ok)", "transparent", "doing"],
  waiting: ["var(--ambink)", "transparent", "waiting on you"],
  done: ["var(--ok)", "var(--ok)", "done"],
};
export const NEXT_STEP: Record<StepStatus, StepStatus> = {
  todo: "doing",
  doing: "done",
  waiting: "done",
  done: "todo",
};

// ── pure maths (no DOM, no server) ──────────────────────────────────────────
const ms = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

export function dealP(stage: string, pb = 0): number {
  const base = STAGE_ODDS[stage];
  return base == null ? 0 : Math.min(0.95, base + pb);
}

export function valueAt(hist: [number, number][], day: number): number {
  let v = hist.length ? hist[0][1] : 0;
  for (const [d, x] of hist) {
    if (d <= day) v = x;
    else break;
  }
  return v;
}

export type GoalCtx = {
  nowMs: number;
  open: OSWarDeal[];
  wonCount: number;
  wonValue: number;
};

export function goalStats(g: OSWarGoal, ctx: GoalCtx): OSGoalStats {
  const start = ms(g.start);
  const due = ms(g.due);
  const cur =
    g.src === "won-count"
      ? ctx.wonCount
      : g.src === "won-value"
        ? ctx.wonValue
        : g.cur;
  const T = Math.max(1, (due - start) / DAY);
  const el = Math.min(T, Math.max(0, (ctx.nowMs - start) / DAY));
  const left = Math.max(0, T - el);
  const wl = left / 7;
  const hist: [number, number][] = (g.hist || [])
    .filter((h) => h[0] < el)
    .concat([[el, cur]]);
  const pace =
    el >= 7 ? (cur - valueAt(hist, el - 28)) / Math.min(4, el / 7) : 0;
  const need = wl > 0 ? Math.max(0, (g.target - cur) / wl) : 0;

  let E: number;
  let sd: number;
  if (g.model === "pipeline") {
    const val = (d: OSWarDeal) => (g.src === "won-value" ? d.value : 1);
    E = ctx.open.reduce((s, d) => s + dealP(d.stage) * val(d), 0);
    sd = Math.sqrt(
      ctx.open.reduce((s, d) => {
        const p = dealP(d.stage);
        return s + val(d) * val(d) * p * (1 - p);
      }, 0),
    );
  } else {
    E = Math.max(0, pace) * wl;
    sd = Math.max(E * 0.22, g.target * 0.03);
  }

  const fresh = g.model !== "pipeline" && el < 7;
  const hit = cur >= g.target;
  const proj = cur + E;
  const ratio = proj / g.target;
  const prob = hit
    ? 1
    : fresh
      ? null
      : 1 / (1 + Math.exp((-1.702 * (proj - g.target)) / Math.max(sd, 1e-6)));
  const status: GoalStatus = hit
    ? "hit"
    : fresh
      ? "new"
      : ratio >= 1
        ? "on track"
        : ratio >= 0.8
          ? "at risk"
          : "behind";

  return {
    cur,
    T,
    el,
    left,
    wl,
    hist,
    pace,
    need,
    E,
    sd,
    proj,
    lo: cur + Math.max(0, E - 1.28 * sd),
    hi: cur + E + 1.28 * sd,
    ratio,
    prob,
    status,
    fresh,
    pct: Math.min(1, cur / g.target),
    d7: cur - valueAt(hist, el - 7),
  };
}

const trimN = (s: string) =>
  s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;

export function fmtGoal(
  v: number,
  unit: GoalUnit | null,
  precise = false,
): string {
  const a = Math.abs(v);
  let s: string;
  if (a >= 1e6) s = `${trimN((v / 1e6).toFixed(1))}m`;
  else if (a >= 1000) s = `${trimN((v / 1000).toFixed(a >= 1e5 ? 0 : 1))}k`;
  else if (precise && v % 1) s = trimN(v.toFixed(a < 1 ? 2 : 1));
  else s = String(Math.round(v));
  return (unit === "AED" ? "AED " : "") + s;
}

export function dueLabel(dueISO: string): string {
  const d = new Date(`${dueISO}T00:00:00`);
  return `by ${d.getDate()} ${MONS[d.getMonth()]}`;
}

export const dayMon = (ms0: number) => {
  const d = new Date(ms0);
  return `${d.getDate()} ${MONS[d.getMonth()]}`;
};

// A plausible weekly ramp up to `cur`, used for the chart when there are no
// stored goal_snapshots yet. Deterministic (no Math.random) so SSR is stable.
export function synthHist(
  cur: number,
  startISO: string,
  dueISO: string,
  nowMs: number,
  shape = 1,
): [number, number][] {
  const start = ms(startISO);
  const due = ms(dueISO);
  const T = Math.max(1, (due - start) / DAY);
  const el = Math.min(T, Math.max(0, (nowMs - start) / DAY));
  const out: [number, number][] = [];
  let prev = 0;
  for (let d = 0, i = 0; d < el - 1; d += 7, i++) {
    const noise = (Math.sin(i * 12.9898 + cur * 0.013) * 43758.5453) % 1;
    let v = cur * (el ? (d / el) ** shape : 0) * (1 + (noise - 0.5) * 0.14);
    v = Math.max(
      prev,
      Math.min(cur, cur >= 1000 ? Math.round(v / 100) * 100 : Math.round(v)),
    );
    prev = v;
    out.push([d, v]);
  }
  return out;
}
