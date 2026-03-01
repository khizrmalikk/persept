import type { Metadata } from "next";
import { SolutionPage } from "@/components/sections/solution-page";

export const metadata: Metadata = {
  title: "AI Workforce for Hotels | Stop the Chaos | Persept",
  description:
    "Hotel operations don't have to feel like chaos. Our AI workforce handles guest communication, reviews, scheduling, and reporting — so your team can focus on guests.",
  keywords: [
    "hotel AI",
    "hotel automation",
    "AI workforce",
    "Dubai hotel technology",
    "hotel operations AI",
    "guest communication automation",
  ],
};

export default function Page() {
  return <SolutionPage />;
}
