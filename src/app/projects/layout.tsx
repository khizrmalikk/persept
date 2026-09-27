import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work — AI agents for business, plus GYST",
  description:
    "What Persept builds: AI agents that take over repetitive small-business work — shown through a holiday-home operator as one worked example — and GYST, our live job-search product. Two things, both real.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Persept's work — AI agents for business, plus GYST",
    description:
      "AI agents for repetitive small-business work, with a holiday-home operator as one worked example, and GYST, our live product. Built in Dubai, run in production.",
    url: "https://persept.ai/projects",
    type: "website",
  },
  twitter: {
    title: "Persept's work — AI agents for business, plus GYST",
    description:
      "AI agents for small-business work, a worked example, and GYST. Built in Dubai, run in production.",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
