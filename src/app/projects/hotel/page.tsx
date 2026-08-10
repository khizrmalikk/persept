"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Landmark,
  MessageSquare,
  Plane,
  Plug,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { ApertureField } from "@/components/ui/aperture-field";
import { Kicker } from "@/components/ui/editorial";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const AGENTS = [
  {
    icon: MessageSquare,
    t: "Guest Agent",
    d: "Answers every guest in minutes, 24/7. Questions, requests and check-in flows across OTA inboxes and WhatsApp — in the operator's voice.",
  },
  {
    icon: Wrench,
    t: "Ops Dispatcher",
    d: "Schedules cleaning between stays, dispatches maintenance, chases vendors until they confirm, and escalates whatever stalls.",
  },
  {
    icon: FileText,
    t: "Reporting Agent",
    d: "Daily ops digest for the team and monthly owner statements. Generated, checked and delivered on the 1st, every month.",
  },
];

const PROBLEMS = [
  {
    t: "A messaging avalanche, around the clock",
    d: "A 50-unit operator fields 3,000 to 6,000 guest messages a month across Airbnb, Booking.com and WhatsApp. Guests expect answers in minutes — at 3am too.",
  },
  {
    t: "Solved today by hiring, again and again",
    d: "Operators keep 2 or 3 guest-experience staff (AED 15-25k a month) just to keep up, and rehire every time the portfolio grows. Margins absorb every new unit.",
  },
  {
    t: "Response time is revenue",
    d: "Slow replies become worse reviews, lower search ranking and lower occupancy. The inbox is not admin work — it is the sales channel.",
  },
];

const PROBLEM_STATS = [
  ["24/7", "guest response expectation no operator staffs profitably"],
  ["AED 15-25k", "monthly ops payroll at ~50 units, before a single upsell"],
  ["60-70%", "of the workload is repetitive, rules-based and automatable"],
];

const STACK = [
  {
    label: "Guest channels",
    icon: Smartphone,
    items: [
      "Airbnb, Booking.com and Vrbo via the operator's channel manager (Hostaway / Guesty APIs)",
      "Direct guests on the operator's WhatsApp number (official Business API)",
    ],
  },
  {
    label: "Persept agent workforce",
    icon: Plug,
    dark: true,
    items: [
      "Guest, Ops and Reporting agents share one per-client knowledge base — unit guides, house rules, permit data",
      "One isolated deployment per client. No shared infrastructure, no shared data, allowlisted actions only",
    ],
  },
  {
    label: "Operator & owners",
    icon: Users,
    items: [
      "Ops team approves escalations with one tap in their WhatsApp group",
      "Owners receive digests, occupancy snapshots and monthly statements",
    ],
  },
];

const ASSURANCES = [
  "Official WhatsApp Business API, never unofficial bridges",
  "Open channel-manager APIs — no OTA scraping, no ToS risk",
  "Injection-hardened: guest messages are data, never instructions",
];

const CURVES = [
  {
    icon: Zap,
    t: "Agents just became reliable",
    d: "2025-26 is the inflection where agent frameworks matured from demos into dependable workers. The capability exists; the vertical operating layer for hospitality doesn't yet. That gap is the company.",
  },
  {
    icon: Plane,
    t: "Dubai tourism is compounding",
    d: "21 million international visitors in 2025, with short-term rental supply growing roughly 40% year on year. Every new unit adds messaging load operators currently solve with headcount.",
  },
  {
    icon: Landmark,
    t: "Regulation favours professionals",
    d: "Dubai's DET permit regime keeps tightening, pushing units toward licensed, professional operators — exactly the customers who feel ops pain and can pay to fix it.",
  },
];

const TIERS = [
  ["Starter", "up to 25 units", "AED 2,500"],
  ["Growth", "26-75 units", "AED 5,500"],
  ["Scale", "76-150 units", "AED 9,500"],
  ["Enterprise", "150+ units", "custom"],
];

const SPECS = [
  ["Category", "AI Agents · Hospitality"],
  ["Model", "Staffed outcome, per unit"],
  ["Surface", "WhatsApp + channel managers"],
  ["Built in", "Dubai"],
];

/* ── Live badge ────────────────────────────────────────────────────────── */

