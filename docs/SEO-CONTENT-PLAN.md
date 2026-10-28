# Persept SEO Content Plan — Dubai AI Workforce

_Drafted Oct 2026. A hub-and-spoke content plan to win organic search in Persept's
market. Built to execute after the sales demo. Read `docs/TONE-GUIDELINES.md` before
writing any of these — every article is in Persept's voice, not generic SEO filler._

---

## The strategy in one paragraph

We are not going to out-publish the competition. The main competitor
(`agenticforbusiness.com` / "Eva AI") runs a **programmatic page farm** — templated
"Agentic AI Dubai: [vertical] [use case]" articles across real estate, retail, gyms,
banking, recruitment, dental and more. They have volume and thin depth. Persept wins the
opposite way: **fewer, deeper, opinionated articles** anchored to things they can't fake —
a real product (GYST), named agents with jobs, genuine Dubai specifics (AED, VAT, WPS,
WhatsApp), and one defensible thesis: **agents draft and prepare; a human presses send.**

Six articles, one hub and five spokes. Each targets a distinct search intent
(informational → commercial → transactional) so we cover the whole funnel, and each links
back to the hub and out to a conversion page (`/contact`, `/`, `/projects/gyst`).

### Two gaps worth attacking
- **Hospitality guest messaging** — the competitor's hotel coverage is thin, the UAE
  WhatsApp behaviour is extreme (≈98% open rate, ≈90% daily use), and it maps onto the
  Sarah (guest comms) and Marcus (reviews) personas. Clearest winnable niche.
- **Human-in-the-loop** — a real, rising search theme no one in the Dubai AI space owns.
  It is Persept's entire product thesis, so we can write it with authority and earn links.

> Difficulty ratings below are **qualitative estimates**, not tool data. Before executing,
> validate volume/difficulty in Google Search Console (once verified) + Ahrefs/SEMrush free
> tier, and let real impressions reshuffle the priority order.

---

## Keyword map

| # | Article | Primary keyword | Secondary / long-tail | Intent | Funnel | Est. difficulty | Priority |
|---|---------|-----------------|------------------------|--------|--------|-----------------|----------|
| 1 | **Pillar: AI Workforce for Dubai Businesses** | `ai workforce dubai` | ai employees for business dubai, ai agents for small business uae | Commercial / informational | Hub (all stages) | Med–High | **1** |
| 2 | **AI Guest Communication for Dubai Hotels & Holiday Homes** | `ai guest messaging hotels dubai` | hotel whatsapp automation uae, ai concierge dubai, pms hostaway guesty | Commercial | Mid | Low–Med | **2** |
| 3 | **What AI Automation Costs a Dubai SME in 2026** | `ai automation cost dubai` | ai for smes dubai pricing, how much does ai automation cost uae | Transactional | Bottom | Low–Med | **3** |
| 4 | **Human-in-the-Loop AI: Why a Person Still Presses Send** | `human in the loop ai agents` | ai agent approval workflow, ai that needs approval | Informational / thought leadership | Top (link magnet) | Medium | **4** |
| 5 | **AI Agents for Dubai Real Estate: Leads to Closings** | `ai for real estate agents dubai` | real estate lead automation uae, property follow-up ai dubai | Commercial | Mid | Medium | **5** |
| 6 | **AI Employees vs Hiring in Dubai: The Real Math** | `ai employee vs hiring` | cost of hiring dubai vs ai, ai vs admin assistant uae | Commercial comparison | Bottom | Low–Med | **6** |

### Internal linking model (hub-and-spoke)
```
            ┌──────────────────────────────┐
            │  1. PILLAR (hub)             │
            │  /guides/ai-workforce-dubai  │
            └──────────────────────────────┘
          ▲   ▲      ▲        ▲      ▲
          │   │      │        │      │   (every spoke links UP to the hub,
   ┌──────┘   │      │        │      └──────┐   and across to 1–2 siblings)
   2.Hotels   3.Cost 4.HITL   5.RealEstate  6.vs-Hiring
```
- The **hub links down** to all five spokes (in-body, with descriptive anchor text).
- **Every spoke links up** to the hub + 1–2 relevant siblings + one money page
  (`/contact` for a call, `/` for the workforce, `/projects/gyst` where careers/jobs fit).
- Anchor text is descriptive ("how AI guest messaging works for Dubai hotels"), never
  "click here".

---

## Article outlines

Each outline is ready to hand to a writer. Meta titles are ≤60 chars, descriptions
≈150–160 chars, both written in Persept's voice and ready to paste into the route's
`layout.tsx`/`page.tsx` metadata.

---

### 1. Pillar — AI Workforce for Dubai Businesses (2026 Guide)

- **Slug:** `/guides/ai-workforce-dubai`
- **Primary kw:** ai workforce dubai · **Secondary:** ai employees for business, ai agents for small business UAE
- **Intent:** commercial/informational · **Length:** 2,000–2,500 words · **Role:** the hub
- **Meta title:** `AI Workforce for Dubai Businesses: The 2026 Guide`
- **Meta description:** `What an AI workforce actually is, what it costs, and where it fits a Dubai business. Named agents that draft the repetitive work — a person still presses send.`
- **H1:** An AI workforce for Dubai businesses, explained plainly

