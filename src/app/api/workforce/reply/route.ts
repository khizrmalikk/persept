import { type NextRequest, NextResponse } from "next/server";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";

// GET /api/workforce/reply?agent=<id>&after=<eventId> — long-poll for the next
// assistant message for an agent (its reply, or an unsolicited message when a
// background worker reports back). Holds up to 25s, checking every 1s; returns
// { id, text } when one arrives, else 204 at the deadline. Allowlist-gated.
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const agent = req.nextUrl.searchParams.get("agent")?.trim() ?? "";
  const after = Number(req.nextUrl.searchParams.get("after") ?? "0") || 0;
  if (!agent) return new NextResponse(null, { status: 204 });

  const db = supabaseAdmin();
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline && !req.signal.aborted) {
    // Next agent message after the cursor. We do NOT rely on payload.role being
    // exactly "assistant" (the bridge doesn't always set it) — instead we mirror
    // the chat's own logic: an agent turn is any `message` that is not the owner's
    // and not one of our own [voice call] markers echoed back into events.
    const { data } = await db
      .from("events")
      .select("id, summary, payload")
      .eq("agent_id", agent)
      .eq("kind", "message")
      .gt("id", after)
      .order("id", { ascending: true })
      .limit(20);
    for (const row of (data ?? []) as {
      id: number;
      summary: string | null;
      payload: unknown;
    }[]) {
      const p = (row.payload ?? {}) as { role?: string; text?: string };
      const text = (p.text ?? row.summary ?? "").trim();
      const mine =
        p.role === "user" || (row.summary ?? "").toLowerCase().startsWith("owner");
      if (mine || !text || /^\[voice call/i.test(text)) continue;
      return NextResponse.json({ id: row.id, text });
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return new NextResponse(null, { status: 204 });
}
