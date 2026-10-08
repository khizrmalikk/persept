"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadKnowledgeFile } from "@/lib/workforce/actions";

// The agents that can receive a knowledge file. Scribe is checked by default.
const AGENTS: { id: string; label: string }[] = [
  { id: "scribe", label: "scribe" },
  { id: "hunter", label: "hunter" },
  { id: "muse", label: "muse" },
  { id: "chief", label: "chief" },
  { id: "scout", label: "scout" },
  { id: "fixer", label: "fixer" },
];

const MAX_FILES = 40;

export function KnowledgeUploader({
  projects = [],
}: {
  projects?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [agents, setAgents] = useState<Set<string>>(new Set(["scribe"]));
  const [project, setProject] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [pending, start] = useTransition();

  const single = files.length === 1;

  const toggle = (id: string) =>
    setAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const picked = Array.from(e.target.files ?? []).slice(0, MAX_FILES);
    setFiles(picked);
    if (picked.length === 1 && !title.trim())
      setTitle(picked[0].name.replace(/\.[a-z0-9]+$/i, ""));
  };

  const onProject = (id: string) => {
    setProject(id);
    // a project upload is for Claude Code inside that repo: default-add fixer.
    if (id) setAgents((prev) => new Set(prev).add("fixer"));
  };

  const reset = () => {
    setFiles([]);
    setTitle("");
    setSummary("");
    setAgents(new Set(["scribe"]));
    setProject("");
    setProgress("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    if (!files.length) {
      setError("choose a file first");
      return;
    }
    setError("");
    start(async () => {
      for (let i = 0; i < files.length; i++) {
        setProgress(
          files.length > 1
            ? `uploading ${i + 1}/${files.length}…`
            : "uploading…",
        );
        const fd = new FormData();
        fd.set("file", files[i]);
        // one shared title only makes sense for a single file; otherwise each
        // file's title defaults to its own name (server-side).
        if (single) fd.set("title", title.trim());
        fd.set("summary", summary.trim());
        for (const id of agents) fd.append("agents", id);
        if (project) fd.set("project", project);
        const res = await uploadKnowledgeFile(fd);
        if ("error" in res) {
          setError(`${files[i].name}: ${res.error}`);
          setProgress("");
          router.refresh();
          return;
        }
      }
      reset();
      router.refresh();
    });
  };

  return (
    <div className="wf-hn-panel wf-kb-uploader">
      <div className="wf-hn-panel-title">add files</div>
      <div className="wf-kb-uprow">
        <button
          type="button"
          className="wf-hn-btn ghost"
          onClick={() => fileRef.current?.click()}
        >
          {files.length === 0
            ? "choose files"
            : single
              ? files[0].name
              : `${files.length} files`}
        </button>
        <span className="wf-hn-note">
          pdf, docx, md, txt, csv · max 15mb each · up to {MAX_FILES} at once
        </span>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.md,.markdown,.txt,.csv"
          hidden
          onChange={onFile}
        />
      </div>

      {single && (
        <label className="wf-hn-field">
          title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="defaults to the file name"
          />
        </label>
      )}
      {!single && files.length > 1 && (
        <span className="wf-hn-note">
          titles default to each file&rsquo;s name
        </span>
      )}
      <label className="wf-hn-field">
        summary — optional
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="one line on what this is"
        />
      </label>

      {projects.length > 0 && (
        <label className="wf-hn-field">
          project — optional
          <select value={project} onChange={(e) => onProject(e.target.value)}>
            <option value="">none</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="wf-kb-agents">
        <span className="wf-hn-note">give it to</span>
        {AGENTS.map((a) => {
          const on = agents.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              className={`wf-hn-toggle${on ? " on" : ""}`}
              onClick={() => toggle(a.id)}
            >
              {on ? "✓ " : ""}
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="wf-kb-upfoot">
        <button
          type="button"
          className="wf-hn-btn amber"
          disabled={pending}
          onClick={submit}
        >
          {pending ? progress || "uploading…" : "upload"}
        </button>
        {error && <span className="wf-kb-err">{error}</span>}
      </div>
    </div>
  );
}
