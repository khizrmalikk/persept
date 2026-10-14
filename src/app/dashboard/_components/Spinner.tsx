"use client";

// A tiny inline spinner for buttons that run a server action. `currentColor` by
// default so it inherits the button's text colour; the spin itself is the
// `.os-spin` keyframe in os.css (honours prefers-reduced-motion).
export function Spinner({
  size = 14,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      className="os-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
