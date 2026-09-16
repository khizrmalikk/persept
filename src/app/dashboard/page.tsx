import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { type Agent, type Approval, type WfEvent, ago } from "@/lib/workforce/types";
import { AgentCard } from "./_components/AgentCard";

export default async function Office() {
  const db = supabaseAdmin();
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const [{ data: agents }, { data: pending }, { data: recent }, { data: todays }] = await Promise.all([
    db.from("agents").select("*").order("id"),
    db.from("approvals").select("id, agent_id").eq("status", "pending"),
    db.from("events").select("*").order("ts", { ascending: false }).limit(8),
    db.from("events").select("agent_id").gte("ts", since.toISOString()).in("kind", ["run", "cron", "message"]),
  ]);
  const pendingBy = new Map<string, number>();
  for (const p of (pending as Pick<Approval, "id" | "agent_id">[] | null) ?? []) pendingBy.set(p.agent_id ?? "", (pendingBy.get(p.agent_id ?? "") ?? 0) + 1);
  const todayBy = new Map<string, number>();
  for (const e of (todays as { agent_id: string | null }[] | null) ?? []) todayBy.set(e.agent_id ?? "", (todayBy.get(e.agent_id ?? "") ?? 0) + 1);

  const all = (agents as Agent[] | null) ?? [];
  const working = all.filter((a) => a.status === "working").length;
  const waiting = ((pending as unknown[] | null) ?? []).length;
  const doneToday = ((todays as unknown[] | null) ?? []).length;

  return (
    <>
      <p className="kicker">001 / office</p>
      <h1>the team<span className="cursor" /></h1>
      <p className="lede">your workforce at a glance. open an agent to talk to it or review what it is waiting on.</p>
      {all.length > 0 && (
        <div className="stats">
          <div className="stat"><div className="label">agents</div><div className="value">{all.length}</div></div>
          <div className="stat"><div className="label">working now</div><div className="value">{working}</div></div>
          <div className="stat"><div className="label">waiting on you</div><div className={`value ${waiting > 0 ? "accent" : ""}`}>{waiting}</div></div>
          <div className="stat"><div className="label">done today</div><div className="value">{doneToday}<small>events</small></div></div>
        </div>
      )}
      {!all.length ? <div className="empty">no agents yet. once the bridge is connected they appear here.</div> : (
        <div className="grid">
          {all.map((a) => <AgentCard key={a.id} a={a} pending={pendingBy.get(a.id) ?? 0} today={todayBy.get(a.id) ?? 0} />)}
        </div>
      )}
      <div style={{ height: 38 }} />
      <p className="kicker">002 / latest</p>
      {!((recent as WfEvent[] | null) ?? []).length ? <div className="empty">no activity yet. the feed fills up as agents run.</div> : (
        <ul className="feed">
          {((recent as WfEvent[] | null) ?? []).map((e) => (
            <li key={e.id}><span className="t">{ago(e.ts)}</span><span className="who">{e.agent_id ?? "system"}</span><span><span className="kind">{e.kind}</span>{e.summary}</span></li>
          ))}
        </ul>
      )}
      <Link className="link-more" href="/dashboard/activity">full activity →</Link>
    </>
  );
}
