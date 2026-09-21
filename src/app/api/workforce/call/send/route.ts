import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// POST /api/workforce/call/send { agentId, text } — forwards a spoken utterance
// to the VPS bridge's live call channel (the bridge prefixes [voice call] itself)
// and returns its JSON + status. 501 when the live channel isn't configured, so
// the client falls back to the Supabase path. Allowlist-gated; token stays server-side.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const url = process.env.BRIDGE_CALL_URL;
  if (!url) {
    return NextResponse.json({ error: "live channel unavailable" }, { status: 501 });
  }
  const body = (await req.json().catch(() => null)) as
    | { agentId?: string; text?: string }
    | null;
  const agentId = (body?.agentId ?? "").trim();
  const text = (body?.text ?? "").trim();
  if (!agentId || !text) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    const res = await fetch(`${url}/send`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ agentId, text }),
      signal: req.signal,
    });
    const respText = await res.text();
    return new NextResponse(respText, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "bridge unreachable" }, { status: 502 });
  }
}
