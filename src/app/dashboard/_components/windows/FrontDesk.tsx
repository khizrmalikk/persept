"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState } from "react";
import {
  acceptLead,
  approveFromForm,
  approveProposal,
  dismissLead,
  requestProposalEdits,
  sendAgentCommand,
  sendOutboundAsOwner,
  sendProposalViaHunter,
  setProposalStatus,
  undoLeadAccept,
  undoLeadDismiss,
} from "@/lib/workforce/actions";
import type { OSApproval } from "../../_data/approvals";
import {
  copyStatusStyle,
  type OSCopyRow,
  type OSFlightRow,
} from "../../_data/copy-types";
import {
  OS_STAGES,
  type OSDeal,
  type OSFrontDesk,
  type OSLead,
  type OSProposalRow,
  type OSStage,
  PROPOSAL_STEPS,
} from "../../_data/frontdesk-types";
import { AGENT_HUE_VAR, AGENT_TINT_VAR } from "../../_data/windows";
import { InFlightStrip } from "../InFlightStrip";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { cur, money0, shortDay } from "./Money";

// Front desk — the sales funnel. pipeline / research desk / conversations /
// proposals + a deal side-panel. Reads loadFrontDesk() data; mutations go through
// the real actions (acceptLead / dismissLead / approve / sendOutboundAsOwner /
// sendAgentCommand) then router.refresh(). The money tab moved to the war room
// (day-42); the deal panel still shows this deal's Stripe payments, so it reuses
// the money formatters from ./Money.

const TABS: [string, string][] = [
  ["pipeline", "pipeline"],
  ["leads", "research desk"],
  ["conversations", "conversations"],
  ["proposals", "proposals"],
];
const EMPTY: Record<OSStage, string> = {
  prospect: "no prospects yet. accept a lead from Scout.",
  contacted: "nobody contacted yet",
  replied: "no replies yet",
  call: "no calls booked",
  proposal: "no proposals waiting",
  won: "no wins yet. soon.",
};
const PSC: Record<string, string> = {
  draft: "var(--soft)",
  approved: "var(--ambink)",
  sent: "var(--c-hunter)",
  viewed: "var(--c-hunter)",
  accepted: "var(--ok)",
  declined: "var(--bad)",
};
const fmt = (n: number) => n.toLocaleString("en-US");
const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
const ini = (n: string) =>
  n
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || n.slice(0, 2).toUpperCase();

// day-47: one piece of finished copy for the deal panel — expands to the actual
// words that were sent, with its status chip.
function DealCopyRow({ r }: { r: OSCopyRow }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bg, fg] = copyStatusStyle(r.status);
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--line)",
        padding: "10px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            fontSize: 12.5,
            padding: 0,
          }}
        >
          {open ? "▾ " : "▸ "}
          {r.subject || r.kind || "message"}
          <span style={{ color: "var(--mute)" }}>
            {" "}
            · {[r.channel, r.when].filter(Boolean).join(" · ")}
          </span>
        </button>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            background: bg,
            color: fg,
            whiteSpace: "nowrap",
          }}
        >
          {r.status}
        </span>
      </div>
      {open && (
        <>
          <div
            style={{
              marginTop: 8,
              padding: "9px 11px",
              borderRadius: 10,
              background: "var(--surf2)",
              fontSize: 12.5,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {r.body || "no text."}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(r.body).then(
                () => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                },
                () => {},
              );
            }}
            style={{
              marginTop: 8,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "transparent",
              color: copied ? "var(--ok)" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {copied ? "copied" : "copy text"}
          </button>
        </>
      )}
    </div>
  );
}

