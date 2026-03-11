import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left — brand */}
          <div>
            <p className="text-[14px] font-bold tracking-tight text-white">
              Persept AI Workforce Solutions
            </p>
            <p className="mt-0.5 text-[12px] text-[#737373]">
              Purpose-built AI agents for hospitality operations.
            </p>
          </div>

          {/* Right — contact */}
          <div className="flex flex-col gap-1.5 text-[12px] text-[#737373]">
            <a
              href="mailto:khizr@persept.ai"
              className="inline-flex items-center gap-2 transition-colors hover:text-[#b91c1c]"
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

        <div className="mt-8 border-t border-[#262626] pt-6 text-center text-[11px] text-[#525252]">
          &copy; 2026 Persept AI Workforce Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
