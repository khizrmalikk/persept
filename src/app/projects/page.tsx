"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
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
  href: string;
  tags: string[];
  live?: boolean;
  comingSoon?: boolean;
};

const PROJECTS: Project[] = [
  {
    id: "HOTEL",
    index: "01",
    name: "Hotel AI Workforce",
    tagline: "The AI operations team for property hospitality.",
    desc: "Guest messaging, housekeeping dispatch and owner reporting — run 24/7 inside WhatsApp. Persept's flagship service, priced against a salary.",
    status: "Flagship service",
    href: "/projects/hotel",
    tags: ["AI Agents", "Hospitality", "Service"],
    live: true,
  },
  {
    id: "GYST",
    index: "02",
    name: "GYST",
    tagline: "The whole job search, one guided path.",
    desc: "Search every board, tailor a screening-ready CV to each role, and reach real people who can refer you. A standalone Persept product.",
    status: "Live product",
    href: "/projects/gyst",
    tags: ["AI", "Careers", "Product"],
    live: true,
  },
];

/* ── Live status dot ───────────────────────────────────────────────────── */

function StatusBadge({ status, live }: { status: string; live?: boolean }) {
  return (
    <span
      className="chip"
      style={{ color: live ? "var(--accent-ink)" : "var(--ink-faint)" }}
    >
      {live && (
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
      )}
      {status}
    </span>
  );
}

/* ── Project card ──────────────────────────────────────────────────────── */

function ProjectCard({ p }: { p: Project }) {
  const inner = (
    <div className="card group flex h-full flex-col p-8 sm:p-10">
      <div className="flex items-center justify-between">
        <span className="figure-mark" style={{ fontSize: "2.5rem" }}>
          {p.index}
        </span>
        <StatusBadge status={p.status} live={p.live} />
      </div>

      <h2
        className="display mt-8"
        style={{ fontSize: "clamp(1.7rem,3vw,2.4rem)" }}
      >
        {p.name}
      </h2>
      <p className="mt-2 text-[15px]" style={{ color: "var(--ink-soft)" }}>
        {p.tagline}
      </p>
      <p
        className="mt-5 max-w-md text-[14px] leading-relaxed"
        style={{ color: "var(--ink-soft)" }}
      >
        {p.desc}
      </p>

      <div className="mt-auto flex items-center justify-between pt-8">
        <div className="flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        {!p.comingSoon && (
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: "var(--ink)" }}
          />
        )}
      </div>
    </div>
  );

  if (p.comingSoon) {
    return <div>{inner}</div>;
  }

  return (
    <Link href={p.href} className="block h-full">
      {inner}
    </Link>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative grain aperture-quiet overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="shell relative z-[1]">
        <FadeUp>
          <Kicker className="mb-6">Persept · what we build</Kicker>
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
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-5">
              <span className="mono-label">
                <span className="accent">01</span> flagship service
              </span>
              <span className="mono-label">
                <span className="accent">01</span> live product
              </span>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Index ─────────────────────────────────────────────────────────────── */

function Index() {
  return (
    <section className="section">
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker className="mb-4">The line-up</Kicker>
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

        <div className="grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <FadeUp key={p.id} delay={(i % 2) * 0.08}>
              <ProjectCard p={p} />
            </FadeUp>
          ))}
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
        <div className="ticked p-10 sm:p-16">
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
            should have fixed already — it belongs in the lab.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/" className="btn-ghost">
              Back to the lab
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
