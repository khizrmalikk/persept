"use client";

import { useEffect, useRef, useState } from "react";
import { useOS } from "./os-store";

// v3 §3 boot screen. Full-screen #0c0c0c, centred logo + wordmark, a 240×3
// progress bar in --accent, then the last five start-up lines streaming one
// every ~190ms (current line --ink, earlier lines #85847d). The whole thing
// fades out over 0.45s once the lines finish (~2.2s total).
//
// It shows on FIRST load only: a sessionStorage flag skips it on repeat visits
// in the same tab session. It is skipped entirely when ?embed=1 is present (the
// landing iframe) and jumps straight to done under prefers-reduced-motion. In
// production the lines would be driven by the real bridge health check; here
// they're the canonical sequence from the spec.

const LINES = [
  "mounting /knowledge · 41 files",
  "connecting bridge · vps-dxb-01",
  "chief.runner started",
  "scout.runner started",
  "hunter.runner started",
  "scribe.runner started",
  "muse.runner started",
  "fixer.runner started",
  "approvals locked to you",
];
const STEP_MS = 190;
const FADE_MS = 450;

export function BootScreen() {
  const os = useOS();
  // how many lines have appeared (0..LINES.length); -1 = fading out
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);
  const timers = useRef<number[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: boot runs once on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const embed = q.get("embed") === "1";
    const seen = window.sessionStorage.getItem("os-booted") === "1";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // skip conditions → mark booted and end immediately, no sequence
    if (embed || seen || reduced) {
      window.sessionStorage.setItem("os-booted", "1");
      os.endBoot();
      return;
    }

    window.sessionStorage.setItem("os-booted", "1");

    // stream the lines, then trigger the fade, then end
    const push = (n: number) => {
      timers.current.push(window.setTimeout(() => setShown(n), n * STEP_MS));
    };
    for (let n = 1; n <= LINES.length; n++) push(n);

    // begin the fade after the last line has been on screen a beat
    const fadeAt = (LINES.length + 1) * STEP_MS;
    timers.current.push(window.setTimeout(() => setFading(true), fadeAt));
    timers.current.push(
      window.setTimeout(() => os.endBoot(), fadeAt + FADE_MS),
    );

    const t = timers.current;
    return () => {
      for (const id of t) window.clearTimeout(id);
    };
  }, []);

  // the last five lines, oldest first; the final visible line is "current"
  const visible = LINES.slice(0, shown).slice(-5);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        background: "#0c0c0c",
        color: "#ecebe5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <svg width="56" height="59" viewBox="10.31 8 79.38 84" aria-hidden="true">
        <path
          d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
          style={{ fill: "var(--accent)" }}
        />
        <path
          fillRule="evenodd"
          d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
          style={{ fill: "var(--accent)" }}
        />
      </svg>
      <span
        className="os-display"
        style={{
          fontWeight: 800,
          fontSize: 42,
          letterSpacing: "-0.05em",
          marginTop: 22,
          lineHeight: 1,
        }}
      >
        persept
      </span>
      <div
        style={{
          width: 240,
          height: 3,
          borderRadius: 2,
          background: "rgba(255,255,255,0.1)",
          marginTop: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (shown / LINES.length) * 100)}%`,
            background: "var(--accent)",
            transition: "width 0.19s linear",
          }}
        />
      </div>
      <div
        style={{
          height: 120,
          marginTop: 22,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#85847d",
        }}
      >
        {visible.map((t, i) => (
          <span
            key={t}
            style={{
              color: i === visible.length - 1 ? "#ecebe5" : "#85847d",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