**Structure (H2s):**
- What an "AI workforce" actually means (vs chatbots, vs RPA, vs one big autonomous agent)
- The six jobs an AI workforce does for a small business (map to Chief of Staff, Scout, Hunter, Fixer, Muse, Scribe)
- The one rule that makes it safe: agents draft, a person presses send → link to **#4 HITL**
- What it works with (Gmail/Outlook, WhatsApp, Google Sheets, Zoho/HubSpot — no new software)
- What it costs and what you save → link to **#3 Cost** and **#6 vs Hiring**
- Where it fits best: hospitality → link to **#2 Hotels**, real estate → link to **#5 Real Estate**
- How fast you can start (first workflow live in ~7 days)
- FAQ (reuse the 6 homepage FAQs + 2 Dubai-specific ones)

- **Schema:** `Article` + `BreadcrumbList` + `FAQPage`
- **CTA:** Book a 15-minute call (`/contact`)

---

### 2. AI Guest Communication for Dubai Hotels & Holiday Homes

- **Slug:** `/guides/ai-guest-communication-dubai-hotels`
- **Primary kw:** ai guest messaging hotels dubai · **Secondary:** hotel WhatsApp automation UAE, AI concierge Dubai, Hostaway/Guesty
- **Intent:** commercial · **Length:** 1,500–2,000 words · **Priority: 2 (clearest gap)**
- **Meta title:** `AI Guest Messaging for Dubai Hotels & Homes`
- **Meta description:** `Answer guests in seconds on WhatsApp, chase reviews, and cut front-desk load — without a bot going rogue. How AI guest comms works for UAE properties.`
- **H1:** AI guest communication for Dubai hotels and holiday homes

**Structure (H2s):**
- Why WhatsApp is the front desk in the UAE (≈98% open rate, ≈90% daily use)
- What guests actually ask — and which replies an agent can draft 24/7 (Sarah)
- Reviews: catching the unhappy guest before the public one-star (Marcus)
- The guardrail: the agent drafts, your team presses send on anything sensitive → link **#4 HITL**
- Plugging into your PMS (Hostaway, Guesty) and the booking inbox
- Multilingual guests, one tone of voice
- What this replaces vs a night-shift hire → link **#6 vs Hiring**

- **Schema:** `Article` + `BreadcrumbList`
- **CTA:** Book a 15-minute call (`/contact`); link up to Pillar

---

### 3. What AI Automation Costs a Dubai SME in 2026

- **Slug:** `/guides/ai-automation-cost-dubai`
- **Primary kw:** ai automation cost dubai · **Secondary:** AI for SMEs Dubai pricing, how much does AI automation cost UAE
- **Intent:** transactional · **Length:** 1,200–1,600 words · **Priority: 3 (high buyer intent)**
- **Meta title:** `What AI Automation Costs a Dubai SME in 2026`
- **Meta description:** `A plain breakdown of what AI automation really costs a Dubai SME — setup, monthly, and what you save versus a new hire. Real AED numbers, no sales fog.`
- **H1:** What AI automation actually costs a Dubai SME in 2026

**Structure (H2s):**
- The honest ranges: entry AI automation ≈ AED 1,500–5,000/mo; what sits at each tier
- Setup vs monthly: what you pay once, what recurs
- The real comparison: AED 5,000–8,000/mo + visa for a coordinator vs a per-month workforce
  (reuse the homepage comparison table) → link **#6 vs Hiring**
- What drives the price up or down (number of workflows, integrations, volume)
- What you're actually buying (a private per-client deployment, approvals app, dashboard)
- Hidden costs to watch for with cheaper tools (per-lead pricing shared with competitors)

- **Schema:** `Article` + `BreadcrumbList` + `FAQPage` (price questions)
- **CTA:** Book a 15-minute call to price your workflows (`/contact`)

---

### 4. Human-in-the-Loop AI: Why a Person Still Presses Send

- **Slug:** `/guides/human-in-the-loop-ai-agents`
- **Primary kw:** human in the loop ai agents · **Secondary:** ai agent approval workflow, ai that needs approval
- **Intent:** informational / thought leadership · **Length:** 1,500–2,000 words · **Role: link magnet, differentiator**
- **Meta title:** `Human-in-the-Loop AI: Why a Person Presses Send`
- **Meta description:** `Autonomous agents are fast until they send the wrong thing. The case for AI that drafts and prepares while a human approves anything touching money or customers.`
- **H1:** Human-in-the-loop AI: why a person should still press send

**Structure (H2s):**
- The failure mode nobody shows in the demo (the confidently-wrong send)
- Autonomy earned per action, not granted per agent (which actions run, report, wait, never)
- The four things an agent should never do alone (send, publish, pay, phone)
- Why this is faster in practice, not slower (fewer cleanups, more trust)
- How Persept builds it: the approval request, the dashboard, the phone app
- What it means for compliance and brand risk in a regulated market

