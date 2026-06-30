"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  MessageSquare,
  Star,
  CalendarClock,
  BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { LabObject } from "@/components/ui/lab-object";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const AGENTS = [
  {
    icon: MessageSquare,
    t: "Guest communications",
    d: "Answers enquiries, confirmations and requests across channels — instantly, on-brand, around the clock — and hands off to staff when a human is needed.",
  },
  {
    icon: Star,
    t: "Review management",
    d: "Reads, triages and drafts replies to guest reviews, flags recurring issues, and keeps your rating moving in the right direction.",
  },
  {
    icon: CalendarClock,
    t: "Staff scheduling",
    d: "Builds and adjusts rotas against occupancy and demand, fills gaps, and keeps the right people on shift without the spreadsheet juggling.",
  },
  {
    icon: BarChart3,
    t: "Reporting",
    d: "Turns the day's operational data into a clear briefing — occupancy, sentiment, workload — so managers start informed instead of digging.",
  },
];

type Result = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

const RESULTS: Result[] = [
  {
    value: 24,
    suffix: "/7",
    label: "Guest coverage with no night-desk burnout",
  },
  {
    value: 90,
    suffix: "%",
    label: "Of routine guest messages handled automatically",
  },
  {
    value: 4,
    prefix: "×",
    label: "Faster review responses than manual replies",
  },
];

const SPECS = [
  ["Category", "AI Agents · Hospitality"],
  ["Status", "Live · in production"],
  ["Surface", "Ops console"],
  ["Proven with", "Real hotels"],
];

/* ── Live badge ────────────────────────────────────────────────────────── */

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
              <span className="section-index">002</span>&nbsp;&nbsp;Hotel AI
              Workforce
            </span>
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
            Workforce
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
            An AI team for{" "}
            <span className="accent">hospitality operations.</span>
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <p
            className="mt-6 max-w-xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            A set of agents that handle guest communications, review management,
            staff scheduling and reporting — built and proven with real hotels.
            One of the lab's shipped products, running in production today.
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

/* ── Overview ──────────────────────────────────────────────────────────── */

function Overview() {
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
              &nbsp;&nbsp;/&nbsp;&nbsp;Overview
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Hospitality runs on a hundred small jobs.
            </h2>
          </div>
          <div className="max-w-xl">
            <FadeUp>
              <p
                className="text-[clamp(1.1rem,1.8vw,1.4rem)] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                Messages to answer, reviews to reply to, shifts to fill, numbers
                to pull together. Individually trivial — collectively, they
                swallow a team's day and never really stop.
              </p>
              <p
                className="mt-6 text-[15px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                Hotel AI Workforce gives a property a set of always-on agents
                that own those jobs end to end, escalating to staff only when
                judgement is genuinely needed. It's not a chatbot bolted on —
                it's an operating layer the team actually leans on.
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Agents ────────────────────────────────────────────────────────────── */

function Agents() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">002</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;The agents
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Four roles, always on
            </h2>
          </div>
          <p className="mono-label max-w-xs text-right">
            A team that doesn't clock off
          </p>
        </div>

        <StaggerContainer
          className="grid gap-px sm:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
          {AGENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <StaggerItem key={a.t}>
                <div
                  className="lab-card group flex h-full flex-col p-7 sm:p-9"
                  style={{ borderRadius: 0, backgroundColor: "var(--paper)" }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center"
                      style={{
                        border: "1px solid var(--line-strong)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: "var(--ink)" }}
                      />
                    </span>
                    <span className="section-index">{`0${i + 1}`}</span>
                  </div>
                  <h3
                    className="display mt-7"
                    style={{ fontSize: "1.4rem", fontWeight: 600 }}
                  >
                    {a.t}
                  </h3>
                  <p
                    className="mt-3 max-w-md text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {a.d}
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

/* ── Results ───────────────────────────────────────────────────────────── */

function Results() {
  return (
    <section
      className="section grain"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <p className="mono-label mb-4">
          <span className="section-index">003</span>
          &nbsp;&nbsp;/&nbsp;&nbsp;Results
        </p>
        <h2
          className="display mb-14 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
        >
          Proven in real properties
        </h2>

        <div
          className="grid gap-px sm:grid-cols-3"
          style={{ backgroundColor: "var(--line)" }}
        >
          {RESULTS.map((r) => (
            <FadeUp key={r.label}>
              <div className="p-8" style={{ backgroundColor: "var(--paper)" }}>
                <p
                  className="display accent"
                  style={{
                    fontSize: "clamp(2.5rem,6vw,3.75rem)",
                    fontWeight: 600,
                  }}
                >
                  <AnimatedCounter
                    value={r.value}
                    prefix={r.prefix ?? ""}
                    suffix={r.suffix ?? ""}
                  />
                </p>
                <p
                  className="mt-3 max-w-xs text-[14px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {r.label}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <p className="mono-label mt-8" style={{ color: "var(--ink-faint)" }}>
            Figures reflect deployments with partner hotels.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── CTA + next ────────────────────────────────────────────────────────── */

function NextAndCTA() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div
          className="ticked p-10 sm:p-16"
          style={{ border: "1px solid var(--line-strong)" }}
        >
          <p className="mono-label mb-6">Running in production today</p>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.25rem)" }}
          >
            Run your operation
            <br />
            with an AI team.
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

        <div
          className="mt-12 grid gap-px sm:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
          <Link
            href="/projects/gyst"
            className="lab-card group flex items-center justify-between p-7 sm:p-9"
            style={{ borderRadius: 0, backgroundColor: "var(--paper)" }}
          >
            <div>
              <p className="mono-label mb-2">Previous · 001</p>
              <p
                className="display"
                style={{ fontSize: "clamp(1.3rem,2.6vw,1.8rem)" }}
              >
                GYST
              </p>
            </div>
            <ArrowLeft
              className="h-6 w-6 transition-transform duration-300 group-hover:-translate-x-1"
              style={{ color: "var(--ink)" }}
            />
          </Link>
          <Link
            href="/projects/dap"
            className="lab-card group flex items-center justify-between p-7 sm:p-9"
            style={{ borderRadius: 0, backgroundColor: "var(--paper)" }}
          >
            <div>
              <p className="mono-label mb-2">Next · 003</p>
              <p
                className="display"
                style={{ fontSize: "clamp(1.3rem,2.6vw,1.8rem)" }}
              >
                DAP
              </p>
            </div>
            <ArrowRight
              className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1"
              style={{ color: "var(--ink)" }}
            />
          </Link>
        </div>
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
      <Overview />
      <Agents />
      <Results />
      <NextAndCTA />
      <Footer />
    </main>
  );
}
