import { HunterHeader } from "@/app/dashboard/_components/HunterHeader";
import {
  HunterProspects,
  type ProspectVM,
} from "@/app/dashboard/_components/HunterProspects";
import { dueState } from "@/app/dashboard/_components/panels/dates";
import { getAgentFile, parseMarkdownTable } from "@/lib/workforce/files";
import { getHunterHeaderStats } from "../_data";
import "../../../hunter.css";

export const dynamic = "force-dynamic";

const HN = "oklch(0.78 0.12 150)";
const AMBER = "var(--accent)";
const RED = "var(--err)";
const STAGES = [
  "new",
  "drafted",
  "approached",
  "followed up 1",
  "followed up 2",
  "replied",
  "call booked",
  "handed off",
  "parked",
  "no",
];
const norm = (s: string) =>
  (s ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
function prospPill(status: string): [string, string] {
  const s = norm(status);
  if (s.includes("repl")) return ["oklch(0.8 0.14 70 / 0.16)", AMBER];
  if (s.includes("hand")) return ["oklch(0.8 0.16 150 / 0.14)", "var(--ok)"];
  if (s.includes("draft"))
    return ["oklch(0.78 0.12 220 / 0.16)", "oklch(0.84 0.09 220)"];
  if (s.includes("approach")) return ["oklch(0.78 0.12 150 / 0.16)", HN];
  return ["rgba(255,255,255,0.07)", "var(--ink-soft)"];
}
function dueBits(next: string | undefined): [string, string] {
  const s = dueState(next);
  if (!next) return ["—", "var(--ink-faint)"];
  if (s === "overdue") return [`${next}`, RED];
  if (s === "today") return ["today", AMBER];
  return [next, "var(--ink-faint)"];
}

export default async function ProspectsPage() {
  const [{ stats, pending }, prospectsFile] = await Promise.all([
    getHunterHeaderStats(),
    getAgentFile("hunter", "PROSPECTS.md"),
  ]);
  const rows = parseMarkdownTable(prospectsFile?.content).rows;

  const counts: Record<string, number> = Object.fromEntries(
    STAGES.map((s) => [s, 0]),
  );
  for (const r of rows) {
    const st = norm(r.status ?? "");
    if (st in counts) counts[st] += 1;
  }

  const campaigns = [
    ...new Set(rows.map((r) => (r.campaign ?? "").trim()).filter(Boolean)),
  ].sort();

  const vms: ProspectVM[] = rows.map((r) => {
    const [statusBg, statusFg] = prospPill(r.status ?? "");
    const [dueLabel, dueColor] = dueBits(r.next_due);
    return {
      pri: r.priority ?? r.pri ?? "",
      company: r.company ?? "",
      contact: r.contact ?? "",
      channel: r.channel ?? "",
      campaign: r.campaign ?? "",
      status: (r.status ?? "").replace(/[_-]+/g, " "),
      statusBg,
      statusFg,
      dueLabel,
      dueColor,
      angle: r.angle ?? r.notes ?? "",
    };
  });

  return (
    <div className="wf-hn">
      <HunterHeader stats={stats} pending={pending} />
      <div className="wf-hn-stagetiles">
        {STAGES.map((s) => (
          <div key={s} className={`wf-hn-tile${counts[s] ? "" : " dim"}`}>
            <div className="wf-hn-tile-k">{s}</div>
            <div className="wf-hn-tile-v">{counts[s]}</div>
          </div>
        ))}
      </div>
      <HunterProspects rows={vms} campaigns={campaigns} />
    </div>
  );
}
