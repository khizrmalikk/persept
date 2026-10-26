"use client";

import { useEffect, useState } from "react";
import type { OSAgent, OSVps } from "../_data/agents";
import type { OSApproval } from "../_data/approvals";
import type { OSDesktop } from "../_data/desktop-types";
import {
  fmtGoal,
  type GoalCtx,
  goalStats,
  type OSWarRoom,
  STC,
} from "../_data/warroom-types";
import { AGENT_HUE_VAR } from "../_data/windows";
import { useOS } from "./os-store";
import { type AgentKey, Persona } from "./Persona";

// The desktop: the VPS map as wallpaper (agents are buildings whose ring = cost
// against budget, links carry the real handoff edges) plus the glanceable
// widgets. A normal responsive full-viewport layout (not the prototype's scaled
// stage). Per the contract the node ring is cost, not CPU.

const HUE: Record<Exclude<AgentKey, "you">, number> = {
  percy: 70,
  scout: 20,
  hunter: 150,
  scribe: 220,
  muse: 110,
  fixer: 290,
};
// offsets from stage centre (y centre +10)
const OFF: Record<string, [number, number]> = {
  percy: [0, -20],
  scout: [-262, -175],
  hunter: [-275, 95],
  scribe: [-20, 205],
  muse: [262, -170],
  fixer: [272, 110],
};
const EDGES: [string, string, string][] = [
  ["scout", "hunter", "leads"],
  ["hunter", "scribe", "briefs"],
  ["scribe", "hunter", ""],
  ["hunter", "muse", "campaigns"],
  ["muse", "scribe", "copy check"],
  ["percy", "fixer", "tasks"],
  ["percy", "scout", ""],
  ["percy", "hunter", ""],
  ["percy", "muse", ""],
  ["percy", "scribe", ""],
];
const DOT: Record<string, string> = {
  working: "var(--dot-working)",
  waiting: "var(--dot-waiting)",
  idle: "var(--dot-idle)",
  soon: "var(--dot-soon)",
};
const RING_C = 2 * Math.PI * 41;
const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);

export type OSPipeline = {
  value: number;
  deals: number;
  bars: { label: string; count: number }[];
  // day-40: real money. wonThisMonth blends Stripe payments + unpaid won; collected
  // is this month's net from Stripe, converted to AED.
  wonThisMonth: number;
  collected: number;
};

