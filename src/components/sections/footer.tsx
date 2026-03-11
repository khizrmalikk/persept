import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-bold tracking-tight text-white">
              Persept AI Workforce Solutions
            </p>
            <p className="mt-0.5 text-[12px] text-white/40">
              Purpose-built AI agents for hospitality operations.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 text-[12px] text-white/40">
            <a
              href="mailto:khizr@persept.ai"
              className="inline-flex items-center gap-2 transition-colors hover:text-white/70"
            >
              <Mail className="h-3.5 w-3.5" />
              khizr@persept.ai
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Dubai, UAE
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center text-[11px] text-white/20">
          &copy; 2026 Persept AI Workforce Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
