# Workforce dashboard (`/dashboard`)

The owner's command centre for the Persept AI workforce, living inside persept.ai behind a
Supabase Auth magic-link login. It reads the tables the bridge on the VPS fills (`agents`,
`events`, `tasks`, `approvals`, `instance`) and writes to one (`actions`), which the bridge
turns into messages and approval decisions for the agents. Source of truth for the design and
the tables: the Persept project docs 10 and 11.

## Files

```
src/proxy.ts                         session refresh + redirect signed-out visitors of /dashboard
src/app/auth/callback/route.ts       magic-link landing, exchanges the code for a session
src/app/login/page.tsx               email form (allowlisted addresses only); outside the dashboard layout on purpose
src/app/dashboard/layout.tsx         auth check, nav, sign out, 6s auto-refresh
src/app/dashboard/page.tsx           office: one card per agent
src/app/dashboard/activity/          feed + scheduled runs
src/app/dashboard/approvals/         the inbox: approve / reject with a note
src/app/dashboard/agents/[id]/       chat with an agent, its approvals and runs
src/app/dashboard/_components/       cards, nav links, auto-refresh
src/app/dashboard/workforce.css      styles scoped under .wf, using design-system.css tokens
src/lib/supabase/server.ts           auth client (anon + cookies) and admin client (service key)
src/lib/workforce/                   types, server actions, auth actions
```

## Environment (Vercel → persept.ai project → Environment Variables, and `.env.local` for dev)

```
NEXT_PUBLIC_SUPABASE_URL=https://<workforce-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon key of the WORKFORCE project (not GYST)
SUPABASE_SERVICE_KEY=eyJ...                 # service_role key, server-side only
DASHBOARD_ALLOWED_EMAILS=khizr.malik5@gmail.com   # comma-separated; only these can sign in
NEXT_PUBLIC_SITE_URL=https://persept.ai     # used for the magic-link return address
```

## Supabase Auth setup (once, in the workforce project)

Authentication → Providers → Email: enabled, "Confirm email" can stay on (magic link confirms).
Authentication → URL Configuration: Site URL `https://persept.ai`; Redirect URLs add
`https://persept.ai/auth/callback` and `http://localhost:3000/auth/callback`.

## Notes

The allowlist is checked before a magic link is sent, so unknown addresses never receive one,
and again on every write. The service key never reaches the browser; all reads and writes are
server components and server actions. The standalone copy in the workforce repo
(`persept-workforce/dashboard`) is the white-label template deployed per client; keep the two
in step when changing `lib/` logic.
