"use client";

import {
  Check,
  ChevronDown,
  Globe,
  Lock,
  MapPin,
  Receipt,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CTAButton } from "@/components/ui/cta-button";

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */

type Currency = "usd" | "aed";

const tiers = [
  {
    name: "Starter",
    badge: null,
    bestFor: "Boutique Hotels & Small Properties (1–75 rooms)",
    audit: { usd: 2500, aed: 9175 },
    setup: { usd: 8000, aed: 29360 },
    monthly: { usd: 3000, aed: 11010 },
    year1: { usd: 49500, aed: 181665 },
    year2: { usd: 36000, aed: 132120 },
    roi: {
      rooms: 50,
      timeSaved: 20000,
      labor: 30000,
      revenue: 15000,
      total: 65000,
      pct: 131,
      payback: "9 months",
    },
    highlights: [
      "All 4 AI agents (Sarah, Marcus, Olivia, Alex)",
      "PMS + POS integration",
      "Dedicated VPS (Dubai / Amsterdam)",
      "Quarterly performance reviews",
      "Email support (24-hr response)",
    ],
  },
  {
    name: "Professional",
    badge: "Most Popular",
    bestFor: "Full-Service Hotels & Mid-Size Properties (76–200 rooms)",
    audit: { usd: 3500, aed: 12850 },
    setup: { usd: 12000, aed: 44040 },
    monthly: { usd: 5000, aed: 18350 },
    year1: { usd: 75500, aed: 277185 },
    year2: { usd: 60000, aed: 220200 },
    roi: {
      rooms: 150,
      timeSaved: 50000,
      labor: 80000,
      revenue: 40000,
      total: 170000,
      pct: 225,
      payback: "5.3 months",
    },
    highlights: [
      "Everything in Starter",
      "Monthly performance reviews",
      "Dedicated Slack channel",
      "Custom escalation rules & workflows",
      "Advanced analytics dashboard",
      "Multi-language optimization",
    ],
  },
  {
    name: "Enterprise",
    badge: null,
    bestFor: "Luxury Hotels, Resorts & Multi-Property Groups (201+ rooms)",
    audit: { usd: 5000, aed: 18350 },
    setup: { usd: 18000, aed: 66060 },
    monthly: { usd: 7500, aed: 27525 },
    year1: { usd: 113000, aed: 414710 },
    year2: { usd: 90000, aed: 330300 },
    roi: {
      rooms: 400,
      timeSaved: 120000,
      labor: 250000,
      revenue: 100000,
      total: 470000,
      pct: 316,
      payback: "3.4 months",
    },
    highlights: [
      "Everything in Professional",
      "Weekly check-ins with account manager",
      "Phone support (4-hr response, 24/7 critical)",
      "Full customization + API access",
      "Multi-property management",
      "99.95% uptime SLA",
    ],
  },
] as const;

const addons = [
  {
    title: "Custom Agent Development",
    price: "Starting at $5,000 per agent",
    desc: "Build specialized agents for unique use cases — spa booking, event coordination, delivery platform management.",
  },
  {
    title: "Multi-Property Management",
    price: "+$2,000/mo per additional property",
    desc: "Centralized management for hotel groups or chains beyond the first property.",
  },
  {
    title: "Premium Integrations",
    price: "$1,500 – $5,000 per integration",
    desc: "Connect to proprietary systems, legacy PMSs, or custom-built software.",
  },
  {
    title: "Extended Training & Onboarding",
    price: "$2,000 one-time",
    desc: "4-hour on-site training session for your team (vs. standard 2-hour virtual).",
  },
];

