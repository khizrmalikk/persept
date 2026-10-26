"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  approveFromForm,
  bulkApprovals,
  markPostPostedFromForm,
  rejectFromForm,
  returnApproval,
  sendApprovedEdit,
} from "@/lib/workforce/actions";
import type {
  OSApproval,
  OSApprovalKind,
  OSManualPost,
} from "../../_data/approvals";
import type { OSFlightRow } from "../../_data/copy-types";
import { waHref } from "../../_data/whatsapp";
import { AGENT_HUE_VAR, WINDOWS } from "../../_data/windows";
import { InFlightStrip } from "../InFlightStrip";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { Spinner } from "../Spinner";

// Approvals — the global inbox. list | detail. Every action is one of the real
// server actions (approve / reject / edit-and-send / hold / release / send-back /
// bulk / mark-posted); after each we router.refresh() to re-pull the queue and
// optimistically hide the decided row so the next one slides up.

const KL: Record<OSApprovalKind, string> = {
  email: "outbound email",
  linkedin: "linkedin post",
  instagram: "instagram · manual",
  whatsapp: "whatsapp · manual",
  "linkedin-message": "linkedin dm · manual",
  proposal: "proposal",
  merge: "code · merge",
  payment: "money",
  question: "scribe asks",
  ops: "system op",
  other: "review",
};
const WANTS: Record<OSApprovalKind, string> = {
  email: "wants to send an email",
  linkedin: "wants to publish a post",
  instagram: "has a post for you to put up",
  whatsapp: "has a whatsapp for you to send",
  "linkedin-message": "has a linkedin dm for you to send",
  proposal: "has a proposal ready for Hunter to send",
  merge: "wants to merge code",
  payment: "wants to pay for something",
  question: "has a question for you",
  ops: "wants to run a system op",
  other: "needs your decision",
};
const PRIM: Record<OSApprovalKind, string> = {
  email: "send",
  linkedin: "publish",
  instagram: "approve",
  whatsapp: "approve",
  "linkedin-message": "approve",
  proposal: "approve and send",
  merge: "merge",
  payment: "pay",
  question: "send to scribe",
  ops: "approve",
  other: "approve",
};
// kind-filter chips → the kinds each covers
const KF: [string, string][] = [
  ["all", "all"],
  ["out", "outbound"],
  ["posts", "posts"],
  ["proposal", "proposals"],
  ["merge", "code"],
  ["money", "money"],
];
const KM: Record<string, OSApprovalKind[]> = {
  out: ["email", "whatsapp", "linkedin-message"],
  posts: ["linkedin", "instagram"],
  proposal: ["proposal"],
  merge: ["merge"],
  money: ["payment"],
};
const FILTER_AGENTS: AgentKey[] = [
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];

function fd(entries: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) for (const x of v) f.append(k, x);
    else f.append(k, v);
  }
  return f;
}

