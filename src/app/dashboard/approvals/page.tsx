import { supabaseAdmin } from "@/lib/supabase/server";
import {
  approveFromForm,
  rejectFromForm,
  returnApprovalToScribe,
  sendApprovedEdit,
} from "@/lib/workforce/actions";
import type { Approval } from "@/lib/workforce/types";
import { MobileApprovals } from "../_components/MobileApprovals";
import { ApprovalsView, type DecidedVM } from "./_components/ApprovalsView";
import { approvalToDecidedVM, approvalToVM } from "./_components/build-vm";
import "../approvals.css";
import "../mobile-approvals.css";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const db = supabaseAdmin();
  const [{ data: pend }, { data: dec }] = await Promise.all([
    db
      .from("approvals")
      .select("*")
      .in("status", ["pending", "held"])
      .order("ts", { ascending: false }),
    db
      .from("approvals")
      .select("*")
      .not("status", "in", "(pending,held)")
      .order("decided_at", { ascending: false })
      .limit(30),
  ]);

  const all = (pend as Approval[] | null) ?? [];
  const waiting = all.filter((a) => a.status !== "held").map(approvalToVM);
  const held = all.filter((a) => a.status === "held").map(approvalToVM);

  const decided: DecidedVM[] = ((dec as Approval[] | null) ?? []).map(
    approvalToDecidedVM,
  );

  return (
    <>
      <div className="wf-only-desktop">
        <ApprovalsView
          waiting={waiting}
          held={held}
          decided={decided}
          approveAction={approveFromForm}
          rejectAction={rejectFromForm}
          sendEditAction={sendApprovedEdit}
          returnAction={returnApprovalToScribe}
        />
      </div>
      <MobileApprovals
        waiting={waiting}
        held={held}
        decided={decided}
        approveAction={approveFromForm}
        rejectAction={rejectFromForm}
        sendEditAction={sendApprovedEdit}
      />
    </>
  );
}
