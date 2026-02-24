import { Clock, Star, TrendingUp, Zap } from "lucide-react";

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

export function SocialProof() {
  return (
    <section id="social-proof" className="bg-[#f7f8fa] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
            Proven results
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-[#0c1222]">
            Numbers That Speak
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="fade-up rounded-2xl border border-[#e4e8ef] bg-white p-6"
              style={{ animationDelay: `${0.08 * idx}s` }}
            >
              <stat.icon className="mb-3 h-5 w-5 text-[#b91c1c]" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#0c1222]">
                  {stat.value}
                </span>
                <span className="text-[13px] font-medium text-[#5a6785]">
                  {stat.unit}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#5a6785]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="fade-up delay-3 mx-auto mt-12 max-w-3xl">
          <div className="rounded-2xl border border-[#e4e8ef] bg-white p-8 sm:p-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex gap-0.5">
                <Star className="h-4 w-4 fill-[#d97706] text-[#d97706]" />
                <Star className="h-4 w-4 fill-[#d97706] text-[#d97706]" />
                <Star className="h-4 w-4 fill-[#d97706] text-[#d97706]" />
                <Star className="h-4 w-4 fill-[#d97706] text-[#d97706]" />
                <Star className="h-4 w-4 fill-[#d97706] text-[#d97706]" />
              </div>

              <blockquote className="text-[15px] leading-relaxed text-[#3d4b63] sm:text-[16px]">
                &ldquo;We deployed Persept&apos;s AI agents across our three
                properties in Dubai Marina. Within the first month, our front
                office team reclaimed over 18 hours per week. The review
                response time went from 48 hours to under 10 minutes. It&apos;s
                been transformational.&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef2f2] text-[13px] font-bold text-[#b91c1c]">
                  OD
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-[#0c1222]">
                    Operations Director
                  </p>
                  <p className="text-[12px] text-[#5a6785]">
                    Boutique Hotel Group, Dubai Marina
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
