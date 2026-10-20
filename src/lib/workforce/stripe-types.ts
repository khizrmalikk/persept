// Client-safe shared types for the Stripe mirror. Kept apart from stripe.ts (the
// loader, which imports server-only supabaseAdmin) so the money tab + any client
// surface can import these TYPES without pulling server code into the bundle.

export type MoneyAccount = {
  id: string; // persept | gyst
  label: string;
  product: string;
  status: "ok" | "error";
  detail: string; // a warning even when status=ok (e.g. fees missing)
  mtdNet: Record<string, number>;
  lastMonth: Record<string, number>; // net last calendar month, per currency
  mrr: Record<string, number>;
  activeSubs: number;
  openInvoices: number;
  overdueInvoices: number;
  balanceAvailable: number;
  balancePending: number;
  updatedAt: string | null;
};

export type RevenueDay = {
  date: string; // YYYY-MM-DD
  account: string;
  currency: string;
  gross: number;
  fees: number;
  refunds: number;
  net: number;
  payouts: number;
  charges: number;
};

export type StripeSub = {
  id: string;
  account: string;
  status: string; // active | trialing | past_due | canceled | …
  monthly: number;
  currency: string;
  email: string;
  name: string;
  startedAt: string | null;
  canceledAt: string | null;
};

export type StripeInvoice = {
  id: string;
  number: string;
  account: string;
  status: string; // open | paid | void | …
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueAt: string | null;
  paidAt: string | null;
  url: string;
  name: string;
  email: string;
  // which product the invoice is for — classified like payments (a GYST
  // subscriber's unpaid renewal shouldn't read as a Persept invoice).
  product: "gyst" | "persept";
  // day-47: the bridge mirrors the owner's own `manual_invoices` into this table
  // with id `man_<id>` and `source = "manual"`. Manual rows are paid by bank
  // transfer (no hosted Stripe link) and may carry a PDF in `fileUrl`.
  source: "stripe" | "manual";
  manualId: string; // the manual_invoices row id (mirror id minus `man_`), else ""
  fileUrl: string; // the invoice PDF url, manual rows only
  prospectKey: string; // links a manual invoice to a prospect/deal
};

export type Payment = {
  id: string;
  account: string;
  amount: number;
  currency: string;
  amountAed: number;
  paidAt: string | null;
  prospectKey: string;
  number: string;
  name: string;
  email: string;
  description: string;
  // which product the money is for. The bridge's `account` field is unreliable
  // (it tags GYST subscription charges as "persept"), so this is derived from the
  // subscription signal: a "Subscription …" charge or a known GYST subscriber →
  // gyst. GYST payments are recurring revenue and never link to a prospect.
  product: "gyst" | "persept";
  // day-47: how the money arrived. The bridge sets `kind = "manual"` for payments
  // folded in from a manual invoice, with `method` (transfer | cash | cheque |
  // card). Stripe payments are kind "stripe" with method "".
  kind: string;
  method: string;
};

export type OSMoney = {
  ok: boolean; // any stripe data present at all
  fx: number;
  accounts: MoneyAccount[];
  revenueDaily: RevenueDay[];
  subscriptions: StripeSub[];
  invoices: StripeInvoice[];
  payments: Payment[];
  // aggregates (AED)
  collectedAed: number; // Σ accounts.mtdNet, converted
  overdueCount: number; // Σ accounts.overdueInvoices
  errored: MoneyAccount[]; // accounts with status=error (amber notice)
};
