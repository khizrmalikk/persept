import { type NextRequest, NextResponse } from "next/server";
import { uiManifest } from "@/app/dashboard/_data/ui-registry";
import { currentUser } from "@/lib/supabase/server";

// GET /api/workforce/ui-manifest — the list of windows/tabs/targets Percy may
// drive, from the static registry (not a DOM scan). The bridge fetches this
// hourly with the call token as bearer; a signed-in owner is also allowed. The
// body is only control ids — nothing sensitive.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  const bridgeOk =
    !!process.env.BRIDGE_CALL_TOKEN && token === process.env.BRIDGE_CALL_TOKEN;
  if (!bridgeOk) {
    const { allowed } = await currentUser();
    if (!allowed) {
      return NextResponse.json({ error: "not allowed" }, { status: 401 });
    }
  }
  return NextResponse.json(uiManifest(), {
    headers: { "cache-control": "no-store" },
  });
}
