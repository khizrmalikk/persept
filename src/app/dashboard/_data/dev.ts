import { supabaseAdmin } from "@/lib/supabase/server";
import { getProjects } from "@/lib/workforce/projects";
import { ago } from "@/lib/workforce/types";
import {
  fixPill,
  type OSDeploy,
  type OSDev,
  type OSError,
  type OSErrorState,
  type OSFix,
  type OSKnowledgeFile,
  type OSPr,
  type OSPrCheck,
  type OSProject,
  type OSRepo,
} from "./dev-types";

// Dev = Fixer's workspace: repos, fixes (with the day-31 pr_* + log_tail columns),
// deploys, the rolled-up errors view, and knowledge attached per project. Reads
// are DEFENSIVE — any missing table/column just yields an empty section. Shared
// types/consts live in ./dev-types (client-safe); this file is server-only.
export type { OSDev } from "./dev-types";

type Row = Record<string, unknown>;

const S = (v: unknown) => String(v ?? "");
const N = (v: unknown) => (v == null ? 0 : Number(v) || 0);

function prChecks(v: unknown): OSPrCheck[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Row;
    return { name: S(o.name), status: S(o.status) };
  });
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const isToday = (iso: unknown): boolean => {
  if (!iso) return false;
  const d = new Date(String(iso));
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const ERR_LABEL: Record<OSErrorState, string> = {
  new: "new",
  queued: "Fixer is on it",
  fixed: "fixed",
  ignored: "ignored",
};

export async function loadDev(): Promise<OSDev> {
  const db = supabaseAdmin();

  const [projects, fixRows, deployRows, errorRows, knowRows] =
    await Promise.all([
      getProjects().catch(() => []),
      // select * so a missing day-31 column never throws
      safe(
        async () =>
          ((
            await db
              .from("fixes")
              .select("*")
              .order("ts", { ascending: false })
              .limit(200)
          ).data as Row[] | null) ?? [],
        [] as Row[],
      ),
      safe(
        async () =>
          ((
            await db
              .from("deploys")
              .select("*")
              .order("ts", { ascending: false })
              .limit(60)
          ).data as Row[] | null) ?? [],
        [] as Row[],
      ),
      safe(
        async () =>
          ((
            await db
              .from("errors")
              .select("*")
              .order("last_seen", { ascending: false })
              .limit(80)
          ).data as Row[] | null) ?? [],
        [] as Row[],
      ),
      safe(
        async () =>
          ((
            await db
              .from("knowledge_files")
              .select("id, title, mime, text, summary, agent_ids, project")
              .is("deleted_at", null)
              .limit(200)
          ).data as Row[] | null) ?? [],
        [] as Row[],
      ),
    ]);

  // latest deploy per project id (for the repo list's status + "deployed <when>")
  const latestDeploy = new Map<string, Row>();
  for (const d of deployRows) {
    const p = S(d.project);
    if (!latestDeploy.has(p)) latestDeploy.set(p, d);
  }

  const repos: OSRepo[] = projects.map((p) => {
    const dep = latestDeploy.get(p.id);
    const depStatus = S(dep?.status);
    return {
      id: p.id,
      name: p.name || p.id,
      repo: p.repo,
      hasRepo: !!p.repo,
      enabled: p.enabled,
      branch: p.default_branch || "main",
      lastDeploy: dep?.ts ? ago(S(dep.ts)) : "—",
      status:
        depStatus === "building" || depStatus === "queued" ? "deploying" : "ok",
    };
  });

  // full editable rows for the ProjectEditor panel (the client can't read the DB)
  const osProjects: OSProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    repo: p.repo,
    default_branch: p.default_branch,
    description: p.description,
    notes: p.notes,
    checks: p.checks,
    allowed_tools: p.allowed_tools,
    dev: p.dev,
    url: p.url,
    login: p.login,
    deploy: p.deploy,
    vercel_project_id: p.vercel_project_id,
    research_cadence: p.research_cadence,
    enabled: p.enabled,
  }));

  // fixes keyed by project id
  const fixesByProject: Record<string, OSFix[]> = {};
  for (const r of fixRows) {
    const status = S(r.status);
    const prState = (["open", "merged", "closed"] as const).includes(
      S(r.pr_state) as "open",
    )
      ? (S(r.pr_state) as "open" | "merged" | "closed")
      : null;
    const running = status === "running";
    const failed = status === "failed";
    const note =
      failed && S(r.error)
        ? S(r.error)
        : running
          ? "Fixer is writing this now"
          : status === "merged"
            ? "merged"
            : status === "pr_open"
              ? "waiting for your merge"
              : S(r.summary) || S(r.spec).slice(0, 80) || "queued";
    const message =
      S(r.summary) ||
      (failed ? S(r.error) : "") ||
      S(r.spec) ||
      "Fixer is writing this change now. the diff shows up here as soon as tests run.";
    const fix: OSFix = {
      id: S(r.short_id) || S(r.id),
      project: S(r.project),
      title: S(r.title),
      note,
      message,
      pill: fixPill(status),
      failed,
      running,
      prNumber: r.pr_number == null ? null : N(r.pr_number) || null,
      prUrl: S(r.pr_url),
      prState,
      additions: N(r.pr_additions),
      deletions: N(r.pr_deletions),
      changedFiles: N(r.pr_changed_files),
      checks: prChecks(r.pr_checks),
      logTail: S(r.log_tail),
    };
    if (!fixesByProject[fix.project]) fixesByProject[fix.project] = [];
    fixesByProject[fix.project].push(fix);
  }

  // PRs: every fix that has an open/known PR
  const prs: OSPr[] = fixRows
    .filter((r) => r.pr_number != null)
    .map((r) => {
      const waiting = S(r.pr_state) === "open";
      return {
        number: N(r.pr_number),
        title: S(r.title),
        branch: S(r.branch),
        diffstat: `+${N(r.pr_additions)} −${N(r.pr_deletions)} · ${N(r.pr_changed_files)} files`,
        status: waiting
          ? "waiting for your merge"
          : S(r.pr_state) === "merged"
            ? "merged"
            : "Fixer is testing",
        waiting,
        project: S(r.project),
      };
    });

  const deploys: OSDeploy[] = deployRows.map((d) => ({
    id: S(d.id),
    project: S(d.project),
    change: S(d.change),
    status: S(d.status),
    env: S(d.env),
    url: S(d.url),
    when: d.ts ? ago(S(d.ts)) : "",
  }));

  const errors: OSError[] = errorRows.map((e) => {
    const state = (["new", "queued", "fixed", "ignored"] as const).includes(
      S(e.state) as OSErrorState,
    )
      ? (S(e.state) as OSErrorState)
      : "new";
    return {
      id: S(e.id),
      project: S(e.project),
      signature: S(e.signature) || S(e.message),
      severity: S(e.severity),
      countToday: isToday(e.count_day) ? N(e.count_today) : 0,
      state,
      stateLabel: ERR_LABEL[state],
      fixer: state === "queued",
      fixId: e.fix_id ? S(e.fix_id) : null,
    };
  });

  // knowledge keyed by repo id: files tagged to this project, else any Fixer file
  const knowledgeByProject: Record<string, OSKnowledgeFile[]> = {};
  const toKFile = (k: Row): OSKnowledgeFile => ({
    id: S(k.id),
    title: S(k.title),
    type: (S(k.mime).split("/").pop() || "file").slice(0, 8),
    text: S(k.summary) || S(k.text).slice(0, 120),
  });
  for (const repo of repos) {
    const files = knowRows.filter((k) => {
      const agents = Array.isArray(k.agent_ids)
        ? (k.agent_ids as unknown[]).map(String)
        : [];
      return (
        S(k.project) === repo.id ||
        S(k.project) === repo.name ||
        (!S(k.project) && agents.includes("fixer"))
      );
    });
    knowledgeByProject[repo.id] = files.map(toKFile);
  }

  return {
    repos,
    projects: osProjects,
    fixesByProject,
    knowledgeByProject,
    prs,
    deploys,
    errors,
  };
}
