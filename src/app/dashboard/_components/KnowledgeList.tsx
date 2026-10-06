"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  removeKnowledgeFile,
  updateKnowledgeFile,
} from "@/lib/workforce/actions";
// type-only: knowledge.ts is server-only (supabaseAdmin).
import type { KnowledgeFile } from "@/lib/workforce/knowledge";
import { when } from "@/lib/workforce/types";

const AGENTS = ["scribe", "hunter", "muse", "chief", "scout"];

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} kb`;
  return `${bytes} b`;
}

function Row({ file }: { file: KnowledgeFile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [agents, setAgents] = useState<string[]>(file.agent_ids);
  const [pending, start] = useTransition();

  const remove = () => {
    if (!confirm(`remove “${file.title}”? the agents lose their copy.`)) return;
    start(async () => {
      await removeKnowledgeFile(file.id);
      router.refresh();
    });
  };

  const toggle = (id: string) =>
    setAgents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  if (editing) {
    return (
      <form
        className="wf-kb-item"
        action={async (fd) => {
          await updateKnowledgeFile(fd);
          setEditing(false);
          router.refresh();
        }}
      >
        <input type="hidden" name="id" value={file.id} />
        {agents.map((a) => (
          <input key={a} type="hidden" name="agents" value={a} />
        ))}
        <label className="wf-hn-field">
          title
          <input name="title" defaultValue={file.title} />
        </label>
        <label className="wf-hn-field">
          summary
          <input
            name="summary"
            defaultValue={file.summary}
            placeholder="one line on what this is"
          />
        </label>
        <div className="wf-kb-agents">
          <span className="wf-hn-note">give it to</span>
          {AGENTS.map((a) => {
            const on = agents.includes(a);
            return (
              <button
                key={a}
                type="button"
                className={`wf-hn-toggle${on ? " on" : ""}`}
                onClick={() => toggle(a)}
              >
                {on ? "✓ " : ""}
                {a}
              </button>
            );
          })}
        </div>
        <div className="wf-kb-upfoot">
          <button type="submit" className="wf-hn-btn amber">
            save changes
          </button>
          <button
            type="button"
            className="wf-hn-btn ghost"
            onClick={() => setEditing(false)}
          >
            cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="wf-kb-item">
      <div className="wf-kb-item-top">
        <span className="wf-kb-title">{file.title}</span>
        <span className="wf-kb-meta">
          {sizeLabel(file.bytes)} ·{" "}
          {file.created_at ? when(file.created_at) : ""}
        </span>
      </div>
      <div className="wf-kb-chips">
        {file.agent_ids.map((a) => (
          <span key={a} className="wf-chip-mono">
            {a}
          </span>
        ))}
      </div>
      {file.summary && <div className="wf-kb-summary">{file.summary}</div>}
      <div className="wf-kb-preview">
        {file.text ? (
          file.text.slice(0, 200)
        ) : (
          <span className="wf-kb-notext">
            no text could be read from this file
          </span>
        )}
      </div>
      <div className="wf-kb-actions">
        <button
          type="button"
          className="wf-hn-btn ghost sm"
          onClick={() => setEditing(true)}
        >
          edit
        </button>
        <button
          type="button"
          className="wf-hn-btn danger sm"
          disabled={pending}
          onClick={remove}
        >
          {pending ? "removing…" : "remove"}
        </button>
      </div>
    </div>
  );
}

export function KnowledgeList({ files }: { files: KnowledgeFile[] }) {
  if (files.length === 0) {
    return (
      <div className="wf-hn-empty">
        nothing uploaded yet. add a file above and the agents you pick receive
        it within two minutes.
      </div>
    );
  }
  return (
    <div className="wf-kb-list">
      {files.map((f) => (
        <Row key={f.id} file={f} />
      ))}
    </div>
  );
}
