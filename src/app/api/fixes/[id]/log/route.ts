import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// The Dev terminal tails a running fix's output. It polls this every 3s while the
// fix is `running`; returns the last log chunk + status (so the UI stops polling
// when it ends). fixes.log_tail is Claude Code's real output, not a shell. Service
// key, server-side — no table exposed to the client.

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  try {
    const { data } = await supabaseAdmin()
      .from("fixes")
      .select("log_tail, status")
      .eq("id", id)
      .maybeSingle();
    const row = data as { log_tail?: string | null; status?: string } | null;
    return NextResponse.json(
      { log_tail: row?.log_tail ?? "", status: row?.status ?? "unknown" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ log_tail: "", status: "unknown" });
  }
}
