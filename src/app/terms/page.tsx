import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";

export const metadata: Metadata = {
  title: { absolute: "Terms · Persept" },
  description:
    "Persept's terms of service. For how we handle your business data, see the Trust page.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <div className="pl" id="top">
      <PlNav base="/" />
      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Terms</div>
          <h1 className="pl-h2-big">Terms of service</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            Our full terms are being prepared and are confirmed in the
            engagement agreement for each deployment. For how we handle your
            data, see the{" "}
            <Link href="/trust" className="pl-amber">
              Trust page
            </Link>
            . Questions:{" "}
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
