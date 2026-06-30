"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  Search,
  Hammer,
  Activity,
  TrendingUp,
  MapPin,
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

const METHOD = [
  {
    n: "01",
    t: "Find the friction",
    d: "We start with a real, painful problem — tedious, broken or expensive. Never a feature looking for a use.",
    Icon: Search,
  },
  {
    n: "02",
    t: "Prototype fast",
    d: "A working prototype in days, not quarters. We learn by building, putting something real in front of us early.",
    Icon: Hammer,
  },
  {
    n: "03",
    t: "Ship & sharpen",
    d: "Into real hands. We measure, listen and refine — cutting until what's left clearly earns its place.",
    Icon: Activity,
  },
  {
    n: "04",
    t: "Scale what works",
    d: "Proven prototypes graduate into products with their own home, their own roadmap, their own users.",
    Icon: TrendingUp,
  },
];

const PRINCIPLES = [
  {
    k: "01",
    t: "Problems first",
    d: "We chase the problem, not the trend. If it isn't genuinely painful for someone, we don't build it.",
  },
  {
    k: "02",
    t: "Prototypes over decks",
    d: "A rough working thing beats a polished slide every time. We'd rather show than tell.",
  },
  {
    k: "03",
    t: "Ship to learn",
    d: "Nothing is real until it's in front of users. Shipping is how we find out what's actually true.",
  },
  {
    k: "04",
    t: "Small team, high craft",
    d: "Lean by choice. Fewer hands, more ownership, and a high bar on everything that leaves the lab.",
  },
];

const FIGURES = [
  { value: 3, suffix: "", label: "Projects in flight" },
  { value: 5, suffix: " days", label: "To first prototype" },
  { value: 1, suffix: "", label: "Flagship: GYST" },
  { value: 100, suffix: "%", label: "Problem-led, no filler" },
];

/* ── Word-by-word scroll reveal (matches landing manifesto) ────────────── */

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

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const objectY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const objectOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);

  return (
    <section
      ref={ref}
      className="relative grain lab-grid overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* 3D centerpiece — anchored to the right as a side accent */}
      <motion.div
        style={{ y: objectY, opacity: objectOpacity }}
        className="pointer-events-none absolute inset-y-0 right-[-12%] hidden items-center justify-center md:flex lg:right-[-4%]"
      >
        <LabObject className="h-[min(70vh,640px)] w-[min(50vw,640px)]" />
      </motion.div>

      {/* paper wash so type stays crisp over the object */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--paper) 30%, rgba(244,242,236,0.35) 72%, rgba(244,242,236,0) 100%)",
        }}
      />

      <motion.div style={{ y: contentY }} className="relative z-[1]">
        <div className="shell">
          <FadeUp>
            <p className="mono-label mb-6">
              <span className="section-index">001</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;The Lab
            </p>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1
              className="display max-w-4xl"
              style={{
                fontSize: "clamp(2.5rem, 7.5vw, 6rem)",
                fontWeight: 600,
              }}
            >
              A lab that turns
              <br />
              problems into
              <br />
              <span className="accent">software</span>
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
              Persept is a software innovation lab. We take real, stubborn
              problems and build them into products worth shipping. Early,
              ambitious, and very much in build mode.
            </p>
          </FadeUp>

          <FadeUp delay={0.28}>
            <div
              className="mono-label mt-9 inline-flex items-center gap-2"
              style={{ color: "var(--ink-soft)" }}
            >
              <MapPin
                className="h-3.5 w-3.5"
                style={{ color: "var(--accent-ink)" }}
              />
              Based in Dubai
            </div>
          </FadeUp>
        </div>

        {/* scroll cue */}
        <div className="shell mt-16">
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
            <span className="mono-label">Who we are</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Belief — word-by-word reveal manifesto ────────────────────────────── */

