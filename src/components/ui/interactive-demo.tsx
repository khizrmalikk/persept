"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Star, Calendar, ArrowRight, Sparkles } from "lucide-react";

interface Scenario {
  id: string;
  icon: typeof MessageCircle;
  title: string;
  trigger: string;
  input: string;
  processing: string;
  output: string;
  color: string;
}

const scenarios: Scenario[] = [
  {
    id: "guest",
    icon: MessageCircle,
    title: "Guest Message",
    trigger: "Incoming WhatsApp",
    input: '"Hi, is late checkout available tomorrow? Room 412."',
    processing: "Sarah AI checking availability...",
    output: '"Hi! Yes, late checkout until 2pm is available for Room 412. I\'ve noted it on your reservation. Enjoy your stay! 🌟"',
    color: "#b91c1c",
  },
  {
    id: "review",
    icon: Star,
    title: "Review Response",
    trigger: "New Google Review ★★★★",
    input: '"Great location and friendly staff. Pool area could use more seating."',
    processing: "Marcus AI drafting response...",
    output: '"Thank you for the wonderful 4-star review! We\'re thrilled you enjoyed our location and team. Great feedback on the pool area — we\'re adding new loungers next month. Hope to welcome you back soon!"',
    color: "#dc2626",
  },
  {
    id: "schedule",
    icon: Calendar,
    title: "Staff Scheduling",
    trigger: "Friday shift gap detected",
    input: "Evening shift: 2 servers needed, only 1 assigned. High occupancy forecast (94%).",
    processing: "Olivia AI optimizing roster...",
    output: "Assigned Ahmad (available, overtime-eligible) + notified backup pool. Estimated cost: +180 AED vs. understaffing risk of 2,400 AED revenue impact.",
    color: "#ef4444",
  },
];

function TypeWriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-red-500">|</span>}
    </span>
  );
}

function DemoCard({ scenario, isActive, onClick }: { scenario: Scenario; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        isActive
          ? "border-red-500/30 bg-red-500/10 red-glow"
          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isActive ? "bg-red-500/20" : "bg-white/5"
        }`}
      >
        <scenario.icon className={`h-4 w-4 ${isActive ? "text-red-400" : "text-white/40"}`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${isActive ? "text-white" : "text-white/60"}`}>
          {scenario.title}
        </p>
        <p className="text-xs text-white/30">{scenario.trigger}</p>
      </div>
    </motion.button>
  );
}

export function InteractiveDemo() {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const [step, setStep] = useState<"input" | "processing" | "output">("input");
  const active = scenarios.find((s) => s.id === activeId)!;

  const handleSelect = (id: string) => {
    setActiveId(id);
    setStep("input");
    // Animate through steps
    setTimeout(() => setStep("processing"), 800);
    setTimeout(() => setStep("output"), 2200);
  };

  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
            Live Preview
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-[-0.02em] text-white">
            See AI in Action
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/50">
            Click a scenario to watch your AI workforce handle it in real-time.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Scenario selector */}
          <div className="flex flex-row gap-3 lg:flex-col">
            {scenarios.map((s) => (
              <DemoCard
                key={s.id}
                scenario={s}
                isActive={activeId === s.id}
                onClick={() => handleSelect(s.id)}
              />
            ))}
          </div>

          {/* Demo canvas */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2">
              {(["input", "processing", "output"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${
                      step === s
                        ? "bg-red-500 shadow-[0_0_8px_rgba(185,28,28,0.5)]"
                        : (["input", "processing", "output"].indexOf(step) > i
                          ? "bg-red-500/40"
                          : "bg-white/10")
                    }`}
                  />
                  {i < 2 && (
                    <div className={`h-px w-8 transition-all duration-500 ${
                      ["input", "processing", "output"].indexOf(step) > i ? "bg-red-500/30" : "bg-white/5"
                    }`} />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs capitalize text-white/30">{step}</span>
            </div>

            <AnimatePresence mode="wait">
              {step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <active.icon className="h-3.5 w-3.5" />
                    {active.trigger}
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-sm leading-relaxed text-white/70">{active.input}</p>
                  </div>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 py-8"
                >
                  <Sparkles className="h-5 w-5 animate-pulse text-red-500" />
                  <p className="text-sm text-white/60">{active.processing}</p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-red-500"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "output" && (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs text-red-400/60">
                    <ArrowRight className="h-3.5 w-3.5" />
                    AI Response
                  </div>
                  <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
                    <p className="text-sm leading-relaxed text-white/80">
                      <TypeWriter text={active.output} speed={15} />
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-red-500/5 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
