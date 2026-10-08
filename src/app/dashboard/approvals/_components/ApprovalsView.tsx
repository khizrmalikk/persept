"use client";

import { diffWords } from "diff";
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
  // true when Scribe raised a "question about …" approval (ask, don't send).
  isQuestion: boolean;
  // merge approval ("merge PR #n in <project>"): merge on approve, not send.
  isMerge: boolean;
  prNumber: number | null;
  prProject: string;
};

// The fix behind a merge approval (checks, screenshots, PR link), keyed by id.
export type MergeVM = {
  prUrl: string;
  prNumber: number | null;
  project: string;
  checks: { cmd: string; ok: boolean; tail: string }[];
  shots: { name: string; url: string }[];
};

export type DecidedVM = {
  id: number;
  when: string;
  emoji: string;
  agentName: string;
  action: string;
  status: string;
  bad: boolean;
  versions: number;
};

// One row of a message's draft history (serialized server-side, ready to render).
export type VersionVM = {
  id: string;
  n: number;
  author: string;
  authorLabel: string;
  kind: string;
  kindLabel: string;
  when: string;
  note: string;
  subject: string;
  body: string;
  diffable: boolean; // revision | edited → show a diff vs the previous body
};

// copy_request meta shown above a question (company · kind · channel).
export type CopyMetaVM = {
  company: string;
  kind: string;
  channel: string;
};

type Action = (fd: FormData) => void | Promise<void>;
type Tab = "waiting" | "held" | "decided";

