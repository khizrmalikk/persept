import { supabaseAdmin } from "@/lib/supabase/server";
import { approveFromForm, rejectFromForm } from "@/lib/workforce/actions";
import { getOpenBacklog, parseHealth } from "@/lib/workforce/backlog";
import { getAgentFile } from "@/lib/workforce/files";
import { looksLikeChief, toConstellationStatus } from "@/lib/workforce/format";
import { getHealth } from "@/lib/workforce/metrics";
import { getHandoffs } from "@/lib/workforce/outreach";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import {
  type Agent,
  type Approval,
  ago,
  type ConstellationWorker,
  STATUS_LABEL,
  type Subagent,
  type Task,
  type WfEvent,
} from "@/lib/workforce/types";
import {
  type OfficeAgent,
  type OfficeApproval,
  type OfficeBacklog,
  type OfficeData,
  type OfficeEvent,
  type OfficeSubagent,
  type OfficeTask,
  type OfficeUrgent,
  OfficeView,
} from "./_components/ConstellationPanel";
import { dueState } from "./_components/panels/dates";

// The office is the light centrepiece: a WebGL-free 2D agent network with a calm
// identity/status strip + live stats, the pending-approvals queue embedded
// alongside, and a latest-activity peek. Background workers appear as satellites
// on their parent node. This page is a pure server component: it fetches the
// agents/workers/events/stats plus the pending approval rows for the embed and
// hands a fully-serializable payload to the client OfficeView.
export default async function Office() {
  const db = supabaseAdmin();
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [
    { data: agents },
    { data: pending },
    { data: recent },
    { data: todays },
    { data: runningTasks },
    workerRows,
    health,
    handoffs,
    openBacklog,
    chiefState,
  ] = await Promise.all([
    db.from("agents").select("*").order("id"),
    // Full pending rows (newest handled first in the queue, oldest first here to
    // match the approvals page order) for the office embed + the waiting count.
    db
      .from("approvals")
      .select("id, agent_id, action, risk, ts")
      .eq("status", "pending")
      .order("ts", { ascending: true }),
    db.from("events").select("*").order("ts", { ascending: false }).limit(6),
    db
      .from("events")
      .select("agent_id")
      .gte("ts", since.toISOString())
      .in("kind", ["run", "cron", "message"]),
    // Tasks in progress (started, not yet finished) for the left rail.
    db
      .from("tasks")
      .select("id, agent_id, name, source, started_at, status")
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(12),
    getActiveSubagents(),
    getHealth(),
    getHandoffs("hunter", ["open"]),
    getOpenBacklog(),
    getAgentFile("chief", "STATE.md"),
  ]);

  // Compact backlog for the home: the top open items, with a due-state colour
  // class (overdue → err, today → accent, else muted).
  const dueClass = (d: string | null) => {
    const s = d ? dueState(d) : "";
    return s === "overdue" ? "err" : s === "today" ? "accent" : "muted";
  };
  const backlog: OfficeBacklog[] = openBacklog.slice(0, 6).map((b) => ({
    id: b.id,
    title: b.title,
    owner: b.owner,
    due: b.due,
    priority: b.priority,
    dueCls: b.due ? dueClass(b.due) : "",
  }));
  const backlogOpen = openBacklog.length;

  type PendingRow = Pick<
    Approval,
    "id" | "agent_id" | "action" | "risk" | "ts"
  >;
  const pendingRows = (pending as PendingRow[] | null) ?? [];

  const pendingBy = new Map<string, number>();
  for (const p of pendingRows)
    pendingBy.set(p.agent_id ?? "", (pendingBy.get(p.agent_id ?? "") ?? 0) + 1);

  const all = (agents as Agent[] | null) ?? [];
  const working = all.filter((a) => a.status === "working").length;
  const waiting = pendingRows.length;
  const doneToday = ((todays as unknown[] | null) ?? []).length;

  // Exactly one hub: the first chief-like agent, else the first agent.
  const hubIndex = (() => {
    const i = all.findIndex((a) => looksLikeChief(a));
    return i >= 0 ? i : 0;
  })();

  // Background workers → satellites on their parent node + a per-agent running count.
  const agentIds = new Set(all.map((a) => a.id));
  const workerList = workerRows.filter(
    (w: Subagent) => w.agent_id && agentIds.has(w.agent_id),
  );
  const workers: ConstellationWorker[] = workerList.map((w) => ({
    id: w.session_key,
    parentId: w.agent_id as string,
    label: w.label,
    status: w.status === "running" ? "running" : "done",
    startedAt: w.started_at ?? w.updated_at ?? new Date(0).toISOString(),
  }));
  const runningByAgent = new Map<string, number>();
  for (const w of workerList)
    if (w.status === "running")
      runningByAgent.set(
        w.agent_id as string,
        (runningByAgent.get(w.agent_id as string) ?? 0) + 1,
      );

  const officeAgents: OfficeAgent[] = all.map((a, i) => {
    const raw = pendingBy.get(a.id) ? "waiting" : (a.status ?? "idle");
    return {
      id: a.id,
      name: a.name ?? a.id,
      emoji: a.emoji,
      status: raw,
      statusLabel: STATUS_LABEL[raw] ?? raw,
      netStatus: pendingBy.get(a.id)
        ? "waiting"
        : toConstellationStatus(a.status),
      isHub: i === hubIndex,
      pending: pendingBy.get(a.id) ?? 0,
      workers: runningByAgent.get(a.id) ?? 0,
      currentTask: a.current_task ?? null,
      lastActive: ago(a.last_active_at),
    };
  });

  const nameById = new Map<string, { name: string; emoji: string | null }>();
  for (const a of all)
    nameById.set(a.id, { name: a.name ?? a.id, emoji: a.emoji });
  const meta = (id: string | null) =>
    (id ? nameById.get(id) : undefined) ?? {
      name: id ?? "system",
      emoji: null,
    };

  // Sub-agents: the running background workers, newest first, for the left rail.
  const subagents: OfficeSubagent[] = workerList
    .filter((w) => w.status === "running")
    .map((w) => {
      const m = meta(w.agent_id);
      return {
        id: w.session_key,
        agentId: w.agent_id ?? "",
        agentName: m.name,
        agentEmoji: m.emoji,
        label: w.label ?? "background task",
        ago: ago(w.started_at ?? w.updated_at),
      };
    });

  // Tasks in progress (started, unfinished) for the left rail.
  const tasks: OfficeTask[] = ((runningTasks as Task[] | null) ?? []).map(
    (t) => {
      const m = meta(t.agent_id);
      return {
        id: t.id,
        agentId: t.agent_id ?? "",
        agentName: m.name,
        agentEmoji: m.emoji,
        name: t.name ?? t.source ?? "task",
        ago: ago(t.started_at),
      };
    },
  );

  // Compact pending-approval rows for the embed (top of queue). Parse the
  // severity word out of the "SEVERITY — reason" risk string (same as ApprovalCard).
  const approvals: OfficeApproval[] = pendingRows.map((p) => {
    const meta = p.agent_id ? nameById.get(p.agent_id) : undefined;
    return {
      id: p.id,
      agentId: p.agent_id ?? "chief",
      agentName: meta?.name ?? p.agent_id ?? "system",
      agentEmoji: meta?.emoji ?? null,
      action: p.action ?? "approval request",
      severity: parseSeverity(p.risk),
      ago: ago(p.ts),
    };
  });

  const events: OfficeEvent[] = ((recent as WfEvent[] | null) ?? []).map(
    (e) => {
      // A post event carries the published link in its summary; lift it out so
      // the feed can render a "link →" and the summary reads clean without it.
      const raw = cleanSummary(e.summary ?? e.kind ?? "event");
      const url =
        e.kind === "post" ? (raw.match(/https?:\/\/\S+/)?.[0] ?? null) : null;
      const summary = url
        ? raw.replace(url, "").replace(/\s+$/, "").trim()
        : raw;
      return {
        id: e.id,
        agent: e.agent_id ?? "system",
        summary,
        time: clock(e.ts),
        isError: e.kind === "error",
        kind: e.kind ?? "",
        url,
      };
    },
  );

  // Urgent: the things that actually want the owner's eye — risky approvals,
  // recent errors, and open hand-offs from Hunter — in one short list.
  const urgent: OfficeUrgent[] = [];
  for (const ap of approvals) {
    if (ap.severity === "high" || ap.severity === "critical")
      urgent.push({
        id: `ap-${ap.id}`,
        kind: "approval",
        emoji: ap.agentEmoji,
        text: ap.action,
        meta: `${ap.agentName} · ${ap.ago}`,
        severity: ap.severity,
      });
  }
  for (const e of events) {
    if (e.isError)
      urgent.push({
        id: `ev-${e.id}`,
        kind: "error",
        emoji: "⚠",
        text: e.summary,
        meta: `${e.agent} · ${e.time}`,
      });
  }
  for (const h of handoffs) {
    const m = meta("hunter");
    urgent.push({
      id: `ho-${h.id}`,
      kind: "handoff",
      emoji: m.emoji,
      text: `hand-off: ${h.company ?? "a prospect"}`,
      meta: h.why ? h.why : `${m.name} · ${ago(h.ts)}`,
    });
  }

  // Chief's health discrepancies (from STATE.md) for the strip under the roster.
  const healthLines = parseHealth(chiefState?.content);

  const data: OfficeData = {
    agents: officeAgents,
    workers,
    subagents,
    tasks,
    events,
    approvals,
    urgent,
    backlog,
    backlogOpen,
    health: healthLines,
    stats: {
      online: health.agentsOnline,
      total: health.agentsTotal,
      working,
      waiting,
      doneToday,
    },
    bridgeStale: health.bridgeStale,
  };

  if (all.length === 0) {
    return (
      <div className="wf-office">
        <div className="wf-office-empty">
          no agents yet. once the bridge is connected they appear here.
        </div>
      </div>
    );
  }

  return (
    <OfficeView
      data={data}
      approveAction={approveFromForm}
      rejectAction={rejectFromForm}
    />
  );
}

