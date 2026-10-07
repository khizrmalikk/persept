"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import {
  buildOutbound,
  type CampaignAsset,
  type CampaignRules,
  DEFAULT_RULES,
  MUSE_PLATFORMS,
  normDate,
  normSearchQueries,
  parseOutbound,
  slugify,
} from "./outreach";

// Every write from the dashboard is a row in `actions`; the bridge on the VPS turns it into a
// gateway call. Each action re-checks the signed-in user against the allowlist.

async function guard() {
  // Mirror the layout / proxy dev-only auth bypass: with DASHBOARD_AUTH_BYPASS=1
  // in a non-production build there is no signed-in session, so the allowlist
  // check would always fail here and every write action would throw. This branch
  // is inert on Vercel (NODE_ENV=production), so prod still enforces the allowlist.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1"
  )
    return;
  const { allowed } = await currentUser();
  if (!allowed) throw new Error("not allowed");
}

export async function sendMessageFromForm(fd: FormData) {
  await guard();
  const agentId = String(fd.get("agent") ?? "");
  const text = String(fd.get("text") ?? "").trim();
  if (!agentId || !text) return;
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "message", agent_id: agentId, text });
  revalidatePath(`/dashboard/agents/${agentId}`);
}

// Panel quick-actions (pipeline, digest, backlog) send an agent a plain message,
// exactly like sendMessageFromForm — one `actions` row, kind "message", guarded.
// Callable directly from a client handler, or bound as a form action for static
// commands: `action={sendAgentCommand.bind(null, "hunter", `sent ${company}`)}`.
export async function sendAgentCommand(agentId: string, text: string) {
  await guard();
  const id = agentId.trim();
  const body = text.trim();
  if (!id || !body) return;
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "message", agent_id: id, text: body });
  revalidatePath(`/dashboard/agents/${id}`);
}

// FormData wrapper for server-rendered quick-action forms. Composes the command
// from a direct `text`, or a fixed hidden `prefix` plus a free-text `note`.
export async function sendAgentCommandFromForm(fd: FormData) {
  const agentId = String(fd.get("agent") ?? "").trim();
  const direct = String(fd.get("text") ?? "").trim();
  const prefix = String(fd.get("prefix") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  await sendAgentCommand(agentId, direct || `${prefix}${note}`.trim());
}

// Approve / reject an approval. The decision is EXPLICIT — each button binds its
// own action via `formAction`, so it is decided by WHICH button submitted, never
// inferred from a submit-button value (that was fragile with two same-named
// submitters and silently defaulted to "reject", so approvals recorded as rejects).
type DbClient = ReturnType<typeof supabaseAdmin>;

// Core approve/reject for ONE approval, reusable by the single-item forms and by
// bulkApprovals. Reads the approval row for its owning agent + action text (so
// callers don't have to pass them), inserts the decision `action`, flips the
// approval status, and — on approving a "send proposal to <company>" — flips the
// matching proposal to `approved`. Returns the owning agent id for revalidation.
async function decideOne(
  db: DbClient,
  id: number,
  decision: "approve" | "reject",
  note: string | null,
  agentHint?: string,
): Promise<string> {
  const { data: ap } = await db
    .from("approvals")
    .select("action, agent_id")
    .eq("id", id)
    .maybeSingle();
  const row = ap as { action?: string | null; agent_id?: string | null } | null;
  const action = String(row?.action ?? "");
  const agentId =
    (agentHint || "").trim() || (row?.agent_id ?? "").trim() || "chief";

  await db
    .from("actions")
    .insert({ kind: decision, agent_id: agentId, approval_id: id, text: note });
  await db
    .from("approvals")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      decision_note: note,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (decision === "approve" && /^\s*send proposal to/i.test(action)) {
    const company = action
      .trim()
      .replace(/^send proposal to\s*/i, "")
      .split(":")[0]
      .trim();
    if (company) {
      const { data: props } = await db
        .from("proposals")
        .select("id")
        .ilike("company", company)
        .order("updated_at", { ascending: false })
        .limit(1);
      const match = (props as { id: string }[] | null)?.[0];
      if (match) {
        await db
          .from("proposals")
          .update({ status: "approved" })
          .eq("id", match.id);
      }
    }
  }
  return agentId;
}

async function decide(fd: FormData, decision: "approve" | "reject") {
  await guard();
  const id = Number(fd.get("id"));
  const agentHint = String(fd.get("agent") ?? "");
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!id) return;
  const db = supabaseAdmin();
  const agentId = await decideOne(db, id, decision, note, agentHint);

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents/scribe");
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function approveFromForm(fd: FormData) {
  await decide(fd, "approve");
}

export async function rejectFromForm(fd: FormData) {
  await decide(fd, "reject");
}

// Call mode: a spoken utterance is a normal `message` action tagged `[voice call]`
// (the bridge relays it; the agent's guardrail keeps [voice call] replies short and
// spoken). Returns the current newest event id so the call can poll for the reply
// after it. Rejects empty / over-long text (still returns a usable cursor).
export async function sendVoiceUtterance(
  agentId: string,
  text: string,
): Promise<{ afterEventId: number }> {
  await guard();
  const id = agentId.trim();
  const body = text.trim();
  if (id && body && body.length <= 600) {
    await supabaseAdmin()
      .from("actions")
      .insert({ kind: "message", agent_id: id, text: `[voice call] ${body}` });
    revalidatePath(`/dashboard/agents/${id}`);
  }
  return { afterEventId: (await latestEventId(id)) ?? 0 };
}

// Ending a call posts [voice call ended] so the agent writes anything it deferred.
export async function endCall(agentId: string): Promise<void> {
  await guard();
  const id = agentId.trim();
  if (!id) return;
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "message", agent_id: id, text: "[voice call ended]" });
  revalidatePath(`/dashboard/agents/${id}`);
}

