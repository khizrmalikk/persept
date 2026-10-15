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
  // Attached images arrive as one or more signed URLs (see uploadChatImage); a
  // message is just `text`, so each image is inlined as a markdown image line.
  // The bridge relays the composed text verbatim and the agent fetches the link.
  const images = fd
    .getAll("image")
    .map(String)
    .map((u) => u.trim())
    .filter(Boolean);
  if (!agentId || (!text && !images.length)) return;
  const body = [text, ...images.map((u) => `![image](${u})`)]
    .filter(Boolean)
    .join("\n\n");
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "message", agent_id: agentId, text: body });
  revalidatePath(`/dashboard/agents/${agentId}`);
}

// Stash an image OR file the owner is attaching to a chat message in the PRIVATE
// `knowledge` bucket under chat/<agentId>/, then mint a time-limited signed URL.
// There's no attachment column in the bridge contract — a message is one `actions`
// row with `text` — so the composer inlines this URL into the message (an image as
// a markdown image, a file as a markdown link; see the chat composer) and the agent
// fetches it. Stays private: the link expires, so a leaked url doesn't live forever.
// The agent polls and fetches within minutes, well inside the TTL.
const CHAT_FILE_MAX_BYTES = 25 * 1024 * 1024;
const CHAT_FILE_URL_TTL = 60 * 60 * 24 * 7; // 7 days
// non-image types the owner can hand an agent in chat (no executables).
const CHAT_FILE_EXTS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "txt",
  "md",
  "json",
  "rtf",
  "zip",
];

export async function uploadChatFile(
  fd: FormData,
): Promise<
  { url: string; name: string; isImage: boolean } | { error: string }
> {
  await guard();
  const agentId = String(fd.get("agent") ?? "").trim();
  const file = fd.get("file");
  if (!agentId) return { error: "no agent" };
  if (!(file instanceof File) || file.size === 0) return { error: "no file" };
  if (file.size > CHAT_FILE_MAX_BYTES)
    return { error: "file too large (max 25mb)" };
  const isImage = file.type.startsWith("image/");
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (!isImage && !CHAT_FILE_EXTS.includes(ext))
    return { error: "images, pdf, office docs, csv/txt/md, json or zip only" };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `chat/${agentId}/${crypto.randomUUID()}-${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const db = supabaseAdmin();
  const { error: upErr } = await db.storage
    .from("knowledge")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (upErr) return { error: upErr.message };
  const { data, error: signErr } = await db.storage
    .from("knowledge")
    .createSignedUrl(path, CHAT_FILE_URL_TTL);
  if (signErr || !data?.signedUrl)
    return { error: signErr?.message ?? "could not sign the file url" };
  return { url: data.signedUrl, name: file.name, isImage };
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

// Direct status patches (day-39: `backlog.status` is the single source of truth).
// ✓ done = the owner marking it done by hand (records done_by + a result line);
// ✕ drop = `dropped`; "open" reopens. The bridge owns `started|doing|blocked|
// stalled` via BACKLOG blocks — the dashboard never sets those.
async function setBacklog(id: string, status: "open" | "done" | "dropped") {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status, updated_at: now };
  if (status === "done") {
    patch.done_at = now;
    patch.done_by = "owner";
    patch.result = "marked done by the owner";
  }
  await supabaseAdmin().from("backlog").update(patch).eq("id", rowId);
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

// "start"/"start again" a backlog item (day-39): hand the task off through Chief
// with the exact `start backlog <uuid>[: note]` command. The bridge marks the row
// `started`, sends the TASK to the owner agent directly, and tells Chief; the card
// moves on the next tick. We do NOT touch `status` here — the bridge owns it.
export async function startBacklogItem(
  id: string,
  note?: string,
): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  const n = (note ?? "").trim();
  await sendAgentCommand("chief", `start backlog ${rowId}${n ? `: ${n}` : ""}`);
  revalidateBacklog();
}