export function Approvals({
  approvals,
  recentDecisions,
  manual,
  inFlight,
}: {
  approvals: OSApproval[];
  recentDecisions: OSApproval[];
  manual: OSManualPost[];
  inFlight: OSFlightRow[];
}) {
  const os = useOS();
  const router = useRouter();
  const [kf, setKf] = useState("all");
  const [af, setAf] = useState<AgentKey | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [back, setBack] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [sel, setSel] = useState<number | null>(null);
  // the action currently in flight (one at a time) — drives the button spinner
  // and disables the others until it resolves.
  const [busy, setBusy] = useState<string | null>(null);
  // bulk "send back" reveals a recipient picker (scribe / hunter) in the bar.
  const [bulkBack, setBulkBack] = useState(false);

  // deep-link selection (os.sub.id) wins when it changes
  useEffect(() => {
    const id = os.sub.id ? Number(os.sub.id) : null;
    if (id) {
      setSel(id);
      setEditing(false);
      setBack(false);
    }
  }, [os.sub.id]);

  const visible = approvals.filter((a) => !done.has(a.id));
  const pass = (a: OSApproval) =>
    (kf === "all" || KM[kf]?.includes(a.kind)) && (!af || a.agent === af);
  const list = visible.filter(pass);
  const live = list.filter((a) => !a.held);
  const held = list.filter((a) => a.held);
  const cur =
    visible.find((a) => a.id === sel) ??
    recentDecisions.find((a) => a.id === sel) ??
    live[0] ??
    held[0] ??
    null;

  const selIds = Object.keys(checked)
    .filter((k) => checked[Number(k)])
    .map(Number)
    .filter((id) => visible.some((a) => a.id === id));

  // select-all toggles the whole filtered list (live + held).
  const allSelected = list.length > 0 && list.every((a) => checked[a.id]);
  const toggleAll = () => {
    if (allSelected) {
      setChecked({});
    } else {
      const next: Record<number, boolean> = {};
      for (const a of list) next[a.id] = true;
      setChecked(next);
    }
  };
  // how many of the selected are held (→ offer Release) vs live (→ offer Hold).
  const heldSelected = selIds.filter(
    (id) => visible.find((a) => a.id === id)?.held,
  ).length;

  const run = async (
    key: string,
    p: Promise<unknown>,
    opts?: { hideId?: number; toast?: string },
  ) => {
    setBusy(key);
    if (opts?.hideId != null)
      setDone((d) => new Set(d).add(opts.hideId as number));
    setEditing(false);
    setBack(false);
    setNote("");
    try {
      await p;
    } finally {
      setBusy(null);
    }
    if (opts?.toast) os.showToast(opts.toast);
    router.refresh();
  };

  const approve = (a: OSApproval, edited?: boolean) =>
    run(
      edited ? "send" : "approve",
      edited
        ? sendApprovedEdit(
            fd({ id: String(a.id), agent: a.agent, text: draft }),
          )
        : approveFromForm(fd({ id: String(a.id), agent: a.agent })),
      { hideId: a.id, toast: edited ? "sent your edit" : "approved" },
    );
  const reject = (a: OSApproval) =>
    run("reject", rejectFromForm(fd({ id: String(a.id), agent: a.agent })), {
      hideId: a.id,
      toast: "rejected",
    });
  const hold = (a: OSApproval) =>
    run("hold", bulkApprovals(fd({ ids: [String(a.id)], op: "hold" })), {
      toast: "held for later",
    });
  const release = (a: OSApproval) =>
    run("release", bulkApprovals(fd({ ids: [String(a.id)], op: "unhold" })), {
      toast: "back in your queue",
    });
  const sendBack = (a: OSApproval, to: AgentKey) =>
    run(
      "back",
      returnApproval(fd({ id: String(a.id), recipients: [to], note })),
      { hideId: a.id, toast: `sent back to ${cap(to)}` },
    );

  // bulk actions over every selected approval. Clears the selection + any open
  // send-back picker after it lands. `extra` carries recipients for a return.
  const bulkRun = (
    key: string,
    op: string,
    toast: string,
    extra: Record<string, string | string[]> = {},
  ) =>
    run(key, bulkApprovals(fd({ ids: selIds.map(String), op, ...extra })), {
      toast,
    }).then(() => {
      setChecked({});
      setBulkBack(false);
    });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "400px minmax(0,1fr)",
      }}
    >
      {/* ── list ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: "14px 16px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {KF.map(([k, n]) => {
              const count = visible.filter(
                (a) => k === "all" || KM[k]?.includes(a.kind),
              ).length;
              const on = kf === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKf(k)}
                  style={{
                    fontSize: 12,
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    background: on ? "var(--ink)" : "transparent",
                    color: on ? "var(--bg)" : "var(--soft)",
                    border: "1px solid var(--line)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n} <span style={{ opacity: 0.6 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ fontSize: 11.5, color: "var(--mute)", marginRight: 2 }}
            >
              from
            </span>
            {FILTER_AGENTS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAf(af === k ? null : k)}
                title={k}
                style={{
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  opacity: !af || af === k ? 1 : 0.35,
                  boxShadow:
                    af === k ? `0 0 0 2px var(${AGENT_HUE_VAR[k]})` : "none",
                }}
              >
                <Persona agent={k} size={24} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setKf("all");
                setAf(null);
              }}
              style={{
                marginLeft: "auto",
                fontSize: 11.5,
                color: "var(--soft)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
              }}
            >
              clear
            </button>
          </div>

          {/* select all — toggles the whole filtered list */}
          <button
            type="button"
            onClick={toggleAll}
            disabled={list.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "2px 2px",
              background: "transparent",
              border: "none",
              cursor: list.length === 0 ? "default" : "pointer",
              color: "var(--soft)",
              fontSize: 12,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: "1.5px solid var(--mute)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  allSelected || selIds.length > 0
                    ? "var(--accent)"
                    : "transparent",
                flex: "none",
              }}
            >
              {allSelected ? (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0e0d0c"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              ) : selIds.length > 0 ? (
                <span
                  style={{
                    width: 9,
                    height: 2.5,
                    borderRadius: 2,
                    background: "#0e0d0c",
                  }}
                />
              ) : null}
            </span>
            {allSelected
              ? "clear selection"
              : `select all${list.length ? ` · ${list.length}` : ""}`}
          </button>
        </div>

        {selIds.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              padding: "9px 16px",
              background: "oklch(0.8 0.14 70 / 0.12)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>
              {selIds.length} selected
            </span>
            <BulkBtn
              label="approve"
              busyKey="bulk-approve"
              busy={busy}
              variant="p"
              onClick={() =>
                bulkRun("bulk-approve", "approve", `approved ${selIds.length}`)
              }
            />
            <BulkBtn
              label="send back"
              busyKey="bulk-back"
              busy={busy}
              onClick={() => setBulkBack((b) => !b)}
            />
            {heldSelected < selIds.length && (
              <BulkBtn
                label="hold"
                busyKey="bulk-hold"
                busy={busy}
                onClick={() =>
                  bulkRun("bulk-hold", "hold", `held ${selIds.length}`)
                }
              />
            )}
            {heldSelected > 0 && (
              <BulkBtn
                label="release"
                busyKey="bulk-release"
                busy={busy}
                onClick={() =>
                  bulkRun("bulk-release", "unhold", `released ${heldSelected}`)
                }
              />
            )}
            <BulkBtn
              label="reject"
              busyKey="bulk-reject"
              busy={busy}
              variant="r"
              onClick={() =>
                bulkRun("bulk-reject", "reject", `rejected ${selIds.length}`)
              }
            />
            <button
              type="button"
              onClick={() => {
                setChecked({});
                setBulkBack(false);
              }}
              style={{
                ...pillGhost,
                color: "var(--soft)",
              }}
            >
              clear
            </button>
            {bulkBack && (
              <div
                style={{
                  flexBasis: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingTop: 6,
                }}
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`a note for all ${selIds.length} (optional)…`}
                  style={{
                    width: "100%",
                    minHeight: 56,
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--surf)",
                    color: "var(--ink)",
                    padding: 10,
                    fontFamily: "var(--font-ui)",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                    send {selIds.length} back to
                  </span>
                  {(["scribe", "hunter", "muse"] as AgentKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={busy != null}
                      onClick={() =>
                        bulkRun(
                          "bulk-back",
                          "return",
                          `sent ${selIds.length} back to ${cap(k)}`,
                          { recipients: [k], note },
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px 4px 4px",
                        borderRadius: 999,
                        background: "var(--surf)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "1px solid var(--line)",
                        color: "var(--ink)",
                      }}
                    >
                      <Persona agent={k} size={20} />
                      {cap(k)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "8px 10px 14px" }}>
          {recentDecisions.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div
                className="os-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--soft)",
                  padding: "8px 8px 6px",
                }}
              >
                decided through percy
              </div>
              {recentDecisions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSel(a.id);
                    setEditing(false);
                    setBack(false);
                  }}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 12,
                    background:
                      cur?.id === a.id ? "var(--surf2)" : "transparent",
                    border: "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--ink)",
                    marginBottom: 2,
                  }}
                >
                  <Persona agent={a.agent} size={26} />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 12.5,
                      color: "var(--soft)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.title}
                  </span>
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color:
                        a.decided === "rejected" ? "var(--bad)" : "var(--mute)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.decided === "rejected" ? "rejected" : "approved"}
                  </span>
                </button>
              ))}
            </div>
          )}
          <InFlightStrip
            rows={inFlight}
            onOpenApproval={(id) => {
              setSel(id);
              setEditing(false);
              setBack(false);
            }}
          />
          <Group
            name="waiting for you"
            col="var(--ambink)"
            items={live}
            empty="nothing waiting. new requests land here."
            cur={cur}
            checked={checked}
            setChecked={setChecked}
            onPick={(id) => {
              setSel(id);
              setEditing(false);
              setBack(false);
            }}
          />
          <Group
            name="held"
            col="var(--mute)"
            items={held}
            empty="nothing held. hold anything you want to come back to."
            cur={cur}
            checked={checked}
            setChecked={setChecked}
            onPick={(id) => {
              setSel(id);
              setEditing(false);
              setBack(false);
            }}
          />
        </div>
      </div>

      {/* ── detail ────────────────────────────────────────────────────────── */}
      <div
        style={{
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!cur ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div
              className="os-display"
              style={{ fontWeight: 800, fontSize: 30 }}
            >
              nothing waiting for you
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--soft)",
                maxWidth: 420,
                lineHeight: 1.5,
              }}
            >
              agents keep working. anything that sends, merges, publishes or
              pays lands here first.
            </div>
          </div>
        ) : (
          <Detail
            cur={cur}
            editing={editing}
            draft={draft}
            note={note}
            back={back}
            busy={busy}
            setDraft={setDraft}
            setNote={setNote}
            setEditing={setEditing}
            setBack={setBack}
            onOpenWs={() =>
              cur.workspace &&
              os.open(cur.workspace, cur.deal ? { deal: cur.deal } : {})
            }
            approve={approve}
            reject={reject}
            hold={hold}
            release={release}
            sendBack={sendBack}
          />
        )}

        {manual.length > 0 && (
          <div
            style={{
              margin: "0 28px 24px",
              padding: 16,
              borderRadius: 16,
              background: "var(--t-muse)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 800,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              your turn · post these yourself
            </span>
            {manual.map((m) => (
              <div
                key={m.id}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <Persona agent="muse" size={26} />
                <span style={{ fontSize: 13.5, flex: 1 }}>{m.title}</span>
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() =>
                    run(
                      `posted:${m.id}`,
                      markPostPostedFromForm(fd({ id: m.id, slug: m.slug })),
                      { toast: "marked as posted" },
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 9,
                    background: "var(--ink)",
                    color: "var(--bg)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {busy === `posted:${m.id}` && <Spinner size={12} />}I posted
                  it
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pillPrimary: React.CSSProperties = {
  padding: "6px 11px",
  borderRadius: 8,
  background: "var(--accent)",
  color: "var(--accent-ink)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  border: "none",
};
const pillGhost: React.CSSProperties = {
  padding: "6px 11px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 12,
  cursor: "pointer",
};

// A bulk-action pill: primary (accent), danger (reject) or ghost. Shows a spinner
// on the one whose action is in flight; all disable while any bulk action runs.
function BulkBtn({
  label,
  busyKey,
  busy,
  onClick,
  variant,
}: {
  label: string;
  busyKey: string;
  busy: string | null;
  onClick: () => void;
  variant?: "p" | "r";
}) {
  const base = variant === "p" ? pillPrimary : pillGhost;
  return (
    <button
      type="button"
      disabled={busy != null}
      onClick={onClick}
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: variant === "r" ? "var(--bad)" : base.color,
        opacity: busy != null && busy !== busyKey ? 0.5 : 1,
        cursor: busy != null ? "default" : "pointer",
      }}
    >
      {busy === busyKey && <Spinner size={12} />}
      {label}
    </button>
  );
}

function Group({
  name,
  col,
  items,
  empty,
  cur,
  checked,
  setChecked,
  onPick,
}: {
  name: string;
  col: string;
  items: OSApproval[];
  empty: string;
  cur: OSApproval | null;
  checked: Record<number, boolean>;
  setChecked: (
    f: (c: Record<number, boolean>) => Record<number, boolean>,
  ) => void;
  onPick: (id: number) => void;
}) {
  return (
    <>
      <div
        className="os-mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          whiteSpace: "nowrap",
          fontSize: 10.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: col,
          padding: "12px 8px 6px",
        }}
      >
        <span>{name}</span>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--mute)",
            padding: "4px 8px 8px",
            lineHeight: 1.4,
          }}
        >
          {empty}
        </div>
      ) : (
        items.map((a) => {
          const on = cur?.id === a.id;
          return (
            <div
              key={a.id}
              data-pc={`approval-${a.id}`}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "11px 10px",
                borderRadius: 12,
                background: on ? "var(--surf2)" : "transparent",
                border: `1px solid ${on ? "var(--line)" : "transparent"}`,
                marginBottom: 4,
              }}
            >
              <button
                type="button"
                aria-label={checked[a.id] ? "deselect" : "select"}
                aria-pressed={!!checked[a.id]}
                onClick={() => setChecked((c) => ({ ...c, [a.id]: !c[a.id] }))}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: "1.5px solid var(--mute)",
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: checked[a.id] ? "var(--accent)" : "transparent",
                  flex: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {checked[a.id] && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0e0d0c"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  flex: 1,
                  minWidth: 0,
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  color: "var(--ink)",
                }}
              >
                <Persona agent={a.agent} size={30} />
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span
                      className="os-mono"
                      style={{
                        fontSize: 9.5,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: `var(${AGENT_HUE_VAR[a.agent]})`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {KL[a.kind]}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "var(--mute)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.age}
                    </span>
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}
                  >
                    {a.title}
                  </span>
                  {a.workspace && (
                    <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                      {WINDOWS[a.workspace].name}
                    </span>
                  )}
                </span>
              </button>
            </div>
          );
        })
      )}
    </>
  );
}

