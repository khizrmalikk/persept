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
];

export function KnowledgeUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [agents, setAgents] = useState<Set<string>>(new Set(["scribe"]));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return;
    setFileName(f.name);
    if (!title.trim()) setTitle(f.name.replace(/\.[a-z0-9]+$/i, ""));
  };

  const submit = () => {
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setError("choose a file first");
      return;
    }
    setError("");
    start(async () => {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("title", title.trim());
      fd.set("summary", summary.trim());
      for (const id of agents) fd.append("agents", id);
      const res = await uploadKnowledgeFile(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setFileName("");
      setTitle("");
      setSummary("");
      setAgents(new Set(["scribe"]));
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="wf-hn-panel wf-kb-uploader">
      <div className="wf-hn-panel-title">add a file</div>
      <div className="wf-kb-uprow">
        <button
          type="button"
          className="wf-hn-btn ghost"
          onClick={() => fileRef.current?.click()}
        >
          {fileName || "choose a file"}
        </button>
        <span className="wf-hn-note">pdf, docx, md, txt, csv · max 15mb</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.md,.markdown,.txt,.csv"
          hidden
          onChange={onFile}
        />
      </div>

      <label className="wf-hn-field">
        title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="defaults to the file name"
        />
      </label>
      <label className="wf-hn-field">
        summary — optional
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="one line on what this is"
        />
      </label>

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
          {pending ? "uploading…" : "upload"}
        </button>
        {error && <span className="wf-kb-err">{error}</span>}
      </div>
    </div>
  );
}
