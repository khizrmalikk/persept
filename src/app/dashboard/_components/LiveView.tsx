"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PercyAvatar } from "@/components/percy/PercyAvatar";
import { setPercyLook, setPercyMode } from "@/components/percy/percy-bus";
import type { OSPlan, OSPlanStep, OSShow } from "../_data/plans";
import { useOS, type WindowKey } from "./os-store";
import type { AgentKey } from "./Persona";

// ── live view ──────────────────────────────────────────────────────────────
// Replays a Percy `plan` event as on-screen choreography: Percy's cursor opens
// the right surface, moves to the row the work landed on, and the live card's
// steps tick todo → doing → done. Percy already did the work on the bridge — the
// dashboard only REPLAYS it (never performs it). Driven by plan rows that arrive
// via the server tick/refresh, so there is no browser-side realtime.

type StepStatus = "todo" | "doing" | "done" | "late";
export type LiveRun = {
  plan: OSPlan;
  steps: StepStatus[];
  i: number;
  status: "running" | "done" | "stopped";
};
type Cursor = {
  x: number;
  y: number;
  vis: boolean;
  ms: number;
  carry: string | null;
};
type Highlight = { x: number; y: number; w: number; h: number } | null;

type LiveApi = {
  run: LiveRun | null;
  cursor: Cursor;
  highlight: Highlight;
  note: string | null;
  showWorking: boolean;
  setShowWorking: (v: boolean) => void;
  takeOver: () => void;
};

const LiveCtx = createContext<LiveApi | null>(null);
export function useLive(): LiveApi {
  const v = useContext(LiveCtx);
  if (!v) throw new Error("useLive must be used inside <LiveProvider>");
  return v;
}

// which surface a step opens, and the text used to find its row once there.
function surfaceFor(step: OSPlanStep): { win: string | null; needle: string } {
  const after = (p: string) =>
    step.key.startsWith(p) ? step.key.slice(p.length).trim() : step.label;
  switch (step.kind) {
    case "ops":
      return { win: "__monitor__", needle: after("ops:") };
    case "campaign":
      return { win: "marketing", needle: after("campaign:") };
    case "backlog":
      return { win: "command", needle: after("backlog:") };
    case "fix":
      return { win: "dev", needle: after("fix:") };
    case "approval":
      return { win: "approvals", needle: after("approval:") };
    case "leads":
      return { win: "frontdesk", needle: "" };
    default:
      return { win: null, needle: step.label };
  }
}

const SURFACE_PC: Record<string, string> = {
  __monitor__: '[data-pc="sysmon"]',
  marketing: '[data-pc="win"]',
  command: '[data-pc="win"]',
  dev: '[data-pc="win"]',
  approvals: '[data-pc="win"]',
  frontdesk: '[data-pc="win"]',
};

// scan a container for the smallest element whose text contains `needle`.
function findInSurface(scope: Element, needle: string): Element | null {
  if (!needle) return null;
  const want = needle.toLowerCase().replace(/\s+/g, " ").trim();
  let best: Element | null = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const el of Array.from(
    scope.querySelectorAll("div,span,b,td,a,button"),
  )) {
    const t = (el.textContent ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!t || t.length > want.length + 40 || !t.includes(want)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const area = r.width * r.height;
    if (area < bestArea) {
      bestArea = area;
      best = el.closest('[role="button"],button') ?? el;
    }
  }
  return best;
}

const INITIAL_CURSOR: Cursor = { x: 0, y: 0, vis: false, ms: 0, carry: null };

