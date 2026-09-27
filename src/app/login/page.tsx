import Link from "next/link";
import { sendMagicLink } from "@/lib/workforce/auth-actions";
import "@/components/sections/landing.css";
import "./login.css";

const MESSAGES: Record<string, string> = {
  denied: "that address is not on the list",
  send: "could not send the link, try again in a minute",
  link: "that link has expired, request a new one",
  email: "that doesn’t look like an email address",
};

// Public magic-link sign-in — OUTSIDE /dashboard. Dark cinematic look; the
// server action `sendMagicLink` and the ?sent / ?error / ?next flow are kept.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; next?: string }>;
}) {
  const { sent, error, next } = await searchParams;

  return (
    <main className="pl">
      <div className="login-wrap">
        <div className="login-glow" />
        <div className="login-grid" />
        <div className="login-inner">
          <Link href="/" className="login-brand">
            <svg
              viewBox="0 0 143.44 126.56"
              width="24"
              height="21"
              aria-hidden="true"
            >
              <polygon
                points="26.85 126.06 100.34 .5 142.56 .5 68.83 126.06 26.85 126.06"
                fill="oklch(0.8 0.14 70)"
              />
              <polyline
                points="100.34 .5 1.02 .5 26.85 33.86 80.82 33.86"
                fill="none"
                stroke="#f4f1ec"
                strokeWidth="9"
              />
            </svg>
            <span className="login-brand-word">Persept</span>
            <span className="login-brand-sub">/ workforce</span>
          </Link>

          <div className="login-card">
            {sent ? (
              <>
                <div className="login-badge">✓</div>
                <h1 className="login-h1 sm">check your inbox</h1>
                <p className="login-sub">
                  if that address is on the list, a sign-in link is on its way.
                  it works once and expires in 15 minutes.
                </p>
                <Link href="/login" className="login-reset">
                  use a different email
                </Link>
              </>
            ) : (
              <form action={sendMagicLink} className="login-form">
                <div>
                  <h1 className="login-h1">sign in</h1>
                  <p className="login-sub">
                    we’ll email you a one-time link. no password.
                  </p>
                </div>
                <input type="hidden" name="next" value={next ?? "/dashboard"} />
                <input
                  type="email"
                  name="email"
                  required
                  // biome-ignore lint/a11y/noAutofocus: single-field sign-in; focusing the email is expected
                  autoFocus
                  placeholder="you@persept.ai"
                  className={`login-input${error ? " is-error" : ""}`}
                />
                {error && (
                  <p className="login-err">
                    {MESSAGES[error] ?? "something went wrong"}
                  </p>
                )}
                <button className="login-btn" type="submit">
                  send me a link
                </button>
              </form>
            )}
          </div>

          <div className="login-foot">
            <span>owner access only</span>
            <Link href="/">back to persept.ai</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
