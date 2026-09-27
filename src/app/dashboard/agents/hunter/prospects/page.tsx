import { HunterTabs } from "@/app/dashboard/_components/HunterTabs";
import { dueState } from "@/app/dashboard/_components/panels/dates";
import { PipelineSummary } from "@/app/dashboard/_components/panels/PipelineSummary";
import {
  PipelineTable,
  type ProspectRow,
} from "@/app/dashboard/_components/panels/PipelineTable";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import { getOpenHandoffCount } from "@/lib/workforce/outreach";

export const dynamic = "force-dynamic";

// Hunter's full prospect list — the whole pipeline funnel + the sortable,
// filterable table. The chat page only shows a compact top-3 and links here.
export default async function ProspectsPage() {
  const [prospectsFile, handoffCount] = await Promise.all([
    getAgentFile("hunter", "PROSPECTS.md"),
    getOpenHandoffCount("hunter"),
  ]);
  const table = parseMarkdownTable(prospectsFile?.content);
  const rows = table.rows as ProspectRow[];
  const dueOf: Record<string, ReturnType<typeof dueState>> = {};
  for (const r of rows) dueOf[r.company] = dueState(r.next_due);

  return (
    <div className="wf-hub wf-dark wf-hub-single">
      <div className="wf-hub-head">
        <HunterTabs handoffCount={handoffCount} />
      </div>
      <div className="wf-hub-scroll">
        <div className="wf-prospects">
          <h1 className="wf-campaigns-title">prospects</h1>
          <PipelineSummary
            table={table}
            fileContent={prospectsFile?.content ?? null}
          />
          {rows.length > 0 && (
            <section className="wf-of-panel">
              <div className="wf-of-panel-head">
                <h2>
                  all prospects
                  <span className="wf-of-panel-count">{rows.length}</span>
                </h2>
              </div>
              <div className="wf-of-panel-body">
                <PipelineTable rows={rows} dueOf={dueOf} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
