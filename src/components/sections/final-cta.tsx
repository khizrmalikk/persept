"use client";

import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";
import { FadeUp } from "@/components/ui/scroll-animations";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      {/* Red gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeUp>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.02em] text-white red-glow-text">
              Ready to Stop Drowning in Admin?
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-4 text-[15px] leading-relaxed text-white/50">
              Book a 30-minute call. We&apos;ll show you exactly how much time
              these AI agents can save you. Then you can decide if you want your
              life back or not.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <CTAButton size="lg" className="animate-pulse-subtle">
                Yes, I Want My Life Back
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton variant="secondary" size="lg">
                Show Me a Demo First
              </CTAButton>
            </div>
          </FadeUp>

          <FadeUp delay={0.25}>
            <a
              href="mailto:khizr@persept.ai"
              className="mt-5 inline-block text-[13px] font-medium text-white/30 transition-colors hover:text-white/60"
            >
              or email khizr@persept.ai
            </a>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
