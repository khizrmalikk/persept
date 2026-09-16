# persept.ai — project notes for Claude Code

Marketing site for Persept (a Dubai software studio) plus, under `/dashboard`, the owner's
command centre for the Persept AI workforce. Next 16 App Router, `src/` layout, Tailwind v4,
Biome for lint/format (`npm run lint`, `npm run format`). Fonts: Neue Haas (sans), Geist Mono.
Design tokens live in `src/app/design-system.css` and are documented in `DESIGN-SYSTEM.md`;
use them (`--paper`, `--ink`, `--ink-soft`, `--line`, `--accent`, `--radius-*`) rather than new colours.

## What the workforce is (context for any dashboard work)

Persept sells businesses an "AI workforce": named agents (Chief of Staff, Scout, Hunter, Fixer,
Muse, Scribe) that run repetitive parts of a company 24/7 on OpenClaw, hosted on a VPS. The line
the whole product stands on: **agents draft and prepare; a human presses send, merge, publish
and pay.** Anything touching money, access, or outbound communication produces an APPROVAL
REQUEST that the owner approves or rejects in this dashboard. Persept runs its own workforce on
this exact stack, and this dashboard is the showcase in the sales demo, so it should look like
a product, not an admin panel. Full docs live in the owner's Claude project (docs 07–11) and in
`docs/workforce-dashboard.md` here.

## Architecture (do not break)

```
OpenClaw gateway (VPS)  ⇄  bridge (VPS, Node)  ⇄  Supabase "workforce" project  ⇄  this app
```

- The **bridge** writes `agents`, `events`, `tasks`, `approvals`, `instance`, `raw_events`
  and polls **`actions`** every 5 s. This app only reads the first five and only writes
  `actions` (and marks `approvals` decided). Column names and the `actions.kind` values
  (`message`, `approve`, `reject`) are the contract with the bridge. Adding columns is fine;
  renaming or repurposing is not. Schema: see the workforce repo `bridge/schema.sql`.
- All reads use the **service key server-side** (`supabaseAdmin()` in `src/lib/supabase/server.ts`).
  Never expose it to the client; never create a browser Supabase client with it.
- All writes go through the server actions in `src/lib/workforce/actions.ts`, each of which
  calls `guard()` to re-check the signed-in user against `DASHBOARD_ALLOWED_EMAILS`. Keep that.
- Auth is Supabase magic link with an email allowlist: `src/proxy.ts` (Next 16 request gate)
  redirects signed-out visitors of `/dashboard/*` to `/login`; `/auth/callback` exchanges the
  code. `/login` must stay **outside** `src/app/dashboard/` or the layout's redirect loops.
- The dashboard styles are scoped under `.wf` in `src/app/dashboard/workforce.css` so nothing
  leaks into the marketing pages. Tailwind classes are welcome; keep to the tokens.
- Pages are server components re-rendered every 6 s by `_components/AutoRefresh.tsx`.
  Supabase Realtime is the intended replacement; it needs the anon key plus RLS policies on the
  five read tables (currently RLS on, no policies, so only the service key can read).

## Env (never commit; see `docs/workforce-dashboard.md`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`,
`DASHBOARD_ALLOWED_EMAILS`, `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally,
`https://www.persept.ai` in Vercel). The Supabase project is the **workforce** one, not GYST's.

## Priorities and taste

- The owner is a solo founder two weeks from a sales demo. Ship small, visible improvements;
  do not start large refactors, add state libraries, or introduce a component framework.
- Good targets: inline-edit the draft on an approval card before approving (send the edited
  text as the `note`; the bridge passes it to the agent); Supabase Realtime instead of the
  timer; a Metrics page once `tasks` has a week of rows; empty states that explain what will
  appear. Not now: a 3D view, multi-user roles, per-viewer settings.
- Copy on the dashboard is lowercase, short, and plain ("waiting for you", "nothing in
  progress"). No exclamation marks, no emojis except each agent's own.
- A standalone copy of this dashboard exists in the workforce repo (`persept-workforce/dashboard`)
  as the white-label template for clients. Don't try to keep it in sync from here; changes are
  ported once when the first client signs.

## Things to leave alone unless asked

`src/proxy.ts`, `src/app/auth/`, `src/app/login/`, `src/lib/supabase/server.ts`, the
marketing pages under `src/app/(everything not dashboard)`, `package-lock.json` vs
`pnpm-lock.yaml` (both exist; npm is what has been used lately).
