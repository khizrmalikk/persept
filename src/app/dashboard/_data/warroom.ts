import { supabaseAdmin } from "@/lib/supabase/server";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import {
  dealP,
  type GoalModel,
  type GoalSrc,
  type GoalUnit,
  type OSGoalPhase,
  type OSGoalStep,
  type OSRawMover,
  type OSTicker,
  type OSWarDeal,
  type OSWarGoal,
  type OSWarRoom,
  STAGE_ODDS,
  synthHist,
} from "./warroom-types";

export type { OSWarRoom } from "./warroom-types";

// War room = the goals overlook. Reads the `goals` table (+ the richer v2
// columns if they exist), plus goal_steps / goal_phases / goal_snapshots for the
// plan / roadmap / chart history. Every read is DEFENSIVE — those four tables may
// not exist yet, so a missing one just yields an empty plan or a synthesized
// chart line and the terminal still renders. The pipeline model + the ticker +
// the needle movers are computed from the live `prospects` / `approvals` /
// `fixes` / `backlog` tables. Client-safe types + maths live in
// ./warroom-types; this file is server-only.

type Row = Record<string, unknown>;

const ROSTER = new Set<AgentKey>([
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
]);
const asAgent = (v: unknown, fallback: AgentKey = "chief"): AgentKey =>
  ROSTER.has(String(v ?? "").toLowerCase() as AgentKey)
    ? (String(v).toLowerCase() as AgentKey)
    : fallback;

