import { FaqList } from "./faq";
import { HowOrbit } from "./how-orbit";
import { OfficePanel } from "./office-panel";
import {
  BOOKING_HREF,
  bookAttrs,
  PlFooter,
  PlNav,
  WHATSAPP_HREF,
} from "./pl-chrome";
import { PricingSection } from "./pricing";
import { ProofVideo } from "./proof-video";
import "./landing.css";

// The single-page landing, rebuilt from the "Persept Landing v4" design handoff:
// an AI sales team for any UAE firm that wins work by quotation. Static server
// markup; only the hero office simulation and the proof showreel are client
// islands.

const col = (h: number) => `oklch(0.78 0.12 ${h})`;

// ── Sound familiar? — seven owner quotes, then the amber answer cell ─────────
const QUOTES = [
  "Quotes take days.",
  "We never follow up.",
  "All our work comes from referrals.",
  "I'm the bottleneck.",
  "We forget past clients.",
  "We hear about projects too late.",
  "Deadlines slip.",
];

// ── How it works: the six steps ─────────────────────────────────────────────
const STEPS: {
  n: string;
  role: string;
  agent: string;
  body: string;
  h: number;
}[] = [
  {
    n: "01",
    role: "Spot",
    agent: "Lead Scout",
    h: 20,
    body: "Watches the public signals that show a business is about to buy, such as new hotels and restaurants, building handovers, new licences, new regulations and show exhibitor lists. Finds a named contact on the company's own site.",
  },
  {
    n: "02",
    role: "Reach",
    agent: "Outreach",
    h: 150,
    body: "Sends a short first email and follow-ups on day 3 and day 7, timed to the buyer's deadline. Sorts the replies and passes the warm ones to you.",
  },
  {
    n: "03",
    role: "Brief",
    agent: "Brief Intake",
    h: 290,
    body: "Turns requests from email or WhatsApp into a clear brief covering scope, size, budget and deadline, plus the questions still missing.",
  },
  {
    n: "04",
    role: "Propose",
    agent: "Proposals",
    h: 220,
    body: "Writes a proposal page with your past work and prices from your rate card. You see when the buyer opens it.",
  },
  {
    n: "05",
    role: "Deliver",
    agent: "Project Tracker",
    h: 110,
    body: "Keeps every deadline for won jobs and chases suppliers for confirmations.",
  },
  {
    n: "06",
    role: "Renew",
    agent: "Renewals",
    h: 70,
    body: "Reminds past clients before contracts lapse and asks about the next job at the right time.",
  },
];

// ── Signals Lead Scout reads daily ──────────────────────────────────────────
const SIGNALS: { n: string; h: number; title: string; trades: string }[] = [
  {
    n: "01",
    h: 20,
    title: "A new hotel opening in 2027",
    trades: "Furniture, linen, uniforms, kitchens, signage, landscaping",
  },
  {
    n: "02",
    h: 150,
    title: "A building handed over this quarter",
    trades: "Fire safety, MEP maintenance, cleaning, security",
  },
  {
    n: "03",
    h: 290,
    title: "Dubai's new building safety law",
    trades: "Engineering inspections, facade, waterproofing",
  },
  {
    n: "04",
    h: 220,
    title: "A restaurant announcing its opening",
    trades: "Kitchen equipment, signage, fit-out",
  },
  {
    n: "05",
    h: 110,
    title: "A company that just raised funding or opened in DIFC",
    trades: "IT, furniture, fit-out, recruitment, PR",
  },
  {
    n: "06",
    h: 70,
    title: "An e-invoicing or Emiratisation deadline",
    trades: "ERP implementers, recruitment, training",
  },
  {
    n: "07",
    h: 20,
    title: "A show's exhibitor list",
    trades: "Stand builders, gifting, printing, video",
  },
  {
    n: "08",
    h: 70,
    title: "Last year's clients",
    trades: "Every trade: renewals and repeat work",
  },
];

