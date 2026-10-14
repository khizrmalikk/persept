"use client";

import { type CSSProperties, useEffect, useState } from "react";

// Persept OS agent avatars: a simple shape with a neutral face on a dark disc of
// the agent's own hue — no humans, no robots, no emoji. Ported from the handoff's
// Persona.dc.html: static shapes + the per-role "working" tool animation (baton,
// binoculars, dart, pen, pencil, wrench) which plays only while the agent is
// working, so it doubles as a status signal. Gated by size >= 28 and by
// prefers-reduced-motion; ?demo=working forces every avatar on for checking.

export type AgentKey =
  | "chief"
  | "scout"
  | "hunter"
  | "scribe"
  | "muse"
  | "fixer"
  | "you";
export type PersonaStatus = "working" | "waiting" | "idle" | "soon" | "";

const HUE: Record<Exclude<AgentKey, "you">, number> = {
  chief: 75,
  scout: 32,
  hunter: 150,
  scribe: 225,
  muse: 112,
  fixer: 290,
};
const DOT: Record<Exclude<PersonaStatus, "">, string> = {
  working: "oklch(0.72 0.17 150)",
  waiting: "oklch(0.8 0.14 70)",
  idle: "#6f6a62",
  soon: "#3a3631",
};
const FACE = "#1d1a17";
const GOLD = "#f6f1e8";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}
function useDemoWorking() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    setDemo(
      new URLSearchParams(window.location.search).get("demo") === "working",
    );
  }, []);
  return demo;
}

