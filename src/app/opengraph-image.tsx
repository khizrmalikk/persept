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
          width="72"
          height="72"
          viewBox="10.73 9.54 138.54 138.54"
          fill="none"
          aria-hidden="true"
        >
          <g
            stroke={INK}
            strokeWidth="4"
            strokeLinecap="butt"
            strokeMiterlimit="10"
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
          </g>
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
