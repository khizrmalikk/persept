import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Error ingest endpoint (day-31 contract). GYST, this app's own instrumentation
// (`onRequestError`) + a throttled client `window.onerror` reporter, and the
// bridge's `/hook/error` all POST one error_events row here. Auth is a bearer
// token (ERROR_INGEST_TOKEN); the rolled-up `errors` view the Dev window reads is
// maintained by the bridge, not here.

export const dynamic = "force-dynamic";

const PROJECTS = new Set(["gyst", "persept", "workforce"]);
const SEVERITIES = new Set(["fatal", "error", "warning", "info"]);

export async function POST(req: NextRequest) {
  const token = process.env.ERROR_INGEST_TOKEN;
  if (!token)
    return NextResponse.json(
      { error: "ingest not configured" },
      { status: 503 },
    );

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.replace(/^Bearer\s+/i, "");
  if (bearer !== token)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const project = String(body.project ?? "").toLowerCase();
  const message = String(body.message ?? "").trim();
  if (!PROJECTS.has(project))
    return NextResponse.json({ error: "bad project" }, { status: 400 });
  if (!message)
    return NextResponse.json({ error: "message required" }, { status: 400 });

  const sevRaw = String(body.severity ?? "error").toLowerCase();
  const severity = SEVERITIES.has(sevRaw) ? sevRaw : "error";
  const str = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s ? s.slice(0, 8000) : null;
  };

  // `signature` is optional (the bridge derives one by stripping ids/numbers when
  // absent); `rolled` is bridge-owned — never set it here.
  const row = {
    project,
    message: message.slice(0, 8000),
    signature: str(body.signature),
    severity,
    stack: str(body.stack),
    url: str(body.url),
    user: str(body.user),
    meta: body.meta && typeof body.meta === "object" ? body.meta : null,
  };

  const { error } = await supabaseAdmin().from("error_events").insert(row);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 202 });
}
