"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
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
    id: "GYST",
    index: "001",
    name: "GYST",
    tagline: "Job search & applications, on autopilot.",
    desc: "Search and apply for roles while GYST auto-generates a tailored CV and cover letter for every single job.",
    status: "Flagship",
    href: "/projects/gyst",
    tags: ["AI", "Careers", "Automation"],
    live: true,
  },
  {
    id: "HOTEL",
    index: "002",
    name: "Hotel AI Workforce",
    tagline: "An AI team for hospitality operations.",
    desc: "Agents that handle guest comms, reviews, scheduling and reporting — built and proven with real hotels.",
    status: "Live",
    href: "/projects/hotel",
    tags: ["AI Agents", "Hospitality"],
    live: true,
  },
  {
    id: "DAP",
    index: "003",
    name: "DAP",
    tagline: "Data, applied.",
    desc: "An applied-data product turning messy operational signals into decisions teams can act on.",
    status: "Active",
    href: "/projects/dap",
    tags: ["Data", "Tooling"],
    live: true,
  },
  {
    id: "NEXT",
    index: "004",
    name: "In the lab",
    tagline: "The next problem worth solving.",
    desc: "We're always prototyping. New experiments move from whiteboard to working software here.",
    status: "Coming soon",
    href: "/projects",
    tags: ["Prototype"],
    comingSoon: true,
  },
];

/* ── Live status dot ───────────────────────────────────────────────────── */

function StatusBadge({ status, live }: { status: string; live?: boolean }) {
  return (
    <span
      className="mono-label inline-flex items-center gap-2 rounded-full px-3 py-1"
      style={{
        border: "1px solid var(--line-strong)",
        color: live ? "var(--accent-ink)" : "var(--ink-faint)",
      }}
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
    <div
      className="lab-card group flex h-full flex-col p-7 sm:p-9"
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-center justify-between">
        <span className="section-index">{p.index}</span>
        <StatusBadge status={p.status} live={p.live} />
      </div>

      <h2
        className="display mt-8"
        style={{ fontSize: "clamp(1.6rem,3vw,2.25rem)" }}
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
            <span
              key={t}
              className="mono-label px-2.5 py-1"
              style={{ border: "1px solid var(--line)", fontSize: "0.5625rem" }}
            >
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
    return <div style={{ backgroundColor: "var(--paper)" }}>{inner}</div>;
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
    <section className="relative grain lab-grid overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="shell">
        <FadeUp>
          <p className="mono-label mb-6">
            <span className="section-index">000</span>
            &nbsp;&nbsp;/&nbsp;&nbsp;Projects&nbsp;&nbsp;/&nbsp;&nbsp;Index
          </p>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 600 }}
          >
            The work,
            <br />
            on the bench
            <span className="cursor-blink accent" style={{ fontWeight: 400 }}>
              _
            </span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.18}>
          <p
            className="mt-7 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            We're a small lab building several products at once. Some have
            shipped, some are in active development, and there's always one more
            taking shape. Here's everything currently on the table.
          </p>
        </FadeUp>

        <FadeUp delay={0.28}>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-6">
              <span className="mono-label">
                <span className="accent">03</span> shipped &amp; active
              </span>
              <span className="mono-label">
                <span className="accent">01</span> in the lab
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
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">001</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;The index
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Four entries
            </h2>
          </div>
          <p className="mono-label max-w-xs text-right">
            Problems in · Products out
          </p>
        </div>

        <div
          className="grid gap-px md:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
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
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div
          className="ticked p-10 sm:p-16"
          style={{ border: "1px solid var(--line-strong)" }}
        >
          <p className="mono-label mb-6">Not on the list yet?</p>
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
