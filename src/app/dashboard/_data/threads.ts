import { supabaseAdmin } from "@/lib/supabase/server";

// Chat history for the drawer + agent page. A thread is `events` where
// kind = "message" for that agent, ordered oldest→newest. payload.role is "user"
// (the owner) or "assistant" (the agent); payload.text is the body. The bridge
// writes these from the gateway a few seconds after each turn, so a sent message
// (an `actions` row) echoes back here and arrives via the tick. One query loads
// every thread; the drawer reconciles its optimistic bubbles against this.

export type OSThreadMsg = {
  id: string;
  mine: boolean;
  text: string;
  ts: string;
};

const AGENTS = ["chief", "scout", "hunter", "scribe", "muse", "fixer"];
const hm = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

export async function loadThreads(): Promise<Record<string, OSThreadMsg[]>> {
  const out: Record<string, OSThreadMsg[]> = {};
  for (const a of AGENTS) out[a] = [];
  try {
    // newest 300 message events (desc), reversed to oldest→newest below. Using
    // ascending+limit would return the OLDEST 300 and never include new replies.
    const { data } = await supabaseAdmin()
      .from("events")
      .select("id, agent_id, ts, summary, payload")
      .eq("kind", "message")
      .order("ts", { ascending: false })
      .limit(300);
    for (const row of (data as
      | {
          id: number | string;
          agent_id: string | null;
          ts: string | null;
          summary: string | null;
          payload: unknown;
        }[]
      | null) ?? []) {
      const aid = String(row.agent_id ?? "");
      if (!(aid in out)) continue;
      const p = (row.payload ?? {}) as { role?: string; text?: string };
      const mine =
        p.role === "user" || String(row.summary ?? "").startsWith("owner");
      const text = (p.text || row.summary || "").toString();
      if (!text.trim()) continue;
      out[aid].push({
        id: String(row.id),
        mine,
        text: text.trim(),
        ts: hm(row.ts),
      });
    }
  } catch {
    // events table unreachable — empty threads, drawer still sends
  }
  // fetched newest→oldest; flip each thread to oldest→newest for display
  for (const k of Object.keys(out)) out[k].reverse();
  return out;
}
