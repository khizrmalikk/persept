import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#ef4444] py-24 sm:py-28">
      {/* Subtle glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            Ready to Stop Drowning in Admin?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/80">
            Book a 30-minute call. We&apos;ll show you exactly how much time
            these AI agents can save you. Then you can decide if you want your
            life back or not.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <CTAButton
              size="lg"
              className="bg-white text-[#ef4444] shadow-lg shadow-black/20 hover:bg-white/90 animate-pulse-subtle"
            >
              Yes, I Want My Life Back
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton
              variant="secondary"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Show Me a Demo First
            </CTAButton>
          </div>

          <a
            href="mailto:khizr@persept.ai"
            className="mt-5 inline-block text-[13px] font-medium text-white/50 transition-colors hover:text-white/80"
          >
            or email khizr@persept.ai
          </a>
        </div>
      </div>
    </section>
  );
}
