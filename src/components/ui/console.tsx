import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Console primitives — restrained echoes of the product dashboard's
 * "operational console" language, adapted for the editorial marketing site.
 * All are pure, server-safe SVG/markup (no hooks) so they render in server
 * components. They inherit `currentColor` / brand tokens so the same markup
 * re-tints under the GYST theme with no extra wiring. Purely decorative
 * indicators are marked aria-hidden.
 */

/**
 * ConsoleLabel — the dashboard's signature "// SECTION" mono over-line. Quieter
 * and more instrument-like than the aperture `.kicker`; pair it above a display
 * headline where the section should read as live/operational.
 */
export function ConsoleLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("console-label", className)}>{children}</span>;
}

/**
 * LiveTag — a pill with a pulsing status dot. `tone` swaps the dot semantics
 * (defaults to the accent "live"). Used on hero breadcrumbs and project cards.
 */
export function LiveTag({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn("chip", className)}
      style={{ color: "var(--accent-ink)" }}
    >
      <span className="live-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * Sparkline — a tiny inline trend line drawn from a value series. Deterministic
 * (no animation) so it's SSR-stable; reads as a live micro-metric. `values` are
 * normalised to the box automatically.
 */
export function Sparkline({
  values,
  width = 72,
  height = 22,
  className,
  strokeWidth = 1.5,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={lastX} cy={lastY} r={strokeWidth + 0.5} fill="currentColor" />
    </svg>
  );
}

/**
 * Waveform — a static bar-equaliser glyph reading as "listening / processing".
 * Heights come from a fixed seed so it's SSR-stable; the CSS `.wave-bar`
 * animation (gated by reduced-motion) gives it life when animate is set.
 */
const WAVE_SEED = [0.4, 0.7, 0.45, 0.9, 0.55, 0.75, 0.35, 0.8, 0.5, 0.65];

export function Waveform({
  bars = 10,
  height = 20,
  className,
  animate = false,
}: {
  bars?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}) {
  const barW = 2;
  const gap = 2;
  const width = bars * barW + (bars - 1) * gap;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const h = Math.max(2, WAVE_SEED[i % WAVE_SEED.length] * height);
        const x = i * (barW + gap);
        const y = (height - h) / 2;
        return (
          <rect
            key={`wave-${i}-${Math.round(h)}`}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={1}
            fill="currentColor"
            className={animate ? "wave-bar" : undefined}
            style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}
