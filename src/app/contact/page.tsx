"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  Mail,
  MapPin,
  Radio,
} from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { FadeUp, SlideIn } from "@/components/ui/scroll-animations";

/* ── Static lab metadata ───────────────────────────────────────────────── */

const CONTACT_EMAIL = "hello@persept.ai";
const CALENDLY_URL = "https://calendly.com/persept";

const SPEC = [
  { label: "EMAIL", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: "LOCATION", value: "Dubai, UAE" },
  { label: "AVAILABILITY", value: "Taking on select projects" },
  { label: "RESPONSE", value: "Within 1–2 working days" },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/persept" },
  { label: "X / Twitter", href: "https://x.com/persept" },
  { label: "GitHub", href: "https://github.com/persept" },
];

const PROJECT_TYPES = [
  "Pick one — optional",
  "AI agents / automation",
  "Applied ML / data product",
  "Web / full-stack product",
  "Prototype / proof of concept",
  "Not sure yet — let's talk",
];

const BUDGETS = [
  "Pick a range — optional",
  "Under $10k",
  "$10k – $25k",
  "$25k – $50k",
  "$50k+",
  "Let's discuss",
];

/* ── Reusable field label ──────────────────────────────────────────────── */

function FieldLabel({
  index,
  children,
  htmlFor,
}: {
  index: string;
  children: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2">
      <span className="section-index">{index}</span>
      <span className="mono-label" style={{ color: "var(--ink-soft)" }}>
        {children}
      </span>
    </label>
  );
}

/* ── Shared input styling ──────────────────────────────────────────────── */

const fieldClass =
  "w-full bg-transparent px-3.5 py-3 text-[15px] outline-none transition-colors duration-200 " +
  "placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)]";

