// Hand-rolled inline-SVG chart primitives for the workforce dashboard.
// No chart library is installed (by design) — these are small, on-palette, and
// server-renderable (no "use client", no hooks). Colours come from CSS tokens
// via currentColor / the --ink|--accent|--ok tints already scoped under .wf.
//
// All charts degrade gracefully on empty data (render an axis / "no data" note).

import type { JSX } from "react";

// ---------------------------------------------------------------------------
// Sparkline — a tiny line for a table cell or card. `values` oldest→newest.
// ---------------------------------------------------------------------------

export function Sparkline({
  values,
  width = 88,
  height = 24,
  stroke = "var(--accent)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}): JSX.Element {
  const n = values.length;
  const max = Math.max(1, ...values);
  const pad = 1.5;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts =
    n <= 1
      ? [`${pad},${height - pad}`]
      : values.map((v, i) => {
          const x = pad + (i / (n - 1)) * w;
          const y = pad + (1 - v / max) * h;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
  const line = pts.join(" ");
  const area = `${pad},${height - pad} ${line} ${pad + w},${height - pad}`;
  const flat = values.every((v) => v === 0);
  return (
    <span
      className="spark"
      style={{ width, height }}
      role="img"
      aria-label={`activity trend, ${values.reduce((s, v) => s + v, 0)} events`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <title>activity trend</title>
        {!flat && (
          <polygon
            points={area}
            fill={stroke}
            fillOpacity={0.12}
            stroke="none"
          />
        )}
        <polyline
          points={line}
          fill="none"
          stroke={flat ? "var(--line-strong)" : stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ThroughputChart — grouped bars (events + runs) over time buckets, plus an
// area line for events. `buckets` oldest→newest.
// ---------------------------------------------------------------------------

type Bucket = { label: string; events: number; runs: number };

export function ThroughputChart({
  buckets,
}: {
  buckets: Bucket[];
}): JSX.Element {
  const width = 720;
  const height = 220;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const iw = width - padL - padR;
  const ih = height - padT - padB;
  const n = buckets.length;
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.events, b.runs)));

  if (n === 0) {
    return <div className="empty">no data in this window</div>;
  }

  const slot = iw / n;
  const barGap = Math.min(6, slot * 0.12);
  const barW = Math.max(2, (slot - barGap * 3) / 2);

  const x = (i: number) => padL + i * slot;
  const y = (v: number) => padT + (1 - v / max) * ih;

  // gridlines at 0, 50%, 100%
  const grid = [0, 0.5, 1];

  // events area line (centred over each slot)
  const cx = (i: number) => x(i) + slot / 2;
  const linePts = buckets.map(
    (b, i) => `${cx(i).toFixed(1)},${y(b.events).toFixed(1)}`,
  );

  // only label a subset of x ticks to avoid crowding
  const tickEvery = n > 12 ? Math.ceil(n / 8) : 1;

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="throughput over time"
      >
        <title>throughput over time</title>
        {grid.map((g) => {
          const gy = padT + g * ih;
          return (
            <g key={g}>
              <line
                x1={padL}
                y1={gy}
                x2={width - padR}
                y2={gy}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={gy + 3}
                textAnchor="end"
                className="axis-label"
              >
                {Math.round(max * (1 - g))}
              </text>
            </g>
          );
        })}
        {buckets.map((b, i) => {
          const bx = x(i) + barGap;
          return (
            <g key={`${b.label}-${i}`}>
              <rect
                x={bx}
                y={y(b.runs)}
                width={barW}
                height={padT + ih - y(b.runs)}
                rx={2}
                fill="var(--ink)"
                fillOpacity={0.22}
              />
              <rect
                x={bx + barW + barGap}
                y={y(b.events)}
                width={barW}
                height={padT + ih - y(b.events)}
                rx={2}
                fill="var(--accent)"
                fillOpacity={0.85}
              />
              {i % tickEvery === 0 && (
                <text
                  x={cx(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className="axis-label"
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
        <polyline
          points={linePts.join(" ")}
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut — a single-ratio ring with a big % in the centre. `value` is 0..1.
// ---------------------------------------------------------------------------

export function Donut({
  value,
  size = 132,
  label = "approved",
}: {
  value: number | null;
  size?: number;
  label?: string;
}): JSX.Element {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value));
  const dash = c * pct;
  const display = value === null ? "—" : `${Math.round(pct * 100)}%`;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-label={`${label} ${display}`}
        role="img"
      >
        <title>{`${label} ${display}`}</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--paper-3)"
          strokeWidth={stroke}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="center">
        <div className="big">{display}</div>
        <div className="lbl">{label}</div>
      </div>
    </div>
  );
}
