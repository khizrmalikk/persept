import { supabaseAdmin } from "@/lib/supabase/server";
import { ROSTER } from "@/lib/workforce/roster";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import {
  AGENT_INTEGRATIONS,
  CAPABILITIES,
  type OSAgentExtras,
  type OSIntegration,
  type OSLogLine,
  type OSRun,
} from "./agentpage-types";
import { loadHealthFlags, staleNoticeText } from "./health";

// Per-agent extras for the agent page: connected accounts (integrations), the
// run schedule (runs_schedule) and the static capability list. Server-only;
// shared types + static data live in ./agentpage-types (client-safe). Defensive:
// a missing table just yields empty integrations/runs.
export type { OSAgentExtras } from "./agentpage-types";

type IntegrationRow = {
  id: string | null;
  name: string | null;
  status: string | null;
  detail: string | null;
};
type RunRow = {
  time: string | null;
  name: string | null;
  agent: string | null;
  status: string | null;
};
type EventRow = {
  id: number | string | null;
  agent_id: string | null;
  kind: string | null;
  ts: string | null;
  summary: string | null;
  payload: unknown;
};

const STATUS = (s: string | null): OSIntegration["status"] =>
  s === "connected" || s === "pending" || s === "off" ? s : "off";
const RUN_STATUS = (s: string | null): OSRun["status"] =>
  s === "done" || s === "missed" ? s : "planned";

export async function loadAgentExtras(): Promise<
  Record<string, OSAgentExtras>
> {
  let integrations: IntegrationRow[] = [];
  let runs: RunRow[] = [];
  let events: EventRow[] = [];
  let health = { vpsStale: false, ledgerPending: false };

  try {
    const db = supabaseAdmin();
    const [intRes, runRes, evRes, healthRes] = await Promise.all([
      (async () => {
        try {
          return await db
            .from("integrations")
            .select("id, name, status, detail");
        } catch {
          return { data: null };
        }
      })(),
      (async () => {
        try {
          return await db
            .from("runs_schedule")
            .select("time, name, agent, status")
            .order("time", { ascending: true });
        } catch {
          return { data: null };
        }
      })(),
      // newest ~400 events across the roster; grouped + capped per agent below.
      (async () => {
        try {
          return await db
            .from("events")
            .select("id, agent_id, kind, ts, summary, payload")
            .order("ts", { ascending: false })
            .limit(400);
        } catch {
          return { data: null };
        }
      })(),
      loadHealthFlags().catch(() => ({
        vpsStale: false,
        ledgerPending: false,
      })),
    ]);
    integrations = (intRes as { data: IntegrationRow[] | null }).data ?? [];
    runs = (runRes as { data: RunRow[] | null }).data ?? [];
    events = (evRes as { data: EventRow[] | null }).data ?? [];
    health = healthRes;
  } catch {
    integrations = [];
    runs = [];
    events = [];
  }

  // events → per-agent log lines (newest 60, then oldest→newest for the pane)
  const logByAgent = new Map<string, OSLogLine[]>();
  for (const e of events) {
    const a = (e.agent_id ?? "").toLowerCase();
    if (!a) continue;
    const list = logByAgent.get(a) ?? [];
    if (list.length >= 60) continue; // events are newest-first; keep the 60 newest
    const text = (
      (e.payload as { text?: string } | null)?.text ??
      e.summary ??
      ""
    ).trim();
    list.push({
      id: String(e.id ?? `${a}-${list.length}`),
      kind: (e.kind ?? "message").toLowerCase(),
      text: text || e.kind || "event",
      ts: e.ts ? ago(e.ts).replace(/\s*ago$/, "") : "",
    });
    logByAgent.set(a, list);
  }
  const staleNotice = staleNoticeText(health);

  const intById = new Map<string, IntegrationRow>();
  for (const r of integrations) {
    const key = (r.id ?? r.name ?? "").toLowerCase();
    if (key) intById.set(key, r);
  }

  // runs grouped by agent, deduped by name (recurring daily runs show once)
  const runsByAgent = new Map<string, OSRun[]>();
  for (const r of runs) {
    const a = (r.agent ?? "").toLowerCase();
    if (!a) continue;
    const list = runsByAgent.get(a) ?? [];
    if (!list.some((x) => x.name === (r.name ?? "")))
      list.push({
        time: r.time ?? "",
        name: r.name ?? "run",
        status: RUN_STATUS(r.status),
      });
    runsByAgent.set(a, list);
  }

  const out: Record<string, OSAgentExtras> = {};
  for (const r of ROSTER) {
    const id = r.id as AgentKey;
    const wanted = AGENT_INTEGRATIONS[id] ?? [];
    const agentIntegrations: OSIntegration[] = wanted
      .map((key) => {
        const row = intById.get(key.toLowerCase());
        if (!row) return null;
        return {
          id: key,
          name: row.name ?? key,
          status: STATUS(row.status),
          detail: row.detail ?? "",
        } satisfies OSIntegration;
      })
      .filter((x): x is OSIntegration => x !== null);

    out[id] = {
      integrations: agentIntegrations,
      runs: runsByAgent.get(id) ?? [],
      capabilities: CAPABILITIES[id] ?? [],
      // newest-first was collected above; reverse to oldest→newest for the pane
      log: [...(logByAgent.get(id) ?? [])].reverse(),
      ledgerPending: health.ledgerPending,
      vpsStale: health.vpsStale,
      staleNotice,
    };
  }
  return out;
}