function LiveBadge({ label }: { label: string }) {
  return (
    <span className="chip" style={{ color: "var(--accent-ink)" }}>
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: "var(--accent)" }}
        />
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
        />
      </span>
      {label}
    </span>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const fieldY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const fieldOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative grain overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28"
    >
      <motion.div
        style={{ y: fieldY, opacity: fieldOpacity }}
        className="pointer-events-none absolute top-[-6%] right-[-14%] hidden h-[46rem] w-[46rem] lg:block"
      >
        <ApertureField className="h-full w-full" />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, var(--paper) 32%, rgba(247,242,234,0.2) 66%, rgba(247,242,234,0) 100%)",
        }}
      />

      <div className="relative z-[1] shell">
        <FadeUp>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/projects"
              className="link-underline text-[14px]"
              style={{ color: "var(--ink-soft)" }}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                All work
              </span>
            </Link>
            <span style={{ color: "var(--line-strong)" }}>·</span>
            <span className="mono-label">Flagship service</span>
            <LiveBadge label="Live" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display mt-8 max-w-4xl"
            style={{ fontSize: "clamp(2.5rem, 7.5vw, 6rem)", fontWeight: 600 }}
          >
            Hotel AI
            <br />
            <span className="display-light">Workforce</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p
            className="mt-5 max-w-2xl text-[clamp(1.25rem,2.6vw,2rem)] leading-snug"
            style={{
              color: "var(--ink)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            The AI operations team for{" "}
            <span className="accent">property hospitality.</span>
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <p
            className="mt-6 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            AI agent workforces that run guest messaging, housekeeping dispatch
            and owner reporting for Dubai's holiday-home operators. Around the
            clock, inside WhatsApp — no new software for anyone to learn.
          </p>
        </FadeUp>

        <FadeUp delay={0.32}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/contact" className="btn">
              Book a workforce
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#pricing" className="btn-ghost">
              See pricing
            </Link>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {SPECS.map(([k, v]) => (
              <div key={k} className="card p-5">
                <dt className="mono-label">{k}</dt>
                <dd
                  className="mt-2 text-[14px] leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Section heading helper ────────────────────────────────────────────── */

function SectionHead({
  n,
  kicker,
  title,
  lead,
}: {
  n: string;
  kicker: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
      <span className="figure-mark shrink-0">{n}</span>
      <div className="max-w-3xl">
        <Kicker className="mb-4">{kicker}</Kicker>
        <h2
          className="display"
          style={{ fontSize: "clamp(2rem,4.8vw,3.5rem)" }}
        >
          {title}
        </h2>
        {lead && (
          <p
            className="mt-4 max-w-2xl text-[15px] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Problem ───────────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <SectionHead
          n="01"
          kicker="The problem"
          title="Guest operations don't scale. People do the scaling."
        />

        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="flex flex-col">
            {PROBLEMS.map((p, i) => (
              <FadeUp key={p.t}>
                <div className={i > 0 ? "pt-8" : ""}>
                  {i > 0 && <hr className="rule-soft mb-8" />}
                  <h3
                    className="display"
                    style={{ fontSize: "1.35rem", fontWeight: 600 }}
                  >
                    {p.t}
                  </h3>
                  <p
                    className="mt-3 text-[15px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {p.d}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div className="panel-dark flex h-full flex-col justify-center gap-8 p-8 sm:p-10">
              {PROBLEM_STATS.map(([big, small]) => (
                <div key={big}>
                  <p
                    className="display"
                    style={{
                      fontSize: "clamp(2rem,4vw,2.75rem)",
                      fontWeight: 600,
                      color: "#f4f2ea",
                    }}
                  >
                    {big}
                  </p>
                  <p
                    className="mt-1 text-[13px] leading-relaxed"
                    style={{ color: "rgba(236,231,219,0.7)" }}
                  >
                    {small}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ── Solution / agents ─────────────────────────────────────────────────── */

function Solution() {
  return (
    <section className="section">
      <div className="shell">
        <SectionHead
          n="02"
          kicker="The solution"
          title="An AI workforce, embedded where the work already happens"
          lead="No new software for anyone to learn. Guests, staff and owners keep the channels they already use. Persept's agents do the work behind them."
        />

        <StaggerContainer className="grid gap-5 lg:grid-cols-3">
          {AGENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <StaggerItem key={a.t}>
                <div className="card group flex h-full flex-col p-8 sm:p-9">
                  <div className="flex items-center justify-between">
                    <span className="icon-tile">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className="figure-mark"
                      style={{ fontSize: "2.25rem" }}
                    >
                      {`0${i + 1}`}
                    </span>
                  </div>
                  <h3
                    className="display mt-7"
                    style={{ fontSize: "1.45rem", fontWeight: 600 }}
                  >
                    {a.t}
                  </h3>
                  <p
                    className="mt-3 text-[15px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {a.d}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeUp>
          <div className="panel-dark mt-6 flex items-start gap-4 p-7 sm:p-8">
            <ShieldCheck
              className="mt-0.5 h-6 w-6 shrink-0"
              style={{ color: "#fdc91b" }}
            />
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "#ece7db" }}
            >
              <span style={{ color: "#f4f2ea", fontWeight: 600 }}>
                Humans stay in command.
              </span>{" "}
              Anything touching money, door codes or disputes always escalates
              to staff for one-tap approval in their WhatsApp ops group. The
              agents handle the volume; people make the judgement calls.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <SectionHead
          n="03"
          kicker="How it works"
          title="Plugged into the operator's existing stack, legitimately"
        />

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {STACK.map((col) => {
            const Icon = col.icon;
            return (
              <FadeUp key={col.label}>
                <div
                  className={`flex h-full flex-col p-8 ${col.dark ? "panel-dark" : "card"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-5 w-5"
                      style={{
                        color: col.dark ? "#fdc91b" : "var(--accent-ink)",
                      }}
                    />
                    <p
                      className="mono-label"
                      style={
                        col.dark
                          ? { color: "rgba(236,231,219,0.7)" }
                          : undefined
                      }
                    >
                      {col.label}
                    </p>
                  </div>
                  <ul className="mt-6 flex flex-col gap-4">
                    {col.items.map((it) => (
                      <li
                        key={it}
                        className="text-[14px] leading-relaxed"
                        style={{
                          color: col.dark
                            ? "rgba(236,231,219,0.82)"
                            : "var(--ink-soft)",
                        }}
                      >
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {ASSURANCES.map((a) => (
            <FadeUp key={a}>
              <div className="card flex items-start gap-3 p-6">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {a}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why now ────────────────────────────────────────────────────────────── */

function WhyNow() {
  return (
    <section className="section">
      <div className="shell">
        <SectionHead
          n="04"
          kicker="Why now"
          title="Three curves crossing at once"
        />

        <StaggerContainer className="grid gap-5 lg:grid-cols-3">
          {CURVES.map((c) => {
            const Icon = c.icon;
            return (
              <StaggerItem key={c.t}>
                <div className="card flex h-full flex-col p-8 sm:p-9">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3
                    className="display mt-7"
                    style={{ fontSize: "1.3rem", fontWeight: 600 }}
                  >
                    {c.t}
                  </h3>
                  <p
                    className="mt-3 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {c.d}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeUp>
          <div className="ticked mt-6 p-7 sm:p-9">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "var(--ink)" }}
            >
              <span style={{ fontWeight: 600 }}>Founder advantage:</span> we run
              our own AI agent workforce daily. This product is the operating
              playbook we already live, applied to an industry that needs it.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Pricing ───────────────────────────────────────────────────────────── */

function Pricing() {
  return (
    <section
      id="pricing"
      className="section grain"
      style={{ backgroundColor: "var(--paper-2)" }}
    >
      <div className="shell">
        <SectionHead
          n="05"
          kicker="Pricing"
          title="Priced per unit, anchored against a salary"
          lead="One ops hire costs AED 5-8k a month plus visa, and works 8 hours. Persept costs less than one hire and works 24/7."
        />

        <div
          className="overflow-hidden"
          style={{
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            background: "var(--paper)",
          }}
        >
          <div className="panel-dark grid grid-cols-[1fr_1fr_auto] gap-4 rounded-none px-6 py-4 sm:px-8">
            <span
              className="mono-label"
              style={{ color: "rgba(236,231,219,0.6)" }}
            >
              Tier
            </span>
            <span
              className="mono-label"
              style={{ color: "rgba(236,231,219,0.6)" }}
            >
              Portfolio size
            </span>
            <span
              className="mono-label text-right"
              style={{ color: "rgba(236,231,219,0.6)" }}
            >
              Monthly
            </span>
          </div>
          {TIERS.map(([tier, size, price], i) => (
            <div
              key={tier}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 px-6 py-5 sm:px-8"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--line)",
              }}
            >
              <span
                className="display"
                style={{ fontSize: "1.1rem", fontWeight: 600 }}
              >
                {tier}
              </span>
              <span
                className="text-[14px]"
                style={{ color: "var(--ink-soft)" }}
              >
                {size}
              </span>
              <span
                className="text-right text-[15px]"
                style={{ color: "var(--accent-ink)", fontWeight: 600 }}
              >
                {price}
              </span>
            </div>
          ))}
        </div>

        <p className="mono-label mt-6" style={{ color: "var(--ink-faint)" }}>
          + AED 5-10k one-time onboarding: integration, knowledge-base build,
          playbook design, two-week tuning · 80-90% gross margin
        </p>
      </div>
    </section>
  );
}

/* ── CTA + next ────────────────────────────────────────────────────────── */

function NextAndCTA() {
  return (
    <section className="section">
      <div className="shell">
        <div className="ticked p-10 sm:p-16">
          <Kicker className="mb-6">
            Profitable from the first handful of clients
          </Kicker>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.25rem)" }}
          >
            Put an AI workforce
            <br />
            on your <span className="accent">units.</span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn">
              Book a workforce
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/projects/gyst" className="btn-ghost">
              See our product, GYST
            </Link>
          </div>
        </div>

        <Link
          href="/projects/gyst"
          className="card group mt-8 flex items-center justify-between p-7 sm:p-9"
        >
          <div>
            <Kicker className="mb-2">Our product</Kicker>
            <p
              className="display"
              style={{ fontSize: "clamp(1.4rem,3vw,2rem)" }}
            >
              GYST
            </p>
          </div>
          <ArrowRight
            className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: "var(--ink)" }}
          />
        </Link>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function HotelPage() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <WhyNow />
      <Pricing />
      <NextAndCTA />
      <Footer />
    </main>
  );
}
