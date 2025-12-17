"use client";

import Image from "next/image";
import React, { useState } from "react";
import { PixelatedCanvas } from "@/components/ui/pixelated-canvas";

const projects = [
  {
    name: "GYST",
    blurb: "AI tasking companion that ships updates fast.",
    highlight: "Inbox-to-action flow drove 42% more completed tasks in pilot.",
    tags: ["AI", "Product", "Marketing video"],
    image: "/image7.avif",
    color: "#3ccc29",
    link: "https://startgyst.com/",
  },
  {
    name: "RELQ",
    blurb: "Relationship CRM to keep key people warm.",
    highlight: "Prototype to demo in 7 days; rolled to first 50 users in month one.",
    tags: ["Prototype", "CRM", "Launch site"],
    image: "/image8.png",
    color: "#3b82f6",
    link: "https://www.qauli.com/#demo",
  },
  {
    name: "The Whole 9 Yards",
    blurb: "Creator-led commerce experiments.",
    highlight: "Landing + offer test generated paid waitlist in week two.",
    tags: ["E-comm", "Landing", "Growth"],
    image: "/image12.png",
    color: "#f97316",
    link: "https://www.thew9y.com",
  },
];

const services = [
  {
    title: "Week-One Prototype",
    desc: "Clickable demo or lightweight build in 7 days. Clear UX, core flows, and a live demo link.",
    items: [
      "Scope to one sharp problem",
      "Design + build + deploy fast",
      "Includes 1 iteration inside the week",
    ],
  },
  {
    title: "Launch-Ready Build",
    desc: "Productionized MVP or site with QA, auth, analytics, and payments where needed.",
    items: [
      "Next.js + Tailwind + Supabase/Stripe",
      "SEO + performance + responsiveness",
      "Deploy to Vercel with handover",
    ],
  },
  {
    title: "Go-To-Market Kit",
    desc: "Landing page + short-form video set + ad setup so you can start converting day one.",
    items: [
      "Landing built for conversion",
      "3–5 Instagram/TikTok-style clips",
      "Analytics + funnels wired in",
    ],
  },
];

const packages = [
  {
    name: "Info / Brand Site",
    price: "$5k–$8k",
    bullets: ["Brand-ready landing + CMS", "Integrations & forms", "SEO + speed tuned"],
  },
  {
    name: "E-commerce",
    price: "$8k–$15k",
    bullets: ["Catalog + payments", "Automation & email capture", "Performance + CRO-ready"],
  },
  {
    name: "Full Software",
    price: "$15k–$40k+",
    bullets: ["Auth, data model, dashboards", "Integrations & AI features", "Staging + QA + deploy"],
  },
];

const retainers = [
  {
    name: "Care",
    price: "$1k–$2k/mo (info), $2k–$4k/mo (e-comm)",
    includes: [
      "Uptime, fixes, CMS updates",
      "Security and dependency patching",
      "Analytics watch + monthly report",
    ],
  },
  {
    name: "Growth",
    price: "$3k–$5k/mo",
    includes: [
      "Monthly experiments & CRO",
      "Performance tuning & UX polish",
      "Creative refresh (1–2 clips/mo)",
    ],
  },
  {
    name: "Performance",
    price: "$5k–$9k/mo",
    includes: [
      "Roadmap ownership & sprinting",
      "New features + integrations",
      "Proactive reporting & strategy",
    ],
  },
];

const steps = [
  { title: "Intake", text: "20-min fit call. Clarify the win and define the one-week target." },
  { title: "Week 1", text: "Design, build, and deploy a working demo or prototype." },
  { title: "Iterate", text: "Tight feedback loop. Adjust UX, flows, and performance." },
  { title: "Launch", text: "Ship to users with landing, analytics, and creative ready." },
];

const palettes = [
  { main: "#3ccc29", light: "#d6f9cc", alpha10: "rgba(60,204,41,0.1)", alpha20: "rgba(60,204,41,0.2)", alpha30: "rgba(60,204,41,0.3)" },
  { main: "#f97316", light: "#ffe3c4", alpha10: "rgba(249,115,22,0.1)", alpha20: "rgba(249,115,22,0.2)", alpha30: "rgba(249,115,22,0.3)" },
  { main: "#ef4444", light: "#ffd6d6", alpha10: "rgba(239,68,68,0.1)", alpha20: "rgba(239,68,68,0.2)", alpha30: "rgba(239,68,68,0.3)" },
  { main: "#3b82f6", light: "#d9e8ff", alpha10: "rgba(59,130,246,0.1)", alpha20: "rgba(59,130,246,0.2)", alpha30: "rgba(59,130,246,0.3)" },
  { main: "#a855f7", light: "#ead8ff", alpha10: "rgba(168,85,247,0.1)", alpha20: "rgba(168,85,247,0.2)", alpha30: "rgba(168,85,247,0.3)" },
  { main: "#7bdcb5", light: "#d9f7ea", alpha10: "rgba(123,220,181,0.1)", alpha20: "rgba(123,220,181,0.2)", alpha30: "rgba(123,220,181,0.3)" },
];

