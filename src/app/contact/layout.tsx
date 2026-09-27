import type { Metadata } from "next";

const DESC =
  "Tell me where the time goes and I'll tell you which parts an agent could take. Persept is a Dubai AI workforce studio. Send a note or book a 15-minute call.";

export const metadata: Metadata = {
  title: "Contact · book a 15-minute call",
  description: DESC,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Persept · book a 15-minute call",
    description: DESC,
    url: "https://persept.ai/contact",
    type: "website",
  },
  twitter: {
    title: "Contact Persept · book a 15-minute call",
    description: DESC,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
