"use client";

import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCounter, FadeUp, GlowPulse } from "@/components/ui/scroll-animations";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-32">
      {/* Particle background only - no 3D shapes */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <AnimatedBackground />
      </div>

      {/* Gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-red-500">
              Built for Dubai Hospitality
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em] text-white red-glow-text">
              Your Hotel&apos;s AI Dream Team.
              <br />
              <span className="text-red-500">They Work 24/7 and Never Ask for Eid Holidays.&nbsp;🌙</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-white/50">
              Four tireless AI agents who handle guest messages, reviews,
              scheduling, and reports while your team focuses on the parts of
              hospitality that actually require a heartbeat.
            </p>
          </FadeUp>

          <FadeUp delay={0.25}>
            <p className="mx-auto mt-3 max-w-xl text-[14px] italic text-white/30">
              No sick days. No drama. No &ldquo;I forgot to check WhatsApp.&rdquo; Just results.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 w-full max-w-md mx-auto sm:max-w-none">
              <CTAButton size="lg" className="w-full sm:w-auto">
                Yes, I Want My Life Back
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton variant="secondary" size="lg" href="#how-it-works" className="w-full sm:w-auto">
                Show Me a Demo First
              </CTAButton>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="mt-10 sm:mt-14 flex flex-col items-center gap-3 sm:gap-4 md:flex-row md:justify-center md:gap-8">
              {[
                { value: 18, prefix: "", suffix: "+hrs", label: "saved weekly" },
                { value: 30, prefix: "<", suffix: "s", label: "response time" },
                { value: 24, prefix: "", suffix: "/7", label: "availability" },
              ].map((stat) => (
                <GlowPulse key={stat.label}>
                  <div className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2">
                    <span className="text-[15px] font-bold text-white">
                      <AnimatedCounter
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </span>
                    <span className="text-[13px] text-white/40">{stat.label}</span>
                  </div>
                </GlowPulse>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
