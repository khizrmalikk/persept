# Persept OS — bridge data contract (day-30 bundle)

Source of truth for wiring the OS windows to real tables. The bridge now writes
these columns/tables; the dashboard reads them. `actions.kind` is unchanged (still
the only write channel). **Read every new column as nullable** — rows created
before this bundle have no `kind`/`workspace`, so keep the current text-inference
fallback.

## approvals (new columns)
- `kind`: `email | linkedin | instagram | whatsapp | linkedin-message | proposal | merge | payment | question | other`.
  - design variants map 1:1; `whatsapp` + `linkedin-message` render like **email** with a "you send this by hand" note (they already carry `approved_manual`); `question` renders Scribe's question with the note box + "send to scribe".
- `workspace`: `frontdesk | marketing | dev | command` → per-workspace "n waiting for you" chips + the approvals filter.
- `company`: deal link (join `prospects.company`, case-insensitive) + "in front desk →".
- `copy_request_id` (uuid): join `copy_requests` + `draft_versions` for the trail
  (`drafted by Scribe for Hunter`, `revision of #n`, `being revised` = a `copy_requests`
  row with `revision_of` = this approval, status `writing`).

## prospects (new table — Hunter's PROSPECTS.md, mirrored every 3 min)
`key` (slug PK), `company`, `contact`, `channel`, `address`, `size`, `angle`,
`status` (Hunter's word), `stage` (`prospect | contacted | replied | call | proposal | won | lost | parked`),
`priority`, `last_touch`, `next_due`, `campaign`, `notes`, `value_aed`, `archived`, `updated_at`.
- pipeline columns = `stage` in that order; hide `parked`+`lost` behind a filter.
- open pipeline = Σ `value_aed` where stage ∉ (won, lost, parked); won this month = won rows with `last_touch` this month.
- `value_aed` owner-editable in the deal panel (direct patch; mirror never overwrites unless Hunter's file has a `value` column). default = proposal total if parseable else offer pilot price.
- journey timeline joins by company: `leads`, `messages` (body), `handoffs`, `proposals` (status/view_count), `approvals` (open = needs you).
- "ask Hunter to follow up" = `actions` message to hunter: `follow up with <company>: <note>`.

## backlog (new columns)
- `source_event_id` (→ events.id) + `session_key`: the Percy reply that created it → render a task card under that drawer message (`task → <owner>`).
- `waiting_on_owner` (bool): bridge sets each minute when the owner agent has a pending approval.
- kanban: to do = open & !waiting · in progress = open & owner `agents.status=working` · waiting for you = `waiting_on_owner` · done = done. drop→done patches `status: done`. there is **no** "in progress" status — it's derived.

## agents (new columns)
`cost_today`, `tokens_today`, `cost_month` (ledger every 2h + on "cost report"),
`budget_usd` (owner sets on permissions tab; direct patch), `budget_alerted_at`,
`model` (CONFIG block: `actions` msg to percy `CONFIG\nagent: hunter\nmodel: cheap\nwhy: …`; bridge applies, Percy acks. tiers: cheap, routine, judgment).
- **map ring = `cost_today / (budget_usd / daysInMonth)` capped 100%.**
- **"on the vps" bars = cost + tokens, NOT cpu.** (per-agent cpu/mem not provided — use cost.)

## vps_metrics (one row, id=1, every minute)
`ts`, `load_1/5/15`, `cpus`, `cpu_pct`, `mem_total`, `mem_used`, `disk_total`,
`disk_used`, `uptime_s`, `month_spend_usd`, `budget_usd` (may be null).
→ menu-bar `vps %`, the VPS strip, the map. keep last 24 client-side for the sparkline, or read `usage_daily` for the month chart.

## runs_schedule (per day)
`date`, `time` (HH:MM Dubai), `agent`, `name`, `status` (`planned | done | missed`).
→ "today's runs": dot per row, filled when done, red ring when missed, needle at now.

## integrations
`id`, `name`, `status` (`connected | pending | off`), `detail`, `updated_at`.
rows: gmail, linkedin-profile, linkedin-page, places, telegram, runner, ledger.
agent page "connected accounts": hunter→gmail,places · muse→linkedin-profile,linkedin-page · fixer→runner · percy→telegram,ledger · scout→places.

## goals (dashboard-owned)
`id`, `label`, `period`, `value`, `target`, `sort`. owner creates/edits on the desktop widget (direct writes). Percy updates `value` via GOAL block matched on `label` case-insensitively — keep labels stable.

## usage_daily (day-29 bundle)
`date`, `session_key`, `agent_id`, `model`, `cost_usd`, `input_tokens`, `output_tokens`,
`cache_read`, `cache_write`, `total_tokens`, `context_tokens`. source for any cost chart.

## Percy's threads
direct chat with an agent is still an `actions` message to that agent; the bridge
mirrors it into Percy's `inbox/THREADS.md` so "Percy still sees this thread" holds. no dashboard change.

## Not provided yet — hide or stub honestly
per-agent cpu/mem (use cost), calendar calls. **agent cursors on the whiteboard
are cut from the design.** (war room, dev terminal, deploys and errors now land —
see bundle B below.)

---

# Addendum — bundle B (day 31)

## war room — table `warroom_items` (realtime on) — SUPERSEDED by day-32
> **Superseded.** The whiteboard war room (`warroom_items`) is gone as of bundle C
> (day 32). The war room is now its own goals window — see the day-32 addendum at
> the end of this file. `warroom_items` is no longer read or written by the dashboard.
cols: `id`, `kind` (`sticky | arrow | note`), `author` (`owner` | agent id), `text`,
`x`, `y` (sticky pos), `from_id`, `to_id` (arrow endpoints = sticky ids), `sort`
(note order), `created_at`, `updated_at`, `deleted_at`.
- dashboard writes directly: create sticky (`author: owner`, pos from drop) · move (patch x,y,updated_at on pointer-up) · edit (patch on blur) · arrow (insert kind:arrow + from_id/to_id) · note (kind:note, sort = max+1) · delete = set `deleted_at` (never hard-delete). agents write via the bridge WARROOM block; their stickies land on a loose grid, owner can move them.
- tint each item by `author` hue. presence pill = distinct authors with an item updated in the last hour. **no agent cursors.** "X is editing…" = `agents.status=working` for authors present in the last hour.

## dev — fixes + deploys
- `fixes.log_tail`: runner's last ~3,000 chars (final tail when done). terminal tab polls every 5s while `status=running`; `$`→command, `✓`/`✗`→pass/fail. it's Claude Code's real output, not a shell.
- `fixes.pr_state` (`open|merged|closed`), `pr_additions`, `pr_deletions`, `pr_changed_files`, `pr_checks` (`[{name,status}]`), `pr_checked_at`: refreshed every 10 min for open PRs; a hand-merge on GitHub flips the fix to `merged`. diff viewer still needs the PR link; +/− + checks come from these.
- table `deploys`: `id`, `project`, `source` (`vps|vercel`), `status` (`queued|building|live|failed`), `change`, `branch`, `url`, `env` (`production|preview`), `fix_id`, `ts`, `finished_at`. VPS row created on merge, turns `live` when the bridge is back up. Vercel rows only when `projects.vercel_project_id` is set (add that field to the project editor) + `VERCEL_TOKEN`(+`VERCEL_TEAM_ID`) in VPS `.env`.
- retry on a failed fix: unchanged (existing action).

## errors tab — tables `error_events` (raw) + `errors` (rolled-up view the tab shows)
- `error_events`: `project` (`gyst|persept|workforce`), `message`, `signature?`, `severity` (`fatal|error|warning|info`), `stack`, `url`, `user`, `meta` jsonb. leave `rolled` alone.
- **NEW dashboard route `POST /api/errors`**: validate bearer `ERROR_INGEST_TOKEN`, insert one row. GYST + the dashboard's own `instrumentation.ts onRequestError` + a throttled client `window.onerror` reporter post here; the bridge's `/hook/error` too.
- `errors`: `id`, `project`, `signature`, `severity`, `message` (latest), `stack`, `url`, `count_total`, `count_today`, `count_day`, `first_seen`, `last_seen`, `state` (`new|queued|fixed|ignored`), `fix_id`. triage: new→"new", queued→"Fixer is on it" (link fix), fixed, ignored. severity bar from `severity`; count today = `count_today` when `count_day` is today else 0.
- actions: "ask Fixer to fix" = `actions` msg to fixer `fix error <id>` (bridge writes the FIX REQUEST + sets `state: queued`); "ignore" = patch `state: ignored`. owner gets a Telegram line the first time a signature hits 10 in a day.

## agent instructions
every agent can add to the war room with a WARROOM block when asked; Percy records
decisions there at the weekly review. Fixer has `inbox/ERRORS.md` and never queues
an error fix on its own.

---

# Addendum — bundle C (day 32): the war room is now goals

The whiteboard is gone. The war room is its own window next to approvals (crimson
dock tile): every goal, where it's heading, Percy's plan + roadmap, and the needle
movers. Run `bridge/goals.sql`. The Command window keeps `today · backlog · ideas ·
weekly review · schedule` only. The desktop Goals widget shows the first four goals
and opens the war room with that goal selected. Light theme ships **paper** (no switcher).

## tables (bridge-owned unless noted)
- `goals`: `id`, `name`, `tag` (impact-chip label), `unit` (`count | AED`), `src`
  (`manual | won-count | won-value | prospects-count | replied-count | calls-count`),
  `model` (`pace | pipeline`), `cur` (bridge keeps current for live `src`), `target`,
  `start`, `due`, `owner` (agent id), `team` (agent ids), `summary` (Percy's),
  `plan_at`, `plan_stale`, `planning` (Percy is writing), `archived`, `sort`,
  `updated_at`. (`label`, `value`, `period` are the old widget columns — read
  `name`/`cur`, write both `cur` and `value` for manual goals.)
- `goal_steps`: `goal_id`, `text`, `agent`, `when_label`, `status`
  (`todo | doing | waiting | done`), `sort`, `backlog_id`, `approval_id`.
- `goal_phases`: `goal_id`, `name`, `agent`, `from_wk`, `to_wk` (weeks from `plan_at`),
  `milestone`, `sort`.
- `goal_snapshots`: `goal_id`, `date`, `value` (one/day, the chart's actual line + 28-day pace).
- `goal_movers`: Percy's movers: `text`, `why`, `agent`, `ask` (message sent to that
  agent when tapped), `impacts` (`[{goal, delta}]`, goal = tag or name),
  `status` (`open | done | dismissed`).

## dashboard writes (direct, service key) → `src/lib/workforce/actions.ts`
- `createGoal(fd)` — insert `goals` (`src: manual` unless a live source is picked),
  then `actions` msg to percy `plan goal <id>`; `planning: true` optimistic (bridge
  clears it when the PLAN lands). suggestion chips: pilots signed → `won-count`,
  revenue signed → `won-value`, new prospects → `prospects-count` (shown `· live`).
- `updateGoal(fd)` — patch; if `target`/`due` changed and steps exist → `plan_stale: true`.
- `replanGoal(id)` — `actions` msg `re-plan goal <id>` + `planning: true`.
- `archiveGoal(id)` — patch `archived: true` (steps/phases stay for history).
- `setGoalValue(id, v)` — manual goal "now at": patch `cur` + `value`. live = read-only.
- `setGoalStepStatus(id, status)` — tap cycles `todo → doing → done`. `waiting` is bridge-set.
- `goalStepToBacklog(fd)` — insert a `backlog` row (title = step text, owner = step agent,
  due from `when_label` if ISO, `source: war room`) + patch the step's `backlog_id`.
- `tapMover(id, agent, ask)` — send that agent `ask` + patch `goal_movers.status: done`.
- `dismissMover(id)` — patch `goal_movers.status: dismissed`.

## tick
`GET /api/os/tick` now returns `goals_updated_at` (replaced `warroom_updated_at`):
max `goals.updated_at`. The bridge bumps it when it clears `planning`, writes
steps/phases, or a live `cur` moves — the window polls this to know a plan landed.

## maths (client-side, in `warroom-types.ts` per README §1b)
`pace` from `goal_snapshots` (value 28 days ago, or oldest if younger), `need`,
projection, likely range, odds, status (`hit | new | on track | at risk | behind`).
Pipeline stage odds from `prospects.stage`: prospect .05, contacted .10, replied .20,
call .25, proposal .30 (+.10 if the proposal row is `viewed`); a deal with a pending
reply approval +.15. deal `v` = `value_aed`, or 1 for count goals. Derived movers
(pending approvals, failed fixes, overdue backlog, held approvals) merge with
`goal_movers`; rank = Σ|Δ|/target × status weight (behind 1.5, at risk 1.2, new 1,
on track .6, hit .2). A mover disappears when its source resolves; `moved today` lists those.

## agents (already on the VPS)
Each agent gets `inputs/GOALS.md`; Percy answers `plan goal` / `re-plan goal` with a
PLAN block the bridge turns into steps + phases, updates manual numbers with GOAL
blocks, and raises MOVER blocks. Nothing in the UI calls a model.