const fieldStyle = {
  color: "var(--ink)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  backgroundColor: "var(--paper)",
} as const;

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    type: PROJECT_TYPES[0],
    budget: BUDGETS[0],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const update =
    (key: keyof typeof form) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Build a graceful mailto: fallback so the message is actually deliverable.
  const buildMailto = () => {
    const subject = `New project enquiry — ${form.name || "Persept"}`;
    const lines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.company && `Company: ${form.company}`,
      form.type !== PROJECT_TYPES[0] && `Project type: ${form.type}`,
      form.budget !== BUDGETS[0] && `Budget: ${form.budget}`,
      "",
      "What we're building:",
      form.message,
    ].filter(Boolean);
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join("\n"),
    )}`;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Open the user's mail client with a pre-filled draft, then confirm on-brand.
    if (typeof window !== "undefined") {
      window.location.href = buildMailto();
    }
    setSubmitted(true);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op, the mailto link still works */
    }
  };

  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="relative grain lab-grid overflow-hidden pt-32">
        {/* paper vignette to soften the grid toward the edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(244,242,236,0) 30%, rgba(244,242,236,0.7) 85%)",
          }}
        />
        <div className="shell relative z-[1] pb-12 sm:pb-16">
          <FadeUp>
            <p className="mono-label mb-6">
              <span className="section-index">001</span>
              &nbsp;&nbsp;/&nbsp;&nbsp;Start a project
            </p>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1
              className="display max-w-4xl"
              style={{
                fontSize: "clamp(2.5rem, 7.5vw, 6rem)",
                fontWeight: 600,
              }}
            >
              Let's build the
              <br />
              thing that <span className="accent">fixes it</span>
              <span className="cursor-blink accent" style={{ fontWeight: 400 }}>
                _
              </span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.18}>
            <p
              className="mt-7 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed"
              style={{ color: "var(--ink-soft)" }}
            >
              Persept is a Dubai-based software innovation lab. We turn problems
              into software. Tell us about the friction you're living with —
              we'll tell you what we'd build.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Two-column body ─────────────────────────────────────────────── */}
      <section
        className="section"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div className="shell">
          <div
            className="grid gap-px lg:grid-cols-[0.85fr_1.15fr]"
            style={{ backgroundColor: "var(--line)" }}
          >
            {/* ── Left: spec sheet ─────────────────────────────────────── */}
            <SlideIn direction="left" className="h-full">
              <div
                className="flex h-full flex-col p-7 sm:p-10"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <p className="mono-label mb-6">
                  <span className="section-index">002</span>
                  &nbsp;&nbsp;/&nbsp;&nbsp;Direct line
                </p>

                <p
                  className="max-w-sm text-[15px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  No funnels, no gatekeepers. The form reaches the people who
                  build. Prefer to skip it? Email us directly or book a call.
                </p>

                {/* Spec / definition list */}
                <dl className="mt-10 flex flex-col">
                  {SPEC.map((row, i) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--line)",
                      }}
                    >
                      <dt
                        className="mono-label"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {row.label}
                      </dt>
                      <dd
                        className="text-[15px]"
                        style={{ color: "var(--ink)" }}
                      >
                        {row.href ? (
                          <a href={row.href} className="link-underline">
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Status panel with registration ticks */}
                <div
                  className="ticked mt-8 flex items-center gap-3 p-4"
                  style={{
                    border: "1px solid var(--line-strong)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <motion.span
                      className="absolute inline-flex h-full w-full rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                      animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  </span>
                  <span
                    className="mono-label"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    The lab is open — currently briefing new work
                  </span>
                </div>

                {/* Quick actions */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="btn-ghost"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy email"}
                  </button>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book a call
                  </a>
                </div>

                {/* Socials */}
                <div className="mt-auto pt-10">
                  <p
                    className="mono-label mb-3"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Elsewhere
                  </p>
                  <div className="flex flex-col gap-2">
                    {SOCIALS.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-between text-[15px]"
                        style={{ color: "var(--ink)", maxWidth: "16rem" }}
                      >
                        <span className="link-underline">{s.label}</span>
                        <ArrowUpRight
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          style={{ color: "var(--ink-faint)" }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </SlideIn>

            {/* ── Right: form ─────────────────────────────────────────── */}
            <SlideIn direction="right" className="h-full">
              <div
                className="flex h-full flex-col p-7 sm:p-10"
                style={{ backgroundColor: "var(--paper)" }}
              >
                <p className="mono-label mb-6">
                  <span className="section-index">003</span>
                  &nbsp;&nbsp;/&nbsp;&nbsp;The brief
                </p>

                {submitted ? (
                  /* ── Success state ──────────────────────────────────── */
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-1 flex-col items-start justify-center"
                  >
                    <div
                      className="ticked w-full p-8 sm:p-10"
                      style={{
                        border: "1px solid var(--line-strong)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div
                        className="mb-6 inline-flex h-11 w-11 items-center justify-center"
                        style={{
                          border: "1px solid var(--accent)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--accent-ink)",
                        }}
                      >
                        <Check className="h-5 w-5" />
                      </div>
                      <h2
                        className="display"
                        style={{ fontSize: "clamp(1.6rem,3.4vw,2.4rem)" }}
                      >
                        Message received.
                        <br />
                        We'll be in touch
                        <span
                          className="cursor-blink accent"
                          style={{ fontWeight: 400 }}
                        >
                          _
                        </span>
                      </h2>
                      <p
                        className="mt-4 max-w-md text-[15px] leading-relaxed"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        We just opened a draft in your mail client — hit send
                        and it lands with us. Expect a reply within 1–2 working
                        days.
                      </p>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <a href={`mailto:${CONTACT_EMAIL}`} className="btn">
                          <Mail className="h-3.5 w-3.5" />
                          Email instead
                        </a>
                        <button
                          type="button"
                          onClick={() => setSubmitted(false)}
                          className="btn-ghost"
                        >
                          Edit the brief
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Form ───────────────────────────────────────────── */
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col">
                        <FieldLabel index="A1" htmlFor="name">
                          NAME
                        </FieldLabel>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          autoComplete="name"
                          value={form.name}
                          onChange={update("name")}
                          placeholder="Your name"
                          className={fieldClass}
                          style={fieldStyle}
                        />
                      </div>

                      <div className="flex flex-col">
                        <FieldLabel index="A2" htmlFor="email">
                          EMAIL
                        </FieldLabel>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={form.email}
                          onChange={update("email")}
                          placeholder="you@company.com"
                          className={fieldClass}
                          style={fieldStyle}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col">
                      <FieldLabel index="A3" htmlFor="company">
                        COMPANY — OPTIONAL
                      </FieldLabel>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        value={form.company}
                        onChange={update("company")}
                        placeholder="Where you work"
                        className={fieldClass}
                        style={fieldStyle}
                      />
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col">
                        <FieldLabel index="A4" htmlFor="type">
                          PROJECT TYPE
                        </FieldLabel>
                        <select
                          id="type"
                          name="type"
                          value={form.type}
                          onChange={update("type")}
                          className={`${fieldClass} appearance-none`}
                          style={fieldStyle}
                        >
                          {PROJECT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <FieldLabel index="A5" htmlFor="budget">
                          BUDGET
                        </FieldLabel>
                        <select
                          id="budget"
                          name="budget"
                          value={form.budget}
                          onChange={update("budget")}
                          className={`${fieldClass} appearance-none`}
                          style={fieldStyle}
                        >
                          {BUDGETS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col">
                      <FieldLabel index="A6" htmlFor="message">
                        WHAT ARE YOU BUILDING?
                      </FieldLabel>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={form.message}
                        onChange={update("message")}
                        placeholder="The problem, who has it, and what 'fixed' looks like."
                        className={`${fieldClass} min-h-[9rem] flex-1 resize-y`}
                        style={fieldStyle}
                      />
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button type="submit" className="btn">
                        Send the brief
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="mono-label inline-flex items-center gap-2"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        <Radio className="h-3.5 w-3.5" />
                        Opens a pre-filled email
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ── Secondary CTA: book a call ──────────────────────────────────── */}
      <section
        className="section grain"
        style={{
          borderTop: "1px solid var(--line)",
          backgroundColor: "var(--paper-2)",
        }}
      >
        <div className="shell">
          <FadeUp>
            <div
              className="flex flex-col items-start justify-between gap-8 p-8 sm:flex-row sm:items-center sm:p-12"
              style={{
                border: "1px solid var(--line-strong)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div>
                <p className="mono-label mb-4 inline-flex items-center gap-2">
                  <MapPin
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--accent-ink)" }}
                  />
                  Prefer a conversation?
                </p>
                <h2
                  className="display max-w-2xl"
                  style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)" }}
                >
                  Book a 30-minute call.
                </h2>
                <p
                  className="mt-3 max-w-md text-[15px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Bring the problem. We'll sketch the first version of the fix
                  together — no slides.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule a call
                </a>
                <Link href="/projects" className="btn-ghost">
                  See the work
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  );
}
