"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { LabObject } from "@/components/ui/lab-object";
import { FadeUp } from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const PROJECTS = [
  {
    id: "GYST",
    index: "001",
    name: "GYST",
    tagline: "Job search & applications, on autopilot.",
    desc: "Search and apply for roles while GYST auto-generates a tailored CV and cover letter for every single job.",
    status: "Flagship",
    href: "/projects/gyst",
    tags: ["AI", "Careers", "Automation"],
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
  },
];

const PROCESS = [
  {
    n: "01",
    t: "Find the friction",
    d: "We start with a real, painful problem — not a feature looking for a use.",
  },
  {
    n: "02",
    t: "Prototype fast",
    d: "A working prototype in days. We learn by building, not by speccing.",
  },
  {
    n: "03",
    t: "Ship & sharpen",
    d: "Put it in real hands, measure, and refine until it earns its place.",
  },
  {
    n: "04",
    t: "Scale what works",
    d: "Proven prototypes graduate into products with their own home.",
  },
];

const TICKER = [
  "AI Agents",
  "Applied ML",
  "Automation",
  "Product Design",
  "Rapid Prototyping",
  "Full-stack",
  "3D / WebGL",
  "Data Tooling",
];

/* ── Word-by-word scroll reveal ────────────────────────────────────────── */

function RevealWord({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {children}&nbsp;
    </motion.span>
  );
}

function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.25"],
  });

  const text =
    "Persept is a software innovation lab. We take real problems — the tedious, the broken, the expensive — and turn them into products worth shipping.";
  const tokens = text.split(" ").map((word, i, arr) => ({
    word,
    id: i,
    range: [i / arr.length, (i + 1) / arr.length] as [number, number],
  }));

  return (
    <section
      ref={ref}
      className="section"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="shell">
        <p className="mono-label mb-8">
          <span className="section-index">002</span>
          &nbsp;&nbsp;/&nbsp;&nbsp;Manifesto
        </p>
        <p
          className="display max-w-5xl"
          style={{
            fontSize: "clamp(1.75rem, 4.2vw, 3.5rem)",
            lineHeight: 1.18,
            fontWeight: 500,
          }}
        >
          {tokens.map((t) => (
            <RevealWord key={t.id} progress={scrollYProgress} range={t.range}>
              {t.word}
            </RevealWord>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const objectY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const objectScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative grain lab-grid min-h-[100svh] overflow-hidden"
    >
      {/* 3D centerpiece */}
      <motion.div
        style={{ y: objectY, scale: objectScale }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <LabObject className="h-[min(78vh,720px)] w-[min(92vw,720px)]" />
      </motion.div>

      {/* paper vignette so text stays legible over the object */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(244,242,236,0) 38%, rgba(244,242,236,0.78) 78%)",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-[1] flex min-h-[100svh] flex-col justify-center"
      >
        <div className="shell">
          <FadeUp>
            <p className="mono-label mb-6">
              <span className="section-index">001</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Software Innovation Lab
            </p>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1
              className="display max-w-4xl"
              style={{
                fontSize: "clamp(2.75rem, 8.5vw, 7rem)",
                fontWeight: 600,
              }}
            >
              We turn problems
              <br />
              into <span className="accent">software</span>
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
              A lab where a small team builds products that solve real, stubborn
              problems. GYST is the first. More are taking shape.
            </p>
          </FadeUp>

          <FadeUp delay={0.28}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/projects" className="btn">
                See the work
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/contact" className="btn-ghost">
                Start a project
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* scroll cue */}
        <div className="shell absolute inset-x-0 bottom-8">
          <div
            className="flex items-center gap-3"
            style={{ color: "var(--ink-faint)" }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.div>
            <span className="mono-label">Scroll to explore</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Ticker ────────────────────────────────────────────────────────────── */

function Ticker() {
  const items = [...TICKER, ...TICKER].map((label, i) => ({ label, id: i }));
  return (
    <div
      className="overflow-hidden py-5"
      style={{
        borderBlock: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="marquee-track">
        {items.map((item) => (
          <span key={item.id} className="mx-8 inline-flex items-center gap-8">
            <span className="mono-label" style={{ color: "var(--ink-soft)" }}>
              {item.label}
            </span>
            <span style={{ color: "var(--accent)" }}>✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Projects ──────────────────────────────────────────────────────────── */

function Projects() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label mb-4">
              <span className="section-index">003</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Selected work
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              What's in the lab
            </h2>
          </div>
          <Link
            href="/projects"
            className="link-underline mono-label"
            style={{ color: "var(--ink)" }}
          >
            View all projects →
          </Link>
        </div>

        <div
          className="grid gap-px md:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
          {PROJECTS.map((p, i) => (
            <FadeUp key={p.id} delay={(i % 2) * 0.08}>
              <Link
                href={p.href}
                className="lab-card group flex h-full flex-col p-7 sm:p-9"
                style={{ borderRadius: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="section-index">{p.index}</span>
                  <span
                    className="mono-label rounded-full px-3 py-1"
                    style={{
                      border: "1px solid var(--line-strong)",
                      color:
                        p.status === "Coming soon"
                          ? "var(--ink-faint)"
                          : "var(--accent-ink)",
                    }}
                  >
                    {p.status}
                  </span>
                </div>

                <h3
                  className="display mt-8"
                  style={{ fontSize: "clamp(1.6rem,3vw,2.25rem)" }}
                >
                  {p.name}
                </h3>
                <p
                  className="mt-2 text-[15px]"
                  style={{ color: "var(--ink-soft)" }}
                >
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
                        style={{
                          border: "1px solid var(--line)",
                          fontSize: "0.5625rem",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: "var(--ink)" }}
                  />
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Process ───────────────────────────────────────────────────────────── */

function Process() {
  return (
    <section
      className="section"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <p className="mono-label mb-4">
          <span className="section-index">004</span>&nbsp;&nbsp;/&nbsp;&nbsp;How
          we build
        </p>
        <h2
          className="display mb-14 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
        >
          A method, not a pitch deck
        </h2>

        <div
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ backgroundColor: "var(--line)" }}
        >
          {PROCESS.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.08}>
              <div
                className="flex h-full flex-col p-7"
                style={{ backgroundColor: "var(--paper-2)" }}
              >
                <span className="section-index">{step.n}</span>
                <h3
                  className="display mt-6"
                  style={{ fontSize: "1.35rem", fontWeight: 600 }}
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

/* ── CTA ───────────────────────────────────────────────────────────────── */

function CTA() {
  return (
    <section
      className="section grain"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="shell">
        <div
          className="ticked p-10 sm:p-16"
          style={{ border: "1px solid var(--line-strong)" }}
        >
          <p className="mono-label mb-6">Have a problem worth solving?</p>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.5rem)" }}
          >
            Let's build the
            <br />
            thing that fixes it.
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/projects" className="btn-ghost">
              Explore the work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Ticker />
      <Manifesto />
      <Projects />
      <Process />
      <CTA />
      <Footer />
    </main>
  );
}
