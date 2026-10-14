import { redirect } from "next/navigation";

// Telegram/bridge deep link → open that agent's page.
export default async function AgentDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard?win=agent&k=${encodeURIComponent(id)}`);
}
