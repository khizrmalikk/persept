# Workforce redesign — agents, overlaps & Workspaces

A design handoff for the `/dashboard` redesign. It describes **what each agent does**,
**which data it owns**, **where agents overlap**, and a proposed **Workspaces** model that
turns those overlaps into first-class, categorisable surfaces. Everything here is drawn from
the current build (the bridge contract, the server actions, and the per-agent pages), so the
redesign can stay cohesive with how the system actually behaves.

---

## 0. The one invariant (never design around this)

**Agents draft and prepare; a human presses send, merge, publish and pay.**

Anything that touches money, access, or outbound communication becomes an **APPROVAL
REQUEST** the owner approves or rejects. This is the product's spine. Every agent, every
workspace, every workflow terminates in either (a) a reversible internal change or (b) an
approval the owner must clear. The redesign should make that split legible everywhere.

Copy rule for the whole dashboard: **lowercase, short, plain** ("waiting for you", "nothing
in progress"). No exclamation marks, no emojis except each agent's own.

---

## 1. The roster (identity tokens)

Each agent has a fixed identity: an emoji, a single hue, and a "room". Per-agent colour is
`oklch(0.78 0.12 <hue>)`; tints and borders reuse the same hue at lower alpha. Keep these
exact — they're the thread that ties an agent across the sidebar, its page, its cards, and
any workspace it appears in.

| Agent  | Emoji | Hue | Room               | Mandate (one line)                                      |
|--------|-------|-----|--------------------|---------------------------------------------------------|
| Chief  | 🗂️    | 70  | chief of staff     | sees everything; triage, backlog, weekly review, health |
| Scout  | 🔭    | 20  | research           | finds prospects & signal; hands leads to Hunter         |
| Hunter | 🎯    | 150 | outreach & sales   | campaigns, pipeline, conversations, outbound sends      |
| Scribe | 📝    | 220 | proposals & clients| writes & revises proposals; call-mode transcription     |
| Muse   | ✍️    | 110 | marketing studio   | content: drafts, images, publishing, post stats         |
| Fixer  | 🔧    | 290 | dev & debugging    | runs code projects, ships fixes, research passes        |

Hue 70 = warm gold, 20 = terracotta/red, 150 = green, 220 = blue, 110 = yellow-green,
290 = violet. (Chief gold reads as the "command" colour; good to lean on in the all-access UI.)

---

## 2. Agent by agent

For each: **mandate**, **owns** (the tables/objects it's the source of truth for), **surfaces**
(the panels on its page today), and **edges** (who it hands work to or receives from). "Owns"
distinguishes DASHBOARD-owned (the dashboard writes rows directly) from BRIDGE-owned (the
agent writes; the dashboard only patches status) — this matters for which objects a Workspace
can create vs. only display.

### 🗂️ Chief — chief of staff (the all-seeing layer)
- **Mandate:** orchestrates the others. Doesn't own a vertical; owns the *meta* layer.
- **Owns:** `backlog` (DASHBOARD-writable; owner can be any agent), weekly reviews
  (`improvements/*.md`), `STATE.md` + `BACKLOG.md` (mirrored read-only files), ideas triage.
- **Surfaces:** today's brief, live **STATE** panel (waiting-on, pipeline, campaigns, backlog;
  stale after 15 min), **health strip** (discrepancies the system can see; lines deep-link),
  **backlog** panel, **triage**, **ideas** inbox, **weekly review** (+ "run review now").
- **Edges:** reads *all* agents' output; routes work by adding backlog items (titles prefixed
  `workforce:` for self-improvement). **Chief is the only agent with cross-workspace reach.**

### 🔭 Scout — research
- **Mandate:** weekly prospecting + signal gathering. Produces candidates, not outreach.
- **Owns:** `leads` (BRIDGE-created; dashboard patches `status`:
  `suggested → sent_to_hunter | dismissed`), sources, reviews.
