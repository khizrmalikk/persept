"use client";

import {
  type MotionValue,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ClipboardList,
  LineChart,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { ApertureField } from "@/components/ui/aperture-field";
import { ApertureGlyph, Kicker } from "@/components/ui/editorial";
import { FadeUp } from "@/components/ui/scroll-animations";

/* ── Data ──────────────────────────────────────────────────────────────── */

const CAPABILITIES = [
  {
    icon: MessageSquare,
    t: "Guest & customer comms",
    d: "Every message answered in minutes, in your voice, around the clock — across WhatsApp and the channels people already use.",
  },
  {
    icon: ClipboardList,
    t: "Operations dispatch",
    d: "Scheduling, vendor chasing, follow-ups. The agent moves work forward and escalates only what needs a human.",
  },
  {
    icon: LineChart,
    t: "Reporting & owner updates",
    d: "The day's data turned into a clear briefing, plus the monthly statements owners actually read.",
  },
  {
    icon: ShieldCheck,
    t: "Humans in command",
    d: "Anything touching money, access or disputes routes to your team for one-tap approval. Agents handle volume; people make the calls.",
  },
];

const APPROACH = [
  {
    n: "01",
    t: "Live where the work is",
    d: "No new software for anyone to learn. Agents plug into the inboxes, tools and channels your team already runs on.",
  },
  {
    n: "02",
    t: "One deployment per client",
    d: "Isolated, permissioned and hardened. Your data stays yours; agents only take allowlisted actions.",
  },
  {
    n: "03",
    t: "Proven in production",
    d: "We run our own agent workforce daily. Everything we sell is the operating playbook we already live.",
  },
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
  const opacity = useTransform(progress, range, [0.14, 1]);
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
    "Persept builds AI workforces — teams of agents that take on the repetitive operational work a business would otherwise hire for, and run it around the clock.";
  const tokens = text.split(" ").map((word, i, arr) => ({
    word,
    id: i,
    range: [i / arr.length, (i + 1) / arr.length] as [number, number],
  }));

  return (
    <section ref={ref} className="section">
      <div className="shell">
        <Kicker className="mb-8">What we do</Kicker>
        <p
          className="display max-w-5xl"
          style={{
            fontSize: "clamp(1.75rem, 4.2vw, 3.4rem)",
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

  const fieldY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative grain min-h-[100svh] overflow-hidden"
    >
      {/* aperture centerpiece */}
      <motion.div style={{ y: fieldY }} className="absolute inset-0">
        <ApertureField className="h-full w-full" />
      </motion.div>

      {/* paper vignette so text stays legible over the field */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 44%, rgba(247,242,234,0) 30%, rgba(247,242,234,0.72) 72%, rgba(247,242,234,0.95) 100%)",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-[1] flex min-h-[100svh] flex-col justify-center"
      >
        <div className="shell">
          <FadeUp>
            <Kicker className="mb-7">AI workforce studio · Dubai</Kicker>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1
              className="display max-w-5xl"
              style={{
                fontSize: "clamp(2.75rem, 8vw, 6.75rem)",
                fontWeight: 600,
              }}
            >
              An <span className="accent">AI workforce</span>
              <br />
              for <span className="display-light">real operations.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.18}>
            <p
              className="mt-7 max-w-xl text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              We build agent teams that run the day-to-day work a business would
              otherwise hire for. Our flagship: an AI workforce for property
              hospitality. Our own product: GYST.
            </p>
          </FadeUp>

          <FadeUp delay={0.28}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/projects/hotel" className="btn">
                See the workforce
                <ArrowRight className="h-4 w-4" />
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

/* ── Flagship: Hotel AI Workforce ──────────────────────────────────────── */

function Flagship() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Kicker className="mb-5">Flagship — the service</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)" }}
            >
              Hotel AI Workforce
            </h2>
            <p
              className="mt-4 text-[clamp(1.1rem,1.8vw,1.4rem)] leading-snug"
              style={{ color: "var(--ink)", fontWeight: 500 }}
            >
              The AI operations team for property hospitality — guest messaging,
              housekeeping dispatch and owner reporting, run around the clock
              inside WhatsApp.
            </p>
          </div>
          <Link
            href="/projects/hotel"
            className="link-underline text-[15px]"
            style={{ color: "var(--ink)" }}
          >
            Explore Hotel AI Workforce →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <FadeUp key={c.t} delay={(i % 2) * 0.08}>
                <div className="card group flex h-full flex-col p-8 sm:p-9">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3
                    className="display mt-7"
                    style={{ fontSize: "1.45rem", fontWeight: 600 }}
                  >
                    {c.t}
                  </h3>
                  <p
                    className="mt-3 max-w-md text-[15px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {c.d}
                  </p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Product: GYST ─────────────────────────────────────────────────────── */

function Product() {
  return (
    <section className="section">
      <div className="shell">
        <div className="panel-dark overflow-hidden p-8 sm:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <span
                className="kicker mb-5"
                style={{ color: "rgba(236,231,219,0.72)" }}
              >
                <span style={{ color: "#fdc91b", display: "inline-flex" }}>
                  <ApertureGlyph size={14} />
                </span>
                Our product — stands on its own
              </span>
              <h2
                className="display"
                style={{
                  fontSize: "clamp(2.5rem,5.5vw,4rem)",
                  color: "#f4f2ea",
                }}
              >
                GYST
              </h2>
              <p
                className="mt-4 max-w-lg text-[clamp(1.1rem,1.8vw,1.4rem)] leading-snug"
                style={{ color: "#ece7db", fontWeight: 500 }}
              >
                The whole job search, one guided path. Search every board,
                tailor a screening-ready CV to each role, and reach real people
                who can refer you.
              </p>
              <p
                className="mt-5 max-w-lg text-[15px] leading-relaxed"
                style={{ color: "rgba(236,231,219,0.72)" }}
              >
                Built for students and early-career professionals in the UK and
                UAE. A separate Persept product with its own home.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="https://startgyst.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn"
                  style={{
                    background: "#fdc91b",
                    borderColor: "#fdc91b",
                    color: "#14140f",
                  }}
                >
                  Visit startgyst.com
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/projects/gyst"
                  className="btn-ghost"
                  style={{
                    color: "#ece7db",
                    borderColor: "rgba(236,231,219,0.3)",
                  }}
                >
                  Read the story
                </Link>
              </div>
            </div>

            {/* mini "board" motif */}
            <div className="hidden grid-cols-3 gap-3 lg:grid">
              {[
                { col: "Saved", cards: ["s1"] },
                { col: "Applied", cards: ["a1", "a2"] },
                { col: "Interview", cards: ["i1"] },
              ].map(({ col, cards }) => (
                <div key={col} className="flex flex-col gap-3">
                  <p
                    className="mono-label"
                    style={{ color: "rgba(236,231,219,0.5)" }}
                  >
                    {col}
                  </p>
                  {cards.map((cardId) => (
                    <div
                      key={cardId}
                      className="rounded-xl p-3"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="h-2 w-3/4 rounded-full"
                        style={{ background: "rgba(253,201,27,0.8)" }}
                      />
                      <div
                        className="mt-2 h-2 w-1/2 rounded-full"
                        style={{ background: "rgba(236,231,219,0.18)" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Approach ──────────────────────────────────────────────────────────── */

function Approach() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <Kicker className="mb-5">How we build</Kicker>
        <h2
          className="display mb-14 max-w-2xl"
          style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
        >
          Sold as a staffed outcome, not a tool
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {APPROACH.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.08}>
              <div className="flex h-full flex-col">
                <span className="figure-mark">{step.n}</span>
                <hr className="rule-soft my-6" />
                <h3
                  className="display"
                  style={{ fontSize: "1.4rem", fontWeight: 600 }}
                >
                  {step.t}
                </h3>
                <p
                  className="mt-3 text-[15px] leading-relaxed"
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
    <section className="section grain">
      <div className="shell">
        <div className="ticked p-10 sm:p-16">
          <Kicker className="mb-6">
            Costs less than one hire · works 24/7
          </Kicker>
          <h2
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2.25rem,6vw,4.5rem)" }}
          >
            Put an AI workforce
            <br />
            on the <span className="accent">operation.</span>
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn">
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/projects/hotel" className="btn-ghost">
              See how it works
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
      <Manifesto />
      <Flagship />
      <Product />
      <Approach />
      <CTA />
      <Footer />
    </main>
  );
}