export function FrontDesk({
  data,
  approvals,
}: {
  data: OSFrontDesk;
  approvals: OSApproval[];
}) {
  const os = useOS();
  const router = useRouter();
  const [tab, setTab] = useState("pipeline");
  const [deal, setDeal] = useState<string | null>(null);
  const [prop, setProp] = useState<string | null>(null); // open proposal id
  const [conv, setConv] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (os.sub.tab) setTab(os.sub.tab);
    if (os.sub.deal) {
      setDeal(os.sub.deal);
      setTab("pipeline");
    }
  }, [os.sub.tab, os.sub.deal]);

  const live = approvals.filter((a) => !a.held);
  const dealHasAp = (d: OSDeal) =>
    live.some((a) => a.company?.toLowerCase() === d.company.toLowerCase());
  const refresh = (p: Promise<unknown>) => p.then(() => router.refresh());

  const curDeal = deal ? data.deals.find((d) => d.key === deal) : null;
  const curProp = prop
    ? (data.proposals.find((p) => p.id === prop) ?? null)
    : null;

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
        {TABS.map(([k, n]) => {
          const on = tab === k;
          const badge = k === "leads" ? data.forYou.length : 0;
          const badgeBad = false;
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
                    background: badgeBad ? "var(--bad)" : "var(--surf)",
                    color: badgeBad ? "var(--bg)" : "var(--soft)",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12.5,
            color: "var(--soft)",
            whiteSpace: "nowrap",
          }}
        >
          <span>
            open pipeline{" "}
            <b style={{ color: "var(--ink)" }}>AED {fmt(data.pipelineValue)}</b>
          </span>
          <span>
            won this month{" "}
            <b style={{ color: "var(--ink)" }}>AED {fmt(data.wonThisMonth)}</b>
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {tab === "pipeline" && (
          <Pipeline
            deals={data.deals}
            dealHasAp={dealHasAp}
            onOpen={setDeal}
            inFlight={data.inFlight}
            onOpenApproval={(id) => os.open("approvals", { id: String(id) })}
          />
        )}
        {tab === "leads" && (
          <ResearchDesk
            data={data}
            onAccept={(id) => refresh(acceptLead(id))}
            onDismiss={(id) => refresh(dismissLead(id))}
            onUndoDismiss={(id) => refresh(undoLeadDismiss(id))}
            onUndoAccept={(id, company) =>
              refresh(undoLeadAccept(id, company)).then(() =>
                os.showToast("dismissed — Hunter will park it"),
              )
            }
          />
        )}
        {tab === "conversations" && (
          <Conversations
            data={data}
            approvals={live}
            conv={conv}
            setConv={setConv}
            reply={reply}
            setReply={setReply}
            onSend={(to, body) =>
              refresh(
                sendOutboundAsOwner(formOf({ channel: "email", to, body })),
              ).then(() => os.showToast(`sent to ${to}`))
            }
            onApprove={(id, agent) =>
              refresh(approveFromForm(formOf({ id: String(id), agent })))
            }
            onReview={(id) => os.open("approvals", { id: String(id) })}
            onOpenDeal={(k) => setDeal(k)}
          />
        )}
        {tab === "proposals" && (
          <Proposals data={data} onOpenProposal={(id) => setProp(id)} />
        )}

        {curProp && (
          <ProposalPanel
            p={curProp}
            onClose={() => setProp(null)}
            onApprove={() =>
              refresh(approveProposal(curProp.id)).then(() =>
                os.showToast("approved — ready to send"),
              )
            }
            onRequestEdits={(note) =>
              refresh(requestProposalEdits(curProp.id, note)).then(() =>
                os.showToast("sent back to Scribe"),
              )
            }
            onSend={(recipient) =>
              refresh(sendProposalViaHunter(curProp.id, recipient)).then(() =>
                os.showToast("asked Hunter to send"),
              )
            }
            onDecision={(d) =>
              refresh(setProposalStatus(curProp.id, d)).then(() =>
                os.showToast(
                  d === "accepted" ? "marked accepted" : "marked declined",
                ),
              )
            }
            onDiscuss={() => os.openDrawer("scribe")}
          />
        )}

        {curDeal && (
          <DealPanel
            deal={curDeal}
            data={data}
            approvals={live}
            onClose={() => setDeal(null)}
            onApproval={(id) => os.open("approvals", { id: String(id) })}
            onAskHunter={() => {
              refresh(
                sendAgentCommand("hunter", `follow up with ${curDeal.company}`),
              );
              os.openDrawer("hunter");
            }}
            onAskPercy={() => {
              refresh(
                sendAgentCommand(
                  "percy",
                  `what's the next step on ${curDeal.company}?`,
                ),
              );
              os.openDrawer("percy");
            }}
            onOpenConv={() => {
              setConv(curDeal.key);
              setTab("conversations");
              setDeal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function formOf(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

function Pipeline({
  deals,
  dealHasAp,
  onOpen,
  inFlight,
  onOpenApproval,
}: {
  deals: OSDeal[];
  dealHasAp: (d: OSDeal) => boolean;
  onOpen: (k: string) => void;
  inFlight: OSFlightRow[];
  onOpenApproval: (id: number) => void;
}) {
  // day-47: the "new" (prospect) column can filter to just the prospects that
  // arrived on their own, from Hunter's qualifying.
  const [fromHunterOnly, setFromHunterOnly] = useState(false);
  const hunterInNew = deals.filter(
    (d) => d.stage === "prospect" && d.fromHunter,
  ).length;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        padding: "16px 18px",
      }}
    >
      <InFlightStrip rows={inFlight} onOpenApproval={onOpenApproval} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(190px,1fr))",
          gap: 10,
          alignItems: "start",
        }}
      >
        {OS_STAGES.map(({ key, label }) => {
          const isNew = key === "prospect";
          const items = deals.filter(
            (d) =>
              d.stage === key && (!isNew || !fromHunterOnly || d.fromHunter),
          );
          const sum = Math.round(items.reduce((s, d) => s + d.value, 0) / 1000);
          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 10,
                borderRadius: 16,
                background: "var(--surf2)",
                minHeight: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "2px 4px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: key === "won" ? "var(--ok)" : "var(--ink)",
                  }}
                >
                  {label}
                </span>
                <span
                  className="os-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--mute)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {items.length} · {sum}k
                </span>
              </div>
              {isNew && hunterInNew > 0 && (
                <button
                  type="button"
                  onClick={() => setFromHunterOnly((v) => !v)}
                  title="prospects Hunter qualified on his own"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    alignSelf: "flex-start",
                    padding: "3px 9px 3px 4px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${fromHunterOnly ? "var(--c-hunter)" : "var(--line)"}`,
                    background: fromHunterOnly
                      ? "var(--t-hunter)"
                      : "transparent",
                    color: fromHunterOnly ? "var(--c-hunter)" : "var(--soft)",
                  }}
                >
                  <Persona agent="hunter" size={16} />
                  from Hunter&apos;s qualifying · {hunterInNew}
                </button>
              )}
              {items.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--mute)",
                    padding: "6px 4px",
                    lineHeight: 1.4,
                  }}
                >
                  {EMPTY[key]}
                </div>
              ) : (
                items.map((d) => {
                  const needs = dealHasAp(d);
                  return (
                    <button
                      key={d.key}
                      data-pc={`prospect-${d.key}`}
                      type="button"
                      onClick={() => onOpen(d.key)}
                      style={{
                        padding: 12,
                        borderRadius: 13,
                        background: "var(--surf)",
                        border: `1px solid ${needs ? "oklch(0.8 0.14 70 / 0.5)" : "var(--line)"}`,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        textAlign: "left",
                        color: "var(--ink)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          lineHeight: 1.25,
                        }}
                      >
                        {d.company}
                      </span>
                      {(d.contact || d.role) && (
                        <span style={{ fontSize: 12, color: "var(--soft)" }}>
                          {[d.contact, d.role].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <span
                        className="os-display"
                        style={{ fontWeight: 800, fontSize: 17 }}
                      >
                        AED {fmt(d.value)}
                      </span>
                      {d.lastLine && (
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "var(--soft)",
                            lineHeight: 1.35,
                          }}
                        >
                          {d.lastLine}{" "}
                          {d.lastWhen && (
                            <span style={{ color: "var(--mute)" }}>
                              · {d.lastWhen}
                            </span>
                          )}
                        </span>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <div style={{ display: "flex" }}>
                          {d.team.map((m) => (
                            <span
                              key={m}
                              style={{
                                marginRight: -5,
                                borderRadius: "50%",
                                boxShadow: "0 0 0 2px var(--surf)",
                              }}
                            >
                              <Persona agent={m} size={20} />
                            </span>
                          ))}
                        </div>
                        {needs && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: "oklch(0.8 0.14 70 / 0.2)",
                              color: "var(--ambink)",
                            }}
                          >
                            needs you
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── research desk ─────────────────────────────────────────────────────────────
// day-47: Hunter qualifies new leads; the owner watches and overrules. The top
// panel is only what he left for you; the rest is a log you can undo.
const FIT: Record<string, { color: string; label: string }> = {
  high: { color: "var(--ok)", label: "high fit" },
  medium: { color: "var(--soft)", label: "medium fit" },
  low: { color: "var(--mute)", label: "low fit" },
};

function FitChip({ fit }: { fit: OSLead["fit"] }) {
  const f = FIT[fit];
  if (!f) return null;
  return (
    <span
      className="os-mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        border: `1px solid ${f.color}`,
        color: f.color,
        whiteSpace: "nowrap",
      }}
    >
      {f.label}
    </span>
  );
}

function DecidedBy({ by }: { by: OSLead["decidedBy"] }) {
  if (by === "owner" || by === "")
    return <span style={{ fontSize: 11.5, color: "var(--mute)" }}>you</span>;
  return (
    <span
      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}
    >
      <Persona agent={by} size={16} />
      <span style={{ color: "var(--mute)" }}>{cap(by)}</span>
    </span>
  );
}

function ResearchDesk({
  data,
  onAccept,
  onDismiss,
  onUndoDismiss,
  onUndoAccept,
}: {
  data: OSFrontDesk;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onUndoDismiss: (id: string) => void;
  onUndoAccept: (id: string, company: string) => void;
}) {
  const maxSrc = Math.max(1, ...data.sources.map((s) => s.count));
  const t = data.leadsToday;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        padding: 18,
        display: "grid",
        gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
        gap: 18,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Persona agent="hunter" size={30} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>research desk</span>
        </div>
        <span
          style={{ fontSize: 12.5, color: "var(--soft)", lineHeight: 1.45 }}
        >
          Hunter qualifies new leads against the offer and the campaign
          audiences; you only see what he leaves.
        </span>
        <span
          className="os-mono"
          style={{ fontSize: 11, color: "var(--mute)" }}
        >
          accepted {t.accepted} · dismissed {t.dismissed} · left {t.left}
        </span>

        {/* for you — only what Hunter left, plus anything he never got to */}
        {data.forYou.length === 0 ? (
          <div
            style={{
              marginTop: 4,
              padding: 24,
              borderRadius: 16,
              border: "1px dashed var(--line)",
              fontSize: 13.5,
              color: "var(--soft)",
            }}
          >
            nothing waiting on you. Hunter is qualifying new leads as they land.
          </div>
        ) : (
          data.forYou.map((l) => (
            <div
              key={l.id}
              data-pc={`lead-${l.id}`}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "15px 16px",
                borderRadius: 16,
                border: "1px solid var(--line)",
                background: "var(--surf)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {l.company}
                  </span>
                  {l.what && (
                    <span style={{ fontSize: 12.5, color: "var(--mute)" }}>
                      {l.what}
                    </span>
                  )}
                  <FitChip fit={l.fit} />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "var(--t-scout)",
                      color: "var(--c-scout)",
                      fontWeight: 600,
                    }}
                  >
                    {l.signal}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--soft)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    via {l.src}
                  </span>
                </div>
                {l.reason ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                      color: "var(--ambink)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Persona agent="hunter" size={15} />
                    {l.reason}
                  </span>
                ) : l.notYetQualified ? (
                  <span style={{ fontSize: 12, color: "var(--mute)" }}>
                    not yet qualified
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onAccept(l.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 13px 8px 8px",
                  borderRadius: 10,
                  background: "var(--t-hunter)",
                  color: "var(--c-hunter)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Persona agent="hunter" size={20} />
                accept → Hunter
              </button>
              <button
                type="button"
                onClick={() => onDismiss(l.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  fontSize: 12.5,
                  cursor: "pointer",
                  color: "var(--soft)",
                  background: "transparent",
                }}
              >
                dismiss
              </button>
            </div>
          ))
        )}

        {/* leads Hunter has in hand right now — a line, not cards */}
        {data.withHunter > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 4px 2px",
              fontSize: 12,
              color: "var(--mute)",
            }}
          >
            <Persona agent="hunter" size={16} />
            with Hunter · {data.withHunter}
          </div>
        )}

        {/* decided recently — every accept/dismiss in the last 7 days */}
        {data.decidedRecently.length > 0 && (
          <>
            <span
              className="os-mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mute)",
                padding: "12px 4px 2px",
              }}
            >
              decided recently
            </span>
            {data.decidedRecently.map((l) => {
              const dismissed = l.status === "dismissed";
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: "var(--surf2)",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <b>{l.company}</b>
                      <FitChip fit={l.fit} />
                      <span
                        style={{
                          fontSize: 12,
                          color: dismissed ? "var(--mute)" : "var(--c-hunter)",
                        }}
                      >
                        {dismissed ? "dismissed" : "accepted → Hunter"}
                      </span>
                    </div>
                    {l.reason && (
                      <span style={{ fontSize: 12, color: "var(--soft)" }}>
                        {l.reason}
                      </span>
                    )}
                  </div>
                  <DecidedBy by={l.decidedBy} />
                  {l.decidedAt && (
                    <span style={{ fontSize: 11, color: "var(--mute)" }}>
                      {l.decidedAt}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      dismissed
                        ? onUndoDismiss(l.id)
                        : onUndoAccept(l.id, l.company)
                    }
                    title={
                      dismissed
                        ? "bring it back — stays with you, not Hunter"
                        : "dismiss — Hunter parks his row"
                    }
                    style={{
                      padding: "6px 11px",
                      borderRadius: 9,
                      border: "1px solid var(--line)",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "var(--soft)",
                      background: "transparent",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dismissed ? "undo" : "dismiss"}
                  </button>
                </div>
              );
            })}
          </>
        )}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>sources</span>
          <span
            style={{ fontSize: 12, color: "var(--soft)", whiteSpace: "nowrap" }}
          >
            recent
          </span>
        </div>
        {data.sources.length === 0 ? (
          <div
            style={{ fontSize: 12.5, color: "var(--mute)", padding: "8px 0" }}
          >
            sources appear as Scout sweeps them.
          </div>
        ) : (
          data.sources.map((s) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: "1px solid var(--line)",
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1 }}>{s.name}</span>
              <div
                style={{
                  width: 70,
                  height: 5,
                  borderRadius: 3,
                  background: "var(--track)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(s.count / maxSrc) * 100}%`,
                    borderRadius: 3,
                    background: "var(--c-scout)",
                  }}
                />
              </div>
              <b style={{ width: 24, textAlign: "right" }}>{s.count}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── conversations ─────────────────────────────────────────────────────────────
function Conversations({
  data,
  approvals,
  conv,
  setConv,
  reply,
  setReply,
  onSend,
  onApprove,
  onReview,
  onOpenDeal,
}: {
  data: OSFrontDesk;
  approvals: OSApproval[];
  conv: string | null;
  setConv: (k: string) => void;
  reply: string;
  setReply: (v: string) => void;
  onSend: (to: string, body: string) => void;
  onApprove: (id: number, agent: AgentKey) => void;
  onReview: (id: number) => void;
  onOpenDeal: (k: string) => void;
}) {
  const threads = data.threads;
  const active = threads.find((t) => t.key === conv) ?? threads[0] ?? null;
  const apFor = (company: string) =>
    approvals.filter(
      (a) =>
        a.kind === "email" &&
        a.company?.toLowerCase() === company.toLowerCase(),
    );

  if (threads.length === 0)
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "var(--mute)",
          fontSize: 13.5,
          textAlign: "center",
          padding: 24,
        }}
      >
        <span style={{ maxWidth: 320, lineHeight: 1.5 }}>
          no conversations yet. once Hunter emails a prospect, the thread
          appears here.
        </span>
      </div>
    );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "320px minmax(0,1fr)",
      }}
    >
      <div
        style={{
          borderRight: "1px solid var(--line)",
          overflow: "auto",
          padding: 10,
        }}
      >
        {threads.map((t) => {
          const on = active?.key === t.key;
          const hasAp = apFor(t.company).length > 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setConv(t.key)}
              style={{
                display: "flex",
                gap: 11,
                alignItems: "center",
                padding: "11px 10px",
                borderRadius: 12,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                border: "none",
                background: on ? "var(--surf2)" : "transparent",
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--surf2)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12.5,
                  fontWeight: 700,
                  flex: "none",
                }}
              >
                {ini(t.who)}
              </span>
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.who}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--mute)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.lastT}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--soft)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.company} · {t.lastText}
                </span>
              </span>
              {hasAp && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {active && (
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>{active.who}</span>
            <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
              {active.company}
            </span>
            <button
              type="button"
              onClick={() => onOpenDeal(active.key)}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                padding: "6px 11px",
                borderRadius: 999,
                background: "var(--surf2)",
                cursor: "pointer",
                border: "none",
                color: "var(--ink)",
              }}
            >
              open deal →
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {active.msgs.map((m, i) => {
              const them = m.by === "them";
              const hunter = m.by === "hunter";
              return (
                <div
                  key={`${m.t}-${i}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: them ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: 520,
                      padding: "11px 15px",
                      borderRadius: them
                        ? "16px 16px 16px 4px"
                        : "16px 16px 4px 16px",
                      background: them
                        ? "var(--surf2)"
                        : hunter
                          ? "var(--t-hunter)"
                          : "var(--ink)",
                      color: them || hunter ? "var(--ink)" : "var(--bg)",
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: "var(--mute)",
                    }}
                  >
                    {hunter && <Persona agent="hunter" size={16} />}
                    {them ? active.who : hunter ? "Hunter" : "you"} · {m.t}
                    {m.via ? ` · ${m.via}` : ""}
                  </span>
                </div>
              );
            })}
            {apFor(active.company).map((a) => (
              <div
                key={a.id}
                style={{
                  alignSelf: "flex-end",
                  maxWidth: 520,
                  padding: 14,
                  borderRadius: 14,
                  border: "1.5px dashed oklch(0.68 0.21 38)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ambink)",
                  }}
                >
                  <Persona agent="hunter" size={18} />
                  draft · waiting for your tap
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    color: "var(--soft)",
                  }}
                >
                  {a.body}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onApprove(a.id, a.agent)}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 9,
                      background: "var(--accent)",
                      color: "var(--accent-ink)",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    send
                  </button>
                  <button
                    type="button"
                    onClick={() => onReview(a.id)}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 9,
                      border: "1px solid var(--line)",
                      fontSize: 12.5,
                      cursor: "pointer",
                      background: "transparent",
                      color: "var(--ink)",
                    }}
                  >
                    review in approvals
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "0 16px 16px",
              padding: "8px 8px 8px 14px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              background: "var(--surf2)",
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                background: "var(--surf)",
                color: "var(--soft)",
                whiteSpace: "nowrap",
              }}
            >
              send as me
            </span>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && reply.trim()) {
                  onSend(active.who, reply.trim());
                  setReply("");
                }
              }}
              placeholder={`write to ${active.who} yourself…`}
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
            <button
              type="button"
              onClick={() => {
                if (reply.trim()) {
                  onSend(active.who, reply.trim());
                  setReply("");
                }
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
              }}
            >
              send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── proposals ─────────────────────────────────────────────────────────────────
function Proposals({
  data,
  onOpenProposal,
}: {
  data: OSFrontDesk;
  onOpenProposal: (id: string) => void;
}) {
  const cols = "1.4fr 1.2fr 1.6fr 0.6fr 0.8fr 0.6fr";
  return (
    <div
      style={{ position: "absolute", inset: 0, overflow: "auto", padding: 18 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Persona agent="scribe" size={28} />
        <span style={{ fontSize: 13, color: "var(--soft)" }}>
          Scribe writes and revises. Hunter sends once you approve. you see
          every view.
        </span>
      </div>
      {data.proposals.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px dashed var(--line)",
            fontSize: 13.5,
            color: "var(--soft)",
          }}
        >
          no proposals yet. they appear when Scribe writes one.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            className="os-mono"
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              gap: 12,
              padding: "10px 16px",
              fontSize: 10.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--mute)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span>client</span>
            <span>proposal</span>
            <span>status</span>
            <span>views</span>
            <span>value</span>
            <span>updated</span>
          </div>
          {data.proposals.map((p) => (
            <button
              key={p.id}
              data-pc={`proposal-${p.id}`}
              type="button"
              onClick={() => onOpenProposal(p.id)}
              title="open the draft"
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                gap: 12,
                alignItems: "center",
                padding: "13px 16px",
                borderBottom: "1px solid var(--line)",
                fontSize: 13.5,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                color: "var(--ink)",
              }}
            >
              <b>{p.company}</b>
              <span style={{ color: "var(--soft)" }}>{p.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {PROPOSAL_STEPS.map((n, j) => (
                  <span
                    key={n}
                    title={n}
                    style={{
                      width: 24,
                      height: 6,
                      borderRadius: 3,
                      background:
                        p.status === "declined" && j === 4
                          ? "var(--bad)"
                          : j <= p.stepIndex
                            ? p.status === "accepted"
                              ? "var(--ok)"
                              : "var(--c-scribe)"
                            : "var(--track)",
                    }}
                  />
                ))}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: PSC[p.status] ?? "var(--soft)",
                  }}
                >
                  {p.status}
                </span>
              </span>
              <span>{p.views}</span>
              <b>{p.value}</b>
              <span style={{ color: "var(--mute)", fontSize: 12.5 }}>
                {p.updated}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── proposal workspace (day-45) ───────────────────────────────────────────────
// read Scribe's draft, approve it, send it back for edits, send via Hunter, or
// mark the outcome. A slide-over so the proposals list stays behind it.
const PSTATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "draft · waiting on you", color: "var(--c-scribe)" },
  approved: { label: "approved · ready to send", color: "var(--ambink)" },
  sent: { label: "sent", color: "var(--c-hunter)" },
  viewed: { label: "viewed by them", color: "var(--c-hunter)" },
  accepted: { label: "accepted", color: "var(--ok)" },
  declined: { label: "declined", color: "var(--bad)" },
};

function ProposalPanel({
  p,
  onClose,
  onApprove,
  onRequestEdits,
  onSend,
  onDecision,
  onDiscuss,
}: {
  p: OSProposalRow;
  onClose: () => void;
  onApprove: () => void;
  onRequestEdits: (note: string) => void;
  onSend: (recipient: string) => void;
  onDecision: (d: "accepted" | "declined") => void;
  onDiscuss: () => void;
}) {
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const st = PSTATUS[p.status] ?? { label: p.status, color: "var(--mute)" };
  const isDraft = p.status === "draft";
  const sendable = p.status === "approved";
  const decidable = p.status === "sent" || p.status === "viewed";

  return (
    <>
      <button
        type="button"
        aria-label="close proposal"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          zIndex: 5,
          border: "none",
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 620,
          maxWidth: "92%",
          zIndex: 6,
          background: "var(--surf)",
          borderLeft: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header */}
        <div
          style={{
            flex: "none",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Persona agent="scribe" size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--soft)" }}>
                {p.company}
                {p.contact ? ` · ${p.contact}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--soft)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              close ✕
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 12,
              color: "var(--soft)",
            }}
          >
            <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
            <span>·</span>
            <span>{p.value}</span>
            {p.views > 0 && (
              <>
                <span>·</span>
                <span>
                  {p.views} view{p.views === 1 ? "" : "s"}
                </span>
              </>
            )}
            {p.validUntil && (
              <>
                <span>·</span>
                <span>valid until {p.validUntil}</span>
              </>
            )}
          </div>
        </div>

        {/* the draft */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 24px" }}>
          {p.markdown.trim() ? (
            <Markdown text={p.markdown} />
          ) : (
            <div style={{ fontSize: 13, color: "var(--mute)" }}>
              Scribe hasn&apos;t written the body yet.
            </div>
          )}
        </div>

        {/* send-back note */}
        {editing && (
          <div
            style={{
              flex: "none",
              padding: "12px 20px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="what should Scribe change? e.g. tighten the pricing section, add a timeline…"
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "var(--surf2)",
                color: "var(--ink)",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNote("");
                }}
                style={ghostBtn}
              >
                cancel
              </button>
              <button
                type="button"
                disabled={!note.trim()}
                onClick={() => {
                  onRequestEdits(note);
                  setEditing(false);
                  setNote("");
                }}
                style={{
                  ...primaryBtn,
                  opacity: note.trim() ? 1 : 0.5,
                  cursor: note.trim() ? "pointer" : "default",
                }}
              >
                send to Scribe
              </button>
            </div>
          </div>
        )}

        {/* action bar */}
        {!editing && (
          <div
            style={{
              flex: "none",
              padding: "12px 20px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {isDraft && (
              <button type="button" onClick={onApprove} style={primaryBtn}>
                approve draft
              </button>
            )}
            {sendable && (
              <button
                type="button"
                onClick={() => onSend(p.contact)}
                style={primaryBtn}
              >
                send via Hunter
              </button>
            )}
            {decidable && (
              <>
                <button
                  type="button"
                  onClick={() => onDecision("accepted")}
                  style={{ ...primaryBtn, background: "var(--ok)" }}
                >
                  mark accepted
                </button>
                <button
                  type="button"
                  onClick={() => onDecision("declined")}
                  style={ghostBtn}
                >
                  declined
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={ghostBtn}
            >
              send back for edits
            </button>
            <button type="button" onClick={onDiscuss} style={ghostBtn}>
              discuss with Scribe
            </button>
            {p.token && (
              <a
                href={`/p/${p.token}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "var(--soft)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                preview public page ↗
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const primaryBtn: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 10,
  background: "var(--ink)",
  color: "var(--bg)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  whiteSpace: "nowrap",
};
const ghostBtn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  background: "transparent",
  color: "var(--ink)",
  fontSize: 13,
  cursor: "pointer",
  border: "1px solid var(--line)",
  whiteSpace: "nowrap",
};

// lightweight markdown for the proposal body (headings, bullets, paragraphs).
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
              style={{ fontWeight: 800, fontSize: 19, marginTop: 12 }}
            >
              {l.replace(/^#+\s*/, "")}
            </div>
          );
        if (/^#{3,}\s/.test(l))
          return (
            <div
              key={key}
              style={{ fontSize: 14.5, fontWeight: 700, marginTop: 10 }}
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
                lineHeight: 1.55,
                paddingLeft: 14,
                color: "var(--soft)",
              }}
            >
              • {l.replace(/^[-*]\s*/, "")}
            </div>
          );
        return (
          <div key={key} style={{ fontSize: 14, lineHeight: 1.6 }}>
            {l}
          </div>
        );
      })}
    </div>
  );
}

// ── deal panel ────────────────────────────────────────────────────────────────
function DealPanel({
  deal,
  data,
  approvals,
  onClose,
  onApproval,
  onAskHunter,
  onAskPercy,
  onOpenConv,
}: {
  deal: OSDeal;
  data: OSFrontDesk;
  approvals: OSApproval[];
  onClose: () => void;
  onApproval: (id: number) => void;
  onAskHunter: () => void;
  onAskPercy: () => void;
  onOpenConv: () => void;
}) {
  const si = OS_STAGES.findIndex((x) => x.key === deal.stage);
  const prop = deal.proposalId
    ? data.proposals.find((p) => p.id === deal.proposalId)
    : null;
  const thread = data.threads.find(
    (t) => t.company.toLowerCase() === deal.company.toLowerCase(),
  );
  const dealAps = approvals.filter(
    (a) => a.company?.toLowerCase() === deal.company.toLowerCase(),
  );
  // day-42: every Stripe payment linked to this prospect, newest first.
  const dealPayments = data.money.payments
    .filter((p) => p.prospectKey === deal.key)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
  const invoiceUrl = (num: string) =>
    (num && data.money.invoices.find((i) => i.number === num)?.url) || "";
  // day-47: this deal's open manual invoices (bank transfer, not yet paid)
  const dealInvoices = data.money.invoices.filter(
    (i) =>
      i.source === "manual" &&
      i.status === "open" &&
      i.prospectKey === deal.key,
  );
  // day-47: the actual words sent to this company (copy_requests with a body)
  const dealCopy = data.copy.filter(
    (r) => r.company.toLowerCase() === deal.company.toLowerCase(),
  );

  // the journey: Scout found it → Hunter added → each message → proposal
  const journey: {
    k: AgentKey | "contact" | "paid";
    who: string;
    t: string;
    quote?: string;
    when: string;
  }[] = [
    {
      k: "scout",
      who: "Scout",
      t: `found the lead on ${deal.source}`,
      when: "",
    },
    {
      k: "hunter",
      who: "Hunter",
      t: "added the prospect and found the contact",
      when: "",
    },
  ];
  for (const m of thread?.msgs ?? [])
    journey.push(
      m.by === "them"
        ? {
            k: "contact",
            who: deal.contact ? deal.contact.split(" ")[0] : "them",
            t: "replied",
            quote: m.text,
            when: m.t,
          }
        : {
            k: m.by === "you" ? "hunter" : "hunter",
            who: m.by === "you" ? "you" : "Hunter",
            t: m.via ? `sent an email (${m.via})` : "sent an email",
            when: m.t,
          },
    );
  if (prop)
    journey.push({
      k: "scribe",
      who: "Scribe",
      t:
        prop.status === "draft"
          ? "is drafting the proposal"
          : `wrote the proposal · now ${prop.status}`,
      when: prop.updated,
    });
  // one "paid" entry per linked payment (oldest→newest, so they read in order)
  for (const p of [...dealPayments].reverse())
    journey.push({
      k: "paid",
      who: "paid",
      t: `AED ${money0(p.amountAed)}${p.number ? ` · invoice #${p.number}` : ""}`,
      when: shortDay(p.paidAt),
    });

  return (
    <>
      <button
        type="button"
        aria-label="close deal"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          zIndex: 5,
          border: "none",
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 560,
          zIndex: 6,
          background: "var(--surf)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                deal · {deal.source}
              </span>
              <span
                className="os-display"
                style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.05 }}
              >
                {deal.company}
              </span>
              {(deal.contact || deal.role) && (
                <span style={{ fontSize: 13, color: "var(--soft)" }}>
                  {[deal.contact, deal.role].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <span
                className="os-display"
                style={{ fontWeight: 800, fontSize: 22, whiteSpace: "nowrap" }}
              >
                AED {fmt(deal.value)}
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontSize: 12,
                  color: "var(--soft)",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  whiteSpace: "nowrap",
                }}
              >
                close ✕
              </button>
            </div>
          </div>
          {deal.paid && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "var(--ok)",
                fontWeight: 600,
              }}
            >
              <span>
                paid · AED {fmt(deal.paid.aed)}
                {deal.paid.when ? ` on ${deal.paid.when}` : ""}
                {deal.paid.number ? ` · invoice #${deal.paid.number}` : ""}
              </span>
              {deal.paid.url && (
                <a
                  href={deal.paid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--soft)", textDecoration: "none" }}
                >
                  open in Stripe ↗
                </a>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px 3px 3px",
                borderRadius: 999,
                background: "var(--t-hunter)",
                color: "var(--c-hunter)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Persona agent="hunter" size={22} />
              Hunter · owner
            </span>
            {deal.team
              .filter((k) => k !== "hunter")
              .map((k) => (
                <span
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px 3px 3px",
                    borderRadius: 999,
                    background: `var(${AGENT_TINT_VAR[k]})`,
                    color: `var(${AGENT_HUE_VAR[k]})`,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Persona agent={k} size={22} />
                  {cap(k)}
                </span>
              ))}
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
            {OS_STAGES.map((st, j) => (
              <div
                key={st.key}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background:
                      j <= si
                        ? deal.stage === "won"
                          ? "var(--ok)"
                          : "var(--c-hunter)"
                        : "var(--track)",
                  }}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    color: j === si ? "var(--ink)" : "var(--mute)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {st.label}
                  {st.key === "won" && deal.wonAt && (
                    <span style={{ color: "var(--ok)" }}>
                      {" "}
                      · {shortDay(deal.wonAt)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {dealAps.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onApproval(a.id)}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 13,
                background: "oklch(0.8 0.14 70 / 0.14)",
                cursor: "pointer",
                border: "none",
                textAlign: "left",
                color: "var(--ink)",
              }}
            >
              <Persona agent={a.agent} size={26} />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                {a.title}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ambink)",
                }}
              >
                needs you →
              </span>
            </button>
          ))}
          {prop && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Persona agent="scribe" size={24} />
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  proposal · {prop.title}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "var(--soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {prop.views} views
                </span>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {PROPOSAL_STEPS.map((n, j) => (
                  <div
                    key={n}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        height: 5,
                        borderRadius: 3,
                        background:
                          j <= prop.stepIndex
                            ? "var(--c-scribe)"
                            : "var(--track)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        color: n === prop.status ? "var(--ink)" : "var(--mute)",
                      }}
                    >
                      {n}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dealPayments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                payments
              </span>
              {dealPayments.map((p) => {
                const url = invoiceUrl(p.number);
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: "var(--ok)",
                        flex: "none",
                      }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {cur(p.currency)} {money0(p.amount)}
                      <span style={{ color: "var(--mute)" }}>
                        {" "}
                        · AED {money0(p.amountAed)}
                      </span>
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                      {shortDay(p.paidAt)}
                    </span>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11.5,
                          color: "var(--soft)",
                          textDecoration: "none",
                        }}
                      >
                        receipt ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {dealInvoices.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                invoices
              </span>
              {dealInvoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: "var(--ambink)",
                      flex: "none",
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    invoice #{inv.number}
                    <span style={{ color: "var(--mute)" }}>
                      {" "}
                      · open · AED {money0(inv.amountDue)}
                      {inv.dueAt ? ` · due ${shortDay(inv.dueAt)}` : ""}
                    </span>
                  </span>
                  {inv.fileUrl && (
                    <a
                      href={inv.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11.5,
                        color: "var(--soft)",
                        textDecoration: "none",
                      }}
                    >
                      PDF ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {dealCopy.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                what was sent
              </span>
              {dealCopy.map((r) => (
                <DealCopyRow key={r.id} r={r} />
              ))}
            </div>
          )}
          <span
            className="os-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mute)",
            }}
          >
            the journey
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {journey.map((j, i) => (
              <div key={`${j.who}-${i}`} style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 26,
                  }}
                >
                  {j.k === "contact" ? (
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--surf2)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9.5,
                        fontWeight: 700,
                        flex: "none",
                      }}
                    >
                      {ini(deal.contact || deal.company)}
                    </span>
                  ) : j.k === "paid" ? (
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--ok)",
                        color: "var(--bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        flex: "none",
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <Persona agent={j.k} size={24} />
                  )}
                  <div
                    style={{
                      flex: 1,
                      width: 2,
                      background: "var(--line)",
                      margin: "4px 0",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    paddingBottom: 16,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <b
                      style={{
                        color:
                          j.k === "contact"
                            ? "var(--ink)"
                            : j.k === "paid"
                              ? "var(--ok)"
                              : `var(${AGENT_HUE_VAR[j.k]})`,
                      }}
                    >
                      {j.who}
                    </b>{" "}
                    {j.t}
                  </span>
                  {j.quote && (
                    <span
                      style={{
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: "var(--soft)",
                        padding: "8px 12px",
                        borderRadius: 10,
                        background: "var(--surf2)",
                      }}
                    >
                      “{j.quote}”
                    </span>
                  )}
                  {j.when && (
                    <span style={{ fontSize: 11, color: "var(--mute)" }}>
                      {j.when}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={onAskHunter}
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
            ask Hunter to follow up
          </button>
          <button
            type="button"
            onClick={onOpenConv}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              fontSize: 13,
              cursor: "pointer",
              background: "transparent",
              color: "var(--ink)",
            }}
          >
            conversation
          </button>
          <button
            type="button"
            onClick={onAskPercy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--line)",
              fontSize: 13,
              cursor: "pointer",
              background: "transparent",
              color: "var(--ink)",
            }}
          >
            ask Percy
          </button>
        </div>
      </div>
    </>
  );
}