export default function Home() {
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const [navOpen, setNavOpen] = useState(false);
  const accentVars = {
    "--accent-main": palette.main,
    "--accent-light": palette.light,
    "--accent-alpha10": palette.alpha10,
    "--accent-alpha20": palette.alpha20,
    "--accent-alpha30": palette.alpha30,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[#000000] text-[#ebe1e1]">
      <main
        className="relative mx-auto flex max-w-7xl flex-col gap-12 px-8 pb-32 pt-10 sm:px-14 lg:px-20"
        style={accentVars}
      >
        <header className="relative -mx-8 flex min-h-[80vh] flex-col gap-12 overflow-hidden bg-[#000000] px-8 py-10 sm:-mx-14 sm:px-14 lg:-mx-20 lg:px-20">
          <div className="fade-up relative z-20 flex flex-wrap items-center justify-between gap-6">
            <Image
              src="/logo_persept.svg"
              alt="Persept"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
            <div className="flex items-center gap-3">
            <nav className={`hidden items-center gap-3 text-sm font-medium text-[#ebe1e1]/80 md:flex`}>
              <a href="#why" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                Why
              </a>
              <a href="#sprint" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                7-day sprint
              </a>
              <a href="#offers" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                Offers
              </a>
              <a href="#work" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                Work
              </a>
              <a href="#capabilities" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                Capabilities
              </a>
              <a href="#contact" className="rounded-full px-3 py-2 transition hover:text-(--accent-main)">
                Contact
              </a>
            </nav>
              <div className="relative md:hidden">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-[#1f1f1f] bg-[#0a0a0a] text-[#ebe1e1]"
                  onClick={() => setNavOpen((v) => !v)}
                  aria-label="Toggle navigation"
                >
                  <span className="flex h-4 w-4 flex-col justify-between">
                    <span className="h-[2px] w-4 bg-current" />
                    <span className="h-[2px] w-4 bg-current" />
                    <span className="h-[2px] w-4 bg-current" />
                  </span>
                </button>
                {navOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-[#1f1f1f] bg-[#050505] p-3 shadow-2xl shadow-black/60 backdrop-blur">
                    <div className="flex flex-col gap-2 text-sm font-medium text-[#ebe1e1]">
                      <a href="#work" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Work
                      </a>
                      <a href="#services" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Services
                      </a>
                      <a href="#process" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Process
                      </a>
                      <a href="#packages" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Packages
                      </a>
                      <a href="#retainers" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Retainers
                      </a>
                      <a href="#contact" className="block rounded-md px-3 py-2 transition hover:bg-white/10" onClick={() => setNavOpen(false)}>
                        Contact
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-10 lg:gap-12">
            <div className="relative z-20 max-w-5xl space-y-6">
              <div className="space-y-3">
                <p className="fade-up text-sm uppercase tracking-[0.28em] text-[#ebe1e1]/60">
                  Persept
                </p>
                <h1 className="fade-up text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Bold software, built in a week. Launch-ready product and marketing under one roof.
          </h1>
              </div>
              <p className="fade-up delay-1 text-lg text-white/70 sm:text-xl max-w-3xl">
                We craft clickable prototypes, production builds, and the launch material to get them
                in front of real users fast. If you want a working demo in 7 days and a plan to scale,
                you’re in the right place.
              </p>
              <div className="fade-up delay-2 flex flex-wrap gap-4">
                <a
                  href="mailto:hello@persept.ai?subject=Request%20a%20sprint%20plan"
                  className="rounded-md px-6 py-3.5 text-base font-semibold text-[#0f1c0f] transition hover:-translate-y-1"
                  style={{ background: "var(--accent-main)", boxShadow: "0 12px 40px -20px var(--accent-main)" }}
                >
                  Request a sprint plan
                </a>
                <a
                  href="#work"
                  className="rounded-md border border-[#70999f]/60 px-6 py-3.5 text-base font-semibold text-[#ebe1e1] transition hover:-translate-y-1 hover:border-[#70999f] hover:bg-[#70999f]/10"
                >
                  See recent demos
                </a>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-[-8%] z-0 flex items-center">
              <PixelatedCanvas
                src="/image11.png"
                width={1100}
                height={700}
                cellSize={3}
                dotScale={0.9}
                shape="square"
                backgroundColor="#000000"
                grayscale={false}
                responsive
                interactive
                idleMotion
                idleRadius={0.22}
                idleSpeed={0.1}
                distortionStrength={3}
                distortionRadius={120}
                distortionMode="swirl"
                followSpeed={0.15}
                jitterStrength={2.5}
                jitterSpeed={2.5}
                fadeOnLeave
                tintColor={palette.main}
                tintStrength={0.35}
                objectFit="contain"
                className="h-full w-full opacity-85"
              />
            </div>
          </div>
        </header>

        <section id="why" className="fade-up space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Why this exists</h2>
            <p className="text-sm text-[#ebe1e1]/70">Benefit framing, not sales.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6 space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[#ebe1e1]/70">Most software dies before it ships.</p>
              <div className="space-y-1 text-[#ebe1e1]/80">
                <p>• Scope drifts for weeks.</p>
                <p>• Revisions stack up with no demo.</p>
                <p>• No real user feedback loop.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6 space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[#ebe1e1]/70">Weekly demos fix that.</p>
              <div className="space-y-1 text-[#ebe1e1]/80">
                <p>• You see progress every 7 days.</p>
                <p>• Decisions come from working software.</p>
                <p>• Risk is capped one sprint at a time.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="sprint" className="fade-up rounded-3xl border border-[#1f1f1f] bg-[#0d0d0d] p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#ebe1e1]/70">The system</p>
              <h2 className="text-2xl font-semibold">7-day sprint</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#ebe1e1]/70">One week • One demo</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 text-[#ebe1e1]">
              <p className="font-semibold">Day 0: Scope (60–90 min)</p>
              <ul className="space-y-1 text-sm text-[#ebe1e1]/80">
                <li>• Define the one outcome that matters</li>
                <li>• Decide success criteria</li>
                <li>• Confirm constraints (integrations, data, stack)</li>
              </ul>
              <p className="pt-3 font-semibold">Days 1–3: Build</p>
              <ul className="space-y-1 text-sm text-[#ebe1e1]/80">
                <li>• Core flows working</li>
                <li>• Data model + backend skeleton</li>
                <li>• Basic UI</li>
              </ul>
              <p className="pt-3 font-semibold">Days 4–5: Integration + polish</p>
              <ul className="space-y-1 text-sm text-[#ebe1e1]/80">
                <li>• Auth, payments, APIs as needed</li>
                <li>• Edge cases, UX cleanup</li>
                <li>• Deployment</li>
              </ul>
            </div>
            <div className="space-y-2 text-[#ebe1e1]">
              <p className="font-semibold">Day 6: Marketing assets</p>
              <ul className="space-y-1 text-sm text-[#ebe1e1]/80">
                <li>• Landing copy / screenshots</li>
                <li>• Short demo video or reel-style cut</li>
                <li>• Narrative: problem → solution → why it matters</li>
              </ul>
              <p className="pt-3 font-semibold">Day 7: Demo + decision</p>
              <ul className="space-y-1 text-sm text-[#ebe1e1]/80">
                <li>• Live demo</li>
                <li>• What to scale next</li>
                <li>• What to cut</li>
                <li>• Next sprint plan</li>
              </ul>
              <p className="pt-4 text-sm text-[#ebe1e1]/70">
                You don’t buy a “project.” You buy one week of focused execution and a demo.
              </p>
            </div>
          </div>
        </section>

        <section id="offers" className="fade-up space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Engagements (offer ladder)</h2>
            <p className="text-sm text-[#ebe1e1]/70">No pricing table; timelines and fit.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Prototype Sprint",
                for: "Validating a product/feature quickly",
                timeline: "7 days",
                delivers: [
                  "Working prototype + demo",
                  "Sprint report + next steps",
                  "Light marketing asset to show stakeholders",
                ],
              },
              {
                title: "Build / Scale",
                for: "Turning a prototype into production software",
                timeline: "4–6 weeks",
                delivers: [
                  "Hardened system + monitoring",
                  "Auth, payments, integrations",
                  "Handover and docs",
                ],
              },
              {
                title: "Retainer",
                for: "Ongoing iteration, maintenance, growth assets",
                timeline: "Monthly",
                delivers: [
                  "Planned roadmap + experiments",
                  "Support, fixes, performance",
                  "Fresh creative (landing/video) as needed",
                ],
              },
            ].map((offer, idx) => (
              <div
                key={offer.title}
                className="fade-up flex flex-col gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6"
                style={{ animationDelay: `${0.08 * idx}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#ebe1e1]/70">{offer.for}</p>
                    <h3 className="text-xl font-semibold text-[#ebe1e1]">{offer.title}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#ebe1e1]/80">
                    {offer.timeline}
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-[#ebe1e1]/80">
                  {offer.delivers.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-(--accent-main)" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="fade-up space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold">Recent builds & experiments</h2>
            <p className="text-sm uppercase tracking-[0.2em] text-[#ebe1e1]/70">Product · Launch · Creative</p>
          </div>
          <div className="mt-4 grid gap-8 md:grid-cols-3">
            {projects.map((project, idx) => (
              <a
                key={project.name}
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="fade-up group relative block h-[360px] overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] transition hover:-translate-y-1"
                style={{ animationDelay: `${0.08 * idx}s` }}
              >
                <PixelatedCanvas
                  src={project.image}
                  width={600}
                  height={360}
                  cellSize={3}
                  dotScale={0.9}
                  shape="square"
                  backgroundColor="#0f0f0f"
                  grayscale={false}
                  responsive
                  interactive
                  distortionStrength={3}
                  distortionRadius={90}
                  distortionMode="swirl"
                  followSpeed={0.2}
                  jitterStrength={3}
                  jitterSpeed={3}
                  fadeOnLeave
                  tintColor={project.color}
                  tintStrength={0.3}
                  objectFit="cover"
                  className="h-full w-full filter grayscale opacity-60 transition duration-500 group-hover:grayscale-0 group-hover:opacity-100"
                />
                <div
                  className="pointer-events-none absolute inset-0 transition duration-500 group-hover:opacity-80"
                  style={{
                    background: `linear-gradient(180deg, ${project.color}1a 0%, transparent 45%, rgba(0,0,0,0.6) 100%)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Build</p>
                      <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-1 text-[11px] text-white/80 backdrop-blur transition"
                          style={{
                            background: "rgba(0,0,0,0.55)",
                            border: `1px solid ${project.color}33`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/75">{project.highlight}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="capabilities" className="fade-up space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">What I build</h2>
            <p className="text-sm text-[#ebe1e1]/70">Clear capability grid.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Web apps (Next.js)",
              "Backend APIs",
              "Payments (Stripe)",
              "Dashboards / admin panels",
              "AI agents / voice agents",
              "Automation pipelines",
              "Integrations (CRM, WhatsApp/email)",
              "Deployment + monitoring",
              "Content assets (demos, landing pages)",
            ].map((cap) => (
              <div
                key={cap}
                className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-sm text-[#ebe1e1]/85"
              >
                {cap}
              </div>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="fade-up rounded-3xl border border-[#466851]/35 bg-white/5 p-10 text-[#ebe1e1] shadow-[0_26px_90px_-35px_rgba(0,0,0,0.55)]"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#ebe1e1]/70">If you have a stuck idea</p>
              <h2 className="text-2xl font-semibold">I can show you a working version next week.</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:hello@persept.ai?subject=Request%20a%20sprint%20plan"
                className="rounded-md px-6 py-3.5 text-base font-semibold text-[#0f1c0f] transition hover:-translate-y-1"
                style={{ background: "var(--accent-main)", boxShadow: "0 12px 40px -20px var(--accent-main)" }}
              >
                Request a sprint plan
              </a>
              <a
                href="mailto:hello@persept.ai"
                className="rounded-md border border-[#70999f]/60 px-6 py-3.5 text-base font-semibold text-[#ebe1e1] transition hover:-translate-y-1 hover:border-[#70999f] hover:bg-[#70999f]/10"
              >
                Email me directly
              </a>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="fade-up rounded-2xl border border-[#466851]/30 bg-[#1c1c1c] p-5 text-sm text-[#ebe1e1]/80">
              <p className="font-semibold text-[#ebe1e1]">For prototypes</p>
              <p className="text-[#ebe1e1]/75">One sharp problem, one-week build, one link to share.</p>
            </div>
            <div className="fade-up delay-1 rounded-2xl border border-[#466851]/30 bg-[#1c1c1c] p-5 text-sm text-[#ebe1e1]/80">
              <p className="font-semibold text-[#ebe1e1]">For product teams</p>
              <p className="text-[#ebe1e1]/75">Sprint partner to ship features and creative.</p>
            </div>
            <div className="fade-up delay-2 rounded-2xl border border-[#466851]/30 bg-[#1c1c1c] p-5 text-sm text-[#ebe1e1]/80">
              <p className="font-semibold text-[#ebe1e1]">For launch marketers</p>
              <p className="text-[#ebe1e1]/75">Landing + short-form video + analytics wired from day one.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
