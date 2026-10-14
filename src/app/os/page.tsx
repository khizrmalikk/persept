import { redirect } from "next/navigation";

// The OS moved to /dashboard. Keep /os as a temporary redirect (for a month) so
// any old bookmarks / links still land on the dashboard.
export default function OSRedirect() {
  redirect("/dashboard");
}
