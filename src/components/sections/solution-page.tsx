"use client";

import {
  ArrowRight,
  BarChart4,
  Bot,
  Brain,
  CalendarCheck,
  Check,
  ChevronDown,
  Hotel,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Plug,
  Receipt,
  Shield,
  Star,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import { CTAButton } from "@/components/ui/cta-button";
import { FadeUp, StaggerContainer, SlideIn } from "@/components/ui/scroll-animations";
import { NetworkCanvas } from "@/components/ui/network-canvas";

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */

const problems = [
  {
    icon: MessageSquare,
    title: "Death by a Thousand Messages",
    stat: "15–35 hrs/week",
    statLabel: "spent on repetitive replies",
    description:
      "Your front desk, reservations, and restaurant staff spend hours copying and pasting the same responses — check-in times, parking info, menu questions.",
    damages: [
      "Staff burnout answering the same question 50 times a day",
      "Guests wait 4–12 hours for simple answers",
      "Lost bookings while guests wait for your reply",
      "Inconsistent answers from different staff",
    ],
    tried: [
      "Hiring more staff — expensive, high turnover",
      "FAQ pages — guests don't read them",
      "Canned responses — still manual, still slow",
    ],
  },
  {
    icon: Star,
    title: "Review Management is a Full-Time Job",
    stat: "10–15 hrs/week",
    statLabel: "spent managing reviews",
    description:
      "Reviews appear on 5+ platforms — Google, TripAdvisor, Booking.com, Agoda, Zomato. Responding to all of them is a never-ending task.",
    damages: [
      "Missed reviews that never get responses",
      "Generic replies guests see right through",
      "3–7 day response time looks terrible",
      "Reputation and rankings suffer",
    ],
    tried: [
      "Assigning review duty — staff hate it",
      "Outsourcing to a VA — generic, impersonal",
      "Ignoring some reviews — kills reputation",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Staff Scheduling is a Nightmare",
    stat: "10–15%",
    statLabel: "average overstaffing cost",
    description:
      "You're either overstaffed (wasting money) or understaffed (guests suffer). Scheduling is guesswork, and it costs you every day.",
    damages: [
      "High labor costs from chronic overstaffing",
      "Last-minute scrambling to find coverage",
      "Poor guest experience from overworked staff",
      "Zero predictability in workforce planning",
    ],
    tried: [
      "Excel spreadsheets — manual, error-prone",
      "Scheduling software — still requires guesswork",
      '"Gut feel" — inconsistent, reactive',
    ],
  },
  {
    icon: BarChart4,
    title: "Data Everywhere, Insights Nowhere",
    stat: "6+ systems",
    statLabel: "holding your data hostage",
    description:
      "Your data lives across PMS, POS, channel manager, review platforms, email, and WhatsApp. No single source of truth.",
    damages: [
      "Piecing together reports manually takes hours",
      "Decisions based on incomplete, stale data",
      "Revenue trends and opportunities missed",
      "Reports outdated by the time they're finished",
    ],
    tried: [
      "Manual reporting — time-consuming, error-prone",
      "BI tools — expensive, complex, need technical expertise",
      "Spreadsheets — outdated before you finish them",
    ],
  },
];

const oldSolutions = [
  {
    icon: Link2,
    title: "Zapier & n8n",
    subtitle: "Simple Automation",
    promise: "Automate your workflows! Connect your apps! No coding required!",
    canDo: [
      "Send a canned email when a booking happens",
      "Create a spreadsheet row when a review is posted",
      "Forward messages from one platform to another",
    ],
    cantDo: [
      "Understand a guest's question and respond intelligently",
      "Personalize based on guest history or preferences",
      "Handle complex, multi-step conversations",
      "Learn from patterns and improve over time",
      "Make decisions — when to escalate, upsell, or apologize",
    ],
    verdict:
      "Automation without intelligence creates faster, more efficient chaos. Zapier/n8n were a step forward in 2018. In 2026, they're table stakes.",
  },
  {
    icon: Bot,
    title: "Generic AI Chatbots",
    subtitle: "Single-Channel FAQ",
    promise: "AI-powered chatbot! Answers guest questions 24/7!",
    canDo: [
      "Answer FAQs on your website",
      "Provide canned responses to common questions",
      "Collect contact info for follow-up",
    ],
    cantDo: [
      "Handle WhatsApp, email, OTAs — only website chat",
      "Access your PMS for real guest information",
      "Personalize based on guest history",
      "Manage reviews, scheduling, or reporting",
      "Integrate deeply with your operations",
    ],
    verdict:
      "Chatbots solve 10% of the problem. The other 90% — WhatsApp, email, OTAs, reviews, scheduling, reporting — still requires manual work.",
  },
  {
    icon: Users,
    title: "Hiring More People",
    subtitle: "Throwing Bodies at the Problem",
    promise: "If we just hire more staff, we'll finally get on top of this.",
    canDo: [
      "Handle more volume (temporarily)",
      "Provide human warmth and judgment",
      "Cover shifts and gaps",
    ],
    cantDo: [
      "Scale without compounding costs",
      "Deliver consistent answers every time",
      "Work 24/7 without burnout or turnover",
      "Eliminate the 3–6 month training cycle",
      "Reduce 40–70% annual turnover rate",
    ],
    verdict:
      "Hiring more people to do repetitive work is like buying a bigger bucket to bail water from a sinking boat. You need to fix the leak.",
  },
];

const agents = [
  {
    name: "Sarah",
    role: "Guest Communication Specialist",
    icon: MessageCircle,
    color: "#b91c1c",
    bg: "#fef2f2",
    capabilities: [
      "Handles all channels — WhatsApp, email, Booking.com, Agoda, website",
      "Answers FAQs instantly (check-in, amenities, policies)",
      "Accesses your PMS for real reservation details",
      "Personalizes responses using guest history",
      "Escalates complex issues to your team intelligently",
      "Works 24/7, responds in seconds",
    ],
    exampleLabel: "WhatsApp conversation",
    exampleGuest: "Hi, I'm checking in tomorrow. What time can I check in?",
    exampleAgent:
      "Hi Ahmed! Your check-in is tomorrow (March 1st) at 2 PM. You're booked in an Ocean View King room overlooking the marina. We can arrange early check-in at noon for an additional AED 200 if you'd like. Let me know!",
    impact: "Saves 15–35 hours/week",
  },
  {
    name: "Marcus",
    role: "Review Management Specialist",
    icon: Star,
    color: "#7c3aed",
    bg: "#f5f3ff",
    capabilities: [
      "Monitors 5+ platforms (Google, TripAdvisor, Booking.com, Agoda, Zomato)",
      "Drafts personalized responses — not generic templates",
      "Learns your brand voice and tone",
      "Responds within minutes, not days",
      "Flags critical issues for immediate attention",
      "Tracks sentiment trends over time",
    ],
    exampleLabel: "TripAdvisor review response",
    exampleGuest:
      "Great location and friendly staff, but the pool was closed during our 3-night stay in January. Disappointed.",
    exampleAgent:
      "Thank you for your kind words about our team and location, Sarah! We sincerely apologize for the pool closure during your January stay — we were completing essential maintenance. The pool is now fully operational and better than ever. We'd love to welcome you back. Please reach out to manager@hotel.com for a special returning guest offer.",
    impact: "Saves 10–15 hours/week",
  },
  {
    name: "Olivia",
    role: "Scheduling & Operations Specialist",
    icon: CalendarCheck,
    color: "#047857",
    bg: "#ecfdf5",
    capabilities: [
      "Analyzes occupancy forecasts from your PMS",
      "Predicts staffing needs from historical patterns",
      "Creates optimized schedules automatically",
      "Handles shift swaps and time-off requests",
      "Alerts to potential under/overstaffing",
      "Sends schedules via WhatsApp",
    ],
    exampleLabel: "WhatsApp alert to manager",
    exampleGuest: null,
    exampleAgent:
      "⚠️ Staffing alert: Friday (March 5th) occupancy forecast is 85% with a large wedding party checking in. Recommend adding 2 servers and 1 bartender for dinner service. Should I notify Sarah and Ahmed about available shifts?",
    impact: "Reduces labor costs 10–15%",
  },
  {
    name: "Alex",
    role: "Revenue & Analytics Specialist",
    icon: BarChart4,
    color: "#1d4ed8",
    bg: "#eff6ff",
    capabilities: [
      "Pulls data from PMS + POS + Channel Manager",
      "Generates daily/weekly revenue snapshots",
      "Highlights trends, anomalies, and opportunities",
      "Compares to historical performance",
      "Sends reports via WhatsApp or email",
      "Answers ad-hoc questions on demand",
    ],
    exampleLabel: "Daily report (WhatsApp to GM)",
    exampleGuest: null,
    exampleAgent:
      "📊 Revenue — Fri, March 5\n\n💰 Total: AED 85,200\n• Rooms: AED 62,500 (83% occ.)\n• F&B: AED 18,200\n• Other: AED 4,500\n\n📈 vs Yesterday: +18%\n📈 vs Last Friday: +12%\n\n⚠️ Occupancy drops to 65% Mon–Wed. Consider a flash sale for direct bookings.",
    impact: "Saves 5–10 hours/week",
  },
];

const differences = [
  {
    icon: Lock,
    title: "You Own Your Infrastructure",
    old: "Your data lives on their servers. Vendor lock-in. They can raise prices or shut down.",
    ours: "Agents run on your own VPS. Your data stays on your infrastructure. You own it — take it with you if you leave.",
  },
  {
    icon: Plug,
    title: "Deep Integration, Not Surface-Level",
    old: "Website chat only. No PMS access. Generic responses.",
    ours: "Integrates with PMS, POS, review platforms. Works across WhatsApp, email, OTAs, and website with real guest data.",
  },
  {
    icon: Brain,
    title: "Intelligence, Not Just Scripts",
    old: "If/then rules. No context. Breaks when scenarios change.",
    ours: "Understands intent, reasons through context, adapts over time, makes decisions on escalation and upselling.",
  },
  {
    icon: Hotel,
    title: "Built for Hospitality, Not Generic SaaS",
    old: "Generic solutions for any industry. Cookie-cutter implementations.",
    ours: "Hospitality-specialized. Understands PMS, POS, channel managers, OTAs. Arabic language support, UAE market knowledge.",
  },
];

const timeline = [
  {
    day: "Days 1–2",
    title: "AI Automation Audit",
    items: [
      "Visit your property (or virtual sessions)",
      "Analyze operations and pain points",
      "Test PMS/POS API access",
      "Deliver 15-page roadmap with ROI projections",
    ],
  },
  {
    day: "Days 3–21",
    title: "Deployment & Setup",
    items: [
      "VPS setup (your dedicated server)",
      "PMS/POS integration",
      "Agent configuration (tone, workflows, escalation)",
      "Multi-channel setup (WhatsApp, email, reviews)",
    ],
  },
  {
    day: "Days 22–28",
    title: "Training & Testing",
    items: [
      "2-hour team training session",
      "Test scenarios with real data",
      "Refine agent responses",
      "QA and validation",
    ],
  },
  {
    day: "Day 30+",
    title: "Go-Live & Optimization",
    items: [
      "Agents go live",
      "Monitor and refine performance",
      "Monthly (or weekly) check-ins",
      "Continuous improvement",
    ],
  },
];

const trustPoints = [
  {
    icon: Hotel,
    title: "Hospitality-Specialized",
    desc: "Built specifically for hotels and restaurants, not generic AI consulting.",
  },
  {
    icon: Shield,
    title: "Proven ROI",
    desc: "Hotels see 130–300%+ ROI in Year 1. Payback in 3–9 months on average.",
  },
  {
    icon: Lock,
    title: "You Own Your Infrastructure",
    desc: "Your VPS, your data, your control. No vendor lock-in.",
  },
  {
    icon: Receipt,
    title: "Transparent Pricing",
    desc: "No hidden fees, no commission on bookings. Flat monthly fee.",
  },
  {
    icon: MapPin,
    title: "Dubai Expertise",
    desc: "Based in Dubai. We understand UAE hospitality, Arabic language, and local compliance.",
  },
];

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {label && (
        <FadeUp>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
            {label}
          </p>
        </FadeUp>
      )}
      <FadeUp delay={0.1}>
        <h2 className="mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] text-white">
          {title}
        </h2>
      </FadeUp>
      {subtitle && (
        <FadeUp delay={0.2}>
          <p className="mt-3 text-[15px] leading-relaxed text-[#a3a3a3]">
            {subtitle}
          </p>
        </FadeUp>
      )}
    </div>
  );
}

