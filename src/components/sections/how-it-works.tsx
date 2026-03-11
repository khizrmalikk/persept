"use client";

import { ArrowRight, RefreshCw, Rocket, Search } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { StaggerContainer, StaggerItem, FadeUp } from "@/components/ui/scroll-animations";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "2-Day AI Audit",
    price: "$3,500",
    duration: "2 business days",
    description:
      "We map your operations, identify the highest-impact automation opportunities, and deliver a concrete implementation plan.",
    deliverables: [
      "Operations workflow audit",
      "AI opportunity scoring matrix",
      "Implementation roadmap with ROI projections",
      "Go / no-go recommendation",
    ],
  },
  {
    number: "02",
    icon: Rocket,
    title: "30-Day Deployment",
    price: "$12,000",
    duration: "30 days",
    description:
      "We build, train, and deploy your custom AI agents — fully integrated with your existing systems and tested with real scenarios.",
    deliverables: [
      "Custom AI agents for your operations",
      "Integration with PMS, POS, OTAs, and channels",
      "Staff training and onboarding sessions",
      "30-day performance guarantee",
    ],
  },
  {
    number: "03",
    icon: RefreshCw,
    title: "Ongoing Optimization",
    price: "$5,000/mo",
    duration: "Monthly",
    description:
      "Continuous monitoring, improvement, and expansion of your AI workforce — plus priority support and new capabilities.",
    deliverables: [
      "Monthly performance reports and tuning",
      "New agent training as your needs evolve",
      "Priority support with 2-hour SLA",
      "Quarterly strategy review sessions",
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
              Simple process
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              How It Works
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mt-3 text-[15px] leading-relaxed text-white/50">
              From audit to deployment in 30 days. No multi-month projects, no
              scope creep — just results.
            </p>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-14 grid gap-5 lg:grid-cols-3">
          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04] red-glow-hover">
                <div className="pointer-events-none absolute -right-2 -top-4 text-[120px] font-bold leading-none text-white/[0.02] select-none">
                  {step.number}
                </div>

                <div className="relative">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                      <step.icon className="h-[18px] w-[18px] text-red-500" />
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-white">
                        {step.price}
                      </p>
                      <p className="text-[11px] font-medium text-white/40">
                        {step.duration}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-[18px] font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                    {step.description}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-white/5 pt-5">
                    {step.deliverables.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2.5 text-[13px]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        <span className="text-white/50">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.3} className="mt-12 text-center">
          <CTAButton size="lg">
            Start with the AI Audit
            <ArrowRight className="h-4 w-4" />
          </CTAButton>
        </FadeUp>
      </div>
    </section>
  );
}
