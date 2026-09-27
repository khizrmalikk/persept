import { supabaseAdmin } from "@/lib/supabase/server";
import { ROSTER, rosterById } from "@/lib/workforce/roster";
import type { Task, WfEvent } from "@/lib/workforce/types";
import {
  ActivityView,
  type FeedRow,
  type RunRow,
} from "../_components/ActivityView";
import "../activity.css";

export const dynamic = "force-dynamic";

const KINDS = [
  "message",
  "worker",
  "cron",
  "lead",
  "approval",
  "post",
  "error",
];
function normKind(raw: string | null): string {
  const k = (raw ?? "message").toLowerCase();
  if (k === "subagent" || k === "worker") return "worker";
  if (k === "run") return "cron";
  return KINDS.includes(k) ? k : "message";
}
function hhmm(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
function cleanSummary(raw: string): string {
  let s = (raw ?? "").trim();
  s = s.replace(/^(assistant|user|owner)\s*:\s*/i, "");
  return s || raw;
}
function runStatus(t: Task): "ok" | "running" | "error" | "scheduled" {
  if (t.status === "ok") return "ok";
  if (t.status === "error") return "error";
  if (t.started_at && !t.finished_at) return "running";
  return "scheduled";
}

export default async function Activity() {
  const db = supabaseAdmin();
  const [{ data: eventRows }, { data: taskRows }] = await Promise.all([
    db.from("events").select("*").order("ts", { ascending: false }).limit(80),
    db
      .from("tasks")
      .select("*")
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(14),
  ]);

  const events = (eventRows as WfEvent[] | null) ?? [];
  const tasks = (taskRows as Task[] | null) ?? [];

  const feed: FeedRow[] = events.map((e) => {
    const r = rosterById(e.agent_id ?? "");
    const kind = normKind(e.kind);
    const summary = cleanSummary(e.summary ?? e.kind ?? "event");
    const child = kind === "worker" && /finished/i.test(summary);
    return {
      id: e.id,
      t: hhmm(e.ts),
      agentId: e.agent_id ?? "",
      name: (r?.name ?? e.agent_id ?? "system").toLowerCase(),
      emoji: r?.emoji ?? "◆",
      hue: r?.hue ?? 70,
      kind,
      summary,
      child,
    };
  });

  const runs: RunRow[] = tasks.map((t) => {
    const r = rosterById(t.agent_id ?? "");
    return {
      id: t.id,
      when: hhmm(t.started_at ?? t.finished_at),
      emoji: r?.emoji ?? "◆",
      job: t.name ?? t.source ?? "task",
      model: (t.model ?? "").replace(/^anthropic\//, ""),
      status: runStatus(t),
    };
  });

  const agents = ROSTER.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
  }));

  return <ActivityView agents={agents} feed={feed} runs={runs} />;
}
