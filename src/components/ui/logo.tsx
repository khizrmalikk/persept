import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Persept mark — the official brand logo (`persept-logo` handoff): an amber
 * "slash" (tall parallelogram) with a bar across the top. The slash is always
 * amber (#f2a93b ≈ oklch(0.8 0.14 70)); the bar uses `currentColor` so it
 * follows the surrounding text — cream on dark surfaces, near-black on light.
 * `size` is the mark HEIGHT in px; width follows the 136.6 : 125.56 ratio.
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
      width={Math.round((size * 136.6) / 125.56)}
      height={size}
      viewBox="0 0 136.6 125.56"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#f2a93b"
        d="M27.37,119.56L96.19,1.97c.71-1.22,2.02-1.97,3.44-1.97h32.97c3.08,0,5,3.35,3.44,6l-69.05,117.59c-.72,1.22-2.02,1.97-3.44,1.97H30.81c-3.08,0-4.99-3.34-3.44-6Z"
      />
      <path
        fill="currentColor"
        d="M95.24,0H3.94C.67,0-1.17,3.76.83,6.34l19.74,25.49c.75.96,1.89,1.53,3.11,1.53h52.04"
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