// True when the VPS bridge live call channel is configured — the client uses it
// to stream-and-speak; otherwise it falls back to the Supabase reply path.
export async function liveCallAvailable(): Promise<boolean> {
  await guard();
  return !!process.env.BRIDGE_CALL_URL;
}

// Read-only, but guarded like every other action: the id of the newest event for
// an agent, so a call can start its reply cursor from "now" (see call mode).
export async function latestEventId(agentId: string): Promise<number | null> {
  await guard();
  const id = agentId.trim();
  if (!id) return null;
  const { data } = await supabaseAdmin()
    .from("events")
    .select("id")
    .eq("agent_id", id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: number } | null)?.id ?? null;
}

// ── Hunter's outreach: campaigns, assets, owner-sends, hand-offs ───────────────
//
// `campaigns` and `handoffs` are the two tables (besides `actions`) the dashboard
// writes DIRECTLY. `campaigns` is dashboard-owned; the bridge mirrors it into
// Hunter's workspace within a minute. `messages` stays bridge-owned (read only).

// Create or update a campaign, then land on its editor. Dashboard-owned write:
// this is a real row in `campaigns`, not an `actions` command.
export async function saveCampaign(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim() || "untitled campaign";
  const statusRaw = String(fd.get("status") ?? "active");
  const status = ["active", "paused", "archived"].includes(statusRaw)
    ? statusRaw
    : "active";
  const goal = String(fd.get("goal") ?? "").trim();
  const audience = String(fd.get("audience") ?? "").trim();
  const offer = String(fd.get("offer") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();

  const channels = fd
    .getAll("channels")
    .map(String)
    .map((c) => c.trim())
    .filter(Boolean);
  const dailyCap = Number(fd.get("daily_cap"));
  const followUps = [fd.get("follow_up_1"), fd.get("follow_up_2")]
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  const platforms = fd
    .getAll("platforms")
    .map(String)
    .map((p) => p.trim())
    .filter((p) => MUSE_PLATFORMS.includes(p));
  const rules: CampaignRules = {
    channels: channels.length ? channels : [...DEFAULT_RULES.channels],
    daily_cap:
      Number.isFinite(dailyCap) && dailyCap > 0
        ? Math.floor(dailyCap)
        : DEFAULT_RULES.daily_cap,
    follow_up_days: followUps.length
      ? followUps
      : [...DEFAULT_RULES.follow_up_days],
    // one google-maps query per line, trimmed, blanks dropped, max 8.
    search_queries: normSearchQueries(fd.get("search_queries")),
    // muse campaigns: platforms + a run window.
    platforms: [...new Set(platforms)],
    starts: normDate(fd.get("starts")),
    ends: normDate(fd.get("ends")),
  };

  let assets: CampaignAsset[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("assets") ?? "[]"));
    if (Array.isArray(parsed)) assets = parsed as CampaignAsset[];
  } catch {
    assets = [];
  }

  const now = new Date().toISOString();
  const db = supabaseAdmin();
  // agent_id (owner) is set ONLY on create; existing rows keep theirs on edit.
  const row = {
    name,
    status,
    goal,
    audience,
    offer,
    description,
    assets,
    rules,
    updated_at: now,
  };

  let campaignId = id;
  if (id) {
    await db.from("campaigns").update(row).eq("id", id);
  } else {
    const ownerRaw = String(fd.get("owner") ?? "hunter").trim();
    const owner = ownerRaw === "muse" ? "muse" : "hunter";
    const { data } = await db
      .from("campaigns")
      .insert({ ...row, agent_id: owner, created_at: now })
      .select("id")
      .maybeSingle();
    campaignId = (data as { id: string } | null)?.id ?? "";
  }
  revalidatePath("/dashboard/agents/hunter");
  revalidatePath("/dashboard/agents/muse");
  redirect(
    campaignId
      ? `/dashboard/agents/hunter/campaigns/${campaignId}`
      : "/dashboard/agents/hunter",
  );
}

