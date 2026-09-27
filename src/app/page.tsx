import type { Metadata } from "next";
import { PerseptLanding } from "@/components/sections/persept-landing";

/*
 * Landing route: the single-page cinematic redesign. The static markup is a
 * server component; only the hero "office" simulation is a client island.
 */
const DESCRIPTION =
  "Hire an AI workforce and keep the final say. Named agents run outreach, replies, proposals and reports 24/7. A person presses send. Book a 15-minute call.";

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
    <main>
      <PerseptLanding />
    </main>
  );
}
