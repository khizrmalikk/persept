import type { HunterStats } from "@/app/dashboard/_components/HunterHeader";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import {
  getMessages,
  getOpenHandoffCount,
  groupThreads,
} from "@/lib/workforce/outreach";
import { getActiveSubagents } from "@/lib/workforce/subagents";

// The header stat row + approvals badge, computed the same way on every Hunter
// route. Defensive: any missing table / file just yields zeros.
export async function getHunterHeaderStats(): Promise<{
  stats: HunterStats;
  pending: number;
}> {
  try {
    const [prospectsFile, messages, handoffCount, apRes, workers] =
      await Promise.all([
        getAgentFile("hunter", "PROSPECTS.md"),
        getMessages("hunter"),
        getOpenHandoffCount("hunter"),
        supabaseAdmin()
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("agent_id", "hunter")
          .in("status", ["pending", "held"]),
        getActiveSubagents(),
      ]);
    const rows = parseMarkdownTable(prospectsFile?.content).rows;
    const replied = groupThreads(messages).filter((t) =>
      t.messages.some((m) => m.direction === "in"),
    ).length;
    const pending = apRes.count ?? 0;
    const workerCount = workers.filter(
      (w) => w.status === "running" && w.agent_id === "hunter",
    ).length;
    return {
      stats: {
        prospects: rows.length,
        replied,
        handoffs: handoffCount,
        waiting: pending,
        workers: workerCount,
      },
      pending,
    };
  } catch {
    return {
      stats: { prospects: 0, replied: 0, handoffs: 0, waiting: 0, workers: 0 },
      pending: 0,
    };
  }
}
