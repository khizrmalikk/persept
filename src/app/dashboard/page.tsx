import { supabaseAdmin } from "@/lib/supabase/server";
import { sendMessageFromForm } from "@/lib/workforce/actions";
import { looksLikeChief, toConstellationStatus } from "@/lib/workforce/format";
import { getHealth } from "@/lib/workforce/metrics";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import {
  type Agent,
  type Approval,
  type ConstellationWorker,
  STATUS_LABEL,
  type Subagent,
  type WfEvent,
  when,
} from "@/lib/workforce/types";
import type { ChatMessage } from "./_components/ChatPane";
import {
  type OfficeAgent,
  type OfficeData,
  type OfficeEvent,
  OfficeView,
} from "./_components/ConstellationPanel";

// The office is the light centrepiece: a full-bleed 3D constellation with a calm
// light overlay floated over it (identity/status, live stats, roster, latest
// activity) plus call-from-this-page. Background workers appear as satellites on
// their parent node. This page is a pure server component: it fetches the same
// data as before and hands a fully-serializable payload to the client OfficeView.
export default async function Office() {
  const db = supabaseAdmin();
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [
    { data: agents },
    { data: pending },
    { data: recent },
    { data: todays },
    { data: chatEvents },
    workerRows,
    health,
  ] = await Promise.all([
    db.from("agents").select("*").order("id"),
    db.from("approvals").select("id, agent_id").eq("status", "pending"),
    db.from("events").select("*").order("ts", { ascending: false }).limit(6),
    db
      .from("events")
      .select("agent_id")
      .gte("ts", since.toISOString())
      .in("kind", ["run", "cron", "message"]),
    // Recent chat history across all agents (newest first). Bucketed per agent
    // below so the office chat card can show each agent's last ~25 messages
    // inline without a per-agent round-trip. Over-fetch so busy agents still
    // fill their bucket after bucketing by agent_id.
    db
      .from("events")
      .select("*")
      .eq("kind", "message")
      .order("ts", { ascending: false })
      .limit(400),
    getActiveSubagents(),
    getHealth(),
  ]);

  const pendingBy = new Map<string, number>();
  for (const p of (pending as Pick<Approval, "id" | "agent_id">[] | null) ?? [])
    pendingBy.set(p.agent_id ?? "", (pendingBy.get(p.agent_id ?? "") ?? 0) + 1);

  const all = (agents as Agent[] | null) ?? [];
  const working = all.filter((a) => a.status === "working").length;
  const waiting = ((pending as unknown[] | null) ?? []).length;
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
      constStatus: pendingBy.get(a.id)
        ? "waiting"
        : toConstellationStatus(a.status),
      isHub: i === hubIndex,
      pending: pendingBy.get(a.id) ?? 0,
      workers: runningByAgent.get(a.id) ?? 0,
    };
  });

  const events: OfficeEvent[] = ((recent as WfEvent[] | null) ?? []).map(
    (e) => ({
      id: e.id,
      agent: e.agent_id ?? "system",
      summary: cleanSummary(e.summary ?? e.kind ?? "event"),
      time: clock(e.ts),
      isError: e.kind === "error",
    }),
  );

  // Per-agent chat history for the office chat card. Bucket the newest-first
  // message events by agent, keep each agent's most recent 25, then flip to
  // chronological order. The per-message mapping mirrors the agent page exactly:
  // role/mine detection + [voice call] tag stripping + the `call` flag.
  const chatByAgent: Record<string, ChatMessage[]> = {};
  const bucketRaw: Record<string, WfEvent[]> = {};
  for (const e of (chatEvents as WfEvent[] | null) ?? []) {
    const aid = e.agent_id ?? "";
    if (!aid || !agentIds.has(aid)) continue;
    let bucket = bucketRaw[aid];
    if (!bucket) {
      bucket = [];
      bucketRaw[aid] = bucket;
    }
    if (bucket.length < 25) bucket.push(e); // newest-first, capped at 25
  }
  for (const a of all) {
    const raw = (bucketRaw[a.id] ?? []).slice().reverse(); // → chronological
    chatByAgent[a.id] = raw.map((m) => toChatMessage(m));
  }

  const data: OfficeData = {
    agents: officeAgents,
    workers,
    events,
    chatByAgent,
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

  return <OfficeView data={data} sendAction={sendMessageFromForm} />;
}

// Map one raw `message` event to the serializable ChatMessage shape used by the
// client ChatPane. Kept identical to the agent page's mapping: role/mine
// detection, [voice call] / [voice call ended] tag stripping, and the `call`
// flag. Shared here so the office chat card renders messages the same way.
function toChatMessage(m: WfEvent): ChatMessage {
  const p = (m.payload ?? {}) as { role?: string; text?: string };
  const mine = p.role === "user" || (m.summary ?? "").startsWith("owner");
  let text = p.text ?? m.summary ?? "";
  let call = false;
  if (text.startsWith("[voice call ended]")) {
    text = text.slice("[voice call ended]".length).trimStart();
    call = true;
  } else if (text.startsWith("[voice call]")) {
    text = text.slice("[voice call]".length).trimStart();
    call = true;
  }
  return { id: m.id, mine, text, ts: when(m.ts), call };
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
