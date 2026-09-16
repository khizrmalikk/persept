import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { signOut } from "@/lib/workforce/auth-actions";
import { ago } from "@/lib/workforce/types";
import { AutoRefresh } from "./_components/AutoRefresh";
import { NavLinks } from "./_components/NavLinks";
import "./workforce.css";

export const metadata: Metadata = { title: "Persept · workforce", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, email, allowed } = await currentUser();
  // proxy.ts already redirects signed-out visitors; this covers a signed-in but not-allowed address.
  if (user && !allowed) {
    return (
      <main className="wf shell py-24">
        <p className="kicker">persept / workforce</p>
        <h1>not on the list</h1>
        <p style={{ color: "var(--ink-soft)" }}>{email} is signed in but not allowed here.</p>
        <form action={signOut} className="mt-4"><button className="act secondary" type="submit">sign out</button></form>
      </main>
    );
  }
  if (!user) redirect("/login");

  let pending = 0; let seen: string | null = null;
  try {
    const db = supabaseAdmin();
    const [{ count }, { data: inst }] = await Promise.all([
      db.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("instance").select("last_seen_at").limit(1).maybeSingle(),
    ]);
    pending = count ?? 0; seen = inst?.last_seen_at ?? null;
  } catch { /* still render */ }
  const stale = !seen || Date.now() - new Date(seen).getTime() > 30_000;

  return (
    <main className="wf shell" style={{ paddingTop: 24, paddingBottom: 80, minHeight: "100vh" }}>
      <nav className="wf-nav">
        <Link href="/" className="brand">persept<small>workforce</small></Link>
        <NavLinks pending={pending} />
        <div className="right">
          <span className={`live ${stale ? "stale" : ""}`}>bridge {seen ? `seen ${ago(seen)}` : "not seen"}</span>
          <form action={signOut}><button type="submit">sign out</button></form>
        </div>
      </nav>
      {children}
      <AutoRefresh seconds={6} />
    </main>
  );
}