export function LiveProvider({
  plans,
  shows,
  children,
}: {
  plans: OSPlan[];
  shows: OSShow[];
  children: ReactNode;
}) {
  const os = useOS();
  const [run, setRun] = useState<LiveRun | null>(null);
  const [cursor, setCursor] = useState<Cursor>(INITIAL_CURSOR);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showWorking, setShowWorkingState] = useState(true);

  // os api in a ref so the engine (started once per plan) always calls the latest
  const osRef = useRef(os);
  osRef.current = os;
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const ctxRef = useRef<{ dead: boolean }>({ dead: true });
  const seenRef = useRef<Set<number>>(new Set());
  const seenShowsRef = useRef<Set<number>>(new Set());
  const showRef = useRef(showWorking);
  showRef.current = showWorking;

  const setShowWorking = useCallback((v: boolean) => {
    setShowWorkingState(v);
    try {
      window.localStorage.setItem("os-show-working", v ? "1" : "0");
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("os-show-working");
    if (saved === "0") setShowWorkingState(false);
  }, []);

  const stop = useCallback((quiet: boolean) => {
    ctxRef.current.dead = true;
    setCursor((c) => ({ ...c, vis: false, carry: null }));
    setHighlight(null);
    setNote(null);
    setPercyLook(null);
    setPercyMode("idle");
    setRun((r) => (r ? { ...r, status: "stopped" } : r));
    if (!quiet)
      osRef.current.showToast(
        "you took over. Percy's work carries on in the background",
      );
  }, []);

  const takeOver = useCallback(() => stop(false), [stop]);

  // esc + a user pointer move near the cursor stop the replay (Percy's work is
  // already done on the bridge, so this only stops the on-screen replay).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !ctxRef.current.dead) {
        e.stopPropagation();
        stop(false);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (ctxRef.current.dead) return;
      const c = cursorRef.current;
      if (c.vis && Math.hypot(e.clientX - c.x, e.clientY - c.y) < 300)
        stop(false);
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointermove", onMove);
    };
  }, [stop]);

  // watch for a fresh plan and replay it (newest first; only recent, unseen ones
  // with steps — so old plans don't replay on load).
  // biome-ignore lint/correctness/useExhaustiveDependencies: the engine reads os/cursor via refs; re-run only when a new plan arrives
  useEffect(() => {
    if (!showRef.current) return;
    if (!ctxRef.current.dead) return; // one plan at a time
    const now = Date.now();
    const fresh = plans.find((p) => {
      if (seenRef.current.has(p.eventId) || p.steps.length === 0) return false;
      const t = Date.parse(p.ts);
      return Number.isNaN(t) || now - t < 90_000;
    });
    if (!fresh) return;
    seenRef.current.add(fresh.eventId);
    const ctx = { dead: false };
    ctxRef.current = ctx;
    void replay(fresh, ctx);
  }, [plans]);

  // watch for a fresh `show` (Percy opening a specific row) and replay it
  // biome-ignore lint/correctness/useExhaustiveDependencies: engine reads refs; re-run only when a new show arrives
  useEffect(() => {
    if (!showRef.current) return;
    if (!ctxRef.current.dead) return;
    const now = Date.now();
    const fresh = shows.find((s) => {
      if (seenShowsRef.current.has(s.eventId)) return false;
      const t = Date.parse(s.ts);
      return Number.isNaN(t) || now - t < 90_000;
    });
    if (!fresh) return;
    seenShowsRef.current.add(fresh.eventId);
    const ctx = { dead: false };
    ctxRef.current = ctx;
    void replayShow(fresh, ctx);
  }, [shows]);

  async function replay(plan: OSPlan, ctx: { dead: boolean }) {
    const wait = (ms: number) =>
      new Promise<void>((res, rej) =>
        setTimeout(() => (ctx.dead ? rej(new Error("stopped")) : res()), ms),
      );
    const moveTo = async (el: Element | null, slow = 1) => {
      if (!el) {
        await wait(180);
        return false;
      }
      const r = el.getBoundingClientRect();
      const tx = r.left + Math.min(r.width / 2, 40);
      const ty = r.top + r.height / 2;
      const c = cursorRef.current;
      const d = Math.hypot(tx - (c.x || tx), ty - (c.y || ty));
      const ms = Math.round(Math.min(1100, 300 + d * 0.6) * slow);
      setCursor((p) => ({ ...p, x: tx, y: ty, vis: true, ms }));
      setPercyLook({ x: tx, y: ty });
      await wait(ms + 80);
      return true;
    };

    try {
      setPercyMode("working");
      setRun({
        plan,
        steps: plan.steps.map(() => "todo"),
        i: 0,
        status: "running",
      });
      // cursor in — anchor at the Percy pill
      const pill = document.querySelector('[data-pc="pill"]');
      if (pill) {
        const r = pill.getBoundingClientRect();
        setCursor({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          vis: true,
          ms: 0,
          carry: null,
        });
      }
      await wait(350);

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        setRun((r) => (r ? { ...r, i, steps: mark(r.steps, i, "doing") } : r));
        // `show` steps navigate via the paired bare `show` event; here we just
        // dwell and resolve so the live card ticks without the 20s row-hunt.
        if (step.kind === "show") {
          await wait(700);
          setRun((r) => (r ? { ...r, steps: mark(r.steps, i, "done") } : r));
          continue;
        }
        const { win, needle } = surfaceFor(step);

        // open the surface
        if (win === "__monitor__") osRef.current.openMonitor();
        else if (win) osRef.current.open(win as WindowKey);
        await wait(520);

        // move the cursor onto the surface, then hunt for the row (up to 20s)
        const surfaceSel = win ? SURFACE_PC[win] : null;
        const surfaceEl = surfaceSel
          ? document.querySelector(surfaceSel)
          : null;
        await moveTo(surfaceEl);

        let found: Element | null = null;
        for (let tries = 0; tries < 40 && !found; tries++) {
          const scope = surfaceSel ? document.querySelector(surfaceSel) : null;
          found = scope ? findInSurface(scope, needle) : null;
          if (found) break;
          await wait(500); // ~20s total; a tick refresh brings the row into DOM
        }
        if (found) {
          await moveTo(found);
          const r = found.getBoundingClientRect();
          setHighlight({ x: r.left, y: r.top, w: r.width, h: r.height });
          await wait(700);
          setHighlight(null);
          setRun((r2) =>
            r2 ? { ...r2, steps: mark(r2.steps, i, "done") } : r2,
          );
        } else {
          // row never arrived in time — mark late (muted), don't fail the plan
          setRun((r2) =>
            r2 ? { ...r2, steps: mark(r2.steps, i, "late") } : r2,
          );
        }
      }

      // done — cursor back to the pill, fade out
      await moveTo(document.querySelector('[data-pc="pill"]'));
      setCursor((c) => ({ ...c, vis: false, carry: null }));
      setPercyLook(null);
      setPercyMode("idle");
      setRun((r) => (r ? { ...r, status: "done" } : r));
      ctx.dead = true;
      await wait(4000);
      setRun((r) => (r && r.plan.eventId === plan.eventId ? null : r));
    } catch {
      // stopped via take-over / esc / pointer — state already reset by stop()
      ctx.dead = true;
    }
  }

  // Replay a bare `show` event: open the window, land the cursor on the row
  // (data-pc="<what>-<id>"), highlight it. On an unresolved ref, open the window
  // only and surface a "couldn't find …" note on the strip.
  async function replayShow(show: OSShow, ctx: { dead: boolean }) {
    const wait = (ms: number) =>
      new Promise<void>((res, rej) =>
        setTimeout(() => (ctx.dead ? rej(new Error("stopped")) : res()), ms),
      );
    const moveTo = async (el: Element | null) => {
      if (!el) {
        await wait(180);
        return;
      }
      const r = el.getBoundingClientRect();
      const tx = r.left + Math.min(r.width / 2, 40);
      const ty = r.top + r.height / 2;
      const c = cursorRef.current;
      const d = Math.hypot(tx - (c.x || tx), ty - (c.y || ty));
      const ms = Math.round(Math.min(1100, 300 + d * 0.6));
      setCursor((p) => ({ ...p, x: tx, y: ty, vis: true, ms }));
      setPercyLook({ x: tx, y: ty });
      await wait(ms + 80);
    };

    try {
      setPercyMode("working");
      setRun({
        plan: {
          eventId: show.eventId,
          messageEventId: show.messageEventId,
          sessionKey: "",
          say: "",
          ts: show.ts,
          steps: [
            { kind: "show", key: "", label: `open ${show.ref || show.what}` },
          ],
        },
        steps: ["doing"],
        i: 0,
        status: "running",
      });
      const pill = document.querySelector('[data-pc="pill"]');
      if (pill) {
        const r = pill.getBoundingClientRect();
        setCursor({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          vis: true,
          ms: 0,
          carry: null,
        });
      }
      await wait(350);

      // open the surface Percy is pointing at
      if (show.window === "system") osRef.current.openMonitor();
      else if (show.what === "agent" && show.id)
        osRef.current.openAgent(show.id as AgentKey);
      else if (show.window) osRef.current.open(show.window as WindowKey);
      await wait(520);

      if (!show.resolved) {
        setNote(`couldn't find ${show.ref || "it"}`);
        await wait(2000);
        setNote(null);
      } else if (show.id && show.what !== "window" && show.what !== "agent") {
        const sel = `[data-pc="${show.what}-${show.id}"]`;
        let el: Element | null = null;
        for (let t = 0; t < 12 && !el; t++) {
          el = document.querySelector(sel);
          if (el) break;
          await wait(400);
        }
        if (el) {
          await moveTo(el);
          const r = el.getBoundingClientRect();
          setHighlight({ x: r.left, y: r.top, w: r.width, h: r.height });
          await wait(1500);
          setHighlight(null);
        }
      }

      setRun((rr) => (rr ? { ...rr, steps: ["done"], status: "done" } : rr));
      await moveTo(document.querySelector('[data-pc="pill"]'));
      setCursor((c) => ({ ...c, vis: false, carry: null }));
      setPercyLook(null);
      setPercyMode("idle");
      ctx.dead = true;
      await wait(3000);
      setRun((rr) => (rr && rr.plan.eventId === show.eventId ? null : rr));
    } catch {
      ctx.dead = true;
    }
  }

  return (
    <LiveCtx.Provider
      value={{
        run,
        cursor,
        highlight,
        note,
        showWorking,
        setShowWorking,
        takeOver,
      }}
    >
      {children}
      <LiveOverlay />
    </LiveCtx.Provider>
  );
}

