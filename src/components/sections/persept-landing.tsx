import { OfficePanel } from "./office-panel";
import { BOOKING_HREF, bookAttrs, PlFooter, PlNav } from "./pl-chrome";
import "./landing.css";

// The single-page cinematic landing (dark, amber, Archivo). Rebuilt from the
// design handoff. Static server markup; only the hero office is a client island.

const col = (h: number) => `oklch(0.78 0.12 ${h})`;

const ROLES: { title: string; body: string; gate: string; h: number }[] = [
  {
    title: "Outreach",
    body: "Finds companies that fit, writes the first message and the day-3 and day-7 follow-ups, reads the replies and proposes call times.",
    gate: "You approve every message",
    h: 150,
  },
  {
    title: "Proposals",
    body: "Turns your call notes into a proposal the same day, published as a page the prospect can open.",
    gate: "You approve before it is sent",
    h: 220,
  },
  {
    title: "Customer replies",
    body: "Answers customer messages and Google reviews in your voice. Anything about money or complaints comes to you.",
    gate: "You approve the sensitive ones",
    h: 290,
  },
  {
    title: "Daily brief",
    body: "What happened yesterday, what needs your decision and what is due today, in one message every morning.",
    gate: "",
    h: 70,
  },
  {
    title: "Market watch",
    body: "Reads the news, forums and competitors in your niche every morning and tags what matters for sales or content.",
    gate: "",
    h: 20,
  },
  {
    title: "Marketing",
    body: "A weekly content plan and drafts in your voice, plus suggestions from your own numbers, like a discount when occupancy dips.",
    gate: "You approve before anything is published",
    h: 110,
  },
];

const IS = [
  "A small team of named roles, each with one job",
  "Embedded in your email, WhatsApp, calendar and documents",
  "Reporting to you every morning",
];
const IS_NOT = [
  "A chatbot on your website",
  "A tool you have to operate",
  "Autopilot. Nothing goes out without your approval",
];

const STATS = [
  { n: "24/7", l: "On the clock" },
  { n: "0", l: "Messages sent without a human tap" },
  { n: "<24h", l: "From call notes to proposal" },
  { n: "1", l: "Morning brief to read" },
];

const HOW = [
  {
    n: "01",
    t: "Map",
    d: "We find where agents help in your business. You keep the map whether or not you go ahead.",
  },
  {
    n: "02",
    t: "Deploy",
    d: "Your own private instance. Your data stays there, never shared with other clients.",
  },
  {
    n: "03",
    t: "Dashboard",
    d: "A dashboard only you and we can open, with an approvals inbox at the centre.",
  },
  { n: "04", t: "Run", d: "The agents work 24/7. You decide in one tap." },
];

