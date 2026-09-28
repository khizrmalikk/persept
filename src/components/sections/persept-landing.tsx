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

// The proof "meeting room" — hand-drawn cream line art (feTurbulence wobble) of a
// team facing a presentation board that shows the real office dashboard, with a
// cream "Hunter · 02:14" notification card overlapping the board. Ported from the
// design handoff SVG. Pure static markup.
function ProofScene() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1400 / 860",
        marginTop: 24,
      }}
    >
      <svg
        viewBox="0 0 1400 860"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
        fill="none"
        stroke="#f4f1ec"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <filter id="wob">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves={2}
              seed={4}
            />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0"
              stopColor="oklch(0.8 0.14 70)"
              stopOpacity="0.35"
            />
            <stop offset="1" stopColor="oklch(0.8 0.14 70)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop
              offset="0"
              stopColor="oklch(0.7 0.1 220)"
              stopOpacity="0.22"
            />
            <stop offset="1" stopColor="oklch(0.7 0.1 220)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="700"
          cy="340"
          rx="660"
          ry="400"
          fill="url(#glow)"
          stroke="none"
        />
        <polygon
          points="120,40 20,420 220,420"
          fill="url(#beam)"
          stroke="none"
          opacity="0.7"
        />
        <polygon
          points="1280,40 1180,420 1380,420"
          fill="url(#beam)"
          stroke="none"
          opacity="0.7"
        />
        <g filter="url(#wob)">
          <path d="M120 -60 L120 16 M1280 -60 L1280 16" />
          <path
            d="M92 40 Q92 16 120 16 Q148 16 148 40 Z M1252 40 Q1252 16 1280 16 Q1308 16 1308 40 Z"
            fill="#0e0d0c"
          />
          <path d="M236 60 Q236 46 250 46 L1150 46 Q1164 46 1164 60 L1164 620 Q1164 634 1150 634 L250 634 Q236 634 236 620 Z" />
          <path d="M320 652 L1080 652" strokeWidth={3} />
          <path
            d="M860 646 L900 646 M916 646 L950 646"
            stroke="oklch(0.8 0.14 70)"
            strokeWidth={4}
          />
          <path
            d="M0 600 C200 598 190 602 210 600 M1190 600 C1210 598 1300 602 1400 600"
            strokeWidth={1.6}
            opacity="0.45"
          />
          <path
            d="M60 860 L72 780 L140 780 L152 860 M84 780 C70 720 40 690 30 640 M104 780 C104 710 96 660 110 600 M124 780 C140 720 170 700 184 660 M96 740 C80 730 60 732 48 720 M112 700 C126 690 140 690 150 676"
            strokeWidth={2}
          />
          <path
            d="M346 862 L346 810 Q346 780 376 774 L392 770 Q378 756 378 738 A34 34 0 1 1 446 738 Q446 756 432 770 L448 774 Q470 780 470 800"
            fill="#0e0d0c"
          />
          <path
            d="M1054 862 L1054 810 Q1054 780 1024 774 L1008 770 Q1022 756 1022 738 A34 34 0 1 0 954 738 Q954 756 968 770 L952 774 Q930 780 930 800"
            fill="#0e0d0c"
          />
          <path d="M480 688 L920 688 L1180 820 L220 820 Z" fill="#0e0d0c" />
          <path d="M220 820 L220 836 L1180 836 L1180 820" />
          <path
            d="M540 716 L620 716 L610 690 M540 716 L552 690"
            strokeWidth={2}
          />
          <path
            d="M790 712 L790 734 Q790 740 796 740 L816 740 Q822 740 822 734 L822 712 Z M822 718 Q832 718 832 726 Q832 732 822 732"
            strokeWidth={2}
            fill="#0e0d0c"
          />
          <path
            d="M680 760 L740 752 L748 790 L688 798 Z"
            strokeWidth={1.8}
            opacity="0.8"
          />
          <path
            d="M300 862 L300 846 Q300 824 330 822 L470 822 Q500 824 500 846 L500 862"
            fill="#0e0d0c"
          />
          <path
            d="M318 862 Q318 806 360 796 Q384 790 390 780 Q366 760 366 730 A34 34 0 1 1 434 730 Q434 760 410 780 Q416 790 440 796 Q482 806 482 862"
            fill="#0e0d0c"
          />
          <path
            d="M900 862 L900 846 Q900 824 930 822 L1070 822 Q1100 824 1100 846 L1100 862"
            fill="#0e0d0c"
          />
          <path
            d="M918 862 Q918 806 960 796 Q984 790 990 780 Q966 760 966 730 A34 34 0 1 1 1034 730 Q1034 760 1010 780 Q1016 790 1040 796 Q1082 806 1082 862"
            fill="#0e0d0c"
          />
          <path
            d="M560 862 L560 846 Q560 816 600 812 L800 812 Q840 816 840 846 L840 862"
            fill="#0e0d0c"
          />
          <path
            d="M586 862 Q586 790 640 776 Q670 768 676 754 Q644 728 644 690 A56 56 0 1 1 756 690 Q756 728 724 754 Q730 768 760 776 Q814 790 814 862"
            fill="#0e0d0c"
          />
          <path
            d="M540 862 L540 842 Q540 828 560 828 L840 828 Q860 828 860 842 L860 862"
            fill="#0e0d0c"
          />
        </g>
      </svg>
      {/* the showreel plays on the presentation board (muted autoplay loop);
          the dashboard screenshot is the poster until the video is ready. */}
      <video
        src="/persept-showreel.mp4"
        poster="/images/dashboard-office.png"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="The Persept office dashboard showreel, running on the board"
        style={{
          position: "absolute",
          left: "17.14%",
          top: "6.4%",
          width: "65.71%",
          height: "66.9%",
          objectFit: "contain",
          objectPosition: "center",
          background: "#0e0d0c",
          borderRadius: 6,
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "4%",
          top: "44%",
          width: "min(300px, 30%)",
          minWidth: 210,
          background: "#f4f1ec",
          color: "#0e0d0c",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          transform: "rotate(-2deg)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6b655d",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "oklch(0.62 0.16 150)",
            }}
          />
          <span>Hunter · 02:14</span>
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 500 }}>
          3 intro emails drafted overnight. Send?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              background: "#0e0d0c",
              color: "#f4f1ec",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Send
          </span>
          <span
            style={{
              border: "1px solid rgba(14,13,12,0.2)",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
            }}
          >
            Review
          </span>
        </div>
      </div>
    </div>
  );
}

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
          <ProofScene />
          <div className="pl-proof-roles">
            <div>
              <span className="pl-amber">Chief of staff</span> briefs the
              founder every morning
            </div>
            <div>
              <span className="pl-amber">Outreach</span> drafts every message;
              the founder presses send
            </div>
            <div>
              <span className="pl-amber">Proposals</span> writes the proposal
              the day of the call
            </div>
            <div>
              <span className="pl-amber">Content</span> drafts the week&rsquo;s
              posts
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