const comparisonRows: {
  label: string;
  starter: string;
  professional: string;
  enterprise: string;
}[] = [
  {
    label: "Property Size",
    starter: "1–75 rooms",
    professional: "76–200 rooms",
    enterprise: "201+ rooms",
  },
  {
    label: "Year 1 Investment",
    starter: "$49,500",
    professional: "$75,500",
    enterprise: "$113,000",
  },
  {
    label: "All 4 AI Agents",
    starter: "yes",
    professional: "yes",
    enterprise: "yes",
  },
  {
    label: "PMS / POS Integration",
    starter: "yes",
    professional: "yes",
    enterprise: "yes",
  },
  {
    label: "Dedicated VPS",
    starter: "yes",
    professional: "yes",
    enterprise: "yes",
  },
  {
    label: "Performance Reviews",
    starter: "Quarterly",
    professional: "Monthly",
    enterprise: "Weekly",
  },
  {
    label: "Support Channel",
    starter: "Email",
    professional: "Slack",
    enterprise: "Phone + Slack",
  },
  {
    label: "Response Time",
    starter: "24 hours",
    professional: "12 hours",
    enterprise: "4 hours",
  },
  {
    label: "Customization",
    starter: "Standard",
    professional: "Moderate",
    enterprise: "Full",
  },
  {
    label: "Multi-language",
    starter: "Basic",
    professional: "Optimized",
    enterprise: "Advanced",
  },
  {
    label: "Analytics Dashboard",
    starter: "no",
    professional: "yes",
    enterprise: "yes + Predictive",
  },
  {
    label: "Custom Workflows",
    starter: "no",
    professional: "yes",
    enterprise: "yes + API Access",
  },
  {
    label: "Multi-property",
    starter: "no",
    professional: "no",
    enterprise: "yes",
  },
  {
    label: "Dedicated Account Manager",
    starter: "no",
    professional: "no",
    enterprise: "yes",
  },
  {
    label: "SLA Uptime",
    starter: "99.9%",
    professional: "99.9%",
    enterprise: "99.95%",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Is there a setup fee?",
    a: "Yes, the deployment & setup fee covers installation, configuration, PMS/POS integration, training, and go-live support. This is a one-time cost in Year 1.",
  },
  {
    q: "What's included in the audit?",
    a: "The AI Automation Audit is a 2-day on-site or virtual assessment where we analyze your current operations, identify automation opportunities, test your PMS/POS API access, and deliver a 15-page roadmap with ROI projections. If you proceed with deployment, the audit cost is credited toward your setup fee.",
  },
  {
    q: "Can I switch tiers later?",
    a: "Yes! If you start with Starter and later grow, you can upgrade to Professional or Enterprise. We'll adjust pricing and features accordingly.",
  },
  {
    q: "What happens after Year 1?",
    a: "After deployment, you pay only the monthly management fee ($3K, $5K, or $7.5K depending on tier). No additional setup costs unless you request major changes like new integrations or custom agents.",
  },
  {
    q: "What if my PMS isn't supported?",
    a: "We support the major PMSs (Cloudbeds, Mews, Opera, Little Hotelier, Hotelogix, RoomRaccoon). If you use a legacy or custom PMS, we'll assess feasibility during the audit. In most cases, we can integrate via API, email forwarding, or custom connectors.",
  },
  {
    q: "Do I own the infrastructure?",
    a: "Yes. Your VPS (Virtual Private Server) is yours. We manage it, but you own the data and infrastructure. If you ever decide to stop working with us, you can take ownership of the server and agents.",
  },
  {
    q: "Is there a contract?",
    a: "Month-to-month after Year 1. No long-term lock-in. We believe in earning your business every month.",
  },
  {
    q: "What's the cancellation policy?",
    a: "30-day notice. If you're not satisfied within the first 30 days of deployment, we offer a full refund (minus the audit cost).",
  },
  {
    q: "Do you charge commission on bookings?",
    a: "No. Unlike many AI chatbot providers, we charge a flat monthly fee. You keep 100% of your booking revenue.",
  },
  {
    q: "What about data security?",
    a: "Your data is hosted on a secure VPS (Dubai or Amsterdam datacenter) with end-to-end encryption, SOC 2 / ISO 27001 certified datacenters, GDPR, CCPA, UAE data law compliance, and regular backups with disaster recovery.",
  },
];