// Delete a campaign. Dashboard-owned write (like saveCampaign): the row is gone
// and the bridge drops its mirrored campaigns/<slug>.md within a minute. Scoped to
// hunter so a stray id can't remove another agent's row. Lands back on the board.
export async function deleteCampaign(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("campaigns")
    .delete()
    .eq("id", rowId)
    .eq("agent_id", "hunter");
  revalidatePath("/dashboard/agents/hunter");
  revalidatePath("/dashboard/agents/hunter/campaigns");
  redirect("/dashboard/agents/hunter/campaigns");
}

// Turn a campaign on or off without deleting it. Dashboard-owned write (like
// saveCampaign): flips `status` between active and paused (archived stays reachable
// via the editor). The bridge mirrors the new status into the agent's workspace
// within a minute, pausing/resuming its runs. Stays on the current page.
export async function setCampaignStatus(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  const statusRaw = String(fd.get("status") ?? "");
  const status = ["active", "paused", "archived"].includes(statusRaw)
    ? statusRaw
    : "paused";
  if (!id) return;
  await supabaseAdmin()
    .from("campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard/agents/hunter");
  revalidatePath("/dashboard/agents/hunter/campaigns");
  revalidatePath(`/dashboard/agents/hunter/campaigns/${id}`);
}

// Stream a campaign asset into the public `campaign-assets` bucket and return its
// public URL. The client adds {title,type,use,url} to the campaign's assets list
// and saves via saveCampaign. Create the bucket once from the Supabase dashboard.
export async function uploadCampaignAsset(
  fd: FormData,
): Promise<{ url: string } | { error: string }> {
  await guard();
  const campaignId = String(fd.get("campaignId") ?? "").trim() || "new";
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "no file" };
  if (file.size > 25 * 1024 * 1024)
    return { error: "file too large (max 25mb)" };

  const type = file.type;
  const allowed =
    type.startsWith("image/") ||
    type === "application/pdf" ||
    type === "video/mp4" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (!allowed) return { error: "unsupported type (images, pdf, mp4, docx)" };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${campaignId}/${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const db = supabaseAdmin();
  const { error } = await db.storage
    .from("campaign-assets")
    .upload(path, bytes, { contentType: type, upsert: true });
  if (error) return { error: error.message };
  const { data } = db.storage.from("campaign-assets").getPublicUrl(path);
  return { url: data.publicUrl };
}

// "send as me": the owner writes a message and the bridge sends it as-is. One
// `actions` row, kind "send", text in the outbound format the bridge parses.
export async function sendOutboundAsOwner(fd: FormData): Promise<void> {
  await guard();
  const channel = String(fd.get("channel") ?? "email").trim() || "email";
  const to = String(fd.get("to") ?? "").trim();
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const campaign = String(fd.get("campaign") ?? "").trim();
  const thread = String(fd.get("thread") ?? "").trim();
  if (!to || !body) return;
  const text = buildOutbound({
    channel,
    to,
    subject,
    thread: thread || undefined,
    campaign: campaign || undefined,
    body,
  });
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "send", agent_id: "hunter", text });
  revalidatePath("/dashboard/agents/hunter");
}

