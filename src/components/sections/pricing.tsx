import { BOOKING_HREF, bookAttrs } from "./pl-chrome";

// Shared pricing section — one source of truth for the three tiers, used by the
// homepage and every trade page. Pass `extraNote` for trade-specific lines
// (e.g. "The pilot covers one show.").

const PILOT_HREF = "mailto:khizr@persept.ai?subject=Pilot";

type Tier = {
  name: string;
  what: string;
  price: string;
  unit: string;
  agents: string;
  cta: string;
  href: string;
  featured?: boolean;
  external?: boolean;
};

export const PRICING_TIERS: Tier[] = [
  {
    name: "Pilot",
    what: "One campaign for 30 days",
    price: "[AED 3,500]",
    unit: "one-off, setup included",
    agents: "Lead Scout, Outreach, Proposals, Daily Brief",
    cta: "Start a pilot",
    href: PILOT_HREF,
    featured: true,
  },
  {
    name: "Pipeline",
    what: "Spot, reach and propose, every month",
    price: "[AED 2,990]",
    unit: "/ month",
    agents: "Lead Scout, Outreach, Proposals, Daily Brief",
    cta: "Book a call",
    href: BOOKING_HREF,
    external: true,
  },
  {
    name: "Full team",
    what: "The whole sales cycle",
    price: "[AED 4,990]",
    unit: "/ month",
    agents:
      "Everything in Pipeline, plus Renewals, Brief Intake, Project Tracker and Content",
    cta: "Book a call",
    href: BOOKING_HREF,
    external: true,
  },
];

export function PricingSection({ extraNote }: { extraNote?: string }) {
  return (
    <section className="pl-section" id="pricing">
      <div className="pl-inner">
        <div className="pl-eyebrow amber" style={{ marginBottom: 20 }}>
          Pricing
        </div>
        <h2
          className="pl-h2-big"
          style={{ maxWidth: "15ch", marginBottom: 64 }}
        >
          Simple monthly pricing. AI usage included.
        </h2>
        <div className="pl-tier-grid">
          {PRICING_TIERS.map((t) => (
            <div
              className={`pl-tier${t.featured ? " featured" : ""}`}
              key={t.name}
            >
              <div className="pl-tier-head">
                <h3 className="pl-tier-name">{t.name}</h3>
                <div className="pl-tier-what">{t.what}</div>
              </div>
              <div className="pl-tier-price">
                <span className="pl-tier-amount">{t.price}</span>
                <span className="pl-tier-unit">{t.unit}</span>
              </div>
              <div className="pl-tier-agents">
                <div className="pl-tier-agents-k">Agents</div>
                <div className="pl-tier-agents-v">{t.agents}</div>
              </div>
              <a
                href={t.href}
                className={`pl-pill pl-tier-cta${t.featured ? " dark" : " outline"}`}
                {...(t.external ? bookAttrs : {})}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
        <div className="pl-tier-notes">
          {extraNote && (
            <div>
              <strong>{extraNote}</strong>
            </div>
          )}
          <div>One won job usually covers months of the fee.</div>
          <div>
            <strong>Annual plan:</strong> 12 months for the price of 10.
          </div>
          <div>
            <strong className="pl-amber">Founder rate:</strong> the first three
            firms get the pilot at [AED 2,500] in exchange for a case study.
          </div>
        </div>
      </div>
    </section>
  );
}
