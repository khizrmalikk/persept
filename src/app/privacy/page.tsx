import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";

export const metadata: Metadata = {
  title: { absolute: "Privacy policy · Persept" },
  description:
    "Persept's privacy policy. For how we handle your business data day to day, see the Trust page.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <div className="pl" id="top">
      <PlNav base="/" />
      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Privacy policy</div>
          <h1 className="pl-h2-big">Privacy policy</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            Our full privacy policy is being prepared. In the meantime, the{" "}
            <Link href="/trust" className="pl-amber">
              Trust page
            </Link>{" "}
            sets out what we store, where it is hosted and how you can export or
            delete it. Questions:{" "}
            <a href="mailto:khizr@persept.ai" className="pl-amber">
              khizr@persept.ai
            </a>
            .
          </p>
        </div>
      </header>
      <PlFooter />
    </div>
  );
}
