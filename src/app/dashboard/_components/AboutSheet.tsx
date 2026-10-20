"use client";

import type { OSVps } from "../_data/agents";
import { useOS } from "./os-store";

// v3 §10 about sheet. A 380px centred sheet over a blurred scrim: the logo,
// "persept os", the tagline, then a set of machine / workforce / models /
// uptime / owner rows, and an OK button. Shown while os.aboutOpen.

function fmtUptime(s: number): string {
  if (!s || s <= 0) return "—";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}`;
  return `${hours}h`;
}

export function AboutSheet({
  vps,
  working,
}: {
  vps: OSVps | null;
  working: number;
}) {
  const os = useOS();

  const rows: { l: string; v: string }[] = [
    { l: "machine", v: "vps-dxb-01 · dubai" },
    { l: "workforce", v: `6 agents · ${working} working` },
    { l: "models", v: "claude sonnet · haiku" },
    { l: "uptime", v: vps ? fmtUptime(vps.uptimeS) : "—" },
    { l: "owner", v: "khizr" },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="close about"
        onClick={os.closeAbout}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 70,
          background: "var(--scrim)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          border: "none",
          cursor: "default",
          animation: "os-scrim-in 0.2s ease-out",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="about persept os"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          zIndex: 71,
          background: "var(--surf)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          boxShadow: "var(--shadow)",
          padding: "30px 26px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textAlign: "center",
          transformOrigin: "center",
          animation: "os-pop 0.14s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        <svg
          width="49"
          height="52"
          viewBox="10.31 8 79.38 84"
          aria-hidden="true"
        >
          <path
            d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
            style={{ fill: "var(--accent)" }}
          />
          <path
            fillRule="evenodd"
            d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
            style={{ fill: "var(--accent)" }}
          />
        </svg>
        <span
          className="os-display"
          style={{
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: "-0.045em",
            marginTop: 14,
            lineHeight: 1,
          }}
        >
          persept os
        </span>
        <span style={{ fontSize: 12.5, color: "var(--mute)" }}>
          your AI workforce, running on one machine
        </span>
        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            marginTop: 18,
            borderTop: "1px solid var(--line)",
          }}
        >
          {rows.map((r) => (
            <div
              key={r.l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "9px 2px",
                borderBottom: "1px solid var(--line)",
                fontSize: 12.5,
              }}
            >
              <span style={{ color: "var(--soft)" }}>{r.l}</span>
              <span>{r.v}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={os.closeAbout}
          style={{
            marginTop: 18,
            alignSelf: "stretch",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "var(--ink)",
            color: "var(--bg)",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          ok
        </button>
      </div>
    </>
  );
}
