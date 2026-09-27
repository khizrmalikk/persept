import Link from "next/link";
import { PerseptMark } from "@/components/sections/pl-chrome";
import "@/components/sections/landing.css";
import "./gyst.css";

// GYST — Persept's own product. The dark cinematic landing system, re-accented
// GYST yellow (scoped to `.pl.gyst`). Static server component; metadata lives in
// this route's layout.tsx.

const GYST_URL = "https://startgyst.com";

const STEPS = [
  [
    "Find",
    "One search scans multiple job boards at once and returns real, current roles — UK, Dubai, remote and beyond. No chat, no twelve open tabs.",
  ],
  [
    "Track",
    "Every saved role becomes a card on a Kanban board — Saved, Materials, Outreach, Applied, Interviewing, Offer. Your whole search in one calm place.",
  ],
  [
    "Tailor",
    "GYST mixes your profile with the job description to write a CV and cover letter that get past the automated screener. Keyword-aware, one page, seconds.",
  ],
  [
    "Apply",
    "The application assistant answers the actual questions in your own voice, drawn from your CV and the role — then you apply on the company's own site.",
  ],
  [
    "Get seen",
    "Find people at the company who can refer you and send a warm intro, so your application arrives with a face instead of vanishing into the void.",
  ],
  [
    "Follow up",
    "Connect Gmail once. As replies land, GYST reads confirmations, rejections and interview invites and advances each card automatically.",
  ],
];

const FEATURES = [
  [
    "CV & cover letters",
    "Screening-ready documents tailored to each role. Most companies screen with software before a human sees you — GYST clears the screener.",
  ],
  [
    "Application assistant",
    "Answers the real application questions in your own voice, pulled from your profile and the job description.",
  ],
  [
    "Kanban board",
    "Your entire search as a visual board. Drag a card yourself, or let GYST move it for you as things progress.",
  ],
  [
    "Referral finder",
    "Surfaces people inside the company who can refer you, with a warm outreach draft ready to send.",
  ],
  [
    "Automatic Gmail tracking",
    "Reads only email headers to match job-related messages and keeps your board current — never the contents of your emails.",
  ],
  [
    "Multi-board search",
    "One search across every board returns real roles. No chatbot, no endless tabs — just the jobs, saved to your board.",
  ],
];

const META = [
  ["Category", "AI · Careers"],
  ["Model", "£9.99/mo · 7-day trial"],
  ["Surface", "Web app"],
  ["For", "Students & early-career"],
];

const PRICE_FEATURES = [
  "Multi-board AI job search",
  "Kanban application board",
  "Unlimited screening-ready CVs & cover letters",
  "AI application assistant",
  "Referral finder & outreach drafts",
  "Automatic Gmail tracking",
];

