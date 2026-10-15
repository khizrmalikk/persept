import { supabaseAdmin } from "@/lib/supabase/server";
import { getHandledLeads, getSuggestedLeads } from "@/lib/workforce/leads";
import { getMessages, groupThreads } from "@/lib/workforce/outreach";
import { getProposals } from "@/lib/workforce/proposals";
import {
  isThisMonth,
  loadMoney,
  paidThisMonthByKey,
  paymentForKey,
} from "@/lib/workforce/stripe";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import {
  type OSConvMsg,
  type OSDeal,
  type OSFrontDesk,
  type OSLead,
  type OSProposalRow,
  type OSStage,
  type OSThread,
  PROPOSAL_STEPS,
} from "./frontdesk-types";

// Front desk = the sales funnel overlap (Scout → Hunter → Scribe → you). Reads the
// day-30 `prospects` table for the pipeline, plus leads (Scout), proposals (Scribe)
// and the outreach `messages` log, all shaped for the window. Everything is
// defensive: a missing table just yields an empty section. Shared types +
// constants live in ./frontdesk-types (client-safe); this file is server-only.
export type { OSFrontDesk } from "./frontdesk-types";

type ProspectRow = {
  key: string;
  company: string | null;
  contact: string | null;
  size: string | null;
  angle: string | null;
  stage: string | null;
  status: string | null;
  value_aed: number | null;
  campaign: string | null;
  last_touch: string | null;
  notes: string | null;
  archived: boolean | null;
  won_at: string | null;
};

const STAGE_SET = new Set<OSStage>([
  "prospect",
  "contacted",
  "replied",
  "call",
  "proposal",
  "won",
]);

const firstName = (full: string) => full.split(/\s+/)[0] ?? full;
const shortDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" }).toLowerCase()}`;
};
const sourceKey = (l: { campaign: string; source_url: string }) => {
  if (l.campaign) return l.campaign;
  const m = l.source_url.match(/^https?:\/\/([^/]+)/i);
  return m ? m[1].replace(/^www\./, "") : "research";
};

function leadVM(
  l: Awaited<ReturnType<typeof getSuggestedLeads>>[number],
): OSLead {
  return {
    id: l.id,
    company: l.company,
    what: [l.size, l.channel].filter(Boolean).join(" · "),
    signal: l.angle || l.evidence || "new signal",
    src: sourceKey(l),
    status: l.status,
  };
}

