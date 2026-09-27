import {
  type HunterApproval,
  HunterApprovalsView,
} from "@/app/dashboard/_components/HunterApprovalsView";
import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { supabaseAdmin } from "@/lib/supabase/server";
import { parseOutbound } from "@/lib/workforce/outreach";
import { type Approval, ago } from "@/lib/workforce/types";
import { getHunterHeaderStats } from "../_data";
import "../../../hunter.css";

export const dynamic = "force-dynamic";

function severity(risk: string | null | undefined): "low" | "medium" | "high" {
  const w =
    (risk ?? "")
      .trim()
      .match(/^([A-Za-z]+)/)?.[1]
      ?.toLowerCase() ?? "";
  if (w === "high" || w === "critical") return "high";
  if (w === "medium" || w === "moderate") return "medium";
  return "low";
}
function reasonOf(risk: string | null | undefined, why: string | null): string {
  const m = (risk ?? "").match(/[—–-]\s*([\s\S]+)$/);
  return (m?.[1] ?? why ?? "").trim() || "drafted for you";
}

export default async function HunterApprovalsPage() {
  const [{ stats, pending }, { data }] = await Promise.all([
    getHunterHeaderStats(),
    supabaseAdmin()
      .from("approvals")
      .select("*")
      .eq("agent_id", "hunter")
      .in("status", ["pending", "held"])
      .order("ts"),
  ]);
  const approvals = (data as Approval[] | null) ?? [];

  const vms: HunterApproval[] = approvals.map((ap) => {
    const ob = parseOutbound(ap.draft);
    const channel = ob?.channel ?? "note";
    return {
      id: ap.id,
      to: ob?.to ?? ap.action ?? "outbound message",
      channel,
      subject: ob?.subject ?? "",
      risk: severity(ap.risk),
      reason: reasonOf(ap.risk, ap.why),
      when: ago(ap.ts),
      body: (ob?.body ?? ap.draft ?? "").trim(),
      held: ap.status === "held",
      publish: channel.toLowerCase().includes("linkedin"),
    };
  });

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <HunterApprovalsView approvals={vms} />
    </div>
  );
}