export function PerseptLanding() {
  return (
    <div className="pl" id="top">
      <PlNav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="pl-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow">
            <span className="pl-live" />
            <span>AI workforce studio · Dubai · agents on the clock</span>
          </div>
          <h1 className="pl-h1">
            Hire an AI workforce.{" "}
            <span className="pl-amber">Keep the final say.</span>
          </h1>
          <div className="pl-hero-row">
            <p className="pl-lead">
              Named agents take over the repetitive, message-heavy work of your
              company: outreach, customer replies, proposals and reports, around
              the clock, inside the tools you already use. Anything touching
              money, access or a customer waits for your tap.
            </p>
            <div className="pl-cta-row">
              <a
                href={BOOKING_HREF}
                className="pl-pill pl-amber-btn"
                {...bookAttrs}
              >
                Book a 15-minute call
              </a>
              <a href="#proof" className="pl-pill pl-outline-btn">
                See it running
              </a>
            </div>
          </div>

          <OfficePanel />

          <p className="pl-office-cap">
            The agents draft and prepare. A person presses send, publish and
            pay.
          </p>
        </div>
      </header>

      {/* ── What it is / is not ──────────────────────────────────────── */}
      <section className="pl-section pl-wii">
        <div className="pl-inner pl-wii-grid">
          <h2 className="pl-h2">Staff, not software.</h2>
          <div className="pl-cols">
            <div>
              <div className="pl-col-label amber">What it is</div>
              <div className="pl-list">
                {IS.map((line) => (
                  <div className="pl-list-item" key={line}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="pl-col-label mut">What it is not</div>
              <div className="pl-list mut">
                {IS_NOT.map((line) => (
                  <div className="pl-list-item" key={line}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────────────────── */}
      <section className="pl-section pl-roles" id="roles">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            The roster
          </div>
          <h2
            className="pl-h2-big"
            style={{ maxWidth: "16ch", marginBottom: 64 }}
          >
            Six roles. Each one does a single job well.
          </h2>
          <div className="pl-role-grid">
            {ROLES.map((r, i) => (
              <div className="pl-role" key={r.title}>
                <div className="pl-role-top">
                  <span className="pl-role-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="pl-role-chip"
                    style={{ background: col(r.h) }}
                  />
                </div>
                <h3 className="pl-role-title">{r.title}</h3>
                <p className="pl-role-body">{r.body}</p>
                {r.gate && <div className="pl-role-gate">→ {r.gate}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof ────────────────────────────────────────────────────── */}
      <section className="pl-section" id="proof">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            Proof
          </div>
          <h2 className="pl-h2-huge">
            Persept runs
            <br />
            on Persept.
          </h2>
          <p className="pl-proof-lead">
            Before we set it up for anyone else, we run the company on it. This
            is our own office, every day.
          </p>
          <div className="pl-stats">
            {STATS.map((s) => (
              <div className="pl-stat" key={s.l}>
                <div className="pl-stat-n">{s.n}</div>
                <div className="pl-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="pl-proof-row">
            <div className="pl-shot">
              <div className="pl-shot-frame">
                {/* biome-ignore lint/performance/noImgElement: static marketing screenshot; next/image adds no value here */}
                <img
                  src="/images/dashboard-office.png"
                  alt="The Persept dashboard: the office view, agents at their desks with an approvals inbox"
                  loading="lazy"
                  width={1600}
                  height={1000}
                />
              </div>
            </div>
            <div className="pl-proof-bullets">
              <div className="pl-proof-bullet">
                <span className="pl-amber">Chief of staff</span> briefs the
                founder every morning
              </div>
              <div className="pl-proof-bullet">
                <span className="pl-amber">Outreach</span> drafts every message;
                the founder presses send
              </div>
              <div className="pl-proof-bullet">
                <span className="pl-amber">Proposals</span> writes the proposal
                the day of the call
              </div>
              <div className="pl-proof-bullet">
                <span className="pl-amber">Content</span> drafts the
                week&rsquo;s posts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it runs (light band) ─────────────────────────────────── */}
      <section className="pl-section pl-how" id="how">
        <div className="pl-inner">
          <div
            className="pl-eyebrow"
            style={{ marginBottom: 20, color: "var(--on-light-2)" }}
          >
            How it runs
          </div>
          <h2
            className="pl-h2-big"
            style={{ maxWidth: "15ch", marginBottom: 72 }}
          >
            A private deployment and your one tap.
          </h2>
          <div className="pl-how-grid">
            {HOW.map((s) => (
              <div className="pl-how-col" key={s.n}>
                <div className="pl-how-n">{s.n}</div>
                <h3 className="pl-how-h3">{s.t}</h3>
                <p className="pl-how-body">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="pl-how-foot">
            PDPL-aligned · set up and kept running by a person you can call
          </p>
        </div>
      </section>

      {/* ── Two ways to start ────────────────────────────────────────── */}
      <section className="pl-section">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            The engagement
          </div>
          <h2 className="pl-h2-big" style={{ marginBottom: 64 }}>
            Two ways to start.
          </h2>
          <div className="pl-start-grid">
            <div className="pl-card pilot">
              <div className="pl-card-tag">
                <span>01</span>
                <span>Most chosen</span>
              </div>
              <h3 className="pl-card-h3">30-day paid pilot</h3>
              <p className="pl-card-body">
                Setup, integrations and playbooks, then a full month live.
                Continue monthly if it earns its place.
              </p>
              <a
                href="mailto:khizr@persept.ai?subject=Pilot"
                className="pl-card-cta-dark"
              >
                Start a pilot
              </a>
            </div>
            <div className="pl-card consult">
              <div className="pl-card-tag mut">
                <span>02</span>
              </div>
              <h3 className="pl-card-h3">Consultation</h3>
              <p className="pl-card-body">
                Half a day inside your business. You get a written map of where
                agents would help and what to run first.
              </p>
              <a
                href="mailto:khizr@persept.ai?subject=Consultation"
                className="pl-card-cta-outline"
              >
                Book a consultation
              </a>
            </div>
          </div>
          <p className="pl-start-note">
            Founder rate for the first three clients, in exchange for a case
            study.
          </p>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className="pl-section pl-about">
        <div className="pl-inner pl-about-grid">
          <div>
            <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
              About
            </div>
            <h2 className="pl-h2-med">
              A small studio in Dubai, building since 2024.
            </h2>
          </div>
          <div className="pl-about-body">
            <p className="pl-about-p">
              Persept sets up named agents that take over the repetitive work of
              small businesses, and ships its own products alongside. Every
              deployment is set up and looked after by the person who built it.
            </p>
            <div className="pl-founder">
              <div className="pl-founder-photo">photo</div>
              <div>
                <div className="pl-founder-name">Khizr Malik</div>
                <div className="pl-founder-sub">Founder · khizr@persept.ai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products (GYST) ──────────────────────────────────────────── */}
      <section className="pl-products" id="products">
        <div className="pl-inner">
          <div className="pl-eyebrow mut" style={{ marginBottom: 20 }}>
            Also from Persept
          </div>
          <a
            href="https://startgyst.com"
            className="pl-gyst"
            target="_blank"
            rel="noreferrer"
          >
            <div className="pl-gyst-main">
              <div className="pl-gyst-head">
                <span className="pl-gyst-name">GYST</span>
                <span className="pl-gyst-live">LIVE</span>
              </div>
              <p className="pl-gyst-body">
                The whole job search, one guided path. Search every board,
                tailor a screening-ready CV to each role, and reach people who
                can refer you.
              </p>
              <div className="pl-gyst-price">£9.99/mo · 7-day free trial</div>
            </div>
            <span className="pl-gyst-visit">Visit startgyst.com →</span>
          </a>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="pl-cta">
        <div className="pl-cta-glow" />
        <div className="pl-cta-inner">
          <h2 className="pl-cta-h2">Fifteen minutes.</h2>
          <p className="pl-cta-p">
            Tell me where the time goes. I&rsquo;ll tell you which parts an
            agent could take.
          </p>
          <a
            href={BOOKING_HREF}
            className="pl-pill pl-amber-btn"
            {...bookAttrs}
          >
            Book a 15-minute call
          </a>
        </div>
      </section>

      <PlFooter />
    </div>
  );
}
