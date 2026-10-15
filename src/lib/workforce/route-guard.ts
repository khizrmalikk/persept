import { currentUser } from "@/lib/supabase/server";

// Route-handler equivalent of the server-action `guard()`: the /api/os graph
// routes return vault metadata (titles, summaries), so they re-check the signed-in
// user against the allowlist. Mirrors the dev-only DASHBOARD_AUTH_BYPASS escape so
// local dev works; inert on Vercel (NODE_ENV=production).
export async function allowedRequest(): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1"
  )
    return true;
  try {
    const { allowed } = await currentUser();
    return !!allowed;
  } catch {
    return false;
  }
}
