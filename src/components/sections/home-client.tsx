"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileText,
  Gauge,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Search,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRef } from "react";
import { ApertureField } from "@/components/ui/aperture-field";
import { LiveTag } from "@/components/ui/console";
import { Kicker } from "@/components/ui/editorial";
import { FadeUp } from "@/components/ui/scroll-animations";

/* ── Booking + demo (env-driven) ───────────────────────────────────────────
 * the whole page has one job: book a fifteen-minute call. the primary button
 * points at the calendar in NEXT_PUBLIC_BOOKING_URL, or falls back to a mailto.
 */
const BOOKING =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  "mailto:khizr@persept.ai?subject=15%20minutes";
const BOOKING_EXTERNAL = /^https?:/i.test(BOOKING);
const DEMO_VIDEO = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "";

function BookButton({
  label = "book a 15-minute call",
  className = "btn",
}: {
  label?: string;
  className?: string;
}) {
  const extra = BOOKING_EXTERNAL ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <a href={BOOKING} className={className} {...extra}>
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

/* ── Data ──────────────────────────────────────────────────────────────── */

// the six functions the workforce takes over. each is an outcome, with a
// "you approve" note where a human presses the button.
const FUNCTIONS: {
  icon: typeof Search;
  t: string;
  d: string;
  approve?: string;
}[] = [
  {
    icon: Search,
    t: "outreach",
    d: "finds companies that fit, drafts the first message and the follow-ups on day 3 and 7, reads the replies, proposes call times",
    approve: "you approve every message before it goes",
  },
  {
    icon: FileText,
    t: "proposals",
    d: "turns your call notes into a proposal the same day, as a page the prospect can open",
    approve: "you approve before it is sent",
  },
  {
    icon: MessagesSquare,
    t: "customer replies",
    d: "answers guest and customer messages and google reviews in your voice, escalates anything about money or complaints",
    approve: "you approve the sensitive ones",
  },
  {
    icon: Gauge,
    t: "daily operations brief",
    d: "what happened yesterday, what needs your decision, what is due today, in one message every morning",
  },
  {
    icon: Newspaper,
    t: "market watch",
    d: "reads the news, forums and competitors in your niche every morning and tags what matters for sales or content",
  },
  {
    icon: Megaphone,
    t: "marketing",
    d: "a weekly content plan and drafts in your voice, and suggestions from your own numbers (for a holiday-home operator: a discount when occupancy dips)",
    approve: "you approve before anything is published",
  },
];

// how it runs, four steps with mono numbered kickers
const STEPS: { n: string; icon: typeof Server; d: string }[] = [
  {
    n: "01",
    icon: Search,
    d: "we map where agents help in your business (a consultation you keep whether or not you go ahead)",
  },
  {
    n: "02",
    icon: Server,
    d: "we set up your own private deployment (your data stays in your instance, nothing shared with other clients)",
  },
  {
    n: "03",
    icon: LayoutDashboard,
    d: "you get a dashboard only you and we can open, with an approvals inbox",
  },
  {
    n: "04",
    icon: ShieldCheck,
    d: "the agents run 24/7 and you decide in one tap",
  },
];

const PROOF_LINES = [
  "a chief of staff briefs the founder every morning",
  "an outreach agent drafts every message and the founder presses send",
  "a proposal agent writes the proposal the day of the call",
  "a content agent drafts the week's posts",
];

/* ── Hero ──────────────────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const fieldY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section
      ref={ref}
      className="relative grain flex min-h-[100svh] flex-col justify-center overflow-hidden pt-20 pb-16"
    >
      <motion.div
        style={{ y: reduce ? 0 : fieldY }}
        className="absolute inset-0"
      >
        <ApertureField className="h-full w-full" />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 72% 60% at 50% 46%, rgba(6,6,9,0) 28%, rgba(6,6,9,0.74) 72%, rgba(6,6,9,0.96) 100%)",
        }}
      />

      <div className="shell relative z-[1]">
        <FadeUp>
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Kicker>ai workforce studio · dubai</Kicker>
            <LiveTag label="agents on the clock" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1
            className="display max-w-4xl"
            style={{ fontSize: "clamp(2rem, 6.4vw, 4.75rem)", fontWeight: 600 }}
          >
            an <span className="accent">ai workforce</span> for your business.
            <br />
            you stay in charge
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p
            className="mt-6 max-w-[40rem] text-[0.95rem] leading-relaxed sm:text-[1.05rem]"
            style={{ color: "var(--ink-soft)" }}
          >
            named agents that take over the repetitive, message-heavy work of a
            small company: outreach and follow-ups, customer replies, proposals,
            reports, content. running 24/7, inside the tools you already use,
            with a person approving anything that involves money, access or a
            customer.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BookButton />
            <a href="#proof" className="btn-ghost">
              see it running
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.32}>
          <p
            className="mono-label mt-8 flex items-center gap-2"
            style={{ color: "var(--ink-faint)" }}
          >
            <span className="live-dot" aria-hidden="true" />
            the agents draft and prepare. a human presses send, publish and pay
          </p>
        </FadeUp>
      </div>

      <div className="shell absolute inset-x-0 bottom-6 z-[1]">
        <div
          className="flex items-center gap-3"
          style={{ color: "var(--ink-faint)" }}
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
          <span className="mono-label">scroll</span>
        </div>
      </div>
    </section>
  );
}

/* ── What it is / what it is not ───────────────────────────────────────── */

const IS = [
  "a small team of named roles, each with one job",
  "embedded in your email, whatsapp, calendar and documents",
  "reporting to you every morning",
];
const IS_NOT = [
  "a chatbot on your website",
  "a tool you have to operate",
  "autopilot; nothing goes out without your approval",
];

function WhatItIs() {
  return (
    <section
      id="what"
      className="section"
      style={{ backgroundColor: "var(--paper-2)" }}
    >
      <div className="shell">
        <FadeUp>
          <h2
            className="display mb-10"
            style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}
          >
            what it is, what it is not
          </h2>
        </FadeUp>
        <div className="grid gap-5 md:grid-cols-2">
          <FadeUp>
            <div className="card h-full p-7 sm:p-9">
              <p className="mono-label" style={{ color: "var(--accent-ink)" }}>
                it is
              </p>
              <ul className="mt-5 flex flex-col gap-4">
                {IS.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "var(--accent-ink)" }}
                    />
                    <span
                      className="text-[15px] leading-relaxed"
                      style={{ color: "var(--ink)" }}
                    >
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="card h-full p-7 sm:p-9">
              <p className="mono-label" style={{ color: "var(--ink-faint)" }}>
                it is not
              </p>
              <ul className="mt-5 flex flex-col gap-4">
                {IS_NOT.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "var(--ink-faint)" }}
                    />
                    <span
                      className="text-[15px] leading-relaxed"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ── What it takes over ────────────────────────────────────────────────── */

