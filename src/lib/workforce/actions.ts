"use server";

import { revalidatePath } from "next/cache";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";

// Every write from the dashboard is a row in `actions`; the bridge on the VPS turns it into a
// gateway call. Each action re-checks the signed-in user against the allowlist.

async function guard() {
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
async function decide(fd: FormData, decision: "approve" | "reject") {
  await guard();
  const id = Number(fd.get("id"));
  const agentId = String(fd.get("agent") ?? "chief");
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!id) return;
  const db = supabaseAdmin();
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
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
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
