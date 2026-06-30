"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Filter,
  Activity,
  Compass,
} from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const CAPABILITIES = [
  {
    icon: Filter,
    t: "Make the mess legible",
    d: "Pull scattered operational signals — logs, exports, tools that don't talk to each other — into one consistent, queryable shape.",
  },
  {
    icon: Activity,
    t: "Surface what changed",
    d: "Cut through the noise to the few things that actually moved, and the context a team needs to understand why.",
  },
  {
    icon: Compass,
    t: "Point at the decision",
    d: "Stop at a dashboard and you've made another report. DAP carries signal through to a clear, actionable next step.",
  },
];

const SPECS = [
  ["Category", "Data · Tooling"],
  ["Status", "Active · evolving"],
  ["Surface", "Internal tool"],
  ["Built in", "Dubai"],
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
  return (
    <section className="relative grain lab-grid overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="shell">
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
              <span className="section-index">003</span>&nbsp;&nbsp;DAP
            </span>
            <LiveBadge label="Active" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display mt-8 max-w-3xl"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)", fontWeight: 600 }}
          >
            DAP
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
            Data, <span className="accent">applied.</span>
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <p
            className="mt-6 max-w-xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            An applied-data product that turns messy operational signals into
            decisions teams can act on. It's an active experiment in the lab —
            sharpening as we learn what makes data genuinely useful at the point
            of action.
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
              Most teams are data-rich and decision-poor.
            </h2>
          </div>
          <div className="max-w-xl">
            <FadeUp>
              <p
                className="text-[clamp(1.1rem,1.8vw,1.4rem)] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                The numbers exist — they're just scattered, inconsistent and a
                chore to read. So the signal that should drive a decision sits
                buried under everything that doesn't.
              </p>
              <p
                className="mt-6 text-[15px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                DAP is our take on closing that gap: less a dashboard, more a
                path from raw operational noise to the specific thing worth
                doing next.
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── What it does ──────────────────────────────────────────────────────── */

function WhatItDoes() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <p className="mono-label mb-4">
          <span className="section-index">002</span>
          &nbsp;&nbsp;/&nbsp;&nbsp;What it does
        </p>
        <h2
          className="display mb-14 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
        >
          From signal to decision
        </h2>

        <StaggerContainer
          className="grid gap-px lg:grid-cols-3"
          style={{ backgroundColor: "var(--line)" }}
        >
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <StaggerItem key={c.t}>
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
      </div>
    </section>
  );
}

/* ── Status ────────────────────────────────────────────────────────────── */

function Status() {
  return (
    <section
      className="section grain"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">003</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Status
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              Active, and still evolving.
            </h2>
          </div>
          <div className="max-w-xl">
            <FadeUp>
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                DAP is one of the lab's live experiments. The thesis is set; the
                surface is still being shaped against real use. We're
                deliberately keeping it lean — proving the path from messy data
                to acted-on decision before we widen its scope.
              </p>
            </FadeUp>

            <FadeUp delay={0.1}>
              <ul
                className="mt-8 flex flex-col gap-px"
                style={{ backgroundColor: "var(--line)" }}
              >
                {[
                  [
                    "Thesis",
                    "Locked — data should end in a decision, not a chart",
                  ],
                  [
                    "In progress",
                    "Connectors, signal detection, decision surfaces",
                  ],
                  ["Exploring", "How far to push from insight into action"],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6"
                    style={{ backgroundColor: "var(--paper)" }}
                  >
                    <span className="mono-label sm:w-32 sm:shrink-0">{k}</span>
                    <span
                      className="text-[14px]"
                      style={{ color: "var(--ink)" }}
                    >
                      {v}
                    </span>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA + nav ─────────────────────────────────────────────────────────── */

function NextAndCTA() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div
          className="ticked p-10 sm:p-16"
          style={{ border: "1px solid var(--line-strong)" }}
        >
          <p className="mono-label mb-6">A lab experiment in the open</p>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.25rem)" }}
          >
            Drowning in data,
            <br />
            short on decisions?
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

        <Link
          href="/projects/gyst"
          className="lab-card group mt-12 flex items-center justify-between p-7 sm:p-9"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          <div>
            <p className="mono-label mb-2">Back to the flagship · 001</p>
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

export default function DapPage() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Overview />
      <WhatItDoes />
      <Status />
      <NextAndCTA />
      <Footer />
    </main>
  );
}