- **Surfaces:** leads panel (accept → becomes a Hunter prospect), sources panel.
- **Edges:** **Scout → Hunter.** "Accept lead" sends Hunter an `add prospect: …` command and
  flips the lead to `sent_to_hunter`. This is the top of the sales funnel.

### 🎯 Hunter — outreach & sales
- **Mandate:** the CRM. Runs campaigns, works the prospect pipeline, logs conversations,
  sends outbound (as the agent, or "as me").
- **Owns:** `campaigns` (DASHBOARD-owned; **shared owner field** with Muse), prospects
  (`PROSPECTS.md` pipeline), `messages` (BRIDGE-owned outreach log), `handoffs`
  (BRIDGE-created, dashboard patches status). Writes `send` actions (owner-sent/edited).
- **Surfaces:** two tabs — **outreach** (campaigns, pipeline table + summary, conversations,
  "send as me" compose box, pending/held approvals, hand-offs) and **chat**.
- **Edges:** receives leads from **Scout**; receives proposals from **Scribe** (sends the
  public proposal link); its approvals can be "sent back" to Scribe and/or Hunter.

### 📝 Scribe — proposals & clients
- **Mandate:** writes and revises client-facing proposals. Also powers call-mode speech-to-text.
- **Owns:** `proposals` (BRIDGE-owned; dashboard patches `status` + view fields; public page
  at `/p/<token>`), lessons.
- **Surfaces:** proposals panel, lessons panel, chat.
- **Edges:** when an outbound approval is "sent back", Scribe gets a directive to **revise the
  draft** and re-raises it. Approving a "send proposal to <company>" flips the matching proposal
  to `approved`; **Scribe → Hunter** sends it. Proposal lifecycle:
  `draft → approved → sent → viewed → accepted | declined`.

### ✍️ Muse — marketing studio
- **Mandate:** content. Drafts posts, attaches images, publishes (LinkedIn) or hands off for
  manual posting (Instagram), learns from stats.
- **Owns:** `posts` (BRIDGE-owned; dashboard patches `status` + `stats`), post images
  (campaign-assets bucket under `posts/<slug>/`), the week plan.
- **Surfaces:** drafts panel, published panel, week plan, setup help, chat.
- **Edges:** **shares `campaigns` with Hunter** (a campaign's `agent_id` is `hunter` *or*
  `muse`) and **shares the `campaign-assets` bucket**. Approve a `linkedin-post` → publishes;
  approve an `instagram-post` → `approved_manual` → owner posts → `posted_by_owner`.

### 🔧 Fixer — dev & debugging
- **Mandate:** runs code projects, ships fixes, does research passes on repos.
- **Owns:** `projects` (DASHBOARD-owned; bridge rewrites runner config + `PROJECTS.md`),
  `fixes` (BRIDGE-owned; dashboard retries a failed one).
- **Surfaces:** projects panel (+ project editor), fixes panel, chat.
- **Edges:** mostly self-contained; **overlaps with Knowledge** (knowledge files can be
  attached to a project and default to the `fixer` agent).

---

## 3. Data-ownership matrix (who writes what)

This is the backbone for deciding what a Workspace can *create* vs. only *surface*.

| Object            | Owner model      | Primary agent | Also touches            |
|-------------------|------------------|---------------|-------------------------|
| `actions`         | DASHBOARD writes | — (all)       | the only write channel to the bridge |
| `approvals`       | bridge + patch   | all agents    | owner decides; "send back" → Scribe/Hunter |
| `backlog`         | DASHBOARD + bridge | Chief       | owner can be any agent  |
| `leads`           | bridge + status  | Scout         | → Hunter                |
| `campaigns`       | DASHBOARD-owned  | **Hunter or Muse** | assets shared      |
| `messages`        | bridge (read)    | Hunter        | —                       |
| `handoffs`        | bridge + status  | Hunter        | —                       |
| `proposals`       | bridge + status  | Scribe        | → Hunter, public `/p/`  |
| `posts`           | bridge + status  | Muse          | campaign-assets         |
| `projects`        | DASHBOARD-owned  | Fixer         | knowledge files         |
| `fixes`           | bridge (read)    | Fixer         | —                       |
| `knowledge_files` | DASHBOARD-owned  | **any (agent_ids[])** | mirrored into each agent's workspace |
| `events`          | bridge (read)    | all agents    | the activity feed       |

