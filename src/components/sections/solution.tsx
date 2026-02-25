"use client";

import {
  BarChart4,
  CalendarCheck,
  Check,
  MessageCircle,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useRef, useState } from "react";

const SarahScene = dynamic(
  () =>
    import("@/components/ui/agent-model").then((mod) => ({
      default: mod.SarahScene,
    })),
  { ssr: false },
);

const MarcusScene = dynamic(
  () =>
    import("@/components/ui/agent-model").then((mod) => ({
      default: mod.MarcusScene,
    })),
  { ssr: false },
);

const OliviaScene = dynamic(
  () =>
    import("@/components/ui/agent-model").then((mod) => ({
      default: mod.OliviaScene,
    })),
  { ssr: false },
);

const AlexScene = dynamic(
  () =>
    import("@/components/ui/agent-model").then((mod) => ({
      default: mod.AlexScene,
    })),
  { ssr: false },
);

interface Agent {
  name: string;
  role: string;
  icon: typeof MessageCircle;
  color: string;
  bg: string;
  scene: ComponentType<{ color: string; inView?: boolean }>;
  capabilities: string[];
}

const agents: Agent[] = [
  {
    name: "Sarah",
    role: "Guest Communications",
    icon: MessageCircle,
    color: "#b91c1c",
    bg: "#fef2f2",
    scene: SarahScene,
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
    color: "#7c3aed",
    bg: "#f5f3ff",
    scene: MarcusScene,
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
    scene: OliviaScene,
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
    scene: AlexScene,
    capabilities: [
      "Pulls data from PMS, POS, OTAs, and social",
      "Generates daily/weekly reports automatically",
      "Spots anomalies in revenue and satisfaction",
      "Delivers insights via WhatsApp or email",
    ],
  },
];

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function AgentRow({ agent, reversed }: { agent: Agent; reversed: boolean }) {
  const { ref, inView } = useInView(0.25);

  return (
    <div ref={ref}>
      <div
        className={`flex flex-col items-center ${reversed ? "md:flex-row-reverse" : "md:flex-row"} gap-6 md:gap-10`}
      >
        {/* 3D Scene */}
        <div className="h-[220px] w-full md:h-[350px] md:w-1/2">
          <div className="h-full w-full">
            <agent.scene color={agent.color} inView={inView} />
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-1 flex-col justify-center px-1 py-2 md:px-4">
          <div className="mb-6 flex items-center gap-3.5">
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
              <h3 className="text-[18px] font-bold text-[#0c1222]">
                {agent.name}
              </h3>
              <p className="text-[13px] font-medium text-[#5a6785]">
                {agent.role}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {agent.capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-start gap-2.5 text-[14px]"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: agent.color }}
                />
                <span className="leading-snug text-[#3d4b63]">{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

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

        <div className="mt-16 flex flex-col gap-16 md:gap-20">
          {agents.map((agent, idx) => (
            <AgentRow
              key={agent.name}
              agent={agent}
              reversed={idx % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
