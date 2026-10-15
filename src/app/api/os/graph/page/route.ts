import { type NextRequest, NextResponse } from "next/server";
import { allowedRequest } from "@/lib/workforce/route-guard";
import { pageContent } from "@/lib/workforce/wiki";

// "open page": the page's title + summary (+ vault file text when a wiki_text table
// exposes it, else summary only). Server-side read; allow-listed.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await allowedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ title: "", summary: "", body: "" });
    const page = await pageContent(id);
    return NextResponse.json(page ?? { title: "", summary: "", body: "" });
  } catch {
    return NextResponse.json({ title: "", summary: "", body: "" });
  }
}
