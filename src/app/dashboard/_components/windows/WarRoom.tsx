"use client";

import {
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  approveFromForm,
  archiveGoal,
  createGoal,
  createManualInvoice,
  dismissMover,
  goalStepToBacklog,
  markManualInvoicePaid,
  replanGoal,
  sendAgentCommand,
  setGoalSource,
  setGoalStepStatus,
  setGoalValue,
  tapMover,
  updateGoal,
  voidManualInvoice,
} from "@/lib/workforce/actions";
import type { OSMoney } from "@/lib/workforce/stripe-types";
import type { OSApproval } from "../../_data/approvals";
import {
  AED_SRCS,
  dayMon,
  dueLabel,
  fmtGoal,
  type GoalCtx,
  type GoalProduct,
  type GoalSrc,
  goalSourceLine,
  goalStats,
  MONEY_SRCS,
  MONS,
  NEXT_STEP,
  type OSGoalStats,
  type OSWarGoal,
  type OSWarRoom,
  PRODUCT_LABEL,
  STC,
  STEP_STYLE,
  type StepStatus,
  WEIGHT,
} from "../../_data/warroom-types";
import { AGENT_HUE_VAR, AGENT_TINT_VAR } from "../../_data/windows";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { Money } from "./Money";

// The war room — a trading-terminal overlook of every goal: a live ticker, a
// goals watchlist, the selected goal's projection chart + roadmap + Percy-written
// plan, and the ranked "needle movers" that move the numbers most. All the
// projection maths lives in ../../_data/warroom-types (shared, pure); this file
// is the UI. New tables (goals / goal_steps / goal_phases / goal_snapshots) feed
// it; until the goal-mutation actions exist, create / edit / re-plan send a
// `plan goal:` command to Percy and step edits stay local.

const ORDER: AgentKey[] = [
  "percy",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];
const AG_NAME: Record<AgentKey, string> = {
  percy: "Percy",
  scout: "Scout",
  hunter: "Hunter",
  scribe: "Scribe",
  muse: "Muse",
  fixer: "Fixer",
  you: "you",
};

// chart geometry (matches the handoff prototype's viewBox 0 0 680 228)
const ML = 44;
const PR = 600;
const MT = 18;
const PB = 206;
const DAY = 86400000;
const f1 = (n: number) => n.toFixed(1);
const msOf = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const nice = (mx: number) => {
  const raw = mx / 4 || 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
const spk = (arr: number[], w: number, h: number) => {
  const mx = Math.max(...arr);
  const mn = Math.min(...arr);
  const r = mx - mn || 1;
  return arr
    .map(
      (v, i) =>
        `${f1((i / (arr.length - 1)) * w)},${f1(h - 2 - ((v - mn) / r) * (h - 4))}`,
    )
    .join(" ");
};
const TONE: Record<string, string> = {
  up: "var(--ok)",
  down: "var(--bad)",
  amber: "var(--ambink)",
  neutral: "var(--soft)",
};
const mono: CSSProperties = { fontFamily: "var(--font-mono)" };

// date helpers for the suggestion chips (client, deterministic from `now`)
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const nextJan1 = (now: number) =>
  isoDay(new Date(new Date(now).getFullYear() + 1, 0, 1));
const monthsOut = (now: number, m: number) => {
  const d = new Date(now);
  return isoDay(new Date(d.getFullYear(), d.getMonth() + m + 1, 0));
};
const quarterStart = (now: number) => {
  const d = new Date(now);
  return isoDay(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1));
};
const quarterEnd = (now: number) => {
  const d = new Date(now);
  return isoDay(
    new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0),
  );
};

// day-47 one-tap suggestions: each seeds a complete live goal (source + product).
type Sugg = {
  label: string;
  n: string;
  target: number;
  unit: "count" | "AED";
  src: GoalSrc;
  product: GoalProduct;
  dates: (now: number) => { start?: string; due: string };
};
const SUGG: Sugg[] = [
  {
    label: "AED 20k MRR by 1 Jan",
    n: "monthly recurring revenue",
    target: 20000,
    unit: "AED",
    src: "stripe-mrr",
    product: "all",
    dates: (now) => ({ due: nextJan1(now) }),
  },
  {
    label: "First AED 6,000 pilot",
    n: "first pilot revenue",
    target: 6000,
    unit: "AED",
    src: "revenue-since",
    product: "persept",
    dates: (now) => ({ start: isoDay(new Date(now)), due: monthsOut(now, 3) }),
  },
  {
    label: "10 paying GYST users",
    n: "paying GYST users",
    target: 10,
    unit: "count",
    src: "stripe-customers",
    product: "gyst",
    dates: (now) => ({ due: monthsOut(now, 6) }),
  },
  {
    label: "AED 50k revenue this quarter",
    n: "revenue this quarter",
    target: 50000,
    unit: "AED",
    src: "revenue-since",
    product: "all",
    dates: (now) => ({ start: quarterStart(now), due: quarterEnd(now) }),
  },
];

// day-47: preview a money source's live value from the Stripe mirror, so the
// read-only "now" field has a number before the bridge fills `goals.cur`.
function liveGoalValue(
  src: GoalSrc,
  product: GoalProduct,
  money: OSMoney,
  startISO?: string,
): number {
  const accts = money.accounts.filter(
    (a) => product === "all" || a.id === product,
  );
  const toAed = (rec: Record<string, number>) =>
    Object.entries(rec).reduce(
      (s, [c, v]) => s + (c.toLowerCase() === "aed" ? v : v * money.fx),
      0,
    );
  switch (src) {
    case "stripe-mrr":
      return Math.round(accts.reduce((s, a) => s + toAed(a.mrr), 0));
    case "stripe-month":
      return Math.round(accts.reduce((s, a) => s + toAed(a.mtdNet), 0));
    case "stripe-customers":
      return accts.reduce((s, a) => s + a.activeSubs, 0);
    case "revenue-since": {
      const start = startISO ? Date.parse(`${startISO}T00:00:00`) : 0;
      return Math.round(
        money.payments
          .filter(
            (p) =>
              (product === "all" || p.product === product) &&
              p.paidAt &&
              Date.parse(p.paidAt) >= start,
          )
          .reduce((s, p) => s + p.amountAed, 0),
      );
    }
    default:
      return 0;
  }
}

type FormState = {
  n: string;
  target: string;
  cur: string;
  unit: "count" | "AED";
  due: string;
  owner: AgentKey;
  src: GoalSrc; // day-47: "manual" unless counted from pipeline/money
  product: GoalProduct; // day-47: narrows a money source to one product
  start?: string; // ISO; set for revenue-since
  tried?: boolean;
};

