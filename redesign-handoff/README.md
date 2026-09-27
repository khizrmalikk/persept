# Persept — redesign handoff

This package is for a full visual redesign of the **Persept dashboard and agent
pages** (the private product). It contains the whole site structure, a full-page
screenshot of every page, an explanation of each agent, and a spec of what each
page must show plus the constraints a redesign has to respect.

Give this folder to the designer. Every page below has a screenshot in
`screenshots/` and an entry in `PAGES.md`.

---

## What Persept is

Persept sells small businesses an **AI workforce**: a set of named agents (Chief
of Staff, Scout, Hunter, Scribe, Muse, Fixer) that run the repetitive,
message-heavy parts of a company 24/7 — outreach, customer replies, proposals,
reports, market watch, content. Each agent runs on its own private deployment.

**The one principle the whole product stands on:**

> The agents draft and prepare. A human presses send, publish, merge and pay.

Anything that touches money, access, or an outbound message to a customer becomes
an **approval request** the owner approves or edits in the dashboard. Persept runs
its own company on this exact stack, so the dashboard is both the product and the
sales demo. **It should look like a product, not an admin panel.**

---

## Two surfaces (both in this handoff)

1. **Marketing site** (public) — `/`, `/contact`, `/projects`, `/projects/gyst`,
   `/about`, `/login`. The landing and contact pages were **just redesigned**
   (dark, cinematic, amber) and are included as the reference for the new look.
   The other marketing pages are still on the old light theme.
2. **Dashboard** (private, one owner) — the command centre: an office home,
   an approvals inbox, activity, insights, and a page per agent. **This is the
   main redesign target.**

---

## Folder layout

```
redesign-handoff/
  README.md            ← you are here
  SITE-MAP.md          ← full route tree, one line per page, with auth + screenshot
  AGENTS.md            ← the six agents: role, colour, room, what their page shows
  PAGES.md             ← per-page spec: purpose, must-show, data, interactions
  DESIGN-NOTES.md      ← current design system, tech, and the hard constraints
  screenshots/
    01-marketing/      ← landing, contact, projects, projects-gyst, about, login
    02-dashboard/      ← office home, approvals, activity, insights
    03-agents/         ← chief, scout, hunter, scribe, muse (one page each)
    04-hunter-outreach/← campaigns, campaign view/edit/new, prospects, conversations
```

Screenshots are full-page captures at 1440px wide, taken from the live app with
seed data. Most bridge-fed tables are sparse locally, so several panels show their
**empty states** — those are intentional and part of the design (see PAGES.md).

---

## How to read this before redesigning

1. Read **AGENTS.md** — the mental model of the workforce.
2. Skim **SITE-MAP.md** — how the pages fit together.
3. For each page you touch, read its entry in **PAGES.md** (what must stay,
   what is data, what is an interaction) and look at its screenshot.
4. Read **DESIGN-NOTES.md** — what is fixed (the approval model, the data
   contract, the security model) versus what is free to change (everything
   visual). Redesign freely inside those lines.
