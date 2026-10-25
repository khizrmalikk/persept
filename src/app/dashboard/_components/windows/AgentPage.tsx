"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  rerunRun,
  restartAgent,
  setAgentBudget,
  setAgentModelTier,
} from "@/lib/workforce/actions";
import {
  logKindColor,
  MODEL_TIERS,
  type ModelTier,
  modelDisplay,
  type OSAgentExtras,
  type OSAgentFile,
} from "../../_data/agentpage-types";
import type { OSAgent } from "../../_data/agents";
import { AGENT_HUE_VAR, AGENT_TINT_VAR, WINDOWS } from "../../_data/windows";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { StaleNotice } from "../StaleNotice";

// relative time for a `last active` ISO, client-side (no server `ago` import).
function relTime(iso: string): string {
  const s = iso.trim();
  if (!s) return "never";
  const t = Date.parse(s);
  if (Number.isNaN(t)) return "never";
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 60) return "just now";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Agent page — one per agent. overview / chat / permissions & schedule / runs &
// logs. The chat itself lives in the Percy drawer (shared thread), so the chat
// tab links there. Model changes go out as a CONFIG block to Percy; everything
// per the day-30 contract (cost not cpu, locked send/merge/publish/pay).

const TABS: [string, string][] = [
  ["overview", "overview"],
  ["chat", "chat"],
  ["settings", "permissions & schedule"],
  ["runs", "runs & logs"],
];
const AGENT_KEYS: AgentKey[] = [
  "percy",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];
const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
const statusColor = (s: string) =>
  s === "working"
    ? "var(--ok)"
    : s === "waiting"
      ? "var(--ambink)"
      : "var(--mute)";
const acctColor = (s: string) =>
  s === "connected"
    ? "var(--ok)"
    : s === "pending"
      ? "var(--ambink)"
      : "var(--bad)";

