import Link from "next/link";
// the official brand mark lives in one place; re-exported for existing importers
import { PerseptMark } from "@/components/ui/logo";

export { PerseptMark };

// Shared chrome for the cinematic dark pages (landing + contact): the logo mark,
// the sticky nav and the footer. `base` is "" on the landing (so the nav anchors
// are same-page: #roles) and "/" on other pages (so they jump home: /#roles).

export const BOOKING_HREF =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  "https://calendly.com/khizr-persept/ai-workforce-consultation";
export const BOOKING_EXTERNAL = /^https?:/i.test(BOOKING_HREF);
export const bookAttrs = BOOKING_EXTERNAL
  ? { target: "_blank", rel: "noreferrer" as const }
  : {};

// WhatsApp: set NEXT_PUBLIC_WHATSAPP_URL to the real wa.me link before launch.
// The default is an obvious placeholder number the founder replaces.
export const WHATSAPP_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/971500000000";
export const LINKEDIN_HREF =
  process.env.NEXT_PUBLIC_LINKEDIN_URL ||
  "https://www.linkedin.com/company/persept";

export function PlNav({ base = "" }: { base?: string }) {
  return (
    <nav className="pl-nav">
      <Link
        href={base || "#top"}
        className="pl-brand"
        aria-label="Persept home"
      >
        <PerseptMark />
        <span>Persept</span>
      </Link>
      <div className="pl-nav-links pl-nav-hide">
        <a href={`${base}#how`}>How it works</a>
        <a href={`${base}#who`}>Who it&rsquo;s for</a>
        <a href={`${base}#pricing`}>Pricing</a>
        <a href={`${base}#faq`}>FAQ</a>
        <Link href="/trust">Trust</Link>
      </div>
      <div className="pl-nav-right">
        <Link href="/login" className="pl-nav-signin">
          Sign in
        </Link>
        <a
          href={WHATSAPP_HREF}
          className="pl-wa"
          target="_blank"
          rel="noreferrer"
        >
          <span className="pl-wa-dot" />
          WhatsApp
        </a>
        <a href={BOOKING_HREF} className="pl-book" {...bookAttrs}>
          Book a call
        </a>
      </div>
    </nav>
  );
}

export function PlFooter() {
  return (
    <footer className="pl-footer">
      <div className="pl-footer-inner">
        <div className="pl-footer-top">
          <span>© 2026 Persept Software Solutions · Dubai</span>
          <div className="pl-footer-links">
            <a href="mailto:khizr@persept.ai">khizr@persept.ai</a>
            <a href={LINKEDIN_HREF} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/trust">Trust</Link>
            <Link href="/login">Client sign in</Link>
          </div>
        </div>
        <div className="pl-footer-also">
          <span>Also from Persept:</span>
          <a href="https://startgyst.com" target="_blank" rel="noreferrer">
            GYST →
          </a>
        </div>
      </div>
    </footer>
  );
}
