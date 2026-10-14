import type { Metadata } from "next";
import { Archivo, Geist, JetBrains_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { signOut } from "@/lib/workforce/auth-actions";
import { OSProvider } from "./_components/os-store";
import "./os.css";

// Persept OS — the workforce dashboard. Full-screen desktop surface on wide
// screens; below 1280px the page hands off to the mobile app (chat with Chief +
// approvals). Same Supabase magic-link allowlist (see proxy.ts + currentUser).

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});
const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persept OS",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function OSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, email, allowed } = await currentUser();
  const devAuthBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.DASHBOARD_AUTH_BYPASS === "1";

  if (!devAuthBypass && user && !allowed) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "#0b0a09",
          color: "#f4f1ec",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ color: "#8a847b", margin: 0 }}>persept os</p>
          <h1 style={{ fontWeight: 800 }}>not on the list</h1>
          <p style={{ color: "#b9b3aa" }}>
            {email} is signed in but not allowed here.
          </p>
          <form action={signOut}>
            <button type="submit">sign out</button>
          </form>
        </div>
      </div>
    );
  }
  if (!devAuthBypass && !user) redirect("/login?next=/dashboard");

  const fontVars = `${archivo.variable} ${geist.variable} ${jbmono.variable}`;

  // The page renders the desktop (wide) + the mobile app (<1280px) inside the
  // provider's root, so both have the OS context + server data.
  return (
    <div className={fontVars}>
      <OSProvider>{children}</OSProvider>
    </div>
  );
}