function ProblemCard({ problem }: { problem: (typeof problems)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-retro">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,71,87,0.1)]">
          <problem.icon className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[17px] font-bold text-[var(--color-text-primary)]">
            {problem.title}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[var(--color-primary)]">
              {problem.stat}
            </span>
            <span className="text-[13px] text-[var(--color-text-muted)]">
              {problem.statLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {problem.description}
      </p>

      <ul className="mt-4 space-y-2">
        {problem.damages.map((d) => (
          <li key={d} className="flex items-start gap-2 text-[13px]">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
            <span className="text-[var(--color-text-secondary)]">{d}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
      >
        What you've tried
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <ul className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3">
          {problem.tried.map((t) => (
            <li key={t} className="text-[13px] text-[var(--color-text-secondary)]">
              • {t}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

function OldSolutionCard({ sol }: { sol: (typeof oldSolutions)[number] }) {
  return (
    <div className="card-retro">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)]">
          <sol.icon className="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[var(--color-text-primary)]">{sol.title}</h3>
          <p className="text-[12px] text-[var(--color-text-muted)]">{sol.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-[var(--color-bg)] p-3 text-[13px] italic text-[var(--color-text-secondary)]">
        "{sol.promise}"
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#10b981]">
            What they can do
          </p>
          <ul className="space-y-1.5">
            {sol.canDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10b981]" />
                <span className="text-[var(--color-text-secondary)]">{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            What they can't do
          </p>
          <ul className="space-y-1.5">
            {sol.cantDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px]">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                <span className="text-[var(--color-text-secondary)]">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-[rgba(255,71,87,0.3)] bg-[rgba(255,71,87,0.1)] p-3 text-[13px] font-medium text-[var(--color-primary-dark)]">
        {sol.verdict}
      </p>
    </div>
  );
}

function AgentProfile({
  agent,
  reversed,
}: {
  agent: (typeof agents)[number];
  reversed: boolean;
}) {
  const [showExample, setShowExample] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col gap-6 md:gap-10 ${reversed ? "md:flex-row-reverse" : "md:flex-row"}`}
    >
      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: agent.bg }}
          >
            <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)]">
              {agent.name}
            </h3>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
              {agent.role}
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {agent.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2 text-[14px]">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: agent.color }}
              />
              <span className="text-[var(--color-text-secondary)]">{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-[13px] font-semibold text-[var(--color-text-primary)] border border-[var(--color-border)]">
          {agent.impact}
        </div>
      </div>

      {/* Example */}
      <div className="flex-1">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="mb-3 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: agent.color }}
        >
          {showExample ? "Hide" : "See"} example: {agent.exampleLabel}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${showExample ? "rotate-180" : ""}`}
          />
        </button>

        <motion.div
          initial={false}
          animate={{ 
            height: showExample ? "auto" : 240,
            opacity: 1
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
        {showExample && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            {agent.exampleGuest && (
              <div className="mb-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Guest
                </p>
                <div className="rounded-xl rounded-tl-sm bg-[var(--color-bg)] p-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {agent.exampleGuest}
                </div>
              </div>
            )}
            <div>
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: agent.color }}
              >
                {agent.name}
              </p>
              <div
                className="rounded-xl rounded-tr-sm p-3 text-[13px] leading-relaxed text-white whitespace-pre-line"
                style={{ backgroundColor: agent.color }}
              >
                {agent.exampleAgent}
              </div>
            </div>
          </div>
        )}

        {!showExample && (
          <div
            className="flex h-40 items-center justify-center rounded-2xl"
            style={{ backgroundColor: agent.bg }}
          >
            <agent.icon
              className="h-16 w-16 opacity-20"
              style={{ color: agent.color }}
            />
          </div>
        )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export function SolutionPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────── */}
      <section className="section relative overflow-hidden bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)]">
        {/* Network canvas - connecting dots and lines */}
        <div className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <NetworkCanvas />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 text-center lg:px-8">
          <FadeUp>
            <h1 className="text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              Stop Fighting the Chaos. <br/>
              <span className="text-gradient-primary">Let AI Do the Boring Stuff.</span> 🎯
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
              Your team is drowning in copy-paste replies while guests wait hours. Staff quit because they spend their days doing robot work. There's a better way — and it doesn't involve hiring more humans.
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center w-full max-w-md mx-auto sm:max-w-none">
              <CTAButton size="lg" className="w-full sm:w-auto min-h-[44px]">
                Book Free Consultation
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton variant="secondary" size="lg" href="/pricing" className="w-full sm:w-auto min-h-[44px]">
                See Pricing
              </CTAButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Section 1: The Problems ────────────────── */}
      <section className="section bg-[var(--color-bg)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="The reality"
            title="Running a Hotel Shouldn't Feel Like Surviving a Disaster Movie 🔥"
            subtitle="If any of these sound familiar, you're not alone. (And no, it's not your fault.)"
          />
          <StaggerContainer className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {problems.map((p, idx) => (
              <FadeUp key={p.title} delay={idx * 0.1}>
                <ProblemCard problem={p} />
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Section 2: Old Solutions ───────────────── */}
      <section className="section bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Why they fail"
            title="You've Tried Everything. Nothing Worked. We Know. 🤷"
            subtitle="Zapier, chatbots, hiring more people... Here's why they all missed the mark."
          />
          <StaggerContainer className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {oldSolutions.map((s, idx) => (
              <FadeUp key={s.title} delay={idx * 0.15}>
                <OldSolutionCard sol={s} />
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Section 3: Our Solution — The Agents ──── */}
      <section className="section bg-[var(--color-bg)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Our solution"
            title="Meet Your New Coworkers. They Never Complain About Shifts. 🤖"
            subtitle="Four specialized AI agents who actually understand hospitality — not generic chatbots that sound like robots."
          />

          {/* Comparison callout */}
          <StaggerContainer className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              {
                label: "Zapier",
                desc: "A conveyor belt — moves things, no thinking",
                muted: true,
              },
              {
                label: "Chatbot",
                desc: "A FAQ kiosk — answers basics, one location",
                muted: true,
              },
              {
                label: "Persept Agents",
                desc: "A trained team member — understands, adapts, handles complexity",
                muted: false,
              },
            ].map((item, idx) => (
              <FadeUp key={item.label} delay={idx * 0.1}>
                <motion.div
                  className={`rounded-xl border p-4 text-center transition-all duration-300 ${item.muted ? "border-[var(--color-border)] bg-[var(--color-surface)]" : "border-[var(--color-primary)] bg-[rgba(255,71,87,0.1)]"}`}
                  whileHover={{ scale: item.muted ? 1 : 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                <p
                  className={`text-[14px] font-bold ${item.muted ? "text-[var(--color-text-muted)]" : "text-[var(--color-primary)]"}`}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{item.desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </StaggerContainer>

          {/* Agent profiles */}
          <div className="mx-auto mt-16 max-w-5xl space-y-16">
            {agents.map((agent, idx) => (
              <AgentProfile
                key={agent.name}
                agent={agent}
                reversed={idx % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Scenario: How It All Works Together ───── */}
      <section className="section bg-[var(--color-bg)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                The full picture
              </p>
              <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold text-[var(--color-text-primary)]">
                A Weekend at a 150-Room Hotel (Without the Panic Attacks) 😌
              </h2>
              <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
                Watch Sarah, Marcus, Olivia, and Alex tag-team a busy weekend while your GM actually gets to sleep.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer className="mt-10 space-y-4">
            {[
              {
                time: "Friday 8 AM",
                agent: "Alex",
                color: "#1d4ed8",
                text: "Sends revenue snapshot — GM sees strong bookings for the weekend.",
              },
              {
                time: "Friday 10 AM",
                agent: "Olivia",
                color: "#10b981",
                text: "Analyzes occupancy, recommends adding 2 housekeepers for Saturday checkout rush.",
              },
              {
                time: "Friday 2 PM",
                agent: "Sarah",
                color: "var(--color-primary)",
                text: "Handles 45 guest messages across WhatsApp, email, and Booking.com. Upsells 3 early check-ins.",
              },
              {
                time: "Friday 6 PM",
                agent: "Marcus",
                color: "#8b5cf6",
                text: "Spots a negative Google review, drafts a response, and flags GM for approval.",
              },
              {
                time: "Saturday 9 AM",
                agent: "Sarah",
                color: "var(--color-primary)",
                text: "Sends automated check-out reminders — 80% of guests check out on time.",
              },
              {
                time: "Saturday 3 PM",
                agent: "Alex",
                color: "#1d4ed8",
                text: "Alerts GM: F&B revenue up 25% vs. last Saturday. Suggests Sunday brunch promo.",
              },
            ].map((event, idx) => (
              <FadeUp key={event.time} delay={idx * 0.1}>
                <motion.div
                  className="flex items-start gap-4 rounded-xl bg-[var(--color-card)]/30 p-4 hover:bg-[var(--color-card)]/50 transition-colors duration-300"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div>
                    <p className="text-[12px] font-medium text-[var(--color-text-muted)]">
                      {event.time}
                    </p>
                    <p className="text-[14px] text-[var(--color-text-primary)]">
                      <span
                        className="font-semibold"
                        style={{ color: event.color }}
                      >
                        {event.agent}
                      </span>{" "}
                      {event.text}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </StaggerContainer>

          <FadeUp delay={0.6}>
            <div className="mt-8 rounded-xl bg-[var(--color-card)]/30 p-5 border border-[var(--color-border)]">
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              Weekend result:
            </p>
            <div className="mt-2 grid gap-3 text-[13px] text-[var(--color-text-secondary)] sm:grid-cols-3">
              <span>45+ inquiries handled</span>
              <span>3 upsells closed (AED 600)</span>
              <span>Review response: 2 hrs vs. 3 days</span>
              <span>Optimized staffing, no scrambling</span>
              <span>Revenue insights delivered proactively</span>
              <span className="font-semibold text-[var(--color-primary)]">
                25–30 hours saved
              </span>
            </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Section 4: Why Different ───────────────── */}
      <section className="section bg-[var(--color-bg)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="The difference"
            title="Why We're Not Like Every Other 'AI Solution' 🙄"
            subtitle="We're not trying to sell you a chatbot widget or a Zapier clone with buzzwords."
          />
          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2">
            {differences.map((d, idx) => (
              <FadeUp key={d.title} delay={idx * 0.1}>
                <div className="card-retro">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,71,87,0.1)]">
                      <d.icon className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                      {d.title}
                    </h3>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-[var(--color-bg)] p-3 border border-[rgba(239,68,68,0.2)]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#ef4444]">
                        Typical tools
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{d.old}</p>
                    </div>
                    <div className="rounded-lg bg-[rgba(16,185,129,0.1)] p-3 border border-[rgba(16,185,129,0.2)]">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#10b981]">
                        Persept
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{d.ours}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Section 5: Before / After ─────────────── */}
      <section className="section bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="The transformation"
            title="Before vs. After: The Difference is Ridiculous 📊"
            subtitle="This isn't 'save 10% on tasks.' This is 'get your life back' territory."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Before */}
            <FadeUp delay={0.1}>
              <div className="card-retro border-[rgba(239,68,68,0.3)]">
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#ef4444]">
                  Before Persept
                </p>
                <ul className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
                  <li>7 AM — Spend 2 hours answering 20+ guest emails</li>
                  <li>
                    9 AM — Answer phone calls (same questions, over and over)
                  </li>
                  <li>11 AM — Manually check occupancy, build schedule</li>
                  <li>1 PM — Respond to Booking.com and Agoda messages</li>
                  <li>3 PM — Draft review responses (1–2 hours)</li>
                  <li>5 PM — Create revenue report in Excel (1 hour)</li>
                  <li className="font-medium text-[#ef4444]">
                    6 PM — No time left for guest experience improvements
                  </li>
                </ul>
              </div>
            </FadeUp>

            {/* After */}
            <FadeUp delay={0.2}>
              <div className="card-retro border-[rgba(16,185,129,0.3)]">
                <p className="text-[13px] font-bold uppercase tracking-wide text-[#10b981]">
                  After Persept
                </p>
                <ul className="mt-4 space-y-3 text-[13px] text-[var(--color-text-secondary)]">
                  <li>7 AM — Check Sarah's escalations (5 min)</li>
                  <li>8 AM — Review Alex's revenue report (5 min)</li>
                  <li>8:30 AM — Approve Olivia's schedule (10 min)</li>
                  <li>9 AM — Approve Marcus's review drafts (15 min)</li>
                  <li className="font-semibold text-[#10b981]">
                    9:30 AM – 6 PM — Focus on VIP experience, partnerships,
                    property improvements, team development
                  </li>
                </ul>
              </div>
            </FadeUp>
          </div>

          {/* Stats */}
          <StaggerContainer className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { value: "35–50 hrs", label: "saved per week" },
              { value: "10–15%", label: "labor cost reduction" },
              { value: "130–300%", label: "ROI in Year 1" },
            ].map((s, idx) => (
              <FadeUp key={s.label} delay={0.3 + idx * 0.1}>
                <div className="card-retro text-center">
                  <p className="text-[28px] font-bold tracking-tight text-[var(--color-primary)]">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">{s.label}</p>
                </div>
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Section 6: Implementation Timeline ────── */}
      <section className="section bg-[var(--color-bg)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Implementation"
            title="From Audit to Go-Live in 30 Days"
          />
          <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((step, idx) => (
              <FadeUp key={step.title} delay={idx * 0.1}>
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[12px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                      {step.day}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                    {step.title}
                  </h3>
                  <ul className="mt-3 space-y-1.5">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[13px]"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                        <span className="text-[var(--color-text-secondary)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="section bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center lg:px-8">
          <FadeUp>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight text-white">
              Ready to Stop the Madness? 🚀
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-3 text-[15px] leading-relaxed text-white/90">
              Book a free 30-minute call. We'll show you exactly where you're bleeding time (and money) — and how Sarah, Marcus, Olivia, and Alex can plug the leak.
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center w-full max-w-md mx-auto sm:max-w-none">
              <CTAButton
                variant="secondary"
                size="lg"
                className="border-white/20 bg-white text-[var(--color-primary)] hover:bg-white/90 w-full sm:w-auto min-h-[44px]"
              >
                Book Free Consultation
              </CTAButton>
              <CTAButton
                variant="secondary"
                size="lg"
                href="/pricing"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto min-h-[44px]"
              >
                See Pricing
              </CTAButton>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────── */}
      <section className="section bg-[var(--color-bg)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
              Why Hotels Trust Persept
            </h2>
          </FadeUp>
          <StaggerContainer className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((tp, idx) => (
              <FadeUp key={tp.title} delay={idx * 0.1}>
                <div className="flex gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,71,87,0.1)]">
                    <tp.icon className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                      {tp.title}
                    </h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                      {tp.desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────── */}
      <section className="section bg-[var(--color-surface)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center lg:px-8">
          <FadeUp>
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)]">
              Your Team Deserves Better Than Copy-Pasting All Day. 💪
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
              Let Sarah handle the messages. Marcus tackle the reviews. Olivia fix the schedule. Alex crunch the numbers. Your team? They'll finally get to do the hospitality work they actually signed up for.
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <CTAButton className="mt-5 w-full max-w-xs sm:w-auto min-h-[44px]" size="lg">
              Book Free Consultation
            </CTAButton>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </>
  );
}