// The draft history for one message: a collapsible list of versions; click one to
// see its subject/body, with a word diff for revisions / edits. Open by default
// when there's more than one version.
function HistoryPanel({ versions }: { versions: VersionVM[] }) {
  const [open, setOpen] = useState(versions.length > 1);
  const [sel, setSel] = useState<number | null>(null);
  if (!versions.length) return null;

  const prevBody = (i: number) => {
    for (let j = i - 1; j >= 0; j--)
      if (versions[j].body.trim()) return versions[j].body;
    return "";
  };

  return (
    <div className="wf-apx-history">
      <button
        type="button"
        className="wf-apx-history-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        history <span className="wf-apx-history-ct">{versions.length}</span>
      </button>
      {open && (
        <ol className="wf-apx-history-list">
          {versions.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                className={`wf-apx-history-row${sel === i ? " is-sel" : ""}`}
                onClick={() => setSel(sel === i ? null : i)}
              >
                <span className="wf-apx-history-n">v{v.n}</span>
                <span className={`wf-apx-history-author is-${v.author}`}>
                  {v.authorLabel}
                </span>
                <span className="wf-apx-history-kind">{v.kindLabel}</span>
                <span className="wf-apx-history-when">{v.when}</span>
              </button>
              {v.note && <div className="wf-apx-history-note">{v.note}</div>}
              {sel === i && (v.subject || v.body) && (
                <div className="wf-apx-history-detail">
                  {v.subject && (
                    <div className="wf-apx-history-subject">{v.subject}</div>
                  )}
                  {v.diffable && prevBody(i) ? (
                    <WordDiff prev={prevBody(i)} next={v.body} />
                  ) : (
                    v.body && (
                      <div className="wf-apx-history-body">{v.body}</div>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Word-level diff of two bodies: additions green, removals struck-through.
function WordDiff({ prev, next }: { prev: string; next: string }) {
  const parts = diffWords(prev, next);
  return (
    <div className="wf-apx-diff">
      {parts.map((p, i) => {
        // diff segments are positional + render-stable, so the index is a fine key
        const key = `d${i}`;
        if (p.added)
          return (
            <ins key={key} className="wf-apx-diff-add">
              {p.value}
            </ins>
          );
        if (p.removed)
          return (
            <del key={key} className="wf-apx-diff-del">
              {p.value}
            </del>
          );
        return <span key={key}>{p.value}</span>;
      })}
    </div>
  );
}

// whatsapp / instagram / linkedin drafts are sent by the owner by hand: give him
// a one-tap open link right in the detail (digits only for wa.me; a handle for
// ig; the profile URL for linkedin, which has no permitted send API).
function manualSendHref(
  channel: string,
  to: string,
  body: string,
): { label: string; href: string } | null {
  const ch = channel.toLowerCase();
  if (ch === "whatsapp") {
    const m = to.match(/wa\.me\/(\+?\d+)/i);
    const digits = (m ? m[1] : to).replace(/\D/g, "");
    if (!digits) return null;
    return {
      label: "open in whatsapp",
      href: `https://wa.me/${digits}?text=${encodeURIComponent(body)}`,
    };
  }
  if (ch === "instagram") {
    const urlMatch = to.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
    const handle = urlMatch ? urlMatch[1] : to.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9._]{2,30}$/.test(handle)) return null;
    return { label: "open instagram", href: `https://instagram.com/${handle}` };
  }
  if (ch === "linkedin") {
    const c = to.trim();
    const href = /^https?:\/\//i.test(c)
      ? c
      : /linkedin\.com\//i.test(c)
        ? `https://${c.replace(/^\/+/, "")}`
        : "";
    if (!href) return null;
    return { label: "open profile", href };
  }
  return null;
}

// a copy-to-clipboard button for the manual-send body (approvals is a client view).
function CopyBody({ body }: { body: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="wf-apx-btn ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(body);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? "copied" : "copy message"}
    </button>
  );
}

// recipient picker for "send back": scribe rewrites the draft, hunter acts on the
// prospect/CRM. Renders toggle chips plus the hidden <input name="recipients"> the
// server action reads. Used both on a single approval and in the bulk bar.
type Recip = { scribe: boolean; hunter: boolean };
function RecipientChips({
  value,
  onChange,
}: {
  value: Recip;
  onChange: (v: Recip) => void;
}) {
  const chip = (key: keyof Recip, label: string) => (
    <button
      type="button"
      className={`wf-apx-recip${value[key] ? " is-on" : ""}`}
      aria-pressed={value[key]}
      onClick={() => onChange({ ...value, [key]: !value[key] })}
    >
      {label}
    </button>
  );
  return (
    <span className="wf-apx-recips">
      <span className="wf-apx-recips-lbl">send to</span>
      {chip("scribe", "scribe")}
      {chip("hunter", "hunter")}
      {value.scribe && <input type="hidden" name="recipients" value="scribe" />}
      {value.hunter && <input type="hidden" name="recipients" value="hunter" />}
    </span>
  );
}

export function ApprovalsView({
  waiting,
  held,
  decided,
  approveAction,
  rejectAction,
  sendEditAction,
  returnAction,
  bulkAction,
  embedded = false,
  history = {},
  copyMeta = {},
  mergeInfo = {},
}: {
  waiting: ApprovalVM[];
  held: ApprovalVM[];
  decided: DecidedVM[];
  approveAction: Action;
  rejectAction: Action;
  sendEditAction: Action;
  returnAction: Action;
  bulkAction: Action;
  // Rendered inside another page (e.g. the Hunter approvals tab): drop the big
  // page title block and keep just the tabs, since the host already has a header.
  embedded?: boolean;
  // Draft-version chains + copy-request meta, keyed by approval id.
  history?: Record<number, VersionVM[]>;
  copyMeta?: Record<number, CopyMetaVM>;
  // the fix behind each merge approval (checks / screenshots / PR link).
  mergeInfo?: Record<number, MergeVM>;
}) {
  const [tab, setTab] = useState<Tab>("waiting");
  const [selId, setSelId] = useState<number | null>(waiting[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  // bulk multi-select + its note/recipients; per-approval send-back recipients.
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [bulkRecip, setBulkRecip] = useState<Recip>({
    scribe: true,
    hunter: false,
  });
  const [recip, setRecip] = useState<Recip>({ scribe: true, hunter: false });

  // reset edit state whenever the pending set changes (i.e. after a decision)
  const listKey = `${waiting.map((x) => x.id).join(",")}|${held
    .map((x) => x.id)
    .join(",")}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: listKey is the change signal (pending set changed after a decision)
  useEffect(() => {
    setEditing(false);
    setNote("");
    setDraft("");
    setPicked(new Set());
    setBulkNote("");
    setRecip({ scribe: true, hunter: false });
  }, [listKey]);

  const list = tab === "held" ? held : waiting;
  const sel = list.find((x) => x.id === selId) ?? list[0] ?? null;

  const selectTab = (t: Tab) => {
    setTab(t);
    setEditing(false);
    setNote("");
    setDraft("");
    setPicked(new Set());
    setBulkNote("");
    if (t !== "decided")
      setSelId((t === "held" ? held : waiting)[0]?.id ?? null);
  };
  const select = (id: number) => {
    setSelId(id);
    setEditing(false);
    setNote("");
    setDraft("");
    setRecip({ scribe: true, hunter: false });
  };
  const togglePick = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allPicked = list.length > 0 && list.every((x) => picked.has(x.id));
  const toggleAll = () =>
    setPicked(allPicked ? new Set() : new Set(list.map((x) => x.id)));
  const pickedIds = list.filter((x) => picked.has(x.id)).map((x) => x.id);
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
    <div className={`wf-apx${embedded ? " is-embedded" : ""}`}>
      <header className="wf-apx-head">
        {!embedded && (
          <div>
            <div className="wf-apx-eyebrow">approvals</div>
            <h1 className="wf-apx-title">waiting for you</h1>
            <p className="wf-apx-lede">
              agents draft and prepare. you press send, merge, publish and pay.
            </p>
          </div>
        )}
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
        <>
          <div className="wf-apx-body">
            <div className="wf-apx-list">
              {list.length > 0 && (
                <div className="wf-apx-listbar">
                  <label className="wf-apx-selall">
                    <input
                      type="checkbox"
                      checked={allPicked}
                      onChange={toggleAll}
                    />
                    <span>
                      {pickedIds.length > 0
                        ? `${pickedIds.length} selected`
                        : "select all"}
                    </span>
                  </label>
                  {pickedIds.length > 0 && (
                    <button
                      type="button"
                      className="wf-apx-selclear"
                      onClick={() => setPicked(new Set())}
                    >
                      clear
                    </button>
                  )}
                </div>
              )}
              {list.length === 0 ? (
                <div className="wf-apx-empty">{emptyText}</div>
              ) : (
                list.map((q) => {
                  const active = sel?.id === q.id;
                  const checked = picked.has(q.id);
                  return (
                    <div
                      className={`wf-apx-row${checked ? " is-picked" : ""}`}
                      key={q.id}
                    >
                      <input
                        type="checkbox"
                        className="wf-apx-check"
                        checked={checked}
                        onChange={() => togglePick(q.id)}
                        aria-label={`select ${q.agentName} · ${q.action}`}
                      />
                      <button
                        type="button"
                        className={`wf-apx-card${active ? " is-sel" : ""}`}
                        onClick={() => select(q.id)}
                        style={
                          active ? { borderColor: q.selBorder } : undefined
                        }
                      >
                        <span className="wf-apx-card-top">
                          <span
                            className="wf-apx-tile sm"
                            style={{ background: q.tint }}
                          >
                            {q.emoji}
                          </span>
                          <span className="wf-apx-card-name">
                            {q.agentName}
                          </span>
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
                    </div>
                  );
                })
              )}
            </div>

            {sel && (
              <form
                className="wf-apx-detail"
                action={approveAction}
                key={sel.id}
              >
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
                    <span className="wf-apx-detail-when">
                      drafted {sel.when}
                    </span>
                    <span className={`wf-apx-risk lg is-${sel.risk}`}>
                      {sel.risk} risk
                    </span>
                  </div>
                  <div className="wf-apx-detail-action">
                    {sel.isQuestion ? "scribe asks" : sel.action}
                  </div>
                  <div className="wf-apx-detail-why">
                    why it needs you: {sel.reason}
                  </div>
                </div>

                {sel.outbound && !sel.isQuestion && (
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

                {sel.isQuestion && copyMeta[sel.id] && (
                  <dl className="wf-apx-meta">
                    <dt>request</dt>
                    <dd className="strong">
                      {copyMeta[sel.id].company || "—"}
                    </dd>
                    {copyMeta[sel.id].kind && (
                      <>
                        <dt>kind</dt>
                        <dd>{copyMeta[sel.id].kind}</dd>
                      </>
                    )}
                    {copyMeta[sel.id].channel && (
                      <>
                        <dt>channel</dt>
                        <dd>
                          <span className="wf-apx-chip">
                            {copyMeta[sel.id].channel}
                          </span>
                        </dd>
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

                {sel.isMerge && mergeInfo[sel.id] && (
                  <div className="wf-apx-merge">
                    {mergeInfo[sel.id].prUrl && (
                      <a
                        className="wf-apx-btn primary"
                        href={mergeInfo[sel.id].prUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {mergeInfo[sel.id].prNumber
                          ? `open PR #${mergeInfo[sel.id].prNumber}`
                          : "open pull request"}{" "}
                        ↗
                      </a>
                    )}
                    {mergeInfo[sel.id].checks.length > 0 && (
                      <ul className="wf-apx-merge-checks">
                        {mergeInfo[sel.id].checks.map((c, i) => (
                          <li
                            key={`${c.cmd}-${i}`}
                            className={c.ok ? "ok" : "bad"}
                          >
                            <span className="wf-apx-merge-cmd">
                              {c.ok ? "✓" : "✗"} {c.cmd}
                            </span>
                            {!c.ok && c.tail && (
                              <pre className="wf-apx-merge-tail">{c.tail}</pre>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {mergeInfo[sel.id].shots.length > 0 && (
                      <div className="wf-apx-merge-shots">
                        {mergeInfo[sel.id].shots.map((s) => (
                          <a
                            key={s.name}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {/* biome-ignore lint/performance/noImgElement: signed storage URL, not a build-time asset */}
                            <img
                              src={s.url}
                              alt={s.name}
                              className="wf-apx-merge-shot"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  const ms =
                    sel.outbound && !editing
                      ? manualSendHref(sel.channel, sel.to, sel.body)
                      : null;
                  if (!ms) return null;
                  const isLinkedin = sel.channel.toLowerCase() === "linkedin";
                  const isConnectionNote =
                    isLinkedin &&
                    /connection note/i.test(`${sel.reason}\n${sel.body}`);
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "0 20px 4px",
                      }}
                    >
                      {isConnectionNote && (
                        <div
                          className="wf-ls-counter"
                          style={{ width: "100%" }}
                        >
                          <span
                            className={sel.body.length > 300 ? "over" : "amber"}
                          >
                            {sel.body.length}
                          </span>{" "}
                          / 300 · connection note
                        </div>
                      )}
                      <span className="wf-apx-hint">
                        you send this one{" "}
                        {isLinkedin ? "by hand" : "from your phone"} —
                      </span>
                      <CopyBody body={sel.body} />
                      <a
                        className="wf-apx-btn primary"
                        href={ms.href}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {ms.label}
                      </a>
                    </div>
                  );
                })()}

                {(history[sel.id]?.length ?? 0) > 0 && (
                  <div className="wf-apx-history-wrap">
                    <HistoryPanel versions={history[sel.id]} />
                  </div>
                )}

                {sel.isMerge ? (
                  <div className="wf-apx-foot">
                    <textarea
                      className="wf-apx-note"
                      name="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="note (optional) · sent to fixer if you reject"
                    />
                    <div className="wf-apx-actions">
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={approveAction}
                      >
                        merge
                      </button>
                      <button
                        type="submit"
                        className="wf-apx-btn danger"
                        formAction={rejectAction}
                      >
                        reject
                      </button>
                      <span className="wf-apx-hint">
                        merging runs on the bridge after you approve. reject
                        with a note to send it back to fixer.
                      </span>
                    </div>
                  </div>
                ) : sel.isQuestion ? (
                  <div className="wf-apx-foot">
                    <textarea
                      className="wf-apx-note"
                      name="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="your answer — scribe uses it to continue the draft…"
                    />
                    <div className="wf-apx-actions">
                      <button
                        type="submit"
                        className="wf-apx-btn primary"
                        formAction={returnAction}
                      >
                        answer and continue
                      </button>
                      <button
                        type="submit"
                        className="wf-apx-btn danger"
                        formAction={rejectAction}
                      >
                        drop this request
                      </button>
                      <span className="wf-apx-hint">
                        your answer goes back to scribe; it continues the draft
                        and re-raises it here.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="wf-apx-foot">
                    <textarea
                      className="wf-apx-note"
                      name="note"
                      rows={3}
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
                            {sel.channel === "linkedin"
                              ? "mark sent"
                              : sel.channel.includes("post")
                                ? "publish"
                                : "send"}
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
                      {!editing && sel.body.trim().length > 0 && (
                        <>
                          <RecipientChips value={recip} onChange={setRecip} />
                          <button
                            type="submit"
                            className="wf-apx-btn ghost"
                            formAction={returnAction}
                            title="send your note + this draft back: scribe rewrites and re-raises it; hunter acts on the prospect in the CRM"
                          >
                            send back
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
                        {sel.body.trim().length > 0
                          ? "send back routes your note + draft to scribe (rewrite) and/or hunter (move the prospect). reject just closes it."
                          : "nothing leaves until you press it. the bridge acts within a minute."}
                      </span>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
          {pickedIds.length > 0 && (
            <form className="wf-apx-bulkbar" action={bulkAction}>
              {pickedIds.map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <span className="wf-apx-bulk-count">
                {pickedIds.length} selected
              </span>
              <textarea
                className="wf-apx-bulk-note"
                name="note"
                rows={1}
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="note for send back / reject (optional)"
              />
              <RecipientChips value={bulkRecip} onChange={setBulkRecip} />
              <div className="wf-apx-bulk-actions">
                <button
                  type="submit"
                  name="op"
                  value="return"
                  className="wf-apx-btn ghost"
                >
                  send back
                </button>
                {tab === "held" ? (
                  <button
                    type="submit"
                    name="op"
                    value="unhold"
                    className="wf-apx-btn ghost"
                  >
                    move to waiting
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="op"
                    value="hold"
                    className="wf-apx-btn ghost"
                  >
                    hold
                  </button>
                )}
                <button
                  type="submit"
                  name="op"
                  value="reject"
                  className="wf-apx-btn danger"
                >
                  reject
                </button>
                <button
                  type="submit"
                  name="op"
                  value="approve"
                  className="wf-apx-btn primary"
                  onClick={(e) => {
                    if (
                      !window.confirm(
                        `approve and send ${pickedIds.length} item(s) now? this fires everything outbound at once.`,
                      )
                    )
                      e.preventDefault();
                  }}
                >
                  approve all
                </button>
              </div>
            </form>
          )}
        </>
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
                <span className="wf-apx-decided-action">
                  {d.action}
                  {d.versions > 1 && (
                    <span className="wf-apx-versions-tag">
                      {d.versions} versions
                    </span>
                  )}
                </span>
                <span>
                  <span
                    className={`wf-apx-decision${
                      d.bad
                        ? " is-bad"
                        : d.status === "returned"
                          ? " is-info"
                          : " is-good"
                    }`}
                  >
                    {d.status === "returned" ? "sent to scribe" : d.status}
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
