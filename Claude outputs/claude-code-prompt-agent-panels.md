Add agent-specific panels to the workforce dashboard agent pages (`src/app/dashboard/agents/[id]/page.tsx`). Read `CLAUDE.md` and `docs/workforce-dashboard.md` first; the constraints there apply (server components, `supabaseAdmin()` server-side only, all writes through `src/lib/workforce/actions.ts` with `guard()`, styles scoped under `.wf`, site tokens, lowercase plain copy).

## New data source

The bridge now mirrors each agent's working files into a table:

```
agent_files (agent_id text, path text, content text, hash text, updated_at timestamptz)
  primary key (agent_id, path)
```

`path` is relative to the agent's workspace, e.g. `PROSPECTS.md`, `OFFER.md`, `MEMORY.md`, `SOURCES.md`, `memory/2026-09-18.md`, `memory/digests/2026-09-18.md`, `memory/backlog.md`. Content is markdown. Add a helper `getAgentFile(agentId, path)` and `listAgentFiles(agentId, prefix)` in `src/lib/workforce/files.ts` (server-only). Add a small markdown-table parser in the same file: given a markdown pipe table, return `{ columns: string[], rows: Record<string,string>[] }`, tolerant of leading/trailing pipes and the separator row.

## Page structure

Keep the current layout (chat on the left, approvals and runs on the right) but insert an agent-specific panel section above the chat, chosen by `agent.id`. Unknown agents get the generic panel only. Every panel must render an honest empty state ("hunter has not written its list yet", etc.) when the file is missing.

### Generic (every agent)

`MemoryPanel`: renders `MEMORY.md` as a compact list (each `- ` line as a row), collapsed by default with a "standing memory (n lines)" toggle. `TodayLog`: renders `memory/<today>.md` if present, else `memory/<yesterday>.md`, as plain text in a `pre`, collapsed by default.

### hunter — pipeline

Parse `PROSPECTS.md` (columns: priority, company, contact, channel, address, units_or_size, angle, status, last_touch, next_due, notes).

1. `PipelineSummary`: a row of small stat tiles, counts by status in this order: new, drafted, approached, followed_up_1, followed_up_2, replied, call_booked, parked, no. Tile shows count and the status label in lowercase; zero counts render muted. Below it one line: "next due: <n> today, <n> overdue" computed from `next_due` (Asia/Dubai dates).
2. `PipelineTable`: the rows, sortable by clicking the priority / status / next_due headers (client component, sorting only, no data fetching). Columns shown: priority, company, contact, channel, status (as a small chip), next_due (overdue in `--err`, today in `--accent`), angle (truncated to 80 chars with title attribute for full text). Row click expands to show angle, address, notes in full.
3. Quick actions per expanded row, each a form posting to a new server action `sendAgentCommand(agentId, text)` in `actions.ts` (which inserts an `actions` row with kind `message`, exactly like `sendMessageFromForm`, and re-checks `guard()`):
   - "mark sent" → text `sent <company>`
   - "log reply" → a small textarea then submit → text `reply from <company>: <textarea>`
   - "park" → `park <company>`
   Show a one-line note under the table: "actions are sent to hunter as messages; the table updates on its next write (up to a minute)".
4. `OfferPanel`: `OFFER.md` rendered as markdown (use a minimal renderer: headings, paragraphs, lists, bold; no external dependency needed, or a tiny one if you prefer), collapsed by default.

### scout — digests

1. `LatestDigest`: the newest file under `memory/digests/` rendered with structure: the header line, the one-line lead, then each numbered item as a card with title, source, the "what it means" sentence, chips for `for:` (gyst | workforce) and `tag:` (content | sales | product | watch), and the link. Parse leniently: items begin with `^\d+\.`; the `for:`/`tag:` line is the next line; the URL is the line after. If parsing fails for an item, show its raw lines.
2. Filter chips above it: all / gyst / workforce and all / content / sales / product / watch (client component, filters the already-rendered items).
3. `DigestArchive`: the previous six digests as a list of dates; clicking shows that digest in the same card layout.
4. `SourcesPanel`: `SOURCES.md` rendered as a table of name / why (strip the URL into a small link icon), collapsed by default.
5. One quick action on each digest item: "send to hunter" → `sendAgentCommand("hunter", "add prospect angle from scout: <item title> — <what it means> — <url>")`, and "send to muse" (disabled with a tooltip "muse is not enabled yet" until an agent with id `muse` exists in the `agents` table).

### chief — command

1. `TodaysBrief`: the latest assistant message from chief in `events` whose payload text starts with "good morning" (case-insensitive), rendered with its five sections (yesterday / waiting on you / today / cost / one thing) as labelled blocks. If none today, show "no brief yet today; next at 08:00".
2. `Backlog`: `memory/backlog.md` as a checklist-style list (read-only), with a "hand to <agent>" quick action per line that sends `sendAgentCommand("chief", "hand this to <agent>: <line>")`, where the agent choice is a small select of enabled agents.
3. `RosterStrip`: one row of the agents table (emoji, name, status dot, last active) so chief's page doubles as the roster overview.

## Style

Same `.wf` classes and tokens as the existing pages: cards on `#fff` with `--line` borders and `--radius-md`, kickers in Geist Mono uppercase, status chips using the existing `.kind`/`.dot` treatments, `--accent` sparingly (due today, active filter). No new colours. Panels stack in a single column on narrow screens. Keep each new component under ~150 lines; put them in `src/app/dashboard/_components/panels/`.

## Do not

Change any table other than reading `agent_files` and inserting `actions` rows; touch `src/proxy.ts`, auth, or the bridge contract; add a state library; write to `agent_files` from the dashboard (it is bridge-owned; the agents update their own files).

## Done when

`npm run build` passes; `/dashboard/agents/hunter` shows the pipeline summary and table with real rows from `PROSPECTS.md`; "mark sent" on a row creates an `actions` row with text `sent <company>`; `/dashboard/agents/scout` shows the latest digest as cards with working filters; `/dashboard/agents/chief` shows the brief sections or the empty state; every panel has an empty state.
