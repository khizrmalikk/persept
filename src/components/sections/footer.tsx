import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#e4e8ef] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left — brand */}
          <div>
            <p className="text-[14px] font-bold tracking-tight text-[#0c1222]">
              Persept AI Workforce Solutions
            </p>
            <p className="mt-0.5 text-[12px] text-[#5a6785]">
              Purpose-built AI agents for hospitality operations.
            </p>
          </div>

          {/* Right — contact */}
          <div className="flex flex-col gap-1.5 text-[12px] text-[#5a6785]">
            <a
              href="mailto:khizr@persept.ai"
              className="inline-flex items-center gap-2 transition-colors hover:text-[#0c1222]"
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

        <div className="mt-8 border-t border-[#e4e8ef] pt-6 text-center text-[11px] text-[#94a3b8]">
          &copy; 2026 Persept AI Workforce Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
