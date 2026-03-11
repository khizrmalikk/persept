import { Clock, MessageCircle, Star, TrendingUp, Zap } from "lucide-react";

const stats = [
  {
    icon: Clock,
    value: "18+",
    unit: "hrs/week",
    label: "Saved per property",
  },
  {
    icon: Zap,
    value: "<30",
    unit: "seconds",
    label: "Avg. AI response time",
  },
  {
    icon: Star,
    value: "4.9",
    unit: "stars",
    label: "Avg. review score lift",
  },
  {
    icon: TrendingUp,
    value: "40%",
    unit: "fewer",
    label: "Scheduling conflicts",
  },
];

const testimonials = [
  {
    quote:
      "Finally, someone who responds to guest messages faster than I can say 'check availability.'",
    initials: "HM",
    name: "Hotel Manager",
    location: "Palm Jumeirah",
  },
  {
    quote:
      "Marcus saved my Google rating. I owe him a drink. Except he's AI. So I owe the developers a drink.",
    initials: "RO",
    name: "Resort Owner",
    location: "Downtown Dubai",
  },
  {
    quote:
      "We deployed Persept's AI agents across our three properties in Dubai Marina. Within the first month, our front office team reclaimed over 18 hours per week. The review response time went from 48 hours to under 10 minutes. It's been transformational.",
    initials: "OD",
    name: "Operations Director",
    location: "Boutique Hotel Group, Dubai Marina",
  },
];

export function SocialProof() {
  return (
    <section id="social-proof" className="bg-white/[0.02] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ef4444]">
            Don&apos;t just take our word for it
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            Numbers That Speak
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="fade-up rounded-2xl border border-white/10 bg-white/5 p-6"
              style={{ animationDelay: `${0.08 * idx}s` }}
            >
              <stat.icon className="mb-3 h-5 w-5 text-[#ef4444]" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-white">
                  {stat.value}
                </span>
                <span className="text-[13px] font-medium text-white/40">
                  {stat.unit}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="fade-up rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
              style={{ animationDelay: `${0.1 * idx}s` }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]"
                    />
                  ))}
                </div>

                <blockquote className="text-[14px] leading-relaxed text-white/60">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ef4444]/10 text-[12px] font-bold text-[#ef4444]">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-white/80">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-white/40">{t.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