export async function loadFrontDesk(): Promise<OSFrontDesk> {
  const db = supabaseAdmin();
  const [prospectsRes, suggested, handled, proposals, messages, money] =
    await Promise.all([
      (async () => {
        try {
          return await db
            .from("prospects")
            .select(
              "key, company, contact, size, angle, stage, status, value_aed, campaign, last_touch, notes, archived, won_at",
            )
            .order("updated_at", { ascending: false });
        } catch {
          return { data: null };
        }
      })(),
      getSuggestedLeads().catch(() => []),
      getHandledLeads(20).catch(() => []),
      getProposals().catch(() => []),
      getMessages("hunter").catch(() => []),
      loadMoney().catch(
        () =>
          ({
            ok: false,
            fx: 0,
            accounts: [],
            revenueDaily: [],
            subscriptions: [],
            invoices: [],
            payments: [],
            collectedAed: 0,
            overdueCount: 0,
            errored: [],
          }) as Awaited<ReturnType<typeof loadMoney>>,
      ),
    ]);

  const propByCompany = new Map<string, (typeof proposals)[number]>();
  for (const p of proposals)
    if (p.company) propByCompany.set(p.company.toLowerCase(), p);

  const prospects = (
    (prospectsRes as { data: ProspectRow[] | null }).data ?? []
  ).filter((p) => !p.archived);

  const deals: OSDeal[] = prospects
    .map((p) => {
      const stageRaw = (p.stage ?? "prospect").toLowerCase() as OSStage;
      const stage: OSStage = STAGE_SET.has(stageRaw) ? stageRaw : "prospect";
      const prop = p.company
        ? propByCompany.get(p.company.toLowerCase())
        : undefined;
      const team: AgentKey[] = ["scout", "hunter"];
      if (prop) team.push("scribe");
      const pay = paymentForKey(money, p.key);
      const inv = pay
        ? money.invoices.find((i) => i.number && i.number === pay.number)
        : null;
      return {
        key: p.key,
        company: p.company ?? p.key,
        contact: p.contact ?? "",
        role: p.size ?? "",
        stage,
        value: p.value_aed ?? 0,
        source: p.campaign || "research",
        lastLine: (p.status || p.notes || p.angle || "in the pipeline").slice(
          0,
          80,
        ),
        lastWhen: p.last_touch ? ago(p.last_touch) : "",
        team,
        proposalId: prop?.id ?? null,
        paid: pay
          ? {
              aed: pay.amountAed,
              when: shortDate(pay.paidAt),
              number: pay.number,
              url: inv?.url ?? "",
            }
          : null,
        wonAt: p.won_at,
      };
    })
    // hide lost/parked (they were filtered out of STAGE_SET above too)
    .filter((d) => STAGE_SET.has(d.stage));

  const now = new Date();
  const pipelineValue = deals
    .filter((d) => d.stage !== "won")
    .reduce((s, d) => s + d.value, 0);

  // day-40 won this month = Σ real Stripe payments (matched to a prospect), plus
  // won prospects this month that have no matching payment yet ("unpaid").
  const paidByKey = paidThisMonthByKey(money, now);
  const wonPaidThisMonth = [...paidByKey.values()].reduce(
    (s, v) => s + v.aed,
    0,
  );
  const unpaidWon = prospects
    .filter(
      (p) =>
        (p.stage ?? "").toLowerCase() === "won" &&
        isThisMonth(p.last_touch, now) &&
        !paidByKey.has(p.key),
    )
    .reduce((s, p) => s + (p.value_aed ?? 0), 0);
  const wonThisMonth = wonPaidThisMonth + unpaidWon;

  const proposalRows: OSProposalRow[] = proposals.map((p) => {
    const idx = PROPOSAL_STEPS.indexOf(
      (p.status === "declined"
        ? "viewed"
        : p.status) as (typeof PROPOSAL_STEPS)[number],
    );
    const dealKey =
      deals.find((d) => d.company.toLowerCase() === p.company.toLowerCase())
        ?.key ?? null;
    return {
      id: p.id,
      company: p.company,
      title: p.title,
      status: p.status,
      stepIndex: idx,
      views: p.view_count,
      value: p.markdown.match(/AED[\s\d,]+/)?.[0]?.trim() ?? "—",
      updated: ago(p.updated_at),
      dealKey,
    };
  });

  const threads: OSThread[] = groupThreads(messages)
    .slice(0, 30)
    .map((t) => {
      const msgs: OSConvMsg[] = t.messages.map((m) => ({
        by: m.direction === "in" ? "them" : "hunter",
        text: m.body,
        t: ago(m.ts),
        via: m.direction === "out" ? "sent after your tap" : null,
      }));
      const last = t.messages[t.messages.length - 1];
      return {
        key: t.key,
        who: firstName(t.contact || t.company),
        company: t.company,
        lastText: (last?.body ?? "").slice(0, 44),
        lastT: last ? ago(last.ts) : "",
        msgs,
      };
    });

  // sources: lead counts grouped by their source key (this week's sweeps)
  const srcCount = new Map<string, number>();
  for (const l of [...suggested, ...handled]) {
    const k = sourceKey(l);
    srcCount.set(k, (srcCount.get(k) ?? 0) + 1);
  }
  const sources = [...srcCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    deals,
    leads: suggested.map(leadVM),
    handledLeads: handled.map(leadVM),
    proposals: proposalRows,
    threads,
    sources,
    pipelineValue,
    wonThisMonth,
    wonPaidThisMonth,
    money,
  };
}
