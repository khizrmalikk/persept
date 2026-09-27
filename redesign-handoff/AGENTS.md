# The workforce — the six agents

Persept is sold as a team of named agents, each doing **one job well**. On the
dashboard office home each agent has a room; clicking a room opens that agent's
page. Every agent runs 24/7 and drafts work; the owner approves anything that
leaves the building or spends money.

> Note on names: the **marketing landing** hero uses friendly demo names
> (Sami, Nora, Idris, Maya, Leo, Zara) for the roles below. The **dashboard**
> uses the real role names (Chief, Scout, Hunter, Scribe, Muse, Fixer). Keep the
> two consistent in spirit; the dashboard names are the product.

Each agent has a colour used for its avatar, room accent, progress and chips.
(The current dashboard theme is near-black with a single green accent; agents are
differentiated more by room + emoji than by strong per-agent colour. A redesign
could push per-agent colour further — see the landing office for that idea, where
each agent has a distinct hue.)

---

## Chief of Staff — `chief` · room: "chief of staff"
**The one who briefs you.** The owner's right hand. Runs the morning brief,
keeps the backlog, watches the health of the whole workforce, and writes a
weekly review proposing improvements.

**Its page must show:**
- **Today's brief** — the "good morning" summary + an evening note.
- **Weekly review** — the newest `improvements/*.md` rendered, a date selector for
  older ones, a "run the review now" button, and the review's proposed changes as
  a one-tap accept/discard checklist (backlog items titled `workforce: …`).
- **Backlog** — a real table: add / edit / complete / drop / reopen / hand to an agent.
- **Health** — discrepancies the system can see ("replies with no response",
  "approvals waiting", "backlog past due"), each linking to where to act; "all clear" when clean.
- **State** — a live view mirrored from `STATE.md` (waiting on you, agents, outreach, pipeline).
- Plus the shared chat + approvals + recent runs.

**Gate:** Chief mostly informs; its proposals become backlog items you accept.

---

## Scout — `scout` · room: "research"
**The one who finds leads and reads the market.** Weekly prospecting + a daily
market-watch digest.

**Its page must show:**
- **Leads** — companies Scout found, each acceptable into Hunter's pipeline in one
  click ("add to hunter") or dismissable.
- **Latest digest** — the market-watch briefing as clean cards; a "in leads" chip
  when a digest item names a company already in leads.
- **Digest archive** — the last several digests, by date.
- **Sources** — what Scout reads.
- Plus the shared chat + approvals + recent runs.

**Gate:** Accepting a lead is one tap; it sends Hunter an "add prospect" command.

---

## Hunter — `hunter` · room: "outreach & sales"
**The one who does outreach.** Finds who to talk to, drafts the first message and
the day-3 / day-7 follow-ups, reads replies, proposes call times, hands off hot ones.
Hunter has a **bespoke, multi-tab workspace** (not the generic layout).

**Its pages must show:**
- **Chat** (main) — chat centre, with pipeline stats + top prospects on the left and
  approvals + conversations + a "new leads" strip on the right.
- **Campaigns** — a board of outreach campaigns (goal, audience, offer, rules,
  channels, assets), each viewable / editable; create new.
- **Prospects** — the full pipeline as a searchable table (company, contact, channel,
  status, next-due with overdue/today colouring).
- **Conversations** — every thread grouped by company, filterable (replied /
  awaiting reply / handed off), with a "send as me" composer for owner-written sends.
- **Approvals** — Hunter's pending outbound messages.

**Gate:** Every outbound message is an approval — send, edit-and-send, or reject.
Held messages (daily cap reached) can be released.

---

## Scribe — `scribe` · room: "proposals & clients"
**The one who writes proposals.** Turns call notes into a proposal the same day,
published as a page the prospect can open, tracked when viewed.

**Its page must show:**
- **Proposals** — each as a card: title, status (draft → approved → sent → viewed →
  accepted / declined), company/contact, view count + last-viewed, actions:
  preview, copy public link, send via Hunter, mark accepted/declined, revise in chat.
- Plus the shared chat + recent runs.
- The **public proposal page** `/p/[token]` is what the prospect sees (see PAGES.md).

**Gate:** A draft must be approved (in the approvals inbox) before it can be sent.

---

## Muse — `muse` · room: "marketing studio"
**The one who does marketing/content.** A weekly content plan, drafts in your
voice, and suggestions from your own numbers (e.g. a discount when occupancy dips).

**Its page must show:**
- **This week** — the weekly plan (day · channel · angle · source) with an "edit
  plan" box and a "write this week's plan now" button.
- **Drafts** — pending post approvals as post cards: channel chip (LinkedIn /
  Instagram), the text, the image or an image brief with an upload control,
  publish / edit-and-publish / reject.
- **Published** — posts newest first: channel, first line, date, link, status;
  a "posted" button for manual (Instagram) posts and an inline stats form.
- A **"setup" help modal** explaining the integrations still to connect (LinkedIn,
  Meta/Instagram, the image bucket).
- Plus the shared chat.

**Gate:** LinkedIn posts publish on approval; Instagram posts are approved-for-manual
(you post by hand, then mark "posted").

---

## Fixer — `fixer` · room: "dev & debugging"
**The one who fixes and builds internal things.** Present in the roster; not
deployed in this seed data, so it renders the **generic** agent layout (chat +
work + approvals + runs). A redesign should still give it a room and a page.

---

## Sub-agents (background workers)
Any agent can spin up short-lived **sub-agents** (background workers) for a task.
On the office home they appear as small satellites wandering their parent's room
and in a "running" list. They are read-only in the dashboard.
