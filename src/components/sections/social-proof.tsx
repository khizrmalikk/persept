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
              Don&apos;t just take our word for it
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

        <StaggerContainer className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              quote: "Finally, someone who responds to guest messages faster than I can say 'check availability.'",
              initials: "HM",
              name: "Hotel Manager",
              location: "Palm Jumeirah",
            },
            {
              quote: "Marcus saved my Google rating. I owe him a drink. Except he's AI. So I owe the developers a drink.",
              initials: "RO",
              name: "Resort Owner",
              location: "Downtown Dubai",
            },
            {
              quote: "We deployed Persept's AI agents across our three properties. Within the first month, our front office team reclaimed over 18 hours per week. It's been transformational.",
              initials: "OD",
              name: "Operations Director",
              location: "Boutique Hotel Group, Dubai Marina",
            },
          ].map((t, idx) => (
            <StaggerItem key={idx}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04] h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <blockquote className="text-[14px] leading-relaxed text-white/50 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-[12px] font-bold text-red-500">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-white/80">{t.name}</p>
                    <p className="text-[11px] text-white/30">{t.location}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
