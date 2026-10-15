import { type NextRequest, NextResponse } from "next/server";
import { allowedRequest } from "@/lib/workforce/route-guard";
import { matchNodes, nodeEmbedding } from "@/lib/workforce/wiki";

// "related to this page": read the node's own embedding (server-side) and match it
// → the nearest other page ids. Empty when the page isn't embedded or no RPC.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await allowedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ ids: [] });
    const emb = await nodeEmbedding(id);
    if (!emb) return NextResponse.json({ ids: [] });
    // +1 then drop self
    const ids = (await matchNodes(emb, 9)).filter((x) => x !== id).slice(0, 8);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}
