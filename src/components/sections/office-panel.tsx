"use client";

import { useEffect, useRef, useState } from "react";

// The live "agent office" from the hero: six named agents work at their desks
// and the drafts they finish land in an approvals inbox. Ported from the design
// handoff. One interval every 700ms/speed: each tick every agent's progress
// rises 6-20%; at 100% it advances to its next task, its counter climbs and, if
// that task needs approval and fewer than 4 items are pending, its approval text
// is unshifted onto the inbox (capped at 5; sent items pruned after 2.5s).
// Respects prefers-reduced-motion (pauses the sim, shows a static frame).

const col = (h: number) => `oklch(0.78 0.12 ${h})`;

type Task = [text: string, gate: 0 | 1, approval?: string];
type AgentDef = { name: string; role: string; h: number; tasks: Task[] };

const AGENTS: AgentDef[] = [
  {
    name: "Sami",
    role: "Chief of staff",
    h: 70,
    tasks: [
      [
        "Compiling yesterday for the morning brief",
        1,
        "Morning brief ready: 3 decisions need you",
      ],
      ["Checking what is due today", 0],
      ["Flagging overdue invoices", 0],
    ],
  },
  {
    name: "Nora",
    role: "Outreach",
    h: 150,
    tasks: [
      ["Researching 12 companies that fit", 0],
      [
        "Drafting day-3 follow-up to Al Noor Properties",
        1,
        "Follow-up to Al Noor Properties",
      ],
      [
        "Reading a reply, proposing call times",
        1,
        "Reply to Hamdan: Tue 10:00 or Wed 14:00?",
      ],
    ],
  },
  {
    name: "Idris",
    role: "Proposals",
    h: 220,
    tasks: [
      ["Turning call notes into a proposal", 0],
      ["Pricing the 30-day pilot", 0],
      [
        "Publishing proposal page",
        1,
        "Proposal for Marina Stays is ready to send",
      ],
    ],
  },
  {
    name: "Maya",
    role: "Customer replies",
    h: 290,
    tasks: [
      ["Answering a guest about late check-in", 0],
      [
        "Replying to a 4-star Google review",
        1,
        "Reply to Google review from Sarah K.",
      ],
      [
        "Escalating a refund request",
        1,
        "Refund request, unit 14: approve AED 350?",
      ],
    ],
  },
  {
    name: "Leo",
    role: "Market watch",
    h: 20,
    tasks: [
      ["Reading niche forums and news", 0],
      ["Tagging a competitor price change", 0],
      ["Summarising 4 items for sales", 0],
    ],
  },
  {
    name: "Zara",
    role: "Marketing",
    h: 110,
    tasks: [
      ["Drafting this week’s posts", 0],
      [
        "Occupancy dipped: preparing a discount",
        1,
        "Midweek 15% discount for October",
      ],
      [
        "Scheduling LinkedIn carousel",
        1,
        "Publish LinkedIn carousel on Thursday",
      ],
    ],
  },
];

type AgentState = { t: number; pct: number; done: number };
type InboxItem = {
  id: number;
  a: number;
  text: string;
  st: "pending" | "sent";
  at?: number;
};

const INITIAL_AGENTS: AgentState[] = AGENTS.map((_, i) => ({
  t: 0,
  pct: 20 + i * 12,
  done: 6 + i * 3,
}));
const INITIAL_INBOX: InboxItem[] = [
  {
    id: 1,
    a: 3,
    text: "Refund request, unit 14: approve AED 350?",
    st: "pending",
  },
  { id: 2, a: 1, text: "Follow-up to Al Noor Properties", st: "pending" },
];

function gstClock(now: Date): string {
  const gst = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  return gst.toTimeString().slice(0, 5);
}

type Sim = { agents: AgentState[]; inbox: InboxItem[] };

