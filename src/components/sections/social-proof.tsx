"use client";

import { Clock, Star, TrendingUp, Zap } from "lucide-react";
import { AnimatedCounter, FadeUp, GlowPulse, StaggerContainer, StaggerItem } from "@/components/ui/scroll-animations";

const stats = [
  {
    icon: Clock,
    value: 18,
    prefix: "",
    suffix: "+",
    unit: "hrs/week",
    label: "Saved per property",
  },
  {
    icon: Zap,
    value: 30,
    prefix: "<",
    suffix: "",
    unit: "seconds",
    label: "Avg. AI response time",
  },
  {
    icon: Star,
    value: 4.9,
    prefix: "",
    suffix: "",
    unit: "stars",
    label: "Avg. review score lift",
  },
  {
    icon: TrendingUp,
    value: 40,
    prefix: "",
    suffix: "%",
    unit: "fewer",
    label: "Scheduling conflicts",
  },
];

export function SocialProof() {
  return (
    <section id="social-proof" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
              Proven results
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              Numbers That Speak
            </h2>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <GlowPulse>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04]">
                  <stat.icon className="mb-3 h-5 w-5 text-red-500" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-white">
                      <AnimatedCounter
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </span>
                    <span className="text-[13px] font-medium text-white/40">
                      {stat.unit}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-white/30">{stat.label}</p>
                </div>
              </GlowPulse>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.3} className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>

              <blockquote className="text-[15px] leading-relaxed text-white/60 sm:text-[16px]">
                &ldquo;We deployed Persept&apos;s AI agents across our three
                properties in Dubai Marina. Within the first month, our front
                office team reclaimed over 18 hours per week. The review
                response time went from 48 hours to under 10 minutes. It&apos;s
                been transformational.&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-[13px] font-bold text-red-500">
                  OD
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-white">
                    Operations Director
                  </p>
                  <p className="text-[12px] text-white/40">
                    Boutique Hotel Group, Dubai Marina
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
