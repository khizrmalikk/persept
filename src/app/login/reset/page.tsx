"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PerseptMark } from "@/components/ui/logo";
import "../login.css";

// Landing page for the reset link in the password-reset email. The link carries
// a Supabase recovery `code`; we exchange it for a short-lived session on mount,
// then let the owner set a new password with supabase.auth.updateUser(). This is
// purely client-side (browser Supabase client, anon key) — the allowlist and the
// server actions are untouched. Dark v12 styling, reuses login.css.

type Phase = "verifying" | "ready" | "invalid" | "done";

export default function ResetPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const grainId = `reset-grain-${useId().replace(/:/g, "")}`;

  // one browser client for the page
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(
    null,
  );
  const getClient = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
    }
    return supabaseRef.current;
  }, []);

  // exchange the recovery code for a session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { error } = await getClient().auth.exchangeCodeForSession(
          window.location.href,
        );
        if (cancelled) return;
        setPhase(error ? "invalid" : "ready");
      } catch {
        if (!cancelled) setPhase("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getClient]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);
    if (pw.length < 8) {
      setErr("use at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setErr("those passwords don’t match.");
      return;
    }
    setSaving(true);
    const { error } = await getClient().auth.updateUser({ password: pw });
    if (error) {
      setSaving(false);
      setErr("couldn’t update your password. the link may have expired.");
      return;
    }
    setPhase("done");
    // give the confirmation a beat, then send them to sign in
    setTimeout(() => router.replace("/login"), 1400);
  }

  return (
    <div className="login">
      <Link className="login-brand" href="/" aria-label="persept home">
        <PerseptMark size={20} />
        <span className="login-brand-word">persept</span>
      </Link>
      <div className="login-owner">owner access only</div>

      <main className="login-main">
        {phase === "verifying" && (
          <div className="login-panel">
            <div className="login-panel-title">one moment</div>
            <div className="login-panel-body">checking your reset link…</div>
          </div>
        )}

        {phase === "invalid" && (
          <div className="login-panel">
            <div className="login-panel-title">link expired</div>
            <div className="login-panel-body">
              this reset link is invalid or has expired. request a new one from
              the sign-in page.
            </div>
            <Link className="login-cta-outline" href="/login">
              back to sign in
            </Link>
          </div>
        )}

        {phase === "done" && (
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
            <div className="login-panel-title">password updated</div>
            <div className="login-panel-body">
              sign in with your new password.
            </div>
            <Link className="login-cta-outline" href="/login">
              sign in
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <form className="login-panel" onSubmit={onSubmit}>
            <div className="login-panel-title">set a new password</div>
            <div className="login-panel-body" style={{ marginBottom: 8 }}>
              pick something at least 8 characters long.
            </div>
            <div className="login-pw">
              <input
                type={show ? "text" : "password"}
                autoComplete="new-password"
                aria-label="new password"
                placeholder="new password"
                className={`login-input${err ? " is-error" : ""}`}
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr(null);
                }}
                disabled={saving}
              />
              <button
                type="button"
                className="login-show"
                aria-label={show ? "hide password" : "show password"}
                onClick={() => setShow((v) => !v)}
              >
                {show ? "hide" : "show"}
              </button>
            </div>
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              aria-label="confirm new password"
              placeholder="confirm new password"
              className={`login-input${err ? " is-error" : ""}`}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErr(null);
              }}
              disabled={saving}
            />
            {err && <div className="login-panel-note">{err}</div>}
            <button type="submit" className="login-cta" disabled={saving}>
              {saving ? "saving…" : "set password"}
            </button>
            <Link className="login-back" href="/login">
              ← back to sign in
            </Link>
          </form>
        )}
      </main>

      <Link className="login-foot" href="/">
        back to persept.ai
      </Link>

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
