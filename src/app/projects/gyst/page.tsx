"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  LayoutGrid,
  Mail,
  MessageSquare,
  Search,
  Users,
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

const GYST_URL = "https://startgyst.com";

/* ── Data (from startgyst.com) ─────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    t: "Find",
    d: "One search scans multiple job boards at once and returns real, current roles — UK, Dubai, remote and beyond. No chat, no twelve open tabs.",
  },
  {
    n: "02",
    t: "Track",
    d: "Every saved role becomes a card on a Kanban board — Saved, Materials, Outreach, Applied, Interviewing, Offer. Your whole search in one calm place.",
  },
  {
    n: "03",
    t: "Tailor",
    d: "GYST mixes your profile with the job description to write a CV and cover letter that get past the automated screener. Keyword-aware, one page, seconds.",
  },
  {
    n: "04",
    t: "Apply",
    d: "The application assistant answers the actual questions in your own voice, drawn from your CV and the role — then you apply on the company's own site.",
  },
  {
    n: "05",
    t: "Get seen",
    d: "Find people at the company who can refer you and send a warm intro, so your application arrives with a face instead of vanishing into the void.",
  },
  {
    n: "06",
    t: "Follow up",
    d: "Connect Gmail once. As replies land, GYST reads confirmations, rejections and interview invites and advances each card automatically.",
  },
];

const FEATURES = [
  {
    icon: FileText,
    t: "CV & cover letters",
    d: "Screening-ready documents tailored to each role. Most companies screen with software before a human sees you — GYST clears the screener.",
  },
  {
    icon: MessageSquare,
    t: "Application assistant",
    d: "Answers the real application questions in your own voice, pulled from your profile and the job description.",
  },
  {
    icon: LayoutGrid,
    t: "Kanban board",
    d: "Your entire search as a visual board. Drag a card yourself, or let GYST move it for you as things progress.",
  },
  {
    icon: Users,
    t: "Referral finder",
    d: "Surfaces people inside the company who can refer you, with a warm outreach draft ready to send.",
  },
  {
    icon: Mail,
    t: "Automatic Gmail tracking",
    d: "Reads only email headers to match job-related messages and keeps your board current — never the contents of your emails.",
  },
  {
    icon: Search,
    t: "Multi-board search",
    d: "One search across every board returns real roles. No chatbot, no endless tabs — just the jobs, saved to your board.",
  },
];

const PLAN = [
  "Multi-board AI job search",
  "Kanban application board",
  "Unlimited screening-ready CVs & cover letters",
  "AI application assistant",
  "Referral finder & outreach drafts",
  "Automatic Gmail tracking",
];

const SPECS = [
  ["Category", "AI · Careers"],
  ["Model", "£9.99/mo · 7-day trial"],
  ["Surface", "Web app"],
  ["For", "Students & early-career"],
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
            "linear-gradient(to right, var(--paper) 32%, rgba(246,243,236,0.2) 66%, rgba(246,243,236,0) 100%)",
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
            <span className="mono-label">Our product</span>
            <LiveBadge label="Live" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display mt-8 max-w-3xl"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)", fontWeight: 600 }}
          >
            GYST
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p
            className="mt-4 max-w-2xl text-[clamp(1.25rem,2.6vw,2rem)] leading-snug"
            style={{
              color: "var(--ink)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            The whole job search,{" "}
            <span
              className="rounded-lg px-2"
              style={{ background: "var(--accent)", color: "#14140f" }}
            >
              one guided path.
            </span>
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <p
            className="mt-6 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Search roles, get a CV and cover letter tailored to each, answer the
            application questions in your own voice, and reach real people who
            can refer you. One guided path, not ten open tabs.
          </p>
        </FadeUp>

        <FadeUp delay={0.32}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={GYST_URL} target="_blank" rel="noreferrer" className="btn">
              Start free trial
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href={GYST_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              Visit startgyst.com
            </a>
          </div>
          <p className="mono-label mt-4">7 days free · no card required</p>
        </FadeUp>

        <FadeUp delay={0.4}>
          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
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

/* ── Problem / founder ─────────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Kicker className="mb-4">Why it exists</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Job hunting is a second job.
            </h2>
          </div>
          <div className="max-w-xl">
            <FadeUp>
              <p
                className="text-[clamp(1.15rem,1.8vw,1.45rem)] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                “I built GYST because job hunting as a new grad is brutal —
                endless tabs, generic CVs, and applications that vanish into the
                void. I wanted one place that does it properly: find the role,
                tailor the application, and actually reach a human.”
              </p>
              <p className="mono-label mt-6">
                Khizr Malik · Founder of GYST &amp; Persept
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── The guided path ───────────────────────────────────────────────────── */

