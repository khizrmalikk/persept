"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addBacklogItem,
  backlogDoneFromForm,
  backlogDropFromForm,
  backlogReopenFromForm,
  dismissIdea,
  sendAgentCommand,
} from "@/lib/workforce/actions";
import {
  BACKLOG_COLUMNS,
  COMMAND_TABS,
  type OSBacklogCard,
  type OSCommand,
  PRIORITY_DOT,
} from "../../_data/command-types";
import { AGENT_HUE_VAR, AGENT_TINT_VAR } from "../../_data/windows";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { StaleNotice } from "../StaleNotice";

const col = (a: AgentKey) => `var(${AGENT_HUE_VAR[a]})`;
const tint = (a: AgentKey) => `var(${AGENT_TINT_VAR[a]})`;
const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
const nm = (a: AgentKey) => (a === "you" ? "you" : cap(a));
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function formOf(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

export function Command({ data }: { data: OSCommand }) {
  const os = useOS();
  const router = useRouter();
  const [tab, setTab] = useState<string>(os.sub.tab ?? "today");

  useEffect(() => {
    if (os.sub.tab) setTab(os.sub.tab);
  }, [os.sub.tab]);

  const refresh = (p: Promise<unknown>, toast?: string) =>
    p.then(() => {
      router.refresh();
      if (toast) os.showToast(toast);
    });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {COMMAND_TABS.map(([k, n]) => {
          const on = tab === k;
          const badge =
            k === "backlog"
              ? data.backlog.filter((b) => b.column !== "done").length
              : k === "ideas"
                ? data.ideas.filter((i) => i.isNew).length
                : 0;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
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
              {badge > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: "var(--surf2)",
                    color: "var(--soft)",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <span
          className="os-mono"
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--mute)",
            whiteSpace: "nowrap",
          }}
        >
          STATE.md
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: 18,
        }}
      >
        {tab === "today" && <Today data={data} />}
        {tab === "backlog" && (
          <Backlog
            data={data}
            onAdd={(title, owner) =>
              refresh(
                addBacklogItem(formOf({ title, owner })),
                "added to the backlog",
              )
            }
            onDone={(id) =>
              refresh(backlogDoneFromForm(formOf({ id })), "marked done")
            }
            onDrop={(id) =>
              refresh(backlogDropFromForm(formOf({ id })), "dropped")
            }
            onReopen={(id) =>
              refresh(backlogReopenFromForm(formOf({ id })), "reopened")
            }
          />
        )}
        {tab === "ideas" && (
          <Ideas
            data={data}
            onPromote={(i) =>
              refresh(
                addBacklogItem(
                  formOf({
                    title: i.title,
                    owner: i.by === "you" ? "chief" : i.by,
                  }),
                ),
                "moved to the backlog",
              )
            }
            onPark={(id) => refresh(dismissIdea(id), "parked")}
          />
        )}
        {tab === "review" && (
          <Review
            data={data}
            onRun={() => {
              refresh(
                sendAgentCommand(
                  "chief",
                  "write the weekly workforce review now, exactly as in AGENTS.md",
                ),
              );
              os.showToast(
                "Chief is running the review. it lands here shortly",
              );
            }}
          />
        )}
        {tab === "schedule" && <Schedule data={data} />}
      </div>
    </div>
  );
}

