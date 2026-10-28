import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/landing.css";
import "./guides.css";
import { PlFooter, PlNav } from "@/components/sections/pl-chrome";
import { publishedGuides } from "@/lib/guides";

const DESCRIPTION =
  "Plain-spoken guides to AI agents for Dubai businesses: what an AI workforce does, what it costs, where it fits, and the one rule that keeps it safe.";

export const metadata: Metadata = {
  title: { absolute: "Guides · Persept" },
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Guides · Persept",
    description: DESCRIPTION,
    url: "https://persept.ai/guides",
    type: "website",
  },
};

export default function GuidesIndex() {
  const guides = publishedGuides();

  return (
    <div className="pl" id="top">
      <PlNav base="/" />

      <header className="pl-hero pl-thero pl-trust-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-inner">
          <div className="pl-eyebrow pl-hero-eyebrow amber">Guides</div>
          <h1 className="pl-h2-big">AI, minus the hand-waving</h1>
          <p className="pl-lead" style={{ marginTop: 28 }}>
            Short, honest guides to putting AI agents to work in a Dubai
            business — what they do, what they cost, and where a person still
            needs to press send. No hype, no jargon you have to decode.
          </p>
        </div>
      </header>

      <section className="pl-section pl-trust">
        <div className="pl-trust-inner">
          <div className="g-grid">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="g-card">
                <div className="g-card-eyebrow">{g.eyebrow}</div>
                <h2 className="g-card-title">{g.title}</h2>
                <p className="g-card-excerpt">{g.excerpt}</p>
              </Link>
            ))}
          </div>
          <p className="g-soon">
            More guides on the way — hospitality, pricing, real estate and the
            case for keeping a human in the loop.
          </p>
        </div>
      </section>

      <PlFooter />
    </div>
  );
}
