"use client";

import { ArrowRight, ArrowUpRight, Building2, Compass } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { ConsoleLabel, LiveTag, Sparkline } from "@/components/ui/console";
import { Kicker } from "@/components/ui/editorial";
import { FadeUp } from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

type Project = {
  id: string;
  index: string;
  name: string;
  tagline: string;
  desc: string;
  status: string;
  kind: string;
  href: string;
  cta: string;
  tags: string[];
  metrics: { k: string; v: string }[];
  trend: number[];
  Icon: typeof Building2;
  live?: boolean;
};

const PROJECTS: Project[] = [
  {
    id: "HOTEL",
    index: "01",
    name: "Hotel AI Workforce",
    tagline: "The AI operations team for property hospitality.",
    desc: "Guest messaging, housekeeping dispatch and owner reporting — run 24/7 inside WhatsApp. Persept's flagship service, priced against a salary, not a seat.",
    status: "Flagship service",
    kind: "the service",
    href: "/projects/hotel",
    cta: "Explore the workforce",
    tags: ["AI Agents", "Hospitality", "Service"],
    metrics: [
      { k: "reply time", v: "< 2 min" },
      { k: "on the clock", v: "24/7" },
      { k: "per unit", v: "AED 2.5k" },
    ],
    trend: [6, 5, 7, 4, 5, 3, 2],
    Icon: Building2,
    live: true,
  },
  {
    id: "GYST",
    index: "02",
    name: "GYST",
    tagline: "The whole job search, one guided path.",
    desc: "Search every board, tailor a screening-ready CV to each role, and reach real people who can refer you. A standalone Persept product with its own home.",
    status: "Live product",
    kind: "the product",
    href: "/projects/gyst",
    cta: "Read the story",
    tags: ["AI", "Careers", "Product"],
    metrics: [
      { k: "price", v: "£9.99/mo" },
      { k: "trial", v: "7 days" },
      { k: "surface", v: "web app" },
    ],
    trend: [3, 4, 5, 5, 7, 6, 8],
    Icon: Compass,
    live: true,
  },
];

/* ── Flagship — the lead, given a full-width editorial treatment ────────── */

