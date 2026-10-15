import { type NextRequest, NextResponse } from "next/server";
import { allowedRequest } from "@/lib/workforce/route-guard";
import { embedQuery, matchNodes } from "@/lib/workforce/wiki";

// Semantic search: embed the query with OpenAI (server-side, key never shipped),
// then match_wiki_nodes → the nearest page ids. `degraded: true` when there is no
// OPENAI_API_KEY (the client then falls back to title/tag filtering).

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await allowedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { query } = (await req.json()) as { query?: string };
    const q = (query ?? "").trim();
    if (!q) return NextResponse.json({ ids: [], degraded: false });
    const embedding = await embedQuery(q);
    if (!embedding) return NextResponse.json({ ids: [], degraded: true });
    const ids = await matchNodes(embedding, 10);
    return NextResponse.json({ ids, degraded: false });
  } catch {
    return NextResponse.json({ ids: [], degraded: true });
  }
}
