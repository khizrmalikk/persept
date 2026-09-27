import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — book a consultation",
  description:
    "Tell Persept about the repetitive work eating your week and we'll point to where an agent helps. A Dubai AI workforce studio — book a consultation, email us, or send a brief.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Persept — book a consultation",
    description:
      "Bring the busywork. Persept, a Dubai AI workforce studio, will point to where agents help. Book a consultation, email, or send a brief.",
    url: "https://persept.ai/contact",
    type: "website",
  },
  twitter: {
    title: "Contact Persept — book a consultation",
    description:
      "Bring the busywork. A Dubai AI workforce studio will point to where agents help.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
