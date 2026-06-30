"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Search,
  FileText,
  Mail,
  ListChecks,
} from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { LabObject } from "@/components/ui/lab-object";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    t: "Search the roles",
    d: "Browse and filter live openings the way you already do — by title, location, salary and stack. GYST keeps everything in one queue.",
  },
  {
    n: "02",
    t: "AI tailors the application",
    d: "For each job, GYST reads the posting and rewrites your CV and cover letter to match it — the right keywords, the right emphasis, every time.",
  },
  {
    n: "03",
    t: "Apply, faster",
    d: "Review the tailored documents, then send. What used to take an evening per role now takes a couple of minutes.",
  },
];

const FEATURES = [
  {
    icon: Search,
    t: "Smart job search",
    d: "One searchable queue across roles you actually want. Filter, shortlist and triage without twelve open tabs.",
  },
  {
    icon: FileText,
    t: "Auto-tailored CVs",
    d: "A fresh CV generated per job — reordered, reweighted and rephrased to mirror the posting, from a single source profile.",
  },
  {
    icon: Mail,
    t: "Per-job cover letters",
    d: "A specific cover letter for every application that references the company and role, not a find-and-replace template.",
  },
  {
    icon: ListChecks,
    t: "Application tracking",
    d: "Every role, document and status in one board — applied, in review, interview, offer — so nothing slips.",
  },
];

const SPECS = [
  ["Category", "AI · Careers"],
  ["Status", "Flagship · active dev"],
  ["Surface", "Web app"],
  ["Built in", "Dubai"],
];

/* ── Live status badge ─────────────────────────────────────────────────── */

