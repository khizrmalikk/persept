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

export default Kicker;
