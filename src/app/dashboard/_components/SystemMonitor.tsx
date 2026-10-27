"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { sendAgentCommand } from "@/lib/workforce/actions";
import type { OSAgent, OSVps } from "../_data/agents";
import type { OSOp, OSOpStatus } from "../_data/ops";
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
  ops,
}: {
  agents: OSAgent[];
  vps: OSVps | null;
  ops: OSOp[];
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
      <section
        className="os-monitor"
        aria-label="system monitor"
        data-pc="sysmon"
      >
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

        {/* operations — what Percy has run on the system */}
        <OpsSection ops={ops} />

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

// ── operations ─────────────────────────────────────────────────────────────
// The last 20 ops Percy ran on the system, plus controls that send OPS-block
// messages to Percy (via the existing sendAgentCommand server action — never a
// direct write to `ops`). Percy raises the op; its result lands on the next tick.

const OP_CHIP: Record<OSOpStatus, { label: string; color: string }> = {
  queued: { label: "queued", color: "var(--mute)" },
  awaiting_approval: { label: "awaiting you", color: "var(--accent)" },
  running: { label: "running", color: "var(--accent)" },
  done: { label: "done", color: "oklch(0.72 0.17 150)" },
  failed: { label: "failed", color: "oklch(0.63 0.2 25)" },
  rejected: { label: "rejected", color: "oklch(0.63 0.2 25)" },
};

// the services the bridge can show logs for / restart. Free-form is still
// available through the "run an op" composer.
const OP_SERVICES = ["bridge", "gateway", "runner", "postgres"];

const opInput: CSSProperties = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 7,
  border: "1px solid var(--line)",
  background: "var(--surf2)",
  color: "var(--ink)",
  fontSize: 12,
  fontFamily: "var(--mono, ui-monospace, monospace)",
};