---

## 4. Overlap map (where agents meet)

These edges are the raw material for Workspaces. Each is a real shared object or handoff in
the data model, not a conceptual nicety.

```
Scout ──leads──▶ Hunter ──proposal request──▶ Scribe ──proposal──▶ Hunter ──send──▶ owner approval
                   │                                                    
                   ├── campaigns ───shared owner field─── Muse          
                   │        └── campaign-assets bucket ── Muse          
                   │                                                    
Fixer ── projects ──attaches── knowledge_files ──shared across── (any agent)
                                                                        
Chief ─────────────── sees all of the above (STATE, health, backlog, reviews) ───────────────
```

**The five overlaps worth naming:**
1. **The sales funnel** — Scout → Hunter → Scribe → owner. Four roles, one journey (a lead
   becomes a prospect becomes a proposal becomes a sent deal).
2. **Campaigns** — a single `campaigns` object co-owned by Hunter (outreach) and Muse
   (marketing), sharing the asset bucket.
3. **Assets** — `campaign-assets` bucket spans Hunter campaigns and Muse posts.
4. **Knowledge** — `knowledge_files` attach to many agents (array) and to Fixer projects.
5. **Approvals & backlog** — cross-cutting spines every agent feeds into; Chief orchestrates.

---

## 5. The Workspaces model (the redesign's core idea)

**Definition.** A *Workspace* is a shared container of work with **one owner agent**, optional
**collaborator agents**, and a **category**. It groups the objects above by the overlap they
sit on, so the owner navigates by *work* (a campaign, a deal, a project) rather than by *agent*.
Agents become the "who"; Workspaces become the "what".

Each Workspace card/surface should carry: the owner agent's identity colour, collaborator
agent chips, a status, a last-activity timestamp, its open-approval count, and a primary
object list.

### Proposed categories

| Category          | Owner    | Collaborators        | Contains (objects)                                  | Create? |
|-------------------|----------|----------------------|-----------------------------------------------------|---------|
| **Campaign**      | Hunter *or* Muse | the other, Scribe | campaign rules, prospects *or* posts, assets, approvals | yes (dashboard-owned) |
| **Deal / Account**| Hunter   | Scout, Scribe        | the lead, the prospect, conversations, the proposal, sends | emergent (from a lead) |
| **Project**       | Fixer    | —                    | repo config, fixes, attached knowledge, research passes | yes (dashboard-owned) |
| **Content studio**| Muse     | Hunter (for campaigns) | week plan, drafts, published, images, stats        | partly (posts bridge-owned) |
| **Research desk** | Scout    | Hunter               | sources, leads, reviews                             | no (bridge-owned leads) |
| **Knowledge**     | shared   | any                  | knowledge files, their agent assignments            | yes (dashboard-owned) |

### Two cross-cutting surfaces that are *not* categories (keep them global)
- **Approvals** — the owner's inbox. Pulls from every workspace; filter by agent/workspace.
- **Command (Chief)** — the all-access layer: STATE, health, backlog, weekly review, ideas.
  This is where "Chief sees all and has access to everything" lives.

### Membership at a glance (which agents appear in which workspace)

```
               Campaign   Deal   Project  Content  Research  Knowledge   Command
Chief             ·        ·        ·        ·        ·         ·          ●(all)
Scout                      ◐                          ●                     ·
Hunter            ●        ●                 ◐        ◐                     ·
Scribe            ◐        ◐                                                ·
Muse              ●                          ●                             ·
Fixer                               ●                          ◐           ·
                ● owner/primary   ◐ collaborator
```

