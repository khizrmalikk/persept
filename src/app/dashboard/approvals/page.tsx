import { supabaseAdmin } from "@/lib/supabase/server";
import {
  approveFromForm,
  bulkApprovals,
  rejectFromForm,
  returnApproval,
  sendApprovedEdit,
} from "@/lib/workforce/actions";
import { getApprovalChains } from "@/lib/workforce/drafts";
import { getFixByPr, signedScreenshots } from "@/lib/workforce/fixes";
import type { Approval } from "@/lib/workforce/types";
import { MobileApprovals } from "../_components/MobileApprovals";
import {
  ApprovalsView,
  type CopyMetaVM,
  type DecidedVM,
  type MergeVM,
  type VersionVM,
} from "./_components/ApprovalsView";
import {
  approvalToDecidedVM,
  approvalToVM,
  parseMerge,
  toVersionVMs,
} from "./_components/build-vm";
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
  const decidedRows = (dec as Approval[] | null) ?? [];
  const waiting = all.filter((a) => a.status !== "held").map(approvalToVM);
  const held = all.filter((a) => a.status === "held").map(approvalToVM);

  // Draft-version chains for everything shown (pending + held + decided).
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

  // Merge approvals ("merge PR #n in <project>"): pull the matching fix row for
  // its checks, screenshots and PR link so the inbox renders a merge card.
  const mergeInfo: Record<number, MergeVM> = {};
  await Promise.all(
    all.map(async (a) => {
      const m = parseMerge(a.action);
      if (!m.isMerge || m.prNumber == null) return;
      const fix = await getFixByPr(m.project, m.prNumber);
      const shots = fix
        ? await signedScreenshots(fix.short_id, fix.screenshots)
        : [];
      mergeInfo[a.id] = {
        prUrl: fix?.pr_url ?? "",
        prNumber: m.prNumber,
        project: m.project,
        checks: fix?.checks ?? [],
        shots,
      };
    }),
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
          returnAction={returnApproval}
          bulkAction={bulkApprovals}
          history={history}
          copyMeta={copyMeta}
          mergeInfo={mergeInfo}
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