function LiveBadge({ label }: { label: string }) {
  return (
    <span
      className="mono-label inline-flex items-center gap-2 rounded-full px-3 py-1"
      style={{
        border: "1px solid var(--line-strong)",
        color: "var(--accent-ink)",
      }}
    >
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
  const objectY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const objectOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative grain lab-grid overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28"
    >
      {/* 3D accent, pushed right and faded into the paper */}
      <motion.div
        style={{ y: objectY, opacity: objectOpacity }}
        className="pointer-events-none absolute right-[-12%] top-[6%] hidden lg:block"
      >
        <LabObject className="h-[40rem] w-[40rem]" />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, var(--paper) 30%, rgba(244,242,236,0.2) 65%, rgba(244,242,236,0) 100%)",
        }}
      />

      <div className="relative z-[1] shell">
        <FadeUp>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/projects"
              className="link-underline mono-label inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" />
              All projects
            </Link>
            <span
              className="mono-label"
              style={{ color: "var(--line-strong)" }}
            >
              /
            </span>
            <span className="mono-label">
              <span className="section-index">001</span>&nbsp;&nbsp;GYST
            </span>
            <LiveBadge label="Flagship" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display mt-8 max-w-3xl"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)", fontWeight: 600 }}
          >
            GYST
            <span className="cursor-blink accent" style={{ fontWeight: 400 }}>
              _
            </span>
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
            Job search and applications,{" "}
            <span className="accent">on autopilot.</span>
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <p
            className="mt-6 max-w-xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            Search and apply for roles while GYST auto-generates a tailored CV
            and cover letter for every single job — so the busywork disappears
            and you actually apply to more of the roles you want.
          </p>
        </FadeUp>

        <FadeUp delay={0.32}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/projects" className="btn-ghost">
              Back to projects
            </Link>
          </div>
        </FadeUp>

        {/* spec strip */}
        <FadeUp delay={0.4}>
          <dl
            className="mt-16 grid max-w-3xl grid-cols-2 gap-px sm:grid-cols-4"
            style={{ backgroundColor: "var(--line)" }}
          >
            {SPECS.map(([k, v]) => (
              <div
                key={k}
                className="p-4"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <dt className="mono-label">{k}</dt>
                <dd
                  className="mt-2 text-[13px]"
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

/* ── Problem ───────────────────────────────────────────────────────────── */

function Problem() {
  return (
    <section
      className="section"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">001</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;The problem
            </p>
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
                className="text-[clamp(1.1rem,1.8vw,1.4rem)] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                Every posting wants a slightly different version of you. So you
                rewrite the same CV for the hundredth time, draft yet another
                cover letter, and lose an entire evening to three applications.
              </p>
              <p
                className="mt-6 text-[15px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                It's tedious, repetitive and quietly soul-crushing — and because
                it's so much work per role, most people apply to far fewer jobs
                than they should. The friction isn't the search. It's the
                rewriting that happens after it.
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <p className="mono-label mb-4">
          <span className="section-index">002</span>&nbsp;&nbsp;/&nbsp;&nbsp;How
          it works
        </p>
        <h2
          className="display mb-14 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
        >
          Search once. Tailored everywhere.
        </h2>

        <div
          className="grid gap-px lg:grid-cols-3"
          style={{ backgroundColor: "var(--line)" }}
        >
          {STEPS.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.1}>
              <div
                className="flex h-full flex-col p-7 sm:p-9"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="section-index">{step.n}</span>
                  {i < STEPS.length - 1 && (
                    <ArrowRight
                      className="hidden h-4 w-4 lg:block"
                      style={{ color: "var(--ink-faint)" }}
                    />
                  )}
                </div>
                <h3
                  className="display mt-8"
                  style={{ fontSize: "1.45rem", fontWeight: 600 }}
                >
                  {step.t}
                </h3>
                <p
                  className="mt-3 text-[14px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {step.d}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────────────────────── */

function Features() {
  return (
    <section
      className="section"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">003</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Key features
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Built for the whole hunt
            </h2>
          </div>
          <p className="mono-label max-w-xs text-right">
            Four moving parts · one workflow
          </p>
        </div>

        <StaggerContainer
          className="grid gap-px sm:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.t}>
                <div
                  className="lab-card group flex h-full flex-col p-7 sm:p-9"
                  style={{ borderRadius: 0, backgroundColor: "var(--paper)" }}
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center"
                    style={{
                      border: "1px solid var(--line-strong)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--ink)" }} />
                  </span>
                  <h3
                    className="display mt-7"
                    style={{ fontSize: "1.4rem", fontWeight: 600 }}
                  >
                    {f.t}
                  </h3>
                  <p
                    className="mt-3 max-w-md text-[14px] leading-relaxed"
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

/* ── Outcome ───────────────────────────────────────────────────────────── */

function Outcome() {
  return (
    <section
      className="section grain"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="shell">
        <p className="mono-label mb-4">
          <span className="section-index">004</span>&nbsp;&nbsp;/&nbsp;&nbsp;Why
          it matters
        </p>
        <FadeUp>
          <p
            className="display max-w-5xl"
            style={{
              fontSize: "clamp(1.75rem,4.2vw,3.25rem)",
              lineHeight: 1.18,
              fontWeight: 500,
            }}
          >
            When applying takes minutes instead of an evening, you apply to{" "}
            <span className="accent">the roles you'd usually skip</span> — and
            more shots on goal is how good people land better jobs.
          </p>
        </FadeUp>

        <div
          className="mt-16 grid gap-px sm:grid-cols-3"
          style={{ backgroundColor: "var(--line)" }}
        >
          {[
            ["Minutes", "Per application, not an evening"],
            ["Every job", "Gets its own tailored CV + letter"],
            ["One board", "Track every role end to end"],
          ].map(([big, small]) => (
            <FadeUp key={big}>
              <div className="p-8" style={{ backgroundColor: "var(--paper)" }}>
                <p
                  className="display accent"
                  style={{
                    fontSize: "clamp(1.6rem,3vw,2.25rem)",
                    fontWeight: 600,
                  }}
                >
                  {big}
                </p>
                <p
                  className="mt-2 text-[14px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {small}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Next project + CTA ────────────────────────────────────────────────── */

function NextAndCTA() {
  return (
    <section
      className="section"
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
          <p className="mono-label mb-6">GYST is in active development</p>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.25rem)" }}
          >
            Want something like
            <br />
            this for your problem?
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/projects" className="btn-ghost">
              Explore the work
            </Link>
          </div>
        </div>

        {/* next-up link */}
        <Link
          href="/projects/hotel"
          className="lab-card group mt-12 flex items-center justify-between p-7 sm:p-9"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          <div>
            <p className="mono-label mb-2">Next project · 002</p>
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
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Outcome />
      <NextAndCTA />
      <Footer />
    </main>
  );
}
