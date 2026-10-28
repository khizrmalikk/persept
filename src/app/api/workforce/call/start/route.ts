import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// POST /api/workforce/call/start { agentId } — opens the call turn so Percy
// greets first; the greeting streams back over /call/stream like any turn (no
// hard-coded opening line). 501 when the live channel isn't configured.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const url = process.env.BRIDGE_CALL_URL;
  if (!url) {
    return NextResponse.json(
      { error: "live channel unavailable" },
      { status: 501 },
    );
  }
  const body = (await req.json().catch(() => null)) as {
    agentId?: string;
  } | null;
  const agentId = (body?.agentId ?? "").trim();
  if (!agentId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  try {
    const res = await fetch(`${url}/start`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ agentId }),
      signal: req.signal,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "bridge unreachable" }, { status: 502 });
  }
}
