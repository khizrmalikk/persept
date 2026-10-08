"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeKnowledgeFile,
  researchProjectNow,
  uploadKnowledgeFile,
} from "@/lib/workforce/actions";
// type-only: these libs are server-only (supabaseAdmin).
import type { KnowledgeFile } from "@/lib/workforce/knowledge";
import type { Project } from "@/lib/workforce/projects";
import { when } from "@/lib/workforce/types";
import { ProjectForm } from "./ProjectForm";

export type ProjectStats = {
  openPrs: number;
  merged30: number;
  lastActivity: string | null;
};

// Multi-file upload attached to this project: each file uploads with project set
// (agent defaults to fixer server-side).
function FileUpload({ projectId }: { projectId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setErr("");
    start(async () => {
      for (const f of files) {
        const fd = new FormData();
        fd.set("file", f);
        fd.set("project", projectId);
        const res = await uploadKnowledgeFile(fd);
        if ("error" in res) {
          setErr(res.error);
          break;
        }
      }
      if (ref.current) ref.current.value = "";
    });
  };
  return (
    <div className="wf-proj-upload">
      <button
        type="button"
        className="wf-hn-btn ghost sm"
        disabled={pending}
        onClick={() => ref.current?.click()}
      >
        {pending ? "uploading…" : "add files"}
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept=".pdf,.docx,.md,.markdown,.txt,.csv"
        hidden
        onChange={onPick}
      />
      {err && <span className="wf-kb-err">{err}</span>}
    </div>
  );
}

function RemoveFile({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="wf-proj-remove"
      disabled={pending}
      onClick={() => {
        if (!confirm(`remove “${title}”?`)) return;
        start(() => void removeKnowledgeFile(id));
      }}
    >
      remove
    </button>
  );
}

export function ProjectCard({
  project,
  stats,
  files,
}: {
  project: Project;
  stats: ProjectStats;
  files: KnowledgeFile[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const p = project;
  return (
    <div className="wf-proj-card">
      <div className="wf-proj-head">
        <div className="wf-proj-title">
          <span className="wf-proj-name">{p.name}</span>
          {!p.enabled && <span className="wf-chip sm ghost">disabled</span>}
        </div>
        <div className="wf-proj-actions">
          <button
            type="button"
            className="wf-hn-btn ghost sm"
            disabled={pending}
            onClick={() => start(() => void researchProjectNow(p.id, p.name))}
          >
            {pending ? "…" : "research now"}
          </button>
          <button
            type="button"
            className="wf-hn-btn ghost sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "close" : "edit"}
          </button>
        </div>
      </div>

      <div className="wf-proj-repo">
        {p.repo ? (
          <a
            href={`https://github.com/${p.repo}`}
            target="_blank"
            rel="noreferrer"
          >
            {p.repo}
          </a>
        ) : (
          <span className="wf-proj-norepo">no repository yet</span>
        )}
      </div>

      <div className="wf-proj-stats">
        <span>
          <strong>{stats.openPrs}</strong> open PR
          {stats.openPrs === 1 ? "" : "s"}
        </span>
        <span>
          <strong>{stats.merged30}</strong> merged · 30d
        </span>
        <span>
          last activity {stats.lastActivity ? when(stats.lastActivity) : "—"}
        </span>
        <span>
          research: {p.research_cadence === "weekly" ? "weekly" : "on request"}
        </span>
      </div>

      {editing && <ProjectForm project={p} />}

      <div className="wf-proj-files">
        <div className="wf-proj-files-head">files for this project</div>
        {files.length === 0 ? (
          <p className="wf-hn-note">nothing attached yet.</p>
        ) : (
          <ul className="wf-proj-filelist">
            {files.map((f) => (
              <li key={f.id} className="wf-proj-fileitem">
                <span className="wf-proj-filename">{f.title}</span>
                <span className="wf-proj-filedate mono">
                  {f.created_at ? when(f.created_at) : ""}
                </span>
                <RemoveFile id={f.id} title={f.title} />
              </li>
            ))}
          </ul>
        )}
        <FileUpload projectId={p.id} />
        <p className="wf-hn-note">
          notes, specs, screenshots-as-text, API docs: anything Claude Code
          should read before changing this repo.
        </p>
      </div>
    </div>
  );
}
