# Page specs

For each page: **purpose**, **must show**, **data**, **interactions**, and
**redesign notes**. Pair each with its screenshot in `screenshots/`.

Legend: *must show* = has to survive a redesign; *data* = where the content
comes from; *interaction* = what the owner can do.

---

# 1 · Marketing site

## `/` — Landing  ·  `screenshots/01-marketing/landing.png`
**Purpose:** Get a small-business owner to book a 15-minute call. **Already
redesigned** — this is the reference look (dark `#0e0d0c`, amber accent, Archivo
headlines) and does not need redoing; it is here so the dashboard can be made to
feel like the same product.
- **Must show:** hero with a **live agent-office simulation** (six agents working,
  drafts landing in an approvals inbox, Approve/Edit); "what it is / is not";
  the six roles; a "Persept runs on Persept" proof section; a light "how it runs"
  band; two ways to start (pilot / consultation); about; the GYST card; final CTA.
- **Interaction:** the office sim is live (progress bars, approvals appear, Approve).

## `/contact` — Book a call / send a note  ·  `contact.png`
**Purpose:** One job — start a conversation. **Already redesigned** to match the landing.
- **Must show:** a "direct line" panel (email, location, availability, copy-email,
  book-a-call) and a "note" form (name, email, company, interest, message).
- **Interaction:** the form opens a pre-filled email (mailto); success state.

## `/projects`, `/projects/gyst`, `/about` — old light theme  ·  `projects.png`, `projects-gyst.png`, `about.png`
**Purpose:** Supporting marketing pages. Still on the **old light** design system
(warm paper, clay accent). If the redesign extends to marketing, these should be
brought onto the new dark look; otherwise leave them.

## `/login` — Sign in  ·  `login.png`
**Purpose:** Magic-link email sign-in to the dashboard (email allowlist).
- **Must show:** an email field + "send link", minimal and trustworthy.
- **Do not** move it inside `/dashboard` (the auth gate would loop).

---

# 2 · Dashboard core

## `/dashboard` — Office home  ·  `screenshots/02-dashboard/dashboard-home-office.png`
**Purpose:** The at-a-glance command deck + the demo centrepiece. A living picture
of the whole workforce on one screen.
- **Must show:**
  - **Centre:** a top-down **pixel office** with six rooms (research, dev &
    debugging, marketing studio, outreach & sales, chief of staff, proposals &
    clients), an agent avatar per deployed room, sub-agents wandering, a speech
    bubble when an agent is waiting on you, a glow when active.
  - **Top row:** status cards (online, working, waiting, done today).
  - **Left rail:** running work (tasks + sub-agents), a compact backlog, the roster
    (all six agents, deployed or "soon"), and Chief's **health** strip.
  - **Right rail:** the pending-approvals queue (approve/reject inline), an "urgent"
    list (risky approvals, errors, hand-offs), and a "pulse".
  - **Bottom:** a live activity feed (latest events, with a "post" chip + link for posts).
- **Data:** `agents`, `events`, `tasks`, `approvals`, sub-agents, `backlog`, and
  Chief's `STATE.md` health section. Empty states are honest ("nothing running",
  "backlog is clear").
- **Interaction:** click a room / roster chip → that agent's page; approve/reject
  from the queue; click a feed row → the agent.
- **Redesign notes:** this is fixed-height ("everything on one screen"). The pixel
  office is a signature; keep the six-room idea even if the art changes. It should
  read as a *product hero*, not an admin dashboard.

## `/dashboard/approvals` — Approvals inbox  ·  `approvals.png`
**Purpose:** **The core of the product** — "waiting for you". Everything the agents
have drafted that needs a human before it goes.
- **Must show:** a queue of approval cards. Each: the agent (emoji + name), the
  action, a risk/severity pill + reason, the drafted content. Two shapes:
  - **Generic** — approve / reject with an optional note to the agent.
  - **Outbound** (email/DM/post) — parsed to/subject/channel header + body, with
    **send** / **edit-and-send** (owner tweaks the draft) / **reject**; "release"
    for held items (daily cap).
  - A "decided" history below.
- **Data:** `approvals`; decisions write to `actions` (the bridge acts on them).
- **Redesign notes:** this page carries the whole promise ("a human presses send").
  Make the drafted content and the two buttons unmistakable. Editing before
  approving must feel first-class.

## `/dashboard/activity` — Activity  ·  `activity.png`
**Purpose:** The live event stream + scheduled runs.
- **Must show:** an event feed (time · agent · kind chip · summary), filterable by
  agent and kind; a "scheduled runs" table (when, agent, job, model, status/errors).
