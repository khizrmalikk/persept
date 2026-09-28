import Link from "next/link";
import { agentColor } from "@/lib/workforce/roster";

// Mobile office screen (< 768px): greeting + 3 stat tiles + one card per agent.
// Server component (the 6s refresh re-renders); taps are plain <Link>s. The card
// and its "needs you" row are sibling links (not nested) to stay valid HTML.

export type MobileAgent = {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  status: "working" | "waiting" | "idle" | "soon";
  task: string;
  workers: number;
  pending: number;
};

function chipColors(a: MobileAgent): { bg: string; fg: string } {
  switch (a.status) {
    case "working":
      return { bg: agentColor(a.hue, 0.16), fg: agentColor(a.hue) };
    case "waiting":
      return { bg: "var(--accent-wash)", fg: "var(--accent)" };
    case "soon":
      return { bg: "rgba(255,255,255,0.05)", fg: "var(--ink-ghost)" };
    default:
      return { bg: "rgba(255,255,255,0.07)", fg: "var(--ink-mut)" };
  }
}

function Card({ a }: { a: MobileAgent }) {
  const c = agentColor(a.hue);
  const working = a.status === "working";
  const chip = chipColors(a);
  return (
    <div
      className="wf-mo-card"
      style={{
        borderColor: working
          ? agentColor(a.hue, 0.3)
          : "rgba(255,255,255,0.06)",
        opacity: a.status === "soon" ? 0.6 : 1,
      }}
    >
      <span
        className="wf-mo-card-glow"
        aria-hidden="true"
        style={{
          background: `radial-gradient(80% 120% at 0% 0%, ${working ? agentColor(a.hue, 0.14) : "transparent"}, transparent 60%)`,
        }}
      />
      <Link href={`/dashboard/agents/${a.id}`} className="wf-mo-card-main">
        <span className="wf-mo-card-top">
          <span
            className="wf-mo-tile"
            style={{
              background: agentColor(a.hue, 0.16),
              boxShadow: working
                ? `0 0 0 2px ${c}, 0 0 18px ${agentColor(a.hue, 0.4)}`
                : "none",
            }}
          >
            {a.emoji}
          </span>
          <span className="wf-mo-card-id">
            <span className="wf-mo-card-name-row">
              <span className="wf-mo-card-name">{a.name}</span>
              <span
                className="wf-mo-chip"
                style={{ background: chip.bg, color: chip.fg }}
              >
                {a.status}
              </span>
            </span>
            <span className="wf-mo-card-task">{a.task}</span>
          </span>
          <span className="wf-mo-card-chev" aria-hidden="true">
            ›
          </span>
        </span>
        {working && (
          <span className="wf-mo-card-prog">
            <span className="wf-mo-bar">
              <span style={{ width: "45%", background: c }} />
            </span>
            <span className="wf-mo-workers">
              {a.workers
                ? `${a.workers} worker${a.workers > 1 ? "s" : ""}`
                : "solo"}
            </span>
          </span>
        )}
      </Link>
      {a.pending > 0 && (
        <Link href="/dashboard/approvals" className="wf-mo-needs">
          <span>needs you · {a.pending}</span>
          <span>review ›</span>
        </Link>
      )}
    </div>
  );
}

export function MobileOffice({
  agents,
  greeting,
  dateLine,
  summary,
  onlineCount,
  workingCount,
  pendingCount,
}: {
  agents: MobileAgent[];
  greeting: string;
  dateLine: string;
  summary: string;
  onlineCount: number;
  workingCount: number;
  pendingCount: number;
}) {
  return (
    <div className="wf-mo wf-only-mobile">
      <div className="wf-mo-head">
        <div className="wf-mo-eyebrow">office · {dateLine}</div>
        <h1 className="wf-mo-greet">{greeting}, khizr</h1>
        <p className="wf-mo-sum">{summary}</p>
      </div>
      <div className="wf-mo-stats">
        <div className="wf-mo-stat">
          <div className="wf-mo-stat-n">{onlineCount}/6</div>
          <div className="wf-mo-stat-l">online</div>
        </div>
        <div className="wf-mo-stat">
          <div className="wf-mo-stat-n">{workingCount}</div>
          <div className="wf-mo-stat-l">working</div>
        </div>
        <Link href="/dashboard/approvals" className="wf-mo-stat is-need">
          <div className="wf-mo-stat-n">{pendingCount}</div>
          <div className="wf-mo-stat-l">need you</div>
        </Link>
      </div>
      <div className="wf-mo-label">agents</div>
      <div className="wf-mo-agents">
        {agents.map((a) => (
          <Card key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}
