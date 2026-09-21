import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

// GET /api/workforce/call/stream?agent=<id> — opens the VPS bridge's SSE call
// channel with the server-side token and pipes it through unchanged. Events:
// {type:"ready"}, {type:"delta",text,runId}…, {type:"final",text,runId} |
// {type:"error",text}; `: hb` keepalives every 15s. 501 when unconfigured →
// client uses the Supabase path. Aborts upstream when the client disconnects.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const url = process.env.BRIDGE_CALL_URL;
  if (!url) return new NextResponse(null, { status: 501 });

  const agent = req.nextUrl.searchParams.get("agent")?.trim() ?? "";
  if (!agent) return new NextResponse(null, { status: 400 });

  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    /* leave blank */
  }

  // Reachability probe (?ping=1): connect to the bridge stream with a short
  // timeout, then abort — lets the client detect an unreachable live channel in
  // ~3s and fall back immediately, instead of after several failed EventSources.
  if (req.nextUrl.searchParams.get("ping") === "1") {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 2500);
    try {
      const probe = await fetch(
        `${url}/stream?agentId=${encodeURIComponent(agent)}`,
        {
          headers: {
            authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
            accept: "text/event-stream",
          },
          signal: ac.signal,
        },
      );
      clearTimeout(timer);
      void probe.body?.cancel().catch(() => {}); // we only needed the handshake
      if (!probe.ok) {
        console.error(
          `[call/stream] bridge unreachable via ${host}: http ${probe.status}`,
        );
        return new NextResponse(null, {
          status: 502,
          headers: { "x-bridge-host": host },
        });
      }
      return new NextResponse(null, {
        status: 200,
        headers: { "x-bridge-host": host },
      });
    } catch (e) {
      clearTimeout(timer);
      console.error(
        `[call/stream] bridge unreachable via ${host}: ${(e as Error)?.name ?? "error"}`,
      );
      return new NextResponse(null, {
        status: 502,
        headers: { "x-bridge-host": host },
      });
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${url}/stream?agentId=${encodeURIComponent(agent)}`,
      {
        headers: {
          authorization: `Bearer ${process.env.BRIDGE_CALL_TOKEN ?? ""}`,
          accept: "text/event-stream",
        },
        // aborts the upstream connection when the browser closes the EventSource
        signal: req.signal,
      },
    );
  } catch {
    return new NextResponse(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: upstream.status || 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
