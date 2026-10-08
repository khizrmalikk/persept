// Server-only reads for Fixer's projects. `projects` is DASHBOARD-owned: the
// dashboard creates/edits rows here and the bridge watches `updated_at`, rewriting
// the runner's config and Fixer's PROJECTS.md within two minutes — so every write
// must bump updated_at (see actions.ts). Reads are DEFENSIVE: a missing table
// returns empty rather than throwing.

import { supabaseAdmin } from "@/lib/supabase/server";

export type ProjectDeploy = "vercel" | "flag" | null;
export type ResearchCadence = "none" | "weekly";

export type ProjectLogin = {
  path: string;
  email_selector: string;
  password_selector: string;
  submit_selector: string;
  env: string;
};

export type Project = {
  id: string;
  name: string;
  repo: string;
  default_branch: string;
  description: string;
  notes: string;
  checks: string[];
  allowed_tools: string[];
  dev: string;
  url: string;
  login: ProjectLogin;
  deploy: ProjectDeploy;
  research_cadence: ResearchCadence;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export const EMPTY_LOGIN: ProjectLogin = {
  path: "",
  email_selector: "",
  password_selector: "",
  submit_selector: "",
  env: "",
};

function strList(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map(String).filter(Boolean) : [];
}

function normLogin(v: unknown): ProjectLogin {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    path: String(o.path ?? ""),
    email_selector: String(o.email_selector ?? ""),
    password_selector: String(o.password_selector ?? ""),
    submit_selector: String(o.submit_selector ?? ""),
    env: String(o.env ?? ""),
  };
}

function norm(row: Record<string, unknown>): Project {
  const deployRaw = String(row.deploy ?? "");
  const deploy: ProjectDeploy =
    deployRaw === "vercel" ? "vercel" : deployRaw === "flag" ? "flag" : null;
  const cadence: ResearchCadence =
    String(row.research_cadence ?? "none") === "weekly" ? "weekly" : "none";
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    repo: String(row.repo ?? ""),
    default_branch: String(row.default_branch ?? ""),
    description: String(row.description ?? ""),
    notes: String(row.notes ?? ""),
    checks: strList(row.checks),
    allowed_tools: strList(row.allowed_tools),
    dev: String(row.dev ?? ""),
    url: String(row.url ?? ""),
    login: normLogin(row.login),
    deploy,
    research_cadence: cadence,
    enabled: row.enabled !== false,
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
  } catch {
    return [];
  }
}
