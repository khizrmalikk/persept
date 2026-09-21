import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// GET /api/workforce/call/scribe-token — mints a single-use ElevenLabs realtime
// Scribe token so the browser can connect to ElevenLabs directly for speech-to-
// text. The API key stays server-side; the token is single-use and expires in
// ~15 min (the client fetches a fresh one per call and on reconnect). 501 when no
// key → the client falls back to the browser recogniser. Allowlist-gated.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new NextResponse(null, { status: 501 });

  try {
    const res = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      { method: "POST", headers: { "xi-api-key": key }, signal: req.signal },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[scribe-token] elevenlabs ${res.status}: ${errText.slice(0, 200)}`);
      return new NextResponse(null, { status: 502 });
    }
    const data = (await res.json().catch(() => null)) as
      | { token?: string; single_use_token?: string }
      | null;
    const token = data?.token ?? data?.single_use_token;
    if (!token) return new NextResponse(null, { status: 502 });
    return NextResponse.json({ token });
  } catch (e) {
    console.error("[scribe-token] request failed:", e);
    return new NextResponse(null, { status: 502 });
  }
}
