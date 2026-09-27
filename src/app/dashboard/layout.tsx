import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { signOut } from "@/lib/workforce/auth-actions";
import { getOpenHandoffCount } from "@/lib/workforce/outreach";
import { AutoRefresh } from "./_components/AutoRefresh";
import { HudClock } from "./_components/HudClock";
import { NavLinks } from "./_components/NavLinks";
import "./workforce.css";

export const metadata: Metadata = {
  title: "Persept · workforce",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, email, allowed } = await currentUser();
  // Dev-only auth bypass (see proxy.ts): inert unless non-production AND
  // DASHBOARD_AUTH_BYPASS=1. Safe to keep in the repo — never active on Vercel.
  const devAuthBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1";
  // proxy.ts already redirects signed-out visitors; this covers a signed-in but not-allowed address.
  if (!devAuthBypass && user && !allowed) {
    return (
      <main className="wf shell py-24">
        <p className="kicker">persept / workforce</p>
        <h1>not on the list</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          {email} is signed in but not allowed here.
        </p>
        <form action={signOut} className="mt-4">
          <button className="act secondary" type="submit">
            sign out
          </button>
        </form>
      </main>
    );
  }
  if (!devAuthBypass && !user) redirect("/login");

  let pending = 0;
  let seen: string | null = null;
  let agents: { id: string; name: string; emoji: string | null }[] = [];
  const badges: Record<string, number> = {};
  try {
    const db = supabaseAdmin();
    const [{ count }, { data: inst }, { data: agentRows }, handoffs] =
      await Promise.all([
        db
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        db.from("instance").select("last_seen_at").limit(1).maybeSingle(),
        db.from("agents").select("id, name, emoji").order("id"),
        getOpenHandoffCount("hunter"),
      ]);
    pending = count ?? 0;
    seen = inst?.last_seen_at ?? null;
    agents = (
      (agentRows as
        | { id: string; name: string | null; emoji: string | null }[]
        | null) ?? []
    ).map((a) => ({ id: a.id, name: a.name ?? a.id, emoji: a.emoji }));
    if (handoffs > 0) badges.hunter = handoffs;
  } catch {
    /* still render */
  }
  const stale = !seen || Date.now() - new Date(seen).getTime() > 30_000;

  return (
    <main
      className="wf shell wf-dark"
      style={{ paddingTop: 72, paddingBottom: 24, minHeight: "100vh" }}
    >
      <header className="wf-topbar">
        <div className="tb-left">
          <Link href="/" className="tb-brand">
            Persept <span className="sep">/</span> workforce
          </Link>
          <nav className="tb-tabs" aria-label="dashboard sections">
            <NavLinks pending={pending} agents={agents} badges={badges} />
          </nav>
        </div>

        <output className="tb-center">
          <span className={`tb-sys ${stale ? "degraded" : "optimal"}`}>
            <span className="tb-sys-dot" aria-hidden="true" />
            system <b>{stale ? "degraded" : "healthy"}</b>
          </span>
          <span className="tb-div" aria-hidden="true" />
          <span className="tb-time">
            <HudClock />
          </span>
        </output>

        <div className="tb-right">
          <span className="tb-user" title={email ?? undefined}>
            {email ?? "operator"}
          </span>
          <form action={signOut}>
            <button type="submit" className="tb-signout">
              sign out
            </button>
          </form>
        </div>
      </header>
      {children}
      <AutoRefresh seconds={6} />
    </main>
  );
}
