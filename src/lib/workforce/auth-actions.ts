"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { allowedEmails, supabaseAuth } from "@/lib/supabase/server";

export async function sendMagicLink(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const next = String(fd.get("next") ?? "/dashboard");
  if (!email) redirect("/login?error=email");
  // Allowlist first, so unknown addresses never even get an email.
  if (!allowedEmails().includes(email)) redirect("/login?error=denied");
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect("/login?error=send");
  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
