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
  await supabaseAdmin().from("actions").insert({ kind: "message", agent_id: agentId, text });
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function decideFromForm(fd: FormData) {
  await guard();
  const id = Number(fd.get("id"));
  const agentId = String(fd.get("agent") ?? "chief");
  const decision = String(fd.get("decision")) === "approve" ? "approve" : "reject";
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!id) return;
  const db = supabaseAdmin();
  await db.from("actions").insert({ kind: decision, agent_id: agentId, approval_id: id, text: note });
  await db.from("approvals").update({ status: decision === "approve" ? "approved" : "rejected", decision_note: note, decided_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
}