function TakesOver() {
  return (
    <section className="section">
      <div className="shell">
        <FadeUp>
          <div className="mb-12 max-w-2xl">
            <Kicker className="mb-5">what it takes over</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}
            >
              specific roles, doing specific jobs
            </h2>
          </div>
        </FadeUp>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCTIONS.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeUp key={f.t} delay={(i % 3) * 0.06}>
                <div className="card flex h-full flex-col p-6 sm:p-7">
                  <span className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3
                    className="display mt-6"
                    style={{ fontSize: "1.2rem", fontWeight: 600 }}
                  >
                    {f.t}
                  </h3>
                  <p
                    className="mt-3 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {f.d}
                  </p>
                  {f.approve && (
                    <p
                      className="mt-auto flex items-center gap-2 pt-5 text-[13px] font-medium"
                      style={{ color: "var(--ink)" }}
                    >
                      <ShieldCheck
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--accent-ink)" }}
                      />
                      {f.approve}
                    </p>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── How it runs ───────────────────────────────────────────────────────── */

function HowItRuns() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <FadeUp>
          <div className="mb-12 max-w-2xl">
            <Kicker className="mb-5">how it runs</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}
            >
              a private deployment, and your one tap
            </h2>
          </div>
        </FadeUp>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeUp key={step.n} delay={i * 0.08}>
                <div className="card flex h-full flex-col p-7">
                  <div className="flex items-center justify-between">
                    <span
                      className="figure-mark"
                      style={{ fontSize: "2.25rem" }}
                    >
                      {step.n}
                    </span>
                    <Icon
                      className="h-4 w-4"
                      style={{ color: "var(--accent-ink)" }}
                    />
                  </div>
                  <p
                    className="mt-7 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {step.d}
                  </p>
                </div>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.1}>
          <div
            className="mt-6 flex items-center gap-3 rounded-[var(--radius-md)] p-5"
            style={{ background: "var(--paper-3)" }}
          >
            <Lock
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--accent-ink)" }}
            />
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              pdpl-aligned. a person you can call set it up and keeps it running
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── Proof: persept runs on persept ────────────────────────────────────── */

