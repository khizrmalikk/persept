import { redirect } from "next/navigation";

// Telegram/bridge deep link → open dev → changes with the fix in view.
export default async function FixDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard?win=dev&tab=changes&id=${encodeURIComponent(id)}`);
}
