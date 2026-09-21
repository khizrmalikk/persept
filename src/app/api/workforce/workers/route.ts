import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { getRunningWorkers } from "@/lib/workforce/subagents";

// GET /api/workforce/workers?agent=<id> — the running background workers for an
// agent. Read-only; same allowlist auth as the rest of the dashboard (proxy.ts
// does not gate /api, so we check here). Never exposes the service key.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const agent = req.nextUrl.searchParams.get("agent")?.trim() ?? "";
  if (!agent) return NextResponse.json({ workers: [] });

  const rows = await getRunningWorkers(agent);
  return NextResponse.json({
    workers: rows.map((r) => ({
      id: r.session_key,
      label: r.label,
      model: r.model,
      startedAt: r.started_at,
    })),
  });
}
