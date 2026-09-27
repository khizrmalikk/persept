"use client";

import { useState, useTransition } from "react";
import {
  addBacklogItem,
  backlogDoneFromForm,
  backlogDropFromForm,
  backlogReopenFromForm,
  sendAgentCommand,
  updateBacklogItem,
} from "@/lib/workforce/actions";
// type-only import: backlog.ts is server-only (uses supabaseAdmin), so we pull the
// shapes without bundling the reads into the client.
import type { BacklogItem, BacklogPriority } from "@/lib/workforce/backlog";
import { ago } from "@/lib/workforce/types";
import { dueState } from "./dates";

const PRIORITIES: BacklogPriority[] = ["high", "normal", "low"];

type AgentOpt = { id: string; emoji: string; name: string };

function sourceLabel(source: string): string {
  if (source === "dashboard") return "added by you";
  if (!source) return "";
  return `added by ${source}`;
}

// title, detail, owner, due, priority fields — shared by the add + edit forms.
function Fields({ item, owners }: { item?: BacklogItem; owners: string[] }) {
  return (
    <>
      <label className="wf-field wf-bl-span">
        <span>title</span>
        <input
          type="text"
          name="title"
          defaultValue={item?.title ?? ""}
          placeholder="what needs doing?"
          required
        />
      </label>
      <label className="wf-field wf-bl-span">
        <span>detail</span>
        <textarea
          name="detail"
          rows={2}
          defaultValue={item?.detail ?? ""}
          placeholder="context (optional)"
        />
      </label>
      <label className="wf-field">
        <span>owner</span>
        <select name="owner" defaultValue={item?.owner ?? "owner"}>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label className="wf-field">
        <span>due</span>
        <input type="date" name="due" defaultValue={item?.due ?? ""} />
      </label>
      <label className="wf-field">
        <span>priority</span>
        <select name="priority" defaultValue={item?.priority ?? "normal"}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function Row({
  item,
  agents,
  owners,
  open,
  editing,
  onToggle,
  onEdit,
  onEditDone,
}: {
  item: BacklogItem;
  agents: AgentOpt[];
  owners: string[];
  open: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEditDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [handTo, setHandTo] = useState(agents[0]?.id ?? "");
  const due = item.due ? dueState(item.due) : "";
  const dueCls =
    due === "overdue" ? "err" : due === "today" ? "accent" : "muted";

  if (editing) {
    return (
      <li className="wf-bl-item is-editing">
        <form action={updateBacklogItem} className="wf-bl-form">
          <input type="hidden" name="id" value={item.id} />
          <div className="wf-bl-grid">
            <Fields item={item} owners={owners} />
          </div>
          <div className="wf-bl-form-actions">
            <button
              type="button"
              className="act sm secondary"
              onClick={onEditDone}
            >
              cancel
            </button>
            <button type="submit" className="act sm" onClick={onEditDone}>
              save
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`wf-bl-item${open ? " is-open" : ""}`}>
      <div className="wf-bl-row">
        <button
          type="button"
          className="wf-bl-title"
          onClick={onToggle}
          aria-expanded={open}
        >
          {item.title}
        </button>
        <span className="wf-bl-meta">
          <span className={`wf-bl-owner owner-${item.owner}`}>
            {item.owner}
          </span>
          {item.due && (
            <span className={`wf-bl-due ${dueCls}`}>{item.due}</span>
          )}
          <span className="wf-bl-age mono">{ago(item.created_at)}</span>
        </span>
      </div>

      {open && (
        <div className="wf-bl-detail">
          {item.detail && <p className="wf-bl-detail-text">{item.detail}</p>}
          {item.source && (
            <p className="wf-bl-src">{sourceLabel(item.source)}</p>
          )}
          <div className="wf-bl-actions">
            <form action={backlogDoneFromForm}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="act sm">
                done
              </button>
            </form>
            <form action={backlogDropFromForm}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="act sm secondary">
                drop
              </button>
            </form>
            <button type="button" className="act sm secondary" onClick={onEdit}>
              edit
            </button>
            {agents.length > 0 && (
              <span className="wf-bl-hand">
                <select
                  value={handTo}
                  aria-label="hand this item to an agent"
                  onChange={(e) => setHandTo(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.emoji} {a.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="act sm secondary"
                  disabled={pending || !handTo}
                  onClick={() =>
                    start(() => {
                      void sendAgentCommand(
                        "chief",
                        `hand this to ${handTo}: ${item.title} (backlog ${item.id.slice(0, 8)})`,
                      );
                    })
                  }
                >
                  hand
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function BacklogPanel({
  items,
  done,
  agents,
}: {
  items: BacklogItem[];
  done: BacklogItem[];
  agents: AgentOpt[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const owners = ["owner", ...agents.map((a) => a.id)];

  const groups = PRIORITIES.map((p) => ({
    priority: p,
    rows: items.filter((i) => i.priority === p),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="wf-bl">
      <div className="wf-bl-top">
        <button
          type="button"
          className="act sm"
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? "close" : "+ add item"}
        </button>
      </div>
      {showAdd && (
        <form
          action={addBacklogItem}
          className="wf-bl-form wf-bl-add"
          onSubmit={() => setShowAdd(false)}
        >
          <div className="wf-bl-grid">
            <Fields owners={owners} />
          </div>
          <div className="wf-bl-form-actions">
            <button type="submit" className="act sm">
              add to backlog
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="wf-of-mini-empty">backlog is clear.</p>
      ) : (
        groups.map((g) => (
          <section key={g.priority} className="wf-bl-group">
            <div className="wf-bl-group-head">
              <span className={`wf-bl-prio is-${g.priority}`}>
                {g.priority}
              </span>
              <span className="wf-bl-group-n">{g.rows.length}</span>
            </div>
            <ul className="wf-bl-list">
              {g.rows.map((it) => (
                <Row
                  key={it.id}
                  item={it}
                  agents={agents}
                  owners={owners}
                  open={openId === it.id}
                  editing={editId === it.id}
                  onToggle={() =>
                    setOpenId((v) => (v === it.id ? null : it.id))
                  }
                  onEdit={() => setEditId(it.id)}
                  onEditDone={() => setEditId(null)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {done.length > 0 && (
        <div className="wf-bl-donesec">
          <button
            type="button"
            className="wf-bl-done-toggle"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
          >
            done ({done.length})
          </button>
          {showDone && (
            <ul className="wf-bl-donelist">
              {done.map((d) => (
                <li key={d.id} className="wf-bl-doneitem">
                  <span className="wf-bl-done-title">{d.title}</span>
                  <span className="wf-bl-done-when mono">
                    {d.done_at ? ago(d.done_at) : ""}
                  </span>
                  <form action={backlogReopenFromForm}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="wf-bl-reopen">
                      reopen
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
