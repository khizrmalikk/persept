import { supabaseAdmin } from "@/lib/supabase/server";
import { attachBlockStatuses } from "@/lib/workforce/block-status";
import { type BlockPart, type Part, parseBlocks } from "@/lib/workforce/blocks";

// Chat history for the drawer + agent page. A thread is `events` where
// kind = "message" for that agent, ordered oldest→newest. payload.role is "user"
// (the owner) or "assistant" (the agent); payload.text is the body. The bridge
// writes these from the gateway a few seconds after each turn, so a sent message
// (an `actions` row) echoes back here and arrives via the tick. One query loads
// every thread; the drawer reconciles its optimistic bubbles against this.
//
// Agent (and system) messages carry the bridge's block grammar as plain text —
// parseBlocks turns that into `parts` the drawer renders as cards. Owner messages
// (`mine`) are never parsed (they may quote blocks). A block's live status pill is
// filled in here, server-side, so the anon key never does these reads.

export type OSThreadMsg = {
  id: string;
  mine: boolean;
  text: string;
  ts: string;
  // present only when the message contained blocks/system lines (never on `mine`).
  parts?: Part[];
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
  // every block across every thread, paired with its message time, for the one
  // batched status pass at the end.
  const toStatus: { block: BlockPart; ts: string | null }[] = [];
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
      const text = (p.text || row.summary || "").toString().trim();
      if (!text) continue;
      const msg: OSThreadMsg = {
        id: String(row.id),
        mine,
        text,
        ts: hm(row.ts),
      };
      // only agent/system messages become cards; the owner's never do.
      if (!mine) {
        const { parts } = parseBlocks(text);
        if (parts.some((pt) => pt.kind !== "text")) {
          msg.parts = parts;
          for (const pt of parts)
            if (pt.kind === "block") toStatus.push({ block: pt, ts: row.ts });
        }
      }
      out[aid].push(msg);
    }
  } catch {
    // events table unreachable — empty threads, drawer still sends
  }
  // one batched pass fills each block's live status pill (best-effort).
  try {
    await attachBlockStatuses(toStatus);
  } catch {
    // no pills — cards still render
  }
  // fetched newest→oldest; flip each thread to oldest→newest for display
  for (const k of Object.keys(out)) out[k].reverse();
  return out;
}
