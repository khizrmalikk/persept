import { supabaseAdmin } from "@/lib/supabase/server";
import { parseHealth } from "@/lib/workforce/backlog";
import { getAgentFile, listAgentFiles } from "@/lib/workforce/files";
import { getActiveIdeas } from "@/lib/workforce/ideas";
import type { AgentKey } from "../_components/Persona";
import { loadAgents } from "./agents";
import {
  type OSBacklogCard,
  type OSColumn,
  type OSCommand,
  type OSHealth,
  type OSIdeaCard,
  type OSRun,
  type OSStateTile,
  type OSTeamMember,
  ROSTER_IDS,
} from "./command-types";
import { loadHealthFlags, staleNoticeText } from "./health";

export type { OSCommand } from "./command-types";

const ROSTER = new Set<AgentKey>(ROSTER_IDS);
const asAgent = (v: string | null | undefined): AgentKey => {
  const s = (v ?? "").toLowerCase();
  if (s === "owner" || s === "you") return "you";
  return ROSTER.has(s as AgentKey) ? (s as AgentKey) : "you";
};

// health line → a deep-link target, matching the known phrases in the brief.
function healthTarget(line: string): Pick<OSHealth, "win" | "tab" | "cta"> {
  const t = line.toLowerCase();
  if (/approval/.test(t)) return { win: "approvals", cta: "open approvals" };
  if (/\breplies?\b|no response|awaiting/.test(t))
    return {
      win: "frontdesk",
      tab: "conversations",
      cta: "open conversations",
    };
  if (/proposal/.test(t))
    return { win: "frontdesk", tab: "proposals", cta: "open proposals" };
  if (/backlog|past due/.test(t))
    return { win: "command", tab: "backlog", cta: "open backlog" };
  if (/deploy|merge|error|webhook|token/.test(t))
    return { win: "dev", cta: "open dev" };
  return { cta: null };
}