function Belief() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.2"],
  });

  const text =
    "We believe the best software starts with a problem someone actually hates living with. So we find the friction, build the smallest thing that fixes it, and refine in the open until it earns a place in the world.";
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
          &nbsp;&nbsp;/&nbsp;&nbsp;What we believe
        </p>
        <p
          className="display max-w-5xl"
          style={{
            fontSize: "clamp(1.6rem, 4vw, 3.25rem)",
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

/* ── Who we are — editorial two-column ─────────────────────────────────── */

function WhoWeAre() {
  return (
    <section
      className="section"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <FadeUp>
              <p className="mono-label mb-4">
                <span className="section-index">003</span>
                &nbsp;&nbsp;/&nbsp;&nbsp;Who we are
              </p>
              <h2
                className="display"
                style={{ fontSize: "clamp(2rem,4.5vw,3rem)" }}
              >
                Small lab,
                <br />
                sharp focus
              </h2>
            </FadeUp>
          </div>

          <div className="max-w-2xl">
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <p
                  className="text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Right now Persept is a founder and a clear idea: that the most
                  valuable software comes from sitting with a real problem long
                  enough to understand it, then building relentlessly until it's
                  solved.
                </p>
              </StaggerItem>
              <StaggerItem>
                <p
                  className="text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  We're not a big agency and we're not pretending to be. We're
                  an early lab building out a small future team — choosing depth
                  over headcount and craft over volume. Every project earns its
                  way in.
                </p>
              </StaggerItem>
              <StaggerItem>
                <p
                  className="text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed"
                  style={{ color: "var(--ink)" }}
                >
                  <span className="accent">GYST</span> — job applications on
                  autopilot — is the flagship. A{" "}
                  <span style={{ color: "var(--ink)" }}>
                    Hotel AI Workforce
                  </span>{" "}
                  and <span style={{ color: "var(--ink)" }}>DAP</span> (applied
                  data) are taking shape alongside it. More is always in the
                  pipeline.
                </p>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── The method — id="process" ─────────────────────────────────────────── */

function Method() {
  return (
    <section
      id="process"
      className="section grain"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="shell">
        <div className="mb-14 max-w-2xl">
          <FadeUp>
            <p className="mono-label mb-4">
              <span className="section-index">004</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;The method
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              How a problem
              <br />
              becomes a product
            </h2>
            <p
              className="mt-6 text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              Four steps, run tight and repeated often. It's a method, not a
              pitch deck.
            </p>
          </FadeUp>
        </div>

        <div
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ backgroundColor: "var(--line)" }}
        >
          {METHOD.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.08}>
              <div
                className="ticked group flex h-full flex-col p-7"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="section-index">{step.n}</span>
                  <step.Icon
                    className="h-4 w-4 transition-colors duration-300 group-hover:text-[var(--accent-ink)]"
                    style={{ color: "var(--ink-faint)" }}
                  />
                </div>
                <h3
                  className="display mt-8"
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

/* ── Principles ────────────────────────────────────────────────────────── */

function Principles() {
  return (
    <section
      className="section"
      style={{
        borderTop: "1px solid var(--line)",
        backgroundColor: "var(--paper-2)",
      }}
    >
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <FadeUp>
            <p className="mono-label mb-4">
              <span className="section-index">005</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Principles
            </p>
            <h2
              className="display"
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
            >
              What we hold to
            </h2>
          </FadeUp>
        </div>

        <div
          className="grid gap-px md:grid-cols-2"
          style={{ backgroundColor: "var(--line)" }}
        >
          {PRINCIPLES.map((p, i) => (
            <FadeUp key={p.k} delay={(i % 2) * 0.08}>
              <div
                className="lab-card group flex h-full items-start gap-6 p-8 sm:p-10"
                style={{ borderRadius: 0 }}
              >
                <span
                  className="display shrink-0 transition-colors duration-300 group-hover:text-[var(--accent-ink)]"
                  style={{
                    fontSize: "clamp(2rem,3vw,2.75rem)",
                    color: "var(--ink-faint)",
                    fontWeight: 600,
                  }}
                >
                  {p.k}
                </span>
                <div>
                  <h3
                    className="display"
                    style={{ fontSize: "1.5rem", fontWeight: 600 }}
                  >
                    {p.t}
                  </h3>
                  <p
                    className="mt-3 max-w-md text-[15px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {p.d}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Figures — honest, modest stat block ───────────────────────────────── */

function Figures() {
  return (
    <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="shell">
        <FadeUp>
          <p className="mono-label mb-12">
            <span className="section-index">006</span>
            &nbsp;&nbsp;/&nbsp;&nbsp;Where things stand
          </p>
        </FadeUp>

        <div
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ backgroundColor: "var(--line)" }}
        >
          {FIGURES.map((f, i) => (
            <FadeUp key={f.label} delay={i * 0.08}>
              <div
                className="flex h-full flex-col justify-between p-8"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.75rem,6vw,4.25rem)",
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  <AnimatedCounter value={f.value} suffix={f.suffix} />
                </span>
                <span
                  className="mono-label mt-6"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {f.label}
                </span>
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
          <p className="mono-label mb-6">Got a stubborn problem?</p>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.5rem)" }}
          >
            Bring it to
            <br />
            the lab<span className="accent">.</span>
          </h2>
          <p
            className="mt-7 max-w-xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            If it's tedious, broken or expensive, that's exactly the kind of
            thing we want to turn into software.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/projects" className="btn-ghost">
              See the work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <Hero />
      <Belief />
      <WhoWeAre />
      <Method />
      <Principles />
      <Figures />
      <CTA />
      <Footer />
    </main>
  );
}
