"use client";

import { useEffect, useState } from "react";
import type { OfficeAgent } from "./ConstellationPanel";

// The office centrepiece: a top-down pixel floor (public/office/floor.svg, a
// 680×616 six-room grid) with one small character per room. A DEPLOYED agent is
// drawn in colour and — while it is working — wanders around its room; an agent
// that isn't deployed yet is greyed-out and stands still. Running sub-agents pop
// in as little robots in their parent's room and wander too. All motion is pure
// CSS transitions retargeted on a per-character timer, so it costs nothing on the
// server and respects prefers-reduced-motion.

// The floor SVG is cropped to its content (viewBox "24 24 632 576"), so the
// container maps to that region — offset the room coords by the crop origin.
const FLOOR_X0 = 24;
const FLOOR_Y0 = 24;
const FLOOR_W = 632;
const FLOOR_H = 576;

type Rect = [x: number, y: number, w: number, h: number]; // viewBox units

export type Desk = {
  id: string;
  label: string;
  room: string;
  avatar: string;
  room_rect: Rect;
  w: number; // avatar width as % of the floor width
};

// One desk per room-floor rect (pulled straight from the SVG), mapped to its
// agent. research→scout · dev→fixer · marketing→muse · outreach→hunter ·
// chief-of-staff→chief · proposals→scribe.
export const OFFICE_DESKS: Desk[] = [
  {
    id: "scout",
    label: "Scout",
    room: "research",
    avatar: "/office/agents/scout.svg",
    room_rect: [24, 24, 200, 196],
    w: 5.4,
  },
  {
    id: "fixer",
    label: "Fixer",
    room: "dev & debugging",
    avatar: "/office/agents/fixer.svg",
    room_rect: [232, 24, 216, 196],
    w: 5.6,
  },
  {
    id: "muse",
    label: "Muse",
    room: "marketing studio",
    avatar: "/office/agents/muse.svg",
    room_rect: [456, 24, 200, 196],
    w: 5.4,
  },
  {
    id: "hunter",
    label: "Hunter",
    room: "outreach & sales",
    avatar: "/office/agents/hunter.svg",
    room_rect: [24, 276, 200, 204],
    w: 5.6,
  },
  {
    id: "chief",
    label: "Chief",
    room: "chief of staff",
    avatar: "/office/agents/chief.svg",
    room_rect: [232, 276, 216, 204],
    w: 5.8,
  },
  {
    id: "scribe",
    label: "Scribe",
    room: "proposals & clients",
    avatar: "/office/agents/scribe.svg",
    room_rect: [456, 276, 200, 204],
    w: 5.6,
  },
];

const DESK_BY_ID: Record<string, Desk> = Object.fromEntries(
  OFFICE_DESKS.map((d) => [d.id, d]),
);

// A running sub-agent to place on the stage (in its parent's room).
export type StageSub = { id: string; parentId: string; label: string };

// ── walk maths ────────────────────────────────────────────────────────────────

// deterministic [0,1) hash so a character's path is stable across React renders
// (no stored positions to reconcile) yet varies per id + step.
function rand(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

type Pt = { x: number; y: number }; // % of the floor box

// a wander target inside a room rect, inset so the character stays off the walls
function wander(id: string, step: number, rect: Rect): Pt {
  const [rx, ry, rw, rh] = rect;
  const ix = 22; // horizontal inset (viewBox units)
  const iy = 26; // vertical inset (leaves room for the sprite's height)
  const x = rx + ix + rand(`${id}|${step}|x`) * Math.max(0, rw - 2 * ix);
  const y = ry + iy + rand(`${id}|${step}|y`) * Math.max(0, rh - 2 * iy);
  return {
    x: ((x - FLOOR_X0) / FLOOR_W) * 100,
    y: ((y - FLOOR_Y0) / FLOOR_H) * 100,
  };
}

// each character keeps its own retarget timer so the room doesn't move in
// lockstep; paused entirely when idle or when the user prefers reduced motion.
function useSteps(active: boolean, id: string): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const period = 2200 + rand(`${id}|period`) * 1800; // 2.2–4.0s, per-character
    const t = setInterval(() => setStep((v) => v + 1), period);
    return () => clearInterval(t);
  }, [active, id]);
  return step;
}

// ── a single wandering character (agent or sub-agent) ────────────────────────

