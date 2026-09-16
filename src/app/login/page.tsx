import { sendMagicLink } from "@/lib/workforce/auth-actions";

const MESSAGES: Record<string, string> = {
  denied: "that address is not on the list",
  send: "could not send the link, try again in a minute",
  link: "that link has expired, request a new one",
  email: "enter your email",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; next?: string }> }) {
  const { sent, error, next } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="w-full max-w-sm">
        <p className="text-[11px] tracking-[0.12em] uppercase mb-3" style={{ fontFamily: "var(--font-geist-mono)", color: "var(--ink-faint)" }}>persept / workforce</p>
        <h1 className="text-3xl font-medium mb-6">sign in</h1>
        {sent ? (
          <p style={{ color: "var(--ink-soft)" }}>check your inbox. the link signs you in on this device.</p>
        ) : (
          <form action={sendMagicLink} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next ?? "/dashboard"} />
            <input
              type="email" name="email" required autoFocus placeholder="you@persept.ai"
              className="w-full rounded-[10px] px-3 py-2.5 outline-none"
              style={{ border: "1px solid var(--line-strong)", background: "#fff", color: "var(--ink)" }}
            />
            <button className="btn" type="submit">send me a link</button>
            {error && <p className="text-sm" style={{ color: "var(--accent-ink)" }}>{MESSAGES[error] ?? "something went wrong"}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