export function OfficePanel({ speed = 1 }: { speed?: number }) {
  const [sim, setSim] = useState<Sim>({
    agents: INITIAL_AGENTS,
    inbox: INITIAL_INBOX,
  });
  const [clock, setClock] = useState<string>("--:--");
  const nid = useRef(3);

  useEffect(() => {
    // avoid an SSR/client hydration mismatch on the live clock
    setClock(gstClock(new Date()));

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ms = 700 / (speed || 1);
    const iv = setInterval(() => {
      setClock(gstClock(new Date()));
      setSim((s) => {
        // prune items that were sent more than 2.5s ago
        let inbox = s.inbox.filter(
          (m) => !(m.st === "sent" && Date.now() - (m.at ?? 0) > 2500),
        );
        const agents = s.agents.map((st, i) => {
          const pct = st.pct + 6 + Math.random() * 14;
          if (pct < 100) return { ...st, pct };
          const task = AGENTS[i].tasks[st.t];
          if (task[1] && inbox.filter((m) => m.st === "pending").length < 4) {
            inbox = [
              {
                id: nid.current++,
                a: i,
                text: task[2] as string,
                st: "pending",
              },
              ...inbox,
            ];
          }
          return {
            t: (st.t + 1) % AGENTS[i].tasks.length,
            pct: 0,
            done: st.done + 1,
          };
        });
        return { agents, inbox: inbox.slice(0, 5) };
      });
    }, ms);
    return () => clearInterval(iv);
  }, [speed]);

  const approve = (id: number) =>
    setSim((s) => ({
      ...s,
      inbox: s.inbox.map((m) =>
        m.id === id ? { ...m, st: "sent", at: Date.now() } : m,
      ),
    }));

  const { agents, inbox } = sim;
  const pendingCount = inbox.filter((m) => m.st === "pending").length;

  return (
    <div className="pl-office">
      <div className="pl-office-bar">
        <div className="pl-office-dots">
          <span />
          <span />
          <span />
        </div>
        <span>persept / office · live</span>
        <span>{clock} GST</span>
      </div>
      <div className="pl-office-body">
        <div className="pl-office-left">
          {AGENTS.map((a, i) => {
            const st = agents[i];
            const c = col(a.h);
            const pct = Math.min(100, Math.round(st.pct));
            return (
              <div className="pl-agent" key={a.name}>
                <div className="pl-agent-top">
                  <div className="pl-avatar" style={{ background: c }}>
                    {a.name[0]}
                  </div>
                  <div className="pl-agent-id">
                    <div className="pl-agent-name">{a.name}</div>
                    <div className="pl-agent-role">{a.role}</div>
                  </div>
                  <div className="pl-agent-done">{st.done} today</div>
                </div>
                <div className="pl-agent-task">{a.tasks[st.t][0]}</div>
                <div className="pl-bar">
                  <div
                    className="pl-bar-fill"
                    style={{ width: `${pct}%`, background: c }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="pl-office-right">
          <div className="pl-inbox-head">
            <div className="pl-inbox-title">Waiting for you</div>
            <div className="pl-inbox-count">{pendingCount} pending</div>
          </div>
          {inbox.map((m) => {
            const a = AGENTS[m.a];
            const c = col(a.h);
            return (
              <div
                className="pl-inbox-card"
                key={m.id}
                style={{ opacity: m.st === "sent" ? 0.55 : 1 }}
              >
                <div className="pl-inbox-meta">
                  <span className="dot" style={{ background: c }} />
                  <span>
                    {a.name} · {a.role}
                  </span>
                </div>
                <div className="pl-inbox-text">{m.text}</div>
                {m.st === "pending" && (
                  <div className="pl-inbox-actions">
                    <button
                      type="button"
                      className="pl-approve"
                      onClick={() => approve(m.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="pl-edit"
                      onClick={() => approve(m.id)}
                    >
                      Edit
                    </button>
                  </div>
                )}
                {m.st === "sent" && (
                  <div className="pl-sent">✓ approved · sent</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
