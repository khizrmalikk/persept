import {
  BarChart3,
  CalendarX,
  Clock,
  MessageSquareWarning,
  Star,
  Users,
} from "lucide-react";

const painPoints = [
  {
    icon: MessageSquareWarning,
    title: "Drowning in guest messages",
    desc: "WhatsApp, email, OTAs — your team copies and pastes the same replies hundreds of times a week.",
  },
  {
    icon: Star,
    title: "Reviews slipping through the cracks",
    desc: "Negative reviews sit unanswered for days. Positive ones never get a thank-you that drives loyalty.",
  },
  {
    icon: CalendarX,
    title: "Staff scheduling nightmares",
    desc: "Building rosters manually, scrambling for cover, overtime surprises eating into margins.",
  },
  {
    icon: BarChart3,
    title: "Reporting takes all Monday morning",
    desc: "Pulling numbers from 5 different dashboards into a spreadsheet nobody reads until Tuesday.",
  },
  {
    icon: Clock,
    title: "15–20 hours per week wasted",
    desc: "Your best people spend their days on tasks a well-trained AI agent could handle instantly.",
  },
  {
    icon: Users,
    title: "Can't scale without headcount",
    desc: "Every new property or outlet means hiring more operations staff — and that takes months.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b91c1c]">
            Sound familiar?
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-[#0c1222]">
            Is Your Team Drowning In&hellip;
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a6785]">
            These operational bottlenecks cost Dubai hospitality businesses
            thousands of dirhams every month.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point, idx) => (
            <div
              key={point.title}
              className="fade-up rounded-2xl border border-[#e4e8ef] p-6 transition-colors duration-200 hover:border-[#c7d2e0]"
              style={{ animationDelay: `${0.06 * idx}s` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef2f2]">
                <point.icon className="h-[18px] w-[18px] text-[#b91c1c]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#0c1222]">
                {point.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5a6785]">
                {point.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
