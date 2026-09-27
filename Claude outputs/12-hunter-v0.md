# Hunter v0 — Outbound Sales Agent

*Persept working doc — September 18, 2026. Day 6 of doc 07. Files in `persept-workforce-day6.tar.gz`.*

## What it is

Hunter works a prospect list and turns it into discovery calls. Every weekday at 09:00 it reads `PROSPECTS.md`, does the follow-ups that are due, then drafts up to five first touches, one APPROVAL REQUEST per message, each containing the channel, the recipient, the subject line and the complete text in the house style. You approve in the dashboard and send; then you tell Hunter "sent La Brisa" and it advances the cadence (day 3 nudge, day 7 last touch, then parked). When a reply comes in you tell it "reply from Vogue: <text>"; it classifies the reply, updates the row, and drafts the response, proposing three call slots from the availability windows in `OFFER.md` when someone is interested.

It never sends. It never books. It never offers a price in writing. Its tools are read, write, edit and a single-page `web_fetch` of a prospect's homepage to find one specific opening line. It runs on the Sonnet tier because draft quality is the whole job.

Three files are the ones you'll edit. `OFFER.md` is the pitch, the proof points it is allowed to use (nothing it can't back), the AED 6,000 pilot and the objection answers from the July playbook, plus your call availability. `PROSPECTS.md` is seeded with the thirteen verified operators from July in the Group A / B / C send order and the named P2s, with `next_due` dates staggered over the first five days so the first runs are small. `MEMORY.md` is where it accumulates what got replies.

One deliberate difference from Chief and Scout: Hunter's daily job runs in its main session, not an isolated one, because the bridge reads main-session history and that is how approval requests reach the inbox. The bridge is also updated to parse several APPROVAL REQUEST blocks from one message, since a daily run produces up to eight.

## Install

Same as before: `scp` the bundle, unpack over `/srv/workforce`, then

```bash
cd /srv/workforce && chmod +x scripts/*.sh scripts/render.py automations/*.sh
./scripts/deploy.sh
```

`deploy.sh` in this bundle carries the bridge fixes you applied by hand, so it is safe to let it overwrite. It will render Hunter, register its API key, create `hunter-daily-run` (09:00 Asia/Dubai, Sunday to Thursday), rebuild the bridge, and restart. The bridge log should show `agents synced: chief, scout, hunter`.

## First run, by hand

Don't wait for 09:00. Open Hunter's page in the dashboard and send: "run the daily run now". Within a minute or two the Approvals inbox should show two or three requests (the Group A prospects are dated today), each a complete message. Read them as a founder would. The questions that matter: does each opener mention something true and specific about the company, is it under 110 words, does it sound like you, does it make one small ask. Send Hunter corrections in plain language ("too long", "drop the payroll line", "sign off without Persept") and it will redraft and remember.

When one is right, send it yourself from your own email or WhatsApp, then tell Hunter "sent La Brisa". Watch the row change in `PROSPECTS.md` (Hunter's page shows the chat; the file is on the VPS at `~/.openclaw/workspace-hunter/PROSPECTS.md`).

## Editing the list

Add anyone from any industry: tell Hunter "add prospect: Name, company, channel, contact, why they fit" or edit `agents/hunter/PROSPECTS.md` in the repo and redeploy. Redeploy does not overwrite the live `PROSPECTS.md` once Hunter has written to it; it is treated like memory. To reseed from the repo, delete the live file first.

## What is deliberately not here yet

Sending through Gmail or WhatsApp APIs (Hunter earns that once you trust its drafts), reading replies from your inbox automatically (a Gmail watcher, same condition), calendar booking (it proposes, you confirm), and LinkedIn automation (never; account risk).

## Next

Call-mode voice per agent (the continuous-conversation design from yesterday), then sub-agents exposed to the bridge for the constellation view, then Fixer and the deck.
