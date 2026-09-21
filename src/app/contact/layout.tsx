import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — start a project",
  description:
    "Tell Persept about the work that's eating your team's day and we'll tell you what we'd deploy. A Dubai AI workforce studio — email us, book a call, or send a brief.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Persept — start a project",
    description:
      "Bring the problem. Persept, a Dubai AI workforce studio, will tell you what we'd deploy. Email, book a call, or send a brief.",
    url: "https://persept.ai/contact",
    type: "website",
  },
  twitter: {
    title: "Contact Persept — start a project",
    description:
      "Bring the problem. A Dubai AI workforce studio will tell you what we'd deploy.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
