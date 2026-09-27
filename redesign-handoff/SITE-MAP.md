# Site map

Two surfaces: the public marketing site and the private dashboard. Auth column:
**public** = anyone; **owner** = behind a magic-link email allowlist (the dashboard).

## Marketing site (public)

| Route | Purpose | Auth | Screenshot |
|---|---|---|---|
| `/` | Landing. The whole pitch on one page + a live "agent office" hero. **Just redesigned** (dark/amber) — the reference look. | public | `screenshots/01-marketing/landing.png` |
| `/contact` | Book a call / send a note. **Just redesigned** to match the landing. | public | `screenshots/01-marketing/contact.png` |
| `/projects` | Work index: the agent offering + GYST. Old light theme. | public | `screenshots/01-marketing/projects.png` |
| `/projects/gyst` | GYST product story (Persept's own product). Old light theme, GYST yellow. | public | `screenshots/01-marketing/projects-gyst.png` |
| `/about` | Studio / founder story. Old light theme. | public | `screenshots/01-marketing/about.png` |
| `/login` | Magic-link sign-in for the dashboard. | public | `screenshots/01-marketing/login.png` |

## Dashboard (owner only)

The command centre. Left nav switches between the office, approvals, activity,
insights, and each agent. Pages are server-rendered and refresh every 6s.

| Route | Purpose | Screenshot |
|---|---|---|
| `/dashboard` | **Office home.** A top-down pixel office: six rooms, agents at their desks, sub-agents wandering. Left rail = running work + backlog + roster + health; right rail = approvals + urgent + pulse; a live activity feed. | `screenshots/02-dashboard/dashboard-home-office.png` |
| `/dashboard/approvals` | **The approvals inbox** — the heart of the product. Everything waiting for the owner to approve, edit, or reject. | `screenshots/02-dashboard/approvals.png` |
| `/dashboard/activity` | The live event stream + scheduled runs across the workforce. | `screenshots/02-dashboard/activity.png` |
| `/dashboard/insights` | Metrics once there is a week of data (charts). | `screenshots/02-dashboard/insights.png` |

## Agent pages (owner only)

Every agent has a detail page. The generic layout is three columns: **work**
(left), **chat with the agent** (centre), **approvals + recent runs** (right).
Each agent adds its own panels. Hunter has a bespoke multi-tab workspace.

| Route | Agent | Screenshot |
|---|---|---|
| `/dashboard/agents/chief` | Chief of Staff | `screenshots/03-agents/chief.png` |
| `/dashboard/agents/scout` | Scout | `screenshots/03-agents/scout.png` |
| `/dashboard/agents/hunter` | Hunter (bespoke outreach workspace) | `screenshots/03-agents/hunter.png` |
| `/dashboard/agents/scribe` | Scribe | `screenshots/03-agents/scribe.png` |
| `/dashboard/agents/muse` | Muse | `screenshots/03-agents/muse.png` |
| `/dashboard/agents/fixer` | Fixer (roster shows it, not deployed in this seed) | — (generic layout) |

## Hunter outreach (owner only)

Hunter's workspace spans several sub-routes (tabs across the top: chat ·
prospects · conversations · approvals · campaigns).

| Route | Purpose | Screenshot |
|---|---|---|
| `/dashboard/agents/hunter/campaigns` | Campaigns board (cards). | `screenshots/04-hunter-outreach/campaigns.png` |
| `/dashboard/agents/hunter/campaigns/[id]` | One campaign: goal, audience, offer, rules, assets, stats. | `screenshots/04-hunter-outreach/campaign-view.png` |
| `/dashboard/agents/hunter/campaigns/[id]/edit` | Edit a campaign + upload assets + add prospects. | `screenshots/04-hunter-outreach/campaign-edit.png` |
| `/dashboard/agents/hunter/campaigns/new` | Create a campaign. | `screenshots/04-hunter-outreach/campaign-new.png` |
| `/dashboard/agents/hunter/prospects` | The full prospect pipeline (searchable table). | `screenshots/04-hunter-outreach/prospects.png` |
| `/dashboard/agents/hunter/conversations` | Every outreach thread + "send as me" composer. | `screenshots/04-hunter-outreach/conversations.png` |

## Public, unlisted

| Route | Purpose | Screenshot |
|---|---|---|
| `/p/[token]` | A read-only **proposal page** a prospect opens (Scribe writes it, Hunter sends the link). Outside auth. No seed proposal locally, so no screenshot — see PAGES.md for the spec. | — |