function ago(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
function fmtDur(ms: number | null): string {
  if (ms == null) return "";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function OpBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px solid var(--line)",
        background: "var(--surf2)",
        color: "var(--ink)",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function BeforeAfter({ label, value }: { label: string; value: unknown }) {
  const text =
    value == null
      ? "—"
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--soft)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 8,
          borderRadius: 6,
          background: "var(--surf2)",
          border: "1px solid var(--line)",
          fontSize: 10.5,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 140,
          overflow: "auto",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

function OpsSection({ ops }: { ops: OSOp[] }) {
  const os = useOS();
  const [open, setOpen] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);
  const [doText, setDoText] = useState("");
  const [why, setWhy] = useState("");
  // the logs / restart controls each reveal a service picker (+ minutes for logs).
  const [panel, setPanel] = useState<null | "logs" | "restart">(null);
  const [svc, setSvc] = useState("bridge");
  const [mins, setMins] = useState("15");

  const run = async (verbArgs: string, reason: string) => {
    if (!verbArgs.trim()) return;
    try {
      await sendAgentCommand(
        "percy",
        `OPS\ndo: ${verbArgs.trim()}\nwhy: ${
          reason.trim() || "owner asked from the dashboard"
        }`,
      );
      os.showToast("Percy is on it");
    } catch {
      os.showToast("couldn't reach Percy — try again");
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--soft)",
          }}
        >
          operations
        </span>
        <button
          type="button"
          onClick={() => setComposer((v) => !v)}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--ink)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {composer ? "close" : "run an op"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <OpBtn onClick={() => run("status", "owner asked from the dashboard")}>
          status
        </OpBtn>
        <OpBtn
          onClick={() => run("jobs list", "owner asked from the dashboard")}
        >
          jobs
        </OpBtn>
        <OpBtn onClick={() => setPanel(panel === "logs" ? null : "logs")}>
          logs
        </OpBtn>
        <OpBtn onClick={() => setPanel(panel === "restart" ? null : "restart")}>
          restart
        </OpBtn>
        <OpBtn
          onClick={() => {
            if (window.confirm("Redeploy the bridge? Percy will run it now.")) {
              run("redeploy", "owner asked from the dashboard");
            }
          }}
        >
          redeploy
        </OpBtn>
      </div>

      {panel && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--soft)" }}>
            {panel === "logs" ? "logs for" : "restart"}
          </span>
          <select
            value={svc}
            onChange={(e) => setSvc(e.target.value)}
            style={{ ...opInput, width: "auto", cursor: "pointer" }}
          >
            {OP_SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {panel === "logs" && (
            <>
              <input
                value={mins}
                onChange={(e) =>
                  setMins(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                inputMode="numeric"
                aria-label="minutes"
                style={{ ...opInput, width: 56 }}
              />
              <span style={{ fontSize: 11.5, color: "var(--mute)" }}>min</span>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              if (panel === "logs") {
                run(
                  `logs ${svc} ${Number(mins) || 15}`,
                  "owner asked from the dashboard",
                );
              } else if (
                window.confirm(`Restart ${svc}? Percy will run it now.`)
              ) {
                run(`restart ${svc}`, "owner asked from the dashboard");
              }
              setPanel(null);
            }}
            style={{
              ...opInput,
              width: "auto",
              cursor: "pointer",
              fontWeight: 700,
              background: "var(--accent)",
              color: "var(--onacc)",
              border: "none",
            }}
          >
            {panel === "logs" ? "get logs" : "restart"}
          </button>
        </div>
      )}

      {composer && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <input
            value={doText}
            onChange={(e) => setDoText(e.target.value)}
            placeholder="do: e.g. agent reset hunter"
            style={opInput}
          />
          <input
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="why: the reason Percy records"
            style={opInput}
          />
          <button
            type="button"
            onClick={() => {
              run(doText, why);
              setDoText("");
              setWhy("");
              setComposer(false);
            }}
            style={{
              ...opInput,
              width: "auto",
              cursor: "pointer",
              fontWeight: 700,
              background: "var(--accent)",
              color: "var(--onacc)",
              border: "none",
            }}
          >
            run · Percy records it
          </button>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        {ops.length === 0 ? (
          <span style={{ fontSize: 12, color: "var(--mute)" }}>
            no operations yet. Percy&rsquo;s system actions show here.
          </span>
        ) : (
          ops.map((o) => {
            const chip = OP_CHIP[o.status];
            const isOpen = open === o.id;
            const hasDetail = !!o.result || o.before != null || o.after != null;
            return (
              <div key={o.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasDetail) setOpen(isOpen ? null : o.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 0",
                    border: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: hasDetail ? "pointer" : "default",
                    textAlign: "left",
                  }}
                >
                  <span
                    className="os-mono"
                    style={{
                      color: "var(--mute)",
                      fontSize: 11,
                      width: 30,
                      flex: "none",
                    }}
                  >
                    {ago(o.ts)}
                  </span>
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 12,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {o.verb}
                    {o.args ? ` ${o.args}` : ""}
                  </span>
                  {o.host && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--accent)",
                        border: "1px solid var(--accent)",
                        borderRadius: 4,
                        padding: "1px 4px",
                        flex: "none",
                      }}
                    >
                      host
                    </span>
                  )}
                  <span
                    className={o.status === "running" ? "os-pulse" : undefined}
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: chip.color,
                      flex: "none",
                    }}
                  >
                    {chip.label}
                  </span>
                  {o.durationMs != null && (
                    <span
                      className="os-mono"
                      style={{
                        fontSize: 10.5,
                        color: "var(--mute)",
                        width: 42,
                        textAlign: "right",
                        flex: "none",
                      }}
                    >
                      {fmtDur(o.durationMs)}
                    </span>
                  )}
                </button>
                {o.why && !isOpen && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--mute)",
                      padding: "0 0 7px 38px",
                      marginTop: -4,
                    }}
                  >
                    {o.why}
                  </div>
                )}
                {isOpen && (
                  <div style={{ padding: "2px 0 10px" }}>
                    {o.result && (
                      <pre
                        style={{
                          margin: 0,
                          padding: 8,
                          borderRadius: 6,
                          background: "var(--code, #0a0a0a)",
                          color: "#d7d5cd",
                          border: "1px solid var(--line)",
                          fontSize: 11,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: 220,
                          overflow: "auto",
                        }}
                      >
                        {o.result}
                      </pre>
                    )}
                    {(o.before != null || o.after != null) && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginTop: 6,
                        }}
                      >
                        <BeforeAfter label="before" value={o.before} />
                        <BeforeAfter label="after" value={o.after} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