// ── Who it's for — trade chips ──────────────────────────────────────────────
const CHIPS = [
  "Fire and life safety contractors",
  "MEP and HVAC maintenance",
  "Commercial kitchen suppliers",
  "Signage makers",
  "Office furniture and fit-out",
  "IT managed services",
  "Hotel pre-opening suppliers",
  "Building inspection and facade firms",
  "E-invoicing and ERP implementers",
  "Recruitment agencies",
  "Exhibition stand builders",
  "Event companies",
  "Corporate gifting",
];

// ── You keep the final say ──────────────────────────────────────────────────
const FINAL_SAY = [
  "Every email, price and proposal waits in your approvals inbox.",
  "Clear it in one 15-minute batch a day, from your phone.",
  "Prices come only from your rate card. The agents never invent a number.",
  "The agents never phone anyone. Calls are yours.",
];

// ── Proof stats — placeholder-but-believable figures until the real dashboard
// logs are wired in. Swap for actual numbers (and the month) before launch.
const STATS = [
  { n: "1,284", l: "companies researched in September" },
  { n: "418", l: "emails drafted, 0 sent without approval" },
  { n: "23", l: "proposals written" },
];

// ── Your first week ─────────────────────────────────────────────────────────
const WEEK = [
  {
    day: "Day 1",
    body: "A 15-minute call. You tell me who your best clients are and what signals they leave.",
    green: false,
  },
  {
    day: "Day 3",
    body: "Your target list for one campaign, with your rate card and past work loaded.",
    green: false,
  },
  {
    day: "Day 7",
    body: "First emails out, after you approve them.",
    green: true,
  },
  {
    day: "Day 30",
    body: "Results report: leads reached, replies, proposals opened, jobs won.",
    green: false,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
const CMP_HEAD = [
  "Hire a sales coordinator",
  "Pay-per-lead sites",
  "Do it yourself",
];
const CMP_ROWS: { k: string; cells: string[]; persept: string }[] = [
  {
    k: "Cost",
    cells: [
      "AED 5,000 to 8,000 a month plus visa",
      "Pay per lead, shared with competitors",
      "Your evenings",
    ],
    persept: "From [AED 2,990] a month",
  },
  {
    k: "Leads",
    cells: [
      "Whoever they find",
      "The same leads as everyone else",
      "Whoever you have time for",
    ],
    persept: "Your own list, from public signals",
  },
  {
    k: "Follow-ups",
    cells: ["When they remember", "Not included", "When you remember"],
    persept: "Day 3 and day 7, every time",
  },
  {
    k: "Proposals",
    cells: ["Days", "Not included", "Days"],
    persept: "Same day, from your rate card",
  },
  {
    k: "Who approves",
    cells: ["You", "Not applicable", "You"],
    persept: "You, every time",
  },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ: { q: string; a: string }[] = [
  {
    q: "Does this work for my trade?",
    a: "If you sell to businesses and quote every job, yes. On the first call we work out which signals your buyers leave.",
  },
  {
    q: "What does it cost?",
    a: "A 30-day pilot is [AED 3,500] with setup included. After that, from [AED 2,990] a month, with AI usage included.",
  },
  {
    q: "Do emails come from my company?",
    a: "Yes. They are sent under your name from a separate sending address on your domain, so your everyday email isn't affected.",
  },
  {
    q: "Is cold email allowed?",
    a: "We email business addresses only, keep volumes low and relevant, and put a one-click opt-out in every message. Anyone who opts out is never contacted again.",
  },
  {
    q: "Where do the leads come from?",
    a: "From public business sources for your trade, plus your own past clients. Each contact's source is recorded.",
  },
  {
    q: "Do the agents make phone calls?",
    a: "No. Calls are yours. The agents tell you who replied and is worth calling.",
  },
  {
    q: "What if a proposal has the wrong price?",
    a: "It can't go out without you. Prices come only from your rate card.",
  },
  {
    q: "Who owns the lists and data?",
    a: "You do. Export them any time. We delete our copy within 30 days of the contract ending.",
  },
  {
    q: "Which tools does it work with?",
    a: "Gmail or Outlook, WhatsApp, Google Sheets, and Zoho or HubSpot if you already use them.",
  },
];

// The proof "meeting room" — hand-drawn cream line art (feTurbulence wobble) of a
// team facing a presentation board that plays the real office showreel, with a
// cream "Outreach · 02:14" notification card overlapping the board.
function ProofScene() {
  return (
    <div className="pl-proof-scene">
      <svg
        viewBox="0 0 1400 860"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pl-proof-svg"
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
      {/* the showreel plays on the presentation board (muted autoplay loop),
          with the perfectly-synced mix behind a sound toggle. */}
      <ProofVideo />
      <div className="pl-proof-note">
        <div className="pl-proof-note-meta">
          <span className="pl-proof-note-dot" />
          <span>Outreach · 02:14</span>
        </div>
        <div className="pl-proof-note-text">
          3 intro emails drafted overnight. Send?
        </div>
        <div className="pl-proof-note-actions">
          <span className="pl-proof-note-send">Send</span>
          <span className="pl-proof-note-review">Review</span>
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
            <span>An AI sales team for firms that win work by quotation</span>
          </div>
          <h1 className="pl-h1">
            Hire an AI sales team.{" "}
            <span className="pl-amber">Keep the final say.</span>
          </h1>
          <div className="pl-hero-row">
            <p className="pl-lead">
              For firms that win work by quotation. AI agents spot who is about
              to buy, send the proposal the same day, follow up every quote and
              bring past clients back. You approve everything.
            </p>
            <div className="pl-hero-ctas">
              <div className="pl-cta-row">
                <a
                  href={BOOKING_HREF}
                  className="pl-pill pl-amber-btn"
                  {...bookAttrs}
                >
                  Book a 15-minute call
                </a>
                <a href="#office" className="pl-pill pl-outline-btn">
                  See it running
                </a>
              </div>
              <div className="pl-hero-sub">First campaign live in 7 days.</div>
            </div>
          </div>

          <div id="office" className="pl-office-anchor">
            <OfficePanel />
          </div>

          <p className="pl-office-cap">
            The agents spot, follow up and write. You approve every email and
            every price.
          </p>
        </div>
      </header>

      {/* ── Sound familiar? ──────────────────────────────────────────── */}
      <section className="pl-section pl-sf">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            Sound familiar?
          </div>
          <h2 className="pl-h2-big pl-sf-h2">
            Every firm that quotes for a living says the same things
          </h2>
          <div className="pl-sf-grid">
            {QUOTES.map((q, i) => (
              <div className="pl-sf-cell" key={q}>
                <span className="pl-sf-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pl-sf-quote">&ldquo;{q}&rdquo;</div>
              </div>
            ))}
            <div className="pl-sf-answer">
              None of these needs more staff. They need the same work done every
              day without anyone having to remember it.
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="pl-section pl-how-sec" id="how">
        <div className="pl-inner pl-how-top">
          <div className="pl-how-intro">
            <div className="pl-eyebrow amber">How it works</div>
            <h2 className="pl-h2-big">From the first signal to the next job</h2>
            <p className="pl-how-lead">
              One agent for each step. Every email, price and proposal comes to
              the middle and waits for you.
            </p>
          </div>
          <HowOrbit />
        </div>

        <div className="pl-inner pl-how-steps">
          <div className="pl-step-grid">
            {STEPS.map((s) => (
              <div className="pl-step" key={s.n}>
                <div className="pl-step-meta">
                  <span
                    className="pl-step-chip"
                    style={{ background: col(s.h) }}
                  />
                  <span>
                    {s.n} · {s.role}
                  </span>
                </div>
                <h3 className="pl-step-title">{s.agent}</h3>
                <p className="pl-step-body">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="pl-across">
            <div className="pl-eyebrow amber">Running across all steps</div>
            <div className="pl-across-item">
              <strong>Daily Brief:</strong> One message each morning covering
              pipeline, proposals opened, replies waiting and deadlines.
            </div>
            <div className="pl-across-item">
              <strong>Content:</strong> Turns finished projects into LinkedIn
              posts and case studies for you to approve.
            </div>
          </div>
        </div>
      </section>

      {/* ── Signals ──────────────────────────────────────────────────── */}
      <section className="pl-section pl-signals" id="signals">
        <div className="pl-inner">
          <div className="pl-signals-head">
            <div>
              <div className="pl-eyebrow pl-signals-eyebrow">
                <span className="pl-signals-dot" />
                <span>Signals · read daily by Lead Scout</span>
              </div>
              <h2 className="pl-h2-big" style={{ maxWidth: "15ch" }}>
                Know who is about to buy, before your competitors do
              </h2>
            </div>
            <p className="pl-signals-body">
              Most firms hear about a project after the supplier has been
              picked. Lead Scout reads public signals every day so you hear
              first.
            </p>
          </div>
          <div className="pl-signal-grid">
            {SIGNALS.map((s) => (
              <div className="pl-signal" key={s.n}>
                <div className="pl-signal-top">
                  <div className="pl-signal-meta">
                    <span
                      className="pl-signal-dot"
                      style={{ background: col(s.h) }}
                    />
                    <span>Signal {s.n}</span>
                  </div>
                  <h3 className="pl-signal-title">{s.title}</h3>
                </div>
                <div className="pl-signal-foot">
                  <span className="pl-signal-foot-k">Trades it suits</span>
                  <span className="pl-signal-foot-v">{s.trades}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className="pl-section pl-who" id="who">
        <div className="pl-inner">
          <div className="pl-who-head">
            <div>
              <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
                Who it&rsquo;s for
              </div>
              <h2 className="pl-h2-big" style={{ maxWidth: "13ch" }}>
                Built for firms that quote every job
              </h2>
            </div>
            <p className="pl-who-body">
              If you sell to businesses, quote every project and your jobs are
              worth AED 20,000 or more, it fits.
            </p>
          </div>
          <div className="pl-chips">
            {CHIPS.map((c) => (
              <span className="pl-chip" key={c}>
                {c}
              </span>
            ))}
          </div>
          <div className="pl-who-rule">
            <p className="pl-who-diff">
              Different trade? If you quote every job,{" "}
              <a href={BOOKING_HREF} className="pl-amber" {...bookAttrs}>
                book a call
              </a>
              .
            </p>
            <p className="pl-who-nofit">
              <span className="pl-nofit-tag">Not a fit</span>
              Mostly consumer work, jobs under AED 10,000, or tenders where only
              approved panels can bid.
            </p>
          </div>
        </div>
      </section>

      {/* ── You keep the final say (cream band) ──────────────────────── */}
      <section className="pl-section pl-say" id="approval">
        <div className="pl-inner">
          <div
            className="pl-eyebrow pl-say-eyebrow"
            style={{ marginBottom: 20 }}
          >
            You keep the final say
          </div>
          <h2 className="pl-h2-big pl-say-h2">
            Nothing leaves without your approval
          </h2>
          <div className="pl-say-grid">
            {FINAL_SAY.map((line) => (
              <div className="pl-say-point" key={line}>
                {line}
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
            The same agents find, email and send proposals for Persept every
            day.
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
        </div>
      </section>

      {/* ── Your first week ──────────────────────────────────────────── */}
      <section className="pl-section pl-week">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            Your first week
          </div>
          <h2
            className="pl-h2-big"
            style={{ maxWidth: "14ch", marginBottom: 72 }}
          >
            From call to first campaign in 7 days
          </h2>
          <div className="pl-week-grid">
            {WEEK.map((w) => (
              <div className="pl-week-col" key={w.day}>
                <div className="pl-week-line">
                  <span className={`pl-week-dot${w.green ? " green" : ""}`} />
                  <span className="pl-week-rule" />
                </div>
                <div className={`pl-week-day${w.green ? " green" : ""}`}>
                  {w.day}
                </div>
                <p className="pl-week-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Comparison ───────────────────────────────────────────────── */}
      <section className="pl-section pl-cmp-sec">
        <div className="pl-inner">
          <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
            Comparison
          </div>
          <h2 className="pl-h2-big" style={{ marginBottom: 56 }}>
            What else you could do
          </h2>
          <div className="pl-cmp-scroll">
            <div className="pl-cmp">
              <div className="pl-cmp-cell pl-cmp-corner" />
              {CMP_HEAD.map((h) => (
                <div className="pl-cmp-cell pl-cmp-colhead" key={h}>
                  {h}
                </div>
              ))}
              <div className="pl-cmp-cell pl-cmp-colhead pl-cmp-persept pl-cmp-persept-head">
                Persept
              </div>
              {CMP_ROWS.map((row) => (
                <PlCmpRow
                  key={row.k}
                  k={row.k}
                  cells={row.cells}
                  persept={row.persept}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="pl-section pl-faq-sec" id="faq">
        <div className="pl-inner pl-faq-grid">
          <div className="pl-faq-head">
            <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
              FAQ
            </div>
            <h2 className="pl-h2" style={{ fontSize: "clamp(40px,5vw,72px)" }}>
              Questions firms ask
            </h2>
            <a href="/trust" className="pl-faq-trust">
              How we handle your data →
            </a>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className="pl-section pl-about">
        <div className="pl-inner pl-about-grid">
          <div>
            <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
              About
            </div>
            <h2 className="pl-h2-med">Who builds it</h2>
          </div>
          <div className="pl-about-body">
            <p className="pl-about-p">
              A small studio in Dubai. I built these agents to run
              Persept&rsquo;s own sales first, then set them up for other firms.
              Before Persept I worked in banking and consulting at Emirates NBD,
              PwC and Rasmala. Every deployment is set up and looked after by
              me.
            </p>
            <div className="pl-founder">
              <div className="pl-founder-photo">photo</div>
              <div>
                <div className="pl-founder-name">Khizr Malik</div>
                <div className="pl-founder-links">
                  <a href="mailto:khizr@persept.ai">khizr@persept.ai</a>
                  <a
                    href="https://www.linkedin.com/company/persept"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="pl-cta">
        <div className="pl-cta-glow" />
        <div className="pl-cta-inner">
          <h2 className="pl-cta-h2">
            Fifteen minutes.{" "}
            <span className="pl-amber">
              Tell me where your best jobs come from.
            </span>
          </h2>
          <p className="pl-cta-p">
            I&rsquo;ll show you the agents running and the first campaign
            I&rsquo;d start for you.
          </p>
          <div className="pl-cta-row" style={{ justifyContent: "center" }}>
            <a
              href={BOOKING_HREF}
              className="pl-pill pl-amber-btn"
              {...bookAttrs}
            >
              Book a 15-minute call
            </a>
            <a
              href={WHATSAPP_HREF}
              className="pl-pill pl-wa-btn"
              target="_blank"
              rel="noreferrer"
            >
              <span className="pl-wa-dot" />
              Message on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <PlFooter />
    </div>
  );
}

function PlCmpRow({
  k,
  cells,
  persept,
}: {
  k: string;
  cells: string[];
  persept: string;
}) {
  return (
    <>
      <div className="pl-cmp-cell pl-cmp-rowhead">{k}</div>
      {cells.map((c) => (
        <div className="pl-cmp-cell" key={c}>
          {c}
        </div>
      ))}
      <div className="pl-cmp-cell pl-cmp-persept pl-cmp-strong">{persept}</div>
    </>
  );
}
