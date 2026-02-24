import { ArrowRight } from "lucide-react";
import { CTAButton } from "@/components/ui/cta-button";

export function FinalCTA() {
  return (
    <section className="bg-[#b91c1c] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            Ready to Build Your AI Workforce?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Book a free 30-minute consultation. We&apos;ll assess your
            operations and show you exactly where AI agents can save you time
            and money.
          </p>

          <div className="mt-10">
            <CTAButton
              size="lg"
              className="bg-white text-[#b91c1c] hover:bg-white/90"
            >
              Book Free Consultation
              <ArrowRight className="h-4 w-4" />
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
