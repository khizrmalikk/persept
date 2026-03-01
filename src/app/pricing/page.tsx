import type { Metadata } from "next";
import { PricingPage } from "@/components/sections/pricing";

export const metadata: Metadata = {
  title: "AI Automation Pricing for Hotels & Restaurants | Persept",
  description:
    "Transparent pricing for AI-powered hotel automation. Plans starting at $49.5K/year. Save 35+ hours/week with our AI workforce. No commission on bookings.",
  keywords: [
    "hotel AI pricing",
    "AI automation cost",
    "hotel technology pricing",
    "Dubai hotel AI",
    "PMS integration cost",
  ],
};

export default function Page() {
  return <PricingPage />;
}