**Design implication.** A Workspace header should show the owner agent large and the
collaborators as smaller chips, each in its own hue — so a "Campaign" owned by Hunter with
Muse + Scribe collaborating reads as green-led with yellow-green and blue chips. Chief appears
on *every* workspace as an "oversight" affordance, never as a collaborator chip.

---

## 6. Shared primitives (consistent across every agent & workspace)

Design these once; reuse everywhere.

- **Approval card.** The universal unit. Variants: outbound message (to/subject/channel header
  + body; actions: *send* / *edit and send* / *reject* / *send back*), post (linkedin vs
  instagram-manual), proposal, generic. Supports inline-edit before approving, bulk actions,
  and **held** (parked) state.
- **Agent chat.** Every agent has the same chat (optimistic send, typing indicator, voice-call
  button, markdown drop-in, and **image attachments** — paste/drop/attach; images upload to a
  private bucket and inline into the message). Reuse verbatim per workspace.
- **Activity feed** (`events`): typed chips per source (`lead`, `proposal`, `post`, `backlog`,
  …). A workspace-scoped feed = this filtered by the workspace's agents/objects.
- **Backlog item**: title, detail, owner agent, due, priority, status. Appears in Command and
  can be scoped into a workspace.
- **Empty states** that explain what *will* appear ("no prospects yet — accept a lead from
  Scout"), not just "empty".
- **Status dot** vocabulary: `working` (agent hue), `waiting` (accent — needs you), `idle`
  (muted), `soon` (not deployed).

---

## 7. Cohesion checklist for the designer

- **Colour = identity, always.** Agent hue threads from sidebar → agent page → every card and
  chip that agent touches, including inside shared workspaces. Never recolour an agent.
- **Navigate by work, fall back to agent.** Primary nav = Workspaces (by category) + the two
  globals (Approvals, Command). Secondary = the flat agent list for "talk to X directly".
- **One owner, many collaborators.** Every workspace has exactly one owner agent (its lead
  colour) and zero-plus collaborator chips. Chief is oversight on all, collaborator on none.
- **The approval split is visible on every surface.** Draft/internal work vs. "waiting for you"
  should never be ambiguous. Lean on the accent (`waiting`) colour for the owner's queue.
- **Reuse the primitives in §6** rather than bespoke layouts per agent — that's what keeps six
  verticals feeling like one product.
- **Respect create-vs-surface.** Dashboard-owned objects (campaigns, projects, backlog,
  knowledge) can have "new" buttons inside a workspace; bridge-owned ones (leads, proposals,
  posts, fixes, messages) are surfaced and status-patched, not created in the UI.
- **Copy stays lowercase, short, plain.** Keep the current voice.

---

## 8. Quick reference — tables → surfaces

```
leads        → Research desk / Deal          (Scout; status-patch)
campaigns    → Campaign                       (Hunter|Muse; dashboard-owned, creatable)
messages     → Deal / Campaign conversations  (Hunter; read)
handoffs     → Deal                           (Hunter; status-patch)
proposals    → Deal / Scribe                  (Scribe; status-patch, public /p/)
posts        → Content studio                 (Muse; status-patch + stats)
projects     → Project                        (Fixer; dashboard-owned, creatable)
fixes        → Project                        (Fixer; read + retry)
knowledge    → Knowledge (cross-agent)         (dashboard-owned, creatable)
backlog      → Command + workspace-scoped      (Chief; dashboard-owned, creatable)
approvals    → Approvals (global) + per ws     (all; decide/hold/return)
events       → Activity (global) + per ws       (all; read)
```

---

*Source of truth for this doc: `docs/workforce-dashboard.md`, `src/lib/workforce/roster.ts`,
`src/lib/workforce/actions.ts`, and the per-agent pages under `src/app/dashboard/`. If the
redesign changes table names or the `actions.kind` values, it breaks the bridge contract —
keep those stable and add columns rather than renaming.*
</content>