// Re-assign a backlog item to a different owner. If it had already been handed off
// (started|doing), reset it to `open` so the new agent gets a fresh start.
export async function reassignBacklog(
  id: string,
  owner: string,
): Promise<void> {
  await guard();
  const rowId = id.trim();
  const o = owner.trim().toLowerCase();
  if (!rowId || !o) return;
  const db = supabaseAdmin();
  const { data } = await db
    .from("backlog")
    .select("status")
    .eq("id", rowId)
    .maybeSingle();
  const status = String((data as { status?: string } | null)?.status ?? "");
  const patch: Record<string, unknown> = {
    owner: o,
    updated_at: new Date().toISOString(),
  };
  if (status === "started" || status === "doing") patch.status = "open";
  await db.from("backlog").update(patch).eq("id", rowId);
  revalidateBacklog();
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

// Core accept: send Hunter the "add prospect:" message and flip the lead to
// sent_to_hunter, stamped as an owner decision. Used by the owner's accept and by
// undoing a Chief dismiss (which accepts regardless of current status).
async function acceptLeadCore(
  db: DbClient,
  rowId: string,
  lead: Record<string, string>,
): Promise<void> {
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
  await db
    .from("leads")
    .update({
      status: "sent_to_hunter",
      decided_by: "owner",
      decided_at: new Date().toISOString(),
    })
    .eq("id", rowId);
  revalidateLeads();
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
  await acceptLeadCore(db, rowId, lead);
}

// "add all": accept every supplied lead in one go. acceptLead is a no-op for a
// lead that is already handled, so this is safe to call with the whole list.
export async function acceptLeads(ids: string[]): Promise<void> {
  await guard();
  for (const id of ids) {
    await acceptLead(id);
  }
}

export async function dismissLead(id: string, reason = ""): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("leads")
    .update({
      status: "dismissed",
      decided_by: "owner",
      decided_at: new Date().toISOString(),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    })
    .eq("id", rowId);
  revalidateLeads();
}

// Undo a lead Chief ACCEPTED: dismiss it and tell Hunter to park it.
export async function undoChiefAccept(
  id: string,
  company: string,
): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("leads")
    .update({
      status: "dismissed",
      decided_by: "owner",
      decided_at: new Date().toISOString(),
      reason: "undone by owner",
    })
    .eq("id", rowId);
  const co = company.trim();
  if (co)
    await sendAgentCommand(
      "hunter",
      `park ${co}: the owner reversed chief's accept`,
    );
  revalidateLeads();
}