function mark(steps: StepStatus[], i: number, st: StepStatus): StepStatus[] {
  const next = steps.slice();
  next[i] = st;
  return next;
}

// ── the on-screen overlay: frame, cursor, carry card, highlight ─────────────
function LiveOverlay() {
  const { run, cursor, highlight, note, takeOver } = useLive();
  const active = run?.status === "running";
  const step = run ? run.plan.steps[run.i] : null;

  return (
    <>
      {active && (
        <>
          {/* frame */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              pointerEvents: "none",
              border: "3px solid var(--accent)",
              boxShadow:
                "inset 0 0 90px color-mix(in oklch, var(--accent) 20%, transparent)",
            }}
          />
          {/* strip */}
          <div
            style={{
              position: "fixed",
              top: 46,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 84,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 8px 8px 14px",
              borderRadius: 999,
              background: "var(--glass, rgba(20,20,20,0.9))",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
              fontSize: 12.5,
              color: "var(--ink)",
              backdropFilter: "blur(16px)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
                flex: "none",
              }}
            />
            <span>
              Percy is working on your screen
              {note ? ` · ${note}` : step ? ` · ${step.label}` : ""}
            </span>
            <button
              type="button"
              onClick={takeOver}
              style={{
                border: "1px solid var(--line)",
                background: "var(--surf2)",
                color: "var(--ink)",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              take over · esc
            </button>
          </div>
        </>
      )}

      {/* highlight box over the found row */}
      {active && highlight && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: highlight.x - 4,
            top: highlight.y - 4,
            width: highlight.w + 8,
            height: highlight.h + 8,
            zIndex: 83,
            pointerEvents: "none",
            borderRadius: 8,
            border: "2px solid var(--accent)",
            boxShadow:
              "0 0 0 4px color-mix(in oklch, var(--accent) 22%, transparent)",
            transition:
              "left .3s ease, top .3s ease, width .3s ease, height .3s ease",
          }}
        />
      )}

      {/* the cursor + Percy tag */}
      {active && cursor.vis && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: cursor.x,
            top: cursor.y,
            zIndex: 86,
            pointerEvents: "none",
            transition: `left ${cursor.ms}ms cubic-bezier(.6,.02,.22,1), top ${cursor.ms}ms cubic-bezier(.6,.02,.22,1)`,
          }}
        >
          <svg width="27" height="32" viewBox="0 0 27 32" aria-hidden="true">
            <path
              d="M4 3 L4 26 L10 20.5 L14.2 29.5 L18.6 27.6 L14.5 18.8 L23 18.8 Z"
              fill="var(--accent)"
              stroke="#0c0c0c"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px 3px 3px",
              borderRadius: 999,
              background: "var(--accent)",
              color: "var(--onacc, #0c0c0c)",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                overflow: "hidden",
                flex: "none",
              }}
            >
              <PercyAvatar mode="working" />
            </span>
            Percy
          </div>
          {cursor.carry && (
            <div
              style={{
                position: "absolute",
                left: 22,
                top: 50,
                width: 220,
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--surf)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
                fontSize: 11.5,
                color: "var(--ink)",
              }}
            >
              {cursor.carry}
            </div>
          )}
        </div>
      )}
    </>
  );
}
