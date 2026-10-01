import {
  type ConvoThread,
  HunterConversationsView,
} from "@/app/dashboard/_components/HunterConversationsView";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import {
  getHandoffs,
  getMessages,
  groupThreads,
} from "@/lib/workforce/outreach";
import { when } from "@/lib/workforce/types";
import { getHunterHeaderStats } from "../_data";
import "../../../hunter.css";

export const dynamic = "force-dynamic";

const _HN = "oklch(0.78 0.12 150)";
const AMBER = "var(--accent)";
const KIND: Record<string, string> = {
  first_touch: "first touch",
  follow_up: "follow-up",
  reply: "reply",
  inbound: "inbound",
};
function stColors(status: string): [string, string] {
  if (status === "replied") return ["oklch(0.8 0.14 70 / 0.16)", AMBER];
  if (status === "handed off")
    return ["oklch(0.8 0.16 150 / 0.14)", "var(--ok)"];
  return ["rgba(255,255,255,0.07)", "var(--ink-soft)"];
}

export default async function ConversationsPage() {
  const [{ stats, pending }, messages, handoffsOpen] = await Promise.all([
    getHunterHeaderStats(),
    getMessages("hunter"),
    getHandoffs("hunter", ["open"]),
  ]);
  const handedOff = new Set(
    handoffsOpen.map((h) => (h.company ?? "").toLowerCase()).filter(Boolean),
  );
  const threads = groupThreads(messages);

  const vms: ConvoThread[] = threads.map((t) => {
    const hasIn = t.messages.some((m) => m.direction === "in");
    const status = handedOff.has(t.company.toLowerCase())
      ? "handed off"
      : hasIn
        ? "replied"
        : "awaiting reply";
    const [sbg, sfg] = stColors(status);
    const last = t.messages[t.messages.length - 1];
    const first = t.messages[0];
    return {
      key: t.key,
      company: t.company,
      email: t.contact ?? "—",
      campaign: "",
      status,
      statusBg: sbg,
      statusFg: sfg,
      last: (last.body ?? "").split("\n")[0],
      channel: first.channel ?? "email",
      threadId: first.thread_id ?? t.key,
      subject: last.subject ?? "",
      msgs: t.messages.map((m) => ({
        id: m.id,
        out: m.direction === "out",
        channel: m.channel ?? "email",
        kind: KIND[m.kind] ?? m.kind,
        t: when(m.ts),
        subject: m.subject ?? "",
        body: m.body ?? "",
        status: m.status ?? "",
        contact: m.contact ?? "",
        foot:
          m.direction === "out"
            ? m.status === "approved_manual"
              ? "waiting for you to send"
              : "sent"
            : "received",
      })),
    };
  });

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      {vms.length === 0 ? (
        <div className="wf-hn-panel">
          <div className="wf-hn-empty">
            no conversations yet. approve a first touch and it appears here.
          </div>
        </div>
      ) : (
        <HunterConversationsView threads={vms} />
      )}
    </div>
  );
}
