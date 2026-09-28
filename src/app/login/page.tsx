import Link from "next/link";
import { PerseptMark } from "@/components/ui/logo";
import { signInWithPassword } from "@/lib/workforce/auth-actions";
import "@/components/sections/landing.css";
import "./login.css";

const MESSAGES: Record<string, string> = {
  denied: "that address is not on the list",
  missing: "enter your email and password",
  invalid: "wrong email or password",
};

// Public sign-in — OUTSIDE /dashboard. Dark cinematic look. Email + password via
// Supabase (`signInWithPassword`); the ?error / ?next flow is kept.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="pl">
      <div className="login-wrap">
        <div className="login-glow" />
        <div className="login-grid" />
        <div className="login-inner">
          <Link href="/" className="login-brand">
            <PerseptMark size={22} />
            <span className="login-brand-word">Persept</span>
            <span className="login-brand-sub">/ workforce</span>
          </Link>

          <div className="login-card">
            <form action={signInWithPassword} className="login-form">
              <div>
                <h1 className="login-h1">sign in</h1>
                <p className="login-sub">
                  enter your email and password to open the dashboard.
                </p>
              </div>
              <input type="hidden" name="next" value={next ?? "/dashboard"} />
              <div className="login-fields">
                <label className="login-field">
                  <span className="login-label">email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="username"
                    // biome-ignore lint/a11y/noAutofocus: focusing the email on the sign-in screen is expected
                    autoFocus
                    placeholder="you@persept.ai"
                    className={`login-input${error ? " is-error" : ""}`}
                  />
                </label>
                <label className="login-field">
                  <span className="login-label">password</span>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`login-input${error ? " is-error" : ""}`}
                  />
                </label>
              </div>
              {error && (
                <p className="login-err">
                  {MESSAGES[error] ?? "something went wrong"}
                </p>
              )}
              <button className="login-btn" type="submit">
                sign in
              </button>
            </form>
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
