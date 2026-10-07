import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";

const UPDATED = "7 October 2026";

const DESCRIPTION =
  "How Persept handles personal data on persept.ai and across the AI workforce service: what we collect, who processes it, your rights under the UAE PDPL, and how to reach us.";

export const metadata: Metadata = {
  title: { absolute: "Privacy policy · Persept" },
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy policy · Persept",
    description: DESCRIPTION,
    url: "https://persept.ai/privacy",
    type: "website",
  },
};

export default function Privacy() {
  return (
    <div className="pl" id="top">
      <PlNav base="/" />

      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Privacy policy</div>
          <h1 className="pl-h2-big">How we handle personal data</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            This policy explains what personal data Persept collects through
            this website and the AI workforce service, why we hold it, who we
            share it with and the rights you have. For the detail of how we
            store a client&rsquo;s business data, where it is hosted and which
            providers we use, see the{" "}
            <Link href="/trust" className="pl-amber">
              Trust page
            </Link>
            .
          </p>
          <div className="pl-legal-meta">Last updated {UPDATED}</div>
        </div>
      </header>

      <section className="pl-section pl-trust">
        <div className="pl-trust-inner">
          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Who we are</h2>
            <p className="pl-trust-p">
              Persept Software Solutions is a software studio based in Dubai,
              United Arab Emirates (&ldquo;Persept&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;). We are the controller of the personal data
              described here. For any privacy question, or to exercise your
              rights, email{" "}
              <a href="mailto:khizr@persept.ai" className="pl-amber">
                khizr@persept.ai
              </a>
              .
            </p>
            <p className="pl-trust-p">
              Registered address: [registered address, Dubai]. Trade licence:
              [trade licence no.].
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">What this policy covers</h2>
            <ul className="pl-trust-list">
              <li>
                <strong>This website</strong> (persept.ai) and people who visit
                it, contact us or book a call.
              </li>
              <li>
                <strong>The AI workforce service</strong> we run for clients.
                The full data-handling detail for the service lives on the{" "}
                <Link href="/trust" className="pl-amber">
                  Trust page
                </Link>
                ; this policy summarises it and sets out your rights.
              </li>
            </ul>
            <p className="pl-trust-p">
              Persept&rsquo;s other products have their own privacy terms.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">What we collect, and when</h2>
            <ul className="pl-trust-list">
              <li>
                <strong>When you contact us.</strong> The contact form on this
                site opens your own email app with a pre-filled message to{" "}
                <a href="mailto:khizr@persept.ai" className="pl-amber">
                  khizr@persept.ai
                </a>
                ; we do not store anything on the website when you use it. When
                you email or message us on WhatsApp, we receive your name, your
                email address or phone number, and whatever you choose to tell
                us.
              </li>
              <li>
                <strong>When you book a call.</strong> Booking is handled by
                Calendly. You give Calendly your name, email and a time; it
                passes those to us so we can meet you. Calendly processes that
                booking under its own privacy policy.
              </li>
              <li>
                <strong>Technical logs.</strong> Our hosting provider keeps
                standard server logs (such as IP address, browser type and the
                pages requested) to run the site securely and diagnose problems.
              </li>
              <li>
                <strong>Business contact data in the service.</strong> For
                clients, the agents work with business contact details, the
                source each contact came from, and the client&rsquo;s own rate
                card, past work and proposals. See the{" "}
                <Link href="/trust" className="pl-amber">
                  Trust page
                </Link>
                . We do not handle payment cards, identity documents or personal
                records.
              </li>
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Cookies and analytics</h2>
            <p className="pl-trust-p">
              This website does not use advertising or analytics trackers and
              sets no marketing cookies. Fonts are served from our own domain,
              not a third party. The only cookie we set is a strictly necessary
              sign-in cookie on the client dashboard, used to keep you logged
              in; it is not used for tracking.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Why we use your data (legal basis)</h2>
            <ul className="pl-trust-list">
              <li>To answer your enquiry and arrange a call you asked for.</li>
              <li>
                To provide and run the AI workforce service under our agreement
                with a client.
              </li>
              <li>To keep the site and the service secure and working.</li>
              <li>To meet legal and regulatory obligations.</li>
            </ul>
            <p className="pl-trust-p">
              Under the UAE Personal Data Protection Law (Federal Decree-Law No.
              45 of 2021), we rely on your consent, the performance of a
              contract, and our legitimate business interests, as appropriate to
              each case.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Who we share it with</h2>
            <p className="pl-trust-p">
              We do not sell personal data and we do not share it for
              advertising. We use a small set of service providers who process
              data on our behalf under contract:
            </p>
            <ul className="pl-trust-list">
              <li>
                <strong>Hosting of this website:</strong> our cloud hosting
                provider (server logs only).
              </li>
              <li>
                <strong>Call booking:</strong> Calendly.
              </li>
              <li>
                <strong>Messaging:</strong> if you message us on WhatsApp, Meta
                handles that message.
              </li>
              <li>
                <strong>The service:</strong> the sub-processors listed on the{" "}
                <Link href="/trust" className="pl-amber">
                  Trust page
                </Link>{" "}
                (for example Anthropic for the AI model, Supabase for the
                database, Hostinger for the server, and your own Google or
                Microsoft account for email).
              </li>
            </ul>
            <p className="pl-trust-note">
              Anthropic&rsquo;s commercial terms prohibit training on customer
              content.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">International transfers</h2>
            <p className="pl-trust-p">
              Some of these providers process data outside the UAE (for example
              in the United States or the European Union). Where data leaves the
              UAE we rely on the providers&rsquo; contractual safeguards and
              their own data-protection commitments. Client service instances
              are hosted in [London / Frankfurt].
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">How long we keep it</h2>
            <ul className="pl-trust-list">
              <li>
                Enquiries and booking details: for as long as needed to deal
                with your request and keep a reasonable business record, then
                deleted.
              </li>
              <li>
                Client service data: for the life of the contract. When you
                leave, you can export everything and we delete our copy within
                30 days of the contract ending.
              </li>
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Email we send</h2>
            <p className="pl-trust-p">
              Outbound email is sent only after a person approves it. We email
              business addresses only, keep volumes low and relevant, and
              include sender details and a one-click opt-out in every message.
              Anyone who opts out is added to a do-not-contact list that is
              never overridden. We make no automated calls and run no LinkedIn
              automation. The full email rules are on the{" "}
              <Link href="/trust" className="pl-amber">
                Trust page
              </Link>
              .
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Your rights</h2>
            <p className="pl-trust-p">
              Subject to the UAE PDPL, you may ask us to give you a copy of your
              data, correct it, delete it, restrict or object to its use, or
              withdraw consent you gave earlier. You can also complain to the
              UAE Data Office. To make a request, email{" "}
              <a href="mailto:khizr@persept.ai" className="pl-amber">
                khizr@persept.ai
              </a>
              . We will respond within the time the law allows.
            </p>
            <p className="pl-trust-p">
              If your data is handled as part of a client&rsquo;s service, that
              client is the controller of their own contacts and we act on their
              instructions; we will pass your request to them where that is the
              right route.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Security</h2>
            <p className="pl-trust-p">
              Each client runs on its own private instance, never shared with
              other clients. We limit who can access data, use reputable
              providers, and keep access under review.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Children</h2>
            <p className="pl-trust-p">
              This site and service are meant for businesses and are not
              directed at children. We do not knowingly collect data about
              children.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Changes to this policy</h2>
            <p className="pl-trust-p">
              If we change how we handle data, we will update this page and the
              date at the top. Material changes will be made clear.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">Contact</h2>
            <p className="pl-trust-p">
              Persept Software Solutions, Dubai ·{" "}
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
