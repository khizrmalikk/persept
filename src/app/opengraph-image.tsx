import { ImageResponse } from "next/og";

// Route segment config
export const alt = "Persept — An AI Workforce for Your Small Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (Terracotta Sand)
const PAPER = "#f7f2ea";
const INK = "#17140f";
const INK_SOFT = "#5c554a";
const CLAY = "#cf5a34";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top row: aperture mark + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <svg
          width="78"
          height="72"
          viewBox="0 0 136.6 125.56"
          fill="none"
          aria-hidden="true"
        >
          <path
            fill="#f2a93b"
            d="M27.37,119.56L96.19,1.97c.71-1.22,2.02-1.97,3.44-1.97h32.97c3.08,0,5,3.35,3.44,6l-69.05,117.59c-.72,1.22-2.02,1.97-3.44,1.97H30.81c-3.08,0-4.99-3.34-3.44-6Z"
          />
          <path
            fill={INK}
            d="M95.24,0H3.94C.67,0-1.17,3.76.83,6.34l19.74,25.49c.75.96,1.89,1.53,3.11,1.53h52.04"
          />
        </svg>
        <span
          style={{
            fontSize: "40px",
            fontWeight: 700,
            color: INK,
            letterSpacing: "-0.02em",
          }}
        >
          Persept
        </span>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <span
          style={{
            fontSize: "76px",
            fontWeight: 700,
            color: INK,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: "980px",
          }}
        >
          An AI workforce{" "}
          <span style={{ color: CLAY }}>for your business.</span>
        </span>
        <span style={{ fontSize: "30px", color: INK_SOFT, maxWidth: "900px" }}>
          Practical AI agents that take over the repetitive work small
          businesses would otherwise hire for — running 24/7.
        </span>
      </div>

      {/* Footer accent bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "56px", height: "6px", backgroundColor: CLAY }} />
        <span
          style={{
            fontSize: "22px",
            color: INK_SOFT,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          persept.ai
        </span>
      </div>
    </div>,
    { ...size },
  );
}
