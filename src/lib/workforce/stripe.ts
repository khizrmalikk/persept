// Server-only reads for the Stripe mirror (bridge day 40). The bridge mirrors
// Stripe READ-ONLY into these tables every 15 min; the dashboard never calls
// Stripe and never holds a Stripe key. Everything here is DEFENSIVE — a missing
// table/column yields empty/zero, never a throw. `loadMoney` is request-cached
// (react `cache`) so the several windows that need it share one set of queries.

import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  MoneyAccount,
  OSMoney,
  Payment,
  RevenueDay,
  StripeInvoice,
  StripeSub,
} from "./stripe-types";

export type {
  MoneyAccount,
  OSMoney,
  Payment,
  RevenueDay,
  StripeInvoice,
  StripeSub,
} from "./stripe-types";

const N = (v: unknown): number => (v == null ? 0 : Number(v) || 0);
const S = (v: unknown): string => String(v ?? "").trim();

// the only real Stripe accounts (one row each). Anything else is a stray.
const PRODUCTS = new Set(["gyst", "persept"]);

// a jsonb `{currency: amount}` map → a plain Record<string, number>.
function amountMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const n = Number(val);
      if (Number.isFinite(n)) out[k.toLowerCase()] = n;
    }
  }
  return out;
}

// FX the bridge uses to turn non-AED Stripe money into AED. Single rate (USD→AED,
// Stripe's and the bridge's base), applied to every non-AED currency as a pragmatic
// approximation; AED passes through. Default 3.6725 (the pegged USD→AED rate).
export function fxToAed(): number {
  const v = Number.parseFloat(process.env.STRIPE_FX_TO_AED ?? "");
  return Number.isFinite(v) && v > 0 ? v : 3.6725;
}

// convert a {currency: amount} map to a single AED figure.
export function mapToAed(map: Record<string, number>, fx = fxToAed()): number {
  let sum = 0;
  for (const [cur, amt] of Object.entries(map))
    sum += cur === "aed" ? amt : amt * fx;
  return sum;
}

function normAccount(r: Record<string, unknown>): MoneyAccount {
  const balance = (r.balance ?? {}) as Record<string, unknown>;
  return {
    id: S(r.id) || "persept",
    label: S(r.label),
    product: S(r.product),
    status: S(r.status) === "error" ? "error" : "ok",
    detail: S(r.detail),
    mtdNet: amountMap(r.mtd_net),
    lastMonth: {}, // filled in loadMoney from revenue_daily
    mrr: amountMap(r.mrr),
    activeSubs: N(r.active_subs),
    openInvoices: N(r.open_invoices),
    overdueInvoices: N(r.overdue_invoices),
    balanceAvailable: N(balance.available),
    balancePending: N(balance.pending),
    updatedAt: (r.updated_at as string | null) ?? null,
  };
}

const normRevenue = (r: Record<string, unknown>): RevenueDay => ({
  date: S(r.date),
  account: S(r.account),
  currency: S(r.currency).toLowerCase() || "usd",
  gross: N(r.gross),
  fees: N(r.fees),
  refunds: N(r.refunds),
  net: N(r.net),
  payouts: N(r.payouts),
  charges: N(r.charges),
});

const normSub = (r: Record<string, unknown>): StripeSub => ({
  id: S(r.id),
  account: S(r.account) || "gyst",
  status: S(r.status).toLowerCase(),
  monthly: N(r.monthly),
  currency: S(r.currency).toLowerCase() || "usd",
  email: S(r.email),
  name: S(r.name),
  startedAt: (r.started_at as string | null) ?? null,
  canceledAt: (r.canceled_at as string | null) ?? null,
});

const normInvoice = (r: Record<string, unknown>): StripeInvoice => ({
  id: S(r.id),
  number: S(r.number) || S(r.invoice_number),
  account: S(r.account) || "persept",
  status: S(r.status).toLowerCase(),
  amountDue: N(r.amount_due),
  amountPaid: N(r.amount_paid),
  currency: S(r.currency).toLowerCase() || "usd",
  dueAt: (r.due_at as string | null) ?? null,
  paidAt: (r.paid_at as string | null) ?? null,
  url: S(r.url),
  name: S(r.name),
  email: S(r.email),
  product: "persept", // classified in loadMoney once subscriptions are known
});