// Undo a lead Chief DISMISSED: accept it (same add-prospect path as a normal
// owner accept), regardless of its current status.
export async function undoChiefDismiss(id: string): Promise<void> {
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
  if (!lead) return;
  await acceptLeadCore(db, rowId, lead);
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

// ── Fixer: projects + fixes ───────────────────────────────────────────────────
// `projects` is DASHBOARD-owned (like `campaigns`): the bridge watches updated_at
// and rewrites the runner config + Fixer's PROJECTS.md within two minutes, so
// EVERY write bumps updated_at. `fixes` stays bridge-owned (read only); the
// dashboard only retries a failed one via a plain message.

function linesToList(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// accept "owner/name" or a GitHub URL; store as "owner/name".
function normRepo(raw: string): string {
  const r = raw.trim();
  const m = r.match(/github\.com[/:]([^/]+\/[^/.\s]+)(?:\.git)?\/?$/i);
  if (m) return m[1];
  return r.replace(/\.git$/i, "");
}

export async function saveProject(fd: FormData): Promise<void> {
  await guard();
  const create = String(fd.get("create") ?? "") === "1";
  const name = String(fd.get("name") ?? "").trim() || "untitled project";
  const rawId = String(fd.get("id") ?? "").trim();
  const id = (create ? rawId || slugify(name) : rawId).trim();
  if (!id) return;

  const deployRaw = String(fd.get("deploy") ?? "");
  const deploy =
    deployRaw === "vercel" ? "vercel" : deployRaw === "flag" ? "flag" : null;
  const cadence =
    String(fd.get("research_cadence") ?? "none") === "weekly"
      ? "weekly"
      : "none";

  const row = {
    name,
    repo: normRepo(String(fd.get("repo") ?? "")),
    default_branch: String(fd.get("default_branch") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim(),
    notes: String(fd.get("notes") ?? "").trim(),
    checks: linesToList(fd.get("checks")),
    allowed_tools: linesToList(fd.get("allowed_tools")),
    dev: String(fd.get("dev") ?? "").trim(),
    url: String(fd.get("url") ?? "").trim(),
    login: {
      path: String(fd.get("login_path") ?? "").trim(),
      email_selector: String(fd.get("login_email_selector") ?? "").trim(),
      password_selector: String(fd.get("login_password_selector") ?? "").trim(),
      submit_selector: String(fd.get("login_submit_selector") ?? "").trim(),
      env: String(fd.get("login_env") ?? "").trim(),
    },
    deploy,
    vercel_project_id: String(fd.get("vercel_project_id") ?? "").trim(),
    research_cadence: cadence,
    enabled: String(fd.get("enabled") ?? "") === "on",
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  if (create) {
    await db
      .from("projects")
      .insert({ ...row, id, created_at: new Date().toISOString() });
  } else {
    await db.from("projects").update(row).eq("id", id);
  }
  revalidatePath("/dashboard/agents/fixer");
  revalidatePath("/dashboard/knowledge");
}

// OS dev-window variant of saveProject: create or update a project WITHOUT the
// redirect (the window stays open and re-pulls via the tick), returning the id so
// the panel can select it. Create derives a unique slug id from the name. Same
// `projects` columns + `vercel_project_id`; the bridge mirrors the row to the
// runner within two minutes (so updated_at is always bumped).
export async function upsertProjectOS(
  fd: FormData,
): Promise<{ id: string } | { error: string }> {
  await guard();
  const create = String(fd.get("create") ?? "") === "1";
  const name = String(fd.get("name") ?? "").trim() || "untitled project";
  const rawId = String(fd.get("id") ?? "").trim();
  const id = (create ? rawId || slugify(name) : rawId).trim();
  if (!id) return { error: "give the project a name" };

  const deployRaw = String(fd.get("deploy") ?? "");
  const deploy =
    deployRaw === "vercel" ? "vercel" : deployRaw === "flag" ? "flag" : null;
  const cadence =
    String(fd.get("research_cadence") ?? "none") === "weekly"
      ? "weekly"
      : "none";

  const row = {
    name,
    repo: normRepo(String(fd.get("repo") ?? "")),
    default_branch: String(fd.get("default_branch") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim(),
    notes: String(fd.get("notes") ?? "").trim(),
    checks: linesToList(fd.get("checks")),
    allowed_tools: linesToList(fd.get("allowed_tools")),
    dev: String(fd.get("dev") ?? "").trim(),
    url: String(fd.get("url") ?? "").trim(),
    login: {
      path: String(fd.get("login_path") ?? "").trim(),
      email_selector: String(fd.get("login_email_selector") ?? "").trim(),
      password_selector: String(fd.get("login_password_selector") ?? "").trim(),
      submit_selector: String(fd.get("login_submit_selector") ?? "").trim(),
      env: String(fd.get("login_env") ?? "").trim(),
    },
    deploy,
    vercel_project_id: String(fd.get("vercel_project_id") ?? "").trim(),
    research_cadence: cadence,
    enabled: String(fd.get("enabled") ?? "") === "on",
    updated_at: new Date().toISOString(),
  };

  const db = supabaseAdmin();
  if (create) {
    const { data: existing } = await db
      .from("projects")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing) return { error: `a project “${id}” already exists` };
    const { error } = await db
      .from("projects")
      .insert({ ...row, id, created_at: new Date().toISOString() });
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("projects").update(row).eq("id", id);
    if (error) return { error: error.message };
  }
  revalidatePath("/dashboard");
  return { id };
}

// "research now": queue Fixer a research pass on the project.
export async function researchProjectNow(
  id: string,
  name: string,
): Promise<void> {
  await guard();
  const pid = id.trim();
  if (!pid) return;
  const spec =
    "Survey the codebase: write docs/ARCHITECTURE.md and CLAUDE.md if they are missing; otherwise list the three most valuable improvements (dependency updates, better or cheaper APIs, architecture, user-visible gaps) with evidence and effort.";
  const msg = `FIX REQUEST\nproject: ${pid}\nkind: research\ntitle: research pass on ${name.trim() || pid}\nspec: ${spec}`;
  await sendAgentCommand("fixer", msg);
}

// retry a failed fix — a plain message the runner picks up.
export async function retryFix(shortId: string): Promise<void> {
  await guard();
  const sid = shortId.trim();
  if (!sid) return;
  await sendAgentCommand("fixer", `retry fix ${sid}`);
}

// ── Knowledge base: upload / edit / remove ────────────────────────────────────
// `knowledge_files` is DASHBOARD-owned; the bridge mirrors each row into every
// listed agent's workspace as memory/knowledge/<slug>.md within two minutes and
// removes it on `deleted_at`. It reads the `text` column, so extraction happens
// HERE on upload (pdf-parse for pdf, mammoth for docx, plain read otherwise). The
// file goes to the private `knowledge` bucket at <id>/<filename>.

const KNOWLEDGE_AGENT_IDS = [
  "scribe",
  "hunter",
  "muse",
  "chief",
  "scout",
  "fixer",
];
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
  const project = String(fd.get("project") ?? "").trim();
  // a file attached to a Fixer project defaults to the fixer agent if no agent
  // was ticked; a general file defaults to scribe.
  const agentIds = agents.length
    ? [...new Set(agents)]
    : project
      ? ["fixer"]
      : ["scribe"];

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
    project: project || null,
    created_at: now,
    updated_at: now,
  });
  if (insErr) return { error: insErr.message };
  revalidateKnowledge();
  if (project) revalidatePath("/dashboard/agents/fixer");
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

// ── Persept OS actions ────────────────────────────────────────────────────────
// Writes the dashboard (Persept OS) windows need that weren't covered by the
// existing actions. All guarded. The dashboard re-pulls via router.refresh()
// (driven by the tick), so these don't revalidate a static path.

// Create a campaign without the redirect saveCampaign does (which would leave the
// dashboard). Returns the new id so the window can open it. Dashboard-owned write.
export async function createCampaign(
  owner: string,
): Promise<{ id: string } | { error: string }> {
  await guard();
  const agent = owner === "muse" ? "muse" : "hunter";
  const now = new Date().toISOString();
  const rules: CampaignRules = {
    channels: [...DEFAULT_RULES.channels],
    daily_cap: DEFAULT_RULES.daily_cap,
    follow_up_days: [...DEFAULT_RULES.follow_up_days],
    search_queries: [],
    platforms: [],
    starts: "",
    ends: "",
  };
  const { data, error } = await supabaseAdmin()
    .from("campaigns")
    .insert({
      name: "new campaign",
      status: "draft",
      goal: "",
      audience: "",
      offer: "",
      description: "",
      assets: [],
      rules,
      agent_id: agent,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  return { id: (data as { id: string } | null)?.id ?? "" };
}

// Edit an existing campaign in place (no redirect, unlike saveCampaign). Patches
// the columns + merges the `rules` jsonb (so channels/follow_up_days/dates are
// preserved). Never touches id/slug — a rename patches `name` only; the bridge
// keys the mirrored campaigns/<slug>.md by id. `notes` is best-effort (the column
// may not exist in every schema) so it never fails the main save.
export async function updateCampaign(
  fd: FormData,
): Promise<{ ok: true } | { error: string }> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return { error: "no id" };
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("campaigns")
    .select("rules")
    .eq("id", id)
    .maybeSingle();
  const prev = ((existing as { rules?: Partial<CampaignRules> } | null)
    ?.rules ?? {}) as Partial<CampaignRules>;

  const ownerRaw = String(fd.get("owner") ?? "hunter").trim();
  const owner = ownerRaw === "muse" ? "muse" : "hunter";
  const statusRaw = String(fd.get("status") ?? "active");
  const status = ["active", "paused", "archived"].includes(statusRaw)
    ? statusRaw
    : "active";
  const dailyCap = Number(fd.get("daily_cap"));
  const platforms = fd
    .getAll("platforms")
    .map(String)
    .flatMap((p) => p.split(/[\n,]/))
    .map((p) => p.trim())
    .filter((p) => MUSE_PLATFORMS.includes(p));

  const rules: CampaignRules = {
    channels: prev.channels ?? [...DEFAULT_RULES.channels],
    daily_cap:
      Number.isFinite(dailyCap) && dailyCap > 0
        ? Math.floor(dailyCap)
        : (prev.daily_cap ?? DEFAULT_RULES.daily_cap),
    follow_up_days: prev.follow_up_days ?? [...DEFAULT_RULES.follow_up_days],
    search_queries: normSearchQueries(fd.get("search_queries")),
    platforms: [...new Set(platforms)],
    starts: prev.starts ?? "",
    ends: prev.ends ?? "",
  };

  const row = {
    name: String(fd.get("name") ?? "").trim() || "untitled campaign",
    agent_id: owner,
    status,
    description: String(fd.get("description") ?? "").trim(),
    goal: String(fd.get("goal") ?? "").trim(),
    rules,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("campaigns").update(row).eq("id", id);
  if (error) return { error: error.message };

  // notes is optional — patch it separately so a missing column can't fail the save
  const notes = String(fd.get("notes") ?? "").trim();
  try {
    await db.from("campaigns").update({ notes }).eq("id", id);
  } catch {
    // no notes column in this schema; ignore
  }
  return { ok: true };
}

// Set an agent's monthly budget (USD). Direct patch of agents.budget_usd — the
// owner sets this on the permissions tab (day-30 contract).
export async function setAgentBudget(
  agentId: string,
  usd: number,
): Promise<void> {
  await guard();
  const id = agentId.trim();
  const budget = Number.isFinite(usd) && usd >= 0 ? Math.round(usd) : 0;
  if (!id) return;
  await supabaseAdmin()
    .from("agents")
    .update({ budget_usd: budget })
    .eq("id", id);
}

// Permissions tab model picker: send Chief a CONFIG block naming the tier. The
// bridge resolves the tier (cheap|routine|judgment) to a concrete gateway model
// and writes it back to agents.model — the UI never names a model string.
export async function setAgentModelTier(
  agentId: string,
  tier: "cheap" | "routine" | "judgment",
): Promise<void> {
  await guard();
  const id = agentId.trim();
  if (!id || !["cheap", "routine", "judgment"].includes(tier)) return;
  await sendAgentCommand(
    "chief",
    `CONFIG\nagent: ${id}\nmodel: ${tier}\nwhy: owner, permissions tab`,
  );
}

// Runs & logs tab "restart <Agent>": one `actions` message with the text `restart`.
// The bridge resets that agent's main session (memory files stay) and writes a
// `system` event the log then shows. Confirmed in the UI before calling.
export async function restartAgent(agentId: string): Promise<void> {
  await guard();
  const id = agentId.trim();
  if (!id) return;
  await supabaseAdmin()
    .from("actions")
    .insert({ kind: "message", agent_id: id, text: "restart" });
  revalidatePath(`/dashboard/agents/${id}`);
}

// Dismiss a rolled-up error from the Dev tab: patch errors.state = 'ignored'
// (day-31 contract). "ask Fixer to fix" goes through sendAgentCommand already.
export async function ignoreError(id: string): Promise<void> {
  await guard();
  const rowId = id.trim();
  if (!rowId) return;
  await supabaseAdmin()
    .from("errors")
    .update({ state: "ignored" })
    .eq("id", rowId);
}

// ── War room: goals, steps, movers (day-32 contract) ──────────────────────────
// The war room replaces the old whiteboard. `goals`, `goal_steps`, `goal_phases`,
// `goal_snapshots`, `goal_movers` are the tables. The dashboard writes `goals`,
// `goal_steps`, `goal_movers` and `backlog` DIRECTLY (service key, no anon RLS);
// planning itself is Chief's, driven by a `plan goal <id>` message on `actions`.
// goal_phases/goal_snapshots are bridge-owned (read only here). No redirect: the
// windows re-pull via the tick's `goals_updated_at`.

const GOAL_SRC = [
  "manual",
  "won-count",
  "won-value",
  "prospects-count",
  "replied-count",
  "calls-count",
] as const;

// Create a goal, then ask Chief to plan it. `src: manual` unless the owner picked
// a live source (the bridge keeps `cur` current for live sources). We optimistically
// set `planning: true`; the bridge flips it false when the PLAN lands. For manual
// goals we write both the new `cur`/`name` and the old widget `value`/`label`.
export async function createGoal(
  fd: FormData,
): Promise<{ id: string } | { error: string }> {
  await guard();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "no name" };
  const tag = String(fd.get("tag") ?? "").trim() || name.toLowerCase();
  const unit = String(fd.get("unit") ?? "count") === "AED" ? "AED" : "count";
  const srcRaw = String(fd.get("src") ?? "manual");
  const src = (GOAL_SRC as readonly string[]).includes(srcRaw)
    ? srcRaw
    : "manual";
  const model =
    String(fd.get("model") ?? "pace") === "pipeline" ? "pipeline" : "pace";
  const owner = String(fd.get("owner") ?? "chief").trim() || "chief";
  const team = fd
    .getAll("team")
    .map(String)
    .map((a) => a.trim())
    .filter(Boolean);
  const target = Number(fd.get("target"));
  const cur = Number(fd.get("cur"));
  const start = String(fd.get("start") ?? "").trim() || null;
  const due = String(fd.get("due") ?? "").trim() || null;

  const db = supabaseAdmin();
  const { data: top } = await db
    .from("goals")
    .select("sort")
    .order("sort", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort = ((top as { sort?: number } | null)?.sort ?? 0) + 1;

  const value = Number.isFinite(cur) ? cur : 0;
  const { data, error } = await db
    .from("goals")
    .insert({
      name,
      label: name,
      tag,
      unit,
      src,
      model,
      owner,
      team,
      target: Number.isFinite(target) ? target : 0,
      cur: value,
      value,
      start,
      due,
      planning: true,
      archived: false,
      sort,
    })
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  const id = (data as { id: string } | null)?.id ?? "";
  if (id) await sendAgentCommand("chief", `plan goal ${id}`);
  return { id };
}

// Edit a goal's plan-affecting fields. If `target` or `due` changed and the goal
// already has steps, mark the plan stale (the owner can then "re-plan"). `cur` is
// edited separately (setGoalValue) — a manual goal's "now at" field.
export async function updateGoal(
  fd: FormData,
): Promise<{ ok: true } | { error: string }> {
  await guard();
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return { error: "no id" };
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("goals")
    .select("target, due")
    .eq("id", id)
    .maybeSingle();
  const prev = existing as { target?: number; due?: string | null } | null;

  const name = String(fd.get("name") ?? "").trim() || "untitled goal";
  const tag = String(fd.get("tag") ?? "").trim() || name.toLowerCase();
  const owner = String(fd.get("owner") ?? "chief").trim() || "chief";
  const team = fd
    .getAll("team")
    .map(String)
    .map((a) => a.trim())
    .filter(Boolean);
  const target = Number(fd.get("target"));
  const due = String(fd.get("due") ?? "").trim() || null;

  const targetChanged =
    Number.isFinite(target) && target !== (prev?.target ?? null);
  const dueChanged = due !== (prev?.due ?? null);

  let hasSteps = false;
  if (targetChanged || dueChanged) {
    const { count } = await db
      .from("goal_steps")
      .select("id", { count: "exact", head: true })
      .eq("goal_id", id);
    hasSteps = (count ?? 0) > 0;
  }

  const { error } = await db
    .from("goals")
    .update({
      name,
      label: name,
      tag,
      owner,
      team,
      target: Number.isFinite(target) ? target : (prev?.target ?? 0),
      due,
      ...(hasSteps ? { plan_stale: true } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

// "re-plan": ask Chief to redo the plan for a goal. Sets planning optimistically.
export async function replanGoal(id: string): Promise<void> {
  await guard();
  const goalId = id.trim();
  if (!goalId) return;
  const db = supabaseAdmin();
  await db
    .from("goals")
    .update({ planning: true, plan_stale: false })
    .eq("id", goalId);
  await sendAgentCommand("chief", `re-plan goal ${goalId}`);
}

// "remove": archive only — steps and phases stay for history.
export async function archiveGoal(id: string): Promise<void> {
  await guard();
  const goalId = id.trim();
  if (!goalId) return;
  await supabaseAdmin()
    .from("goals")
    .update({ archived: true })
    .eq("id", goalId);
}

// Manual goal's "now at": patch both the new `cur` and the old widget `value`.
// Live goals are read-only here (the bridge keeps `cur`), so the window only shows
// this field for manual goals.
export async function setGoalValue(id: string, value: number): Promise<void> {
  await guard();
  const goalId = id.trim();
  if (!goalId || !Number.isFinite(value)) return;
  await supabaseAdmin()
    .from("goals")
    .update({ cur: value, value })
    .eq("id", goalId);
}

// Tap a step to advance it: todo → doing → done (the client cycles and sends the
// next status). `waiting` is bridge-set (a step following an approval), so we only
// accept the owner-settable states.
export async function setGoalStepStatus(
  id: string,
  status: "todo" | "doing" | "done",
): Promise<void> {
  await guard();
  const stepId = id.trim();
  if (!stepId || !["todo", "doing", "done"].includes(status)) return;
  await supabaseAdmin().from("goal_steps").update({ status }).eq("id", stepId);
}

// "→ backlog": turn a step into a Chief backlog item (owner = the step's agent,
// due parsed from `when_label` if it is an ISO date), then link it back on the step.
// The bridge marks the step done when the backlog item is done.
export async function goalStepToBacklog(fd: FormData): Promise<void> {
  await guard();
  const stepId = String(fd.get("stepId") ?? "").trim();
  const text = String(fd.get("text") ?? "").trim();
  const agent = String(fd.get("agent") ?? "owner").trim() || "owner";
  const whenLabel = String(fd.get("when_label") ?? "").trim();
  if (!stepId || !text) return;
  const due = /^\d{4}-\d{2}-\d{2}$/.test(whenLabel) ? whenLabel : null;
  const now = new Date().toISOString();
  const db = supabaseAdmin();
  const { data } = await db
    .from("backlog")
    .insert({
      title: text,
      owner: agent,
      due,
      priority: "normal",
      status: "open",
      source: "war room",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();
  const backlogId = (data as { id: string } | null)?.id ?? "";
  if (backlogId)
    await db
      .from("goal_steps")
      .update({ backlog_id: backlogId })
      .eq("id", stepId);
  revalidateBacklog();
}

// Chief's needle movers (`goal_movers`). Tapping one with an `ask` sends that agent
// the message and marks the mover done; "dismiss" just dismisses it. (Derived movers
// — pending approvals, failed fixes, overdue backlog — resolve via their own source
// action, not here.)
export async function tapMover(
  id: string,
  agent: string,
  ask: string,
): Promise<void> {
  await guard();
  const moverId = id.trim();
  if (!moverId) return;
  const db = supabaseAdmin();
  const a = agent.trim();
  const text = ask.trim();
  if (a && text) await sendAgentCommand(a, text);
  await db.from("goal_movers").update({ status: "done" }).eq("id", moverId);
}

export async function dismissMover(id: string): Promise<void> {
  await guard();
  const moverId = id.trim();
  if (!moverId) return;
  await supabaseAdmin()
    .from("goal_movers")
    .update({ status: "dismissed" })
    .eq("id", moverId);
}
