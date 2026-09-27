# Design notes, tech, and hard constraints

Read this before implementing a redesign. **Everything visual is free to change.**
A short list of things must not change because they are the product's contract with
its backend and its security model.

---

## Tech stack

- **Next.js 16** (App Router, `src/` layout), **React 19**, **TypeScript strict**.
- **Tailwind v4** + plain CSS. **Biome** for lint/format (`npm run lint`, `npm run format`).
- **Framer Motion** and **Three.js/R3F** are available (used on marketing + the office).
- **Supabase** (the "workforce" project) for dashboard data.
- Path alias `@/*` → `./src/*`.

Run locally: `npm install` then `npm run dev` (localhost:3000). The dashboard is
behind auth; for local design work set `DASHBOARD_AUTH_BYPASS=1` in dev to skip
the email allowlist. `npm run build` must pass before shipping.

---

## Current design languages (three, today)

1. **Dashboard — "command deck" dark** (the main redesign target). Scoped under
   `.wf` in `src/app/dashboard/workforce.css`. Near-black with a single green accent:
   - bg `#060609`, surfaces `#101016` / `#191921` / `#23232d`
   - text `#f5f6f8` / `#a2a7b4` / `#5f636e`
   - accent green `#4ade80` (ink `#86efac`), lines `rgba(255,255,255,.07/.15)`
   - semantic: ok/live cyan `#22d3ee`, warn amber `#ffc23d`, err red `#ff4d6a`
   - radii 6/8/10, fonts: Neue Haas (sans) + Geist Mono (mono)
2. **Marketing — new "cinematic" dark** (the freshly redesigned landing + contact).
   Scoped under `.pl` in `src/components/sections/landing.css`. Near-black `#0e0d0c`
   + **amber** `oklch(0.8 0.14 70)`, one light band `#f4f1ec`. Fonts: **Archivo**
   (headlines), **Geist** (body), **JetBrains Mono** (eyebrows/labels).
3. **Marketing — old light** (`/projects`, `/about`, GYST). Warm paper `#f7f2ea`,
   clay accent `#cf5a34`. Being phased out.

A likely redesign direction: unify the dashboard and the new marketing look so the
product feels like one surface (the landing already shows agents + an approvals
inbox in the amber-on-black style). But the dashboard palette is yours to set.

---

## What is FIXED (do not break)

These are the backend contract and security model. Visuals can change; these cannot.

1. **The approval model is the product.** Agents draft; the owner approves, edits,
   or rejects. Every page must keep a human between a draft and anything that
   spends money, grants access, or sends an outbound message. Do not add
   "auto-send" or hide the approve step.
2. **Data contract.** The dashboard **reads** `agents`, `events`, `tasks`,
   `approvals`, `messages`, `campaigns`, `handoffs`, `backlog`, `leads`,
   `proposals`, `posts`, and mirrored `agent_files`. It **writes** only through
   server actions in `src/lib/workforce/actions.ts`, mostly by inserting `actions`
   rows (kinds `message` / `approve` / `reject` / `send`) that a VPS "bridge" then
   executes. Keep the columns and these action kinds. Adding columns is fine.
3. **Server components + service key stay server-side.** Pages are server
   components; reads use `supabaseAdmin()` (service key) in server code only — it is
   **never** exposed to the browser. Client components import server modules with
   `import type` only.
4. **Every write is guarded.** All server actions call `guard()` (re-checks the
   signed-in user against the allowlist). Keep that on any new write.
5. **Auth plumbing untouched.** `src/proxy.ts`, `src/app/auth/`, `src/app/login/`,
   `src/lib/supabase/server.ts`. `/login` must stay **outside** `/dashboard`.
6. **Styling scope.** Dashboard styles live under `.wf`; the marketing dark look
   under `.pl`. Keep the redesign scoped so surfaces don't leak into each other.

---

## What is FREE to change

- All layout, colour, type, spacing, iconography, motion, and copy tone.
- The pixel-office art and how the office home is composed (keep the six-room idea;
  the art itself is replaceable). Per-agent colour can be pushed much further.
- Whether agent pages keep the three-column shape or move to something new — as long
  as chat, the agent's work panels, and its approvals are all reachable.
- Charts, empty states, and the insights page.

---

## Behaviour to preserve

- **Live feel.** Dashboard pages re-render every ~6s (a timer today; Supabase
  Realtime is the intended replacement). The office and the approvals queue should
  feel live.
- **Honest empty states.** Many panels are empty in this seed because the bridge
  tables are sparse. Empty states must explain what will appear ("no proposals yet;
  after a call, tell scribe: proposal for <company>: <notes>"), not look broken.
- **Owner voice.** Dashboard copy is lowercase, short, plain; no exclamation marks;
  each agent keeps its emoji. Marketing voice is set by the new landing.

---

## Priorities / taste (from the owner)

- Solo founder, close to a sales demo. Ship **small, visible** improvements; this
  dashboard **is** the demo, so it must look like a **product, not an admin panel**.
- Not wanted: multi-user roles, per-viewer settings, or heavy new state libraries.
- Good targets: make the approvals inbox and the office home feel premium; unify
  the agent pages; strengthen per-agent identity; polish empty states.

---

## File map (where things live, for the implementer)

- Dashboard pages: `src/app/dashboard/**` · shared components `src/app/dashboard/_components/**`
- Dashboard styles: `src/app/dashboard/workforce.css` (all under `.wf`)
- Server reads: `src/lib/workforce/*.ts` · server writes: `src/lib/workforce/actions.ts`
- Marketing landing/contact: `src/components/sections/persept-landing.tsx`,
  `office-panel.tsx`, `pl-chrome.tsx`, `landing.css`; pages `src/app/page.tsx`, `src/app/contact/`
- Old marketing design tokens: `src/app/design-system.css`
- Full data/architecture reference: `docs/workforce-dashboard.md` in the repo.