// Pull the severity word out of a "SEVERITY — reason…" risk string; lowercased,
// or "" when absent. Mirrors ApprovalCard so the embed chip matches the page.
function parseSeverity(risk: string | null | undefined): string {
  const raw = (risk ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^([A-Za-z]+)\s*[—–-]\s*/);
  return (m?.[1] ?? raw.split(/\s/)[0] ?? "").toLowerCase();
}

// Strip raw chat plumbing from event summaries so the office feed reads cleanly:
// drop "assistant:"/"user:"/"owner:" role prefixes and unwrap the [voice call]
// call-mode tags into plain language.
function cleanSummary(raw: string): string {
  let s = (raw ?? "").trim();
  s = s.replace(/^(assistant|user|owner)\s*:\s*/i, "");
  if (/^\[voice call ended\]/i.test(s)) {
    const rest = s.replace(/^\[voice call ended\]\s*/i, "").trim();
    return rest ? `call ended · ${rest}` : "voice call ended";
  }
  if (/^\[voice call\]/i.test(s)) {
    const rest = s.replace(/^\[voice call\]\s*/i, "").trim();
    return rest || "voice call";
  }
  return s || raw;
}

// hh:mm:ss for the activity peek (Asia/Dubai, matching the top-bar clock).
function clock(iso: string | null | undefined): string {
  if (!iso) return "--:--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}
