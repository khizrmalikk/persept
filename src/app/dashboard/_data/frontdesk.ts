import { supabaseAdmin } from "@/lib/supabase/server";
import { getCopyLibrary, getInFlightCopy } from "@/lib/workforce/copy";
import {
  getHunterQualified,
  getRecentlyDecidedLeads,
  getSuggestedLeads,
} from "@/lib/workforce/leads";
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
import type { OSCopyRow } from "./copy-types";
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

const DAY_MS = 86400000;
const sameDay = (iso: string | null, now: Date): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};
const decider = (by: string): OSLead["decidedBy"] => {
  const v = by.toLowerCase();
  return v === "hunter" || v === "percy" || v === "owner" ? v : "";
};

type LeadRow = Awaited<ReturnType<typeof getSuggestedLeads>>[number];

function leadVM(l: LeadRow): OSLead {
  const notYetQualified =
    l.status === "suggested" &&
    !l.qualify_sent_at &&
    !!l.ts &&
    Date.now() - new Date(l.ts).getTime() > DAY_MS;
  return {
    id: l.id,
    company: l.company,
    what: [l.size, l.channel].filter(Boolean).join(" · "),
    signal: l.angle || l.evidence || "new signal",
    src: sourceKey(l),
    status: l.status,
    fit: l.fit,
    reason: l.reason,
    decidedBy: decider(l.decided_by),
    decidedAt: l.decided_at ? ago(l.decided_at) : "",
    notYetQualified,
  };
}

// which "for you" bucket a suggested lead lands in (null = still with Hunter, so
// it is not shown as a card — only counted in the collapsed "with Hunter" line).
function forYouReason(l: LeadRow): "left" | "not-yet" | null {
  if (l.status !== "suggested") return null;
  if (l.reason.trim()) return "left"; // Hunter looked and left it for you
  const old = !!l.ts && Date.now() - new Date(l.ts).getTime() > DAY_MS;
  if (!l.qualify_sent_at && old) return "not-yet"; // Hunter never got it
  return null;
}

export async function loadFrontDesk(): Promise<OSFrontDesk> {
  const db = supabaseAdmin();
  const [
    prospectsRes,
    suggested,
    recentlyDecided,
    hunterQualified,
    proposals,
    messages,
    money,
    copyLib,
    inFlightAll,
  ] = await Promise.all([
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
    getRecentlyDecidedLeads(7).catch(() => []),
    getHunterQualified().catch(() => ({
      companies: new Set<string>(),
      weekAccepted: 0,
      weekDismissed: 0,
    })),
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
    getCopyLibrary(200).catch(() => []),
    getInFlightCopy().catch(() => []),
  ]);

  const copy: OSCopyRow[] = copyLib.map((r) => ({
    id: r.id,
    forAgent: r.for_agent,
    writer: r.writer,
    kind: r.kind,
    channel: r.channel,
    company: r.company,
    contact: r.contact,
    campaign: r.campaign,
    subject: r.subject,
    body: r.body,
    when: ago(r.ts),
    ts: r.ts,
    status: r.approvalStatus,
  }));

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
        fromHunter: !!(
          p.company &&
          hunterQualified.companies.has(p.company.trim().toLowerCase())
        ),
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
      markdown: p.markdown,
      contact: p.contact,
      preparedBy: p.prepared_by,
      validUntil: p.valid_until,
      token: p.token,
      sentAt: p.sent_at,
      firstViewedAt: p.first_viewed_at,
      lastViewedAt: p.last_viewed_at,
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
  for (const l of [...suggested, ...recentlyDecided]) {
    const k = sourceKey(l);
    srcCount.set(k, (srcCount.get(k) ?? 0) + 1);
  }
  const sources = [...srcCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // day-47 research desk groups. "for you" = leads Hunter left (newest reasons
  // first) then the ones he never got. "with Hunter" = everything else still
  // suggested (he has it in hand). "decided recently" = his/your accept+dismiss.
  const forYou: OSLead[] = [];
  let withHunter = 0;
  for (const l of suggested) {
    const bucket = forYouReason(l);
    if (bucket) forYou.push(leadVM(l));
    else withHunter += 1;
  }
  // Hunter-left leads before never-qualified ones; stable within each group.
  forYou.sort((a, b) => Number(a.notYetQualified) - Number(b.notYetQualified));
  const decidedRecently = recentlyDecided.map(leadVM);

  // today's tally — only decisions stamped today count.
  const leadsToday = { accepted: 0, dismissed: 0, left: 0 };
  for (const l of recentlyDecided) {
    if (!sameDay(l.decided_at, now)) continue;
    if (l.status === "sent_to_hunter") leadsToday.accepted += 1;
    else if (l.status === "dismissed") leadsToday.dismissed += 1;
  }
  for (const l of suggested) {
    if (l.reason.trim() && l.qualify_sent_at && sameDay(l.decided_at, now))
      leadsToday.left += 1;
  }

  return {
    deals,
    forYou,
    withHunter,
    decidedRecently,
    leadsToday,
    proposals: proposalRows,
    threads,
    sources,
    copy,
    inFlight: inFlightAll.filter((r) => r.forAgent === "hunter"),
    pipelineValue,
    wonThisMonth,
    wonPaidThisMonth,
    money,
  };
}
