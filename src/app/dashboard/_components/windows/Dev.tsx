"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ignoreError,
  retryFix,
  sendAgentCommand,
} from "@/lib/workforce/actions";
import {
  DEV_TABS,
  deployDot,
  FIX_PILL,
  type OSDev,
  type OSFix,
  type OSProject,
  type OSRepo,
  severityColor,
} from "../../_data/dev-types";
import { useOS } from "../os-store";
import { Persona } from "../Persona";
import { ProjectEditor } from "./ProjectEditor";

// Dev — Fixer's workspace. Left: repos Fixer can access. Right: project header +
// tabs (changes / pull requests / deploys / errors / terminal / knowledge).
// Mutations go through the real actions (retryFix, sendAgentCommand) +
// router.refresh(); the terminal "polls" by refreshing the server loader while a
// fix is running. Merging happens in Approvals (we deep-link there).

export function Dev({ data }: { data: OSDev }) {
  const os = useOS();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>(
    os.sub.p ?? data.repos[0]?.id ?? "",
  );
  const [tab, setTab] = useState(os.sub.tab ?? "changes");
  const [fixId, setFixId] = useState<string | null>(null);
  // the project editor: an OSProject to edit, "new" to create, or null (closed)
  const [editing, setEditing] = useState<OSProject | "new" | null>(null);

  useEffect(() => {
    if (os.sub.p) setProjectId(os.sub.p);
    if (os.sub.tab) setTab(os.sub.tab);
  }, [os.sub.p, os.sub.tab]);

  const repo =
    data.repos.find((r) => r.id === projectId) ?? data.repos[0] ?? null;
  const fixes = repo ? (data.fixesByProject[repo.id] ?? []) : [];
  // live updates come from the shell's tick poller; the terminal tails the log
  // route itself (see Terminal), so no blanket refresh timer here.

  const editorEl =
    editing != null ? (
      <ProjectEditor
        project={editing === "new" ? undefined : editing}
        onClose={() => setEditing(null)}
      />
    ) : null;

  if (!repo)
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "var(--mute)",
            fontSize: 13.5,
            textAlign: "center",
            padding: 24,
          }}
        >
          <span style={{ maxWidth: 340, lineHeight: 1.5 }}>
            no projects yet. add a repo for Fixer to work on, and its fixes and
            deploys show up here.
          </span>
          <button
            type="button"
            onClick={() => setEditing("new")}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
            }}
          >
            new project
          </button>
        </div>
        {editorEl}
      </div>
    );

  const curProject = data.projects.find((p) => p.id === repo.id) ?? null;

  const prs = data.prs.filter((p) => p.project === repo.id);
  const deploys = data.deploys.filter((d) => d.project === repo.id);
  const errors = data.errors.filter(
    (e) => e.project === repo.id || e.project === repo.name,
  );
  const kfiles = data.knowledgeByProject[repo.id] ?? [];
  const openErrCount = errors.filter(
    (e) => e.state !== "fixed" && e.state !== "ignored",
  ).length;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "270px minmax(0,1fr)",
      }}
    >
      {/* repos */}
      <div
        style={{
          borderRight: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          padding: "14px 10px",
          gap: 4,
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 6px 8px 8px",
          }}
        >
          <span
            className="os-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mute)",
            }}
          >
            projects
          </span>
          <button
            type="button"
            onClick={() => setEditing("new")}
            title="new project"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 9px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--ink)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            new
          </button>
        </div>
        {data.repos.map((r) => (
          <RepoRow
            key={r.id}
            repo={r}
            active={r.id === repo.id}
            onPick={() => {
              setProjectId(r.id);
              setFixId(null);
            }}
          />
        ))}
        <div
          style={{
            marginTop: "auto",
            padding: 12,
            borderRadius: 12,
            border: "1px dashed var(--line)",
            fontSize: 12,
            color: "var(--soft)",
            lineHeight: 1.45,
          }}
        >
          projects are yours to add. Fixer only touches what&apos;s listed here.
        </div>
      </div>

      {/* project */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 20px 0",
          }}
        >
          <span
            className="os-display"
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {repo.name}
          </span>
          {repo.hasRepo ? (
            <span
              className="os-mono"
              style={{
                fontSize: 12,
                padding: "3px 9px",
                borderRadius: 999,
                background: "var(--surf2)",
                color: "var(--soft)",
                whiteSpace: "nowrap",
              }}
            >
              {repo.repo}
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                padding: "3px 9px",
                borderRadius: 999,
                background: "oklch(0.8 0.14 70 / 0.14)",
                color: "var(--ambink)",
                whiteSpace: "nowrap",
              }}
            >
              no repo — open to set
            </span>
          )}
          <span
            style={{ fontSize: 12, color: "var(--soft)", whiteSpace: "nowrap" }}
          >
            branch{" "}
            <b className="os-mono" style={{ color: "var(--ink)" }}>
              {repo.branch}
            </b>
          </span>
          {repo.status === "deploying" && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--ambink)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "oklch(0.8 0.14 70)",
                }}
              />
              deploying
            </span>
          )}
          <button
            type="button"
            onClick={() => curProject && setEditing(curProject)}
            disabled={!curProject}
            style={{
              marginLeft: "auto",
              padding: "6px 13px",
              borderRadius: 9,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--ink)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: curProject ? "pointer" : "default",
              whiteSpace: "nowrap",
            }}
          >
            edit project
          </button>
        </div>

        {/* tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "10px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {DEV_TABS.map(([k, n]) => {
            const on = tab === k;
            const badge =
              k === "errors" && openErrCount > 0
                ? openErrCount
                : k === "prs" && prs.some((p) => p.waiting)
                  ? prs.filter((p) => p.waiting).length
                  : 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  whiteSpace: "nowrap",
                  background: on ? "var(--surf2)" : "transparent",
                  color: on ? "var(--ink)" : "var(--soft)",
                }}
              >
                {n}
                {badge > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 999,
                      background:
                        k === "prs" ? "oklch(0.8 0.14 70)" : "var(--surf2)",
                      color: k === "prs" ? "#0e0d0c" : "var(--soft)",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: "16px 20px",
          }}
        >
          {tab === "changes" && (
            <Changes
              fixes={fixes}
              fixId={fixId}
              setFixId={setFixId}
              onRetry={(id) => retryFix(id).then(() => router.refresh())}
              onOpenApprovals={() => os.open("approvals")}
            />
          )}
          {tab === "prs" && (
            <Prs prs={prs} onMerge={() => os.open("approvals")} />
          )}
          {tab === "deploys" && <Deploys deploys={deploys} />}
          {tab === "errors" && (
            <Errors
              errors={errors}
              onAskFixer={(id) => {
                sendAgentCommand("fixer", `fix error ${id}`).then(() =>
                  router.refresh(),
                );
                os.showToast("asked Fixer to fix it");
              }}
              onIgnore={(id) => {
                void ignoreError(id).then(() => router.refresh());
                os.showToast("ignored");
              }}
            />
          )}
          {tab === "terminal" && <Terminal fixes={fixes} />}
          {tab === "knowledge" && (
            <Knowledge
              repoName={repo.name}
              files={kfiles}
              onOpen={() => os.open("knowledge")}
            />
          )}
        </div>
      </div>
      {editorEl}
    </div>
  );
}

function RepoRow({
  repo,
  active,
  onPick,
}: {
  repo: OSRepo;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "11px 12px",
        borderRadius: 12,
        cursor: "pointer",
        border: "none",
        textAlign: "left",
        background: active ? "var(--surf2)" : "transparent",
        color: "var(--ink)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          title={
            repo.enabled && repo.hasRepo
              ? "enabled, repo set"
              : "no repo or disabled"
          }
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background:
              repo.enabled && repo.hasRepo
                ? "oklch(0.72 0.17 150)"
                : "var(--dot-idle)",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{repo.name}</span>
      </span>
      <span
        className="os-mono"
        style={{
          fontSize: 11.5,
          color: "var(--mute)",
          paddingLeft: 16,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {repo.hasRepo ? repo.repo : "no repo yet · open to set"}
        {repo.lastDeploy !== "—" ? ` · ${repo.lastDeploy}` : ""}
      </span>
    </button>
  );
}

function Changes({
  fixes,
  fixId,
  setFixId,
  onRetry,
  onOpenApprovals,
}: {
  fixes: OSFix[];
  fixId: string | null;
  setFixId: (id: string) => void;
  onRetry: (id: string) => void;
  onOpenApprovals: () => void;
}) {
  const cur = fixes.find((f) => f.id === fixId) ?? fixes[0] ?? null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.4fr)",
        gap: 16,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fixes.length === 0 ? (
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              border: "1px dashed var(--line)",
              fontSize: 13,
              color: "var(--soft)",
            }}
          >
            no fixes on this project yet. ask Fixer, or Chief will add one when
            something breaks.
          </div>
        ) : (
          fixes.map((f) => {
            const on = cur?.id === f.id;
            const pill = FIX_PILL[f.pill];
            return (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  gap: 11,
                  alignItems: "center",
                  padding: "12px 13px",
                  borderRadius: 13,
                  border: `1px solid ${on ? "var(--c-fixer)" : "var(--line)"}`,
                  background: on ? "var(--t-fixer)" : "transparent",
                }}
              >
                <button
                  type="button"
                  onClick={() => setFixId(f.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    flex: 1,
                    minWidth: 0,
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    color: "var(--ink)",
                  }}
                >
                  <span
                    style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}
                  >
                    {f.title}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                    {f.note}
                  </span>
                </button>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: pill.bg,
                    color: pill.fg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.pill}
                </span>
                {f.failed && (
                  <button
                    type="button"
                    onClick={() => onRetry(f.id)}
                    style={{
                      padding: "6px 11px",
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: "transparent",
                      color: "var(--ink)",
                    }}
                  >
                    retry
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Persona agent="fixer" size={24} />
          <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>
            {cur?.title ?? "no fix selected"}
          </span>
          {cur && (cur.additions > 0 || cur.deletions > 0) && (
            <span className="os-mono" style={{ fontSize: 12 }}>
              <span style={{ color: "var(--ok)" }}>+{cur.additions}</span>{" "}
              <span style={{ color: "var(--bad)" }}>−{cur.deletions}</span>
            </span>
          )}
        </div>
        {cur ? (
          <>
            <div
              style={{
                padding: 20,
                fontSize: 13,
                color: "var(--soft)",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {cur.message}
            </div>
            {cur.checks.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "0 20px 14px",
                  flexWrap: "wrap",
                }}
              >
                {cur.checks.map((c) => (
                  <span
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <span
                      style={{
                        color:
                          c.status === "success" || c.status === "passed"
                            ? "var(--ok)"
                            : c.status === "failure"
                              ? "var(--bad)"
                              : "var(--mute)",
                      }}
                    >
                      {c.status === "success" || c.status === "passed"
                        ? "✓"
                        : c.status === "failure"
                          ? "✗"
                          : "•"}
                    </span>
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {cur.prUrl && (
              <div style={{ padding: "0 20px 14px" }}>
                <a
                  href={cur.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12.5, color: "var(--ambink)" }}
                >
                  view the diff on github →{" "}
                  {cur.changedFiles > 0 ? `${cur.changedFiles} files` : ""}
                </a>
              </div>
            )}
            {cur.prState === "open" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid var(--line)",
                  background: "oklch(0.8 0.14 70 / 0.08)",
                }}
              >
                <span style={{ fontSize: 13, flex: 1 }}>
                  pr #{cur.prNumber} is waiting for your merge.
                </span>
                <button
                  type="button"
                  onClick={onOpenApprovals}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 9,
                    background: "var(--accent)",
                    color: "var(--accent-ink)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  review &amp; merge
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 24, fontSize: 13, color: "var(--soft)" }}>
            pick a fix to see its detail.
          </div>
        )}
      </div>
    </div>
  );
}

function Prs({ prs, onMerge }: { prs: OSDev["prs"]; onMerge: () => void }) {
  if (prs.length === 0)
    return (
      <Empty>
        no open pull requests. Fixer opens one when a change is ready for your
        merge.
      </Empty>
    );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 900,
      }}
    >
      {prs.map((p) => (
        <div
          key={p.number}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: 14,
            border: `1px solid ${p.waiting ? "oklch(0.8 0.14 70 / 0.5)" : "var(--line)"}`,
          }}
        >
          <span
            className="os-mono"
            style={{ fontSize: 13, color: "var(--mute)", width: 44 }}
          >
            #{p.number}
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
            <span
              className="os-mono"
              style={{ fontSize: 11.5, color: "var(--mute)" }}
            >
              {p.branch} · {p.diffstat}
            </span>
          </div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: p.waiting
                ? "oklch(0.8 0.14 70 / 0.2)"
                : "var(--surf2)",
              color: p.waiting ? "var(--ambink)" : "var(--soft)",
              whiteSpace: "nowrap",
            }}
          >
            {p.status}
          </span>
          {p.waiting && (
            <button
              type="button"
              onClick={onMerge}
              style={{
                padding: "8px 14px",
                borderRadius: 9,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
              }}
            >
              merge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Deploys({ deploys }: { deploys: OSDev["deploys"] }) {
  if (deploys.length === 0)
    return <Empty>no deploys yet. they appear when a merge ships.</Empty>;
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        overflow: "hidden",
        maxWidth: 980,
      }}
    >
      {deploys.map((d) => {
        const dd = deployDot(d.status);
        return (
          <div
            key={d.id}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 170px minmax(0,1fr) 120px 120px",
              gap: 12,
              alignItems: "center",
              padding: "13px 16px",
              borderBottom: "1px solid var(--line)",
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: dd.dot,
                boxShadow: dd.glow,
              }}
            />
            <span className="os-mono" style={{ fontSize: 12.5 }}>
              {d.project}
              {d.env ? ` · ${d.env}` : ""}
            </span>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {d.change}
            </span>
            <span style={{ fontWeight: 600, color: dd.color }}>{d.status}</span>
            <span style={{ color: "var(--mute)", fontSize: 12.5 }}>
              {d.when}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Errors({
  errors,
  onAskFixer,
  onIgnore,
}: {
  errors: OSDev["errors"];
  onAskFixer: (id: string) => void;
  onIgnore: (id: string) => void;
}) {
  if (errors.length === 0)
    return (
      <Empty>no errors on this project. apps post here as they happen.</Empty>
    );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 980,
      }}
    >
      {errors.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: "13px 16px",
            borderRadius: 14,
            border: "1px solid var(--line)",
            opacity: e.state === "ignored" ? 0.55 : 1,
          }}
        >
          <span
            style={{
              width: 8,
              height: 30,
              borderRadius: 4,
              background: severityColor(e.severity),
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              flex: 1,
              minWidth: 0,
            }}
          >
            <span
              className="os-mono"
              style={{
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {e.signature}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
              {e.project} · {e.countToday} times today
            </span>
          </div>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12.5,
              fontWeight: 600,
              color:
                e.state === "fixed"
                  ? "var(--ok)"
                  : e.fixer
                    ? "var(--c-fixer)"
                    : "var(--soft)",
              whiteSpace: "nowrap",
            }}
          >
            {e.fixer && <Persona agent="fixer" size={20} />}
            {e.stateLabel}
          </span>
          {e.state === "new" && (
            <span style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => onAskFixer(e.id)}
                style={{
                  padding: "6px 11px",
                  borderRadius: 8,
                  background: "var(--t-fixer)",
                  color: "var(--c-fixer)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                ask Fixer to fix
              </button>
              <button
                type="button"
                onClick={() => onIgnore(e.id)}
                style={{
                  padding: "6px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontSize: 12,
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--soft)",
                }}
              >
                ignore
              </button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Terminal({ fixes }: { fixes: OSFix[] }) {
  // the running fix's log tail (Claude Code's real output), else the newest with a tail
  const running = fixes.find((f) => f.running);
  const src = running ?? fixes.find((f) => f.logTail);
  const [log, setLog] = useState(src?.logTail ?? "");

  // reseed when the server loader hands a different source / tail
  const srcTail = src?.logTail ?? "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: reseed on source change
  useEffect(() => {
    setLog(srcTail);
  }, [src?.id]);

  // tail the running fix's log every 3s (GET /api/fixes/[id]/log). start/stop is
  // driven by server data: when the fix stops running the tick refreshes this
  // component, `running` goes undefined, and the interval is cleared.
  useEffect(() => {
    const id = running?.id;
    if (!id) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/fixes/${id}/log`, { cache: "no-store" });
        if (r.ok) {
          const d = (await r.json()) as { log_tail?: string };
          if (!stop) setLog(d.log_tail ?? "");
        }
      } catch {
        // transient — retry next tick
      }
    };
    const t = setInterval(tick, 3000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [running?.id]);

  const lines = log.split("\n");
  const color = (t: string) =>
    t.startsWith("$")
      ? "#e8e4dc"
      : t.includes("✓")
        ? "oklch(0.78 0.15 150)"
        : t.includes("✗")
          ? "oklch(0.72 0.17 28)"
          : "#b9b3aa";
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--line)",
        maxWidth: 980,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "#1a1816",
          color: "#b9b3aa",
          fontSize: 12,
        }}
      >
        <span style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#5f5a53",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#5f5a53",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#5f5a53",
            }}
          />
        </span>
        <span className="os-mono">fixer@vps-dxb-01 · Claude Code</span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: src?.running ? "oklch(0.72 0.17 150)" : "#5f5a53",
            }}
          />
          {src?.running ? "running · read only for you" : "idle"}
        </span>
      </div>
      <div
        className="os-mono"
        style={{
          background: "#0e0d0c",
          color: "#e8e4dc",
          fontSize: 13,
          lineHeight: 1.8,
          padding: "16px 18px",
          minHeight: 380,
        }}
      >
        {src ? (
          lines.map((t, i) => (
            <div
              key={`${i}-${t.slice(0, 12)}`}
              style={{ color: color(t), whiteSpace: "pre-wrap" }}
            >
              {t}
            </div>
          ))
        ) : (
          <div style={{ color: "#8a847b" }}>
            no live output. when Fixer runs a job its Claude Code output streams
            here.
          </div>
        )}
      </div>
    </div>
  );
}

function Knowledge({
  repoName,
  files,
  onOpen,
}: {
  repoName: string;
  files: OSDev["knowledgeByProject"][string];
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 760,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--soft)", marginBottom: 4 }}>
        knowledge files attached to {repoName}. Fixer reads these before every
        change.
      </span>
      {files.length === 0 ? (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            border: "1px dashed var(--line)",
            fontSize: 13,
            color: "var(--soft)",
          }}
        >
          nothing attached. add a file in knowledge and assign it to Fixer.
        </div>
      ) : (
        files.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "13px 16px",
              borderRadius: 13,
              border: "1px solid var(--line)",
            }}
          >
            <span
              className="os-mono"
              style={{
                fontSize: 11,
                padding: "4px 7px",
                borderRadius: 6,
                background: "var(--surf2)",
                color: "var(--soft)",
              }}
            >
              {f.type}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.title}</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--soft)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {f.text}
              </span>
            </div>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={onOpen}
        style={{
          alignSelf: "flex-start",
          padding: "8px 13px",
          borderRadius: 9,
          border: "1px solid var(--line)",
          fontSize: 12.5,
          cursor: "pointer",
          background: "transparent",
          color: "var(--ink)",
        }}
      >
        open knowledge →
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 14,
        border: "1px dashed var(--line)",
        fontSize: 13.5,
        color: "var(--soft)",
        maxWidth: 600,
      }}
    >
      {children}
    </div>
  );
}