- **Data:** `events`, `tasks`.

## `/dashboard/insights` — Insights  ·  `insights.png`
**Purpose:** Metrics once there is a week of `tasks`/`events` data (charts).
- **Must show:** headline numbers + charts; a clear empty state until data exists
  (it is sparse in this seed).
- **Data:** aggregated metrics.

---

# 3 · Agent pages

## Generic agent layout (Chief, Scout, Scribe, Muse, Fixer)
Three columns under a slim identity bar (emoji · name · status · model · last active):
- **Left — "work":** the agent's role-specific panels (see AGENTS.md).
- **Centre — chat:** a full chat with the agent (send a message, Enter to send,
  **drop/attach a `.md` file** to inline it, a voice-call button, a composer hint).
- **Right — approvals + recent runs:** what is waiting on you + the last runs.

Per-agent screenshots and required panels:
- **Chief** — `screenshots/03-agents/chief.png` — today's brief, weekly review +
  proposals checklist, backlog, health, state. (See AGENTS.md.)
- **Scout** — `scout.png` — leads, latest digest, digest archive, sources.
- **Scribe** — `scribe.png` — proposals list (status, views, send-via-Hunter, revise).
- **Muse** — `muse.png` — this week (plan), drafts (post cards + image upload),
  published (stats), and a "setup" integrations help modal.
- **Fixer** — generic layout only in this seed.

**Redesign notes:** the chat is the centrepiece and fills its column's height. Copy
on these pages is lowercase, short and plain ("waiting for you", "nothing in
progress"), each agent keeps its emoji. Panels should read like a workspace, not a form.

## Hunter — bespoke workspace  ·  `screenshots/03-agents/hunter.png`
Hunter replaces the generic layout with an outreach cockpit: **tabs** across the
top (chat · prospects · conversations · approvals · campaigns), chat in the centre,
pipeline stats + top-3 prospects on the left, approvals + conversations + a "new
leads" strip on the right. See section 4 for its sub-pages.

---

# 4 · Hunter outreach sub-pages

## `/dashboard/agents/hunter/campaigns` — Campaigns board  ·  `04-hunter-outreach/campaigns.png`
- **Must show:** a card per campaign (name, status, goal/audience/offer snippet,
  channels, message/stat counts); a "new campaign" action; click a card → view,
  edit icon → editor.
- **Data:** `campaigns` (dashboard-owned). **Interaction:** create/edit/pause/archive.

## `/dashboard/agents/hunter/campaigns/[id]` — Campaign view  ·  `campaign-view.png`
- **Must show:** the full campaign — goal, audience, offer, description, rules
  (channels, daily cap, follow-up days), assets, and stats (prospects, replies).
- **Note:** stats can read 0 when prospects/messages are not tagged to the campaign.

## `/dashboard/agents/hunter/campaigns/[id]/edit` and `/new` — Editor  ·  `campaign-edit.png`, `campaign-new.png`
- **Must show:** the campaign form (name, status, goal, audience, offer,
  description, channels, daily cap, follow-ups), an **assets** manager (add by URL
  or **upload** to storage), and an **"add prospects"** box that sends Hunter a
  command. **Interaction:** save (writes `campaigns`), upload, add prospects.

## `/dashboard/agents/hunter/prospects` — Prospect pipeline  ·  `prospects.png`
- **Must show:** the full prospect table (company, contact, channel, status,
  next-due with overdue/today/future colouring), a **search** box, and a summary.
- **Data:** parsed from Hunter's `PROSPECTS.md`.

## `/dashboard/agents/hunter/conversations` — Conversations  ·  `conversations.png`
- **Must show:** every thread grouped by company, filter chips (all / replied /
  awaiting reply / handed off), inbound vs outbound bubbles, per-message channel/kind
  chips, a "reply" that pre-fills a **"send as me"** composer (owner-written sends).
- **Data:** `messages` (read), `handoffs`; sends write `actions` (kind `send`).

---

# 5 · Public proposal — `/p/[token]`
**Purpose:** What a prospect opens. A clean, read-only proposal on the site's paper
look (not the dashboard). No seed proposal exists locally, so no screenshot.
- **Must show:** a "prepared for <company> by Persept, <date>, valid until <date>"
  line, the proposal markdown, a Persept wordmark + email footer. Prints cleanly.
- **Behaviour:** opening it counts a view (skips bots) and flips `sent → viewed`.
  Only `approved`/`sent`/`viewed`/`accepted`/`declined` are public; a `draft` 404s.
- **Redesign notes:** this is client-facing and unbranded-dashboard; it should feel
  like a premium document, consistent with the new marketing look.