function briefFrom(content: string | null | undefined): string | null {
  if (!content) return null;
  // drop the health section, headers and bullets; keep the first prose lines
  const body = content.split(/^##\s*health/im)[0] ?? content;
  const lines = body
    .split("\n")
    .map((l) =>
      l
        .replace(/^#+\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim(),
    )
    .filter((l) => l && !/^\|/.test(l));
  const text = lines.slice(0, 4).join(" ");
  return text ? text.slice(0, 420) : null;
}

export async function loadCommand(): Promise<OSCommand> {
  const db = supabaseAdmin();

  const [
    agentsRes,
    backlogRes,
    ideasRes,
    stateRes,
    reviewFilesRes,
    runsRes,
    apCountRes,
    healthRes,
  ] = await Promise.all([
    loadAgents().catch(() => ({
      agents: [] as Awaited<ReturnType<typeof loadAgents>>["agents"],
    })),
    (async () => {
      try {
        return await db
          .from("backlog")
          .select(
            "id, title, detail, owner, due, priority, status, waiting_on_owner, updated_at",
          )
          .neq("status", "dropped")
          .order("updated_at", { ascending: false });
      } catch {
        return { data: null };
      }
    })(),
    getActiveIdeas(40).catch(() => []),
    getAgentFile("chief", "STATE.md").catch(() => null),
    listAgentFiles("chief", "improvements/").catch(() => []),
    (async () => {
      try {
        return await db
          .from("runs_schedule")
          .select("date, time, agent, name, status")
          .order("date", { ascending: true });
      } catch {
        return { data: null };
      }
    })(),
    (async () => {
      try {
        return await db
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
      } catch {
        return { count: 0 };
      }
    })(),
    loadHealthFlags().catch(() => ({ vpsStale: false, ledgerPending: false })),
  ]);

  const agents = agentsRes.agents;
  const workingSet = new Set(
    agents.filter((a) => a.status === "working").map((a) => a.id),
  );
  const team: OSTeamMember[] = agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    task: a.task,
    costToday: a.costToday,
    budgetUsd: a.budgetUsd,
    ringPct: a.ringPct,
  }));

  // ── backlog → kanban columns ──────────────────────────────────────────────
  type BacklogRow = {
    id: string;
    title: string | null;
    detail: string | null;
    owner: string | null;
    due: string | null;
    priority: string | null;
    status: string | null;
    waiting_on_owner: boolean | null;
  };
  const backlogRows = ((backlogRes as { data: BacklogRow[] | null }).data ??
    []) as BacklogRow[];
  const backlog: OSBacklogCard[] = backlogRows.map((b) => {
    const owner = asAgent(b.owner);
    const done = b.status === "done";
    const column: OSColumn = done
      ? "done"
      : b.waiting_on_owner
        ? "waiting"
        : owner !== "you" && workingSet.has(owner)
          ? "doing"
          : "todo";
    const title = (b.title ?? "").trim();
    return {
      id: b.id,
      title: title.replace(/^workforce:\s*/i, ""),
      detail: (b.detail ?? "").trim(),
      owner,
      due: b.due,
      priority: (["high", "normal", "low"].includes(b.priority ?? "")
        ? b.priority
        : "normal") as "high" | "normal" | "low",
      column,
      workforce: /^workforce:/i.test(title),
    };
  });

  // ── ideas ─────────────────────────────────────────────────────────────────
  const ideas: OSIdeaCard[] = ideasRes.map((i) => {
    const by = asAgent(i.agent_id);
    return {
      id: i.id,
      title: i.title || i.what || "idea",
      by,
      who: by === "you" ? "you" : by,
      why: i.why,
      status: i.status,
      isNew: i.status === "open" || i.status === "escalated",
    };
  });

  // ── state tiles + health + brief ──────────────────────────────────────────
  const stateContent = stateRes?.content ?? null;
  const openCount = backlog.filter((b) => b.column !== "done").length;
  const doingCount = backlog.filter((b) => b.column === "doing").length;
  const apCount = (apCountRes as { count: number | null }).count ?? 0;
  const activeIdeas = ideas.filter((i) => i.isNew).length;
  const stateTiles: OSStateTile[] = [
    {
      key: "waiting",
      label: "waiting on you",
      value: apCount,
      sub: "needs your tap",
      accent: true,
      win: "approvals",
    },
    {
      key: "backlog",
      label: "backlog",
      value: openCount,
      sub: `${doingCount} in progress`,
      accent: false,
      win: "command",
      tab: "backlog",
    },
    {
      key: "ideas",
      label: "ideas",
      value: activeIdeas,
      sub: "to decide",
      accent: false,
      win: "command",
      tab: "ideas",
    },
    {
      key: "working",
      label: "working now",
      value: workingSet.size,
      sub: `${team.length} agents`,
      accent: false,
    },
  ];
  const health: OSHealth[] = parseHealth(stateContent).map((text) => ({
    text,
    ...healthTarget(text),
  }));
  const brief = briefFrom(stateContent);

  // ── weekly review (newest improvements file) ──────────────────────────────
  const reviewFiles = reviewFilesRes as Awaited<
    ReturnType<typeof listAgentFiles>
  >;
  const newest = reviewFiles[0] ?? null;
  const review = newest
    ? {
        title: (newest.path.split("/").pop() ?? "review").replace(/\.md$/i, ""),
        date: newest.updated_at ?? "",
        markdown: newest.content ?? "",
      }
    : null;

  // ── runs (this week, mon=0 … sun=6) ───────────────────────────────────────
  type RunRow = {
    date: string | null;
    time: string | null;
    agent: string | null;
    name: string | null;
    status: string | null;
  };
  const runRows = ((runsRes as { data: RunRow[] | null }).data ??
    []) as RunRow[];
  const runs: OSRun[] = runRows.map((r) => {
    let day = 0;
    if (r.date) {
      const d = new Date(`${r.date}T00:00:00`);
      day = (d.getDay() + 6) % 7;
    }
    const st = (r.status ?? "planned") as OSRun["status"];
    return {
      day,
      time: (r.time ?? "").slice(0, 5),
      agent: asAgent(r.agent),
      name: r.name ?? "run",
      status: ["planned", "done", "missed"].includes(st) ? st : "planned",
    };
  });

  return {
    stateTiles,
    health,
    team,
    brief,
    backlog,
    ideas,
    review,
    runs,
    owners: ROSTER_IDS,
    staleNotice: staleNoticeText(healthRes),
  };
}