const S = (v: unknown) => (v == null ? "" : String(v));
const N = (v: unknown) => (v == null ? 0 : Number(v) || 0);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const kk = (v: number) => {
  const s = (v / 1000).toFixed(1);
  return `${s.endsWith(".0") ? s.slice(0, -2) : s}k`;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// infer who owns a goal from its wording, when the table has no owner column
function inferOwner(name: string, src: GoalSrc): AgentKey {
  const t = name.toLowerCase();
  if (/impression|follower|post|linkedin|instagram|content|reach/.test(t))
    return "muse";
  if (/proposal|copy|retainer|revenue|signed|value/.test(t)) return "scribe";
  if (/prospect|lead|research|list/.test(t)) return "scout";
  if (/fix|bug|uptime|deploy|automation/.test(t)) return "fixer";
  if (/call|deal|pilot|outreach|meeting|demo/.test(t)) return "hunter";
  return src === "won-value" ? "scribe" : "hunter";
}

function inferUnit(name: string, period: string, raw: unknown): GoalUnit {
  if (S(raw).toUpperCase() === "AED") return "AED";
  return /\baed\b|revenue|mrr|retainer|\$/i.test(`${name} ${period}`)
    ? "AED"
    : "";
}

// period text → a deadline, when the table has no date column.
// "q4" → end of the quarter, "nov"/"november" → end of that month, else +60d.
function dueFromPeriod(period: string, now: Date): Date {
  const p = period.toLowerCase();
  const q = p.match(/q([1-4])/);
  if (q) {
    const m = Number(q[1]) * 3; // end month of the quarter (1-indexed)
    return new Date(now.getFullYear(), m, 0);
  }
  const MONS = [
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
  const mi = MONS.findIndex((m) => p.startsWith(m));
  if (mi >= 0) {
    const yr = mi < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    return new Date(yr, mi + 1, 0);
  }
  return new Date(now.getTime() + 60 * 86400000);
}

export async function loadWarRoom(): Promise<OSWarRoom> {
  const db = supabaseAdmin();
  const now = new Date();
  const nowMs = now.getTime();

  const [
    goalRows,
    stepRows,
    phaseRows,
    snapRows,
    moverRows,
    prospectRows,
    apRows,
    fixRows,
    blRows,
  ] = await Promise.all([
    safe(
      async () => (await db.from("goals").select("*")).data as Row[] | null,
      null,
    ),
    safe(
      async () =>
        (await db.from("goal_steps").select("*")).data as Row[] | null,
      null,
    ),
    safe(
      async () =>
        (await db.from("goal_phases").select("*")).data as Row[] | null,
      null,
    ),
    safe(
      async () =>
        (await db.from("goal_snapshots").select("*")).data as Row[] | null,
      null,
    ),
    // Chief's hand-authored movers (merged with the derived ones below)
    safe(
      async () =>
        (await db.from("goal_movers").select("*").eq("status", "open")).data as
          | Row[]
          | null,
      null,
    ),
    safe(
      async () =>
        (
          await db
            .from("prospects")
            .select("key, company, stage, value_aed, last_touch, archived")
        ).data as Row[] | null,
      null,
    ),
    safe(
      async () =>
        (
          await db
            .from("approvals")
            .select("*")
            .in("status", ["pending", "held"])
            .order("ts", { ascending: false })
        ).data as Row[] | null,
      null,
    ),
    safe(
      async () => (await db.from("fixes").select("*")).data as Row[] | null,
      null,
    ),
    safe(
      async () =>
        (
          await db
            .from("backlog")
            .select("*")
            .eq("status", "open")
            .order("due", { ascending: true })
        ).data as Row[] | null,
      null,
    ),
  ]);

  // ── pipeline inputs (open deals + what's already won) ──────────────────────
  const prospects = (prospectRows ?? []).filter((p) => !p.archived);
  const open: OSWarDeal[] = prospects
    .map((p) => ({ stage: S(p.stage).toLowerCase(), value: N(p.value_aed) }))
    .filter((d) => STAGE_ODDS[d.stage] != null);
  const won = prospects.filter((p) => S(p.stage).toLowerCase() === "won");
  const wonCount = won.length;
  const wonValue = won.reduce((s, p) => s + N(p.value_aed), 0);

  // ── steps / phases / snapshots indexed by goal ─────────────────────────────
  const gidOf = (r: Row) => S(r.goal_id ?? r.goal ?? r.gid);
  const stepsByGoal = new Map<string, OSGoalStep[]>();
  for (const r of stepRows ?? []) {
    const g = gidOf(r);
    const st = S(r.status ?? r.st).toLowerCase();
    const step: OSGoalStep = {
      id: S(r.id ?? `${g}-s${stepsByGoal.get(g)?.length ?? 0}`),
      t: S(r.text ?? r.title ?? r.t),
      a: asAgent(r.agent ?? r.a ?? r.owner),
      when: S(r.when_label ?? r.when ?? r.due ?? ""),
      st: (["todo", "doing", "waiting", "done"].includes(st)
        ? st
        : "todo") as OSGoalStep["st"],
      bl: !!(r.backlog_id ?? r.backlog ?? r.bl),
    };
    stepsByGoal.set(g, [...(stepsByGoal.get(g) ?? []), step]);
  }
  const phasesByGoal = new Map<string, OSGoalPhase[]>();
  for (const r of phaseRows ?? []) {
    const g = gidOf(r);
    const phase: OSGoalPhase = {
      id: S(r.id ?? `${g}-p${phasesByGoal.get(g)?.length ?? 0}`),
      n: S(r.name ?? r.n),
      a: asAgent(r.agent ?? r.a ?? r.owner),
      from: N(r.from_wk ?? r.from_week ?? r.from),
      to: N(r.to_wk ?? r.to_week ?? r.to),
      m: S(r.milestone ?? r.m),
    };
    phasesByGoal.set(g, [...(phasesByGoal.get(g) ?? []), phase]);
  }
  // snapshots: [days-since-start, value] relative to each goal's start
  const snapsByGoal = new Map<string, { at: number; v: number }[]>();
  for (const r of snapRows ?? []) {
    const g = gidOf(r);
    const at = Date.parse(S(r.ts ?? r.at ?? r.date ?? r.created_at));
    if (Number.isNaN(at)) continue;
    const list = snapsByGoal.get(g) ?? [];
    list.push({ at, v: N(r.value ?? r.v ?? r.cur) });
    snapsByGoal.set(g, list);
  }

  // ── goals (archived ones are history — the war room hides them) ──────────────
  const SRCS = [
    "manual",
    "won-count",
    "won-value",
    "prospects-count",
    "replied-count",
    "calls-count",
  ];
  const goals: OSWarGoal[] = (goalRows ?? [])
    .filter((r) => !r.archived)
    .map((r, i) => {
      const id = S(r.id ?? r.key ?? `g${i + 1}`);
      const name = S(r.name ?? r.label ?? r.n ?? "goal");
      const period = S(r.period);
      const srcRaw = S(r.src).toLowerCase();
      const src: GoalSrc = SRCS.includes(srcRaw)
        ? (srcRaw as GoalSrc)
        : "manual";
      const modelRaw = S(r.model).toLowerCase();
      // deal-based sources project from the pipeline; everything else paces
      // from its own snapshots (the bridge keeps `cur` current for live sources).
      const model: GoalModel =
        modelRaw === "pipeline" || modelRaw === "pace"
          ? (modelRaw as GoalModel)
          : src === "won-count" || src === "won-value"
            ? "pipeline"
            : "pace";
      const unit = inferUnit(name, period, r.unit);
      const start = r.start
        ? iso(new Date(S(r.start)))
        : iso(new Date(nowMs - 60 * 86400000));
      const due = r.due
        ? iso(new Date(S(r.due)))
        : r.target_date
          ? iso(new Date(S(r.target_date)))
          : iso(dueFromPeriod(period, now));
      const cur = N(r.value ?? r.cur ?? r.current);
      const snaps = (snapsByGoal.get(id) ?? []).sort((a, b) => a.at - b.at);
      const startMs = Date.parse(`${start}T00:00:00`);
      const hist: [number, number][] = snaps.length
        ? snaps.map((s) => [(s.at - startMs) / 86400000, s.v])
        : synthHist(cur, start, due, nowMs);
      return {
        id,
        n: name,
        tag: S(r.tag) || name.split(/\s+/).slice(0, 2).join(" "),
        unit,
        src,
        model,
        target: N(r.target),
        cur,
        start,
        due,
        owner: r.owner ? asAgent(r.owner) : inferOwner(name, src),
        team: Array.isArray(r.team)
          ? (r.team as unknown[]).map((t) => asAgent(t)).filter(Boolean)
          : [],
        plan: stepsByGoal.get(id) ?? [],
        road: phasesByGoal.get(id) ?? [],
        hist,
        summary: S(r.summary),
        planAt: S(r.plan_at ?? r.planAt),
        planning: !!r.planning,
        stale: !!(r.plan_stale ?? r.stale),
        madeBy: S(r.made_by ?? r.madeBy) || (S(r.summary) ? "chief" : ""),
      };
    });

  const goalIds = new Set(goals.map((g) => g.id));
  const ownerGoals = (a: AgentKey) =>
    goals.filter((g) => g.owner === a || g.team.includes(a)).map((g) => g.id);
  // a rough per-goal impact for a mover owned by `a`
  const fxFor = (a: AgentKey, dealValue = 0) =>
    ownerGoals(a)
      .slice(0, 2)
      .map((gid) => {
        const g = goals.find((x) => x.id === gid);
        const delta =
          g?.unit === "AED"
            ? dealValue || Math.max(1000, Math.round(g.target * 0.05))
            : 1;
        return { gid, delta };
      });

  // ── needle movers from live work ────────────────────────────────────────────
  const movers: OSRawMover[] = [];
  for (const ap of apRows ?? []) {
    const agent = asAgent(ap.agent_id);
    const held = S(ap.status) === "held";
    const kindRaw = S(ap.kind).toLowerCase();
    const cta = /linkedin-post|^linkedin$|instagram/.test(kindRaw)
      ? "publish"
      : /email|whatsapp|message|proposal/.test(kindRaw)
        ? "send"
        : "approve";
    const title = S(ap.action) || "approval request";
    const age = ago(S(ap.ts) || null).replace(/\s*ago$/, "");
    movers.push({
      id: `ap${ap.id}`,
      a: agent,
      title,
      why: held
        ? `held ${age}. release it when you're ready.`
        : `waiting ${age}. agents draft, you press the button.`,
      cta: held ? "open" : cta,
      kind: held ? "openap" : "approve",
      apId: N(ap.id),
      apAgent: agent,
      fx: fxFor(agent),
    });
  }
  for (const f of fixRows ?? []) {
    const st = S(f.status ?? f.pill).toLowerCase();
    if (!/fail/.test(st)) continue;
    const fixId = S(f.short_id ?? f.id);
    const tags = ownerGoals("fixer")
      .map((gid) => goals.find((g) => g.id === gid)?.tag)
      .filter(Boolean)
      .join(", ");
    movers.push({
      id: `fix${fixId}`,
      a: "fixer",
      title: S(f.title) || "a fix is failing",
      why: tags
        ? `it's failing${tags ? `. ${tags} wait on it` : ""}.`
        : "it's failing. nothing ships until it's fixed.",
      cta: "open fix",
      kind: "fix",
      fixId,
      fx: fxFor("fixer"),
    });
  }
  for (const b of (blRows ?? []).slice(0, 6)) {
    const due = S(b.due);
    const dueSoon = due && Date.parse(`${due}T00:00:00`) - nowMs < 7 * 86400000;
    if (!dueSoon) continue;
    const owner = asAgent(b.owner, "chief");
    movers.push({
      id: `bl${S(b.id)}`,
      a: owner,
      title: S(b.title) || "a backlog item",
      why: `${dueLabelLite(due)}. ${S(b.detail).slice(0, 80) || "due soon"}`,
      cta: "open",
      kind: "bl",
      blTab: "backlog",
      fx: fxFor(owner),
    });
  }
  // Chief's hand-authored movers (goal_movers). `impacts` is [{goal, delta}]
  // where goal is a tag or a name; resolve each to a live goal id.
  const byTag = (key: string) =>
    goals.find(
      (g) =>
        g.id === key ||
        g.tag.toLowerCase() === key.toLowerCase() ||
        g.n.toLowerCase() === key.toLowerCase(),
    );
  for (const mv of moverRows ?? []) {
    const agent = asAgent(mv.agent);
    const impacts = Array.isArray(mv.impacts) ? (mv.impacts as Row[]) : [];
    const fx = impacts
      .map((x) => {
        const g = byTag(S(x.goal));
        return g ? { gid: g.id, delta: N(x.delta) } : null;
      })
      .filter((x): x is { gid: string; delta: number } => x != null);
    const ask = S(mv.ask);
    movers.push({
      id: `mv${S(mv.id)}`,
      a: agent,
      title: S(mv.text) || "a way to move a goal",
      why: S(mv.why),
      cta: ask ? "do it" : "open",
      kind: "mover",
      moverId: S(mv.id),
      ask,
      apAgent: agent,
      fx,
    });
  }

  // keep only movers that touch a live goal
  const liveMovers = movers
    .map((m) => ({ ...m, fx: m.fx.filter((x) => goalIds.has(x.gid)) }))
    .filter((m) => m.fx.length);

  // ── ticker (computed from live pipeline + approvals + goals) ────────────────
  const pipe = open.reduce((s, d) => s + d.value, 0);
  const wpipe = open.reduce((s, d) => s + dealP(d.stage) * d.value, 0);
  const liveAp = (apRows ?? []).filter((a) => S(a.status) !== "held").length;
  const apDeals = new Set(
    (apRows ?? []).map((a) => S(a.company)).filter(Boolean),
  );
  const atStake = prospects
    .filter((p) => apDeals.has(S(p.company)))
    .reduce((s, p) => s + N(p.value_aed), 0);
  const onTrack = goals.filter((g) => {
    // cheap server-side status for the ticker only
    const r = (g.cur + 0) / Math.max(1, g.target);
    return g.cur >= g.target || r >= 0.8;
  }).length;
  const ramp = (end: number, n = 8) =>
    Array.from({ length: n }, (_, i) =>
      Math.round(end * (0.55 + (0.45 * i) / (n - 1))),
    );
  const ticker: OSTicker[] = [
    {
      key: "pipe",
      label: "open pipeline",
      value: `AED ${kk(pipe)}`,
      delta: `${open.length} open deals`,
      tone: "neutral",
      spark: ramp(pipe / 1000),
      win: "frontdesk",
    },
    {
      key: "likely",
      label: "likely to close",
      value: `AED ${kk(wpipe)}`,
      delta: `${Math.round((wpipe / Math.max(1, pipe)) * 100)}% by odds`,
      tone: "neutral",
      spark: ramp(wpipe / 1000),
      win: "frontdesk",
    },
    {
      key: "wait",
      label: "waiting on your tap",
      value: atStake > 0 ? `AED ${kk(atStake)}` : String(liveAp),
      delta: `${liveAp} approval${liveAp === 1 ? "" : "s"}`,
      tone: "amber",
      spark: ramp(Math.max(1, liveAp)),
      win: "approvals",
    },
    {
      key: "won",
      label: "won so far",
      value: wonValue > 0 ? `AED ${kk(wonValue)}` : String(wonCount),
      delta: `${wonCount} signed`,
      tone: "up",
      spark: ramp(Math.max(1, wonValue / 1000 || wonCount)),
      win: "frontdesk",
    },
    {
      key: "ontrack",
      label: "goals on track",
      value: `${onTrack}/${goals.length}`,
      delta: "by projection",
      tone: onTrack >= goals.length - onTrack ? "up" : "down",
      spark: ramp(Math.max(1, onTrack)),
      win: null,
    },
    {
      key: "movers",
      label: "needle movers",
      value: String(liveMovers.length),
      delta: "ranked by impact",
      tone: "neutral",
      spark: ramp(Math.max(1, liveMovers.length)),
      win: null,
    },
    {
      key: "deals",
      label: "open deals",
      value: String(open.length),
      delta: `AED ${kk(pipe)} in play`,
      tone: "neutral",
      spark: ramp(Math.max(1, open.length)),
      win: "frontdesk",
    },
  ];

  return { goals, open, wonCount, wonValue, movers: liveMovers, ticker };
}

function dueLabelLite(due: string): string {
  if (!due) return "no deadline";
  const d = new Date(`${due}T00:00:00`);
  const MONS = [
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
  return `by ${d.getDate()} ${MONS[d.getMonth()]}`;
}
