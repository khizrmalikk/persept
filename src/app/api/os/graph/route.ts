import { NextResponse } from "next/server";
import { allowedRequest } from "@/lib/workforce/route-guard";
import { loadGraph } from "@/lib/workforce/wiki";

// The knowledge graph: nodes + edges + meta, with `embedding` stripped (loadGraph
// never selects it). Service-key server-side; allow-listed. The graph tab fetches
// this once on mount and polls wiki_meta via the tick for freshness.

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await allowedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const graph = await loadGraph();
    return NextResponse.json(graph, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ nodes: [], edges: [], meta: null });
  }
}