function Detail({
  cur,
  editing,
  draft,
  note,
  back,
  busy,
  setDraft,
  setNote,
  setEditing,
  setBack,
  onOpenWs,
  approve,
  reject,
  hold,
  release,
  sendBack,
}: {
  cur: OSApproval;
  editing: boolean;
  draft: string;
  note: string;
  back: boolean;
  busy: string | null;
  setDraft: (v: string) => void;
  setNote: (v: string) => void;
  setEditing: (v: boolean) => void;
  setBack: (v: boolean) => void;
  onOpenWs: () => void;
  approve: (a: OSApproval, edited?: boolean) => void;
  reject: (a: OSApproval) => void;
  hold: (a: OSApproval) => void;
  release: (a: OSApproval) => void;
  sendBack: (a: OSApproval, to: AgentKey) => void;
}) {
  const hue = `var(${AGENT_HUE_VAR[cur.agent]})`;
  // day51: Percy already decided this one for you — show it as decided, no buttons.
  const decidedViaPercy =
    cur.decided != null &&
    (cur.decidedVia ?? "").toLowerCase().startsWith("via percy");
  return (
    <div
      style={{
        padding: "22px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxWidth: 860,
        width: "100%",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Persona agent={cur.agent} size={48} ring />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--soft)" }}>
            <b style={{ color: hue }}>{cap(cur.agent)}</b> {WANTS[cur.kind]}
            <span style={{ color: "var(--mute)" }}> · {cur.age} ago</span>
          </span>
          <span
            className="os-display"
            style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1 }}
          >
            {cur.title}
          </span>
        </div>
        {cur.workspace && (
          <button
            type="button"
            onClick={onOpenWs}
            style={{
              fontSize: 12,
              padding: "6px 11px",
              borderRadius: 999,
              background: "var(--surf2)",
              color: "var(--soft)",
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            in {WINDOWS[cur.workspace].name} →
          </button>
        )}
      </div>

      {/* trail */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cur.trail.map((t) => (
          <span
            key={t.t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px 3px 3px",
              borderRadius: 999,
              background: "var(--surf2)",
              fontSize: 12,
              color: "var(--soft)",
              whiteSpace: "nowrap",
            }}
          >
            <Persona agent={t.k} size={20} />
            {t.t}
          </span>
        ))}
        {cur.held && (
          <span
            style={{
              padding: "4px 11px",
              borderRadius: 999,
              background: "var(--surf2)",
              border: "1px dashed var(--mute)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--soft)",
            }}
          >
            held by you
          </span>
        )}
        {decidedViaPercy && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 11px",
              borderRadius: 999,
              background: "var(--surf2)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--soft)",
            }}
          >
            <Persona agent="percy" size={18} />
            decided through Percy
          </span>
        )}
      </div>

      <KindBody cur={cur} editing={editing} draft={draft} setDraft={setDraft} />

      {cur.kind === "question" && !cur.decided && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="your answer for Scribe…"
          style={{
            width: "100%",
            minHeight: 90,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
            color: "var(--ink)",
            padding: 14,
            fontFamily: "var(--font-ui)",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      )}

      {/* actions — or, if Percy already decided it, a read-only line */}
      {cur.decided ? (
        <span style={{ fontSize: 13, color: "var(--soft)", paddingTop: 4 }}>
          {cur.decided === "rejected" ? "rejected" : "approved"}
          {decidedViaPercy ? " through Percy" : ""}. nothing more for you here.
        </span>
      ) : (
        <>
          <Actions
            cur={cur}
            editing={editing}
            back={back}
            busy={busy}
            note={note}
            setNote={setNote}
            setEditing={setEditing}
            setBack={setBack}
            setDraft={setDraft}
            approve={approve}
            reject={reject}
            hold={hold}
            release={release}
            sendBack={sendBack}
          />
          <span style={{ fontSize: 12, color: "var(--mute)" }}>
            {footnote(cur.kind)}
          </span>
        </>
      )}
    </div>
  );
}

