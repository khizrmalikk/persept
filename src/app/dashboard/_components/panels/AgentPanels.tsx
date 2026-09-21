import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getAgentFile,
  listAgentFiles,
  parseMarkdownTable,
} from "@/lib/workforce/files";
import type { Agent, WfEvent } from "@/lib/workforce/types";
import { Backlog } from "./Backlog";
import { DigestArchive } from "./DigestArchive";
import { dueState, today } from "./dates";
import { type Digest, parseDigest } from "./digest";
import { HudPanel } from "./HudPanel";
import { LatestDigest } from "./LatestDigest";
import { MemoryPanel } from "./MemoryPanel";
import { OfferPanel } from "./OfferPanel";
import { PipelineSummary } from "./PipelineSummary";
import { PipelineTable, type ProspectRow } from "./PipelineTable";
import { RosterStrip } from "./RosterStrip";
import { SourcesPanel } from "./SourcesPanel";
import { TodayLog } from "./TodayLog";
import { TodaysBrief } from "./TodaysBrief";
import { WorkersPanel } from "./WorkersPanel";

// Agent-specific panel section for the detail page. Dispatches on agent.id, fetches
// each panel set's files server-side (read-only via files.ts / supabaseAdmin), and
// hands parsed/serializable data to the client children. Unknown agents get the
// generic panels only. Every panel renders its own honest empty state.
//
// Layout: panels tile in a responsive bento grid (.wf-panels). Each panel is wrapped
// in a grid cell so we can control its span WITHOUT touching the panel's own logic —
// content-heavy panels get .wf-cell-wide (span the full grid row); compact panels get
// .wf-cell (one auto-fit column). The wide/narrow choice lives here, at the layout
// boundary, so the panel components stay purely presentational.

import type { ReactNode } from "react";

// One bento cell. `wide` makes it span the full grid width (grid-column: 1 / -1).
function Cell({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "wf-cell wf-cell-wide" : "wf-cell"}>{children}</div>
  );
}

type Due = "overdue" | "today" | "future" | "";

async function HunterPanels({ agentId }: { agentId: string }) {
  const file = await getAgentFile(agentId, "PROSPECTS.md");
  const table = parseMarkdownTable(file?.content);
  const rows = table.rows as ProspectRow[];
  const dueOf: Record<string, Due> = {};
  for (const r of rows) dueOf[r.company] = dueState(r.next_due);
  return (
    <>
      <Cell>
        <PipelineSummary table={table} />
      </Cell>
      {rows.length ? (
        <Cell wide>
          <HudPanel title="prospects" right={`${rows.length} rows`}>
            <PipelineTable rows={rows} dueOf={dueOf} />
          </HudPanel>
        </Cell>
      ) : null}
      <Cell wide>
        <OfferPanel agentId={agentId} />
      </Cell>
    </>
  );
}

async function ScoutPanels({
  agentId,
  museEnabled,
}: {
  agentId: string;
  museEnabled: boolean;
}) {
  const files = await listAgentFiles(agentId, "memory/digests/");
  const parsed: Digest[] = files.map((f) => parseDigest(f.path, f.content));
  const latest = parsed[0] ?? null;
  const archive = parsed.slice(1, 7); // previous six
  return (
    <>
      <Cell wide>
        <LatestDigest digest={latest} museEnabled={museEnabled} />
      </Cell>
      <Cell wide>
        <HudPanel title="digest archive" right="last 6">
          <DigestArchive digests={archive} museEnabled={museEnabled} />
        </HudPanel>
      </Cell>
      <Cell>
        <SourcesPanel agentId={agentId} />
      </Cell>
    </>
  );
}

async function ChiefPanels({
  agentId,
  agents,
}: {
  agentId: string;
  agents: Agent[];
}) {
  // Latest assistant "good morning" from chief's events, only if it's from today (Dubai).
  const { data } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("agent_id", agentId)
    .eq("kind", "message")
    .order("ts", { ascending: false })
    .limit(60);
  const events = (data as WfEvent[] | null) ?? [];
  const t = today();
  const briefText = (() => {
    for (const e of events) {
      const p = (e.payload ?? {}) as { role?: string; text?: string };
      const text = p.text ?? e.summary ?? "";
      const isAssistant =
        p.role !== "user" && !(e.summary ?? "").startsWith("owner");
      if (!isAssistant) continue;
      if (!/^\s*good morning/i.test(text)) continue;
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
      }).format(new Date(e.ts));
      return day === t ? text : null;
    }
    return null;
  })();

  const backlogFile = await getAgentFile(agentId, "memory/backlog.md");
  const backlogLines = (backlogFile?.content ?? "")
    .split(/\r?\n/)
    .map((l) =>
      l
        .trim()
        .replace(/^[-*]\s*/, "")
        .replace(/^\[[ xX]\]\s*/, ""),
    )
    .filter(Boolean);
  const enabled = agents.map((a) => ({
    id: a.id,
    emoji: a.emoji ?? "◆",
    name: a.name ?? a.id,
  }));

  return (
    <>
      <Cell wide>
        <TodaysBrief text={briefText} />
      </Cell>
      <Cell>
        <HudPanel title="backlog" right={`${backlogLines.length} items`}>
          <Backlog lines={backlogLines} agents={enabled} />
        </HudPanel>
      </Cell>
      <Cell>
        <RosterStrip agents={agents} />
      </Cell>
    </>
  );
}

export async function AgentPanels({
  agent,
  agents,
  museEnabled,
}: {
  agent: Agent;
  agents: Agent[];
  museEnabled: boolean;
}) {
  const id = agent.id;
  return (
    <section className="wf-panels">
      {id === "hunter" ? <HunterPanels agentId={id} /> : null}
      {id === "scout" ? (
        <ScoutPanels agentId={id} museEnabled={museEnabled} />
      ) : null}
      {id === "chief" ? <ChiefPanels agentId={id} agents={agents} /> : null}
      {/* background workers — every agent, directly under its own panels */}
      <Cell>
        <WorkersPanel agentId={id} />
      </Cell>
      {/* generic — every agent (compact, one per column) */}
      <Cell>
        <MemoryPanel agentId={id} />
      </Cell>
      <Cell>
        <TodayLog agentId={id} />
      </Cell>
    </section>
  );
}
