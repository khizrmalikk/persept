"use server";

import { redirect } from "next/navigation";
import { allowedEmails, supabaseAuth } from "@/lib/supabase/server";

// Email + password sign-in. `supabaseAuth()` sets the Supabase session cookie, so
// the /dashboard proxy gate, currentUser() and the email allowlist all keep
// working exactly as before — only the sign-in method changed (was a magic link).
export async function signInWithPassword(fd: FormData) {
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(fd.get("password") ?? "");
  const nextRaw = String(fd.get("next") ?? "/dashboard");
  // only allow internal paths (no open redirect)
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  if (!email || !password) redirect("/login?error=missing");
  // Allowlist first, so an off-list address can never sign in even with a password.
  if (!allowedEmails().includes(email)) redirect("/login?error=denied");

  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=invalid");
  redirect(next);
}

export async function signOut() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