function KindBody({
  cur,
  editing,
  draft,
  setDraft,
}: {
  cur: OSApproval;
  editing: boolean;
  draft: string;
  setDraft: (v: string) => void;
}) {
  // operational ops (sql / host / protected config) — the block in monospace +
  // an amber risk line; approve/reject only, never editable.
  if (cur.kind === "ops") {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          className="os-mono"
          style={{
            padding: 18,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            background: "var(--surf2)",
          }}
        >
          {cur.body}
        </div>
        <div
          style={{
            padding: "8px 18px",
            background: "oklch(0.8 0.14 70 / 0.16)",
            borderTop: "1px solid var(--line)",
            color: "var(--ambink)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          operational action · review carefully
        </div>
      </div>
    );
  }
  const bodyBlock = editing ? (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      style={{
        width: "100%",
        minHeight: 200,
        border: "none",
        outline: "none",
        resize: "vertical",
        padding: 18,
        background: "oklch(0.8 0.14 70 / 0.06)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
        fontSize: 15,
        lineHeight: 1.6,
      }}
    />
  ) : (
    <div
      style={{
        padding: "18px",
        fontSize: 15,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}
    >
      {cur.body}
    </div>
  );

  if (
    cur.kind === "email" ||
    cur.kind === "whatsapp" ||
    cur.kind === "linkedin-message"
  ) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr",
            fontSize: 13.5,
          }}
        >
          <Cell mute>to</Cell>
          <Cell>
            <b>{cur.to ?? "—"}</b>
          </Cell>
          <Cell mute>subject</Cell>
          <Cell bold>{cur.subject ?? "—"}</Cell>
          <Cell mute last>
            channel
          </Cell>
          <Cell last>{cur.channel ?? cur.kind}</Cell>
        </div>
        {bodyBlock}
      </div>
    );
  }
  if (cur.kind === "linkedin") {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          overflow: "hidden",
          maxWidth: 560,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#0b0a09",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="19"
              height="20"
              viewBox="10.31 8 79.38 84"
              aria-hidden="true"
            >
              <path
                d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
                fill="var(--accent)"
              />
              <path
                fillRule="evenodd"
                d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
                fill="var(--accent)"
              />
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <b style={{ fontSize: 14 }}>Persept</b>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>
              company page · linkedin
            </span>
          </div>
        </div>
        {bodyBlock}
      </div>
    );
  }
  if (cur.kind === "instagram") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            aspectRatio: "1",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
            display: "grid",
            placeItems: "center",
            color: "var(--mute)",
            fontSize: 12,
          }}
        >
          image
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 14.5,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              padding: "14px 16px",
              borderRadius: 14,
              background: "var(--surf2)",
            }}
          >
            {cur.body}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--soft)",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px dashed var(--line)",
            }}
          >
            instagram can&apos;t be posted for you. approve it, post it
            yourself, then mark it posted. Muse uses the stats either way.
          </div>
        </div>
      </div>
    );
  }
  if (cur.kind === "proposal") {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxWidth: 620,
        }}
      >
        <div className="os-display" style={{ fontWeight: 800, fontSize: 22 }}>
          {cur.company ?? cur.title}
        </div>
        {cur.body && (
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: "var(--soft)",
            }}
          >
            {cur.body.slice(0, 600)}
          </div>
        )}
        {cur.link && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--soft)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
            </svg>
            {cur.link} · Hunter sends it once you approve
          </div>
        )}
      </div>
    );
  }
  if (cur.kind === "merge") {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13.5,
          flexWrap: "wrap",
        }}
      >
        {cur.repo && <b>{cur.repo}</b>}
        {cur.pr != null && (
          <span
            className="os-mono"
            style={{ fontSize: 12, color: "var(--soft)" }}
          >
            pr #{cur.pr} → main
          </span>
        )}
        <span style={{ color: "var(--mute)", fontSize: 12.5 }}>
          the diff and checks open in dev once you approve the merge.
        </span>
      </div>
    );
  }
  if (cur.kind === "payment") {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--line)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 520,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            className="os-display"
            style={{
              fontWeight: 900,
              fontSize: 54,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {cur.amount ?? "—"}
          </span>
          {cur.vendor && (
            <span style={{ fontSize: 14, color: "var(--soft)" }}>
              {cur.vendor}
            </span>
          )}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {cur.body}
        </div>
      </div>
    );
  }
  // question / other
  return (
    <div
      style={{
        fontSize: 15,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        padding: "4px 2px",
      }}
    >
      {cur.body}
    </div>
  );
}

