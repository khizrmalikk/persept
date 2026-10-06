import type { Metadata } from "next";
import "@/components/sections/landing.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";

const DESCRIPTION =
  "How Persept handles your data: business contact details and your own sales material only. Your own private instance, never shared. You can export everything and we delete our copy within 30 days.";

export const metadata: Metadata = {
  title: { absolute: "Trust · How Persept handles your data" },
  description: DESCRIPTION,
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "Trust · How Persept handles your data",
    description: DESCRIPTION,
    url: "https://persept.ai/trust",
    type: "website",
  },
};

const STORE = [
  "Company names, websites and business contacts.",
  "The source each contact came from.",
  "Your rate card, past work and proposals.",
];

const HOSTING = [
  "Your own private instance, never shared with other clients.",
  "Hosted in [London / Frankfurt].",
];

const PROVIDERS = [
  { p: "Anthropic", f: "AI model (Claude)", l: "United States" },
  { p: "Supabase", f: "Database", l: "[region]" },
  { p: "Hostinger", f: "Server", l: "[region]" },
  { p: "Google or Microsoft", f: "Your email", l: "Your account" },
];

const RULES = [
  "Business addresses only.",
  "Sender details and a one-click opt-out in every email.",
  "A do-not-contact list that is never overridden.",
  "No automated calls. No LinkedIn automation.",
];

export default function Trust() {
  return (
    <div className="pl" id="top">
      <PlNav base="/" />

      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Trust</div>
          <h1 className="pl-h2-big">How we handle your data</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            Persept works with business contact details and your own sales
            material. No payment cards, IDs or personal records.
          </p>
        </div>
      </header>

      <section className="pl-section pl-trust">
        <div className="pl-trust-inner">
          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">What we store</h2>
            <ul className="pl-trust-list">
              {STORE.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Where it&rsquo;s hosted</h2>
            <ul className="pl-trust-list">
              {HOSTING.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Who we use</h2>
            <div className="pl-provider-table">
              <div className="pl-provider-head">
                <div>Provider</div>
                <div>What for</div>
                <div>Location</div>
              </div>
              {PROVIDERS.map((row) => (
                <div className="pl-provider-row" key={row.p}>
                  <div className="pl-provider-p">{row.p}</div>
                  <div>{row.f}</div>
                  <div>{row.l}</div>
                </div>
              ))}
            </div>
            <p className="pl-trust-note">
              Anthropic&rsquo;s commercial terms prohibit training on customer
              content.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Email rules we follow</h2>
            <ul className="pl-trust-list">
              {RULES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">When you leave</h2>
            <p className="pl-trust-p">
              Export everything. We delete our copy within 30 days.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Contact</h2>
            <p className="pl-trust-p">
              <a href="mailto:khizr@persept.ai" className="pl-amber">
                khizr@persept.ai
              </a>
            </p>
          </div>
        </div>
      </section>

      <PlFooter />
    </div>
  );
}
