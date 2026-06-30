import { cn } from "@/lib/utils";

/**
 * Persept logomark — a single clean hexagon (echoing the wireframe form used
 * as the hero's 3D centerpiece) with one accent "percept" node that orbits the
 * shape. Monoline, ink + a single accent.
 *
 * Colors resolve from CSS custom properties: `currentColor` (set to --ink) for
 * the hexagon, and --accent for the node. The orbit is a CSS animation
 * (`.logo-orbit`) that is automatically paused under reduced-motion.
 */
export function LogoMark({
  size = 26,
  animated = true,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={{ color: "var(--ink)" }}
      aria-hidden="true"
    >
      {/* hexagon */}
      <path
        d="M16 4 L26.39 10 L26.39 22 L16 28 L5.61 22 L5.61 10 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* orbiting accent node — the transparent rect sets the group's bbox to
          the full canvas so it rotates around the hexagon's centre */}
      <g className={animated ? "logo-orbit" : undefined}>
        <rect width="32" height="32" fill="transparent" />
        <circle
          cx="16"
          cy="4"
          r="2.7"
          style={{
            fill: "var(--accent)",
            stroke: "var(--paper)",
            strokeWidth: 1.2,
          }}
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
  animated = true,
}: {
  className?: string;
  size?: number;
  lab?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} animated={animated} />
      <span
        className="text-[15px] font-semibold tracking-[-0.02em]"
        style={{ color: "var(--ink)" }}
      >
        Persept
      </span>
      {lab && (
        <span
          className="mono-label hidden sm:inline"
          style={{ letterSpacing: "0.18em" }}
        >
          /&nbsp;LAB
        </span>
      )}
    </span>
  );
}

export default Logo;
