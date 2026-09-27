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

# Local preview only: skip the /dashboard auth gate so you can work without signing
# in. Honoured by proxy.ts + the dashboard layout ONLY when NODE_ENV != production
# AND this is set to 1. Put it in .env.local (gitignored); NEVER set it in Vercel.
DASHBOARD_AUTH_BYPASS=                       # unset/0 = enforce auth (default); 1 = bypass in dev

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

## Hunter's outreach workspace

Hunter's agent page (`/dashboard/agents/hunter`) is two tabs — **outreach** (a CRM:
campaigns, the prospect pipeline, a threaded conversation log, an owner "send as me"
box, pending/held approvals, and hand-offs) and **chat** (the same agent chat every
other agent has). Code: `src/lib/workforce/outreach.ts` (types, defensive reads, the
outbound-format helpers) and the panels under `src/app/dashboard/_components/panels/`
(`CampaignsPanel`, `CampaignEditor`, `Conversations`, `Compose`, `Handoffs`,
`OutreachExchange`) plus `HunterWorkspace.tsx` (the tabs). The editor route is
`src/app/dashboard/agents/hunter/campaigns/[id]/` (`[id]` is a uuid or `new`).

### Tables (contract with the bridge)

Three new tables extend the five read tables. **Column names and enum values are the
contract** — adding columns is fine; renaming/repurposing is not.

- **`campaigns`** — DASHBOARD-OWNED. The dashboard creates and edits rows directly
  (via `saveCampaign`); the bridge mirrors each into Hunter's workspace as
  `campaigns/<slug>.md` within a minute. Columns: `id uuid`, `agent_id`, `name`,
  `status` (`active|paused|archived`), `goal`, `audience`, `offer`, `description`,
  `assets jsonb` (`[{type: video|image|file|link, title, url, use}]`), `rules jsonb`
  (`{channels:[…], daily_cap:n, follow_up_days:[3,7]}`), `created_at`, `updated_at`.
- **`messages`** — BRIDGE-OWNED (the dashboard only reads it). The outreach log.
  Columns: `id`, `ts`, `agent_id`, `campaign_id`, `direction` (`out|in`), `channel`,
  `kind` (`first_touch|follow_up|reply|inbound`), `company`, `contact`, `subject`,
  `body`, `thread_id`, `status` (`sent|approved_manual|received|held`), `approval_id`,
  `action_id`.
- **`handoffs`** — BRIDGE-created, DASHBOARD-WRITABLE for status only. The dashboard
  patches `status` (`open→done|dropped`) via `handoffDoneFromForm`/`handoffDropFromForm`.
  Columns: `id`, `ts`, `agent_id`, `company`, `contact`, `channel`, `why`,
  `next`, `status` (`open|done|dropped`).
- **`backlog`** — DASHBOARD-WRITABLE (like `handoffs`). The dashboard creates, edits,
  completes and drops rows directly (`addBacklogItem`, `updateBacklogItem`,
  `setBacklogStatus` — all behind `guard()`); agents also change rows through the
  bridge (BACKLOG blocks in their replies), so rows can appear/change without the
  dashboard — poll as the rest of the page does. `events` gains `kind = 'backlog'`
  rows ("chief backlog add: …"). Columns: `id uuid`, `title`, `detail`, `owner text`
  (`owner|chief|hunter|scout|…`), `due date`, `priority` (`high|normal|low`),
  `status` (`open|done|dropped`), `source text`, `created_at`, `updated_at`, `done_at`.
