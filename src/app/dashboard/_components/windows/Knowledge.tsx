"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  updateKnowledgeFile,
  uploadKnowledgeFile,
} from "@/lib/workforce/actions";
import {
  KNOWLEDGE_AGENTS,
  type OSKnowledge,
  type OSKnowledgeFile,
} from "../../_data/knowledge-types";
import { useOS } from "../os-store";
import { type AgentKey, Persona } from "../Persona";
import { GraphView } from "./GraphView";

// Knowledge — the shared files window. list | preview (380px). Files are
// dashboard-owned (`knowledge_files`); the bridge mirrors each into every reader
// agent's workspace. Search + a "read by" agent filter narrow the list; the six
// avatars on each row toggle read access (updateKnowledgeFile → router.refresh).

const GRID = "60px minmax(0,1.6fr) 80px 80px minmax(0,1.4fr)";
const NAMES: Record<string, string> = {
  percy: "Percy",
  scout: "Scout",
  hunter: "Hunter",
  scribe: "Scribe",
  muse: "Muse",
  fixer: "Fixer",
};

export function Knowledge({ data }: { data: OSKnowledge }) {
  const os = useOS();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [af, setAf] = useState<AgentKey | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState<"files" | "graph">(
    os.sub.tab === "graph" ? "graph" : "files",
  );

  const query = q.trim().toLowerCase();
  const files = data.files.filter(
    (f) =>
      (!query || f.name.toLowerCase().includes(query)) &&
      (!af || f.agents.includes(af)),
  );
  const sel = files.find((f) => f.id === selId) ?? files[0] ?? null;

  const toggleReader = (f: OSKnowledgeFile, k: AgentKey) => {
    const next = f.agents.includes(k)
      ? f.agents.filter((a) => a !== k)
      : [...f.agents, k];
    const fd = new FormData();
    fd.append("id", f.id);
    fd.append("title", f.title || f.name);
    fd.append("summary", f.summary);
    for (const a of next) fd.append("agents", a);
    updateKnowledgeFile(fd).then(() => router.refresh());
  };

  const onUpload = (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    uploadKnowledgeFile(fd).then((res) => {
      if ("error" in res) os.showToast(res.error);
      else {
        os.showToast("uploaded. pick who can read it");
        router.refresh();
      }
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* files · graph tabs (day-38) */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "8px 16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {(["files", "graph"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "6px 13px",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: tab === t ? "var(--surf2)" : "transparent",
              color: tab === t ? "var(--ink)" : "var(--soft)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {tab === "graph" && <GraphView />}
        {tab === "files" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 380px",
            }}
          >
            {/* ── list ──────────────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                borderRight: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    maxWidth: 340,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--surf2)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    style={{ stroke: "var(--mute)" }}
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="search files"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--ink)",
                      fontFamily: "var(--font-ui)",
                      fontSize: 13.5,
                      minWidth: 0,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "var(--mute)" }}>
                  read by
                </span>
                {KNOWLEDGE_AGENTS.map((k) => {
                  const on = !af || af === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setAf(af === k ? null : k)}
                      title={NAMES[k]}
                      style={{
                        borderRadius: "50%",
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        opacity: on ? 1 : 0.35,
                        boxShadow:
                          af === k ? `0 0 0 2px var(--c-${k})` : "none",
                      }}
                    >
                      <Persona agent={k} size={24} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    os.showToast(
                      "the vault refreshes itself every 10 min on the vps, and re-compiles every 10 min by cron",
                    )
                  }
                  title="the dashboard can't run the compile; the vps does it on a schedule"
                  style={{
                    marginLeft: "auto",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "var(--soft)",
                    fontSize: 12.5,
                    cursor: "pointer",
                    border: "1px solid var(--line)",
                    whiteSpace: "nowrap",
                  }}
                >
                  refresh vault
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
                  </svg>
                  upload
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.docx,.md,.markdown,.txt,.csv"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div style={{ flex: 1, overflow: "auto" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    gap: 12,
                    padding: "10px 18px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--mute)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span>type</span>
                  <span>file</span>
                  <span>size</span>
                  <span>updated</span>
                  <span>agents who read it</span>
                </div>

                {files.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 18px",
                      fontSize: 13,
                      color: "var(--soft)",
                    }}
                  >
                    no files match. upload one and pick who can read it.
                  </div>
                ) : (
                  files.map((f) => {
                    const on = sel?.id === f.id;
                    return (
                      <div
                        key={f.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: GRID,
                          gap: 12,
                          alignItems: "center",
                          padding: "12px 18px",
                          borderBottom: "1px solid var(--line)",
                          background: on ? "var(--surf2)" : "transparent",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            padding: "4px 7px",
                            borderRadius: 6,
                            background: "var(--surf2)",
                            color: "var(--soft)",
                            justifySelf: "start",
                          }}
                        >
                          {f.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelId(f.id)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            minWidth: 0,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "var(--ink)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {f.name}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            {f.project && (
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: "var(--c-fixer)",
                                }}
                              >
                                attached to {f.project}
                              </span>
                            )}
                            {f.inVault && (
                              <span
                                className="os-mono"
                                style={{
                                  fontSize: 9,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  color: "var(--ok)",
                                  border: "1px solid var(--ok)",
                                  borderRadius: 999,
                                  padding: "1px 6px",
                                }}
                              >
                                in the vault
                              </span>
                            )}
                          </span>
                        </button>
                        <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                          {f.size}
                        </span>
                        <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                          {f.updated}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {KNOWLEDGE_AGENTS.map((k) => {
                            const reads = f.agents.includes(k);
                            return (
                              <button
                                key={k}
                                type="button"
                                onClick={() => toggleReader(f, k)}
                                title={`${NAMES[k]} ${reads ? "can" : "can’t"} read this`}
                                style={{
                                  borderRadius: "50%",
                                  cursor: "pointer",
                                  border: "none",
                                  background: "transparent",
                                  padding: 0,
                                  opacity: reads ? 1 : 0.25,
                                  filter: reads ? "none" : "grayscale(1)",
                                }}
                              >
                                <Persona agent={k} size={24} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── preview ───────────────────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "auto",
                padding: 20,
                gap: 16,
              }}
            >
              {sel ? (
                <>
                  <div
                    style={{
                      aspectRatio: "4/3",
                      borderRadius: 14,
                      background: "var(--surf2)",
                      border: "1px solid var(--line)",
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--mute)",
                      }}
                    >
                      {sel.name}
                    </span>
                    <span style={{ fontSize: 15, lineHeight: 1.55 }}>
                      {sel.excerpt ||
                        "no preview text extracted for this file."}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 22,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {sel.name}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--soft)" }}>
                      {sel.size} · updated {sel.updated}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}
                    >
                      who can read this
                    </span>
                    {KNOWLEDGE_AGENTS.map((k) => {
                      const reads = sel.agents.includes(k);
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleReader(sel, k)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 0",
                            borderTop: "1px solid var(--line)",
                            cursor: "pointer",
                            background: "transparent",
                            border: "none",
                            borderTopColor: "var(--line)",
                            borderTopStyle: "solid",
                            borderTopWidth: 1,
                            width: "100%",
                            textAlign: "left",
                            color: "var(--ink)",
                          }}
                        >
                          <Persona agent={k} size={26} />
                          <span style={{ fontSize: 13.5, flex: 1 }}>
                            {NAMES[k]}
                          </span>
                          <span
                            style={{
                              width: 36,
                              height: 21,
                              borderRadius: 11,
                              background: reads
                                ? `var(--c-${k})`
                                : "var(--track)",
                              position: "relative",
                              transition: "background 0.15s",
                              flex: "none",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: 2.5,
                                left: reads ? 17 : 3,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#fff",
                                transition: "left 0.15s",
                              }}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--mute)",
                      lineHeight: 1.45,
                    }}
                  >
                    files are mirrored into each reader&apos;s workspace on the
                    vps. removing a reader deletes their copy.
                  </span>
                </>
              ) : (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--mute)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    maxWidth: 260,
                  }}
                >
                  no file selected. upload one and pick who can read it.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
