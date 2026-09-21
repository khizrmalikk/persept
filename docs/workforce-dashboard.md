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

# Call mode text-to-speech (optional; unset → the browser's speechSynthesis is used).
# The key is read only by /api/workforce/tts and never reaches the client.
ELEVENLABS_API_KEY=                         # ElevenLabs API key; leave blank to use browser voice
ELEVENLABS_VOICE_DEFAULT=                    # fallback voice id for any agent
ELEVENLABS_VOICE_CHIEF=                      # per-agent voice ids (ELEVENLABS_VOICE_<AGENTID uppercased>)
ELEVENLABS_VOICE_SCOUT=
ELEVENLABS_VOICE_HUNTER=
ELEVENLABS_MODEL=eleven_turbo_v2_5           # A/B: eleven_flash_v2_5 (faster) / eleven_multilingual_v2
ELEVENLABS_SETTINGS_CHIEF=                   # optional per-agent JSON merged over defaults, e.g. {"style":0.2}

# Live call channel on the VPS bridge (optional). When set, call mode streams the
# reply and speaks it sentence-by-sentence; unset → the slower Supabase reply path.
# The URL DIFFERS by environment because Vercel cannot reach the Tailscale-only
# host; the bridge is also exposed via Tailscale Funnel on :8443 for production:
#   local dev (.env.local):  BRIDGE_CALL_URL=https://persept-vps.tail6e1d89.ts.net/call
#   Vercel (prod/preview):   BRIDGE_CALL_URL=https://persept-vps.tail6e1d89.ts.net:8443/call
# BRIDGE_CALL_TOKEN is the SAME bearer token in both environments.
BRIDGE_CALL_URL=                             # see the two forms above (env-dependent)
BRIDGE_CALL_TOKEN=                           # bearer token; server-side only, never exposed
```

## Call mode speech-to-text (Scribe)

Call mode transcribes with **ElevenLabs Scribe v2 Realtime** (`@elevenlabs/react`'s
`useScribe`), not the browser's Web Speech API — it has echo cancellation + noise
suppression so the agent's own voice doesn't leak into the transcript, and lower
latency. `GET /api/workforce/call/scribe-token` mints a single-use realtime token
server-side (from `ELEVENLABS_API_KEY`; ~15 min TTL) so the browser connects to
ElevenLabs **directly** — the key never reaches the client. If the key is unset (route
returns 501) or Scribe fails to connect, the call falls back to the browser recogniser
(the card shows `hearing: browser` vs `hearing: scribe`).

Note the change to the privacy rule: with Scribe, mic audio **does leave the browser —
but only to ElevenLabs** (never to our server, which only mints the token). Previously
call-mode audio never left the browser.

**Restart the dev server after editing `.env.local`.** Next.js reads env vars at process
start, so a running `pnpm dev` will keep using the old values — if you add
`ELEVENLABS_API_KEY` while the server is up, call mode will fall back to the browser
voice ("voice: browser (no key)") until you restart.

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
