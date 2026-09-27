"use client";

import { useEffect, useState } from "react";

// The approvals inbox — the core of the product. Server page builds serializable
// view-models and passes the three guarded server actions; this island owns the
// tab, selection and edit-mode UI. Decisions submit real <form> POSTs (formAction)
// so the edited body / note reach the server actions unchanged.

export type ApprovalVM = {
  id: number;
  agentId: string;
  agentName: string;
  emoji: string;
  tint: string;
  tintHead: string;
  selBorder: string;
  channel: string;
  when: string;
  action: string;
  risk: "low" | "medium" | "high";
  reason: string;
  outbound: boolean;
  to: string;
  subject: string;
  context: string;
  body: string;
  held: boolean;
};

export type DecidedVM = {
  id: number;
  when: string;
  emoji: string;
  agentName: string;
  action: string;
  status: string;
  bad: boolean;
};

type Action = (fd: FormData) => void | Promise<void>;
type Tab = "waiting" | "held" | "decided";

export function ApprovalsView({
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
  const [tab, setTab] = useState<Tab>("waiting");
  const [selId, setSelId] = useState<number | null>(waiting[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");

  // reset edit state whenever the pending set changes (i.e. after a decision)
  const listKey = `${waiting.map((x) => x.id).join(",")}|${held
    .map((x) => x.id)
    .join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: listKey is the change signal (pending set changed after a decision)
  useEffect(() => {
    setEditing(false);
    setNote("");
    setDraft("");
  }, [listKey]);

  const list = tab === "held" ? held : waiting;
  const sel = list.find((x) => x.id === selId) ?? list[0] ?? null;

  const selectTab = (t: Tab) => {
    setTab(t);
    setEditing(false);
    setNote("");
    setDraft("");
    if (t !== "decided")
      setSelId((t === "held" ? held : waiting)[0]?.id ?? null);
  };
  const select = (id: number) => {
    setSelId(id);
    setEditing(false);
    setNote("");
    setDraft("");
  };
  const startEdit = () => {
    if (sel) setDraft(sel.body);
    setEditing(true);
  };

  const tabs: [Tab, string, number][] = [
    ["waiting", "waiting", waiting.length],
    ["held", "held", held.length],
    ["decided", "decided", decided.length],
  ];

  const emptyText =
    tab === "held"
      ? "nothing held. items land here when an agent hits its daily cap."
      : "nothing waiting. the agents are working inside their limits.";

  return (
    <div className="wf-apx">
      <header className="wf-apx-head">
        <div>
          <div className="wf-apx-eyebrow">approvals</div>
          <h1 className="wf-apx-title">waiting for you</h1>
          <p className="wf-apx-lede">
            agents draft and prepare. you press send, merge, publish and pay.
          </p>
        </div>
        <div className="wf-apx-tabs">
          {tabs.map(([k, label, count]) => (
            <button
              key={k}
              type="button"
              className={`wf-apx-tab${tab === k ? " is-active" : ""}`}
              onClick={() => selectTab(k)}
            >
              {label} <span className="wf-apx-tab-n">{count}</span>
            </button>
          ))}
        </div>
      </header>

      {tab !== "decided" ? (
        <div className="wf-apx-body">
          <div className="wf-apx-list">
            {list.length === 0 ? (
              <div className="wf-apx-empty">{emptyText}</div>
            ) : (
              list.map((q) => {
                const active = sel?.id === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`wf-apx-card${active ? " is-sel" : ""}`}
                    onClick={() => select(q.id)}
                    style={active ? { borderColor: q.selBorder } : undefined}
                  >
                    <span className="wf-apx-card-top">
                      <span
                        className="wf-apx-tile sm"
                        style={{ background: q.tint }}
                      >
                        {q.emoji}
                      </span>
                      <span className="wf-apx-card-name">{q.agentName}</span>
                      <span className="wf-apx-card-ch">{q.channel}</span>
                      <span className="wf-apx-card-when">{q.when}</span>
                    </span>
                    <span className="wf-apx-card-action">{q.action}</span>
                    <span className="wf-apx-card-pills">
                      <span className={`wf-apx-risk is-${q.risk}`}>
                        {q.risk} risk
                      </span>
                      {q.held && <span className="wf-apx-held">held</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {sel && (
            <form className="wf-apx-detail" action={approveAction} key={sel.id}>
              <input type="hidden" name="id" value={sel.id} />
              <input type="hidden" name="agent" value={sel.agentId} />

              <div
                className="wf-apx-detail-head"
                style={{
                  background: `linear-gradient(180deg, ${sel.tintHead}, transparent)`,
                }}
              >
                <div className="wf-apx-detail-id">
                  <span
                    className="wf-apx-tile"
                    style={{ background: sel.tint }}
                  >
                    {sel.emoji}
                  </span>
                  <span className="wf-apx-detail-name">{sel.agentName}</span>
                  <span className="wf-apx-detail-when">drafted {sel.when}</span>
                  <span className={`wf-apx-risk lg is-${sel.risk}`}>
                    {sel.risk} risk
                  </span>
                </div>
                <div className="wf-apx-detail-action">{sel.action}</div>
                <div className="wf-apx-detail-why">
                  why it needs you: {sel.reason}
                </div>
              </div>

              {sel.outbound && (
                <dl className="wf-apx-meta">
                  <dt>channel</dt>
                  <dd>
                    <span className="wf-apx-chip">{sel.channel}</span>
                  </dd>
                  <dt>to</dt>
                  <dd>{sel.to}</dd>
                  {sel.subject && (
                    <>
                      <dt>subject</dt>
                      <dd className="strong">{sel.subject}</dd>
                    </>
                  )}
                  {sel.context && (
                    <>
                      <dt>context</dt>
                      <dd className="muted">{sel.context}</dd>
                    </>
                  )}
                </dl>
              )}

              <div className="wf-apx-doc-wrap">
                {editing ? (
                  <div className="wf-apx-editing">
                    <div className="wf-apx-editing-label">
                      editing · your version is what gets sent
                    </div>
                    <textarea
                      name="text"
                      className="wf-apx-textarea"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="wf-apx-doc">{sel.body}</div>
                )}
              </div>

              <div className="wf-apx-foot">
                <input
                  className="wf-apx-note"
                  name="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`note to ${sel.agentName.toLowerCase()} (optional) · e.g. softer opening`}
                />
                <div className="wf-apx-actions">
                  {editing ? (
                    <>
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={sendEditAction}
                      >
                        {sel.outbound
                          ? "send edited version"
                          : "approve edited"}
                      </button>
                      <button
                        type="button"
                        className="wf-apx-btn ghost"
                        onClick={() => setEditing(false)}
                      >
                        cancel edit
                      </button>
                    </>
                  ) : sel.held ? (
                    <>
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={approveAction}
                      >
                        release
                      </button>
                      <button
                        type="button"
                        className="wf-apx-btn ghost"
                        onClick={startEdit}
                      >
                        edit first
                      </button>
                    </>
                  ) : sel.outbound ? (
                    <>
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={approveAction}
                      >
                        {sel.channel === "linkedin" ? "publish" : "send"}
                      </button>
                      <button
                        type="button"
                        className="wf-apx-btn ghost"
                        onClick={startEdit}
                      >
                        edit &amp; send
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={approveAction}
                      >
                        approve
                      </button>
                      <button
                        type="button"
                        className="wf-apx-btn ghost"
                        onClick={startEdit}
                      >
                        edit
                      </button>
                    </>
                  )}
                  <button
                    type="submit"
                    className="wf-apx-btn danger"
                    formAction={rejectAction}
                  >
                    reject
                  </button>
                  <span className="wf-apx-hint">
                    nothing leaves until you press it. the bridge acts within a
                    minute.
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="wf-apx-decided">
          <div className="wf-apx-decided-head">
            <span>when</span>
            <span>agent</span>
            <span>action</span>
            <span>decision</span>
          </div>
          {decided.length === 0 ? (
            <div className="wf-apx-empty in-table">nothing decided yet.</div>
          ) : (
            decided.map((d) => (
              <div key={d.id} className="wf-apx-decided-row">
                <span className="wf-apx-decided-when">{d.when}</span>
                <span className="wf-apx-decided-agent">
                  <span>{d.emoji}</span>
                  <span className="strong">{d.agentName}</span>
                </span>
                <span className="wf-apx-decided-action">{d.action}</span>
                <span>
                  <span
                    className={`wf-apx-decision${d.bad ? " is-bad" : " is-good"}`}
                  >
                    {d.status}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
