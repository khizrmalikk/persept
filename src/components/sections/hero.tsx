import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { NetworkCanvas } from "@/components/ui/network-canvas";

export function Hero() {
  return (
    <section className="relative border-b border-[#e4e8ef] py-20 sm:py-28 lg:py-32 overflow-hidden">
      <NetworkCanvas />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="fade-up text-[12px] font-medium uppercase tracking-[0.15em] text-[#b91c1c]">
            Built for Dubai Hospitality
          </p>

          <h1 className="fade-up delay-1 mt-5 text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.035em] text-[#0c1222]">
            Save 15–20 Hours Per Week
            <br />
            <span className="text-[#b91c1c]">with Your Own AI Workforce</span>
          </h1>

          <p className="fade-up delay-2 mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-[#5a6785]">
            Purpose-built AI agents that handle guest communications, review
            management, staff scheduling, and reporting — so your team focuses
            on delivering exceptional hospitality.
          </p>

          <div className="fade-up delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <CTAButton size="lg">
              Book a Free Consultation
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton variant="secondary" size="lg">
              See How It Works
            </CTAButton>
          </div>

          <div className="fade-up delay-4 mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            {[
              { value: "18+ hrs", label: "saved weekly" },
              { value: "<30s", label: "response time" },
              { value: "24/7", label: "availability" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-[#0c1222]">
                  {stat.value}
                </span>
                <span className="text-[13px] text-[#5a6785]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
