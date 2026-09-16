import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Workforce Supabase project (not GYST's). Two clients:
//  - supabaseAuth(): anon key + the visitor's cookies. Used only to know who is signed in.
//  - supabaseAdmin(): service key, server-only. Used to read/write the workforce tables.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_KEY ?? "";

export async function supabaseAuth() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => {
        try {
          for (const { name, value, options } of all) store.set(name, value, options);
        } catch {
          // called from a Server Component: cookies are read-only there; proxy.ts refreshes them
        }
      },
    },
  });
}

export function supabaseAdmin() {
  if (!URL || !SERVICE) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

export function allowedEmails(): string[] {
  return (process.env.DASHBOARD_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function currentUser() {
  const { data } = await (await supabaseAuth()).auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? null;
  const allowed = !!email && allowedEmails().includes(email);
  return { user: data.user ?? null, email, allowed };
}