export default function GystPage() {
  return (
    <main className="pl gyst" id="top">
      <nav className="pl-nav">
        <Link href="/" className="pl-brand" aria-label="Persept home">
          <PerseptMark />
          <span>Persept</span>
        </Link>
        <div className="pl-nav-links pl-nav-hide">
          <a href="/#roles">Roles</a>
          <a href="/#how">How it runs</a>
          <a href="/#proof">Proof</a>
          <span style={{ color: "var(--tx)" }}>GYST</span>
        </div>
        <div className="pl-nav-right">
          <Link href="/login">Sign in</Link>
          <a
            href={GYST_URL}
            className="gyst-trial"
            target="_blank"
            rel="noreferrer"
          >
            Start free trial
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="gyst-hero">
        <div className="gyst-hero-glow" />
        <div className="pl-inner">
          <div className="gyst-eyebrow">
            <a href="/#products">← Persept</a>
            <span>·</span>
            <span>our product</span>
            <span className="gyst-live">
              <span />
              live
            </span>
          </div>
          <h1 className="gyst-title">GYST</h1>
          <div className="gyst-tagline">
            The whole job search,{" "}
            <span style={{ color: "var(--amber)" }}>one guided path.</span>
          </div>
          <div className="gyst-hero-row">
            <p className="gyst-lead">
              Search roles, get a CV and cover letter tailored to each, answer
              the application questions in your own voice, and reach real people
              who can refer you. One guided path, not ten open tabs.
            </p>
            <div className="gyst-hero-cta">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={GYST_URL}
                  className="pl-pill pl-amber-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  Start free trial
                </a>
                <a
                  href={GYST_URL}
                  className="pl-pill pl-outline-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit startgyst.com
                </a>
              </div>
              <span className="gyst-note">7 days free · no card required</span>
            </div>
          </div>
          <div className="gyst-meta">
            {META.map(([k, v]) => (
              <div className="gyst-meta-cell" key={k}>
                <div className="gyst-meta-k">{k}</div>
                <div className="gyst-meta-v">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Why it exists ────────────────────────────────────────────── */}
      <section className="pl-section gyst-why">
        <div className="pl-inner gyst-why-grid">
          <div>
            <div
              className="gyst-eyebrow"
              style={{ color: "var(--amber)", marginBottom: 20 }}
            >
              Why it exists
            </div>
            <h2 className="pl-h2">Job hunting is a second job.</h2>
          </div>
          <figure className="gyst-figure">
            <blockquote className="gyst-quote">
              “I built GYST because job hunting as a new grad is brutal —
              endless tabs, generic CVs, and applications that vanish into the
              void. I wanted one place that does it properly: find the role,
              tailor the application, and actually reach a human.”
            </blockquote>
            <figcaption className="gyst-figcap">
              Khizr Malik · Founder of GYST &amp; Persept
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── The guided path ──────────────────────────────────────────── */}
      <section className="pl-section">
        <div className="pl-inner">
          <div
            className="gyst-eyebrow"
            style={{ color: "var(--amber)", marginBottom: 20 }}
          >
            The guided path
          </div>
          <h2
            className="pl-h2-big"
            style={{ maxWidth: "14ch", marginBottom: 24 }}
          >
            From finding the job to getting it.
          </h2>
          <p className="gyst-lead" style={{ maxWidth: 620, marginBottom: 64 }}>
            GYST doesn&rsquo;t hand you a pile of tools. It walks you through
            applying the right way, one step at a time, so you&rsquo;re never
            left guessing what to do next.
          </p>
          <div className="gyst-steps">
            {STEPS.map(([title, body], i) => (
              <div className="gyst-step" key={title}>
                <span className="gyst-step-n">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="gyst-step-title">{title}</h3>
                <p className="gyst-step-body">{body}</p>
              </div>
            ))}
          </div>
          <div className="gyst-soon">
            <span className="gyst-soon-h">07 · Land it</span>
            <span className="gyst-soon-badge">coming soon</span>
            <span className="gyst-soon-note">
              Interview prep built from the role and your answers, so you walk
              in ready.
            </span>
          </div>
        </div>
      </section>

      {/* ── Features (cream band) ────────────────────────────────────── */}
      <section className="pl-section gyst-feats">
        <div className="pl-inner">
          <div className="gyst-eyebrow" style={{ marginBottom: 20 }}>
            Built to get you a response
          </div>
          <h2
            className="pl-h2-big"
            style={{ maxWidth: "16ch", marginBottom: 64 }}
          >
            Everything you need to apply the right way.
          </h2>
          <div className="gyst-feat-grid">
            {FEATURES.map(([title, body]) => (
              <div className="gyst-feat" key={title}>
                <h3 className="gyst-feat-h">{title}</h3>
                <p className="gyst-feat-b">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="pl-section">
        <div className="pl-inner gyst-price-grid">
          <div>
            <div
              className="gyst-eyebrow"
              style={{ color: "var(--amber)", marginBottom: 20 }}
            >
              Pricing
            </div>
            <h2 className="gyst-price-h">One plan. Everything included.</h2>
          </div>
          <div className="gyst-price-card">
            <div className="gyst-price-tag">GYST Pro · everything included</div>
            <div className="gyst-price-amt">
              <span className="gyst-price-num">£9.99</span>
              <span style={{ fontSize: 18 }}>/month</span>
            </div>
            <div className="gyst-price-sub">
              7-day free trial · no card charged during your trial · cancel
              anytime.
            </div>
            <div className="gyst-price-feats">
              {PRICE_FEATURES.map((f) => (
                <span key={f}>✓ {f}</span>
              ))}
            </div>
            <a
              href={GYST_URL}
              className="gyst-price-cta"
              target="_blank"
              rel="noreferrer"
            >
              Start free trial
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="gyst-cta-sec">
        <div className="gyst-cta-glow" />
        <div className="gyst-cta-inner">
          <h2 className="gyst-cta-h">
            Ready to get your
            <br />
            <span style={{ color: "var(--amber)" }}>sh*t together?</span>
          </h2>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <a
              href={GYST_URL}
              className="pl-pill pl-amber-btn"
              target="_blank"
              rel="noreferrer"
            >
              Start free trial
            </a>
            <Link href="/" className="pl-pill pl-outline-btn">
              The agent workforce we set up →
            </Link>
          </div>
          <span className="gyst-note">7 days free · no card required</span>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="gyst-footer">
        <div className="gyst-footer-inner">
          <span>© 2026 Persept · Dubai · GYST is a Persept product</span>
          <div className="gyst-footer-links">
            <a href="mailto:khizr@persept.ai">khizr@persept.ai</a>
            <a
              href="https://www.linkedin.com/company/persept"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <Link href="/">persept.ai</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
