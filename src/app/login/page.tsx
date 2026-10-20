import type { Viewport } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LoginView } from "./LoginView";
import "./login.css";

// Dark sign-in surface — override the light root default for mobile chrome.
export const viewport: Viewport = {
  themeColor: "#0c0c0c",
  colorScheme: "dark",
};

// Public sign-in — OUTSIDE /dashboard. Dark v12 look (see LOGIN.md): a live clock,
// the "wake the team" avatar button, and email + password via the existing
// signInWithPassword action. This server shell reads the live working count and
// the ?error / ?next / ?sent flags, then hands off to the interactive client view.
export const dynamic = "force-dynamic";

async function workingCount(): Promise<number> {
  try {
    const { count } = await supabaseAdmin()
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("status", "working");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; sent?: string }>;
}) {
  const { error, next, sent } = await searchParams;
  const working = await workingCount();
  return (
    <LoginView
      working={working}
      error={error ?? null}
      next={next ?? "/dashboard"}
      sentTo={sent ?? null}
    />
  );
}
