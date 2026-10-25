import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import "../guides.css";
import {
  BOOKING_HREF,
  bookAttrs,
  PlFooter,
  PlNav,
} from "@/components/sections/pl-chrome";
import { type Guide, getGuide, SITE_URL } from "@/lib/guides";

const found = getGuide("ai-workforce-dubai");
if (!found) {
  throw new Error("Missing guide registry entry: ai-workforce-dubai");
}
// Explicit annotation so the narrowed type survives into the component closure.
const guide: Guide = found;

const url = `${SITE_URL}/guides/${guide.slug}`;
const ISO_DATE = "2026-10-22";

export const metadata: Metadata = {
  title: { absolute: guide.metaTitle },
  description: guide.description,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: {
    title: guide.metaTitle,
    description: guide.description,
    url,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: guide.metaTitle,
    description: guide.description,
  },
};

// FAQ — the six on the homepage plus two Dubai-specific ones. Rendered on the
// page AND emitted as FAQPage JSON-LD from the same array so they never drift.
const FAQ: [string, string][] = [
  [
    "What exactly is an AI workforce?",
    "A small team of AI agents, each with one job, built for your business and connected to your tools. They do the research, drafting and follow-ups. You approve what goes out.",
  ],
  [
    "Is this just a chatbot?",
    "No. A chatbot waits to be asked one question at a time. An AI workforce runs jobs in the background — watching an inbox, chasing a reply, drafting a proposal — and brings you the result to approve.",
  ],
  [
    "Do I need new software?",
    "No. It works with Gmail or Outlook, WhatsApp, Google Sheets, and Zoho or HubSpot if you already use them. You get one dashboard and a phone app for approvals.",
  ],
  [
    "What will the agents never do?",
    "Send, publish or pay without your approval, invent a price, or phone anyone. The call is always yours.",
  ],
  [
    "How much does it cost in Dubai?",
    "Less than a hire. A coordinator in Dubai runs roughly AED 5,000–8,000 a month plus a visa; an AI workforce is a flat monthly fee with no visa, no desk and no evenings. We price it against the one job you want taken off your plate.",
  ],
  [
    "Who owns the data?",
    "You do. Export it any time. We delete our copy within 30 days of the contract ending.",
  ],
  [
    "How fast can we start?",
    "Your first workflow is usually live within 7 days of the first call.",
  ],
];

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: guide.metaTitle,
  description: guide.description,
  inLanguage: "en",
  mainEntityOfPage: url,
  datePublished: ISO_DATE,
  dateModified: ISO_DATE,
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Guides",
      item: `${SITE_URL}/guides`,
    },
    { "@type": "ListItem", position: 3, name: guide.title, item: url },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

// The six agents, each with one job — matches the workforce Persept runs.
const AGENTS: [string, string][] = [
  [
    "Chief of Staff",
    "Runs the day. Pulls together what happened overnight, flags what needs you, and routes the rest to the right agent. Your one morning brief instead of five open tabs.",
  ],
  [
    "Scout",
    "Watches the market. New tenders, competitor moves, mentions worth a reply — Scout reads so you don't have to, and surfaces only what matters.",
  ],
  [
    "Hunter",
    "Does outreach and follow-ups. Finds the right contacts, drafts the first message and chases the ones who went quiet — then hands you the draft to send.",
  ],
  [
    "Fixer",
    "Keeps operations moving. Chases a cleaner until they confirm, updates the sheet, reconciles the list, and makes sure nothing quietly falls through.",
  ],
  [
    "Muse",
    "Handles marketing. Drafts the post, the newsletter and the caption in your voice, on a schedule — you approve before anything goes live.",
  ],
  [
    "Scribe",
    "Writes the documents. Proposals, quotes, weekly reports and summaries, built from your own rate card and past work, ready for your eyes before they leave.",
  ],
];

