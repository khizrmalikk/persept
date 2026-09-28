"use client";

import { useEffect, useState } from "react";
import type {
  ApprovalVM,
  DecidedVM,
} from "../approvals/_components/ApprovalsView";

// Mobile approvals (< 768px): a segmented waiting/decided list, quick actions on
// each card, a full-screen review overlay with first-class edit, and a toast.
// Same guarded server actions as the desktop view — decisions submit real form
// POSTs so the edited body + note reach the server unchanged.

type Action = (fd: FormData) => void | Promise<void>;

function primaryLabel(vm: ApprovalVM): string {
  if (vm.held) return "release";
  if (!vm.outbound) return "approve";
  return vm.channel === "linkedin" ? "publish" : "send";
}

function toastFor(
  vm: ApprovalVM,
  kind: "primary" | "edited" | "reject",
): string {
  const name = vm.agentName;
  if (kind === "reject") return `rejected. ${name} will see your note.`;
  if (vm.held) return `released. ${name} sends it tomorrow morning.`;
  if (kind === "edited") return "sent edited. the bridge acts within a minute.";
  const verb = !vm.outbound
    ? "approved"
    : vm.channel === "linkedin"
      ? "published"
      : "sent";
  return `${verb}. the bridge acts within a minute.`;
}

export function MobileApprovals({
  waiting,
  held,
  decided,
  approveAction,
  rejectAction,
  sendEditAction,
}: {
  waiting: ApprovalVM[];
  held: ApprovalVM[];
  decided: DecidedVM[];
  approveAction: Action;
  rejectAction: Action;
  sendEditAction: Action;
}) {
  const pending = [...waiting, ...held];
  const [seg, setSeg] = useState<"waiting" | "decided">("waiting");
  const [selId, setSelId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");

  // reset selection/edit when the pending set changes (i.e. after a decision)
  const listKey = pending.map((x) => x.id).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: listKey is the change signal
  useEffect(() => {
    setSelId(null);
    setEditing(false);
    setNote("");
    setDraft("");
  }, [listKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const sel = pending.find((x) => x.id === selId) ?? null;

  const openReview = (vm: ApprovalVM) => {
    setSelId(vm.id);
    setEditing(false);
    setNote("");
    setDraft(vm.body);
  };

  return (
    <div className="wf-only-mobile wf-mapp">
      <div className="wf-mapp-scroll">
        <div className="wf-mapp-head">
          <h1 className="wf-mapp-title">waiting for you</h1>
          <p className="wf-mapp-sub">agents draft. you press send.</p>
        </div>

        <div className="wf-mapp-seg">
          <button
            type="button"
            className={`wf-mapp-seg-btn${seg === "waiting" ? " is-active" : ""}`}
            onClick={() => setSeg("waiting")}
          >
            waiting ({pending.length})
          </button>
          <button
            type="button"
            className={`wf-mapp-seg-btn${seg === "decided" ? " is-active" : ""}`}
            onClick={() => setSeg("decided")}
          >
            decided ({decided.length})
          </button>
        </div>

        {seg === "waiting" ? (
          <div className="wf-mapp-list">
            {pending.length === 0 ? (
              <div className="wf-mapp-empty">
                nothing waiting. your agents are on it.
              </div>
            ) : (
              pending.map((vm) => (
                <div className="wf-mapp-card" key={vm.id}>
                  <button
                    type="button"
                    className="wf-mapp-card-open"
                    onClick={() => openReview(vm)}
                  >
                    <span className="wf-mapp-card-top">
                      <span
                        className="wf-mapp-tile sm"
                        style={{ background: vm.tint }}
                      >
                        {vm.emoji}
                      </span>
                      <span className="wf-mapp-card-meta">
                        <span className="wf-mapp-card-name">
                          {vm.agentName}
                        </span>{" "}
                        · {vm.channel} · {vm.when}
                      </span>
                      <span className={`wf-mapp-risk is-${vm.risk}`}>
                        {vm.risk}
                      </span>
                    </span>
                    <span className="wf-mapp-card-action">{vm.action}</span>
                    {vm.held && (
                      <span className="wf-mapp-held">
                        held · daily cap reached (5 of 5)
                      </span>
                    )}
                  </button>
                  <div className="wf-mapp-card-btns">
                    <form action={approveAction} className="wf-mapp-quick-form">
                      <input type="hidden" name="id" value={vm.id} />
                      <input type="hidden" name="agent" value={vm.agentId} />
                      <button
                        type="submit"
                        className="wf-mapp-quick"
                        onClick={() => setToast(toastFor(vm, "primary"))}
                      >
                        {primaryLabel(vm)}
                      </button>
                    </form>
                    <button
                      type="button"
                      className="wf-mapp-review"
                      onClick={() => openReview(vm)}
                    >
                      review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="wf-mapp-decided">
            {decided.length === 0 ? (
              <div className="wf-mapp-empty">nothing decided yet.</div>
            ) : (
              decided.map((d) => (
                <div className="wf-mapp-drow" key={d.id}>
                  <span className="wf-mapp-demoji">{d.emoji}</span>
                  <span className="wf-mapp-dmain">
                    <span className="wf-mapp-daction">{d.action}</span>
                    <span className="wf-mapp-dwhen">{d.when}</span>
                  </span>
                  <span
                    className={`wf-mapp-decision${d.bad ? " is-bad" : " is-good"}`}
                  >
                    {d.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── review overlay ──────────────────────────────────────────────── */}
      {sel && (
        <form className="wf-mapp-overlay" action={approveAction} key={sel.id}>
          <input type="hidden" name="id" value={sel.id} />
          <input type="hidden" name="agent" value={sel.agentId} />
          <div className="wf-mapp-ov-bar">
            <button
              type="button"
              className="wf-mapp-back"
              onClick={() => setSelId(null)}
            >
              ‹ approvals
            </button>
          </div>
          <div
            className="wf-mapp-ov-scroll"
            style={{
              background: `linear-gradient(180deg, ${sel.tint}, transparent 220px)`,
            }}
          >
            <div className="wf-mapp-ov-id">
              <span className="wf-mapp-tile" style={{ background: sel.tint }}>
                {sel.emoji}
              </span>
              <span className="wf-mapp-ov-idmain">
                <span className="wf-mapp-ov-name">{sel.agentName}</span>
                <span className="wf-mapp-ov-when">drafted {sel.when}</span>
              </span>
              <span className={`wf-mapp-risk is-${sel.risk}`}>
                {sel.risk} risk
              </span>
            </div>
            <div className="wf-mapp-ov-action">{sel.action}</div>
            <div className="wf-mapp-ov-why">
              <span>why it needs you:</span> {sel.reason}
            </div>
            {sel.outbound && (
              <dl className="wf-mapp-ov-meta">
                <dt>channel</dt>
                <dd>{sel.channel}</dd>
                <dt>to</dt>
                <dd>{sel.to}</dd>
                {sel.subject && (
                  <>
                    <dt>subject</dt>
                    <dd>{sel.subject}</dd>
                  </>
                )}
              </dl>
            )}
            {editing ? (
              <div className="wf-mapp-ov-editwrap">
                <div className="wf-mapp-ov-editlabel">
                  editing · your version is what gets sent
                </div>
                <textarea
                  name="text"
                  className="wf-mapp-ov-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </div>
            ) : (
              <div className="wf-mapp-ov-doc">{sel.body}</div>
            )}
            <input
              className="wf-mapp-ov-note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`note to ${sel.agentName.toLowerCase()} (optional)`}
            />
          </div>
          <div className="wf-mapp-ov-foot">
            <div className="wf-mapp-ov-foot-row">
              {editing ? (
                <button
                  type="submit"
                  className="wf-mapp-btn primary"
                  formAction={sendEditAction}
                  onClick={() => setToast(toastFor(sel, "edited"))}
                >
                  {sel.outbound ? "send edited" : "approve edited"}
                </button>
              ) : (
                <button
                  type="submit"
                  className="wf-mapp-btn primary"
                  formAction={approveAction}
                  onClick={() => setToast(toastFor(sel, "primary"))}
                >
                  {primaryLabel(sel)}
                </button>
              )}
              <button
                type="button"
                className="wf-mapp-btn ghost"
                onClick={() => {
                  if (!editing) setDraft(sel.body);
                  setEditing((v) => !v);
                }}
              >
                {editing ? "cancel edit" : "edit"}
              </button>
            </div>
            <button
              type="submit"
              className="wf-mapp-btn reject"
              formAction={rejectAction}
              onClick={() => setToast(toastFor(sel, "reject"))}
            >
              reject
            </button>
            <div className="wf-mapp-ov-hint">
              nothing leaves until you press it.
            </div>
          </div>
        </form>
      )}

      {toast && (
        <div className="wf-mapp-toast">
          <span className="wf-mapp-toast-dot" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
