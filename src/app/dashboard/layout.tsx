import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { signOut } from "@/lib/workforce/auth-actions";
import { ROSTER, type SidebarAgent } from "@/lib/workforce/roster";
import { getActiveSubagents } from "@/lib/workforce/subagents";
import { AutoRefresh } from "./_components/AutoRefresh";
import { MobileTabBar } from "./_components/MobileTabBar";
import { MobileTopBar } from "./_components/MobileTopBar";
import { Sidebar } from "./_components/Sidebar";
import "./workforce.css";
import "./mobile.css";

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
  const devAuthBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1";
  if (!devAuthBypass && user && !allowed) {
    return (
      <main className="wf shell wf-dark py-24">
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

  // Data for the sidebar: live agents, pending approvals (per agent + total),
  // and running sub-agents per agent → each roster agent's status.
  let pending = 0;
  const sidebarAgents: SidebarAgent[] = [];
  try {
    const db = supabaseAdmin();
    const [{ data: agentRows }, { data: pendingRows }, workerRows] =
      await Promise.all([
        db.from("agents").select("id, status"),
        db.from("approvals").select("agent_id").eq("status", "pending"),
        getActiveSubagents(),
      ]);

    const statusById = new Map<string, string>();
    for (const a of (agentRows as
      | { id: string; status: string | null }[]
      | null) ?? [])
      statusById.set(a.id, a.status ?? "idle");

    const pendingByAgent = new Map<string, number>();
    for (const p of (pendingRows as { agent_id: string | null }[] | null) ??
      []) {
      pending += 1;
      if (p.agent_id)
        pendingByAgent.set(
          p.agent_id,
          (pendingByAgent.get(p.agent_id) ?? 0) + 1,
        );
    }

    const workersByAgent = new Map<string, number>();
    for (const w of workerRows)
      if (w.status === "running" && w.agent_id)
        workersByAgent.set(
          w.agent_id,
          (workersByAgent.get(w.agent_id) ?? 0) + 1,
        );

    for (const r of ROSTER) {
      const deployed = statusById.has(r.id);
      const workers = workersByAgent.get(r.id) ?? 0;
      const waiting = (pendingByAgent.get(r.id) ?? 0) > 0;
      const live = statusById.get(r.id);
      const status = !deployed
        ? "soon"
        : waiting
          ? "waiting"
          : live === "working" || workers > 0
            ? "working"
            : "idle";
      sidebarAgents.push({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        role: r.role,
        href: `/dashboard/agents/${r.id}`,
        status,
        workers,
      });
    }
  } catch {
    for (const r of ROSTER)
      sidebarAgents.push({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        role: r.role,
        href: `/dashboard/agents/${r.id}`,
        status: r.id === "fixer" ? "soon" : "idle",
        workers: 0,
      });
  }

  return (
    <div className="wf wf-dark wf-app">
      <Sidebar
        agents={sidebarAgents}
        pending={pending}
        operator={email ?? "operator"}
        signOut={signOut}
      />
      <MobileTopBar />
      <div className="wf-content">{children}</div>
      <MobileTabBar pending={pending} chatHref="/dashboard/agents/hunter" />
      <AutoRefresh seconds={6} />
    </div>
  );
}
