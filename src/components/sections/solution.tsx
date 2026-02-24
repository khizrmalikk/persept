import {
  BarChart4,
  CalendarCheck,
  Check,
  MessageCircle,
  Star,
} from "lucide-react";

const agents = [
  {
    name: "Sarah",
    role: "Guest Communications",
    icon: MessageCircle,
    color: "#b91c1c",
    bg: "#fef2f2",
    capabilities: [
      "Responds across WhatsApp, email, and OTAs in seconds",
      "Handles bookings, pre-arrival info, and special requests",
      "Escalates complex issues with full context",
      "Supports English, Arabic, and 10+ languages",
    ],
  },
  {
    name: "Marcus",
    role: "Review Management",
    icon: Star,
    color: "#b45309",
    bg: "#fffbeb",
    capabilities: [
      "Monitors Google, TripAdvisor, Booking.com, and Zomato",
      "Drafts personalized responses within minutes",
      "Flags critical negative reviews immediately",
      "Tracks sentiment trends with monthly insights",
    ],
  },
  {
    name: "Olivia",
    role: "Staff Scheduling",
    icon: CalendarCheck,
    color: "#047857",
    bg: "#ecfdf5",
    capabilities: [
      "Builds optimized rosters from demand forecasts",
      "Handles shift swaps and time-off automatically",
      "Alerts managers to overtime risks early",
      "Integrates with your POS and HR systems",
    ],
  },
  {
    name: "Alex",
    role: "Reporting & Analytics",
    icon: BarChart4,
    color: "#1d4ed8",
    bg: "#eff6ff",
    capabilities: [
      "Pulls data from PMS, POS, OTAs, and social",
      "Generates daily/weekly reports automatically",
      "Spots anomalies in revenue and satisfaction",
      "Delivers insights via WhatsApp or email",
    ],
  },
];

export function Solution() {
  return (
    <section id="solution" className="bg-[#f7f8fa] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
            Your AI team
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-[#0c1222]">
            Meet Your AI Workforce
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a6785]">
            Four specialized AI agents, each trained for a critical hospitality
            function. They work 24/7, never call in sick, and get smarter every
            week.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {agents.map((agent, idx) => (
            <div
              key={agent.name}
              className="fade-up rounded-2xl border border-[#e4e8ef] bg-white p-6"
              style={{ animationDelay: `${0.08 * idx}s` }}
            >
              <div className="mb-5 flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: agent.bg }}
                >
                  <agent.icon
                    className="h-5 w-5"
                    style={{ color: agent.color }}
                  />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0c1222]">
                    {agent.name}
                  </h3>
                  <p className="text-[12px] font-medium text-[#5a6785]">
                    {agent.role}
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {agent.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-start gap-2.5 text-[13px]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b91c1c]" />
                    <span className="leading-snug text-[#3d4b63]">{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
