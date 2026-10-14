"use client";

import type { OSAgent, OSVps } from "../_data/agents";
import { AGENT_HUE_VAR } from "../_data/windows";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// v3 §5 system monitor: a 450px popover opened from the status item, the persept
// menu or the agents menu. Four stat tiles (fed from the single vps_metrics row),
// a cpu line-chart placeholder, a process table (one row per agent runner plus
// `bridge`/`postgres`), and a spend/uptime footer. Clicking an agent row opens
// that agent's page; the system rows open dev. Shows "—" wherever vps is null.

const DOT: Record<string, string> = {
  working: "var(--dot-working)",
  waiting: "var(--dot-waiting)",
  idle: "var(--dot-idle)",
  soon: "var(--dot-soon)",
};

// uptime seconds → "41d 6h" / "6h 12m" / "12m"
function fmtUptime(s: number): string {
  if (s <= 0) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemMonitor({
  agents,
  vps,
}: {
  agents: OSAgent[];
  vps: OSVps | null;
}) {
  const os = useOS();
  if (!os.monitorOpen) return null;

  // vps_metrics stores memory + disk in BYTES; show gb (÷1e9) like a monitor.
  const gb = (bytes: number) => bytes / 1e9;
  const cpu = vps ? `${vps.cpuPct}%` : "—";
  const mem = vps ? `${gb(vps.memUsed).toFixed(1)}` : "—";
  const memTotal = vps ? `of ${gb(vps.memTotal).toFixed(0)} gb` : "of 8 gb";
  const diskPct =
    vps && vps.diskTotal > 0
      ? `${Math.round((vps.diskUsed / vps.diskTotal) * 100)}%`
      : "—";
  const diskDetail = vps
    ? `${gb(vps.diskUsed).toFixed(0)} of ${gb(vps.diskTotal).toFixed(0)} gb`
    : "— of 160 gb";
  const uptime = vps ? fmtUptime(vps.uptimeS) : "—";
  const monthSpend = vps ? vps.monthSpend.toFixed(2) : "—";
  const budget = vps?.budgetUsd != null ? vps.budgetUsd : 77;

  return (
    <>
      {/* click-away: closes the popover */}
      <button
        type="button"
        aria-label="close system monitor"
        onClick={os.closeMonitor}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          background: "transparent",
          border: "none",
          cursor: "default",
        }}
      />
      <section className="os-monitor" aria-label="system monitor">
        {/* title */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 14,
          }}
        >
          <span
            className="os-display"
            style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}
          >
            system monitor
          </span>
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
            vps-dxb-01 · dubai
          </span>
        </div>

        {/* four stat tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          <StatTile label="cpu" value={cpu} detail="4 vcpu" />
          <StatTile label="memory" value={mem} detail={memTotal} />
          <StatTile label="disk" value={diskPct} detail={diskDetail} />
          <StatTile label="uptime" value={uptime} detail="since boot" />
        </div>

        {/* cpu chart placeholder — a static sparkline in --ink with a 7% area
            fill (no per-minute history is stored yet). */}
        <div style={{ marginTop: 14 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--soft)",
            }}
          >
            cpu · last hour
          </span>
          <svg
            viewBox="0 0 450 64"
            preserveAspectRatio="none"
            width="100%"
            height="64"
            style={{ display: "block", marginTop: 6 }}
            aria-hidden="true"
          >
            <path
              d="M0 50 L30 44 L60 48 L90 34 L120 40 L150 28 L180 36 L210 22 L240 30 L270 18 L300 26 L330 20 L360 30 L390 24 L420 32 L450 26 L450 64 L0 64 Z"
              fill="var(--ink)"
              fillOpacity="0.07"
            />
            <path
              d="M0 50 L30 44 L60 48 L90 34 L120 40 L150 28 L180 36 L210 22 L240 30 L270 18 L300 26 L330 20 L360 30 L390 24 L420 32 L450 26"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* process table — one row per agent runner, then bridge + postgres */}
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--soft)",
            }}
          >
            processes
          </span>
          <div style={{ marginTop: 6 }}>
            {agents.map((a) => {
              // no per-agent cpu from the bridge (see contract.md) — show a
              // ring-pct-driven bar so working runners read busier.
              const pct =
                a.status === "working"
                  ? Math.max(14, Math.round(a.ringPct) || 24)
                  : Math.round(a.ringPct);
              return (
                <button
                  key={a.id}
                  type="button"
                  className="os-mon-row"
                  onClick={() => os.openAgent(a.id)}
                >
                  <span style={{ position: "relative", flex: "none" }}>
                    <Persona agent={a.id} size={20} />
                    <span
                      style={{
                        position: "absolute",
                        right: -1,
                        bottom: -1,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: DOT[a.status],
                        border: "1.5px solid var(--surf)",
                      }}
                    />
                  </span>
                  <span
                    style={{
                      width: 74,
                      flex: "none",
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    {a.name}
                  </span>
                  <span className="os-mon-bar-track">
                    <span
                      className="os-mon-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(3, pct))}%`,
                        background: `var(${AGENT_HUE_VAR[a.id]})`,
                      }}
                    />
                  </span>
                  <span
                    className="os-mono"
                    style={{
                      width: 38,
                      flex: "none",
                      textAlign: "right",
                      fontSize: 11.5,
                      color: "var(--soft)",
                    }}
                  >
                    {pct}%
                  </span>
                </button>
              );
            })}
            <SystemRow label="bridge" pct={6} onClick={() => os.open("dev")} />
            <SystemRow
              label="postgres"
              pct={4}
              onClick={() => os.open("dev")}
            />
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--mute)",
          }}
        >
          <span>
            this month ${monthSpend} of ${budget} · up {uptime}
          </span>
          <button
            type="button"
            onClick={() => os.open("dev")}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--ink)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            open dev →
          </button>
        </div>
      </section>
    </>
  );
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="os-mon-tile">
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--soft)",
        }}
      >
        {label}
      </span>
      <div
        className="os-display"
        style={{
          fontWeight: 700,
          fontSize: 21,
          lineHeight: 1.1,
          marginTop: 3,
        }}
      >
        {value}
      </div>
      <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{detail}</span>
    </div>
  );
}

function SystemRow({
  label,
  pct,
  onClick,
}: {
  label: string;
  pct: number;
  onClick: () => void;
}) {
  return (
    <button type="button" className="os-mon-row" onClick={onClick}>
      <span
        style={{
          width: 20,
          height: 20,
          flex: "none",
          borderRadius: 6,
          background: "var(--surf2)",
          border: "1px solid var(--line)",
        }}
      />
      <span
        style={{
          width: 74,
          flex: "none",
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--mute)",
        }}
      >
        {label}
      </span>
      <span className="os-mon-bar-track">
        <span
          className="os-mon-bar-fill"
          style={{ width: `${pct}%`, background: "var(--mute)" }}
        />
      </span>
      <span
        className="os-mono"
        style={{
          width: 38,
          flex: "none",
          textAlign: "right",
          fontSize: 11.5,
          color: "var(--mute)",
        }}
      >
        {pct}%
      </span>
    </button>
  );
}