// ── today ─────────────────────────────────────────────────────────────────────
function Today({ data }: { data: OSCommand }) {
  const os = useOS();
  const STB: Record<string, [string, string]> = {
    working: ["oklch(0.72 0.17 150 / 0.16)", "var(--ok)"],
    waiting: ["oklch(0.8 0.14 70 / 0.2)", "var(--ambink)"],
    idle: ["var(--surf2)", "var(--mute)"],
    soon: ["var(--surf2)", "var(--mute)"],
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <StaleNotice text={data.staleNotice} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* state tiles + health */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {data.stateTiles.map((s) => (
              <button
                key={s.key}
                type="button"
                disabled={!s.win}
                onClick={() =>
                  s.win && os.open(s.win as never, s.tab ? { tab: s.tab } : {})
                }
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: s.accent
                    ? "oklch(0.8 0.14 70 / 0.12)"
                    : "transparent",
                  border: "1px solid var(--line)",
                  cursor: s.win ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  textAlign: "left",
                  color: "var(--ink)",
                }}
              >
                <span
                  className="os-mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: s.accent ? "var(--ambink)" : "var(--mute)",
                  }}
                >
                  {s.label}
                </span>
                <span
                  className="os-display"
                  style={{ fontWeight: 800, fontSize: 32, lineHeight: 1 }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.sub}
                </span>
              </button>
            ))}
          </div>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>health</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--soft)",
                  whiteSpace: "nowrap",
                }}
              >
                things the system can see are off
              </span>
            </div>
            {data.health.length === 0 ? (
              <span
                style={{ fontSize: 13, color: "var(--mute)", padding: "8px 0" }}
              >
                all clear.
              </span>
            ) : (
              data.health.map((h) => (
                <div
                  key={h.text}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "var(--bad)",
                      flex: "none",
                    }}
                  />
                  <span style={{ fontSize: 13.5, lineHeight: 1.4, flex: 1 }}>
                    {h.text}
                  </span>
                  {h.cta && (
                    <button
                      type="button"
                      onClick={() =>
                        h.win &&
                        os.open(h.win as never, h.tab ? { tab: h.tab } : {})
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 11px",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        background: "transparent",
                        color: "var(--ink)",
                      }}
                    >
                      {h.cta}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* the team right now */}
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              the team right now
            </span>
            <span style={{ fontSize: 12, color: "var(--soft)" }}>
              tap to open
            </span>
          </div>
          {data.team.map((a) => {
            const [bg, fg] = STB[a.status] ?? STB.idle;
            const perDay = a.budgetUsd ? a.budgetUsd / 30 : 0;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => os.openAgent(a.id)}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderTop: "1px solid var(--line)",
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  color: "var(--ink)",
                }}
              >
                <Persona agent={a.id} size={36} status={a.status} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                      {a.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: bg,
                        color: fg,
                      }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: "var(--soft)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.task || "nothing running"}
                  </span>
                </div>
                <div
                  style={{
                    width: 54,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: "flex-end",
                  }}
                >
                  <span
                    className="os-mono"
                    style={{ fontSize: 10.5, color: "var(--mute)" }}
                  >
                    ${a.costToday.toFixed(0)}
                    {perDay ? `/${perDay.toFixed(0)}` : ""}
                  </span>
                  <div
                    style={{
                      width: 54,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--track)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, a.ringPct)}%`,
                        borderRadius: 2,
                        background: col(a.id),
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* today's brief */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "var(--t-chief)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Persona agent="chief" size={30} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                today&apos;s brief
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
              {data.brief ??
                "Chief's brief appears here each morning once STATE.md is written."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── backlog ───────────────────────────────────────────────────────────────────
function Backlog({
  data,
  onAdd,
  onDone,
  onDrop,
  onReopen,
}: {
  data: OSCommand;
  onAdd: (title: string, owner: string) => void;
  onDone: (id: string) => void;
  onDrop: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const [newT, setNewT] = useState("");
  const [owner, setOwner] = useState<AgentKey>("chief");
  const [filter, setFilter] = useState<string>("all");
  const add = () => {
    if (!newT.trim()) return;
    onAdd(newT.trim(), owner);
    setNewT("");
  };
  const items = data.backlog.filter(
    (b) => filter === "all" || b.owner === filter,
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 380,
            padding: "6px 6px 6px 14px",
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
          }}
        >
          <input
            value={newT}
            onChange={(e) => setNewT(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="new backlog item…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              minWidth: 0,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--mute)" }}>for</span>
          {data.owners.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOwner(o)}
              title={nm(o)}
              style={{
                borderRadius: "50%",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
                opacity: owner === o ? 1 : 0.45,
                boxShadow: owner === o ? `0 0 0 2px ${col(o)}` : "none",
              }}
            >
              <Persona agent={o} size={24} />
            </button>
          ))}
          <button
            type="button"
            onClick={add}
            style={{
              padding: "7px 13px",
              borderRadius: 9,
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            add
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", ...data.owners] as string[]).map((f) => {
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 12,
                  padding: "6px 11px",
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  background: on ? "var(--ink)" : "transparent",
                  color: on ? "var(--bg)" : "var(--soft)",
                  whiteSpace: "nowrap",
                }}
              >
                {f === "all" ? "everyone" : nm(f as AgentKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 12,
          alignItems: "start",
        }}
      >
        {BACKLOG_COLUMNS.map((c) => {
          const colItems = items.filter((b) => b.column === c.key);
          return (
            <div
              key={c.key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: 12,
                borderRadius: 16,
                background: "var(--surf2)",
                minHeight: 420,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "2px 4px",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>
                  {c.label}
                </span>
                <span
                  className="os-mono"
                  style={{ fontSize: 11, color: "var(--mute)" }}
                >
                  {colItems.length}
                </span>
              </div>
              {colItems.length === 0 ? (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--mute)",
                    padding: "12px 4px",
                    lineHeight: 1.4,
                  }}
                >
                  {c.empty}
                </div>
              ) : (
                colItems.map((b) => (
                  <BacklogCard
                    key={b.id}
                    b={b}
                    onDone={onDone}
                    onDrop={onDrop}
                    onReopen={onReopen}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function BacklogCard({
  b,
  onDone,
  onDrop,
  onReopen,
}: {
  b: OSBacklogCard;
  onDone: (id: string) => void;
  onDrop: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: 13,
        borderRadius: 13,
        background: "var(--surf)",
        border: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {b.workforce && (
        <span
          className="os-mono"
          style={{
            alignSelf: "flex-start",
            fontSize: 9.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "2px 7px",
            borderRadius: 5,
            background: "var(--t-chief)",
            color: "var(--c-chief)",
          }}
        >
          workforce
        </span>
      )}
      <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
        {b.title}
      </span>
      {b.detail && (
        <span style={{ fontSize: 12, color: "var(--soft)", lineHeight: 1.35 }}>
          {b.detail}
        </span>
      )}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}
      >
        <Persona agent={b.owner} size={22} />
        <span style={{ fontSize: 12, fontWeight: 600, color: col(b.owner) }}>
          {nm(b.owner)}
        </span>
        {b.due && (
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
            · {b.due}
          </span>
        )}
        <span
          title="priority"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: PRIORITY_DOT[b.priority],
          }}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {b.column === "done" ? (
            <button
              type="button"
              onClick={() => onReopen(b.id)}
              title="reopen"
              style={miniBtn}
            >
              ↺
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onDone(b.id)}
                title="mark done"
                style={miniBtn}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => onDrop(b.id)}
                title="drop"
                style={miniBtn}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
const miniBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 7,
  border: "1px solid var(--line)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 12,
  color: "var(--soft)",
  background: "transparent",
};

// ── ideas ─────────────────────────────────────────────────────────────────────
function Ideas({
  data,
  onPromote,
  onPark,
}: {
  data: OSCommand;
  onPromote: (i: OSCommand["ideas"][number]) => void;
  onPark: (id: string) => void;
}) {
  return (
    <div
      style={{
        maxWidth: 880,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--soft)", marginBottom: 6 }}>
        ideas from you and the team. promote one and Chief turns it into a
        backlog item.
      </span>
      {data.ideas.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px dashed var(--line)",
            fontSize: 13.5,
            color: "var(--soft)",
          }}
        >
          no ideas yet. they appear as the team suggests things.
        </div>
      ) : (
        data.ideas.map((i) => (
          <div
            key={i.id}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--line)",
              opacity: i.isNew ? 1 : 0.5,
            }}
          >
            <Persona agent={i.by} size={40} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                {i.title}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                {i.who}
                {i.why ? ` · ${i.why}` : ""}
              </span>
            </div>
            {i.isNew ? (
              <>
                <button
                  type="button"
                  onClick={() => onPromote(i)}
                  style={{
                    padding: "8px 13px",
                    borderRadius: 9,
                    background: "var(--ink)",
                    color: "var(--bg)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  promote to backlog
                </button>
                <button
                  type="button"
                  onClick={() => onPark(i.id)}
                  style={{
                    padding: "8px 13px",
                    borderRadius: 9,
                    border: "1px solid var(--line)",
                    fontSize: 12.5,
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                  }}
                >
                  park
                </button>
              </>
            ) : (
              <span
                style={{ fontSize: 12, fontWeight: 600, color: "var(--soft)" }}
              >
                {i.status}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── weekly review ─────────────────────────────────────────────────────────────
function Review({ data, onRun }: { data: OSCommand; onRun: () => void }) {
  return (
    <div
      style={{
        maxWidth: 880,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            className="os-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mute)",
              marginBottom: 6,
            }}
          >
            {data.review
              ? `improvements/${data.review.title}.md`
              : "weekly review"}
          </div>
          <div
            className="os-display"
            style={{ fontWeight: 800, fontSize: 36, lineHeight: 1 }}
          >
            {data.review ? data.review.title : "no review yet"}
          </div>
        </div>
        <button
          type="button"
          onClick={onRun}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            whiteSpace: "nowrap",
          }}
        >
          run review now
        </button>
      </div>
      {data.review ? (
        <Markdown text={data.review.markdown} />
      ) : (
        <div style={{ fontSize: 14, color: "var(--soft)", lineHeight: 1.5 }}>
          Chief writes a weekly review to improvements/. run it now and it lands
          here.
        </div>
      )}
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {lines.map((raw, i) => {
        const l = raw.trim();
        const key = `${i}-${l.slice(0, 12)}`;
        if (!l) return <div key={key} style={{ height: 8 }} />;
        if (/^#{1,2}\s/.test(l))
          return (
            <div
              key={key}
              className="os-display"
              style={{ fontWeight: 800, fontSize: 18, marginTop: 10 }}
            >
              {l.replace(/^#+\s*/, "")}
            </div>
          );
        if (/^#{3,}\s/.test(l))
          return (
            <div
              key={key}
              style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}
            >
              {l.replace(/^#+\s*/, "")}
            </div>
          );
        if (/^[-*]\s/.test(l))
          return (
            <div
              key={key}
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                paddingLeft: 14,
                color: "var(--soft)",
              }}
            >
              • {l.replace(/^[-*]\s*/, "")}
            </div>
          );
        return (
          <div key={key} style={{ fontSize: 14, lineHeight: 1.55 }}>
            {l}
          </div>
        );
      })}
    </div>
  );
}

// ── schedule ──────────────────────────────────────────────────────────────────
function Schedule({ data }: { data: OSCommand }) {
  const dotFor = (s: string) =>
    s === "done" ? "var(--ok)" : s === "missed" ? "var(--bad)" : "var(--mute)";
  if (data.runs.length === 0)
    return (
      <div style={{ fontSize: 13.5, color: "var(--soft)", padding: 8 }}>
        no scheduled runs yet. they appear from each agent&apos;s cron config.
      </div>
    );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0,1fr))",
        border: "1px solid var(--line)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {DAYS.map((d, di) => {
        const dayRuns = data.runs
          .filter((r) => r.day === di)
          .sort((a, b) => a.time.localeCompare(b.time));
        return (
          <div
            key={d}
            style={{
              borderLeft: di ? "1px solid var(--line)" : "none",
              minHeight: 320,
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--line)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {d}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 8,
              }}
            >
              {dayRuns.map((r, ri) => (
                <div
                  key={`${r.time}-${ri}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 8px",
                    borderRadius: 9,
                    background: tint(r.agent),
                    borderLeft: `3px solid ${col(r.agent)}`,
                  }}
                >
                  <Persona agent={r.agent} size={18} />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      className="os-mono"
                      style={{ fontSize: 10, color: "var(--mute)" }}
                    >
                      {r.time}
                    </span>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: dotFor(r.status),
                      flex: "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
