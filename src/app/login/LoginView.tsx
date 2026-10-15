"use client";

import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Persona } from "@/app/dashboard/_components/Persona";
import { PerseptMark } from "@/components/ui/logo";
import {
  requestPasswordReset,
  signInWithPassword,
} from "@/lib/workforce/auth-actions";

// Public sign-in — dark v12 (see LOGIN.md). A live clock, the "wake the team"
// avatar button and email + password posted straight to the existing server
// actions. Auth logic lives in those actions; this view is presentation + the
// cosmetic signing-in animation (useFormStatus.pending drives it; the action's
// redirect to /dashboard ends it, where the OS plays its own boot screen).

const TEAM = ["chief", "scout", "hunter", "scribe", "muse", "fixer"] as const;
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const LIT_MS = 170;

// error flag → LOGIN.md message. denied/invalid share the same copy so an
// off-list address is never revealed.
const ERROR_MESSAGE: Record<string, string> = {
  missing: "enter your email and password.",
  denied: "that email and password don’t match.",
  invalid: "that email and password don’t match.",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

// 24h HH:MM, updated every 15s. Starts null so SSR and first client paint agree
// (no hydration mismatch), then fills in on mount.
function useWallClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const Arrow = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#0c0c0c"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// The sign-in button + caption. Lives inside the <form>, so useFormStatus() here
// reports that form's pending state and drives the avatar-lighting sequence.
function WakeButton({
  hasError,
  reduced,
}: {
  hasError: boolean;
  reduced: boolean;
}) {
  const { pending } = useFormStatus();
  const [lit, setLit] = useState(0);

  // While the request is in flight, light the next avatar every 170ms. The
  // action redirects on success, which unmounts this view and ends the loop; if
  // it comes back with ?error, `pending` drops and we reset.
  useEffect(() => {
    if (!pending) {
      setLit(0);
      return;
    }
    if (reduced) {
      setLit(6);
      return;
    }
    setLit(1);
    const id = setInterval(() => {
      setLit((n) => (n >= 6 ? 6 : n + 1));
    }, LIT_MS);
    return () => clearInterval(id);
  }, [pending, reduced]);

  const label = pending ? `${lit} of 6 in` : hasError ? "try again" : "sign in";
  const caption = pending
    ? TEAM.slice(0, lit).join(" · ")
    : hasError
      ? (ERROR_MESSAGE.invalid ?? "")
      : "your team clocks in when you do";

  return (
    <>
      <button
        type="submit"
        className={`login-wake${hasError ? " is-error" : ""}`}
        disabled={pending}
      >
        <span className="login-team">
          {TEAM.map((k, i) => {
            const isLit = pending && i < lit;
            return (
              <span
                key={k}
                className={`login-ava${isLit ? " is-lit" : ""}`}
                style={{ transitionDelay: isLit ? "0ms" : `${i * 45}ms` }}
              >
                <Persona
                  agent={k}
                  size={34}
                  status={isLit ? "working" : "idle"}
                  working={isLit}
                />
              </span>
            );
          })}
        </span>
        <span className="login-wake-label">{label}</span>
        <span className="login-wake-arrow">
          {pending ? <span className="login-spinner" /> : <Arrow />}
        </span>
      </button>
      <output className={`login-caption${hasError ? " is-error" : ""}`}>
        {caption}
      </output>
    </>
  );
}

function SignInForm({
  error,
  next,
  reduced,
  onForgot,
}: {
  error: string | null;
  next: string;
  reduced: boolean;
  onForgot: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  // Editing either field clears the error state locally (the server flag stays
  // in the URL, but the red borders / shake / "try again" label clear).
  const [cleared, setCleared] = useState(false);
  const hasError = !!error && !cleared;
  // Shake once when a fresh error arrives (keyed on the flag so a repeat error
  // re-triggers it). Respect reduced motion.
  const shake = hasError && !reduced;
  // "missing" → both fields red; a mismatch (denied/invalid) reddens the password
  // (matches the prototype; the server never reveals which field was wrong).
  const emailErr = hasError && error === "missing";
  const pwErr = hasError;

  return (
    <form
      action={signInWithPassword}
      className={`login-form${shake ? " is-shaking" : ""}`}
      // re-mount the shake animation if the same error flag comes back twice
      key={error ?? "ok"}
    >
      <input type="hidden" name="next" value={next} />
      <input
        type="email"
        name="email"
        autoComplete="username"
        aria-label="email"
        placeholder="email"
        className={`login-input${emailErr ? " is-error" : ""}`}
        onChange={() => setCleared(true)}
      />
      <div className="login-pw">
        <input
          type={showPw ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          aria-label="password"
          placeholder="password"
          className={`login-input${pwErr ? " is-error" : ""}`}
          onChange={() => setCleared(true)}
        />
        <button
          type="button"
          className="login-show"
          aria-label={showPw ? "hide password" : "show password"}
          onClick={() => setShowPw((v) => !v)}
        >
          {showPw ? "hide" : "show"}
        </button>
      </div>
      <button type="button" className="login-forgot" onClick={onForgot}>
        forgot password?
      </button>
      <WakeButton hasError={hasError} reduced={reduced} />
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  return (
    <form action={requestPasswordReset} className="login-panel">
      <div className="login-panel-title">reset password</div>
      <div className="login-panel-body" style={{ marginBottom: 8 }}>
        enter your email and we’ll send a link to set a new one.
      </div>
      <input
        type="email"
        name="email"
        autoComplete="username"
        aria-label="email"
        placeholder="email"
        className="login-input"
      />
      <button type="submit" className="login-cta">
        send reset link
      </button>
      <button type="button" className="login-back" onClick={onBack}>
        ← back to sign in
      </button>
    </form>
  );
}

function ResetSent({ email }: { email: string }) {
  return (
    <div className="login-panel">
      <div className="login-tick">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="oklch(0.75 0.15 150)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div className="login-panel-title">check your inbox</div>
      <div className="login-panel-body">
        if <span className="login-strong">{email}</span> is on the list, a reset
        link is on its way. it works once and expires in 15 minutes.
      </div>
      <a className="login-cta-outline" href="/login">
        back to sign in
      </a>
    </div>
  );
}

export function LoginView({
  working,
  error,
  next,
  sentTo,
}: {
  working: number;
  error: string | null;
  next: string;
  sentTo: string | null;
}) {
  const reduced = usePrefersReducedMotion();
  const now = useWallClock();
  const [view, setView] = useState<"signin" | "forgot">("signin");
  // stable across SSR + hydration (useId) so the grain filter ref doesn't mismatch
  const grainId = `login-grain-${useId().replace(/:/g, "")}`;

  const clock = now ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}` : "";
  const dateStr = now
    ? `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`
    : "";

  return (
    <div className="login">
      <a className="login-brand" href="/" aria-label="persept home">
        <PerseptMark size={20} />
        <span className="login-brand-word">persept</span>
      </a>
      <div className="login-owner">owner access only</div>

      <main className="login-main">
        <div className="login-date">{dateStr}</div>
        <div className="login-clock">{clock}</div>
        <div className="login-status">
          <span className="login-status-dot" />
          {working} of 6 agents working
        </div>

        <div className="login-block">
          {sentTo !== null ? (
            <ResetSent email={sentTo} />
          ) : view === "forgot" ? (
            <ForgotForm onBack={() => setView("signin")} />
          ) : (
            <SignInForm
              error={error}
              next={next}
              reduced={reduced}
              onForgot={() => setView("forgot")}
            />
          )}
        </div>
      </main>

      <a className="login-foot" href="/">
        back to persept.ai
      </a>

      {/* grain overlay */}
      <svg className="login-grain" aria-hidden="true">
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
    </div>
  );
}
