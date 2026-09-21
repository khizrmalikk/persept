import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work — one AI service, one product",
  description:
    "What Persept builds: the Hotel AI Workforce, our flagship AI operations service for property hospitality, and GYST, our live job-search product. Two things, both real.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Persept's work — one AI service, one product",
    description:
      "The Hotel AI Workforce, our flagship AI operations service, and GYST, our live job-search product. Built in Dubai, run in production.",
    url: "https://persept.ai/projects",
    type: "website",
  },
  twitter: {
    title: "Persept's work — one AI service, one product",
    description:
      "The Hotel AI Workforce and GYST. Built in Dubai, run in production.",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
