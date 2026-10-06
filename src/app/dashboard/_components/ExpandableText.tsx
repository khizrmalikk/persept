"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

// Long text, clamped to `lines` with a "see all" toggle — but only when the text
// actually overflows (short text renders as-is, no button). Reusable on any page:
// pass `className` so the clamped text inherits the surrounding type style.
export function ExpandableText({
  text,
  lines = 4,
  className,
}: {
  text: string;
  lines?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Measure only while collapsed (when expanded, clientHeight === scrollHeight, so
  // we'd wrongly hide the "show less" button). Keeps the button on resize too.
  useLayoutEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [expanded]);

  const clamp: CSSProperties = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div>
      <div ref={ref} className={className} style={clamp}>
        {text}
      </div>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: 4,
            padding: 0,
            border: 0,
            background: "transparent",
            font: "inherit",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          {expanded ? "show less" : "see all"}
        </button>
      )}
    </div>
  );
}