const trustPoints = [
  {
    icon: Globe,
    title: "Hospitality-Specialized",
    desc: "We're not a generic AI consulting firm. We build specifically for hotels and restaurants.",
  },
  {
    icon: Receipt,
    title: "Transparent Pricing",
    desc: "No hidden fees, no commission on bookings, no surprises. What you see is what you pay.",
  },
  {
    icon: Lock,
    title: "You Own Your Data",
    desc: "Your VPS, your data, your infrastructure. We manage it, but you own it.",
  },
  {
    icon: Shield,
    title: "Proven ROI",
    desc: "Hotels see payback in 3–9 months on average, with 130–300%+ ROI in Year 1.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    desc: "Based in Dubai, we understand UAE hospitality, Arabic language support, and local compliance.",
  },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function CellValue({ value }: { value: string }) {
  if (value === "yes")
    return <Check className="mx-auto h-4 w-4 text-[#b91c1c]" />;
  if (value === "no") return <X className="mx-auto h-4 w-4 text-[#cbd5e1]" />;
  return <span>{value}</span>;
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function TrustBadges() {
  const badges = [
    "No commission on bookings",
    "Own your infrastructure (VPS)",
    "30-day money-back guarantee",
    "99.9% uptime SLA",
  ];
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
      {badges.map((b) => (
        <span
          key={b}
          className="flex items-center gap-2 text-[13px] font-medium text-[#a3a3a3]"
        >
          <Check className="h-3.5 w-3.5 text-[#b91c1c]" />
          {b}
        </span>
      ))}
    </div>
  );
}

function CurrencyToggle({
  currency,
  setCurrency,
}: {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#262626] bg-[#0a0a0a] p-1">
      <button
        type="button"
        onClick={() => setCurrency("usd")}
        className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${currency === "usd" ? "bg-white text-[#0a0a0a]" : "text-[#a3a3a3] hover:text-white"}`}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => setCurrency("aed")}
        className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${currency === "aed" ? "bg-white text-[#0a0a0a]" : "text-[#a3a3a3] hover:text-white"}`}
      >
        AED
      </button>
    </div>
  );
}