function Walker({
  id,
  rect,
  moving,
  children,
}: {
  id: string;
  rect: Rect;
  moving: boolean;
  children: (pos: Pt, faceLeft: boolean, secs: number) => React.ReactNode;
}) {
  const step = useSteps(moving, id);
  const home = wander(id, 0, rect);
  if (!moving) return <>{children(home, false, 0)}</>;
  const cur = wander(id, step, rect);
  const prev = wander(id, step - 1, rect);
  const dist = Math.hypot(cur.x - prev.x, cur.y - prev.y);
  const secs = Math.min(2.6, Math.max(0.7, dist * 0.12)); // ~constant speed
  const faceLeft = cur.x < prev.x - 0.01;
  return <>{children(cur, faceLeft, secs)}</>;
}

// ── markers ───────────────────────────────────────────────────────────────────

function AgentMarker({
  desk,
  live,
  onSelect,
}: {
  desk: Desk;
  live?: OfficeAgent;
  onSelect: (id: string) => void;
}) {
  const active = !!live;
  const status = live?.netStatus ?? "idle";
  const moving = status === "working";
  const cls = `wf-of-desk ${active ? "is-live" : "is-soon"} is-${status}`;

  return (
    <Walker id={desk.id} rect={desk.room_rect} moving={active && moving}>
      {(pos, faceLeft, secs) => {
        const style = {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: `${desk.w}%`,
          transitionDuration: `${secs}s`,
        } as React.CSSProperties;
        const body = (
          <>
            <span className="wf-of-avatar-wrap">
              {/* biome-ignore lint/performance/noImgElement: static sprite in /public */}
              <img
                className={`wf-of-avatar${moving ? " is-walking" : ""}${faceLeft ? " face-left" : ""}`}
                src={desk.avatar}
                alt=""
                draggable={false}
              />
              {active && live.pending > 0 && (
                <span className="wf-of-speech" aria-label={`${live.pending} waiting on you`}>
                  {live.pending}
                </span>
              )}
            </span>
            <span className="wf-of-plate">
              <span className="wf-of-plate-name">
                {live?.name ?? desk.label}
              </span>
              <span className="wf-of-plate-status">
                {active ? live.statusLabel : "soon"}
              </span>
            </span>
          </>
        );
        if (!active)
          return (
            <div className={cls} style={style} title={`${desk.label} — soon`}>
              {body}
            </div>
          );
        return (
          <button
            type="button"
            className={cls}
            style={style}
            onClick={() => onSelect(desk.id)}
            title={`${live.name} · ${live.statusLabel}`}
          >
            {body}
          </button>
        );
      }}
    </Walker>
  );
}

function SubMarker({ sub }: { sub: StageSub }) {
  const desk = DESK_BY_ID[sub.parentId];
  if (!desk) return null;
  const src = `/office/subagents/subagent_${sub.parentId}.svg`;
  return (
    <Walker id={`sub-${sub.id}`} rect={desk.room_rect} moving>
      {(pos, faceLeft, secs) => (
        <div
          className="wf-of-desk wf-of-subagent"
          style={
            {
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${desk.w * 0.72}%`,
              transitionDuration: `${secs}s`,
            } as React.CSSProperties
          }
          title={sub.label}
        >
          <span className="wf-of-avatar-wrap">
            {/* biome-ignore lint/performance/noImgElement: static sprite in /public */}
            <img
              className={`wf-of-avatar is-walking${faceLeft ? " face-left" : ""}`}
              src={src}
              alt=""
              draggable={false}
            />
          </span>
        </div>
      )}
    </Walker>
  );
}

export function OfficeFloor({
  live,
  subs,
  onSelect,
}: {
  live: Record<string, OfficeAgent | undefined>;
  subs: StageSub[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="wf-of-floor">
      {/* biome-ignore lint/performance/noImgElement: static illustration in /public */}
      <img
        className="wf-of-floor-img"
        src="/office/floor.svg"
        alt="the office floor plan"
        draggable={false}
      />
      {OFFICE_DESKS.map((d) => (
        <AgentMarker
          key={d.id}
          desk={d}
          live={live[d.id]}
          onSelect={onSelect}
        />
      ))}
      {subs.map((s) => (
        <SubMarker key={s.id} sub={s} />
      ))}
    </div>
  );
}
