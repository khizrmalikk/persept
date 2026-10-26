import { supabaseAdmin } from "@/lib/supabase/server";

// Plan events the live view replays. The bridge writes one `events` row with
// kind='plan' per Percy reply that carries blocks; payload = { message_event_id,
// sessionKey, say, steps:[{kind,key,label,tier?,host?,error?}] }. This app only
// READS them and replays the choreography on screen (Percy already did the work
// on the bridge). Defensive: a missing table/column yields an empty list.

export type OSPlanStepKind =
  | "ops"
  | "campaign"
  | "backlog"
  | "fix"
  | "leads"
  | "approval";

export type OSPlanStep = {
  kind: OSPlanStepKind;
  key: string;
  label: string;
  tier?: "auto" | "approval";
  host?: boolean;
  error?: string;
};

export type OSPlan = {
  eventId: number; // the plan event's own id
  messageEventId: number; // the assistant message this plan annotates
  sessionKey: string;
  say: string;
  steps: OSPlanStep[];
  ts: string;
};

const STEP_KINDS: OSPlanStepKind[] = [
  "ops",
  "campaign",
  "backlog",
  "fix",
  "leads",
  "approval",
];

type EventRow = {
  id: number;
  ts: string | null;
  payload: unknown;
};

function normalizeStep(raw: unknown): OSPlanStep | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const kind = String(s.kind ?? "");
  if (!STEP_KINDS.includes(kind as OSPlanStepKind)) return null;
  return {
    kind: kind as OSPlanStepKind,
    key: String(s.key ?? ""),
    label: String(s.label ?? s.key ?? kind),
    tier:
      s.tier === "approval"
        ? "approval"
        : s.tier === "auto"
          ? "auto"
          : undefined,
    host: s.host === true ? true : undefined,
    error: s.error ? String(s.error) : undefined,
  };
}

export async function loadPlans(limit = 5): Promise<OSPlan[]> {
  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("events")
      .select("id, ts, payload")
      .eq("kind", "plan")
      .eq("agent", "percy")
      .order("id", { ascending: false })
      .limit(limit);
    return ((data as EventRow[] | null) ?? []).map((r) => {
      const p = (r.payload ?? {}) as Record<string, unknown>;
      const steps = Array.isArray(p.steps)
        ? (p.steps.map(normalizeStep).filter(Boolean) as OSPlanStep[])
        : [];
      return {
        eventId: r.id,
        messageEventId: Number(p.message_event_id ?? 0),
        sessionKey: String(p.sessionKey ?? ""),
        say: String(p.say ?? ""),
        steps,
        ts: (r.ts ?? "").trim(),
      };
    });
  } catch {
    return [];
  }
}