function FlagshipCard({ p }: { p: Project }) {
  const { Icon } = p;
  return (
    <Link
      href={p.href}
      className="card group relative block overflow-hidden ticked-corners"
    >
      <div className="grid gap-8 p-8 sm:p-11 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-3">
            <span className="icon-tile">
              <Icon className="h-5 w-5" />
            </span>
            {p.live && <LiveTag label={p.status} />}
          </div>

          <h2
            className="display mt-7"
            style={{ fontSize: "clamp(2rem,4.4vw,3.25rem)" }}
          >
            {p.name}
          </h2>
          <p
            className="mt-3 text-[clamp(1.05rem,1.8vw,1.35rem)] leading-snug"
            style={{ color: "var(--ink)", fontWeight: 500 }}
          >
            {p.tagline}
          </p>
          <p
            className="mt-4 max-w-xl text-[15px] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            {p.desc}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-8">
            {p.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            <span
              className="ml-auto inline-flex items-center gap-1.5 text-[14px] font-medium"
              style={{ color: "var(--ink)" }}
            >
              {p.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>

        {/* live micro-metrics — the console echo */}
        <div
          className="flex flex-col justify-between gap-6 rounded-[var(--radius-md)] p-6"
          style={{ background: "var(--paper-2)" }}
        >
          <div
            className="flex items-center justify-between"
            style={{ color: "var(--accent-ink)" }}
          >
            <span className="figure-mark" style={{ fontSize: "2.5rem" }}>
              {p.index}
            </span>
            <Sparkline values={p.trend} width={84} height={28} />
          </div>
          <dl className="kv">
            {p.metrics.map((m) => (
              <div key={m.k}>
                <dt>{m.k}</dt>
                <dd>{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Link>
  );
}

/* ── Product — a strong, distinct standard card ─────────────────────────── */

function ProductCard({ p }: { p: Project }) {
  const { Icon } = p;
  return (
    <Link href={p.href} className="card group flex h-full flex-col p-8 sm:p-11">
      <div className="flex items-center justify-between">
        <span className="icon-tile">
          <Icon className="h-5 w-5" />
        </span>
        {p.live && <LiveTag label={p.status} />}
      </div>

      <h2
        className="display mt-7"
        style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)" }}
      >
        {p.name}
      </h2>
      <p
        className="mt-2 text-[clamp(1rem,1.6vw,1.2rem)] leading-snug"
        style={{ color: "var(--ink)", fontWeight: 500 }}
      >
        {p.tagline}
      </p>
      <p
        className="mt-4 max-w-md text-[14px] leading-relaxed"
        style={{ color: "var(--ink-soft)" }}
      >
        {p.desc}
      </p>

      <dl className="kv mt-7">
        {p.metrics.map((m) => (
          <div key={m.k}>
            <dt>{m.k}</dt>
            <dd>{m.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex items-center justify-between pt-8">
        <div className="flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[14px] font-medium"
          style={{ color: "var(--ink)" }}
        >
          {p.cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative grain aperture-quiet overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div className="shell relative z-[1]">
        <FadeUp>
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Kicker>Persept · what we build</Kicker>
            <span
              aria-hidden="true"
              className="hidden h-3 w-px sm:block"
              style={{ background: "var(--line-strong)" }}
            />
            <LiveTag label="Both live in production" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 600 }}
          >
            One service.
            <br />
            One <span className="accent">product.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.18}>
          <p
            className="mt-7 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Persept leads with one thing done properly — an AI workforce for
            property hospitality — and ships GYST, its own product, alongside
            it. No sprawl. Two things, both real.
          </p>
        </FadeUp>

        <FadeUp delay={0.28}>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex items-baseline gap-2">
                <dt className="mono-label">Flagship service</dt>
                <dd className="section-index text-[14px]">01</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="mono-label">Live product</dt>
                <dd className="section-index text-[14px]">01</dd>
              </div>
            </dl>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Index ─────────────────────────────────────────────────────────────── */

function Index() {
  const flagship = PROJECTS[0];
  const product = PROJECTS[1];

  return (
    <section className="section">
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <ConsoleLabel className="mb-4">The line-up</ConsoleLabel>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              A service and a product
            </h2>
          </div>
          <p className="mono-label max-w-xs text-right">
            Built in Dubai · run in production
          </p>
        </div>

        {/* Flagship gets the full-width lead slot */}
        <FadeUp>
          <FlagshipCard p={flagship} />
        </FadeUp>

        {/* Product sits below, distinct and half-width beside a context note */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <FadeUp delay={0.08}>
            <ProductCard p={product} />
          </FadeUp>

          <FadeUp delay={0.16}>
            <div className="ticked ticked-corners relative flex h-full flex-col justify-between p-8 sm:p-11">
              <div>
                <ConsoleLabel className="mb-4">The shape of it</ConsoleLabel>
                <h3
                  className="display"
                  style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)" }}
                >
                  A service we sell.
                  <br />A product we own.
                </h3>
                <p
                  className="mt-4 max-w-sm text-[15px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  The service is a staffed outcome — agents running an
                  operation, humans making the calls. The product stands on its
                  own two feet. Different jobs, same studio, same bar.
                </p>
              </div>
              <Link
                href="/about"
                className="link-underline mt-8 inline-flex w-fit items-center gap-1.5 text-[14px] font-medium"
                style={{ color: "var(--ink)" }}
              >
                How we build
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────── */

function CTA() {
  return (
    <section
      className="section grain"
      style={{ backgroundColor: "var(--paper-2)" }}
    >
      <div className="shell">
        <div className="ticked ticked-corners relative p-10 sm:p-16">
          <Kicker className="mb-6">Not on the list yet?</Kicker>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.5rem)" }}
          >
            Bring us the
            <br />
            stubborn problem.
          </h2>
          <p
            className="mt-6 max-w-lg text-[15px] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            If it's tedious, broken or expensive — the kind of thing software
            should have fixed already — it belongs on the operation.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/" className="btn-ghost">
              Back to the studio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function ProjectsPage() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Index />
      <CTA />
      <Footer />
    </main>
  );
}
