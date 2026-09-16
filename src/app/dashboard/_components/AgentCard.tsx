import Link from "next/link";
import { type Agent, ago, STATUS_LABEL } from "@/lib/workforce/types";

export function AgentCard({ a, pending, today }: { a: Agent; pending: number; today: number }) {
  const status = pending > 0 ? "waiting" : (a.status ?? "idle");
  const idle = status === "idle";
  return (
    <Link href={`/dashboard/agents/${a.id}`} className={`card ${pending > 0 ? "waiting" : ""}`}>
      <div className="head">
        <span className="emoji">{a.emoji ?? "•"}</span>
        <div>
          <div className="name">{a.name ?? a.id}</div>
          <div className="role">{a.role ?? a.id}</div>
        </div>
      </div>
      <div className="statusline">
        <span className={`pill ${status}`}><span className={`dot ${status}`} />{STATUS_LABEL[status] ?? status}</span>
        {pending > 0 && <span style={{ color: "var(--accent-ink)" }}>{pending} to approve</span>}
      </div>
      <div className={`task ${idle ? "muted" : ""}`}>{a.current_task ?? (idle ? "nothing in progress" : "")}</div>
      <div className="meta"><span>active {ago(a.last_active_at)}</span><span>today {today}</span><span>{(a.model ?? "").replace("anthropic/", "")}</span></div>
    </Link>
  );
}