function Path() {
  return (
    <section className="section">
      <div className="shell">
        <SectionHead
          n="—"
          kicker="The guided path"
          title="From finding the job to getting it"
          lead="GYST doesn't hand you a pile of tools. It walks you through applying the right way, one step at a time, so you're never left guessing what to do next."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <FadeUp key={s.n}>
              <div className="card flex h-full flex-col p-8">
                <span className="figure-mark" style={{ fontSize: "2.5rem" }}>
                  {s.n}
                </span>
                <h3
                  className="display mt-5"
                  style={{ fontSize: "1.35rem", fontWeight: 600 }}
                >
                  {s.t}
                </h3>
                <p
                  className="mt-3 text-[14px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {s.d}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="panel-dark mt-6 flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <p
                className="display"
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "#f4f4f5",
                }}
              >
                07 · Land it
                <span
                  className="chip ml-3 align-middle"
                  style={{ color: "#14140f", background: "#fdc91b" }}
                >
                  coming soon
                </span>
              </p>
              <p
                className="mt-2 max-w-lg text-[14px] leading-relaxed"
                style={{ color: "rgba(244,244,245,0.7)" }}
              >
                Interview prep built from the role and your answers, so you walk
                in ready.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────────────────────── */

function Features() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Kicker className="mb-4">Features</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Everything you need to apply the right way
            </h2>
          </div>
          <p className="mono-label max-w-xs text-right">
            Built to get you a response
          </p>
        </div>

        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.t}>
                <div className="card group flex h-full flex-col p-8">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3
                    className="display mt-6"
                    style={{ fontSize: "1.3rem", fontWeight: 600 }}
                  >
                    {f.t}
                  </h3>
                  <p
                    className="mt-3 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {f.d}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ── Pricing ───────────────────────────────────────────────────────────── */

function Pricing() {
  return (
    <section className="section">
      <div className="shell">
        <Kicker className="mb-4">Pricing</Kicker>
        <h2
          className="display mb-12 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.8vw,3.5rem)" }}
        >
          One plan. Everything included.
        </h2>

        <div className="panel-dark overflow-hidden p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p
                className="mono-label"
                style={{ color: "rgba(244,244,245,0.6)" }}
              >
                GYST Pro · everything included
              </p>
              <p
                className="display mt-4"
                style={{
                  fontSize: "clamp(2.5rem,6vw,3.75rem)",
                  color: "#f4f4f5",
                }}
              >
                £9.99
                <span
                  className="text-[1.1rem]"
                  style={{ color: "rgba(244,244,245,0.55)" }}
                >
                  {" "}
                  /month
                </span>
              </p>
              <p
                className="mt-2 text-[14px]"
                style={{ color: "rgba(244,244,245,0.7)" }}
              >
                7-day free trial · no card charged during your trial · cancel
                anytime.
              </p>
              <a
                href={GYST_URL}
                target="_blank"
                rel="noreferrer"
                className="btn mt-8"
                style={{
                  background: "#fdc91b",
                  borderColor: "#fdc91b",
                  color: "#14140f",
                }}
              >
                Start free trial
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {PLAN.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "#fdc91b" }}
                  />
                  <span
                    className="text-[14px] leading-snug"
                    style={{ color: "rgba(244,244,245,0.85)" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA + next ────────────────────────────────────────────────────────── */

function NextAndCTA() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <div className="ticked p-10 sm:p-16">
          <Kicker className="mb-6">7 days free · no card required</Kicker>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.25rem)" }}
          >
            Ready to get your
            <br />
            <span className="accent">sh*t together?</span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={GYST_URL} target="_blank" rel="noreferrer" className="btn">
              Start free trial
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link href="/projects/hotel" className="btn-ghost">
              See our flagship service
            </Link>
          </div>
        </div>

        <Link
          href="/projects/hotel"
          className="card group mt-8 flex items-center justify-between p-7 sm:p-9"
        >
          <div>
            <Kicker className="mb-2">Flagship service</Kicker>
            <p
              className="display"
              style={{ fontSize: "clamp(1.4rem,3vw,2rem)" }}
            >
              Hotel AI Workforce
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

export default function GystPage() {
  return (
    <main className="theme-gyst" style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Problem />
      <Path />
      <Features />
      <Pricing />
      <NextAndCTA />
      <Footer />
    </main>
  );
}