- **Schema:** `Article` + `BreadcrumbList`
- **Notes:** This is the most link-worthy piece — pitch it to UAE startup/tech newsletters
  and LinkedIn. It also strengthens E-E-A-T for the whole domain.
- **CTA:** See how approvals work (`/trust` or `/contact`); link up to Pillar

---

### 5. AI Agents for Dubai Real Estate: Leads to Closings

- **Slug:** `/guides/ai-for-real-estate-dubai`
- **Primary kw:** ai for real estate agents dubai · **Secondary:** real estate lead automation UAE, property follow-up AI Dubai
- **Intent:** commercial · **Length:** 1,500–2,000 words · **Priority: 5 (large Dubai vertical)**
- **Meta title:** `AI Agents for Dubai Real Estate: Leads to Closings`
- **Meta description:** `How Dubai agencies use AI agents to qualify leads, keep listings current, and follow up fast — while brokers keep every client call. A practical playbook.`
- **H1:** AI agents for Dubai real estate: from lead to closing

**Structure (H2s):**
- The leaky funnel: portals, WhatsApp enquiries, and leads that go cold overnight
- Qualifying and routing leads the moment they land (Hunter/Scout)
- Keeping listings and follow-ups current without a coordinator (Fixer)
- The line brokers care about: the agent preps, the broker makes the call → link **#4 HITL**
- What it plugs into (Bayut/Property Finder leads, your CRM, WhatsApp)
- A week in the life: what the agency stops doing manually

- **Schema:** `Article` + `BreadcrumbList`
- **CTA:** Book a 15-minute call (`/contact`); link up to Pillar

---

### 6. AI Employees vs Hiring in Dubai: The Real Math

- **Slug:** `/guides/ai-employee-vs-hiring-dubai`
- **Primary kw:** ai employee vs hiring · **Secondary:** cost of hiring Dubai vs AI, AI vs admin assistant UAE
- **Intent:** commercial comparison · **Length:** 1,200–1,600 words · **Priority: 6 (bottom funnel)**
- **Meta title:** `AI Employees vs Hiring in Dubai: The Real Math`
- **Meta description:** `Visa, salary, and desk vs a per-month AI workforce. What a Dubai business actually spends and saves with AI agents instead of another admin hire.`
- **H1:** AI employees vs hiring in Dubai: the real math

**Structure (H2s):**
- The true cost of a Dubai hire (salary + visa + desk + management time)
- The true cost of an AI workforce (per-month, no visa, runs 24/7)
- Where a human still wins (judgement, the call, the relationship) — be honest
- The hybrid that actually works: AI drafts, your people decide → link **#4 HITL**
- A side-by-side table (reuse/extend the homepage comparison)
- When *not* to do this yet

- **Schema:** `Article` + `BreadcrumbList` + `FAQPage`
- **CTA:** Book a 15-minute call (`/contact`); link up to Pillar and **#3 Cost**

---

## Execution

### Prerequisite: a place to publish
There's no blog/guides route yet. Smallest sensible build: a `/guides` section
(`src/app/guides/[slug]`) using MDX or simple per-route folders that mirror the existing
page pattern, plus:
- add each published URL to `src/app/sitemap.ts`
- `Article` + `BreadcrumbList` JSON-LD per page (copy the pattern in `projects/gyst/layout.tsx`)
- an index page at `/guides` listing all articles (becomes an internal-link hub too)
- reuse the existing light theme + `pl` styles so these look native, not bolted-on

This is a ~half-day build. Flag it and I'll scaffold it when you're ready.

### Order & cadence (post-demo)
1. **Pillar (#1)** first — it anchors every internal link, even if it ranks slowest.
2. **Hotels (#2)** + **Cost (#3)** next — lowest difficulty, highest intent, quickest wins.
3. **HITL (#4)** — publish and actively promote it (LinkedIn, UAE tech newsletters) for links.
4. **Real Estate (#5)** then **vs Hiring (#6)**.
- Cadence: ~1 article/week. After each publish, add the internal links from siblings and
  resubmit the sitemap in GSC.

### Measurement (once Search Console is verified)
- Watch **impressions → position → clicks** for each primary keyword in GSC (Performance).
- At ~4–6 weeks per article, check which queries you're appearing for that you *didn't*
  target — those become the next articles (let Google tell you the demand).
- Refresh `lastmod` whenever you meaningfully update an article.
- Track calls booked from organic as the real metric, not rankings.

### Guardrails
- Every article passes `docs/TONE-GUIDELINES.md` — playful, credible, Dubai-appropriate,
  no corporate cringe, AED not dollars.
- Don't invent stats or promises. Cite real sources for market figures.
- One H1 per page; descriptive H2s that answer a real question (featured-snippet shaped).
- No thin/templated pages — if an article can't go deeper than the competitor's version,
  don't publish it.
