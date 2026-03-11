"use client";

import {
  BarChart3,
  CalendarX,
  Clock,
  MessageSquareWarning,
  Star,
  Users,
} from "lucide-react";
import { StaggerContainer, StaggerItem, FadeUp } from "@/components/ui/scroll-animations";

const painPoints = [
  {
    icon: MessageSquareWarning,
    title: "WhatsApp won't stop buzzing",
    desc: "Your phone won't stop buzzing with guest messages. Your thumb has carpal tunnel from copy-pasting the same replies.",
  },
  {
    icon: Star,
    title: "That review is still sitting there",
    desc: "That 2-star review from last week? Still sitting there. Unanswered. Mocking you. Ruining your rating.",
  },
  {
    icon: CalendarX,
    title: "Scheduling is a nightmare",
    desc: "Making the staff rota feels like playing Tetris blindfolded. With angry pieces that call in sick.",
  },
  {
    icon: BarChart3,
    title: "Monday morning reporting hell",
    desc: "It's Monday. You're pulling data from 6 different systems into Excel. Again. Your soul dies a little.",
  },
  {
    icon: Clock,
    title: "15–20 hours per week — gone",
    desc: "Your best people spend their days on tasks a well-trained AI agent could handle instantly. That's not a team, that's a copy machine.",
  },
  {
    icon: Users,
    title: "Can't grow without hiring",
    desc: "Every new property means hiring more ops staff — and that takes months. Your ambition moves faster than your headcount.",
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <FadeUp>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
              Sound familiar?
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
              Sound Familiar?&nbsp;🤦
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mt-3 text-[15px] leading-relaxed text-white/50">
              If you&apos;re nodding along, you&apos;re not alone. These
              operational headaches cost Dubai hospitality businesses thousands
              of dirhams every month.
            </p>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point) => (
            <StaggerItem key={point.title}>
              <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-red-500/20 hover:bg-white/[0.04] red-glow-hover">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <point.icon className="h-[18px] w-[18px] text-red-500" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">
                  {point.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                  {point.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