const normPayment = (r: Record<string, unknown>): Payment => ({
  id: S(r.id),
  account: S(r.account) || "persept",
  amount: N(r.amount),
  currency: S(r.currency).toLowerCase() || "usd",
  amountAed: N(r.amount_aed),
  paidAt: (r.paid_at as string | null) ?? null,
  prospectKey: S(r.prospect_key),
  number: S(r.number) || S(r.invoice_number),
  name: S(r.name),
  email: S(r.email),
  description: S(r.description),
  product: "persept", // set in loadMoney once subscriptions are known
});

async function read<T>(
  table: string,
  shape: (r: Record<string, unknown>) => T,
  order: string,
  limit: number,
): Promise<T[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from(table)
      .select("*")
      .order(order, { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data as Record<string, unknown>[] | null) ?? []).map(shape);
  } catch {
    return [];
  }
}

export const loadMoney = cache(async (): Promise<OSMoney> => {
  const fx = fxToAed();
  const [accounts, revenueDaily, subscriptions, invoices, payments] =
    await Promise.all([
      read("stripe_accounts", normAccount, "updated_at", 20),
      read("revenue_daily", normRevenue, "date", 1200),
      read("stripe_subscriptions", normSub, "started_at", 500),
      read("stripe_invoices", normInvoice, "due_at", 500),
      read("payments", normPayment, "paid_at", 800),
    ]);

  // day-45: only product accounts are real (gyst, persept). The bridge deletes
  // strays, but don't depend on it — never surface a non-product row.
  const products = accounts.filter((a) => PRODUCTS.has(a.id));

  // last calendar month's net per account, per currency (so a card is never blank
  // early in a month). The bridge's `all` account is an aggregate — skip it.
  const now = new Date();
  const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pmKey = `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, "0")}`;
  for (const a of products) {
    const by: Record<string, number> = {};
    for (const r of revenueDaily) {
      if (r.account !== a.id || !r.date.startsWith(pmKey)) continue;
      by[r.currency] = (by[r.currency] ?? 0) + r.net;
    }
    a.lastMonth = by;
  }

  // classify each payment's/invoice's product. GYST = a subscription charge or a
  // known GYST subscriber; everything else is Persept. The bridge's `account`
  // field can't be trusted for this.
  const gystEmails = new Set(
    subscriptions.map((s) => s.email.toLowerCase()).filter(Boolean),
  );
  const isGyst = (email: string, account: string, desc = "") =>
    /subscription/i.test(desc) ||
    account === "gyst" ||
    (!!email && gystEmails.has(email.toLowerCase()));
  for (const p of payments)
    p.product = isGyst(p.email, p.account, p.description) ? "gyst" : "persept";
  for (const inv of invoices)
    inv.product = isGyst(inv.email, inv.account) ? "gyst" : "persept";

  const collectedAed = products.reduce((s, a) => s + mapToAed(a.mtdNet, fx), 0);
  const overdueCount = products.reduce((s, a) => s + a.overdueInvoices, 0);
  const errored = products.filter((a) => a.status === "error");
  const ok =
    products.length > 0 ||
    payments.length > 0 ||
    invoices.length > 0 ||
    subscriptions.length > 0 ||
    revenueDaily.length > 0;

  return {
    ok,
    fx,
    accounts: products,
    revenueDaily,
    subscriptions,
    invoices,
    payments,
    collectedAed,
    overdueCount,
    errored,
  };
});

// ── shared helpers surfaces reuse ─────────────────────────────────────────────

export function isThisMonth(iso: string | null, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

// payments that landed this month and matched a prospect → AED by prospect key.
export function paidThisMonthByKey(
  money: OSMoney,
  now = new Date(),
): Map<string, { aed: number; paidAt: string | null; number: string }> {
  const out = new Map<
    string,
    { aed: number; paidAt: string | null; number: string }
  >();
  for (const p of money.payments) {
    if (!p.prospectKey || !isThisMonth(p.paidAt, now)) continue;
    const prev = out.get(p.prospectKey);
    out.set(p.prospectKey, {
      aed: (prev?.aed ?? 0) + p.amountAed,
      paidAt: p.paidAt,
      number: p.number || prev?.number || "",
    });
  }
  return out;
}

// the most recent payment for a prospect key (deal panel "paid" line / journey).
export function paymentForKey(money: OSMoney, key: string): Payment | null {
  if (!key) return null;
  let best: Payment | null = null;
  for (const p of money.payments) {
    if (p.prospectKey !== key) continue;
    if (!best || (p.paidAt ?? "") > (best.paidAt ?? "")) best = p;
  }
  return best;
}

// GYST monthly recurring revenue, AED.
export function gystMrrAed(money: OSMoney): number {
  const g = money.accounts.find((a) => a.id === "gyst");
  return g ? mapToAed(g.mrr, money.fx) : 0;
}