- **`leads`** — BRIDGE-created (Scout's weekly prospecting run), DASHBOARD-WRITABLE
  for `status` only. "add to hunter" (`acceptLead`) sends Hunter an
  `add prospect: <company>, <contact>, <channel>, <website>, <angle> (campaign: <slug
  or first active campaign>) — from scout: <evidence> <source_url>` command through
  the existing `sendAgentCommand` path **and** sets the lead's `status` to
  `sent_to_hunter`; "dismiss" (`dismissLead`) sets `dismissed`. Both behind `guard()`.
  `events` gains `kind = 'lead'` rows ("scout found a lead: <company> — <angle>").
  Columns: `id`, `ts`, `agent_id`, `company`, `website`, `contact`, `channel`, `size`,
  `angle`, `evidence`, `source_url`, `campaign text` (slug), `status`
  (`suggested|sent_to_hunter|dismissed`), `raw`.
- **`proposals`** — BRIDGE-owned. The bridge upserts a row whenever Scribe writes/edits
  a file under `proposals/` in its workspace (markdown body stored **without** front
  matter). The dashboard only updates `status`, and the view fields. `setProposalStatus`
  (`accepted|declined`) and `sendProposalViaHunter` (sets `sent_at` + `status = sent`,
  and tells Hunter to email the public link) are behind `guard()`; approving an approval
  whose action starts with **"send proposal to <company>"** flips the most-recent matching
  proposal to `approved` (inside `decide()`). The **public** page `/p/<token>`
  (outside auth, outside the dashboard layout — the `proxy.ts` matcher is not widened)
  bumps `view_count`, sets `first_viewed_at`/`last_viewed_at`, and if `status = sent`
  sets it to `viewed`; it skips bots/link-preview fetchers. `events` gains
  `kind = 'proposal'`. A `draft` is never public; `approved|sent|viewed|accepted|declined`
  are. Columns: `id`, `agent_id`, `path`, `token unique`, `title`, `company`, `contact`,
  `prepared_by`, `date`, `valid_until`, `markdown`, `status`
  (`draft|approved|sent|viewed|accepted|declined`), `view_count`, `first_viewed_at`,
  `last_viewed_at`, `sent_at`, `created_at`, `updated_at`.
- **`posts`** — BRIDGE-owned (Muse's marketing/content). One row per published post
  or approved-for-manual post. The dashboard may update `status` to `posted_by_owner`
  and write `stats`; both also send Muse a `message` action (`posted <slug>`,
  `stats <slug>: …`) so it learns what worked. Muse's approvals use the outbound
  format with `channel: linkedin-post` or `instagram-post`, an optional `image:`
  (a campaign-assets URL) and `comment:` (a link posted as the first comment) header,
  then the post text. **Approving a `linkedin-post` publishes it through the bridge**
  (a `published` row with `url`); **approving an `instagram-post` records it as
  `approved_manual`** for the owner to post by hand, then "posted" flips it to
  `posted_by_owner`. A draft whose posts/*.md front matter has an `image_brief` but no
  image shows an **upload** control that stores the file in the `campaign-assets`
  bucket under `posts/<slug>/` and sends Muse `image for <slug>: <url>` (Muse re-raises
  the approval with the image). `events` gains `kind = 'post'` (the home feed shows a
  "post" chip and lifts the published link out of the summary as a `link →`). Columns:
  `id`, `ts`, `agent_id`, `channel` (`linkedin|instagram`), `text`, `image_url`,
  `status` (`published|approved_manual|posted_by_owner`), `external_id`, `url`,
  `approval_id`, `action_id`, `published_at`, `stats jsonb`
  (`impressions|reactions|comments|replies`).
  These are the tables besides `actions`/`campaigns` the dashboard writes directly.

`approvals.status` also takes `sent` and `held`; `actions.kind` gains **`send`** (an
owner-written or owner-edited message the bridge sends as-is).

The bridge also mirrors two read-only files into `agent_files` for `agent_id = 'chief'`,
refreshed every few minutes: **`STATE.md`** (waiting on the owner, agents, outreach
last 24h, pipeline, campaigns, open backlog) and **`BACKLOG.md`**. Chief's page renders
STATE.md as its live-state view and flags it stale after 15 minutes.

STATE.md also carries a **`## Health (discrepancies the system can see)`** section.
`parseHealth` (in `backlog.ts`) pulls its lines (all-clear sentinels like "all clear" /
"nothing" count as empty). They render as the **health strip** on Chief's page (above
the state panel) and on the home under the roster: a warning dot per line, "all clear"
in muted text when empty. Known phrases deep-link — "replies with no response" →
`/dashboard/agents/hunter/conversations?filter=awaiting`, "approvals waiting" →
`/dashboard/approvals`, "backlog items past due" → the backlog panel (`#wf-backlog`).

Chief writes **weekly reviews** to `improvements/YYYY-MM-DD.md` in its workspace,
mirrored into `agent_files` under `improvements/`. Chief's page shows a **weekly review**
panel: the newest review rendered as markdown, a date selector for older ones, and a
"run the review now" button (sends Chief `write the weekly workforce review now, exactly
as in AGENTS.md` via `sendAgentCommand`). Each review's proposed changes are also added
by Chief to the `backlog` table with titles starting **`workforce: `**; those open items
appear under the review as a checklist with the normal done/drop actions (accept / discard
a proposal in one click).

### Outbound message format

Owner sends and outbound approval drafts use this exact format (the `text` of a `send`
action, and what the bridge parses). `parseOutbound`/`buildOutbound` in `outreach.ts`:

```
channel: email
to: Name <address>
subject: ...
thread: <optional, replies only>
campaign: <slug>

<body>
```

An approval whose `draft` parses as this format renders as an outbound card (to /
subject / channel header + body) with **send** (approve), **edit and send**
(`kind: 'send'` carrying the `approval_id` so the bridge closes it), and **reject**.
Non-email channels read "approve (I'll send by hand)"; `held` shows a "release".

### Campaign assets storage

Assets live in a **public** Supabase Storage bucket named **`campaign-assets`**.
Create it once from the Supabase dashboard (Storage → New bucket → public); the app
does not create buckets. Uploads (`uploadCampaignAsset`) stream to
`campaign-assets/<campaignId>/<filename>` (25 MB cap; images, pdf, mp4, docx only) and
the public URL is stored in `assets[].url`. Videos render as embedded players
(YouTube/Vimeo iframe or `<video>` for mp4), images as thumbnails, files/links as links.

The campaign **slug** rule (shared with the bridge): lowercase, non-alphanumerics → `-`,
trimmed. A prospect's `campaign` column in `PROSPECTS.md` holds this slug.

## Notes

The allowlist is checked before a magic link is sent, so unknown addresses never receive one,
and again on every write. The service key never reaches the browser; all reads and writes are
server components and server actions. The standalone copy in the workforce repo
(`persept-workforce/dashboard`) is the white-label template deployed per client; keep the two
in step when changing `lib/` logic.
