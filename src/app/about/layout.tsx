import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — a Dubai AI workforce studio",
  description:
    "Persept is an early AI workforce studio in Dubai. We set up AI agents that take over the repetitive work small businesses would otherwise hire for, consult on where agents help, and ship our own products. Problem-led, high craft.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Persept — a Dubai AI workforce studio",
    description:
      "An early AI workforce studio in Dubai. We set up practical AI agents for small businesses, consult on where they help, and ship our own products. Small team, high craft.",
    url: "https://persept.ai/about",
    type: "website",
  },
  twitter: {
    title: "About Persept — a Dubai AI workforce studio",
    description:
      "An early AI workforce studio in Dubai. Practical AI agents for small businesses, consultations, plus our own products.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
