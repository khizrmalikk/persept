// Live "system is watching" waveform for the office identity card. When the
// bridge is live the bars animate (an operational monitoring readout); when it's
// stale the wave flatlines and the label reads "degraded". Pure CSS animation —
// no state, no timers — and it freezes under prefers-reduced-motion (see the
// .wf-wave rules in workforce.css). Bar heights are a deterministic standing wave
// (no Math.random) so server and client render identically.

// Fixed, non-reordering set of bars — a stable key per position keeps the
// waveform's staggered animation from resetting and satisfies noArrayIndexKey.
const BARS = Array.from({ length: 34 }, (_, i) => `wave-bar-${i}`);

export function MonitorWave({ active }: { active: boolean }) {
  return (
    <div className={`wf-monitor ${active ? "live" : "degraded"}`}>
      <span className="wf-monitor-label">
        <span className="dot" aria-hidden="true" />
        {active ? "monitoring" : "degraded"}
      </span>
      <div className="wf-wave" aria-hidden="true">
        {BARS.map((key, i) => (
          <i
            key={key}
            style={{
              // staggered so the crest travels along the strip
              animationDelay: `${(i * 0.055).toFixed(3)}s`,
              // resting silhouette: a gentle standing wave
              height: `${(30 + 60 * Math.abs(Math.sin(i * 0.55))).toFixed(0)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