export function WarRoom({
  data,
  approvals: _approvals,
}: {
  data: OSWarRoom;
  approvals: OSApproval[];
}) {
  const os = useOS();
  const subGoal = (os.sub as { goal?: string }).goal ?? null;

  // day-42: goals | money tabs (money moved here from the front desk).
  const [tab, setTab] = useState<"goals" | "money">(
    os.sub.tab === "money" ? "money" : "goals",
  );
  useEffect(() => {
    if (os.sub.tab) setTab(os.sub.tab === "money" ? "money" : "goals");
  }, [os.sub.tab]);

  const [now, setNow] = useState(() => Date.now());
  const [sel, setSel] = useState<string | null>(subGoal);
  const [mode, setMode] = useState<"view" | "new" | "edit">("view");
  const [form, setForm] = useState<FormState | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [hov, setHov] = useState<number | null>(null);
  const [scope, setScope] = useState<"all" | "goal">("all");
  const chartRef = useRef<SVGSVGElement>(null);

  // local overlays — the goal-mutation server actions don't exist yet, so edits
  // live on the client and a command is sent to Percy in parallel.
  const [added, setAdded] = useState<OSWarGoal[]>([]);
  const [patches, setPatches] = useState<Record<string, Partial<OSWarGoal>>>(
    {},
  );
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [stepOver, setStepOver] = useState<Record<string, StepStatus>>({});
  const [blSteps, setBlSteps] = useState<Set<string>>(new Set());
  const [moverDone, setMoverDone] = useState<Set<string>>(new Set());

  // keep "today" honest without a per-second re-render
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  // a deep link (?goal=…) preselects a goal
  useEffect(() => {
    if (subGoal) {
      setSel(subGoal);
      setMode("view");
      setForm(null);
    }
  }, [subGoal]);

  const goals: OSWarGoal[] = useMemo(() => {
    const base = [...data.goals, ...added].filter((g) => !removed.has(g.id));
    return base.map((g) => {
      const patched = { ...g, ...patches[g.id] };
      const plan = patched.plan.map((p) => ({
        ...p,
        st: stepOver[p.id] ?? p.st,
        bl: p.bl || blSteps.has(p.id),
      }));
      return { ...patched, plan };
    });
  }, [data.goals, added, removed, patches, stepOver, blSteps]);

  const ctx: GoalCtx = useMemo(
    () => ({
      nowMs: now,
      open: data.open,
      wonCount: data.wonCount,
      wonValue: data.wonValue,
    }),
    [now, data.open, data.wonCount, data.wonValue],
  );
  const stats = useMemo(() => {
    const m: Record<string, OSGoalStats> = {};
    for (const g of goals) m[g.id] = goalStats(g, ctx);
    return m;
  }, [goals, ctx]);

  const gmap = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g])),
    [goals],
  );
  const selected =
    (sel && gmap[sel]) || (mode === "view" ? goals[0] : null) || null;

  const onTrack = goals.filter((g) =>
    ["on track", "hit"].includes(stats[g.id]?.status),
  ).length;

  // ── movers: score with live stats, filter, sort ────────────────────────────
  const movers = useMemo(() => {
    const scoped = scope === "goal" && selected;
    return data.movers
      .filter((m) => !moverDone.has(m.id))
      .map((m) => {
        const fx = m.fx.filter((x) => gmap[x.gid]);
        const score = fx.reduce((s, x) => {
          const g = gmap[x.gid];
          const st = stats[x.gid];
          return (
            s + (Math.abs(x.delta) / Math.max(1, g.target)) * WEIGHT[st.status]
          );
        }, 0);
        return { ...m, fx, score };
      })
      .filter(
        (m) =>
          m.fx.length && (!scoped || m.fx.some((x) => x.gid === selected.id)),
      )
      .sort((a, b) => b.score - a.score);
  }, [data.movers, moverDone, gmap, stats, scope, selected]);
  const maxScore = Math.max(0.0001, ...movers.map((m) => m.score));

  // ── mutations ───────────────────────────────────────────────────────────────
  // local goals (optimistic, not yet in the DB) carry a `local-` id — skip the
  // server write for those; the real row arrives on the next tick refresh.
  const isLocal = (id: string) => id.startsWith("local-");
  const cycleStep = (id: string, cur: StepStatus) => {
    const next = NEXT_STEP[cur];
    setStepOver((o) => ({ ...o, [id]: next }));
    // `waiting` is bridge-set; NEXT_STEP only cycles todo/doing/done, which the
    // action accepts. A synthesized step id simply matches no row (no-op).
    if (!isLocal(id) && next !== "waiting") void setGoalStepStatus(id, next);
  };
  const stepToBacklog = (g: OSWarGoal, step: OSWarGoal["plan"][number]) => {
    const fd = new FormData();
    fd.append("stepId", step.id);
    fd.append("text", step.t);
    fd.append("agent", step.a);
    fd.append("when_label", step.when);
    if (!isLocal(g.id)) void goalStepToBacklog(fd);
    setBlSteps((s) => new Set(s).add(step.id));
    os.showToast("added to the backlog");
  };
  const allToBacklog = (g: OSWarGoal) => {
    const openSteps = g.plan.filter((p) => !p.bl && p.st !== "done");
    if (!isLocal(g.id))
      for (const step of openSteps) {
        const fd = new FormData();
        fd.append("stepId", step.id);
        fd.append("text", step.t);
        fd.append("agent", step.a);
        fd.append("when_label", step.when);
        void goalStepToBacklog(fd);
      }
    setBlSteps((s) => {
      const next = new Set(s);
      for (const step of openSteps) next.add(step.id);
      return next;
    });
    os.showToast(`${openSteps.length} steps added to the backlog`);
  };
  const replan = (g: OSWarGoal) => {
    if (!isLocal(g.id)) void replanGoal(g.id);
    os.showToast("asked percy to re-plan");
  };
  // day-47: switch a manual MRR/revenue/customers goal onto live Stripe MRR.
  const switchToLive = (g: OSWarGoal) => {
    setPatches((p) => ({
      ...p,
      [g.id]: {
        ...p[g.id],
        src: "stripe-mrr",
        product: "all",
        unit: "AED",
        planning: true,
        stale: false,
      },
    }));
    if (!isLocal(g.id)) void setGoalSource(g.id, "stripe-mrr", "all");
    os.showToast("counting from live Stripe MRR — percy is re-planning");
  };
  const removeGoal = (g: OSWarGoal) => {
    if (!isLocal(g.id)) void archiveGoal(g.id);
    setRemoved((r) => new Set(r).add(g.id));
    setSel(null);
    setConfirm(false);
    setHov(null);
    os.showToast("goal removed, with its plan and roadmap");
  };
  const dismissMoverGo = (m: (typeof movers)[number]) => {
    if (m.moverId) void dismissMover(m.moverId);
    setMoverDone((s) => new Set(s).add(m.id));
  };
  const submitForm = () => {
    if (!form) return;
    const tgt = Number.parseFloat(form.target);
    const cur = Number.parseFloat(form.cur || "0");
    const dueOk = form.due && msOf(form.due) > now;
    const err = !form.n.trim()
      ? "give the goal a name"
      : !(tgt > 0)
        ? "set a target above zero"
        : !dueOk
          ? "pick a deadline in the future"
          : "";
    if (err) {
      setForm({ ...form, tried: true });
      return;
    }
    const unit = form.unit === "AED" ? "AED" : "";
    const goalSrc = form.src;
    const goalProduct = form.product;
    const isManual = goalSrc === "manual";
    // revenue-since needs a start; default to today
    const start =
      form.start?.trim() || new Date(now).toISOString().slice(0, 10);
    if (mode === "new") {
      const id = `local-${now}`;
      const g: OSWarGoal = {
        id,
        n: form.n.trim(),
        tag: form.n.trim().split(/\s+/).slice(0, 2).join(" "),
        unit,
        src: goalSrc,
        product: goalProduct,
        model: "pace",
        target: tgt,
        cur: cur || 0,
        start,
        due: form.due,
        owner: form.owner,
        team: [],
        plan: [],
        road: [],
        hist: [],
        summary: "",
        planAt: "",
        planning: true,
        stale: false,
        madeBy: "you",
      };
      // optimistic local goal; the real row (with Percy's plan) arrives on the
      // next tick. createGoal also sends Percy the `plan goal <id>` command.
      setAdded((a) => [...a, g]);
      const fd = new FormData();
      fd.append("name", form.n.trim());
      fd.append("unit", form.unit === "AED" ? "AED" : "count");
      fd.append("target", String(tgt));
      fd.append("cur", String(cur || 0));
      fd.append("due", form.due);
      fd.append("start", start);
      fd.append("owner", form.owner);
      fd.append("src", goalSrc);
      fd.append("product", goalProduct);
      void createGoal(fd);
      os.showToast("percy is writing the plan");
      setSel(id);
    } else if (selected) {
      const srcChanged =
        goalSrc !== selected.src || goalProduct !== selected.product;
      setPatches((p) => ({
        ...p,
        [selected.id]: {
          ...p[selected.id],
          n: form.n.trim(),
          target: tgt,
          due: form.due,
          owner: form.owner,
          unit,
          src: goalSrc,
          product: goalProduct,
          start,
          ...(isManual ? { cur: cur || 0 } : {}),
          ...(srcChanged ? { planning: true } : {}),
          stale: true,
        },
      }));
      if (!isLocal(selected.id)) {
        const fd = new FormData();
        fd.append("id", selected.id);
        fd.append("name", form.n.trim());
        fd.append("tag", selected.tag);
        fd.append("owner", form.owner);
        fd.append("target", String(tgt));
        fd.append("due", form.due);
        fd.append("start", start);
        fd.append("src", goalSrc);
        fd.append("product", goalProduct);
        void updateGoal(fd);
        // manual goal's "now at" is a separate patch (cur + the old value col)
        if (isManual) void setGoalValue(selected.id, cur || 0);
      }
      os.showToast(
        srcChanged
          ? "saved — percy is re-planning for the new source"
          : "saved — asked percy to re-check the plan",
      );
    }
    setMode("view");
    setForm(null);
  };
  const moverGo = (m: (typeof movers)[number]) => {
    if (m.kind === "approve" && m.apId != null) {
      const fd = new FormData();
      fd.append("id", String(m.apId));
      fd.append("agent", m.apAgent ?? "percy");
      void approveFromForm(fd);
      setMoverDone((s) => new Set(s).add(m.id));
      os.showToast("approved");
    } else if (m.kind === "openap" && m.apId != null) {
      os.open("approvals", { id: String(m.apId) });
    } else if (m.kind === "fix") {
      os.open("dev", { tab: "changes" });
    } else if (m.kind === "bl") {
      os.open("command", { tab: m.blTab ?? "backlog" });
    } else if (m.kind === "mover") {
      // Percy's mover: send the agent its `ask`, mark the mover done
      if (m.moverId) void tapMover(m.moverId, m.apAgent ?? m.a, m.ask ?? "");
      setMoverDone((s) => new Set(s).add(m.id));
      os.showToast(m.ask ? `sent to ${AG_NAME[m.a]}` : "done");
    }
  };

  const card: CSSProperties = {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--surf)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    overflow: "hidden",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 12,
        background: "var(--bg)",
        color: "var(--ink)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* day-42: goals | money tabs */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
          position: "relative",
          zIndex: 6,
        }}
      >
        {(["goals", "money"] as const).map((t) => {
          const on = tab === t;
          const bad = t === "money" && data.money.overdueCount > 0;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 13px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: on ? "var(--surf2)" : "transparent",
                color: on ? "var(--ink)" : "var(--soft)",
              }}
            >
              {t}
              {bad && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: "var(--bad)",
                    color: "var(--bg)",
                  }}
                >
                  {data.money.overdueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ticker */}
      <div
        style={{
          flex: "none",
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0,1fr))",
          gap: 1,
          background: "var(--line)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {data.ticker.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => k.win && os.open(k.win as never)}
            className="os-dock-tile"
            style={{
              minWidth: 0,
              padding: "10px 14px",
              background: "var(--surf)",
              display: "flex",
              flexDirection: "column",
              gap: 3,
              cursor: k.win ? "pointer" : "default",
              border: "none",
              textAlign: "left",
            }}
          >
            <span
              className="os-kicker"
              style={{
                fontSize: 9.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {k.label}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  ...mono,
                  fontSize: 17,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                {k.value}
              </span>
              <svg
                width="48"
                height="20"
                viewBox="0 0 48 20"
                style={{ flex: "none", overflow: "visible" }}
                aria-hidden="true"
              >
                <polyline
                  points={spk(k.spark, 48, 20)}
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ stroke: TONE[k.tone] }}
                />
              </svg>
            </div>
            <span
              style={{
                ...mono,
                fontSize: 10.5,
                color: TONE[k.tone],
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {k.delta}
            </span>
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "320px minmax(0,1fr) 316px",
          gap: 10,
        }}
      >
        {/* watchlist */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 12px 11px 14px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>goals</span>
            <span style={{ ...mono, fontSize: 11, color: "var(--mute)" }}>
              {onTrack} of {goals.length} on track
            </span>
            <button
              type="button"
              onClick={() => {
                const d = new Date(now);
                setMode("new");
                setConfirm(false);
                setHov(null);
                setForm({
                  n: "",
                  target: "",
                  cur: "0",
                  unit: "count",
                  due: new Date(d.getFullYear(), d.getMonth() + 2, 0)
                    .toISOString()
                    .slice(0, 10),
                  owner: "hunter",
                  src: "manual",
                  product: "all",
                });
              }}
              className="os-lift"
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 11px",
                borderRadius: 9,
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                whiteSpace: "nowrap",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              new goal
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {goals.map((g) => {
              const t = stats[g.id];
              const c = STC[t.status];
              const picked = selected?.id === g.id && mode !== "new";
              return (
                <button
                  key={g.id}
                  data-pc={`goal-${g.id}`}
                  type="button"
                  onClick={() => {
                    setSel(g.id);
                    setMode("view");
                    setForm(null);
                    setConfirm(false);
                    setHov(null);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--line)",
                    borderLeft: "none",
                    borderRight: "none",
                    borderTop: "none",
                    background: picked ? "var(--surf2)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <Persona
                      agent={g.owner}
                      size={20}
                      status={g.planning ? "working" : ""}
                    />
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {g.n}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: c[1],
                        color: c[0],
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) 68px 52px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 6,
                          ...mono,
                          fontSize: 11.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>
                          <span style={{ fontWeight: 600 }}>
                            {fmtGoal(t.cur, g.unit)}
                          </span>
                          <span style={{ color: "var(--mute)" }}>
                            {" "}
                            / {fmtGoal(g.target, g.unit)}
                          </span>
                        </span>
                        <span style={{ color: "var(--soft)" }}>
                          {Math.round(t.pct * 100)}%
                        </span>
                      </div>
                      <div
                        style={{
                          position: "relative",
                          height: 5,
                          borderRadius: 3,
                          background: "var(--track)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(t.pct * 100).toFixed(1)}%`,
                            borderRadius: 3,
                            background: c[0],
                          }}
                        />
                        <div
                          title="projected"
                          style={{
                            position: "absolute",
                            top: -3,
                            left: `${Math.min(100, t.ratio * 100).toFixed(1)}%`,
                            width: 2,
                            height: 11,
                            marginLeft: -1,
                            borderRadius: 1,
                            background: c[0],
                          }}
                        />
                      </div>
                      <span
                        style={{
                          ...mono,
                          fontSize: 10.5,
                          color: "var(--mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dueLabel(g.due)} ·{" "}
                        <span
                          style={{
                            color:
                              t.d7 > 0
                                ? "var(--ok)"
                                : t.d7 < 0
                                  ? "var(--bad)"
                                  : "var(--mute)",
                          }}
                        >
                          {t.d7
                            ? `${t.d7 > 0 ? "▲" : "▼"} ${fmtGoal(Math.abs(t.d7), g.unit, true)} wk`
                            : "flat wk"}
                        </span>
                      </span>
                      {goalSourceLine(g) && (
                        <span
                          style={{
                            ...mono,
                            fontSize: 10,
                            color: "var(--mute)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {goalSourceLine(g)}
                        </span>
                      )}
                    </div>
                    <Mini g={g} t={t} />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          ...mono,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: c[0],
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.fresh ? "—" : fmtGoal(t.proj, null, true)}
                      </span>
                      <span
                        style={{ ...mono, fontSize: 10, color: "var(--mute)" }}
                      >
                        {t.fresh ? "new" : `${Math.round(t.ratio * 100)}%`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!goals.length && (
              <div
                style={{
                  padding: "18px 14px",
                  fontSize: 13,
                  color: "var(--soft)",
                  lineHeight: 1.45,
                }}
              >
                no goals yet. add one and Percy writes the plan.
              </div>
            )}
          </div>
        </div>

        {/* detail */}
        <div
          style={{
            minHeight: 0,
            overflow: "auto",
            background: "var(--surf)",
            border: "1px solid var(--line)",
            borderRadius: 14,
          }}
        >
          {mode !== "view" && form ? (
            <GoalForm
              form={form}
              setForm={setForm}
              isNew={mode === "new"}
              selected={selected}
              now={now}
              money={data.money}
              onSubmit={submitForm}
              onCancel={() => {
                setMode("view");
                setForm(null);
              }}
            />
          ) : !selected ? (
            <EmptyState
              onNew={() => {
                const d = new Date(now);
                setMode("new");
                setForm({
                  n: "",
                  target: "",
                  cur: "0",
                  unit: "count",
                  due: new Date(d.getFullYear(), d.getMonth() + 2, 0)
                    .toISOString()
                    .slice(0, 10),
                  owner: "hunter",
                  src: "manual",
                  product: "all",
                });
              }}
            />
          ) : (
            <GoalDetail
              g={selected}
              t={stats[selected.id]}
              hov={hov}
              setHov={setHov}
              chartRef={chartRef}
              confirm={confirm}
              onEdit={() => {
                setMode("edit");
                setConfirm(false);
                setHov(null);
                setForm({
                  n: selected.n,
                  target: String(selected.target),
                  cur: String(stats[selected.id].cur),
                  unit: selected.unit === "AED" ? "AED" : "count",
                  due: selected.due,
                  owner: selected.owner,
                  src: selected.src,
                  product: selected.product,
                  start: selected.start,
                });
              }}
              onAskRemove={() => setConfirm(true)}
              onKeep={() => setConfirm(false)}
              onRemove={() => removeGoal(selected)}
              onReplan={() => replan(selected)}
              onSwitchSource={() => switchToLive(selected)}
              onCycle={cycleStep}
              onStepBl={(step) => stepToBacklog(selected, step)}
              onAllBl={() => allToBacklog(selected)}
            />
          )}
        </div>

        {/* needle movers */}
        <div style={card}>
          <div
            style={{
              padding: "11px 14px 10px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                needle movers
              </span>
              <span style={{ ...mono, fontSize: 11, color: "var(--mute)" }}>
                {movers.length}
              </span>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  padding: 2,
                  borderRadius: 8,
                  background: "var(--surf2)",
                }}
              >
                {(["all", "goal"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setScope(k)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      background: scope === k ? "var(--surf)" : "transparent",
                      color: scope === k ? "var(--ink)" : "var(--soft)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {k === "all" ? "all goals" : "this goal"}
                  </button>
                ))}
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                color: "var(--soft)",
                lineHeight: 1.35,
              }}
            >
              {scope === "goal" && selected
                ? `what moves ${selected.n}, biggest first`
                : "ranked by how far each moves your goals, weighted to the ones at risk"}
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {movers.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      ...mono,
                      fontSize: 11,
                      color: "var(--mute)",
                      width: 16,
                      flex: "none",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Persona agent={m.a} size={24} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {m.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => moverGo(m)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background:
                        m.kind === "approve"
                          ? "oklch(0.68 0.21 38)"
                          : "var(--surf2)",
                      color: m.kind === "approve" ? "#0e0d0c" : "var(--ink)",
                      border:
                        m.kind === "approve"
                          ? "1px solid transparent"
                          : "1px solid var(--line)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flex: "none",
                    }}
                  >
                    {m.cta}
                  </button>
                  {m.kind === "mover" && (
                    <button
                      type="button"
                      onClick={() => dismissMoverGo(m)}
                      aria-label="dismiss"
                      title="dismiss"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        border: "1px solid var(--line)",
                        background: "transparent",
                        color: "var(--mute)",
                        fontSize: 13,
                        cursor: "pointer",
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--soft)",
                    lineHeight: 1.4,
                    paddingLeft: 25,
                  }}
                >
                  {m.why}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexWrap: "wrap",
                    paddingLeft: 25,
                  }}
                >
                  {m.fx.map((x) => {
                    const g = gmap[x.gid];
                    const c = STC[stats[x.gid].status];
                    return (
                      <span
                        key={x.gid}
                        style={{
                          ...mono,
                          fontSize: 10.5,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: c[1],
                          color: c[0],
                          boxShadow:
                            selected?.id === x.gid
                              ? `inset 0 0 0 1px ${c[0]}`
                              : "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {g.tag} +{fmtGoal(x.delta, g.unit, true)}
                      </span>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 25,
                  }}
                >
                  <span className="os-kicker" style={{ fontSize: 9.5 }}>
                    impact
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--track)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(6, (m.score / maxScore) * 100).toFixed(0)}%`,
                        borderRadius: 2,
                        background: "var(--ink)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!movers.length && (
              <div
                style={{
                  padding: "18px 14px",
                  fontSize: 13,
                  color: "var(--soft)",
                  lineHeight: 1.45,
                }}
              >
                nothing to move right now. new movers show up here when an agent
                finds one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* money tab — an overlay over the goals content (below the tab bar) */}
      {tab === "money" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            paddingTop: 44,
            zIndex: 5,
            background: "var(--bg)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 14,
              border: "1px solid var(--line)",
              overflow: "hidden",
            }}
          >
            <Money
              money={data.money}
              deals={data.deals}
              onRemind={(ref) => {
                void sendAgentCommand("hunter", `remind invoice ${ref}`);
                os.showToast("asked Hunter to remind");
              }}
              onOpenDeal={(key) => os.open("frontdesk", { deal: key })}
              onLink={(paymentId, key) => {
                void sendAgentCommand(
                  "percy",
                  `link payment ${paymentId} to ${key}`,
                );
                os.showToast("asked Percy to link the payment");
              }}
              onAddInvoice={(fd) => {
                void createManualInvoice(fd).then((r) =>
                  os.showToast(
                    "error" in r
                      ? r.error
                      : "invoice saved — it appears once the bridge syncs",
                  ),
                );
              }}
              onMarkPaid={(id, date, method) => {
                void markManualInvoicePaid(id, date, method);
                os.showToast("marked paid");
              }}
              onVoid={(id) => {
                void voidManualInvoice(id);
                os.showToast("invoice voided");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── watchlist mini sparkline ──────────────────────────────────────────────────
function Mini({ g, t }: { g: OSWarGoal; t: OSGoalStats }) {
  const W = 68;
  const H = 30;
  const ym = Math.max(g.target, t.proj, t.cur) * 1.1 || 1;
  const X = (d: number) => (d / t.T) * W;
  const Y = (v: number) => H - 2 - (v / ym) * (H - 4);
  const actD = t.hist
    .map((h, i) => `${i ? "L" : "M"}${f1(X(h[0]))} ${f1(Y(h[1]))}`)
    .join(" ");
  const prjD = t.fresh
    ? ""
    : `M${f1(X(t.el))} ${f1(Y(t.cur))} L${W} ${f1(Y(t.proj))}`;
  const c = STC[t.status][0];
  return (
    <svg
      width="68"
      height="30"
      viewBox="0 0 68 30"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <path
        d={`M0 ${f1(Y(g.target))} L${W} ${f1(Y(g.target))}`}
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 3"
        style={{ stroke: "var(--mute)" }}
      />
      <path
        d={actD}
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
        style={{ stroke: "var(--ink)" }}
      />
      {prjD && (
        <path
          d={prjD}
          fill="none"
          strokeWidth="1.6"
          strokeDasharray="3 2.5"
          style={{ stroke: c }}
        />
      )}
    </svg>
  );
}

// ── empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 40,
        textAlign: "center",
      }}
    >
      <Persona agent="percy" size={56} />
      <span
        className="os-display"
        style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}
      >
        no goals yet
      </span>
      <span
        style={{
          fontSize: 13.5,
          color: "var(--soft)",
          maxWidth: 340,
          lineHeight: 1.5,
        }}
      >
        add a goal with a number and a deadline. Percy writes a plan and a
        roadmap for it and tracks the odds every day.
      </span>
      <button
        type="button"
        onClick={onNew}
        className="os-lift"
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: "var(--ink)",
          color: "var(--bg)",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
        }}
      >
        new goal
      </button>
    </div>
  );
}

// ── goal detail (header + stat strip + chart + roadmap + plan) ─────────────────
function GoalDetail({
  g,
  t,
  hov,
  setHov,
  chartRef,
  confirm,
  onEdit,
  onAskRemove,
  onKeep,
  onRemove,
  onReplan,
  onSwitchSource,
  onCycle,
  onStepBl,
  onAllBl,
}: {
  g: OSWarGoal;
  t: OSGoalStats;
  hov: number | null;
  setHov: (d: number | null) => void;
  chartRef: RefObject<SVGSVGElement | null>;
  confirm: boolean;
  onEdit: () => void;
  onAskRemove: () => void;
  onKeep: () => void;
  onRemove: () => void;
  onReplan: () => void;
  onSwitchSource: () => void;
  onCycle: (id: string, cur: StepStatus) => void;
  onStepBl: (step: OSWarGoal["plan"][number]) => void;
  onAllBl: () => void;
}) {
  const c = STC[t.status];
  const gap = Math.max(0, g.target - t.cur);
  const team = g.team.map((k) => AG_NAME[k]);
  const open = g.plan.filter((p) => !p.bl && p.st !== "done").length;
  const cells: {
    l: string;
    v: string;
    vc: string;
    s: string;
    sc: string;
  }[] = [
    {
      l: "now",
      v: fmtGoal(t.cur, g.unit),
      vc: "var(--ink)",
      s: t.d7
        ? `${t.d7 > 0 ? "▲" : "▼"} ${fmtGoal(Math.abs(t.d7), g.unit, true)} this week`
        : "flat this week",
      sc: t.d7 > 0 ? "var(--ok)" : t.d7 < 0 ? "var(--bad)" : "var(--mute)",
    },
    {
      l: "target",
      v: fmtGoal(g.target, g.unit),
      vc: "var(--ink)",
      s: dueLabel(g.due),
      sc: "var(--mute)",
    },
    {
      l: "gap",
      v: fmtGoal(gap, g.unit, true),
      vc: "var(--ink)",
      s: `${Math.round(t.pct * 100)}% of the way`,
      sc: "var(--soft)",
    },
    {
      l: "projected",
      v: t.fresh ? "—" : fmtGoal(t.proj, g.unit, true),
      vc: c[0],
      s: t.fresh ? "after week one" : `${Math.round(t.ratio * 100)}% of target`,
      sc: c[0],
    },
    {
      l: "odds",
      v: t.prob == null ? "—" : `${Math.round(t.prob * 100)}%`,
      vc: c[0],
      s: "of hitting it",
      sc: "var(--mute)",
    },
    g.model === "pipeline"
      ? {
          l: "from pipeline",
          v: `+${fmtGoal(t.E, g.unit, true)}`,
          vc: "var(--ink)",
          s: "open deals × odds",
          sc: "var(--mute)",
        }
      : {
          l: "pace / wk",
          v: t.fresh ? "—" : fmtGoal(t.pace, g.unit, true),
          vc: "var(--ink)",
          s: `need ${fmtGoal(t.need, g.unit, true)} / wk`,
          sc: t.fresh
            ? "var(--mute)"
            : t.pace >= t.need
              ? "var(--ok)"
              : "var(--bad)",
        },
  ];

  return (
    <>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Persona
          agent={g.owner}
          size={38}
          status={g.planning ? "working" : ""}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <span
              className="os-display"
              style={{
                fontWeight: 800,
                fontSize: 23,
                letterSpacing: "-0.025em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {g.n}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                background: c[1],
                color: c[0],
                whiteSpace: "nowrap",
              }}
            >
              {t.status}
            </span>
          </div>
          <span
            style={{
              fontSize: 12.5,
              color: "var(--soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {AG_NAME[g.owner]} leads
            {team.length ? ` with ${team.join(" and ")}` : ""} ·{" "}
            {dueLabel(g.due)} ·{" "}
            {t.left > 0 ? `${t.wl.toFixed(1)} weeks left` : "deadline passed"}
          </span>
          {goalSourceLine(g) && (
            <span
              style={{
                ...mono,
                fontSize: 11,
                color: "var(--mute)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {goalSourceLine(g)}
            </span>
          )}
        </div>
        {g.src === "manual" && /mrr|revenue|customers/i.test(g.n) && (
          <button
            type="button"
            onClick={onSwitchSource}
            style={{
              ...ghostBtn,
              borderColor: "var(--c-hunter)",
              color: "var(--c-hunter)",
            }}
          >
            switch to live Stripe MRR
          </button>
        )}
        <button type="button" onClick={onEdit} style={ghostBtn}>
          edit
        </button>
        <button
          type="button"
          onClick={onAskRemove}
          style={{ ...ghostBtn, color: "var(--bad)" }}
        >
          remove
        </button>
      </div>

      {confirm && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 18px",
            background: "oklch(0.66 0.18 28 / 0.1)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span style={{ fontSize: 13, flex: 1, minWidth: 0 }}>
            remove <b>{g.n}</b>? its plan and roadmap go with it.
          </span>
          <button
            type="button"
            onClick={onRemove}
            style={{
              padding: "7px 12px",
              borderRadius: 9,
              background: "var(--bad)",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            remove goal
          </button>
          <button type="button" onClick={onKeep} style={ghostBtn}>
            keep it
          </button>
        </div>
      )}

      {/* stat strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0,1fr))",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.l}
            style={{
              padding: "12px 12px 11px",
              borderRight: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 0,
            }}
          >
            <span className="os-kicker" style={{ fontSize: 9.5 }}>
              {cell.l}
            </span>
            <span
              style={{
                ...mono,
                fontSize: 16,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: cell.vc,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cell.v}
            </span>
            <span
              style={{
                ...mono,
                fontSize: 10.5,
                color: cell.sc,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cell.s}
            </span>
          </div>
        ))}
      </div>

      {/* projection chart */}
      <Chart g={g} t={t} hov={hov} setHov={setHov} chartRef={chartRef} />

      {/* roadmap */}
      <div
        style={{ padding: "14px 18px 8px", borderTop: "1px solid var(--line)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>roadmap</span>
          <span style={{ ...mono, fontSize: 10.5, color: "var(--mute)" }}>
            {g.planning
              ? "writing…"
              : g.planAt
                ? `made by percy · ${g.planAt}`
                : g.madeBy === "percy"
                  ? "made by percy"
                  : ""}
          </span>
          {!g.planning && (
            <button
              type="button"
              onClick={onReplan}
              style={{ ...ghostBtn, marginLeft: "auto" }}
            >
              re-plan with percy
            </button>
          )}
        </div>
        {g.stale && !g.planning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              background: "oklch(0.8 0.14 70 / 0.16)",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                flex: 1,
                color: "var(--ambink)",
                fontWeight: 600,
              }}
            >
              the numbers changed since this plan was made
            </span>
            <button
              type="button"
              onClick={onReplan}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 8,
                background: "oklch(0.68 0.21 38)",
                color: "#0e0d0c",
                cursor: "pointer",
                border: "none",
                whiteSpace: "nowrap",
              }}
            >
              re-plan
            </button>
          </div>
        )}
        {g.planning ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
              borderRadius: 12,
              background: "var(--surf2)",
            }}
          >
            <Persona agent="percy" size={46} status="working" />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Percy is writing the plan and roadmap
              </span>
              <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                checking the numbers with {AG_NAME[g.owner]} first. it takes a
                few seconds.
              </span>
            </div>
          </div>
        ) : g.plan.length > 0 ? (
          <>
            {g.summary && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 11,
                  background: "var(--t-percy)",
                  marginBottom: 12,
                }}
              >
                <Persona agent="percy" size={22} />
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>
                  {g.summary}
                </span>
              </div>
            )}
            <Roadmap g={g} t={t} />
          </>
        ) : (
          <div
            style={{
              padding: "10px 2px",
              fontSize: 12.5,
              color: "var(--soft)",
              lineHeight: 1.45,
            }}
          >
            no plan yet. “re-plan with percy” asks Percy to write the steps and
            roadmap.
          </div>
        )}
      </div>

      {/* plan */}
      {!g.planning && g.plan.length > 0 && (
        <div
          style={{
            padding: "14px 18px 18px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>plan</span>
            <span style={{ ...mono, fontSize: 10.5, color: "var(--mute)" }}>
              {g.plan.length} steps ·{" "}
              {g.plan.filter((p) => p.st === "done").length} done
            </span>
            {open > 0 && (
              <button
                type="button"
                onClick={onAllBl}
                style={{ ...ghostBtn, marginLeft: "auto" }}
              >
                send open steps to backlog
              </button>
            )}
          </div>
          {g.plan.map((p) => {
            const k = STEP_STYLE[p.st] ?? STEP_STYLE.todo;
            const done = p.st === "done";
            const dot = p.st === "doing" || p.st === "waiting";
            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px minmax(0,1fr) 96px 88px 82px",
                  gap: 12,
                  alignItems: "center",
                  padding: "9px 0",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onCycle(p.id, p.st)}
                  title={`${k[2]} · tap to change`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${k[0]}`,
                    background: k[1],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {done && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                  {dot && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: k[0],
                      }}
                    />
                  )}
                </button>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.35,
                      textDecoration: done ? "line-through" : "none",
                      color: done ? "var(--mute)" : "var(--ink)",
                    }}
                  >
                    {p.t}
                  </span>
                  <span style={{ fontSize: 11, color: k[0], fontWeight: 600 }}>
                    {k[2]}
                  </span>
                </div>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: `var(${AGENT_HUE_VAR[p.a]})`,
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  <Persona agent={p.a} size={18} />
                  {AG_NAME[p.a]}
                </span>
                <span
                  style={{
                    ...mono,
                    fontSize: 11,
                    color: "var(--mute)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.when}
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {p.bl ? (
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "var(--mute)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      in backlog
                    </span>
                  ) : (
                    !done && (
                      <button
                        type="button"
                        onClick={() => onStepBl(p)}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "4px 9px",
                          borderRadius: 7,
                          border: "1px solid var(--line)",
                          background: "transparent",
                          color: "var(--ink)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        → backlog
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

const ghostBtn: CSSProperties = {
  padding: "7px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  flex: "none",
  whiteSpace: "nowrap",
};

// ── projection chart ──────────────────────────────────────────────────────────
function Chart({
  g,
  t,
  hov,
  setHov,
  chartRef,
}: {
  g: OSWarGoal;
  t: OSGoalStats;
  hov: number | null;
  setHov: (d: number | null) => void;
  chartRef: RefObject<SVGSVGElement | null>;
}) {
  const startMs = msOf(g.start);
  const X = (d: number) => ML + (d / t.T) * (PR - ML);
  const top = Math.max(g.target, t.fresh ? t.cur : t.hi, t.cur) * 1.08 || 1;
  const step = nice(top);
  const ymax = Math.ceil(top / step) * step;
  const Y = (v: number) => MT + (1 - v / ymax) * (PB - MT);
  const act = t.hist
    .map((h, i) => `${i ? "L" : "M"}${f1(X(h[0]))} ${f1(Y(h[1]))}`)
    .join(" ");
  const area =
    t.hist.length > 1
      ? `${act} L${f1(X(t.el))} ${PB} L${f1(X(t.hist[0][0]))} ${PB} Z`
      : "";
  const hasProj = !t.fresh && t.left > 0;
  const fr = (d: number) =>
    Math.max(0, (d - t.el) / Math.max(1e-6, t.T - t.el));
  const midAt = (d: number) => t.cur + (t.proj - t.cur) * fr(d);
  const rngAt = (d: number): [number, number] => {
    const k = fr(d) ** 0.75;
    return [midAt(d) - (t.proj - t.lo) * k, midAt(d) + (t.hi - t.proj) * k];
  };
  let prj = "";
  let band = "";
  if (hasProj) {
    prj = `M${f1(X(t.el))} ${f1(Y(t.cur))} L${f1(X(t.T))} ${f1(Y(t.proj))}`;
    const up: string[] = [];
    const dn: string[] = [];
    for (let i = 0; i <= 14; i++) {
      const d = t.el + ((t.T - t.el) * i) / 14;
      const [lo, hi] = rngAt(d);
      up.push(`${f1(X(d))} ${f1(Y(Math.min(ymax, hi)))}`);
      dn.unshift(`${f1(X(d))} ${f1(Y(Math.max(0, lo)))}`);
    }
    band = `M${up.join(" L")} L${dn.join(" L")} Z`;
  }
  const need =
    t.left > 0 && t.cur < g.target
      ? `M${f1(X(t.el))} ${f1(Y(t.cur))} L${f1(X(t.T))} ${f1(Y(g.target))}`
      : "";
  const ygrid: { y: string; ty: string; t: string }[] = [];
  for (let v = 0; v <= ymax + 1e-9; v += step)
    ygrid.push({ y: f1(Y(v)), ty: f1(Y(v) + 3.5), t: fmtGoal(v, null, true) });
  const months: { x: string; t: string }[] = [];
  for (
    let m = new Date(
      new Date(startMs).getFullYear(),
      new Date(startMs).getMonth() + 1,
      1,
    );
    m.getTime() <= msOf(g.due);
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  )
    months.push({
      x: f1(X((m.getTime() - startMs) / DAY)),
      t: MONS[m.getMonth()],
    });
  const c = STC[t.status][0];
  const tgy = Y(g.target);

  // hover readout
  let hoverEls: ReactNode = null;
  if (hov != null) {
    const isF = hov > t.el;
    let v: number;
    let txt: string;
    if (!isF) {
      let acc = t.hist.length ? t.hist[0][1] : 0;
      for (const [d, x] of t.hist) {
        if (d <= hov) acc = x;
        else break;
      }
      v = acc;
      txt = fmtGoal(v, g.unit, true);
    } else if (hasProj) {
      v = midAt(hov);
      const [lo, hi] = rngAt(hov);
      txt = `${fmtGoal(v, g.unit, true)} (${fmtGoal(Math.max(0, lo), null, true)}–${fmtGoal(hi, null, true)})`;
    } else {
      v = t.cur + (g.target - t.cur) * fr(hov);
      txt = `${fmtGoal(v, g.unit, true)} needed`;
    }
    const hx = X(hov);
    const hy = Y(v);
    // size the tooltip to its text (monospace → predictable advance) so a long
    // projected range like "AED 259.7 (168.9–477.3)" isn't clipped, and keep the
    // box on-canvas on both sides.
    const line1 = dayMon(startMs + hov * DAY) + (isF ? " · projected" : "");
    const boxW = Math.ceil(Math.max(line1.length * 6, txt.length * 7.3)) + 20;
    const gap = 10;
    let bx = hx + boxW + gap > 680 ? hx - boxW - gap : hx + gap;
    bx = Math.max(2, Math.min(680 - boxW - 2, bx));
    const by = Math.max(MT, Math.min(PB - 38, hy - 46));
    hoverEls = (
      <>
        <line
          x1={f1(hx)}
          x2={f1(hx)}
          y1="18"
          y2="206"
          style={{ stroke: "var(--ink)", opacity: 0.35 }}
        />
        <circle
          cx={f1(hx)}
          cy={f1(hy)}
          r="4"
          strokeWidth="2"
          style={{ fill: "var(--surf)", stroke: "var(--ink)" }}
        />
        <rect
          x={f1(bx)}
          y={f1(by)}
          width={f1(boxW)}
          height="38"
          rx="7"
          style={{ fill: "var(--ink)" }}
        />
        <text
          x={f1(bx + 10)}
          y={f1(by + 15)}
          fontFamily="var(--font-mono)"
          fontSize="10"
          style={{ fill: "var(--bg)", opacity: 0.75 }}
        >
          {line1}
        </text>
        <text
          x={f1(bx + 10)}
          y={f1(by + 30)}
          fontFamily="var(--font-mono)"
          fontSize="12"
          fontWeight="600"
          style={{ fill: "var(--bg)" }}
        >
          {txt}
        </text>
      </>
    );
  }

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const el = chartRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 680;
    const d = ((px - ML) / (PR - ML)) * t.T;
    setHov(d < 0 || d > t.T ? null : d);
  };

  return (
    <div style={{ padding: "12px 18px 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 4,
          ...mono,
          fontSize: 10.5,
          color: "var(--soft)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          projection
        </span>
        <Legend
          swatch={
            <span style={{ width: 14, height: 2, background: "var(--ink)" }} />
          }
        >
          actual
        </Legend>
        <Legend
          swatch={
            <span
              style={{ width: 14, height: 0, borderTop: `2px dashed ${c}` }}
            />
          }
        >
          projected
        </Legend>
        <Legend
          swatch={
            <span
              style={{
                width: 14,
                height: 8,
                borderRadius: 2,
                background: c,
                opacity: 0.25,
              }}
            />
          }
        >
          likely range
        </Legend>
        <Legend
          swatch={
            <span
              style={{
                width: 14,
                height: 0,
                borderTop: "2px dotted oklch(0.68 0.21 38)",
              }}
            />
          }
        >
          needed
        </Legend>
        <span style={{ marginLeft: "auto", color: "var(--mute)" }}>
          {g.model === "pipeline"
            ? "open deals × stage odds"
            : "last 4 weeks of pace"}
        </span>
      </div>
      <svg
        ref={chartRef}
        viewBox="0 0 680 228"
        width="100%"
        onPointerMove={onMove}
        onPointerLeave={() => setHov(null)}
        style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
        role="img"
        aria-label={`projection for ${g.n}`}
      >
        {ygrid.map((y) => (
          <g key={y.y}>
            <line
              x1="44"
              x2="600"
              y1={y.y}
              y2={y.y}
              strokeWidth="1"
              style={{ stroke: "var(--line)" }}
            />
            <text
              x="36"
              y={y.ty}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="10"
              style={{ fill: "var(--mute)" }}
            >
              {y.t}
            </text>
          </g>
        ))}
        {months.map((m) => (
          <g key={`${m.x}-${m.t}`}>
            <line
              x1={m.x}
              x2={m.x}
              y1="206"
              y2="211"
              style={{ stroke: "var(--mute)" }}
            />
            <text
              x={m.x}
              y="223"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              style={{ fill: "var(--mute)" }}
            >
              {m.t}
            </text>
          </g>
        ))}
        {band && <path d={band} style={{ fill: c, opacity: 0.14 }} />}
        {area && (
          <path d={area} style={{ fill: "var(--ink)", opacity: 0.06 }} />
        )}
        <path
          d={`M${ML} ${f1(tgy)} L${PR} ${f1(tgy)}`}
          fill="none"
          strokeWidth="1.2"
          strokeDasharray="5 4"
          style={{ stroke: "var(--soft)" }}
        />
        <text
          x="50"
          y={f1(tgy - 6)}
          fontFamily="var(--font-mono)"
          fontSize="10"
          style={{ fill: "var(--soft)" }}
        >
          target {fmtGoal(g.target, g.unit)}
        </text>
        {need && (
          <path
            d={need}
            fill="none"
            strokeWidth="1.8"
            strokeDasharray="1.5 4"
            strokeLinecap="round"
            style={{ stroke: "oklch(0.68 0.21 38)" }}
          />
        )}
        <path
          d={act}
          fill="none"
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ stroke: "var(--ink)" }}
        />
        {prj && (
          <path
            d={prj}
            fill="none"
            strokeWidth="2.2"
            strokeDasharray="6 5"
            style={{ stroke: c }}
          />
        )}
        <line
          x1={f1(X(t.el))}
          x2={f1(X(t.el))}
          y1="18"
          y2="206"
          strokeDasharray="2 3"
          style={{ stroke: "var(--mute)" }}
        />
        <text
          x={f1(X(t.el))}
          y="11"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          style={{ fill: "var(--mute)" }}
        >
          today
        </text>
        <circle
          cx={f1(X(t.el))}
          cy={f1(Y(t.cur))}
          r="4.5"
          strokeWidth="2"
          style={{ fill: "var(--ink)", stroke: "var(--surf)" }}
        />
        {hasProj && (
          <>
            <circle
              cx="600"
              cy={f1(Y(t.proj))}
              r="4.5"
              strokeWidth="2"
              style={{ fill: c, stroke: "var(--surf)" }}
            />
            <text
              x="608"
              y={f1(Y(t.proj) + 4)}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="600"
              style={{ fill: c }}
            >
              {fmtGoal(t.proj, g.unit, true)}
            </text>
          </>
        )}
        {hoverEls}
      </svg>
    </div>
  );
}

function Legend({
  swatch,
  children,
}: {
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {swatch}
      {children}
    </span>
  );
}

// ── roadmap (Gantt) ───────────────────────────────────────────────────────────
const LBL = 176;
function Roadmap({ g, t }: { g: OSWarGoal; t: OSGoalStats }) {
  const startMs = msOf(g.start);
  const pct = (d: number) =>
    `${Math.max(0, Math.min(100, (d / t.T) * 100)).toFixed(2)}%`;
  const months: { l: string; t: string }[] = [];
  for (
    let m = new Date(
      new Date(startMs).getFullYear(),
      new Date(startMs).getMonth() + 1,
      1,
    );
    m.getTime() <= msOf(g.due);
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  )
    months.push({
      l: pct((m.getTime() - startMs) / DAY),
      t: MONS[m.getMonth()],
    });

  const rows = g.road.map((r) => {
    const a = Math.max(0, Math.min(t.T - 2, t.el + r.from * 7));
    const b = Math.max(a + 2, Math.min(t.T, t.el + r.to * 7));
    const st = b <= t.el ? "done" : a <= t.el ? "now" : "next";
    const c = `var(${AGENT_HUE_VAR[r.a]})`;
    return {
      ...r,
      c,
      l: pct(a),
      w: `${(((b - a) / t.T) * 100).toFixed(2)}%`,
      bg: st === "next" ? "transparent" : `var(${AGENT_TINT_VAR[r.a]})`,
      bs: st === "next" ? "dashed" : "solid",
      prog:
        st === "done"
          ? "100%"
          : st === "now"
            ? `${(((t.el - a) / (b - a)) * 100).toFixed(1)}%`
            : "0%",
      mc: st === "done" ? c : "var(--surf)",
      ms: `→ ${r.m} · ${dayMon(startMs + b * DAY)}`,
    };
  });

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${LBL}px minmax(0,1fr)`,
          height: 20,
        }}
      >
        <span />
        <div style={{ position: "relative" }}>
          {months.map((m) => (
            <span
              key={`${m.l}-${m.t}`}
              style={{
                position: "absolute",
                left: m.l,
                top: 0,
                transform: "translateX(-50%)",
                ...mono,
                fontSize: 10,
                color: "var(--mute)",
              }}
            >
              {m.t}
            </span>
          ))}
        </div>
      </div>
      {rows.map((p) => (
        <div
          key={p.id}
          style={{
            display: "grid",
            gridTemplateColumns: `${LBL}px minmax(0,1fr)`,
            alignItems: "center",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px 8px 0",
              minWidth: 0,
            }}
          >
            <Persona agent={p.a} size={20} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.n}
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "var(--mute)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.ms}
              </span>
            </div>
          </div>
          <div style={{ position: "relative", height: 44 }}>
            <div
              style={{
                position: "absolute",
                left: p.l,
                width: p.w,
                top: 14,
                height: 16,
                borderRadius: 5,
                background: p.bg,
                border: `1.5px ${p.bs} ${p.c}`,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: p.prog,
                  background: p.c,
                  opacity: 0.85,
                }}
              />
            </div>
            <span
              style={{
                position: "absolute",
                left: pct(Math.max(a0(p, t), 0)),
                top: 17,
                width: 10,
                height: 10,
                marginLeft: -5,
                transform: "rotate(45deg)",
                background: p.mc,
                border: `2px solid ${p.c}`,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          top: 18,
          bottom: 0,
          left: `calc(${LBL}px + (100% - ${LBL}px) * ${(t.el / t.T).toFixed(4)})`,
          width: 0,
          borderLeft: "1.5px dashed var(--ink)",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
// milestone x = end of the bar (b), reused from the row maths
function a0(p: { to: number }, t: OSGoalStats) {
  const b = Math.max(0, Math.min(t.T, t.el + p.to * 7));
  return b;
}

// ── new / edit goal form ──────────────────────────────────────────────────────
function GoalForm({
  form,
  setForm,
  isNew,
  selected,
  now,
  money,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  isNew: boolean;
  selected: OSWarGoal | null;
  now: number;
  money: OSMoney;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  // day-47: the "now" field is read-only + live for any non-manual source.
  const live = form.src !== "manual";
  const isMoney = MONEY_SRCS.includes(form.src);
  const tgt = Number.parseFloat(form.target);
  const dueOk = form.due && msOf(form.due) > now;
  const err = !form.n.trim()
    ? "give the goal a name"
    : !(tgt > 0)
      ? "set a target above zero"
      : !dueOk
        ? "pick a deadline in the future"
        : "";
  const upd = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  // the live "now" value. For an existing live goal the bridge keeps `cur`; for a
  // new one (or revenue-since) we preview it from the money mirror.
  const liveNow = live
    ? !isNew && selected && selected.src === form.src
      ? selected.cur
      : liveGoalValue(form.src, form.product, money, form.start)
    : Number.parseFloat(form.cur || "0");

  // pick a source: locks the unit (AED sources → AED, counts → count) and, for a
  // money source, reveals the product control.
  const pickSrc = (src: GoalSrc) => {
    const unit: FormState["unit"] = AED_SRCS.includes(src) ? "AED" : "count";
    setForm({
      ...form,
      src,
      unit,
      product: MONEY_SRCS.includes(src) ? form.product : "all",
      // seed a start for revenue-since
      start:
        src === "revenue-since"
          ? form.start || new Date(now).toISOString().slice(0, 10)
          : form.start,
    });
  };

  const field: CSSProperties = {
    height: 38,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "var(--surf2)",
    color: "var(--ink)",
    fontSize: 13.5,
    outline: "none",
    minWidth: 0,
    ...mono,
  };
  const label: CSSProperties = {
    ...mono,
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--mute)",
  };

  return (
    <div
      style={{
        padding: "18px 20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          className="os-display"
          style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.025em" }}
        >
          {isNew ? "new goal" : "edit goal"}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
          {isNew
            ? "Percy writes a plan and a roadmap as soon as you create it"
            : "changing the target or deadline flags the plan for a re-plan"}
        </span>
      </div>

      {isNew && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUGG.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                const { start, due } = s.dates(now);
                setForm({
                  ...form,
                  n: s.n,
                  target: String(s.target),
                  unit: s.unit,
                  src: s.src,
                  product: s.product,
                  due,
                  start,
                  cur: "0",
                });
              }}
              style={{
                fontSize: 12,
                padding: "6px 11px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: "var(--surf2)",
                cursor: "pointer",
                color: "var(--ink)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={label}>goal</span>
        <input
          value={form.n}
          onChange={upd("n")}
          placeholder="e.g. monthly retainers signed"
          style={{
            ...field,
            height: 42,
            fontSize: 15,
            fontFamily: "var(--font-ui)",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span style={label}>target</span>
          <input
            type="number"
            value={form.target}
            onChange={upd("target")}
            placeholder="10"
            style={field}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span style={label}>unit</span>
          <div
            style={{
              display: "flex",
              height: 38,
              padding: 3,
              borderRadius: 10,
              background: "var(--surf2)",
              border: "1px solid var(--line)",
            }}
          >
            {(["count", "AED"] as const).map((u) => (
              <button
                key={u}
                type="button"
                disabled={live}
                onClick={() => !live && setForm({ ...form, unit: u })}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: live ? "default" : "pointer",
                  border: "none",
                  background: form.unit === u ? "var(--surf)" : "transparent",
                  color: form.unit === u ? "var(--ink)" : "var(--soft)",
                  opacity: live && form.unit !== u ? 0.4 : 1,
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span style={label}>now at{live ? " · live" : ""}</span>
          <input
            type="number"
            value={live ? String(liveNow) : form.cur}
            onChange={upd("cur")}
            disabled={live}
            title={live ? "counted live from the source below" : undefined}
            style={{ ...field, opacity: live ? 0.55 : 1 }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span style={label}>deadline</span>
          <input
            type="date"
            value={form.due}
            onChange={upd("due")}
            style={{ ...field, fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={label}>who leads it</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setForm({ ...form, owner: k })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "4px 12px 4px 4px",
                borderRadius: 999,
                border: `1px solid ${form.owner === k ? `var(${AGENT_HUE_VAR[k]})` : "var(--line)"}`,
                background:
                  form.owner === k
                    ? `var(${AGENT_TINT_VAR[k]})`
                    : "transparent",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <Persona agent={k} size={24} />
              {AG_NAME[k]}
            </button>
          ))}
        </div>
      </div>

      {/* day-47: counted from — how this goal's number is measured */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={label}>counted from</span>
        {(
          [
            ["typed", [["manual", "typed by hand"]]],
            [
              "pipeline",
              [
                ["won-count", "pilots won"],
                ["won-value", "AED won"],
                ["prospects-count", "prospects in play"],
                ["replied-count", "replies"],
                ["calls-count", "calls"],
              ],
            ],
            [
              "money",
              [
                ["stripe-mrr", "MRR"],
                ["stripe-month", "revenue this month"],
                ["stripe-customers", "paying customers"],
                ["revenue-since", "revenue since start"],
              ],
            ],
          ] as [string, [GoalSrc, string][]][]
        ).map(([grp, opts]) => (
          <div
            key={grp}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ ...label, width: 64, flex: "none" }}>{grp}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {opts.map(([s, lab]) => {
                const on = form.src === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pickSrc(s)}
                    style={{
                      fontSize: 12,
                      padding: "5px 11px",
                      borderRadius: 999,
                      border: `1px solid ${on ? "var(--ink)" : "var(--line)"}`,
                      background: on ? "var(--surf)" : "transparent",
                      color: on ? "var(--ink)" : "var(--soft)",
                      fontWeight: on ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lab}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {isMoney && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
            }}
          >
            <span style={{ ...label, width: 64, flex: "none" }}>product</span>
            <div
              style={{
                display: "flex",
                padding: 3,
                borderRadius: 10,
                background: "var(--surf2)",
                border: "1px solid var(--line)",
              }}
            >
              {(["all", "persept", "gyst"] as GoalProduct[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, product: p })}
                  style={{
                    padding: "5px 13px",
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    background:
                      form.product === p ? "var(--surf)" : "transparent",
                    color: form.product === p ? "var(--ink)" : "var(--soft)",
                  }}
                >
                  {PRODUCT_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.src === "revenue-since" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...label, width: 64, flex: "none" }}>since</span>
            <input
              type="date"
              value={form.start ?? ""}
              onChange={upd("start")}
              style={{ ...field, fontSize: 13, width: 180 }}
            />
          </div>
        )}
      </div>

      {form.tried && err && (
        <span style={{ fontSize: 12.5, color: "var(--bad)" }}>{err}</span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={onSubmit}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "oklch(0.68 0.21 38)",
            color: "#0e0d0c",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            whiteSpace: "nowrap",
          }}
        >
          {isNew ? "create and plan" : "save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--ink)",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}