export function AgentPage({
  agents,
  extras,
}: {
  agents: OSAgent[];
  extras: Record<string, OSAgentExtras>;
}) {
  const os = useOS();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [perm, setPerm] = useState<Record<number, boolean>>({});
  // "change" on the model row jumps to the permissions tab and highlights the
  // model picker; the restart button confirms inline before firing.
  const [focusModel, setFocusModel] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const selected: AgentKey = os.sub.k ?? "percy";
  const agent = agents.find((a) => a.id === selected) ?? agents[0];

  // reset tab + local toggles when the viewed agent changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only on agent switch
  useEffect(() => {
    setTab("overview");
    setPerm({});
    setFocusModel(false);
    setConfirmRestart(false);
  }, [agent.id]);

  if (!agent) return null;
  const ex = extras[agent.id] ?? {
    integrations: [],
    runs: [],
    capabilities: [],
    log: [],
    ledgerPending: false,
    vpsStale: false,
    staleNotice: null,
  };
  const hue = `var(${AGENT_HUE_VAR[agent.id]})`;
  const tint = `var(${AGENT_TINT_VAR[agent.id]})`;
  const isPercy = agent.id === "percy";

  const nameToKey = (n: string): AgentKey | undefined => {
    const low = n.toLowerCase();
    if (low === "you") return "you";
    return agents.find((a) => a.name.toLowerCase() === low)?.id;
  };
  const toKeys = (arr: string[]): AgentKey[] =>
    arr
      .flatMap((n) =>
        n === "all agents"
          ? AGENT_KEYS.filter((k) => k !== agent.id)
          : [nameToKey(n)],
      )
      .filter((k): k is AgentKey => !!k);

  const worksIn = Object.values(WINDOWS)
    .filter((w) => w.key !== "approvals")
    .flatMap((w) => {
      let role: string | null = null;
      if (w.owner === agent.id) role = "owner";
      else if (w.collab.includes(agent.id)) role = "collaborator";
      else if (isPercy) role = "oversight";
      return role ? [{ key: w.key, name: w.name, role }] : [];
    });
  const owns = worksIn.filter((w) => w.role === "owner");

  const setModel = (tier: ModelTier) => {
    void setAgentModelTier(agent.id, tier).then(() => router.refresh());
    os.showToast(`set ${agent.name} to ${tier}`);
  };
  const openModelPicker = () => {
    setTab("settings");
    setFocusModel(true);
  };
  const doRestart = () => {
    setConfirmRestart(false);
    void restartAgent(agent.id).then(() => router.refresh());
    os.showToast(`restarting ${agent.name}`);
  };

  const budget = agent.budgetUsd;
  const monthPct =
    budget && budget > 0 ? Math.min(100, (agent.costMonth / budget) * 100) : 0;

  // §4: when the ledger hasn't run, numbers would read a stale 0 — say so instead.
  const LEDGER = "ledger has not run yet";
  const costTodayStr = ex.ledgerPending
    ? LEDGER
    : `$${agent.costToday.toFixed(2)}`;
  const costMonthStr = ex.ledgerPending
    ? LEDGER
    : `$${agent.costMonth.toFixed(2)}`;
  const tokensTodayStr = ex.ledgerPending
    ? LEDGER
    : agent.tokensToday.toLocaleString("en-US");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* tab bar + other agents */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {TABS.map(([k, n]) => {
          const on = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                padding: "7px 13px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                whiteSpace: "nowrap",
                background: on ? "var(--surf2)" : "transparent",
                color: on ? "var(--ink)" : "var(--soft)",
              }}
            >
              {n}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {AGENT_KEYS.filter((k) => k !== agent.id).map((k) => (
            <button
              key={k}
              type="button"
              title={agents.find((a) => a.id === k)?.name ?? k}
              onClick={() => os.openAgent(k)}
              style={{
                borderRadius: "50%",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
                opacity: 0.55,
              }}
            >
              <Persona agent={k} size={26} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18 }}>
        {ex.staleNotice && (
          <div style={{ marginBottom: 14 }}>
            <StaleNotice text={ex.staleNotice} />
          </div>
        )}
        {tab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* hero + vps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: 22,
                  borderRadius: 20,
                  background: tint,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Persona
                    agent={agent.id}
                    size={104}
                    ring
                    status={agent.status}
                  />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                  >
                    <span
                      className="os-display"
                      style={{
                        fontWeight: 900,
                        fontSize: 40,
                        lineHeight: 0.95,
                      }}
                    >
                      {agent.name}
                    </span>
                    <span
                      className="os-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: hue,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {agent.room}
                    </span>
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "var(--surf)",
                        color: statusColor(agent.status),
                      }}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 15, lineHeight: 1.5 }}>
                  {agent.mandate}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "var(--surf)",
                  }}
                >
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--mute)",
                    }}
                  >
                    right now
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: agent.task ? "var(--ink)" : "var(--mute)",
                    }}
                  >
                    {agent.task || "nothing running"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => os.openDrawer(agent.id)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: 10,
                      borderRadius: 10,
                      background: "var(--ink)",
                      color: "var(--bg)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    message {agent.name}
                  </button>
                  {!isPercy && (
                    <button
                      type="button"
                      onClick={() => os.openDrawer("percy")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        background: "var(--surf)",
                        fontSize: 13,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        color: "var(--ink)",
                      }}
                    >
                      ask via Percy
                    </button>
                  )}
                </div>
              </div>
              {/* on the vps — cost + tokens, not cpu */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  on the vps
                </span>
                {ex.ledgerPending && (
                  <span style={{ fontSize: 12, color: "var(--ambink)" }}>
                    {LEDGER} — today&apos;s cost appears once it does.
                  </span>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr auto",
                    gap: "8px 12px",
                    alignItems: "center",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: "var(--mute)" }}>cost today</span>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "var(--track)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${agent.ringPct}%`,
                        borderRadius: 3,
                        background: hue,
                      }}
                    />
                  </div>
                  <span className="os-mono" style={{ textAlign: "right" }}>
                    {ex.ledgerPending ? "—" : `$${agent.costToday.toFixed(2)}`}
                  </span>
                  <span style={{ color: "var(--mute)" }}>this month</span>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "var(--track)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${monthPct}%`,
                        borderRadius: 3,
                        background: hue,
                      }}
                    />
                  </div>
                  <span className="os-mono" style={{ textAlign: "right" }}>
                    {ex.ledgerPending ? "—" : `$${agent.costMonth.toFixed(2)}`}
                  </span>
                  <span style={{ color: "var(--mute)" }}>budget</span>
                  <span style={{ gridColumn: "2 / span 2", fontSize: 12.5 }}>
                    {budget != null ? `$${budget}/mo` : "not set"}
                  </span>
                  <span style={{ color: "var(--mute)" }}>tokens today</span>
                  <span
                    className="os-mono"
                    style={{ gridColumn: "2 / span 2" }}
                  >
                    {ex.ledgerPending
                      ? "—"
                      : agent.tokensToday.toLocaleString("en-US")}
                  </span>
                </div>
              </div>
            </div>
            {/* flow + owns/works-in */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  how work flows
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      alignItems: "flex-end",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--mute)" }}>
                      gets work from
                    </span>
                    {toKeys(agent.from).map((k) => (
                      <span
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {k === "you" ? "you" : cap(k)}
                        <Persona agent={k} size={24} />
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--mute)",
                    }}
                  >
                    <span>→</span>
                    <Persona agent={agent.id} size={44} ring />
                    <span>→</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--mute)" }}>
                      hands work to
                    </span>
                    {toKeys(agent.to).map((k) => (
                      <span
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        <Persona agent={k} size={24} />
                        {k === "you" ? "you" : cap(k)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {owns.length > 0 && (
                  <>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>owns</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {owns.map((w) => (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => os.open(w.key)}
                          style={{
                            fontSize: 12.5,
                            padding: "6px 11px",
                            borderRadius: 999,
                            background: tint,
                            color: hue,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {w.name} →
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: owns.length ? 6 : 0,
                  }}
                >
                  works in
                </span>
                {worksIn.length === 0 ? (
                  <span style={{ fontSize: 13, color: "var(--soft)" }}>
                    no workspace yet.
                  </span>
                ) : (
                  worksIn.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => os.open(w.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "var(--surf2)",
                        cursor: "pointer",
                        border: "none",
                        color: "var(--ink)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        {w.name}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--soft)" }}>
                        {w.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            {/* right column: quick cost summary */}
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>at a glance</span>
              <ModelRow
                value={modelDisplay(agent.model)}
                onChange={openModelPicker}
              />
              <Row label="status" value={agent.status} />
              {ex.paidThisMonth != null && (
                <Row
                  label="paid this month"
                  value={`AED ${Math.round(ex.paidThisMonth).toLocaleString("en-US")}`}
                />
              )}
              {ex.overdueInvoices != null && (
                <Row
                  label="overdue invoices"
                  value={String(ex.overdueInvoices)}
                />
              )}
              {ex.qualifiedWeek != null && (
                <Row
                  label="qualified this week"
                  value={`${ex.qualifiedWeek.accepted} accepted / ${ex.qualifiedWeek.dismissed} dismissed`}
                />
              )}
              <Row label="cost today" value={costTodayStr} />
              <Row label="cost this month" value={costMonthStr} />
              <Row label="tokens today" value={tokensTodayStr} />
              <Row
                label="accounts"
                value={(() => {
                  // only status === "connected" counts as connected; pending/off
                  // accounts still list below with their real status.
                  const n = ex.integrations.filter(
                    (i) => i.status === "connected",
                  ).length;
                  return ex.integrations.length === 0
                    ? "none"
                    : `${n} connected`;
                })()}
              />
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div
            style={{
              maxWidth: 620,
              margin: "40px auto 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "var(--surf2)",
                fontSize: 12.5,
                color: "var(--soft)",
              }}
            >
              <Persona agent="percy" size={22} />
              {isPercy
                ? "Percy hands your requests to the right agent and reports back here."
                : `you're talking to ${agent.name} directly. Percy still sees this thread.`}
            </div>
            <Persona agent={agent.id} size={72} ring status={agent.status} />
            <span
              style={{
                fontSize: 14,
                color: "var(--soft)",
                maxWidth: 380,
                lineHeight: 1.5,
              }}
            >
              the conversation lives in the drawer so it stays with you across
              windows.
            </span>
            <button
              type="button"
              onClick={() => os.openDrawer(agent.id)}
              style={{
                padding: "11px 18px",
                borderRadius: 11,
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
              }}
            >
              open the conversation with {agent.name}
            </button>
          </div>
        )}

        {tab === "settings" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)",
              gap: 16,
              alignItems: "start",
              maxWidth: 1100,
            }}
          >
            {/* capabilities */}
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                what {agent.name} can do
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--soft)",
                  margin: "4px 0 8px",
                }}
              >
                anything that sends, merges, publishes or pays always asks you
                first. that can&apos;t be switched off.
              </span>
              {ex.capabilities.map((c, i) => {
                const on = perm[i] ?? c.defaultOn;
                return (
                  <div
                    key={c.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        flex: 1,
                      }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {c.label}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--mute)" }}>
                        {c.detail}
                      </span>
                    </div>
                    {c.locked ? (
                      <button
                        type="button"
                        onClick={() =>
                          os.showToast("this always needs your tap")
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--ambink)",
                          whiteSpace: "nowrap",
                          background: "transparent",
                          border: "none",
                          cursor: "default",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
                        </svg>
                        always asks you
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`toggle ${c.label}`}
                        aria-pressed={on}
                        onClick={() => setPerm((p) => ({ ...p, [i]: !on }))}
                        style={{
                          width: 38,
                          height: 22,
                          borderRadius: 11,
                          background: on ? hue : "var(--track)",
                          position: "relative",
                          flex: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: on ? 19 : 3,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.15s",
                          }}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
              <span
                style={{ fontSize: 11.5, color: "var(--mute)", marginTop: 10 }}
              >
                toggles are local for now — persisting them needs a permissions
                write on the bridge.
              </span>
            </div>
            {/* budget + schedule + model/accounts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    monthly budget
                  </span>
                  <b className="os-display" style={{ fontSize: 22 }}>
                    {budget != null ? `$${budget}` : "—"}
                  </b>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--track)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${monthPct}%`,
                      borderRadius: 3,
                      background: hue,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "var(--soft)" }}>
                  ${agent.costMonth.toFixed(2)} used so far.
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = Number(
                      new FormData(e.currentTarget).get("budget"),
                    );
                    if (Number.isFinite(v) && v >= 0) {
                      void setAgentBudget(agent.id, v).then(() =>
                        router.refresh(),
                      );
                      os.showToast(`budget set to $${Math.round(v)}/mo`);
                    }
                  }}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <span style={{ fontSize: 12, color: "var(--mute)" }}>$</span>
                  <input
                    name="budget"
                    type="number"
                    min={0}
                    defaultValue={budget ?? ""}
                    placeholder="set a monthly cap"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "7px 10px",
                      borderRadius: 9,
                      border: "1px solid var(--line)",
                      background: "var(--surf2)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-ui)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "7px 12px",
                      borderRadius: 9,
                      border: "1px solid var(--line)",
                      background: "var(--surf2)",
                      color: "var(--ink)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    save
                  </button>
                </form>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: `1px solid ${focusModel ? hue : "var(--line)"}`,
                  boxShadow: focusModel ? `0 0 0 3px ${tint}` : "none",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}
                >
                  model
                </span>
                {/* the active tier isn't knowable from the resolved model string
                    (the bridge maps tier→model), so pick a tier to change it. */}
                <div style={{ display: "flex", gap: 6 }}>
                  {MODEL_TIERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setModel(t)}
                      style={{
                        flex: 1,
                        padding: "8px 6px",
                        borderRadius: 9,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid var(--line)",
                        background: "transparent",
                        color: "var(--soft)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                  current: {modelDisplay(agent.model)}. picking a tier sends
                  Percy a CONFIG block; the bridge sets the model.
                </span>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}
                >
                  schedule
                </span>
                {ex.runs.length === 0 ? (
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--soft)",
                      padding: "6px 0",
                    }}
                  >
                    runs on demand, when Percy or you give it work.
                  </span>
                ) : (
                  ex.runs.map((r) => (
                    <div
                      key={`${r.time}-${r.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 0",
                        borderTop: "1px solid var(--line)",
                        fontSize: 13,
                      }}
                    >
                      <span
                        className="os-mono"
                        style={{
                          padding: "4px 8px",
                          borderRadius: 7,
                          background: "var(--surf2)",
                        }}
                      >
                        {r.time}
                      </span>
                      <span style={{ flex: 1 }}>{r.name}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            r.status === "missed"
                              ? "var(--bad)"
                              : r.status === "done"
                                ? "var(--ok)"
                                : "var(--mute)",
                        }}
                      >
                        {r.status === "rerun" ? "re-run by system" : r.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void rerunRun(agent.id, r.name).then(() =>
                            router.refresh(),
                          );
                          os.showToast(`re-running ${r.name}`);
                        }}
                        style={{
                          fontSize: 11.5,
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--line)",
                          background: "transparent",
                          color: "var(--ink)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        run now
                      </button>
                    </div>
                  ))
                )}
                {ex.qualifiedWeek != null && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid var(--line)",
                      fontSize: 12.5,
                      color: "var(--soft)",
                      lineHeight: 1.45,
                    }}
                  >
                    lead qualifying: Hunter, up to 10 accepts a day{" "}
                    <span className="os-mono" style={{ color: "var(--mute)" }}>
                      (LEAD_QUALIFY, LEAD_ACCEPT_PER_DAY in the bridge .env)
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  connected accounts
                </span>
                {ex.integrations.length === 0 ? (
                  <span style={{ fontSize: 13, color: "var(--soft)" }}>
                    no connected accounts.
                  </span>
                ) : (
                  ex.integrations.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <span style={{ color: "var(--soft)" }}>{c.name}</span>
                      <span
                        style={{ fontWeight: 600, color: acctColor(c.status) }}
                      >
                        {c.detail || c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "runs" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 1100,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>process</span>
                  {confirmRestart ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ color: "var(--soft)" }}>restart?</span>
                      <button
                        type="button"
                        onClick={doRestart}
                        style={{
                          padding: "6px 11px",
                          borderRadius: 8,
                          border: "none",
                          background: "var(--bad)",
                          color: "#fff",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        restart
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRestart(false)}
                        style={{
                          padding: "6px 11px",
                          borderRadius: 8,
                          border: "1px solid var(--line)",
                          background: "transparent",
                          color: "var(--ink)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRestart(true)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 9,
                        border: "1px solid var(--line)",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "transparent",
                        color: "var(--ink)",
                      }}
                    >
                      restart {agent.name}
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 16px",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--mute)" }}>status</span>
                  <b>{agent.status}</b>
                  <span style={{ color: "var(--mute)" }}>last active</span>
                  <b>{relTime(agent.lastActive)}</b>
                  <span style={{ color: "var(--mute)" }}>cost today</span>
                  <b className="os-mono">{costTodayStr}</b>
                  <span style={{ color: "var(--mute)" }}>tokens today</span>
                  <b className="os-mono">{tokensTodayStr}</b>
                </div>
                <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                  restart resets {agent.name}&apos;s session; memory files stay.
                </span>
              </div>
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#1a1816",
                    color: "#b9b3aa",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                >
                  <span>events · {agent.id}</span>
                  <span>{ex.log.length}</span>
                </div>
                <div
                  style={{
                    background: "#0e0d0c",
                    color: "#e8e4dc",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    padding: "14px 16px",
                    height: 360,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {ex.log.length === 0 ? (
                    <span
                      style={{
                        margin: "auto",
                        color: "#6f6a62",
                        textAlign: "center",
                      }}
                    >
                      nothing yet. {agent.name}&apos;s events show here as it
                      works.
                    </span>
                  ) : (
                    ex.log.map((l) => (
                      <div
                        key={l.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            color: logKindColor(l.kind),
                            flex: "none",
                            width: 64,
                            textTransform: "uppercase",
                            fontSize: 10,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {l.kind}
                        </span>
                        <span
                          style={{ flex: 1, minWidth: 0, color: "#e8e4dc" }}
                        >
                          {l.text}
                        </span>
                        {l.ts && (
                          <span style={{ color: "#6f6a62", flex: "none" }}>
                            {l.ts}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {ex.files.length > 0 && <OutputFiles files={ex.files} />}
          </div>
        )}
      </div>
    </div>
  );
}

// day-47: an agent's mirrored output folder (Scribe library/, Muse posts/, Hunter
// drafts/) — one finished piece per file, expandable to its text, with a green
// mark when the front matter says it was published.
function OutputFiles({ files }: { files: OSAgentFile[] }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        output files
      </span>
      {files.map((f) => (
        <OutputFileRow key={f.path} f={f} />
      ))}
    </div>
  );
}

function OutputFileRow({ f }: { f: OSAgentFile }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "9px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {f.published && (
          <span
            title="published"
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "var(--ok)",
              flex: "none",
            }}
          />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink)",
            fontSize: 13,
            padding: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "▾ " : "▸ "}
          {f.name}
        </button>
        {f.status && (
          <span
            className="os-mono"
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: f.published ? "var(--ok)" : "var(--soft)",
              border: `1px solid ${f.published ? "var(--ok)" : "var(--line)"}`,
              borderRadius: 999,
              padding: "1px 6px",
              flex: "none",
            }}
          >
            {f.status}
          </span>
        )}
        <span style={{ fontSize: 11, color: "var(--mute)", flex: "none" }}>
          {f.updated}
        </span>
      </div>
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 6,
          }}
        >
          {(f.request || f.approval || f.url) && (
            <div style={{ fontSize: 11.5, color: "var(--soft)" }}>
              {[
                f.request && `request ${f.request}`,
                f.approval && `approval ${f.approval}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              {f.url && (
                <>
                  {" · "}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--soft)" }}
                  >
                    open ↗
                  </a>
                </>
              )}
            </div>
          )}
          <div
            style={{
              padding: "9px 11px",
              borderRadius: 10,
              background: "var(--surf2)",
              fontSize: 12.5,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {f.body || "empty."}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--soft)" }}>{label}</span>
      <b style={{ whiteSpace: "nowrap" }}>{value}</b>
    </div>
  );
}

// the "model" row in at-a-glance: value + a "change" link that opens the
// permissions tab's model picker.
function ModelRow({
  value,
  onChange,
}: {
  value: string;
  onChange: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 10,
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--soft)" }}>model</span>
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          minWidth: 0,
        }}
      >
        <b
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </b>
        <button
          type="button"
          onClick={onChange}
          style={{
            flex: "none",
            background: "transparent",
            border: "none",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          change
        </button>
      </span>
    </div>
  );
}
