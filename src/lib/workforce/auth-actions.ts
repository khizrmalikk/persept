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

// "forgot password" → send a reset link. We ALWAYS redirect to the sent state,
// whether or not the address is on the list, so the page never reveals who has an
// account; the email only actually goes out for an allowlisted address. The link
// lands on /login/reset (a recovery session) where the owner sets a new password.
export async function requestPasswordReset(fd: FormData) {
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email && allowedEmails().includes(email)) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
    const supabase = await supabaseAuth();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/login/reset`,
    });
  }
  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await supabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
