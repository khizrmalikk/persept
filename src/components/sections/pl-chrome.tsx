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
        <a href={`${base}#roles`}>Roles</a>
        <a href={`${base}#how`}>How it runs</a>
        <a href={`${base}#proof`}>Proof</a>
        <a href={`${base}#products`}>GYST</a>
      </div>
      <div className="pl-nav-right">
        <Link href="/login">Sign in</Link>
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
        <span>© 2026 Persept · Dubai</span>
        <div className="pl-footer-links">
          <a href="mailto:khizr@persept.ai">khizr@persept.ai</a>
          <a
            href="https://www.linkedin.com/company/persept"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <Link href="/login">Client sign in</Link>
        </div>
      </div>
    </footer>
  );
}