export default function AiWorkforceDubaiGuide() {
  return (
    <div className="pl" id="top">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <PlNav base="/" />

      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">
            <Link href="/guides" className="pl-amber">
              Guides
            </Link>{" "}
            / {guide.eyebrow}
          </div>
          <h1 className="pl-h2-big">
            An AI workforce for Dubai businesses, explained plainly
          </h1>
          <p className="pl-lead g-lede" style={{ marginTop: 28 }}>
            Everyone&rsquo;s selling &ldquo;AI&rdquo; and almost no one will
            tell you plainly what you get, what it costs, or where it breaks.
            Here it is, start to finish, for a real Dubai business.
          </p>
          <div className="g-meta">
            <span>Updated {guide.updated}</span>
            <span>{guide.readMinutes} min read</span>
            <span>Persept · Dubai</span>
          </div>
        </div>
      </header>

      <section className="pl-section pl-trust">
        <div className="pl-trust-inner">
          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">
              What an &ldquo;AI workforce&rdquo; actually means
            </h2>
            <p className="pl-trust-p">
              Strip away the buzzwords and it&rsquo;s simple. An AI workforce is
              a small set of software agents, each given one job, each connected
              to the tools you already use. They handle the repetitive,
              message-heavy work that eats a founder&rsquo;s week &mdash; the
              chasing, drafting, summarising and following up &mdash; and they
              do it 24 hours a day without a visa, a desk or a day off.
            </p>
            <p className="pl-trust-p">
              It is not a chatbot. A chatbot sits on your website and waits to
              be asked one thing at a time. It is not the one giant
              do-everything AI you&rsquo;ve seen demoed, either &mdash; those
              are impressive for ninety seconds and terrifying the moment they
              touch a real customer. An AI workforce is the boring, useful
              version: narrow agents doing narrow jobs, with you in charge of
              what goes out.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">The six jobs it does</h2>
            <p className="pl-trust-p">
              Think of it the way you&rsquo;d think of a team. Each agent has a
              name and one responsibility, so you always know who did what and
              where to look when something needs changing.
            </p>
            <ul className="pl-trust-list">
              {AGENTS.map(([name, job]) => (
                <li key={name}>
                  <strong>{name}.</strong> {job}
                </li>
              ))}
            </ul>
            <p className="pl-trust-p">
              You don&rsquo;t start with all six. You start with the one job
              that&rsquo;s costing you the most time, prove it works, then add
              the next. Most businesses run two or three agents well before they
              want a fourth.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">The one rule that makes it safe</h2>
            <p className="pl-trust-p">
              This is the part that matters most, and the part most &ldquo;AI
              agent&rdquo; pitches skip. An agent is brilliant at preparing work
              and genuinely dangerous when it acts on its own. The fix is a
              single, non-negotiable rule.
            </p>
            <div className="g-callout">
              <p>
                <strong>
                  Agents draft and prepare. A person presses send, merge,
                  publish and pay.
                </strong>{" "}
                Anything that touches money, access or a customer becomes an
                approval request you tap yes or no on &mdash; from your phone,
                in seconds.
              </p>
            </div>
            <p className="pl-trust-p">
              That one rule is why this is faster in practice, not slower. The
              agent does the ninety minutes of drafting and chasing; you spend
              ten seconds approving. Nothing embarrassing goes to a client,
              nothing wrong gets paid, and you never wake up to a mess an
              overconfident bot made at 3am. It&rsquo;s also what keeps you the
              right side of a regulated market &mdash; the decisions that carry
              risk stay with a human. You can read how we handle your data and
              approvals on our{" "}
              <Link href="/trust" className="pl-amber">
                Trust page
              </Link>
              .
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">
              What it works with (no new software)
            </h2>
            <p className="pl-trust-p">
              You don&rsquo;t rip anything out. The agents plug into the tools
              your business already lives in:
            </p>
            <ul className="pl-trust-list">
              <li>
                <strong>Email</strong> &mdash; Gmail or Outlook, so drafts and
                follow-ups happen where your inbox already is.
              </li>
              <li>
                <strong>WhatsApp</strong> &mdash; the channel that actually gets
                opened in the UAE, where roughly nine in ten people check it
                every day.
              </li>
              <li>
                <strong>Spreadsheets</strong> &mdash; Google Sheets for the
                lists, trackers and rotas you already keep.
              </li>
              <li>
                <strong>Your CRM</strong> &mdash; Zoho or HubSpot if you use
                one; if you don&rsquo;t, you don&rsquo;t need to buy one.
              </li>
            </ul>
            <p className="pl-trust-p">
              What you get that&rsquo;s new is small: one dashboard to see what
              the agents are doing, and a phone app where approvals land. That
              &rsquo;s it.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">What it costs, and what you save</h2>
            <p className="pl-trust-p">
              The honest comparison isn&rsquo;t AI versus free. It&rsquo;s AI
              versus the hire you&rsquo;d otherwise make, or the evenings
              you&rsquo;re spending now.
            </p>
            <div className="g-table-wrap">
              <table className="g-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Rough monthly cost</th>
                    <th>The catch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A coordinator / admin hire</td>
                    <td>AED 5,000–8,000 + visa</td>
                    <td>
                      Recruiting, onboarding, sick days, one person&rsquo;s
                      hours
                    </td>
                  </tr>
                  <tr>
                    <td>Pay-per-lead tools</td>
                    <td>Variable</td>
                    <td>The same leads sold to your competitors</td>
                  </tr>
                  <tr>
                    <td>Doing it yourself</td>
                    <td>&ldquo;Free&rdquo;</td>
                    <td>Your evenings and the growth you&rsquo;re not doing</td>
                  </tr>
                  <tr>
                    <td>An AI workforce</td>
                    <td>Flat monthly fee</td>
                    <td>No visa, no desk, no evenings &mdash; runs 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="pl-trust-p">
              UAE businesses putting AI to work on operations commonly report
              saving 15&ndash;20 hours a week on admin. We price against the one
              job you want gone, not a seat count, so the maths is easy to check
              before you commit. A full pricing breakdown is a guide of its own,
              coming shortly.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Where it fits best</h2>
            <p className="pl-trust-p">
              If your team repeats the same work every week, it fits. A few
              Dubai examples where the payback is quickest:
            </p>
            <ul className="pl-trust-list">
              <li>
                <strong>Hospitality &amp; holiday homes.</strong> Guests message
                at all hours and expect an instant WhatsApp reply; reviews need
                chasing; cleaners need confirming. An agent drafts the replies
                and handles the chasing, your team presses send.
              </li>
              <li>
                <strong>Real estate.</strong> Portal leads go cold overnight if
                no one answers. An agent qualifies and follows up the moment a
                lead lands, so your brokers spend their time on the calls that
                close.
              </li>
              <li>
                <strong>Agencies &amp; professional services.</strong>{" "}
                Proposals, follow-ups and weekly reports are the work that
                always slips. Scribe and Hunter keep them moving.
              </li>
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">How fast you can start</h2>
            <p className="pl-trust-p">
              Faster than a hire, by a distance. We start with one call to pick
              a single workflow and tell you honestly whether it fits &mdash; if
              it doesn&rsquo;t, we&rsquo;ll say so. From there, your first agent
              is usually live within seven days. You see it working on real work
              before you scale it, and you can export everything and walk away
              at any time.
            </p>
          </div>

          {/* CTA */}
          <div className="g-cta">
            <h2>See it on your own workflow</h2>
            <p>
              Tell us where your week goes and we&rsquo;ll tell you which part
              an agent could take &mdash; and which part should stay with you.
            </p>
            <div className="g-cta-row">
              <a href={BOOKING_HREF} className="pl-book" {...bookAttrs}>
                Book a 15-minute call
              </a>
              <Link href="/" className="pl-nav-signin">
                See the workforce →
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="pl-trust-block" style={{ marginTop: 48 }}>
            <h2 className="pl-trust-h2">Questions people ask first</h2>
            {FAQ.map(([q, a]) => (
              <div key={q} style={{ marginTop: 20 }}>
                <h3
                  className="pl-trust-p"
                  style={{ fontWeight: 600, marginBottom: 6 }}
                >
                  {q}
                </h3>
                <p className="pl-trust-p" style={{ marginTop: 0 }}>
                  {a}
                </p>
              </div>
            ))}
          </div>

          {/* Related */}
          <div className="g-related">
            <div className="g-related-h">Keep reading</div>
            <div className="g-grid">
              <Link href="/projects/gyst" className="g-card">
                <div className="g-card-eyebrow">Our product</div>
                <h2 className="g-card-title">GYST</h2>
                <p className="g-card-excerpt">
                  The AI workforce idea, turned into a product of our own: the
                  whole job search on one guided path.
                </p>
              </Link>
              <Link href="/about" className="g-card">
                <div className="g-card-eyebrow">About</div>
                <h2 className="g-card-title">Who builds this</h2>
                <p className="g-card-excerpt">
                  A Dubai AI workforce studio. Problem-led, high craft, honest
                  about what agents can and can&rsquo;t do.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PlFooter />
    </div>
  );
}
