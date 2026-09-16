import { cn } from "@/lib/utils";

/**
 * Persept logomark — the official brand mark (`public/brand/mark/`): a
 * monoline "P" tracing an open circle. Inlined here so the strokes inherit
 * `currentColor` (set to --ink) and stay theme-aware instead of being locked
 * to the SVG's baked-in ink color.
 */
export function LogoMark({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="10.73 9.54 138.54 138.54"
      fill="none"
      className={className}
      style={{ color: "var(--ink)" }}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="butt"
        strokeMiterlimit="10"
        strokeLinejoin="miter"
        fill="none"
      >
        <path
          transform="matrix(1,0,0,-1,120.3275,29.162796)"
          d="M0 0C-1.354 1.059-2.791 1.989-4.23 2.915-5.832 3.563-7.439 4.186-9.012 4.883-9.121 4.884-9.231 4.885-9.341 4.885L-79.71-100.829C-79.58-100.974-79.455-101.122-79.339-101.277-77.385-102.418-75.39-103.502-73.427-104.648-72.575-105.145-71.752-105.683-70.94-106.236-70.333-106.609-69.751-107.015-69.198-107.463-69.012-107.6-68.829-107.74-68.644-107.877-68.125-107.984-67.614-108.11-67.112-108.258L2.915-3.057C2.034-1.951 1.122-.877 0 0Z"
        />
        <path
          transform="matrix(1,0,0,-1,140.5173,55.538003)"
          d="M0 0C-.959 1.949-1.882 3.915-2.758 5.903-4.006 7.975-5.247 10.051-6.408 12.164L-114.9 12.357C-115.084 12.084-115.268 11.806-115.452 11.513-116.769 9.419-117.613 7.109-118.411 4.773-119.125 2.685-119.727 .565-120.283-1.567-115.291-1.576-110.299-1.585-105.307-1.594-70.019-1.657-34.731-1.72 .557-1.783 .373-1.185 .184-.595 0 0Z"
        />
        <path
          transform="matrix(1,0,0,-1,30.3042,57.1231)"
          d="M0 0C-.143-1.75-1.562-23.396 14.483-35.016 20.739-39.547 27.31-40.858 31.385-41.272"
        />
        <path
          transform="matrix(1,0,0,-1,144.7682,78.8071)"
          d="M0 0C0-35.77-28.998-64.768-64.768-64.768-100.539-64.768-129.536-35.77-129.536 0-129.536 35.77-100.539 64.768-64.768 64.768-28.998 64.768 0 35.77 0 0Z"
        />
      </g>
    </svg>
  );
}

/**
 * Full lockup — mark + wordmark. `lab` appends the mono "/ LAB" tag.
 */
export function Logo({
  className,
  size = 24,
  lab = false,
}: {
  className?: string;
  size?: number;
  lab?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span
        className="text-[15px] font-semibold tracking-[-0.02em]"
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
