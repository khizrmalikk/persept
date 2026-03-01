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
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { CTAButton } from "@/components/ui/cta-button";

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
          {label}
        </p>
      )}
      <h2 className="mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-[-0.02em] text-[#0c1222]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[15px] leading-relaxed text-[#5a6785]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ProblemCard({ problem }: { problem: (typeof problems)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#e4e8ef] bg-white p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2]">
          <problem.icon className="h-5 w-5 text-[#b91c1c]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[17px] font-bold text-[#0c1222]">
            {problem.title}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[#b91c1c]">
              {problem.stat}
            </span>
            <span className="text-[13px] text-[#5a6785]">
              {problem.statLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-[#5a6785]">
        {problem.description}
      </p>

      <ul className="mt-4 space-y-2">
        {problem.damages.map((d) => (
          <li key={d} className="flex items-start gap-2 text-[13px]">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ef4444]" />
            <span className="text-[#3d4b63]">{d}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]"
      >
        What you've tried
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="mt-3 space-y-1.5 border-t border-[#f0f2f5] pt-3">
          {problem.tried.map((t) => (
            <li key={t} className="text-[13px] text-[#5a6785]">
              • {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OldSolutionCard({ sol }: { sol: (typeof oldSolutions)[number] }) {
  return (
    <div className="rounded-2xl border border-[#e4e8ef] bg-white p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f8fa]">
          <sol.icon className="h-5 w-5 text-[#5a6785]" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#0c1222]">{sol.title}</h3>
          <p className="text-[12px] text-[#5a6785]">{sol.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-[#f7f8fa] p-3 text-[13px] italic text-[#5a6785]">
        "{sol.promise}"
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#047857]">
            What they can do
          </p>
          <ul className="space-y-1.5">
            {sol.canDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#047857]" />
                <span className="text-[#3d4b63]">{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#ef4444]">
            What they can't do
          </p>
          <ul className="space-y-1.5">
            {sol.cantDo.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px]">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ef4444]" />
                <span className="text-[#3d4b63]">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] font-medium text-[#991b1b]">
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
    <div
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
            <h3 className="text-[18px] font-bold text-[#0c1222]">
              {agent.name}
            </h3>
            <p className="text-[13px] font-medium text-[#5a6785]">
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
              <span className="text-[#3d4b63]">{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f7f8fa] px-4 py-2 text-[13px] font-semibold text-[#0c1222]">
          {agent.impact}
        </div>
      </div>

      {/* Example */}
      <div className="flex-1">
        <button
          type="button"
          onClick={() => setShowExample((v) => !v)}
          className="mb-3 flex cursor-pointer items-center gap-1.5 text-[13px] font-medium"
          style={{ color: agent.color }}
        >
          {showExample ? "Hide" : "See"} example: {agent.exampleLabel}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showExample ? "rotate-180" : ""}`}
          />
        </button>

        {showExample && (
          <div className="rounded-2xl border border-[#e4e8ef] bg-[#f7f8fa] p-5">
            {agent.exampleGuest && (
              <div className="mb-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5a6785]">
                  Guest
                </p>
                <div className="rounded-xl rounded-tl-sm bg-white p-3 text-[13px] leading-relaxed text-[#3d4b63]">
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
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export function SolutionPage() {
  return (
    <>
      <Header />

      {/* ── Hero ───────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#f7f8fa] to-white py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h1 className="fade-up text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-[#0c1222]">
            Hotel Operations Shouldn't Feel Like Chaos
          </h1>
          <p className="fade-up delay-1 mt-5 text-[16px] leading-relaxed text-[#5a6785]">
            Your team is drowning in repetitive tasks. Guests wait hours for
            responses. Staff turnover is constant. There has to be a better way.
          </p>
          <div className="fade-up delay-2 mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CTAButton size="lg">
              Book Free Consultation
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton variant="secondary" size="lg" href="/pricing">
              See Pricing
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── Section 1: The Problems ────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            label="The reality"
            title="The Reality of Running a Hotel in 2026"
            subtitle="You're not alone. Most hotels struggle with the same challenges."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {problems.map((p) => (
              <ProblemCard key={p.title} problem={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Old Solutions ───────────────── */}
      <section className="bg-[#f7f8fa] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            label="Why they fail"
            title="Why Traditional 'Solutions' Fall Short"
            subtitle="You've seen the automation tools and AI chatbots. Here's why they're not the answer."
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {oldSolutions.map((s) => (
              <OldSolutionCard key={s.title} sol={s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Our Solution — The Agents ──── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            label="Our solution"
            title="The Real Solution: Intelligence, Not Just Automation"
            subtitle="Persept gives you an AI workforce — specialized agents that think, learn, and integrate deeply with your hotel operations."
          />

          {/* Comparison callout */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
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
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 text-center ${item.muted ? "border-[#e4e8ef] bg-[#f7f8fa]" : "border-[#b91c1c] bg-[#fef2f2]"}`}
              >
                <p
                  className={`text-[14px] font-bold ${item.muted ? "text-[#5a6785]" : "text-[#b91c1c]"}`}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-[12px] text-[#5a6785]">{item.desc}</p>
              </div>
            ))}
          </div>

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
      <section className="bg-[#0c1222] py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
              The full picture
            </p>
            <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold text-white">
              A Weekend at a 150-Room Hotel
            </h2>
            <p className="mt-2 text-[14px] text-white/60">
              See how all four agents work together in a real scenario.
            </p>
          </div>

          <div className="mt-10 space-y-4">
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
                color: "#047857",
                text: "Analyzes occupancy, recommends adding 2 housekeepers for Saturday checkout rush.",
              },
              {
                time: "Friday 2 PM",
                agent: "Sarah",
                color: "#b91c1c",
                text: "Handles 45 guest messages across WhatsApp, email, and Booking.com. Upsells 3 early check-ins.",
              },
              {
                time: "Friday 6 PM",
                agent: "Marcus",
                color: "#7c3aed",
                text: "Spots a negative Google review, drafts a response, and flags GM for approval.",
              },
              {
                time: "Saturday 9 AM",
                agent: "Sarah",
                color: "#b91c1c",
                text: "Sends automated check-out reminders — 80% of guests check out on time.",
              },
              {
                time: "Saturday 3 PM",
                agent: "Alex",
                color: "#1d4ed8",
                text: "Alerts GM: F&B revenue up 25% vs. last Saturday. Suggests Sunday brunch promo.",
              },
            ].map((event) => (
              <div
                key={event.time}
                className="flex items-start gap-4 rounded-xl bg-white/5 p-4"
              >
                <div
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div>
                  <p className="text-[12px] font-medium text-white/40">
                    {event.time}
                  </p>
                  <p className="text-[14px] text-white">
                    <span
                      className="font-semibold"
                      style={{ color: event.color }}
                    >
                      {event.agent}
                    </span>{" "}
                    {event.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-white/10 p-5">
            <p className="text-[13px] font-semibold text-white">
              Weekend result:
            </p>
            <div className="mt-2 grid gap-3 text-[13px] text-white/70 sm:grid-cols-3">
              <span>45+ inquiries handled</span>
              <span>3 upsells closed (AED 600)</span>
              <span>Review response: 2 hrs vs. 3 days</span>
              <span>Optimized staffing, no scrambling</span>
              <span>Revenue insights delivered proactively</span>
              <span className="font-semibold text-white">
                25–30 hours saved
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Why Different ───────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <SectionHeader
            label="The difference"
            title="Why Persept Isn't Just Another AI Tool"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {differences.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-[#e4e8ef] p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef2f2]">
                    <d.icon className="h-5 w-5 text-[#b91c1c]" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#0c1222]">
                    {d.title}
                  </h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-[#f7f8fa] p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#ef4444]">
                      Typical tools
                    </p>
                    <p className="text-[13px] text-[#5a6785]">{d.old}</p>
                  </div>
                  <div className="rounded-lg bg-[#ecfdf5] p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#047857]">
                      Persept
                    </p>
                    <p className="text-[13px] text-[#3d4b63]">{d.ours}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Before / After ─────────────── */}
      <section className="bg-[#f7f8fa] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <SectionHeader
            label="The transformation"
            title="What Changes When You Deploy Persept"
            subtitle="This isn't a marginal improvement. It's a fundamental shift in how your hotel operates."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Before */}
            <div className="rounded-2xl border border-[#fecaca] bg-white p-6 md:p-8">
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#ef4444]">
                Before Persept
              </p>
              <ul className="mt-4 space-y-3 text-[13px] text-[#5a6785]">
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

            {/* After */}
            <div className="rounded-2xl border border-[#86efac] bg-white p-6 md:p-8">
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#047857]">
                After Persept
              </p>
              <ul className="mt-4 space-y-3 text-[13px] text-[#3d4b63]">
                <li>7 AM — Check Sarah's escalations (5 min)</li>
                <li>8 AM — Review Alex's revenue report (5 min)</li>
                <li>8:30 AM — Approve Olivia's schedule (10 min)</li>
                <li>9 AM — Approve Marcus's review drafts (15 min)</li>
                <li className="font-semibold text-[#047857]">
                  9:30 AM – 6 PM — Focus on VIP experience, partnerships,
                  property improvements, team development
                </li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { value: "35–50 hrs", label: "saved per week" },
              { value: "10–15%", label: "labor cost reduction" },
              { value: "130–300%", label: "ROI in Year 1" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[#e4e8ef] bg-white p-5 text-center"
              >
                <p className="text-[28px] font-bold tracking-tight text-[#b91c1c]">
                  {s.value}
                </p>
                <p className="mt-1 text-[13px] text-[#5a6785]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Implementation Timeline ────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <SectionHeader
            label="Implementation"
            title="From Audit to Go-Live in 30 Days"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((step, idx) => (
              <div key={step.title} className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b91c1c] text-[12px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-[12px] font-medium text-[#5a6785]">
                    {step.day}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-[#0c1222]">
                  {step.title}
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {step.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px]"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b91c1c]" />
                      <span className="text-[#5a6785]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="bg-[#b91c1c] py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight text-white">
            Ready to Transform Your Hotel Operations?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            Book a free 30-minute consultation. We'll assess your property and
            show you exactly how Persept can save you 35+ hours per week.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CTAButton
              variant="secondary"
              size="lg"
              className="border-white/20 bg-white text-[#b91c1c] hover:bg-white/90"
            >
              Book Free Consultation
            </CTAButton>
            <CTAButton
              variant="secondary"
              size="lg"
              href="/pricing"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              See Pricing
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-center text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-[#0c1222]">
            Why Hotels Trust Persept
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((tp) => (
              <div key={tp.title} className="flex gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2]">
                  <tp.icon className="h-5 w-5 text-[#b91c1c]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#0c1222]">
                    {tp.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#5a6785]">
                    {tp.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────── */}
      <section className="bg-[#f7f8fa] py-16">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[20px] font-bold text-[#0c1222]">
            Stop Fighting the Chaos. Let AI Handle the Repetitive Work.
          </h2>
          <p className="mt-2 text-[14px] text-[#5a6785]">
            Your team deserves to focus on what matters: delivering exceptional
            guest experiences. Let Sarah, Marcus, Olivia, and Alex handle the
            rest.
          </p>
          <CTAButton className="mt-5" size="lg">
            Book Free Consultation
          </CTAButton>
        </div>
      </section>

      <Footer />
    </>
  );
}
