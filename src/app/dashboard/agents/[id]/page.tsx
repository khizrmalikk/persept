import { redirect } from "next/navigation";

// Telegram/bridge deep link → open that agent's page.
export default async function AgentDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // `chief` was renamed to `percy`; keep old Telegram/bridge deep links working.
  const k = id === "chief" ? "percy" : id;
  redirect(`/dashboard?win=agent&k=${encodeURIComponent(k)}`);
}