export function Persona({
  agent,
  size = 32,
  ring = false,
  status = "",
  working,
  style,
  className,
}: {
  agent: AgentKey;
  size?: number;
  ring?: boolean;
  status?: PersonaStatus;
  working?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const demo = useDemoWorking();
  const isYou = agent === "you";
  const isWorking = !isYou && (demo || working || status === "working");
  // animate the tool only when working, big enough, and motion is allowed
  const anim = isWorking && size >= 28 && !reduced;

  const h = isYou ? 70 : HUE[agent];
  const fg = `oklch(0.8 0.13 ${h})`;
  const fold = `oklch(0.64 0.12 ${h})`;
  const bg = isYou ? "oklch(0.8 0.14 70)" : `oklch(0.34 0.07 ${h})`;
  const ringShadow = ring
    ? `0 0 0 ${Math.max(2, size / 20)}px var(--surf, #151311), 0 0 0 ${Math.max(
        3.5,
        size / 12,
      )}px ${fg}`
    : "none";

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flex: "none",
        position: "relative",
        boxShadow: ringShadow,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <rect width="64" height="64" fill={bg} />

        {isYou && (
          <>
            <circle cx="32" cy="27" r="10" fill="#2a2622" />
            <path
              d="M12 64 C13 50 22 43 32 43 C42 43 51 50 52 64 Z"
              fill="#2a2622"
            />
            <text
              x="32"
              y="31.5"
              textAnchor="middle"
              fontFamily="Archivo, sans-serif"
              fontWeight="800"
              fontSize="12"
              fill="#f4f1ec"
            >
              K
            </text>
          </>
        )}

        {agent === "chief" && (
          <>
            <rect x="13" y="14" width="38" height="38" rx="13" fill={fg} />
            <circle cx="25.5" cy="31" r="2.4" fill={FACE} />
            <circle cx="38.5" cy="31" r="2.4" fill={FACE} />
            <path
              d="M29 40 h6"
              stroke={FACE}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            {anim && (
              <>
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="-28 46 47;18 46 47;-8 46 47;18 46 47;-28 46 47"
                    dur="2s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"
                  />
                  <path
                    d="M46 47 L57 28"
                    stroke={FACE}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M46 47 L49.5 41"
                    stroke={GOLD}
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />
                </g>
                <g fill={GOLD}>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 6;0 -4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <circle cx="13" cy="15" r="2" />
                    <path
                      d="M14.8 15 V8.5 l3 1.6"
                      stroke={GOLD}
                      strokeWidth="1.3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 6;0 -4"
                      dur="2s"
                      begin="1s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      dur="2s"
                      begin="1s"
                      repeatCount="indefinite"
                    />
                    <circle cx="21" cy="11" r="1.7" />
                    <path
                      d="M22.5 11 V5.5"
                      stroke={GOLD}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              </>
            )}
          </>
        )}

        {agent === "scout" && (
          <>
            <circle cx="32" cy="33" r="19.5" fill={fg} />
            <circle cx="26.5" cy="30" r="2.4" fill={FACE} />
            <circle cx="37.5" cy="30" r="2.4" fill={FACE} />
            <path
              d="M29 39.5 h6"
              stroke={FACE}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            {anim && (
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 30;0 0;-2.2 0;2.2 0;0 0;0 30"
                  keyTimes="0;0.14;0.4;0.7;0.86;1"
                  dur="4.6s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines=".2 0 .2 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.6 0 .8 1"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.9;1"
                  dur="4.6s"
                  repeatCount="indefinite"
                />
                <rect
                  x="19"
                  y="23.5"
                  width="11"
                  height="13"
                  rx="4.5"
                  fill={FACE}
                />
                <rect
                  x="34"
                  y="23.5"
                  width="11"
                  height="13"
                  rx="4.5"
                  fill={FACE}
                />
                <rect
                  x="28.5"
                  y="26.5"
                  width="7"
                  height="5"
                  rx="1.5"
                  fill={FACE}
                />
                <circle cx="24.5" cy="30" r="3.4" fill="oklch(0.55 0.08 230)" />
                <circle cx="39.5" cy="30" r="3.4" fill="oklch(0.55 0.08 230)" />
                <circle
                  cx="23.3"
                  cy="28.8"
                  r="1.1"
                  fill="#ffffff"
                  fillOpacity="0.85"
                />
                <circle
                  cx="38.3"
                  cy="28.8"
                  r="1.1"
                  fill="#ffffff"
                  fillOpacity="0.85"
                />
                <path
                  d="M20 47 L26 37 M44 47 L38 37"
                  stroke={FACE}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>
            )}
          </>
        )}

        {agent === "hunter" && (
          <>
            <path
              d="M32 11 L53 50 H11 Z"
              fill={fg}
              stroke={fg}
              strokeWidth="7"
              strokeLinejoin="round"
            />
            <circle cx="27.6" cy="37.4" r="2.4" fill={FACE} />
            <circle cx="36.4" cy="37.4" r="2.4" fill={FACE} />
            <path
              d="M29 44 h6"
              stroke={FACE}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            {anim && (
              <>
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0;0 0;1.2 -0.8;-0.6 0.4;0 0;0 0"
                    keyTimes="0;0.34;0.39;0.45;0.52;1"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <circle cx="49" cy="16" r="7" fill={GOLD} />
                  <circle cx="49" cy="16" r="4.6" fill="oklch(0.62 0.18 28)" />
                  <circle cx="49" cy="16" r="2.4" fill={GOLD} />
                  <circle cx="49" cy="16" r="1" fill="oklch(0.62 0.18 28)" />
                </g>
                <g>
                  <animateMotion
                    dur="1.8s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="M4 46 Q22 18 47.6 17.2"
                    keyPoints="0;1;1"
                    keyTimes="0;0.36;1"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;1;0"
                    keyTimes="0;0.05;0.36;0.85;1"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <path
                    d="M-9 0 H0"
                    stroke={FACE}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path d="M0 0 l-2.6 -1.6 v3.2 z" fill={FACE} />
                  <path
                    d="M-9 0 l-3 -3 M-9 0 l-3 3"
                    stroke="oklch(0.62 0.18 28)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              </>
            )}
          </>
        )}

        {agent === "scribe" && (
          <>
            <path
              d="M19 11 H38 L46 19 V48 a5 5 0 0 1 -5 5 H19 a5 5 0 0 1 -5 -5 V16 a5 5 0 0 1 5 -5 Z"
              fill={fg}
            />
            <path d="M38 11 V16 a3 3 0 0 0 3 3 H46" fill={fold} />
            <circle cx="25" cy="27.5" r="2.3" fill={FACE} />
            <circle cx="35" cy="27.5" r="2.3" fill={FACE} />
            <path
              d="M27.5 34.5 h5"
              stroke={FACE}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {!anim && (
              <path
                d="M20 42 h14 M20 46.5 h9"
                stroke={FACE}
                strokeOpacity="0.3"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
            {anim && (
              <>
                <path
                  d="M20 42 h19"
                  stroke={FACE}
                  strokeOpacity="0.6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="19 19"
                  strokeDashoffset="19"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="19;0;0;19"
                    keyTimes="0;0.4;0.92;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M20 46.5 h11"
                  stroke={FACE}
                  strokeOpacity="0.6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="11 11"
                  strokeDashoffset="11"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="11;11;0;0;11"
                    keyTimes="0;0.42;0.65;0.92;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </path>
                <g>
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path="M20 42 H39 M20 46.5 H31"
                    keyPoints="0;0.63;0.64;1;1"
                    keyTimes="0;0.4;0.42;0.65;1"
                    calcMode="linear"
                  />
                  <path
                    d="M3 -4.5 L13 -17"
                    stroke={FACE}
                    strokeWidth="4.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5.2 -7.3 L7.4 -10"
                    stroke="oklch(0.84 0.14 90)"
                    strokeWidth="4.6"
                  />
                  <path d="M0 0 L1 -5.6 L4.6 -3 Z" fill="oklch(0.84 0.14 90)" />
                </g>
              </>
            )}
          </>
        )}

        {agent === "muse" && (
          <>
            <g fill={fg}>
              <circle cx="32" cy="18.5" r="9.5" />
              <circle cx="44.6" cy="27.6" r="9.5" />
              <circle cx="39.8" cy="42.4" r="9.5" />
              <circle cx="24.2" cy="42.4" r="9.5" />
              <circle cx="19.4" cy="27.6" r="9.5" />
              <circle cx="32" cy="32" r="13" />
            </g>
            <circle cx="27" cy="31" r="2.3" fill={FACE} />
            <circle cx="37" cy="31" r="2.3" fill={FACE} />
            <path
              d="M29.5 38.5 h5"
              stroke={FACE}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {anim && (
              <>
                <path
                  d="M15 8 L16.8 13.2 L22 15 L16.8 16.8 L15 22 L13.2 16.8 L8 15 L13.2 13.2 Z"
                  fill="none"
                  stroke={FACE}
                  strokeWidth="3.4"
                  strokeLinejoin="round"
                  pathLength="1"
                  strokeDasharray="1 1"
                  strokeDashoffset="1"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="1;0;0;1"
                    keyTimes="0;0.6;0.9;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M15 8 L16.8 13.2 L22 15 L16.8 16.8 L15 22 L13.2 16.8 L8 15 L13.2 13.2 Z"
                  fill="none"
                  stroke={GOLD}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  pathLength="1"
                  strokeDasharray="1 1"
                  strokeDashoffset="1"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="1;0;0;1"
                    keyTimes="0;0.6;0.9;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </path>
                <g>
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path="M15 8 L16.8 13.2 L22 15 L16.8 16.8 L15 22 L13.2 16.8 L8 15 L13.2 13.2 Z"
                    keyPoints="0;1;1;0"
                    keyTimes="0;0.6;0.9;1"
                    calcMode="linear"
                  />
                  <path
                    d="M2 -2.6 L9 -11.6"
                    stroke="oklch(0.85 0.15 88)"
                    strokeWidth="4"
                  />
                  <path
                    d="M9 -11.6 L10.6 -13.6"
                    stroke="oklch(0.74 0.12 10)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path d="M0 0 L0.4 -4 L3.6 -1.6 Z" fill="#e8d6b8" />
                  <path d="M0 0 L0.15 -1.4 L1.25 -0.6 Z" fill={FACE} />
                </g>
              </>
            )}
          </>
        )}

        {agent === "fixer" && (
          <>
            <path
              d="M32 11 L50.5 21.5 V42.5 L32 53 L13.5 42.5 V21.5 Z"
              fill={fg}
              stroke={fg}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <rect x="22.8" y="28.6" width="5" height="5" rx="1.3" fill={FACE} />
            <rect x="36.2" y="28.6" width="5" height="5" rx="1.3" fill={FACE} />
            <path
              d="M28.5 40.5 h7"
              stroke={FACE}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            {anim && (
              <>
                <path
                  d="M49.5 49.5 l2.6 1.5 v3 l-2.6 1.5 -2.6 -1.5 v-3 z"
                  fill={FACE}
                />
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="-30 49.5 52.5;12 49.5 52.5;-30 49.5 52.5"
                    dur="0.9s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines=".5 0 .2 1;.5 0 .5 1"
                  />
                  <path
                    d="M49.5 52.5 L58.5 39.5"
                    stroke="#d9d2c5"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="49.5" cy="52.5" r="5" fill="#d9d2c5" />
                  <path
                    d="M49.5 50 l2.2 1.25 v2.5 l-2.2 1.25 -2.2 -1.25 v-2.5 z"
                    fill={FACE}
                  />
                </g>
                <g
                  stroke="oklch(0.88 0.15 90)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="opacity"
                    values="0;0;1;0;0"
                    keyTimes="0;0.42;0.5;0.62;1"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                  <path d="M42 49 l-3 -1.5 M42.5 53 l-3.4 0.6 M44 45.5 l-2 -2.6" />
                </g>
              </>
            )}
          </>
        )}
      </svg>

      {/* working ring pulse (static under reduced motion, still shows "working") */}
      {isWorking && size >= 28 && (
        <span
          className={reduced ? undefined : "os-ring-pulse"}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: `0 0 0 2px ${DOT.working}`,
            opacity: reduced ? 0.4 : undefined,
            pointerEvents: "none",
          }}
        />
      )}

      {status && (
        <span
          style={{
            position: "absolute",
            right: "3%",
            bottom: "3%",
            width: "28%",
            height: "28%",
            borderRadius: "50%",
            background: DOT[status],
            border: "2px solid var(--surf, #151311)",
          }}
        />
      )}
    </div>
  );
}