export function DesktopGround({
  agents,
  vps,
  approvals,
  desktop,
  warroom,
  pipeline,
}: {
  agents: OSAgent[];
  vps: OSVps | null;
  approvals: OSApproval[];
  desktop: OSDesktop;
  warroom: OSWarRoom;
  pipeline: OSPipeline;
}) {
  const os = useOS();
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const measure = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight });
    measure();
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const live = approvals.filter((a) => !a.held);
  const held = approvals.length - live.length;
  const byId = new Map(agents.map((a) => [a.id, a]));
  const hour = now?.getHours() ?? 12;
  const greeting =
    hour < 12 ? "good morning" : hour < 18 ? "good afternoon" : "good evening";

  // v3 §7: right-click the bare wallpaper (the map, not a widget or a node)
  // opens the desktop context menu at the cursor. Widgets + node overlays carry
  // a data-os-widget marker (no handler — keeps the a11y linter happy); a
  // right-click whose target sits inside one of those, or on any button, is
  // ignored so only the ground opens the menu.
  const onWallpaperContextMenu = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-os-widget]") || t.closest("button")) return;
    e.preventDefault();
    os.openCtxMenu(e.clientX, e.clientY);
  };

  const showWidgets = os.view.widgets;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the wallpaper's only interaction is a right-click context menu, which has no keyboard equivalent; all of its commands are reachable from the menu bar
    <div
      onContextMenu={onWallpaperContextMenu}
      style={{ position: "absolute", inset: 0, background: "var(--map)" }}
    >
      {/* ── the vps map ──────────────────────────────────────────────────── */}
      {vp && (
        <CityMap
          vp={vp}
          agents={agents}
          heat={os.view.heatMap}
          links={os.view.dataLinks}
        />
      )}

      {/* node overlays: clickable avatar + label chip (cost, not cpu) ─────── */}
      {vp &&
        agents.map((a) => {
          const nx = vp.w / 2 + OFF[a.id][0];
          const ny = vp.h / 2 + 10 + OFF[a.id][1];
          return (
            <div
              key={a.id}
              data-os-widget
              style={{
                position: "absolute",
                left: nx,
                top: ny,
                width: 0,
                height: 0,
                zIndex: 2,
              }}
            >
              <button
                type="button"
                onClick={() => os.openAgent(a.id)}
                aria-label={`open ${a.name}`}
                style={{
                  position: "absolute",
                  left: -34,
                  top: -34,
                  cursor: "pointer",
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                }}
              >
                <Persona agent={a.id} size={68} status={a.status} />
              </button>
              <button
                type="button"
                onClick={() => os.openAgent(a.id)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 50,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "7px 12px",
                  borderRadius: 12,
                  background: "var(--surf)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  color: "var(--ink)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: DOT[a.status],
                    }}
                  />
                  {a.name}
                </span>
                <span
                  className="os-mono"
                  style={{ fontSize: 10.5, color: "var(--mute)" }}
                >
                  ${a.costToday.toFixed(2)}
                  {a.budgetUsd ? ` / ${a.budgetUsd}` : ""}
                </span>
              </button>
            </div>
          );
        })}

      {/* ── left column: brief · goals · pipeline ────────────────────────── */}
      {showWidgets && (
        <div
          data-os-widget
          style={{
            position: "absolute",
            left: 18,
            top: 52,
            width: 332,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 5,
          }}
        >
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Persona agent="percy" size={30} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Percy</span>
              <span className="os-kicker">today&apos;s brief</span>
            </div>
            <div
              className="os-display"
              style={{ fontWeight: 800, fontSize: 30, lineHeight: 1 }}
            >
              {greeting}, khizr.
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--soft)",
              }}
            >
              {live.length > 0 ? (
                <>
                  <b style={{ color: "var(--ink)" }}>
                    {live.length} thing{live.length === 1 ? "" : "s"}
                  </b>{" "}
                  waiting for your tap. the team keeps working in the
                  background.
                </>
              ) : (
                "nothing waiting on you right now. the team is working in the background."
              )}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <button
                type="button"
                className="os-btn os-btn-primary"
                onClick={() => os.openDrawer("percy")}
              >
                reply to percy
              </button>
              <button
                type="button"
                className="os-btn os-btn-secondary"
                onClick={() => os.open("command")}
              >
                open command
              </button>
            </div>
          </Card>

          {now &&
            warroom.goals.length > 0 &&
            (() => {
              // the glance view: first four goals with their live war-room status;
              // a row opens the war room on that goal. gated on `now` so the status
              // (which depends on today's date) is computed client-side only.
              const ctx: GoalCtx = {
                nowMs: now.getTime(),
                open: warroom.open,
                wonCount: warroom.wonCount,
                wonValue: warroom.wonValue,
              };
              const onTrack = warroom.goals.filter((g) =>
                ["on track", "hit"].includes(goalStats(g, ctx).status),
              ).length;
              return (
                <Card>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => os.open("warroom")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--ink)",
                        padding: 0,
                      }}
                    >
                      goals
                      <span style={{ fontSize: 12, color: "var(--soft)" }}>
                        war room →
                      </span>
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 999,
                        background: "oklch(0.72 0.15 150 / 0.16)",
                        color: "var(--ok)",
                      }}
                    >
                      {onTrack} of {warroom.goals.length} on track
                    </span>
                  </div>
                  {warroom.goals.slice(0, 4).map((g) => {
                    const t = goalStats(g, ctx);
                    const c = STC[t.status];
                    const pct = Math.min(100, t.pct * 100);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => os.open("warroom", { goal: g.id })}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          color: "var(--ink)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 12.5,
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {g.n}
                            </span>
                            <span
                              style={{
                                flex: "none",
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "1px 7px",
                                borderRadius: 999,
                                background: c[1],
                                color: c[0],
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.status}
                            </span>
                          </span>
                          <span
                            className="os-mono"
                            style={{ fontSize: 11.5, whiteSpace: "nowrap" }}
                          >
                            {fmtGoal(t.cur, g.unit)} /{" "}
                            {fmtGoal(g.target, g.unit)}
                          </span>
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
                              borderRadius: 3,
                              width: `${pct}%`,
                              background: c[0],
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </Card>
              );
            })()}

          <button
            type="button"
            onClick={() => os.open("frontdesk")}
            style={{
              textAlign: "left",
              cursor: "pointer",
              border: "1px solid var(--line)",
              background: "var(--surf)",
              borderRadius: 18,
              boxShadow: "var(--shadow)",
              padding: "15px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              color: "var(--ink)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                open pipeline
              </span>
              <span
                className="os-mono"
                style={{ fontSize: 11, color: "var(--mute)" }}
              >
                {pipeline.deals} deals
              </span>
            </div>
            <div
              className="os-display"
              style={{ fontWeight: 800, fontSize: 32, lineHeight: 1 }}
            >
              AED {pipeline.value.toLocaleString("en-US")}
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 11.5,
                color: "var(--soft)",
                whiteSpace: "nowrap",
              }}
            >
              <span>
                won this month{" "}
                <b style={{ color: "var(--ink)" }}>
                  AED {pipeline.wonThisMonth.toLocaleString("en-US")}
                </b>
              </span>
              {pipeline.collected > 0 && (
                <span>
                  collected{" "}
                  <b style={{ color: "var(--ok)" }}>
                    AED {Math.round(pipeline.collected).toLocaleString("en-US")}
                  </b>
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
                height: 46,
              }}
            >
              {pipeline.bars.map((b, i) => {
                const mx = Math.max(1, ...pipeline.bars.map((x) => x.count));
                return (
                  <div
                    key={b.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        height: `${Math.max(4, (b.count / mx) * 30)}px`,
                        borderRadius: 4,
                        background: "var(--c-hunter)",
                        opacity: 0.35 + i * 0.15,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9.5,
                        color: "var(--mute)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </button>
        </div>
      )}

      {/* ── top centre: today's runs ─────────────────────────────────────── */}
      {showWidgets && desktop.runs.length > 0 && now && (
        <div
          data-os-widget
          style={{
            position: "absolute",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            zIndex: 4,
            background: "var(--surf)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            boxShadow: "var(--shadow)",
            padding: "11px 18px 8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 8,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 600 }}>today&apos;s runs</span>
            <span className="os-mono" style={{ color: "var(--mute)" }}>
              {desktop.runs.filter((r) => r.status === "done").length} of{" "}
              {desktop.runs.length} done
            </span>
          </div>
          <RunsTimeline runs={desktop.runs} now={now} byId={byId} />
        </div>
      )}

      {/* ── right column: waiting · activity ─────────────────────────────── */}
      {showWidgets && (
        <div
          data-os-widget
          style={{
            position: "absolute",
            right: 18,
            top: 52,
            width: 350,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 5,
          }}
        >
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                waiting for you
              </span>
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  padding: "0 7px",
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {live.length}
              </span>
            </div>
            {live.length === 0 && (
              <div
                style={{ fontSize: 13, color: "var(--soft)", padding: "8px 0" }}
              >
                nothing waiting. new requests land here.
              </div>
            )}
            {live.slice(0, 3).map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: 11,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 13,
                  background: "var(--surf2)",
                }}
              >
                <Persona agent={a.agent} size={32} />
                <button
                  type="button"
                  onClick={() => os.open("approvals", { id: String(a.id) })}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                    flex: 1,
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: "var(--ink)",
                  }}
                >
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: `var(${AGENT_HUE_VAR[a.agent]})`,
                    }}
                  >
                    {a.kind}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      lineHeight: 1.25,
                    }}
                  >
                    {a.title}
                  </span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => os.open("approvals")}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                paddingTop: 4,
                cursor: "pointer",
                color: "var(--soft)",
                whiteSpace: "nowrap",
                background: "transparent",
                border: "none",
              }}
            >
              <span>open approvals</span>
              <span>
                {live.length} waiting · {held} held →
              </span>
            </button>
          </Card>

          {desktop.feed.length > 0 && (
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  what your AI just did
                </span>
              </div>
              {desktop.feed.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "9px 0",
                    borderTop: "1px solid var(--line)",
                    alignItems: "flex-start",
                  }}
                >
                  <Persona agent={f.agent} size={24} />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: 12.5, lineHeight: 1.35 }}>
                      {f.text}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        fontSize: 11,
                        color: "var(--mute)",
                      }}
                    >
                      <span
                        className="os-mono"
                        style={{
                          fontSize: 9.5,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "var(--surf2)",
                          color: "var(--soft)",
                        }}
                      >
                        {f.kind}
                      </span>
                      {cap(f.agent)} · {f.when}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── bottom centre: vps strip ─────────────────────────────────────── */}
      {showWidgets && (
        <button
          type="button"
          onClick={() => os.open("dev")}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 77,
            transform: "translateX(-50%)",
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "9px 18px",
            borderRadius: 14,
            background: "var(--surf)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
            fontSize: 12,
            whiteSpace: "nowrap",
            cursor: "pointer",
            color: "var(--ink)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--dot-working)",
              }}
            />
            vps-dxb-01
          </span>
          <span>
            <span style={{ color: "var(--mute)" }}>cpu</span>{" "}
            <b>{vps ? `${vps.cpuPct}%` : "—"}</b>
          </span>
          <span>
            <span style={{ color: "var(--mute)" }}>mem</span>{" "}
            <b>{vps?.memTotal ? `${(vps.memUsed / 1e9).toFixed(1)}` : "—"}</b>
            {vps?.memTotal ? ` / ${(vps.memTotal / 1e9).toFixed(0)} gb` : ""}
          </span>
          {vps && vps.diskTotal > 0 ? (
            <span>
              <span style={{ color: "var(--mute)" }}>disk</span>{" "}
              <b>{Math.round((vps.diskUsed / vps.diskTotal) * 100)}%</b>
            </span>
          ) : null}
          {vps && vps.uptimeS > 0 ? (
            <span>
              <span style={{ color: "var(--mute)" }}>up</span>{" "}
              <b>{Math.floor(vps.uptimeS / 86400)}d</b>
            </span>
          ) : null}
          {vps && (
            <span>
              <span style={{ color: "var(--mute)" }}>this month</span>{" "}
              <b>${vps.monthSpend.toFixed(2)}</b>
              {vps.budgetUsd ? ` / $${vps.budgetUsd}` : ""}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surf)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        boxShadow: "var(--shadow)",
        padding: "15px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function RunsTimeline({
  runs,
  now,
  byId,
}: {
  runs: OSDesktop["runs"];
  now: Date;
  byId: Map<AgentKey, OSAgent>;
}) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const nowPct = (mins / 1440) * 100;
  return (
    <div style={{ position: "relative", height: 50 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 10,
          height: 2,
          background: "var(--track)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: `${nowPct}%`,
          top: 10,
          height: 2,
          background: "var(--mute)",
        }}
      />
      {runs.map((r, i) => {
        const col = `var(${AGENT_HUE_VAR[r.agent]})`;
        const done = r.status === "done";
        const missed = r.status === "missed";
        return (
          <div
            key={`${r.name}-${i}`}
            style={{
              position: "absolute",
              left: `${(r.minutes / 1440) * 100}%`,
              top: 4,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: `2px solid ${missed ? "var(--bad)" : col}`,
                background: done ? col : "var(--surf)",
              }}
            />
            <span
              className="os-mono"
              style={{
                fontSize: 10,
                color: "var(--mute)",
                whiteSpace: "nowrap",
              }}
            >
              {String(Math.floor(r.minutes / 60)).padStart(2, "0")}:00
            </span>
            <span
              style={{ fontSize: 10.5, whiteSpace: "nowrap", marginTop: -3 }}
            >
              {byId.get(r.agent)?.name ?? cap(r.agent)}
            </span>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: `${nowPct}%`,
          top: 0,
          width: 2,
          height: 22,
          background: "var(--accent)",
          boxShadow: "0 0 10px var(--accent)",
        }}
      />
    </div>
  );
}

// the map svg — grid, districts, nodes (cost ring + status), links + packets.
// v3 §7: the heat glow is gated on the heat-map toggle; the link edge labels and
// the travelling packets are gated on the data-links toggle (the edge lines
// themselves stay — only the "data" overlay comes off).
function CityMap({
  vp,
  agents,
  heat,
  links,
}: {
  vp: { w: number; h: number };
  agents: OSAgent[];
  heat: boolean;
  links: boolean;
}) {
  const { w, h } = vp;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const pos: Record<string, [number, number]> = {};
  for (const a of agents) pos[a.id] = [cx + OFF[a.id][0], cy + OFF[a.id][1]];

  const curve = (a: [number, number], b: [number, number], bend: number) => {
    const [x1, y1] = a;
    const [x2, y2] = b;
    const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
    const my = (y1 + y2) / 2 + (x2 - x1) * bend;
    return {
      d: `M${x1.toFixed(0)} ${y1.toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}`,
      lx: (x1 + 2 * mx + x2) / 4,
      ly: (y1 + 2 * my + y2) / 4,
    };
  };
  const curves = EDGES.map(([a, b], i) => ({
    ...curve(pos[a], pos[b], a === "scribe" ? 0.16 : 0.14),
    id: `${a}-${b}`,
    a,
    label: EDGES[i][2],
    dur: 2.6 + (i % 4) * 0.6,
    begin: i * 0.41,
  })).filter((c) => pos[c.a]);

  const districts = [
    { x: cx - 380, y: cy - 270, w: 230, h: 470, label: "FRONT DESK" },
    { x: cx + 140, y: cy - 262, w: 245, h: 200, label: "MARKETING" },
    { x: cx + 150, y: cy + 30, w: 240, h: 190, label: "DEV" },
  ];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: 0, top: 0 }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="osCells"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="8"
            y="8"
            width="16"
            height="16"
            rx="3"
            style={{ fill: "var(--cell)" }}
          />
        </pattern>
        {agents.map((a) => (
          <radialGradient key={a.id} id={`heat-${a.id}`}>
            <stop
              offset="0%"
              stopColor={`oklch(0.7 0.15 ${HUE[a.id as Exclude<AgentKey, "you">]} / ${a.status === "working" ? 0.22 : 0.08})`}
            />
            <stop
              offset="100%"
              stopColor={`oklch(0.7 0.15 ${HUE[a.id as Exclude<AgentKey, "you">]} / 0)`}
            />
          </radialGradient>
        ))}
      </defs>
      <rect width="100%" height="100%" fill="url(#osCells)" />
      {/* heat glow per agent (v3 §7: gated on the heat-map toggle) */}
      {heat &&
        agents.map((a) => (
          <circle
            key={a.id}
            cx={pos[a.id][0]}
            cy={pos[a.id][1]}
            r={170}
            fill={`url(#heat-${a.id})`}
          />
        ))}
      {/* districts */}
      <g
        fill="none"
        strokeWidth="1.6"
        strokeDasharray="5 8"
        style={{ stroke: "var(--mute)" }}
        opacity="0.55"
      >
        {districts.map((d) => (
          <rect
            key={d.label}
            x={d.x}
            y={d.y}
            width={d.w}
            height={d.h}
            rx="40"
          />
        ))}
        <circle cx={cx} cy={cy - 20} r="112" />
      </g>
      <g
        fontFamily="var(--font-jbmono), monospace"
        fontSize="11.5"
        letterSpacing="1.4"
        style={{ fill: "var(--mute)" }}
      >
        {districts.map((d) => (
          <text key={d.label} x={d.x + 22} y={d.y + 26}>
            {d.label}
          </text>
        ))}
        <text x={cx} y={cy - 140} textAnchor="middle">
          COMMAND
        </text>
      </g>
      {/* links + labels + packets */}
      <g
        fill="none"
        strokeWidth="1.8"
        style={{ stroke: "var(--mute)" }}
        opacity="0.5"
      >
        {curves.map((c) => (
          <path key={`l-${c.id}`} d={c.d} />
        ))}
      </g>
      {links && (
        <g
          fontFamily="var(--font-jbmono), monospace"
          fontSize="10.5"
          textAnchor="middle"
          style={{ fill: "var(--soft)" }}
        >
          {curves
            .filter((c) => c.label)
            .map((c) => (
              <text
                key={`t-${c.id}`}
                x={c.lx.toFixed(0)}
                y={(c.ly - 8).toFixed(0)}
              >
                {c.label}
              </text>
            ))}
        </g>
      )}
      {links &&
        curves.map((c) => (
          <rect
            key={`p-${c.id}`}
            x="-7"
            y="-5"
            width="14"
            height="10"
            rx="2.5"
            fill={`var(${AGENT_HUE_VAR[c.a as AgentKey]})`}
          >
            <animateMotion
              dur={`${c.dur}s`}
              begin={`${c.begin}s`}
              repeatCount="indefinite"
              rotate="auto"
              path={c.d}
            />
          </rect>
        ))}
      {/* nodes */}
      {agents.map((a) => {
        const [nx, ny] = pos[a.id];
        const col = `var(${AGENT_HUE_VAR[a.id]})`;
        return (
          <g key={a.id} transform={`translate(${nx} ${ny})`}>
            {a.status === "working" && (
              <circle r="40" fill="none" stroke={col} strokeWidth="2">
                <animate
                  attributeName="r"
                  from="40"
                  to="84"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.55"
                  to="0"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle r="41" style={{ fill: "var(--surf)" }} />
            <circle
              r="41"
              fill="none"
              strokeWidth="4"
              style={{ stroke: "var(--track)" }}
            />
            <circle
              r="41"
              fill="none"
              stroke={col}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${((RING_C * a.ringPct) / 100).toFixed(1)} ${RING_C.toFixed(1)}`}
              transform="rotate(-90)"
            />
          </g>
        );
      })}
    </svg>
  );
}
