import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// POST /api/workforce/call/tts { text, voice? } → streamed audio (audio/mpeg by
// default). The provider is the bridge's business (Kokoro on the VPS by
// default); this only proxies. The client speaks sentence by sentence and
// queues the clips, so first-audio latency on the VPS CPU is hidden.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const url = process.env.BRIDGE_CALL_URL;
  if (!url) return new NextResponse(null, { status: 501 });
  const body = (await req.json().catch(() => null)) as {
    text?: string;
    voice?: string;
  } | null;
  const text = (body?.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }
  try {
    const res = await fetch(`${url}/tts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text, voice: body?.voice }),
      signal: req.signal,
    });
    if (!res.ok || !res.body) {
      return new NextResponse(null, { status: res.status || 502 });
    }
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "content-type": res.headers.get("content-type") ?? "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