function Proof() {
  return (
    <section id="proof" className="section">
      <div className="shell">
        <FadeUp>
          <div className="mb-10 max-w-2xl">
            <Kicker className="mb-5">proof</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}
            >
              persept runs on persept
            </h2>
          </div>
        </FadeUp>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.85fr] lg:gap-12">
          <FadeUp>
            <div className="card overflow-hidden p-2 sm:p-3">
              {/* biome-ignore lint/performance/noImgElement: static marketing screenshot, next/image adds no value on a full-bleed hero shot */}
              <img
                src="/images/dashboard-office.png"
                alt="the persept dashboard: the office view, agents at their desks with an approvals inbox waiting for the owner"
                width={1600}
                height={1000}
                loading="lazy"
                className="w-full rounded-[calc(var(--radius-md)-4px)]"
                style={{ height: "auto", display: "block" }}
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <ul className="flex h-full flex-col justify-center gap-4">
              {PROOF_LINES.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] p-4"
                  style={{ background: "var(--paper-2)" }}
                >
                  <span className="live-dot mt-1.5" aria-hidden="true" />
                  <span
                    className="text-[15px] leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>

        {DEMO_VIDEO && (
          <FadeUp delay={0.12}>
            <div
              className="card mt-6 overflow-hidden"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                src={DEMO_VIDEO}
                title="persept demo"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                style={{ border: 0 }}
              />
            </div>
          </FadeUp>
        )}
      </div>
    </section>
  );
}

/* ── Worked example ────────────────────────────────────────────────────── */

const EXAMPLE = [
  {
    k: "the situation",
    v: "20 to 60 units, messages at all hours",
  },
  {
    k: "what the workforce does",
    v: "answers guest questions, chases cleaners until they confirm, prepares owner statements, plugs into hostaway and guesty",
  },
  {
    k: "what stays with a person",
    v: "refunds, door codes, disputes",
  },
];

function WorkedExample() {
  return (
    <section className="section" style={{ backgroundColor: "var(--paper-2)" }}>
      <div className="shell">
        <FadeUp>
          <div className="ticked ticked-corners relative p-8 sm:p-12">
            <div className="flex flex-wrap items-center gap-3">
              <span className="icon-tile">
                <MessagesSquare className="h-5 w-5" />
              </span>
              <LiveTag label="worked example" />
            </div>
            <h2
              className="display mt-7 max-w-3xl"
              style={{ fontSize: "clamp(1.6rem,3.4vw,2.6rem)" }}
            >
              example: guest messaging for a holiday-home operator
            </h2>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              {EXAMPLE.map((row) => (
                <div key={row.k}>
                  <dt
                    className="mono-label"
                    style={{ color: "var(--accent-ink)" }}
                  >
                    {row.k}
                  </dt>
                  <dd
                    className="mt-2 text-[15px] leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── The engagement ────────────────────────────────────────────────────── */

const OPTIONS = [
  {
    t: "30-day paid pilot",
    d: "setup, integration, playbooks, one month live, then monthly",
  },
  {
    t: "consultation",
    d: "half a day in your business, a written map of where agents would help and what to run first",
  },
];

function Engagement() {
  return (
    <section className="section">
      <div className="shell">
        <FadeUp>
          <div className="mb-12 max-w-2xl">
            <Kicker className="mb-5">the engagement</Kicker>
            <h2
              className="display"
              style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}
            >
              two ways to start
            </h2>
          </div>
        </FadeUp>

        <div className="grid gap-5 md:grid-cols-2">
          {OPTIONS.map((o, i) => (
            <FadeUp key={o.t} delay={i * 0.08}>
              <div className="card h-full p-7 sm:p-9">
                <span className="figure-mark" style={{ fontSize: "1.75rem" }}>
                  {`0${i + 1}`}
                </span>
                <h3
                  className="display mt-5"
                  style={{ fontSize: "1.5rem", fontWeight: 600 }}
                >
                  {o.t}
                </h3>
                <p
                  className="mt-3 text-[15px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {o.d}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.1}>
          <p
            className="mt-7 flex items-center gap-2 text-[15px]"
            style={{ color: "var(--ink)" }}
          >
            <span className="live-dot" aria-hidden="true" />
            founder rate for the first three clients in exchange for a case
            study
          </p>
        </FadeUp>
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
          <h2
            className="display max-w-3xl"
            style={{ fontSize: "clamp(2rem,5.5vw,4rem)" }}
          >
            book a <span className="accent">15-minute call</span>
          </h2>
          <p
            className="mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            fifteen minutes. you tell me where the time goes, i tell you what an
            agent could take.
          </p>
          <div className="mt-9">
            <BookButton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Client entry ──────────────────────────────────────────────────────── */

export function HomeClient() {
  return (
    <>
      <Hero />
      <WhatItIs />
      <TakesOver />
      <HowItRuns />
      <Proof />
      <WorkedExample />
      <Engagement />
      <CTA />
    </>
  );
}

export default HomeClient;
