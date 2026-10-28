import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// GET /api/workforce/call/voices → the bridge's voice list for the call's voice
// picker. Returns an empty list (not an error) when the channel isn't wired, so
// the picker just hides.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const url = process.env.BRIDGE_CALL_URL;
  if (!url) return NextResponse.json({ voices: [] }, { status: 200 });
  try {
    const res = await fetch(`${url}/voices`, {
      headers: {
        authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
      },
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
    return NextResponse.json({ voices: [] }, { status: 200 });
  }
}
