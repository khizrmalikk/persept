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
import { motion, useInView } from "framer-motion";

const SarahScene = dynamic(
  () => import("@/components/ui/agent-model").then((mod) => ({ default: mod.SarahScene })),
  { ssr: false }
);
const MarcusScene = dynamic(
  () => import("@/components/ui/agent-model").then((mod) => ({ default: mod.MarcusScene })),
  { ssr: false }
);
const OliviaScene = dynamic(
  () => import("@/components/ui/agent-model").then((mod) => ({ default: mod.OliviaScene })),
  { ssr: false }
);
const AlexScene = dynamic(
  () => import("@/components/ui/agent-model").then((mod) => ({ default: mod.AlexScene })),
  { ssr: false }
);

interface Agent {
  name: string;
  role: string;
  tagline: string;
  description: string;
  icon: typeof MessageCircle;
  color: string;
  scene: ComponentType<{ color: string; inView?: boolean }>;
  capabilities: string[];
}

const agents: Agent[] = [
  {
    name: "Sarah",
    role: "Guest Communications",
    tagline: "The diplomat. Handles angry guests at 3 AM without breaking a sweat.",
    description: "Sarah responds to WhatsApp, email, and OTA messages faster than you can say 'check-in time.' Fluent in English, Arabic, and Guest-ese. Never gets tired of explaining the breakfast hours.",
    icon: MessageCircle,
    color: "#ef4444",
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
    tagline: "The smooth talker. Turns complainers into promoters.",
    description: "Marcus monitors every review site 24/7 and drafts professional responses before you finish your morning coffee. He's seen it all and still stays polite.",
    icon: Star,
    color: "#a855f7",
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
    tagline: "The organizer. Your calendar's best friend.",
    description: "Olivia builds perfect rotas, handles shift swaps, and alerts you to overtime risks before they blow your budget. She's basically magic with a spreadsheet.",
    icon: CalendarCheck,
    color: "#10b981",
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
    tagline: "The analyst. Numbers nerd with a purpose.",
    description: "Alex pulls data from everywhere, spots problems before they happen, and delivers insights to your phone every morning. Your Monday mornings just got tolerable.",
    icon: BarChart4,
    color: "#3b82f6",
    scene: AlexScene,
    capabilities: [
      "Pulls data from PMS, POS, OTAs, and social",
      "Generates daily/weekly reports automatically",
      "Spots anomalies in revenue and satisfaction",
      "Delivers insights via WhatsApp or email",
    ],
  },
];

function AgentRow({ agent, reversed, index }: { agent: Agent; reversed: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
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
          <div className="mb-3 flex items-center gap-3.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${agent.color}15` }}
            >
              <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-white">{agent.name}</h3>
              <p className="text-[13px] font-medium text-white/50">{agent.role}</p>
            </div>
          </div>

          <p className="mb-2 text-[14px] font-medium italic" style={{ color: agent.color }}>
            {agent.tagline}
          </p>
          <p className="mb-5 text-[14px] leading-relaxed text-white/50">
            {agent.description}
          </p>

          <ul className="space-y-3">
            {agent.capabilities.map((cap, i) => (
              <motion.li
                key={cap}
                className="flex items-start gap-2.5 text-[14px]"
                initial={{ opacity: 0, x: reversed ? -20 : 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: agent.color }} />
                <span className="leading-snug text-white/60">{cap}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function Solution() {
  return (
    <section id="solution" className="py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500"
          >
            Meet the team
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white"
          >
            Your AI Dream Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-[15px] leading-relaxed text-white/50"
          >
            Four specialized AI agents, each with their own personality and
            superpowers. They work 24/7, never call in sick, and get smarter
            every week.
          </motion.p>
        </div>

        <div className="mt-16 flex flex-col gap-16 md:gap-20">
          {agents.map((agent, idx) => (
            <AgentRow
              key={agent.name}
              agent={agent}
              reversed={idx % 2 === 1}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
