export type Agent = {
  id: string; name: string | null; role: string | null; emoji: string | null; model: string | null;
  status: string | null; current_task: string | null; last_active_at: string | null; updated_at: string | null;
};
export type WfEvent = { id: number; ts: string; agent_id: string | null; kind: string | null; summary: string | null; payload: unknown };
export type Task = { id: string; agent_id: string | null; source: string | null; name: string | null; status: string | null; started_at: string | null; finished_at: string | null; error: string | null; model: string | null };
export type Approval = { id: number; ts: string; agent_id: string | null; action: string | null; why: string | null; draft: string | null; risk: string | null; status: string | null; decision_note: string | null; decided_at: string | null };

export function ago(iso: string | null | undefined): string {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function when(iso: string | null | undefined, tz = "Asia/Dubai"): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export const STATUS_LABEL: Record<string, string> = { idle: "idle", working: "working", waiting: "waiting for you", error: "error", offline: "offline" };