// "edit and send" on an outbound approval: the owner tweaks the draft and the
// bridge sends the edited text as-is (kind "send", carrying the approval_id so
// the bridge closes it), then we mark the approval decided here too.
export async function sendApprovedEdit(fd: FormData): Promise<void> {
  await guard();
  const id = Number(fd.get("id"));
  const agentId = String(fd.get("agent") ?? "hunter").trim() || "hunter";
  const text = String(fd.get("text") ?? "").trim();
  if (!id || !text) return;
  const db = supabaseAdmin();
  await db
    .from("actions")
    .insert({ kind: "send", agent_id: agentId, approval_id: id, text });
  await db
    .from("approvals")
    .update({ status: "sent", decided_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/agents/${agentId}`);
}

// "send back": the owner returns an approval to one or both of the agents that can
// act on it — Scribe (rewrite the draft) and/or Hunter (act on the prospect, e.g.
// move it in the CRM). Each selected agent gets a tailored `message` directive; the
// approval is marked `returned` so it leaves the queue and shows in the decided tab.
// Scribe's revised draft arrives as a fresh pending approval when it is done.
const RETURN_AGENTS = ["scribe", "hunter"] as const;
type ReturnAgent = (typeof RETURN_AGENTS)[number];

async function returnOne(
  db: DbClient,
  id: number,
  recipients: string[],
  note: string,
): Promise<string> {
  const { data } = await db
    .from("approvals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const ap = data as { agent_id?: string | null; draft?: string | null } | null;
  if (!ap) return "hunter";

  const forAgent = (ap.agent_id ?? "hunter").trim() || "hunter";
  const ob = parseOutbound(ap.draft);
  const channel = ob?.channel ?? "";
  const meta = [
    channel && `channel: ${channel}`,
    ob?.to && `to: ${ob.to}`,
    ob?.campaign && `campaign: ${ob.campaign}`,
  ]
    .filter(Boolean)
    .join(", ");
  const body = (ob ? ob.body : (ap.draft ?? "")).trim();

  // keep only known recipients; default to scribe (the old behaviour) if none given
  const recips = RETURN_AGENTS.filter((a) =>
    recipients.includes(a),
  ) as ReturnAgent[];
  if (recips.length === 0) recips.push("scribe");

  if (recips.includes("scribe")) {
    // Directive, unambiguous revise request: Scribe APPLIES the note and re-raises
    // the fixed draft (it does not ask clarifying questions). Same approval + owner.
    const parts: string[] = [
      `the owner reviewed approval #${id} and wants it revised. apply the note below to the draft — change exactly what it asks and leave the rest.`,
      "",
      "owner's note:",
      note || "(no note — tighten the writing and fix any grammar.)",
      "",
    ];
    if (meta) parts.push(`draft meta: ${meta}`);
    parts.push(
      "current draft:",
      body,
      "",
      `make the edit now and re-raise the revised draft as a new approval for ${forAgent} (this replaces approval #${id}). do not reply with questions — apply the note and re-raise. if the note is genuinely impossible, raise the approval anyway with a one-line reason.`,
    );
    await sendAgentCommand("scribe", parts.join("\n"));
  }

  if (recips.includes("hunter")) {
    // Hunter acts on the pipeline/CRM per the note (move the prospect, update stage,
    // re-qualify). Not a rewrite — do the thing the note asks, then confirm.
    const parts: string[] = [
      `the owner reviewed approval #${id} and needs you to act on it in the pipeline. do exactly what the note below asks — for example move the prospect to a different stage, re-qualify it, or update its details in the CRM.`,
      "",
      "owner's note:",
      note ||
        "(no note — re-check this prospect and move it to the right stage.)",
      "",
    ];
    if (meta) parts.push(`context: ${meta}`);
    if (body) parts.push("the draft this relates to:", body, "");
    parts.push(
      "make the change now and confirm what you did in one line. do not send anything outbound — that still waits for the owner.",
    );
    await sendAgentCommand("hunter", parts.join("\n"));
  }

  await db
    .from("approvals")
    .update({
      status: "returned",
      decision_note: note || `sent back to ${recips.join(" & ")}`,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  return forAgent;
}

export async function returnApproval(fd: FormData): Promise<void> {
  await guard();
  const id = Number(fd.get("id"));
  const recipients = fd.getAll("recipients").map(String);
  const note = String(fd.get("note") ?? "").trim();
  if (!id) return;
  const db = supabaseAdmin();
  const forAgent = await returnOne(db, id, recipients, note);

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/agents/${forAgent}`);
  revalidatePath("/dashboard/agents/scribe");
  revalidatePath("/dashboard/agents/hunter");
}

// Back-compat: the old single-destination entry point (always Scribe).
export async function returnApprovalToScribe(fd: FormData): Promise<void> {
  await guard();
  const id = Number(fd.get("id"));
  const note = String(fd.get("note") ?? "").trim();
  if (!id) return;
  const db = supabaseAdmin();
  const forAgent = await returnOne(db, id, ["scribe"], note);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/agents/${forAgent}`);
  revalidatePath("/dashboard/agents/scribe");
}

// Bulk actions over many selected approvals. `op` is one of approve | reject |
// hold | unhold | return. hold/unhold just move the queue state (pending ⇄ held)
// without deciding; the bridge only sends on an explicit approve, so parking an
// item as held simply defers it and un-holding returns it to the waiting queue.
export async function bulkApprovals(fd: FormData): Promise<void> {
  await guard();
  const ids = fd
    .getAll("ids")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  const op = String(fd.get("op") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  const recipients = fd.getAll("recipients").map(String);
  if (!ids.length) return;
  const db = supabaseAdmin();

  for (const id of ids) {
    if (op === "approve" || op === "reject") {
      await decideOne(db, id, op, note || null);
    } else if (op === "return") {
      await returnOne(db, id, recipients, note);
    } else if (op === "hold") {
      await db
        .from("approvals")
        .update({ status: "held" })
        .eq("id", id)
        .eq("status", "pending");
    } else if (op === "unhold") {
      await db
        .from("approvals")
        .update({ status: "pending" })
        .eq("id", id)
        .eq("status", "held");
    }
  }

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agents/scribe");
  revalidatePath("/dashboard/agents/hunter");
}

// ── Manual-channel sends (whatsapp / instagram) ───────────────────────────────
// A `messages` row with status `approved_manual` is one the owner sends himself
// from his phone. "mark sent" tells the owning agent `sent <company>` (so it moves
// the prospect on) and flips the row to `sent` with a fresh ts. `messages` is
// bridge-owned; the dashboard only patches this status, like leads/proposals/posts.
export async function markMessageSent(
  messageId: string,
  agentId: string,
  company: string,
): Promise<void> {
  await guard();
  const id = messageId.trim();
  const aid = agentId.trim() || "hunter";
  if (!id) return;
  const co = company.trim();
  if (co) await sendAgentCommand(aid, `sent ${co}`);
  await supabaseAdmin()
    .from("messages")
    .update({ status: "sent", ts: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/dashboard/agents/${aid}`);
  revalidatePath("/dashboard/agents/hunter/conversations");
}

// Read-only, guarded: the newest event for an agent whose text starts with
// `prefix` (case-insensitive). Used to poll for Scout's "find candidates: …"
// reply after "find candidates now", the same way a call polls for a reply.
export async function latestAgentReply(
  agentId: string,
  prefix: string,
): Promise<{ text: string; ts: string } | null> {
  await guard();
  const id = agentId.trim();
  const p = prefix.trim().toLowerCase();
  if (!id) return null;
  const { data } = await supabaseAdmin()
    .from("events")
    .select("ts, summary, payload")
    .eq("agent_id", id)
    .order("ts", { ascending: false })
    .limit(20);
  for (const row of (data as
    | { ts: string; summary: string | null; payload: unknown }[]
    | null) ?? []) {
    const payloadText = (row.payload as { text?: string } | null)?.text ?? "";
    const text = (payloadText || row.summary || "").trim();
    if (text.toLowerCase().startsWith(p)) return { text, ts: row.ts };
  }
  return null;
}

// Hand-offs: mark an open hand-off done or dropped. Direct write to `handoffs`
// (the one table besides `actions`/`campaigns` the dashboard updates).
async function setHandoff(id: string, status: "done" | "dropped") {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin().from("handoffs").update({ status }).eq("id", rowId);
  revalidatePath("/dashboard/agents/hunter");
  revalidatePath("/dashboard");
}

export async function handoffDoneFromForm(fd: FormData) {
  await setHandoff(String(fd.get("id") ?? ""), "done");
}

export async function handoffDropFromForm(fd: FormData) {
  await setHandoff(String(fd.get("id") ?? ""), "dropped");
}

// ── Chief's backlog: create / edit / complete / drop / reopen ─────────────────
// `backlog` is DASHBOARD-WRITABLE (like `handoffs`/`campaigns`): the dashboard
// writes rows directly; agents also change rows through the bridge (BACKLOG
// blocks), so a row can appear/change without the dashboard. Every write guards.

function backlogFields(fd: FormData) {
  const title = String(fd.get("title") ?? "").trim();
  const detail = String(fd.get("detail") ?? "").trim();
  const owner = String(fd.get("owner") ?? "owner").trim() || "owner";
  const dueRaw = String(fd.get("due") ?? "").trim();
  const due = /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null;
  const prRaw = String(fd.get("priority") ?? "normal");
  const priority = ["high", "normal", "low"].includes(prRaw) ? prRaw : "normal";
  return { title, detail, owner, due, priority };
}

function revalidateBacklog() {
  revalidatePath("/dashboard/agents/chief");
  revalidatePath("/dashboard");
}

export async function addBacklogItem(fd: FormData): Promise<void> {
  await guard();
  const f = backlogFields(fd);
  if (!f.title) return;
  const now = new Date().toISOString();
  await supabaseAdmin()
    .from("backlog")
    .insert({
      ...f,
      status: "open",
      source: "dashboard",
      created_at: now,
      updated_at: now,
    });
  revalidateBacklog();
}

export async function updateBacklogItem(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  const f = backlogFields(fd);
  if (!id || !f.title) return;
  await supabaseAdmin()
    .from("backlog")
    .update({ ...f, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidateBacklog();
}

async function setBacklog(id: string, status: "open" | "done" | "dropped") {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const now = new Date().toISOString();
  await supabaseAdmin()
    .from("backlog")
    .update({
      status,
      updated_at: now,
      done_at: status === "done" ? now : null,
    })
    .eq("id", rowId);
  revalidateBacklog();
}

export async function backlogDoneFromForm(fd: FormData) {
  await setBacklog(String(fd.get("id") ?? ""), "done");
}
export async function backlogDropFromForm(fd: FormData) {
  await setBacklog(String(fd.get("id") ?? ""), "dropped");
}
export async function backlogReopenFromForm(fd: FormData) {
  await setBacklog(String(fd.get("id") ?? ""), "open");
}

// ── Scout's leads → Hunter prospects ──────────────────────────────────────────
// `leads` is BRIDGE-owned; the dashboard only flips `status`. "accept" also sends
// Hunter an `add prospect: …` command through the existing sendAgentCommand path,
// so a company Scout found becomes a Hunter prospect in one click.

function revalidateLeads() {
  revalidatePath("/dashboard/agents/scout");
  revalidatePath("/dashboard/agents/hunter");
  revalidatePath("/dashboard");
}

export async function acceptLead(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const db = supabaseAdmin();

  const { data } = await db
    .from("leads")
    .select("*")
    .eq("id", rowId)
    .maybeSingle();
  const lead = data as Record<string, string> | null;
  if (!lead || lead.status !== "suggested") return; // already handled / gone

  // campaign: the lead's own slug, else the first active Hunter campaign's slug.
  let slug = String(lead.campaign ?? "").trim();
  if (!slug) {
    const { data: camps } = await db
      .from("campaigns")
      .select("name")
      .eq("agent_id", "hunter")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1);
    const first = (camps as { name: string }[] | null)?.[0];
    slug = first ? slugify(first.name) : "";
  }

  const fields = [
    lead.company,
    lead.contact,
    lead.channel,
    lead.website,
    lead.angle,
  ]
    .map((f) => String(f ?? "").trim())
    .join(", ");
  const campaignPart = slug ? ` (campaign: ${slug})` : "";
  const evidence = [lead.evidence, lead.source_url]
    .map((f) => String(f ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const msg = `add prospect: ${fields}${campaignPart} — from scout: ${evidence}`
    .replace(/\s+/g, " ")
    .trim();

  await sendAgentCommand("hunter", msg);
  await db.from("leads").update({ status: "sent_to_hunter" }).eq("id", rowId);
  revalidateLeads();
}

export async function dismissLead(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("leads")
    .update({ status: "dismissed" })
    .eq("id", rowId);
  revalidateLeads();
}

// ── Scribe's proposals: mark accepted/declined, send via Hunter ───────────────
// `proposals` is BRIDGE-owned; the dashboard only patches `status`/`sent_at` (and
// view fields on the public page). See docs/workforce-dashboard.md.

export async function setProposalStatus(
  id: string,
  status: "accepted" | "declined",
): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId || !["accepted", "declined"].includes(status)) return;
  await supabaseAdmin().from("proposals").update({ status }).eq("id", rowId);
  revalidatePath("/dashboard/agents/scribe");
}

// "send via hunter": tell Hunter to email the proposal's public link; Hunter drafts
// the two-line email as an approval in the normal way. Then mark it sent.
export async function sendProposalViaHunter(
  id: string,
  recipient: string,
): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const db = supabaseAdmin();
  const { data } = await db
    .from("proposals")
    .select("*")
    .eq("id", rowId)
    .maybeSingle();
  const p = data as Record<string, string> | null;
  if (!p || p.status === "draft") return; // must be approved or later

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${site.replace(/\/+$/, "")}/p/${p.token}`;
  const to = (recipient || p.contact || "").trim();
  const toPart = to ? ` (to: ${to})` : "";
  await sendAgentCommand(
    "hunter",
    `send the proposal to ${p.company}: ${link}${toPart}`,
  );
  await db
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", rowId);
  revalidatePath("/dashboard/agents/scribe");
  revalidatePath("/dashboard/agents/hunter");
}

// ── Muse's marketing/content: posts, images, stats ────────────────────────────
// Approving a Muse draft is an ordinary approve (the bridge publishes a
// linkedin-post or records an instagram-post as approved-for-manual). The extra
// writes here are: upload an image for a draft, mark a manual post posted, and
// record stats — each also tells Muse (a `message` action) so it learns.
// `posts` is BRIDGE-owned; the dashboard only updates `status`/`stats`.

function revalidateMuse() {
  revalidatePath("/dashboard/agents/muse");
  revalidatePath("/dashboard");
}

// Upload an image for a draft into the campaign-assets bucket under posts/, then
// tell Muse `image for <slug>: <url>` so it re-raises the approval with the image.
export async function uploadPostImage(
  fd: FormData,
): Promise<{ url: string } | { error: string }> {
  await guard();
  const slug = String(fd.get("slug") ?? "").trim();
  const file = fd.get("file");
  if (!slug) return { error: "no slug" };
  if (!(file instanceof File) || file.size === 0) return { error: "no file" };
  if (file.size > 25 * 1024 * 1024)
    return { error: "file too large (max 25mb)" };
  if (!file.type.startsWith("image/")) return { error: "images only" };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `posts/${slug}/${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const db = supabaseAdmin();
  const { error } = await db.storage
    .from("campaign-assets")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) return { error: error.message };
  const { data } = db.storage.from("campaign-assets").getPublicUrl(path);
  await sendAgentCommand("muse", `image for ${slug}: ${data.publicUrl}`);
  revalidateMuse();
  return { url: data.publicUrl };
}

// "posted" on an approved-for-manual (instagram) post: flip its status and tell
// Muse `posted <slug>` so it stops nudging and starts watching for stats.
export async function markPostPostedFromForm(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  const slug = String(fd.get("slug") ?? "").trim();
  if (!id) return;
  await supabaseAdmin()
    .from("posts")
    .update({ status: "posted_by_owner" })
    .eq("id", id);
  if (slug) await sendAgentCommand("muse", `posted ${slug}`);
  revalidateMuse();
}

// Save the numbers a post earned to `posts.stats` and tell Muse `stats <slug>:
// <numbers>` so it learns what worked. Blank fields are dropped, not zeroed.
export async function savePostStatsFromForm(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  const slug = String(fd.get("slug") ?? "").trim();
  if (!id) return;
  const keys = ["impressions", "reactions", "comments", "replies"] as const;
  const stats: Record<string, number> = {};
  for (const k of keys) {
    const raw = String(fd.get(k) ?? "").trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) stats[k] = Math.floor(n);
  }
  if (Object.keys(stats).length === 0) return;
  await supabaseAdmin().from("posts").update({ stats }).eq("id", id);
  if (slug) {
    const summary = keys
      .filter((k) => k in stats)
      .map((k) => `${k} ${stats[k]}`)
      .join(", ");
    await sendAgentCommand("muse", `stats ${slug}: ${summary}`);
  }
  revalidateMuse();
}

// ── Knowledge base: upload / edit / remove ────────────────────────────────────
// `knowledge_files` is DASHBOARD-owned; the bridge mirrors each row into every
// listed agent's workspace as memory/knowledge/<slug>.md within two minutes and
// removes it on `deleted_at`. It reads the `text` column, so extraction happens
// HERE on upload (pdf-parse for pdf, mammoth for docx, plain read otherwise). The
// file goes to the private `knowledge` bucket at <id>/<filename>.

const KNOWLEDGE_AGENT_IDS = ["scribe", "hunter", "muse", "chief", "scout"];
const KNOWLEDGE_MAX_BYTES = 15 * 1024 * 1024;

function knowledgeExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

// Server-side text extraction. Returns trimmed text, or null when nothing could
// be read (unsupported, empty, or a parser error) — the row is still inserted.
async function extractKnowledgeText(
  bytes: Uint8Array,
  filename: string,
): Promise<string | null> {
  const ext = knowledgeExt(filename);
  try {
    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      const res = await parser.getText();
      await parser.destroy?.();
      const t = (res?.text ?? "").trim();
      return t || null;
    }
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      const t = (res?.value ?? "").trim();
      return t || null;
    }
    if (ext === "md" || ext === "markdown" || ext === "txt" || ext === "csv") {
      const t = Buffer.from(bytes).toString("utf8").trim();
      return t || null;
    }
  } catch {
    return null;
  }
  return null;
}

function revalidateKnowledge() {
  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/agents/scribe");
}

export async function uploadKnowledgeFile(
  fd: FormData,
): Promise<{ ok: true } | { error: string }> {
  await guard();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "no file" };
  if (file.size > KNOWLEDGE_MAX_BYTES)
    return { error: "file too large (max 15mb)" };
  const ext = knowledgeExt(file.name);
  if (!["pdf", "docx", "md", "markdown", "txt", "csv"].includes(ext))
    return { error: "unsupported type (pdf, docx, md, txt, csv)" };

  const title =
    String(fd.get("title") ?? "").trim() ||
    file.name.replace(/\.[a-z0-9]+$/i, "").trim() ||
    file.name;
  const summary = String(fd.get("summary") ?? "").trim();
  const agents = fd
    .getAll("agents")
    .map(String)
    .map((a) => a.trim())
    .filter((a) => KNOWLEDGE_AGENT_IDS.includes(a));
  const agentIds = agents.length ? [...new Set(agents)] : ["scribe"];

  const id = crypto.randomUUID();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${id}/${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const db = supabaseAdmin();
  const { error: upErr } = await db.storage
    .from("knowledge")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (upErr) return { error: upErr.message };

  const text = await extractKnowledgeText(bytes, file.name);
  const now = new Date().toISOString();
  const { error: insErr } = await db.from("knowledge_files").insert({
    id,
    title,
    path,
    mime: file.type || "",
    bytes: file.size,
    text,
    summary,
    agent_ids: agentIds,
    created_at: now,
    updated_at: now,
  });
  if (insErr) return { error: insErr.message };
  revalidateKnowledge();
  return { ok: true };
}

export async function updateKnowledgeFile(fd: FormData): Promise<void> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return;
  const title = String(fd.get("title") ?? "").trim() || "untitled";
  const summary = String(fd.get("summary") ?? "").trim();
  const agents = fd
    .getAll("agents")
    .map(String)
    .map((a) => a.trim())
    .filter((a) => KNOWLEDGE_AGENT_IDS.includes(a));
  const agentIds = agents.length ? [...new Set(agents)] : ["scribe"];
  await supabaseAdmin()
    .from("knowledge_files")
    .update({
      title,
      summary,
      agent_ids: agentIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidateKnowledge();
}

// "remove": soft-delete only. Sets deleted_at + updated_at; the bridge removes the
// workspace copy on seeing deleted_at. The row (and text) are kept for the record.
export async function removeKnowledgeFile(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const now = new Date().toISOString();
  await supabaseAdmin()
    .from("knowledge_files")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", rowId);
  revalidateKnowledge();
}

// ── Ideas inbox: dismiss ──────────────────────────────────────────────────────
// `ideas` is BRIDGE-owned; the dashboard only flips `status` (like leads). Dismiss
// records the reason and stamps the decision. "ask chief" is a plain sendAgentCommand
// from the client (`decide idea <short_id> now`), so it needs no action here.
export async function dismissIdea(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("ideas")
    .update({
      status: "dismiss",
      reason: "dismissed by owner",
      decided_at: new Date().toISOString(),
    })
    .eq("id", rowId);
  revalidatePath("/dashboard/agents/chief");
  revalidatePath("/dashboard");
}
