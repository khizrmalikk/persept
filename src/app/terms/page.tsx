import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";

const UPDATED = "7 October 2026";

const DESCRIPTION =
  "The terms for using persept.ai and the Persept AI workforce service: the approvals model, your responsibilities, data ownership, fees, liability and governing law.";

export const metadata: Metadata = {
  title: { absolute: "Terms · Persept" },
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms · Persept",
    description: DESCRIPTION,
    url: "https://persept.ai/terms",
    type: "website",
  },
};

export default function Terms() {
  return (
    <div className="pl" id="top">
      <PlNav base="/" />

      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Terms</div>
          <h1 className="pl-h2-big">Terms of service</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            These terms govern your use of this website and, where you engage
            us, the Persept AI workforce service. Please read them. If you sign
            a separate engagement agreement with us, that agreement and these
            terms work together; where they conflict, the engagement agreement
            wins.
          </p>
          <div className="pl-legal-meta">Last updated {UPDATED}</div>
        </div>
      </header>

      <section className="pl-section pl-trust">
        <div className="pl-trust-inner">
          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">1. Who we are</h2>
            <p className="pl-trust-p">
              Persept Software Solutions is a software studio based in Dubai,
              United Arab Emirates (&ldquo;Persept&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;). &ldquo;You&rdquo; means the person or business
              using this website or our service. Registered address: [registered
              address, Dubai]. Trade licence: [trade licence no.].
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">2. Using this website</h2>
            <ul className="pl-trust-list">
              <li>
                Use the site lawfully and do not misuse it, interfere with it,
                or try to access parts you are not meant to.
              </li>
              <li>
                The content on this site is ours or our licensors&rsquo; and is
                protected by law. You may view it for your own use; you may not
                copy or reuse it commercially without our permission.
              </li>
              <li>
                Information on the site is provided for general guidance. We
                keep it accurate where we can, but it is not a promise or a
                professional recommendation.
              </li>
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">3. The AI workforce service</h2>
            <p className="pl-trust-p">
              Persept provides AI agents that find potential buyers, prepare
              outreach, write proposals and keep track of work for firms that
              quote every job. The agents are set up on your rate card and past
              work. They draft and prepare; they do not act on your behalf
              without you.
            </p>
            <p className="pl-trust-p">
              <strong>You keep the final say.</strong> Every email, price and
              proposal waits in your approvals inbox. Nothing is sent,
              published, merged or paid without a person approving it. Prices
              come only from your rate card. The agents make no phone calls.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">4. Your engagement</h2>
            <p className="pl-trust-p">
              The specific scope, the agents included, the price, the length of
              the engagement and any other commercial terms are set out in a
              separate engagement agreement or order. These terms are the
              general framework that sits behind it.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">5. Your responsibilities</h2>
            <ul className="pl-trust-list">
              <li>
                Give us accurate materials to work from: your rate card, past
                work, and the facts the agents need.
              </li>
              <li>
                Review what the agents prepare and approve only what you are
                happy to send. You are the sender of every message you approve.
              </li>
              <li>
                Make sure you are allowed to contact the businesses you target
                and that your outreach follows the marketing and data-protection
                laws that apply to you, including for contacts outside the UAE.
              </li>
              <li>
                Keep your own account access secure and let us know of any
                misuse.
              </li>
            </ul>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">
              6. Human approval and responsibility
            </h2>
            <p className="pl-trust-p">
              Because you approve every outbound action, you are responsible for
              what you approve and send. We are not responsible for content you
              choose to approve, edit or send, or for decisions you make on the
              basis of the agents&rsquo; output.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">7. AI output and limits</h2>
            <p className="pl-trust-p">
              The agents use AI models and can make mistakes or produce text
              that needs correcting. Always review drafts before you approve
              them. The agents are set up on your rate card and past work; they
              do not learn from your conversations.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">8. No guarantee of results</h2>
            <p className="pl-trust-p">
              We do not promise a particular number of leads, replies, proposals
              opened, jobs won or any revenue. Outcomes depend on your market,
              your rate card, your materials and what you choose to send.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">9. Your data</h2>
            <p className="pl-trust-p">
              You run on your own private instance, never shared with other
              clients. Your lists, materials and the data the agents build stay
              yours. We handle personal data as set out in our{" "}
              <Link href="/privacy" className="pl-amber">
                Privacy policy
              </Link>{" "}
              and{" "}
              <Link href="/trust" className="pl-amber">
                Trust page
              </Link>
              . You can export everything at any time, and we delete our copy
              within 30 days of the contract ending.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">10. Fees and payment</h2>
            <p className="pl-trust-p">
              Fees, the billing cycle and what is included are set out in your
              engagement agreement; AI usage is included in the fee. Unless
              stated otherwise, fees are payable in advance, and we may pause
              the service if an invoice is overdue after we have let you know.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">11. Third-party tools</h2>
            <p className="pl-trust-p">
              The service connects to tools you already use, such as Gmail or
              Outlook, WhatsApp, Google Sheets, and Zoho or HubSpot. Your use of
              those tools is subject to their own terms, and we are not
              responsible for them.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">12. Intellectual property</h2>
            <p className="pl-trust-p">
              You keep the rights to the materials you give us and to the
              proposals and content produced for you. We keep the rights to our
              software, the agents and the systems that run them. We grant you
              the right to use the service for the length of your engagement.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">13. Confidentiality</h2>
            <p className="pl-trust-p">
              Each of us will keep the other&rsquo;s non-public information
              confidential and use it only to run the engagement, except where
              we are required to disclose it by law.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">14. Warranties and disclaimers</h2>
            <p className="pl-trust-p">
              We will provide the service with reasonable care and skill. To the
              extent the law allows, the service is otherwise provided &ldquo;as
              is&rdquo;, without other warranties. Nothing in these terms limits
              any right you have that cannot be limited under UAE law.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">15. Liability</h2>
            <p className="pl-trust-p">
              To the extent the law allows, we are not liable for indirect or
              consequential loss, or for lost profits, lost business or lost
              data. Our total liability for any claim connected with the service
              is limited to the fees you paid us in the three months before the
              claim arose. These limits do not apply where the law does not
              allow them to.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">16. Indemnity</h2>
            <p className="pl-trust-p">
              You will cover us for claims that arise from the materials you
              give us, the contacts you target, or messages you approve and
              send, where those breach someone else&rsquo;s rights or the law.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">17. Term and ending the service</h2>
            <p className="pl-trust-p">
              Either of us may end the engagement as set out in the engagement
              agreement. On ending, you can export your data and we delete our
              copy within 30 days. Fees already due remain payable.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">18. Changes to these terms</h2>
            <p className="pl-trust-p">
              We may update these terms from time to time. We will post the new
              version here with an updated date; for current clients, material
              changes will be notified.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">19. Governing law</h2>
            <p className="pl-trust-p">
              These terms are governed by the laws of the United Arab Emirates
              as applied in the Emirate of Dubai, and the Dubai courts have
              jurisdiction, without affecting any mandatory consumer rights you
              may have.
            </p>
          </div>

          <div className="pl-trust-block">
            <h2 className="pl-trust-h2">20. Contact</h2>
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
