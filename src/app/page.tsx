import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { HomeClient } from "@/components/sections/home-client";
import { Navbar } from "@/components/sections/navbar";

/*
 * Landing route: a thin server component wrapper. All interactive/motion
 * content lives in <HomeClient> ("use client") so this file stays a server
 * component and can export `metadata` + JSON-LD here directly.
 */
const DESCRIPTION =
  "named agents run the repetitive work of a small business 24/7: outreach, replies, proposals, reports. you press send. book a 15-minute call.";

export const metadata: Metadata = {
  title: {
    absolute: "Persept · an AI workforce for your business",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Persept · an AI workforce for your business",
    description: DESCRIPTION,
    url: "https://persept.ai",
    type: "website",
    images: [{ url: "/images/og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Persept · an AI workforce for your business",
    description: DESCRIPTION,
    images: ["/images/og.png"],
  },
};

export default function Home() {
  return (
    <main className="theme-dark" style={{ backgroundColor: "var(--paper)" }}>
      <Navbar />
      <HomeClient />
      <Footer />
    </main>
  );
}
