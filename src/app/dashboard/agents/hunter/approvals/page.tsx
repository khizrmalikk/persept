import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  approveFromForm,
  rejectFromForm,
  returnApprovalToScribe,
  sendApprovedEdit,
} from "@/lib/workforce/actions";
import { getApprovalChains } from "@/lib/workforce/drafts";
import type { Approval } from "@/lib/workforce/types";
import {
  ApprovalsView,
  type CopyMetaVM,
  type DecidedVM,
  type VersionVM,
} from "../../../approvals/_components/ApprovalsView";
import {
  approvalToDecidedVM,
  approvalToVM,
  toVersionVMs,
} from "../../../approvals/_components/build-vm";
import { getHunterHeaderStats } from "../_data";
import "../../../hunter.css";
import "../../../approvals.css";

export const dynamic = "force-dynamic";

// Hunter's approvals tab now renders the SAME master-detail view as the main
// approvals page (compact list on the left, full detail + note + actions on the
// right), scoped to Hunter — instead of the old full-card stack. Reuses the shared
// view-model builders and all four guarded actions (incl. "send to scribe").
export default async function HunterApprovalsPage() {
  const db = supabaseAdmin();
  const [{ stats, pending }, { data: pend }, { data: dec }] = await Promise.all(
    [
      getHunterHeaderStats(),
      db
        .from("approvals")
        .select("*")
        .eq("agent_id", "hunter")
        .in("status", ["pending", "held"])
        .order("ts", { ascending: false }),
      db
        .from("approvals")
        .select("*")
        .eq("agent_id", "hunter")
        .not("status", "in", "(pending,held)")
        .order("decided_at", { ascending: false })
        .limit(30),
    ],
  );

  const all = (pend as Approval[] | null) ?? [];
  const decidedRows = (dec as Approval[] | null) ?? [];
  const waiting = all.filter((a) => a.status !== "held").map(approvalToVM);
  const held = all.filter((a) => a.status === "held").map(approvalToVM);

  const { versionsByApproval, metaByApproval } = await getApprovalChains([
    ...all.map((a) => a.id),
    ...decidedRows.map((a) => a.id),
  ]);
  const history: Record<number, VersionVM[]> = {};
  const copyMeta: Record<number, CopyMetaVM> = {};
  for (const a of all) {
    const v = versionsByApproval[a.id];
    if (v?.length) history[a.id] = toVersionVMs(v);
    const m = metaByApproval[a.id];
    if (m)
      copyMeta[a.id] = { company: m.company, kind: m.kind, channel: m.channel };
  }

  const decided: DecidedVM[] = decidedRows.map((d) =>
    approvalToDecidedVM(d, versionsByApproval[d.id]?.length ?? 0),
  );

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <ApprovalsView
        embedded
        waiting={waiting}
        held={held}
        decided={decided}
        approveAction={approveFromForm}
        rejectAction={rejectFromForm}
        sendEditAction={sendApprovedEdit}
        returnAction={returnApprovalToScribe}
        history={history}
        copyMeta={copyMeta}
      />
    </div>
  );
}
