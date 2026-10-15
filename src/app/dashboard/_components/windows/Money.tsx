"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type { MoneyAccount, OSMoney } from "@/lib/workforce/stripe-types";

// The money view (day-40 Stripe), owned by the war room. Pure presentational: it
// takes the money data + a lite prospect list + three callbacks, so it has no
// dependency on any one window's loader. money0/cur/shortDay are exported for the
// front desk deal panel, which also renders Stripe payments.

export type MoneyDeal = { key: string; company: string; stage: string };

// ── money (day-40 Stripe) ─────────────────────────────────────────────────────
// one series colour per account, in order.
const ACCT_COLORS = [
  "var(--c-hunter)",
  "var(--accent)",
  "var(--c-muse)",
  "var(--c-scribe)",
];
const DAY_MS = 86_400_000;
export const money0 = (n: number) => Math.round(n).toLocaleString("en-US");
export const cur = (code: string) =>
  code === "aed" ? "AED" : code.toUpperCase();
export const shortDay = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" }).toLowerCase()}`;
};
const overdue = (dueAt: string | null) =>
  !!dueAt && new Date(dueAt).getTime() < Date.now();

export function Money({
  money,
  deals,
  onRemind,
  onOpenDeal,
  onLink,
}: {
  money: OSMoney;
  deals: MoneyDeal[];
  onRemind: (ref: string) => void;
  onOpenDeal: (key: string) => void;
  onLink: (paymentId: string, prospectKey: string) => void;
}) {
  const m = money;
  // day-42: linking a persept payment to a prospect (picker over prospects).
  const [linking, setLinking] = useState<string | null>(null);
  const [pick, setPick] = useState("");

  // chart series = the accounts that actually appear in revenue_daily, minus the
  // bridge's "all" aggregate row (summing it in would double-count). Known accounts
  // (stripe_accounts order) come first so colours stay stable, then any extras.
  const knownIds = m.accounts.map((a) => a.id);
  const revAccts = [...new Set(m.revenueDaily.map((r) => r.account))].filter(
    (a) => a && a !== "all",
  );
  const chartAccts = revAccts.length
    ? [
        ...knownIds.filter((k) => revAccts.includes(k)),
        ...revAccts.filter((a) => !knownIds.includes(a)),
      ]
    : knownIds;
  // stable colour per account id (cards + chart share it).
  const colorIndex = new Map<string, number>();
  knownIds.forEach((id, i) => {
    colorIndex.set(id, i);
  });
  for (const a of chartAccts)
    if (!colorIndex.has(a)) colorIndex.set(a, colorIndex.size);
  const colorOf = (acct: string) =>
    ACCT_COLORS[(colorIndex.get(acct) ?? 0) % ACCT_COLORS.length];

  // 12 weekly net buckets per account, oldest→newest, ending this week.
  const weekMs = 7 * DAY_MS;
  const now = Date.now();
  const start = now - 11 * weekMs; // start of the oldest of 12 weeks
  const weeks = Array.from({ length: 12 }, () => {
    const byAcct: Record<string, number> = {};
    for (const a of chartAccts) byAcct[a] = 0;
    return byAcct;
  });
  for (const r of m.revenueDaily) {
    if (!chartAccts.includes(r.account)) continue; // skips the "all" aggregate
    const t = new Date(r.date).getTime();
    if (Number.isNaN(t)) continue;
    const idx = Math.floor((t - start) / weekMs);
    if (idx < 0 || idx > 11) continue;
    weeks[idx][r.account] = (weeks[idx][r.account] ?? 0) + r.net;
  }
  const maxNet = Math.max(
    1,
    ...weeks.flatMap((w) => Object.values(w).map((v) => Math.max(0, v))),
  );
  const hasRevenue = weeks.some((w) => chartAccts.some((a) => (w[a] ?? 0) > 0));

  const openInvoices = m.invoices
    .filter((i) => i.status === "open" || i.status === "past_due")
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  const recentPayments = [...m.payments]
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
    .slice(0, 12);
  const gyst = m.accounts.find((a) => a.id === "gyst");
  const gystSubs = m.subscriptions.filter((s) => s.account === "gyst");
  const subCount = (st: string) =>
    gystSubs.filter((s) => s.status === st).length;
  const cancelled30 = gystSubs.filter(
    (s) =>
      s.canceledAt &&
      Date.now() - new Date(s.canceledAt).getTime() < 30 * DAY_MS,
  ).length;

  if (!m.ok)
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--mute)",
          fontSize: 13,
          textAlign: "center",
          padding: 40,
        }}
      >
        no Stripe data yet. the bridge mirrors money every 15 minutes.
      </div>
    );

  return (
    <div
      style={{ position: "absolute", inset: 0, overflow: "auto", padding: 18 }}
    >
      {/* error banners (status=error) — full-width, wrapped */}
      {m.errored.map((a) => (
        <div
          key={a.id}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            background: "var(--t-chief)",
            color: "var(--ambink)",
            fontSize: 12.5,
            lineHeight: 1.45,
            wordBreak: "break-word",
            marginBottom: 12,
          }}
        >
          <b>{a.label || a.id}</b> {a.detail || "stripe sync error"}
        </div>
      ))}

      {/* account summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {m.accounts.map((a) => {
          const net = Object.entries(a.mtdNet);
          return (
            <div
              key={a.id}
              style={{
                padding: 14,
                borderRadius: 14,
                background: "var(--surf2)",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: colorOf(a.id),
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {a.label || a.id}
                </span>
                {a.product && (
                  <span style={{ fontSize: 11, color: "var(--mute)" }}>
                    {a.product}
                  </span>
                )}
                {a.status === "error" && (
                  <span
                    className="os-mono"
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--ambink)",
                      border: "1px solid var(--ambink)",
                      borderRadius: 999,
                      padding: "1px 6px",
                    }}
                  >
                    sync error
                  </span>
                )}
              </div>
              <div
                className="os-display"
                style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}
              >
                {net.length
                  ? net.map(([c, v]) => `${cur(c)} ${money0(v)}`).join(" · ")
                  : "—"}
              </div>
              <div
                style={{ fontSize: 11.5, color: "var(--soft)", marginTop: 2 }}
              >
                net this month
              </div>
              {Object.keys(a.lastMonth).length > 0 && (
                <div
                  style={{ fontSize: 11, color: "var(--mute)", marginTop: 3 }}
                >
                  last month ·{" "}
                  {Object.entries(a.lastMonth)
                    .map(([c, v]) => `${cur(c)} ${money0(v)}`)
                    .join(" · ")}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 8,
                  fontSize: 11.5,
                  color: "var(--soft)",
                }}
              >
                <span>{a.activeSubs} subs</span>
                <span>{a.openInvoices} open</span>
                {a.overdueInvoices > 0 && (
                  <span style={{ color: "var(--bad)" }}>
                    {a.overdueInvoices} overdue
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* day-45: a `detail` while status=ok is a warning — a small amber line
          under the cards, wrapped, never truncated. */}
      {m.accounts
        .filter((a) => a.status === "ok" && a.detail)
        .map((a) => (
          <div
            key={`warn-${a.id}`}
            style={{
              fontSize: 11.5,
              color: "var(--ambink)",
              lineHeight: 1.45,
              wordBreak: "break-word",
              marginBottom: 12,
            }}
          >
            <b>{a.label || a.id}</b> · {a.detail}
          </div>
        ))}

      {/* 12-week net bar chart */}
      <Section title="revenue · last 12 weeks">
        {!hasRevenue ? (
          <Empty>no revenue in the last 12 weeks</Empty>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
              {chartAccts.map((a) => {
                const label = m.accounts.find((x) => x.id === a)?.label || a;
                return (
                  <span
                    key={a}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: "var(--soft)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: colorOf(a),
                      }}
                    />
                    {label}
                  </span>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
                height: 120,
                borderBottom: "1px solid var(--line)",
                paddingBottom: 1,
              }}
            >
              {weeks.map((w, i) => (
                <div
                  key={`wk-${start + i * weekMs}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 2,
                      height: "100%",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    {/* only draw a bar where there's real revenue — no zero stubs */}
                    {chartAccts
                      .filter((a) => (w[a] ?? 0) > 0)
                      .map((a) => (
                        <div
                          key={a}
                          title={`${a}: AED ${money0(w[a] ?? 0)}`}
                          style={{
                            width: 10,
                            maxWidth: "40%",
                            height: `${Math.max(4, (w[a] / maxNet) * 100)}%`,
                            background: colorOf(a),
                            borderRadius: "3px 3px 0 0",
                          }}
                        />
                      ))}
                  </div>
                  {i % 3 === 0 && (
                    <span
                      className="os-mono"
                      style={{ fontSize: 8.5, color: "var(--mute)" }}
                    >
                      {shortDay(new Date(start + i * weekMs).toISOString())}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* open invoices */}
      <Section
        title={`open invoices${openInvoices.length ? ` · ${openInvoices.length}` : ""}`}
      >
        {openInvoices.length === 0 ? (
          <Empty>nothing open. all settled.</Empty>
        ) : (
          openInvoices.map((inv) => {
            const od = overdue(inv.dueAt);
            return (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 4px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {inv.name || inv.email || "customer"}
                    {inv.number && (
                      <span
                        className="os-mono"
                        style={{
                          fontSize: 11,
                          color: "var(--mute)",
                          marginLeft: 6,
                        }}
                      >
                        #{inv.number}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--soft)" }}>
                    {cur(inv.currency)} {money0(inv.amountDue)}
                    {inv.dueAt ? ` · due ${shortDay(inv.dueAt)}` : ""}
                  </div>
                </div>
                <span
                  className="os-mono"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color:
                      inv.product === "gyst" ? "var(--accent)" : "var(--soft)",
                    border: `1px solid ${inv.product === "gyst" ? "var(--accent)" : "var(--line)"}`,
                    borderRadius: 999,
                    padding: "1px 6px",
                    flex: "none",
                  }}
                >
                  {inv.product}
                </span>
                {od && (
                  <span
                    className="os-mono"
                    style={{
                      fontSize: 9.5,
                      textTransform: "uppercase",
                      color: "var(--bad)",
                      border: "1px solid var(--bad)",
                      borderRadius: 999,
                      padding: "2px 7px",
                    }}
                  >
                    overdue
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemind(inv.number || inv.id)}
                  style={{
                    fontSize: 11.5,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  remind
                </button>
                {inv.url && (
                  <a
                    href={inv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11.5,
                      color: "var(--soft)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    open in Stripe ↗
                  </a>
                )}
              </div>
            );
          })
        )}
      </Section>

      {/* recent payments */}
      <Section title="recent payments">
        {recentPayments.length === 0 ? (
          <Empty>no payments yet</Empty>
        ) : (
          recentPayments.map((p) => {
            const linkedDeal = p.prospectKey
              ? deals.find((d) => d.key === p.prospectKey)
              : null;
            const canLink = p.product === "persept" && !p.prospectKey;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 4px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: "var(--ok)",
                    flex: "none",
                  }}
                />
                {linkedDeal ? (
                  <button
                    type="button"
                    onClick={() => onOpenDeal(linkedDeal.key)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      fontSize: 13,
                      color: "var(--ink)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {linkedDeal.company}
                  </button>
                ) : (
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                    {p.name || p.prospectKey || "payment"}
                  </span>
                )}
                <span
                  className="os-mono"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color:
                      p.product === "gyst" ? "var(--accent)" : "var(--soft)",
                    border: `1px solid ${p.product === "gyst" ? "var(--accent)" : "var(--line)"}`,
                    borderRadius: 999,
                    padding: "1px 6px",
                    flex: "none",
                  }}
                >
                  {p.product}
                </span>
                {canLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinking(p.id);
                      setPick("");
                    }}
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 999,
                      border: "1px solid var(--ambink)",
                      background: "transparent",
                      color: "var(--ambink)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    link to prospect
                  </button>
                )}
                <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                  {shortDay(p.paidAt)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  AED {money0(p.amountAed)}
                </span>
              </div>
            );
          })
        )}
      </Section>

      {/* GYST subscriptions */}
      {(gyst || gystSubs.length > 0) && (
        <Section title="GYST subscriptions">
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 10,
              fontSize: 12.5,
            }}
          >
            <Stat label="MRR" value={`AED ${money0(gystMrr(gyst, m.fx))}`} />
            <Stat label="active" value={subCount("active")} />
            <Stat label="trialing" value={subCount("trialing")} />
            <Stat label="past due" value={subCount("past_due")} bad />
            <Stat label="cancelled · 30d" value={cancelled30} />
          </div>
          {gystSubs.slice(0, 20).map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 4px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                {s.name || "—"}
                <span style={{ color: "var(--mute)", marginLeft: 6 }}>
                  {s.email}
                </span>
              </span>
              <span
                className="os-mono"
                style={{
                  fontSize: 9.5,
                  color:
                    s.status === "active"
                      ? "var(--ok)"
                      : s.status === "past_due"
                        ? "var(--bad)"
                        : "var(--mute)",
                }}
              >
                {s.status}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {cur(s.currency)} {money0(s.monthly)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* day-42: prospect picker for linking a payment */}
      {linking && (
        <LinkPicker
          deals={deals}
          query={pick}
          setQuery={setPick}
          onClose={() => setLinking(null)}
          onPick={(key) => {
            onLink(linking, key);
            setLinking(null);
          }}
        />
      )}
    </div>
  );
}

function LinkPicker({
  deals,
  query,
  setQuery,
  onClose,
  onPick,
}: {
  deals: MoneyDeal[];
  query: string;
  setQuery: (q: string) => void;
  onClose: () => void;
  onPick: (key: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const matches = deals
    .filter((d) => !q || d.company.toLowerCase().includes(q))
    .slice(0, 40);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
      }}
    >
      <button
        type="button"
        aria-label="close picker"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          border: "none",
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "relative",
          width: 380,
          maxWidth: "90%",
          maxHeight: "70%",
          display: "flex",
          flexDirection: "column",
          background: "var(--surf)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          boxShadow: "var(--shadow)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            link payment to a prospect
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search by company…"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surf2)",
              color: "var(--ink)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
        <div style={{ overflow: "auto" }}>
          {matches.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12.5, color: "var(--mute)" }}>
              no prospect matches
            </div>
          ) : (
            matches.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onPick(d.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--line)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.company}
                </span>
                <span
                  className="os-mono"
                  style={{ fontSize: 11, color: "var(--mute)", flex: "none" }}
                >
                  {d.stage}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function gystMrr(gyst: MoneyAccount | undefined, fx: number) {
  if (!gyst) return 0;
  let sum = 0;
  for (const [c, v] of Object.entries(gyst.mrr))
    sum += c === "aed" ? v : v * (fx || 3.6725);
  return sum;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        className="os-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--mute)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 12.5, color: "var(--mute)", padding: "6px 4px" }}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  bad,
}: {
  label: string;
  value: string | number;
  bad?: boolean;
}) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: bad && Number(value) > 0 ? "var(--bad)" : "var(--ink)",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{label}</span>
    </span>
  );
}

// ── pipeline ────────────────────────────────────────────────────────────────
