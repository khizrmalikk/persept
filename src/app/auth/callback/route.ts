import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase/server";

// Magic-link landing: exchanges the one-time code for a session cookie, then goes to the dashboard.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (code) {
    const supabase = await supabaseAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
