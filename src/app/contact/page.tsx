"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import "@/components/sections/landing.css";
import {
  BOOKING_HREF,
  bookAttrs,
  PlFooter,
  PlNav,
} from "@/components/sections/pl-chrome";

const CONTACT_EMAIL = "khizr@persept.ai";

const SPEC = [
  { label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: "Location", value: "Dubai, UAE" },
  { label: "Availability", value: "Taking on select clients" },
  { label: "Response", value: "Within 1–2 working days" },
];

const PROJECT_TYPES = [
  "Pick one — optional",
  "Consultation — where can agents help?",
  "30-day paid pilot",
  "Outreach / replies / proposals",
  "Reporting / operations",
  "Something else",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    type: PROJECT_TYPES[0],
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

  const buildMailto = () => {
    const subject = `Persept enquiry — ${form.name || "new"}`;
    const lines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.company && `Company: ${form.company}`,
      form.type !== PROJECT_TYPES[0] && `Interested in: ${form.type}`,
      "",
      "Where the time goes:",
      form.message,
    ].filter(Boolean);
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") window.location.href = buildMailto();
    setSubmitted(true);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  };

  return (
    <main>
      <div className="pl" id="top">
        <PlNav base="/" />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="pl-hero" style={{ paddingBottom: 40 }}>
          <div className="pl-hero-glow" />
          <div className="pl-hero-inner">
            <div className="pl-eyebrow pl-hero-eyebrow">
              <span className="pl-live" />
              <span>Fifteen minutes · Dubai · book a call</span>
            </div>
            <h1 className="pl-h1" style={{ fontSize: "clamp(44px,7vw,104px)" }}>
              Tell me where <span className="pl-amber">the time goes.</span>
            </h1>
            <p className="pl-lead" style={{ marginTop: 32 }}>
              I&rsquo;ll tell you which parts an agent could take. Send the note
              below, or book a fifteen-minute call. It reaches me directly, no
              funnel.
            </p>
          </div>
        </header>

        {/* ── Two-column body ────────────────────────────────────────── */}
        <section
          className="pl-section"
          style={{ paddingTop: 40, paddingBottom: 120 }}
        >
          <div className="pl-inner pl-contact-grid">
            {/* left: direct line */}
            <div className="pl-panel">
              <div className="pl-eyebrow amber" style={{ marginBottom: 22 }}>
                Direct line
              </div>
              <p
                className="pl-role-body"
                style={{ color: "var(--tx2)", maxWidth: "34ch" }}
              >
                No gatekeepers. This reaches the person who builds and runs the
                deployments. Prefer to skip the form? Email or book a call.
              </p>

              <div className="pl-spec">
                {SPEC.map((row) => (
                  <div className="pl-spec-row" key={row.label}>
                    <span className="pl-spec-k">{row.label}</span>
                    <span className="pl-spec-v">
                      {row.href ? (
                        <a href={row.href} className="pl-amber">
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 28,
                }}
              >
                <button
                  type="button"
                  className="pl-ghost-sm"
                  onClick={copyEmail}
                >
                  {copied ? "Copied" : "Copy email"}
                </button>
                <a
                  href={BOOKING_HREF}
                  className="pl-pill pl-amber-btn sm"
                  {...bookAttrs}
                >
                  Book a call
                </a>
              </div>

              <div style={{ marginTop: 36 }}>
                <div className="pl-spec-k" style={{ marginBottom: 12 }}>
                  Elsewhere
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <a
                    href="https://www.linkedin.com/company/persept"
                    target="_blank"
                    rel="noreferrer"
                    className="pl-spec-v"
                  >
                    LinkedIn ↗
                  </a>
                  <a href="/login" className="pl-spec-v">
                    Client sign in ↗
                  </a>
                </div>
              </div>
            </div>

            {/* right: the note */}
            <div className="pl-panel">
              <div className="pl-eyebrow amber" style={{ marginBottom: 22 }}>
                The note
              </div>

              {submitted ? (
                <div className="pl-success">
                  <h2
                    className="pl-h2-med"
                    style={{ fontSize: "clamp(28px,4vw,44px)" }}
                  >
                    Message ready. <span className="pl-amber">Hit send.</span>
                  </h2>
                  <p
                    className="pl-lead"
                    style={{ fontSize: 17, maxWidth: "44ch" }}
                  >
                    A draft just opened in your mail client. Send it and it
                    lands with me. Expect a reply within 1–2 working days.
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="pl-pill pl-amber-btn sm"
                    >
                      Email instead
                    </a>
                    <button
                      type="button"
                      className="pl-ghost-sm"
                      onClick={() => setSubmitted(false)}
                    >
                      Edit the note
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="pl-field-grid two">
                    <div>
                      <label className="pl-field-label" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        className="pl-input"
                        type="text"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={update("name")}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="pl-field-label" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        className="pl-input"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={update("email")}
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label className="pl-field-label" htmlFor="company">
                      Company — optional
                    </label>
                    <input
                      id="company"
                      className="pl-input"
                      type="text"
                      autoComplete="organization"
                      value={form.company}
                      onChange={update("company")}
                      placeholder="Where you work"
                    />
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label className="pl-field-label" htmlFor="type">
                      Interested in
                    </label>
                    <select
                      id="type"
                      className="pl-select"
                      value={form.type}
                      onChange={update("type")}
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label className="pl-field-label" htmlFor="message">
                      Where does the time go?
                    </label>
                    <textarea
                      id="message"
                      className="pl-textarea"
                      required
                      rows={6}
                      value={form.message}
                      onChange={update("message")}
                      placeholder="The repetitive work eating your week, and who has it."
                    />
                  </div>

                  <div className="pl-form-foot">
                    <button type="submit" className="pl-pill pl-amber-btn sm">
                      Send the note →
                    </button>
                    <span className="pl-form-note">
                      Opens a pre-filled email
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <PlFooter />
      </div>
    </main>
  );
}
