import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — a Dubai AI workforce studio",
  description:
    "Persept is an early AI workforce studio in Dubai. We find real operational friction, build agent teams that run it 24/7, and ship our own products. Problem-led, high craft.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Persept — a Dubai AI workforce studio",
    description:
      "An early AI workforce studio in Dubai. We build agent teams that take on real operational work and ship our own products. Small team, high craft.",
    url: "https://persept.ai/about",
    type: "website",
  },
  twitter: {
    title: "About Persept — a Dubai AI workforce studio",
    description:
      "An early AI workforce studio in Dubai. Agent teams that run real operational work, plus our own products.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
