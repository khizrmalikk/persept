import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ApertureGlyph — the brand's mark in miniature: concentric rings resolving on
 * a focal dot. Used as the lead glyph on kickers and as a small graphic accent.
 * Inherits `currentColor` so it re-tints with the theme.
 */
export function ApertureGlyph({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <circle cx="8" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="8" cy="8" r="1.15" fill="currentColor" />
    </svg>
  );
}

/**
 * Kicker — the signature section eyebrow. Aperture glyph + a warm, normal-case
 * label. Replaces the old "001 / SECTION" monospace tell.
 */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("kicker", className)}>
      <ApertureGlyph size={14} className="kicker__glyph" />
      {children}
    </span>
  );
}

/**
 * SectionMarker — an oversized, hairline editorial numeral used beside a
 * heading for magazine-like rhythm. Replaces the mono section index.
 */
export function SectionMarker({ n }: { n: string }) {
  return (
    <span className="figure-mark" aria-hidden="true">
      {n}
    </span>
  );
}

/**
 * SectionHead — the shared section header used across every page for a
 * consistent rhythm: an optional oversized figure numeral, an aperture kicker,
 * a display headline, and an optional lead paragraph. `meta` renders a
 * right-aligned slot (e.g. a mono caption or sparkline) on wide screens.
 * Pass `align="center"` for centered CTA-style heads.
 *
 * Every headline is an <h2> by default; pass `as` to override for pages that
 * need a different level (never used for the page <h1>, which each hero owns).
 */
export function SectionHead({
  n,
  kicker,
  title,
  lead,
  meta,
  as: Tag = "h2",
  headingSize = "clamp(2rem,4.8vw,3.5rem)",
  className,
}: {
  n?: string;
  kicker: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  as?: "h2" | "h3";
  headingSize?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-start sm:gap-10",
        className,
      )}
    >
      {n && <SectionMarker n={n} />}
      <div className="max-w-3xl">
        <Kicker className="mb-4">{kicker}</Kicker>
        <Tag className="display" style={{ fontSize: headingSize }}>
          {title}
        </Tag>
        {lead && (
          <p
            className="mt-5 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            {lead}
          </p>
        )}
      </div>
      {meta && (
        <div className="hidden shrink-0 sm:ml-auto sm:block">{meta}</div>
      )}
    </div>
  );
}

export default Kicker;