function TierCard({
  tier,
  currency,
}: {
  tier: (typeof tiers)[number];
  currency: Currency;
}) {
  const popular = tier.badge !== null;
  const c = currency;
  const sym = c === "usd" ? "$" : "AED ";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${popular ? "border-[#b91c1c] shadow-lg shadow-[#b91c1c]/8" : "border-[#262626]"} bg-[#0a0a0a]`}
    >
      {popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#b91c1c] px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {tier.badge}
        </span>
      )}

      <h3 className="text-[20px] font-bold text-white">{tier.name}</h3>
      <p className="mt-1 text-[13px] text-[#a3a3a3]">{tier.bestFor}</p>

      <div className="mt-6 border-t border-[#262626] pt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold tracking-tight text-white">
            {sym}
            {fmt(tier.monthly[c])}
          </span>
          <span className="text-[14px] text-[#a3a3a3]">/month</span>
        </div>
        <p className="mt-1 text-[12px] text-[#a3a3a3]">
          Year 1 total: {sym}
          {fmt(tier.year1[c])} &middot; Year 2+: {sym}
          {fmt(tier.year2[c])}/yr
        </p>
      </div>

      <div className="mt-5 space-y-1.5 rounded-xl bg-[#111111] p-4 text-[12px] text-[#a3a3a3]">
        <div className="flex justify-between">
          <span>AI Automation Audit</span>
          <span className="font-medium text-white">
            {sym}
            {fmt(tier.audit[c])}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Deployment &amp; Setup</span>
          <span className="font-medium text-white">
            {sym}
            {fmt(tier.setup[c])}
          </span>
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-[13px]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b91c1c]" />
            <span className="text-[#a3a3a3]">{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-[rgba(185,28,28,0.1)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b91c1c]">
          Estimated ROI ({tier.roi.rooms}-room property)
        </p>
        <p className="mt-1 text-[22px] font-bold text-white">
          {tier.roi.pct}% return
        </p>
        <p className="text-[12px] text-[#a3a3a3]">
          Payback in {tier.roi.payback} &middot; ${fmt(tier.roi.total)}/yr value
        </p>
      </div>

      <CTAButton
        variant={popular ? "primary" : "secondary"}
        className="mt-6 w-full justify-center"
      >
        Book Free Consultation
      </CTAButton>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#262626]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-[15px] font-semibold text-white">
          {q}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#a3a3a3] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-[14px] leading-relaxed text-[#a3a3a3]">{a}</p>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("usd");

  return (
    <>
      <Navbar />

      {/* ── Hero ────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#111111] to-[#0a0a0a] py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h1 className="fade-up text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            Transparent Pricing. No Hidden Fees. Cancel Anytime.
          </h1>
          <p className="fade-up delay-1 mt-4 text-[15px] leading-relaxed text-[#a3a3a3]">
            Choose the plan that fits your property. All plans include our full
            AI workforce (Sarah, Marcus, Olivia, Alex), complete PMS/POS
            integration, and ongoing management.
          </p>
          <TrustBadges />
        </div>
      </section>

      {/* ── Pricing Tiers ───────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              Pricing Built for Hotels of Every Size
            </h2>
            <p className="mt-3 text-[15px] text-[#a3a3a3]">
              From boutique properties to luxury resorts, we have a plan that
              scales with your business.
            </p>
            <div className="mt-6">
              <CurrencyToggle currency={currency} setCurrency={setCurrency} />
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-sm gap-6 md:max-w-none md:grid-cols-3">
            {tiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Add-ons ─────────────────────────────────── */}
      <section className="bg-[#111111] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-white">
            Add-On Services
          </h2>
          <p className="mt-2 text-center text-[14px] text-[#a3a3a3]">
            Optional extras to extend your AI workforce.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {addons.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-[#262626] bg-[#0a0a0a] p-6"
              >
                <h3 className="text-[15px] font-bold text-white">
                  {a.title}
                </h3>
                <p className="mt-1 text-[13px] font-semibold text-[#b91c1c]">
                  {a.price}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#a3a3a3]">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-white">
            Plan Comparison
          </h2>
          <p className="mt-2 text-center text-[14px] text-[#a3a3a3]">
            See exactly what's included in every tier.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="pb-3 pr-4 text-left text-[12px] font-semibold uppercase tracking-wide text-[#a3a3a3]">
                    Feature
                  </th>
                  <th className="pb-3 px-4 text-center font-semibold text-white">
                    Starter
                  </th>
                  <th className="pb-3 px-4 text-center font-semibold text-[#b91c1c]">
                    Professional
                  </th>
                  <th className="pb-3 pl-4 text-center font-semibold text-white">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-[#1f1f1f] last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-[#a3a3a3]">
                      {row.label}
                    </td>
                    <td className="py-3 px-4 text-center text-[#a3a3a3]">
                      <CellValue value={row.starter} />
                    </td>
                    <td className="py-3 px-4 text-center text-[#a3a3a3]">
                      <CellValue value={row.professional} />
                    </td>
                    <td className="py-3 pl-4 text-center text-[#a3a3a3]">
                      <CellValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="bg-[#111111] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-white">
            Frequently Asked Questions
          </h2>
          <div className="mt-10">
            {faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ───────────────────────────── */}
      <section className="bg-[#0a0a0a] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-white">
            Why Hotels Choose Persept
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((tp) => (
              <div key={tp.title} className="flex gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(185,28,28,0.1)]">
                  <tp.icon className="h-5 w-5 text-[#b91c1c]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-white">
                    {tp.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#a3a3a3]">
                    {tp.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="bg-[#b91c1c] py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight text-white">
            Ready to Automate Your Hotel Operations?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            Book a free 30-minute consultation to discuss your property's needs
            and get a custom quote.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CTAButton
              variant="secondary"
              size="lg"
              className="border-white/20 bg-[#0a0a0a] text-[#b91c1c] hover:bg-[#0a0a0a]/90"
            >
              Book Free Consultation
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── Not sure section ────────────────────────── */}
      <section className="bg-[#111111] py-16">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[20px] font-bold text-white">
            Not Sure Which Plan is Right for You?
          </h2>
          <p className="mt-2 text-[14px] text-[#a3a3a3]">
            Book a free consultation and we'll help you choose the best tier for
            your property size, budget, and goals.
          </p>
          <CTAButton className="mt-5" size="default">
            Schedule Free Consultation
          </CTAButton>
        </div>
      </section>

      {/* ── Footer notes ────────────────────────────── */}
      <div className="border-t border-[#262626] bg-[#111111] px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-[12px] leading-relaxed text-[#a3a3a3]">
          <p>
            <strong className="text-[#a3a3a3]">Payment Terms:</strong> 50%
            deposit on deployment, 50% on go-live. Monthly fees billed on the
            1st of each month.
          </p>
          <p className="mt-2">
            <strong className="text-[#a3a3a3]">Currency:</strong> Prices shown
            in USD and AED. Invoices issued in USD (AED shown for reference).
            Conversion rate: 3.67 AED/USD.
          </p>
          <p className="mt-2">
            Questions?{" "}
            <a
              href="mailto:khizr@persept.ai"
              className="text-[#b91c1c] hover:underline"
            >
              khizr@persept.ai
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
