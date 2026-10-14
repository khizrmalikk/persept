"use client";

import { useEffect, useState } from "react";
import type { OSApproval } from "../_data/approvals";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// v3 §9 lock screen. A privacy screen (not auth) shown while os.locked. The
// full-screen --lockbg with a 28px backdrop blur sits over the live desktop, so
// the map still glows through. Centred: the date, a huge Outfit clock, the
// working count, then up to three waiting approvals (title only, no actions).
// A fingerprint tile at the bottom with "touch to unlock" — click / Enter /
// Space unlocks with a 0.42s fade.

// compact kind label for the approval cards (uppercase in the card)
const KIND_LABEL: Record<string, string> = {
  email: "email",
  linkedin: "linkedin post",
  instagram: "instagram post",
  whatsapp: "whatsapp",
  "linkedin-message": "linkedin message",
  proposal: "proposal",
  merge: "merge",
  payment: "payment",
  question: "question",
  other: "request",
};

export function LockScreen({
  approvals,
  working,
  pending,
}: {
  approvals: OSApproval[];
  working: number;
  pending: number;
}) {
  const os = useOS();
  const [now, setNow] = useState<Date | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  const p = (n: number) => String(n).padStart(2, "0");
  const clock = now ? `${p(now.getHours())}:${p(now.getMinutes())}` : "--:--";
  const DAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const MONS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const date = now
    ? `${DAYS[now.getDay()]} ${now.getDate()} ${MONS[now.getMonth()]}`
    : "";

  // unlock: fade out over 0.42s, then flip os.locked off
  const unlock = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => os.unlock(), 420);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      unlock();
    }
  };

  const live = approvals.filter((a) => !a.held).slice(0, 3);

  return (
    <button
      type="button"
      aria-label="unlock screen"
      onClick={unlock}
      onKeyDown={onKey}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        background: "var(--lockbg)",
        backdropFilter: "blur(28px) saturate(1.2)",
        WebkitBackdropFilter: "blur(28px) saturate(1.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 92,
        border: "none",
        cursor: "pointer",
        color: "var(--ink)",
        textAlign: "center",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.42s ease-out",
        animation: "os-lock-in 0.35s ease-out",
      }}
    >
      <span
        style={{
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--soft)",
          whiteSpace: "nowrap",
        }}
      >
        {date}
      </span>
      <span
        className="os-display"
        style={{
          fontWeight: 800,
          fontSize: 188,
          letterSpacing: "-0.06em",
          lineHeight: 0.86,
          marginTop: 16,
          color: "var(--ink)",
        }}
      >
        {clock}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 22,
          fontSize: 15,
          color: "var(--soft)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "oklch(0.72 0.17 150)",
          }}
        />
        {working} of 6 agents working
      </span>

      <div
        style={{
          marginTop: 44,
          width: 400,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ambink)",
            paddingLeft: 4,
            textAlign: "left",
          }}
        >
          waiting for you · {pending}
        </span>
        {live.length === 0 && (
          <span
            style={{
              fontSize: 13,
              color: "var(--mute)",
              paddingLeft: 4,
              textAlign: "left",
            }}
          >
            nothing waiting on you.
          </span>
        )}
        {live.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: 16,
              background: "var(--glass)",
              border: "1px solid var(--line)",
            }}
          >
            <Persona agent={a.agent} size={32} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                minWidth: 0,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--mute)",
                }}
              >
                {KIND_LABEL[a.kind] ?? "request"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {a.title}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--mute)" }}>{a.age}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          marginBottom: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "30%",
            background: "linear-gradient(160deg, var(--tile1), var(--tile2))",
            border: "1px solid var(--line2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          <svg
            viewBox="0 0 120 150"
            style={{ width: "56%", overflow: "visible" }}
            aria-hidden="true"
          >
            <g
              fill="none"
              style={{ stroke: "var(--accent)" }}
              strokeWidth="3.4"
              strokeLinecap="round"
            >
              <ellipse
                cx="60"
                cy="76"
                rx="10.32"
                ry="12"
                strokeDasharray="40 6 20 9"
                transform="rotate(-8 60 76)"
              />
              <ellipse
                cx="60"
                cy="76"
                rx="17.2"
                ry="20"
                strokeDasharray="52 8 30 10 12 9"
                transform="rotate(-5 60 76)"
              />
              <ellipse
                cx="60"
                cy="76"
                rx="24.08"
                ry="28"
                strokeDasharray="70 10 36 12"
                transform="rotate(-2 60 76)"
              />
              <ellipse
                cx="60"
                cy="76"
                rx="30.96"
                ry="36"
                strokeDasharray="90 12 44 10 20 14"
                transform="rotate(1 60 76)"
              />
              <ellipse
                cx="60"
                cy="76"
                rx="37.84"
                ry="44"
                strokeDasharray="120 14 50 16"
                transform="rotate(4 60 76)"
              />
              <ellipse
                cx="60"
                cy="76"
                rx="44.72"
                ry="52"
                strokeDasharray="150 18 60 22"
                transform="rotate(7 60 76)"
              />
            </g>
            <rect
              x="4"
              y="10"
              width="112"
              height="2.5"
              rx="1.2"
              style={{ fill: "var(--accent)" }}
              opacity="0.9"
              className="os-lock-scan"
            >
              <animate
                attributeName="y"
                values="14;140;14"
                dur="2.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.1;0.9;1"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>
        <span
          style={{
            fontSize: 11.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--soft)",
            whiteSpace: "nowrap",
          }}
        >
          touch to unlock
        </span>
      </div>
    </button>
  );
}
