import type { Metadata } from "next";
import { SolutionPage } from "@/components/sections/solution-page";

export const metadata: Metadata = {
  title: "Hotel AI Workforce | Persept",
  description:
    "AI agents that handle guest communication, manage reviews, and automate hotel operations 24/7.",
};

export default function Page() {
  return <SolutionPage />;
}
