import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { HomeClient } from "@/components/sections/home-client";
import { Navbar } from "@/components/sections/navbar";

/*
 * Landing route — a thin server component wrapper. All interactive/motion
 * content lives in <HomeClient> ("use client") so this file stays a server
 * component and can export `metadata` + JSON-LD here directly.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Persept — AI Workforce Studio in Dubai",
  },
  description:
    "Persept is a Dubai AI workforce studio. We build agent teams that run guest operations, reporting and more 24/7 — a staffed outcome, not a tool — and ship GYST, our own product.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Persept — AI Workforce Studio in Dubai",
    description:
      "A Dubai AI workforce studio. Agent teams that run real operations 24/7, sold as a staffed outcome. Plus our own product, GYST.",
    url: "https://persept.ai",
    type: "website",
  },
  twitter: {
    title: "Persept — AI Workforce Studio in Dubai",
    description:
      "A Dubai AI workforce studio. Agent teams that run real operations 24/7. Plus our own product, GYST.",
  },
};

export default function Home() {
  return (
    <main style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <HomeClient />
      <Footer />
    </main>
  );
}
