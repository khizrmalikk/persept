"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { allowedEmails, supabaseAuth } from "@/lib/supabase/server";

export async function sendMagicLink(fd: FormData) {
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(fd.get("next") ?? "/dashboard");
  if (!email) redirect("/login?error=email");
  // Allowlist first, so unknown addresses never even get an email.
  if (!allowedEmails().includes(email)) redirect("/login?error=denied");
  const h = await headers();
  // Derive the origin from the ACTUAL request host so a magic link opened from
  // localhost returns to localhost and one from prod returns to prod — regardless
  // of NEXT_PUBLIC_SITE_URL (which is pinned to the prod URL for deploys). Fall
  // back to the env var only when there is no host header.
  const host = h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https");
  const origin = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) redirect("/login?error=send");
  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