function Actions({
  cur,
  editing,
  back,
  busy,
  note,
  setNote,
  setEditing,
  setBack,
  setDraft,
  approve,
  reject,
  hold,
  release,
  sendBack,
}: {
  cur: OSApproval;
  editing: boolean;
  back: boolean;
  busy: string | null;
  note: string;
  setNote: (v: string) => void;
  setEditing: (v: boolean) => void;
  setBack: (v: boolean) => void;
  setDraft: (v: string) => void;
  approve: (a: OSApproval, edited?: boolean) => void;
  reject: (a: OSApproval) => void;
  hold: (a: OSApproval) => void;
  release: (a: OSApproval) => void;
  sendBack: (a: OSApproval, to: AgentKey) => void;
}) {
  const working = busy != null;
  // `busyKey` ties a button to the action in flight so only it shows a spinner;
  // every button disables while any action runs.
  const btn = (
    label: string,
    onClick: () => void,
    kind?: "p" | "r",
    busyKey?: string,
  ) => {
    const spinning = busyKey != null && busy === busyKey;
    return (
      <button
        key={label}
        type="button"
        onClick={onClick}
        disabled={working}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "11px 18px",
          borderRadius: 11,
          fontSize: 14,
          fontWeight: kind === "p" ? 700 : 500,
          cursor: working ? "default" : "pointer",
          opacity: working && !spinning ? 0.5 : 1,
          background: kind === "p" ? "var(--accent)" : "transparent",
          color:
            kind === "p"
              ? "var(--accent-ink)"
              : kind === "r"
                ? "var(--bad)"
                : "var(--ink)",
          border: `1px solid ${kind === "p" ? "var(--accent)" : "var(--line)"}`,
          whiteSpace: "nowrap",
        }}
      >
        {spinning && <Spinner size={14} />}
        {label}
      </button>
    );
  };

  const buttons: React.ReactNode[] = [];
  if (cur.held) {
    buttons.push(btn("release", () => release(cur), "p", "release"));
    buttons.push(btn("reject", () => reject(cur), "r", "reject"));
  } else if (editing) {
    buttons.push(
      btn("send edited version", () => approve(cur, true), "p", "send"),
    );
    buttons.push(btn("cancel", () => setEditing(false)));
  } else if (cur.kind === "question") {
    buttons.push(
      btn("send to scribe", () => sendBack(cur, "scribe"), "p", "back"),
    );
    buttons.push(btn("reject", () => reject(cur), "r", "reject"));
  } else {
    buttons.push(btn(PRIM[cur.kind], () => approve(cur), "p", "approve"));
    // whatsapp: open the chat straight to the found number with the draft
    // prefilled, so you can eyeball and press send in WhatsApp itself.
    const wa = cur.kind === "whatsapp" ? waHref(cur.to, cur.body) : null;
    if (wa)
      buttons.push(
        btn("open in whatsapp", () => {
          window.open(wa, "_blank", "noopener,noreferrer");
        }),
      );
    if (cur.editable)
      buttons.push(
        btn(cur.kind === "email" ? "edit and send" : "edit first", () => {
          setDraft(cur.body);
          setEditing(true);
        }),
      );
    buttons.push(btn("hold", () => hold(cur), undefined, "hold"));
    // day-47: send back with a note — for posts (→ Muse) as well as outbound/proposals.
    buttons.push(btn("send back", () => setBack(!back)));
    buttons.push(btn("reject", () => reject(cur), "r", "reject"));
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        paddingTop: 4,
      }}
    >
      {buttons}
      {back && !cur.held && (
        <div
          style={{
            flexBasis: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--surf2)",
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a note on what to change (optional)…"
            style={{
              width: "100%",
              minHeight: 64,
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "var(--surf)",
              color: "var(--ink)",
              padding: 10,
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: 12, color: "var(--mute)", padding: "0 4px" }}
            >
              send back to
            </span>
            {backTargets(cur).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => sendBack(cur, k)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 999,
                  background: "var(--surf)",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                }}
              >
                <Persona agent={k} size={22} />
                {cap(k)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// day-47: who a given approval can be sent back to — its drafter (Muse for a
// post, Hunter for outbound) plus Scribe (the writer). Only these three can
// receive a return; `returnOne` ignores any other.
const BACK_AGENTS: AgentKey[] = ["scribe", "hunter", "muse"];
function backTargets(a: OSApproval): AgentKey[] {
  const out = [a.agent, "scribe"].filter((k) =>
    BACK_AGENTS.includes(k as AgentKey),
  ) as AgentKey[];
  return [...new Set(out.length ? out : (["scribe"] as AgentKey[]))];
}

function Cell({
  children,
  mute,
  bold,
  last,
}: {
  children: React.ReactNode;
  mute?: boolean;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <span
      style={{
        padding: "11px 16px",
        color: mute ? "var(--mute)" : "var(--ink)",
        fontWeight: bold ? 600 : 400,
        borderBottom: last ? "none" : "1px solid var(--line)",
      }}
    >
      {children}
    </span>
  );
}

function footnote(kind: OSApprovalKind): string {
  if (kind === "merge")
    return "merging deploys to production. Fixer watches the deploy and rolls back if checks fail.";
  if (kind === "payment") return "nothing is charged until you tap pay.";
  if (kind === "email" || kind === "proposal")
    return "nothing leaves until you tap. send back gives it to an agent to revise, and it comes back here.";
  return "you can edit, hold or reject. nothing goes out without your tap.";
}

const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
