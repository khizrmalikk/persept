"use client";

import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCounter, FadeUp, GlowPulse } from "@/components/ui/scroll-animations";
import dynamic from "next/dynamic";

const HotelScene = dynamic(
  () => import("@/components/ui/hotel-scene").then((mod) => ({ default: mod.HotelScene })),
  { ssr: false }
);

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <AnimatedBackground />

      {/* Hero 3D Scene */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <HotelScene />
      </div>

      {/* Top gradient overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/60" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-red-500">
              Built for Dubai Hospitality
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em] text-white red-glow-text">
              Save 15–20 Hours Per Week
              <br />
              <span className="text-red-500">with Your Own AI Workforce</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-white/50">
              Purpose-built AI agents that handle guest communications, review
              management, staff scheduling, and reporting — so your team focuses
              on delivering exceptional hospitality.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <CTAButton size="lg">
                Book a Free Consultation
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton variant="secondary" size="lg" href="#how-it-works">
                See How It Works
              </CTAButton>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
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
