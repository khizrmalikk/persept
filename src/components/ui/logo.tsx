import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Persept mark — the official brand logo (v13 "9k" handoff): two square-ended
 * bars crossing like an opened compass, forming a 7, with a pin punched through
 * the crossing. It is always ONE colour on one ground — the mark fills with
 * `currentColor`, so set the colour on the parent (Signal `#ff5a1f` on black,
 * `#0c0c0c` on Signal/white, white on dark photos).
 * `size` is the mark HEIGHT in px; width follows the 79.38 : 84 ratio.
 */
export function PerseptMark({
  size = 22,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={Math.round((size * 79.38) / 84)}
      height={size}
      viewBox="10.31 8 79.38 84"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z" />
      <path
        fillRule="evenodd"
        d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
      />
    </svg>
  );
}

// backwards-compatible alias (older imports used LogoMark)
export const LogoMark = PerseptMark;

/**
 * Full lockup — mark + "Persept" wordmark (Archivo 800, -0.02em). `lab` appends
 * the mono "/ Studio" tag. The bar follows `--ink` via currentColor on the row.
 */
export function Logo({
  className,
  size = 22,
  lab = false,
}: {
  className?: string;
  size?: number;
  lab?: boolean;
}) {
  return (
    <span
      className={cn("flex items-center gap-2.5", className)}
      style={{ color: "var(--ink)" }}
    >
      <PerseptMark size={size} />
      <span
        className="text-[16px] font-extrabold tracking-[-0.02em]"
        style={{ color: "var(--ink)" }}
      >
        Persept
      </span>
      {lab && (
        <span
          className="mono-label hidden sm:inline"
          style={{ letterSpacing: "0.12em", color: "var(--ink-faint)" }}
        >
          /&nbsp;Studio
        </span>
      )}
    </span>
  );
}

export default Logo;
