import { redirect } from "next/navigation";

// Telegram/bridge deep link → open the OS with that approval selected.
export default async function ApprovalDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard?win=approvals&id=${encodeURIComponent(id)}`);
}
