"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import "./landing12.css";
import {
  EMAIL,
  EMAIL_HREF,
  FOUNDER,
  GYST_HREF,
  LINKEDIN_HREF,
  PRICE_FROM_MONTHLY,
  PROOF,
  TIERS,
  WHATSAPP_HREF,
} from "./config";

/* ----------------------------------------------------------------------- *
 * Data
 * ----------------------------------------------------------------------- */

const NAV: [string, string][] = [
  ["The idea", "#idea"],
  ["What it does", "#work"],
  ["Built for you", "#examples"],
  ["How it works", "#process"],
  ["Pricing", "#pricing"],
  ["Start a project", "#start"],
];

const CAPS: [string, string, string[]][] = [
  [
    "Find new customers",
    "Watches public signals and builds a list of who is about to buy, with a named contact for each.",
    ["Signals", "Research"],
  ],
  [
    "Follow up, every time",
    "First emails, then day 3 and day 7 follow-ups timed to the buyer's deadline.",
    ["Email", "WhatsApp"],
  ],
  [
    "Quotes and proposals",
    "Drafted the same day from your past work and your own rate card.",
    ["Pricing", "Proposals"],
  ],
  [
    "Answer enquiries",
    "Replies on email and WhatsApp in your tone, then books the call or the visit.",
    ["Front desk", "Bookings"],
  ],
  [
    "Content and reviews",
    "Turns finished jobs into posts and case studies, and asks happy clients for reviews.",
    ["LinkedIn", "Reviews"],
  ],
  [
    "Admin that repeats",
    "Chases suppliers, sends reminders, prepares reports and keeps every deadline.",
    ["Reports", "Renewals"],
  ],
];

// role-colour squares for the approval queue
const QC: Record<string, string> = {
  hunter: "oklch(0.75 0.14 150)",
  scribe: "oklch(0.75 0.12 220)",
  muse: "oklch(0.78 0.13 110)",
};

const QUEUE: { k: string; who: string; t: string; verb: string }[] = [
  {
    k: "hunter",
    who: "Outreach agent · email",
    t: "Day 3 follow-up to Marina Kitchens",
    verb: "Send",
  },
  {
    k: "scribe",
    who: "Proposals agent · proposal",
    t: "Halden Group · AED 84,000",
    verb: "Send",
  },
  {
    k: "muse",
    who: "Content agent · LinkedIn post",
    t: "Case study: Northgate Mall",
    verb: "Publish",
  },
];

const FAQ: [string, string][] = [
  [
    "What exactly is an AI Workforce?",
    "A small team of AI agents, each with one job, built for your business and connected to your tools. They do the research, drafting and follow-ups. You approve what goes out.",
  ],
  [
    "Will it work for my business?",
    "If your team repeats the same work every week, very likely. On the first call we pick one workflow and tell you honestly whether it fits.",
  ],
  [
    "Do I need new software?",
    "No. It works with Gmail or Outlook, WhatsApp, Google Sheets, and Zoho or HubSpot if you already use them. You get one dashboard and a phone app for approvals.",
  ],
  [
    "What will the agents never do?",
    "Send, publish or pay without your approval, invent a price, or phone anyone. Calls are yours.",
  ],
  [
    "Who owns the data?",
    "You do. Export it any time. We delete our copy within 30 days of the contract ending.",
  ],
  [
    "How fast can we start?",
    "Your first workflow is usually live within 7 days of the first call.",
  ],
];

// comparison, mobile card form: [rowLabel, perseptValue, [coordinator, payPerLead, diy]]
const CMP: [string, string, [string, string, string]][] = [
  [
    "Cost",
    `From ${PRICE_FROM_MONTHLY} a month`,
    [
      "AED 5,000 to 8,000 a month plus visa",
      "Pay per lead, shared with competitors",
      "Your evenings",
    ],
  ],
  [
    "Leads",
    "Your own list, from public signals",
    [
      "Whoever they find",
      "The same leads as everyone else",
      "Whoever you have time for",
    ],
  ],
  [
    "Follow-ups",
    "Day 3 and day 7, every time",
    ["When they remember", "Not included", "When you remember"],
  ],
  [
    "Proposals",
    "Same day, from your rate card",
    ["Days", "Not included", "Days"],
  ],
  ["Who approves", "You, every time", ["You", "Not applicable", "You"]],
];
const CMP_ALTS = [
  "Hire a sales coordinator",
  "Pay-per-lead sites",
  "Do it yourself",
];

// collage positions. ≥1100px: absolute (left/top %). <1100px: margin-based.
const POS = [
  [28, 0, 0, -3],
  [24, 38, -2, 2],
  [27, 72, 2, 3],
  [25, 0, 38, 2],
  [25, 75, 40, -2],
  [28, 2, 74, 3],
  [25, 38, 80, -2],
  [27, 72, 75, 2],
];
const POS_MOB = [
  [56, 0, 0, -4],
  [50, 48, 6, 3],
  [52, 3, 32, 2],
  [50, 49, 36, -3],
  [54, 0, 62, 3],
  [50, 48, 66, -2],
  [52, 5, 92, -3],
  [48, 50, 96, 3],
];

/* ----------------------------------------------------------------------- *
 * Persona avatars — Scout, Hunter, Scribe, Chief (only used in §9)
 * Ported from Persona.dc.html (static, no SMIL animation needed).
 * ----------------------------------------------------------------------- */

const HUE: Record<string, number> = {
  chief: 75,
  scout: 32,
  hunter: 150,
  scribe: 225,
};

function Persona({ agent, size = 40 }: { agent: string; size?: number }) {
  const h = HUE[agent] ?? 75;
  const fg = `oklch(0.8 0.13 ${h})`;
  const fold = `oklch(0.64 0.12 ${h})`;
  const bg = `oklch(0.34 0.07 ${h})`;
  return (
    <span
      className="av"
      style={{ width: size, height: size, display: "block", flex: "none" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <rect width="64" height="64" style={{ fill: bg }} rx="12" />
        {agent === "chief" && (
          <>
            <rect x="13" y="14" width="38" height="38" rx="13" fill={fg} />
            <circle cx="25.5" cy="31" r="2.4" fill="#1d1a17" />
            <circle cx="38.5" cy="31" r="2.4" fill="#1d1a17" />
            <path
              d="M29 40 h6"
              stroke="#1d1a17"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <path
              d="M46 47 L57 28"
              stroke="#1d1a17"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M46 47 L49.5 41"
              stroke="#f6f1e8"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          </>
        )}
        {agent === "scout" && (
          <>
            <circle cx="32" cy="33" r="19.5" fill={fg} />
            <rect
              x="19"
              y="23.5"
              width="11"
              height="13"
              rx="4.5"
              fill="#1d1a17"
            />
            <rect
              x="34"
              y="23.5"
              width="11"
              height="13"
              rx="4.5"
              fill="#1d1a17"
            />
            <rect
              x="28.5"
              y="26.5"
              width="7"
              height="5"
              rx="1.5"
              fill="#1d1a17"
            />
            <circle cx="24.5" cy="30" r="3.4" fill="oklch(0.55 0.08 230)" />
            <circle cx="39.5" cy="30" r="3.4" fill="oklch(0.55 0.08 230)" />
            <circle
              cx="23.3"
              cy="28.8"
              r="1.1"
              fill="#ffffff"
              fillOpacity="0.85"
            />
            <circle
              cx="38.3"
              cy="28.8"
              r="1.1"
              fill="#ffffff"
              fillOpacity="0.85"
            />
            <path
              d="M29 39.5 h6"
              stroke="#1d1a17"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </>
        )}
        {agent === "hunter" && (
          <>
            <path
              d="M32 11 L53 50 H11 Z"
              fill={fg}
              stroke={fg}
              strokeWidth="7"
              strokeLinejoin="round"
            />
            <circle cx="27.6" cy="37.4" r="2.4" fill="#1d1a17" />
            <circle cx="36.4" cy="37.4" r="2.4" fill="#1d1a17" />
            <path
              d="M29 44 h6"
              stroke="#1d1a17"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <circle cx="49" cy="16" r="7" fill="#f6f1e8" />
            <circle cx="49" cy="16" r="4.6" fill="oklch(0.62 0.18 28)" />
            <circle cx="49" cy="16" r="2.4" fill="#f6f1e8" />
            <circle cx="49" cy="16" r="1" fill="oklch(0.62 0.18 28)" />
          </>
        )}
        {agent === "scribe" && (
          <>
            <path
              d="M19 11 H38 L46 19 V48 a5 5 0 0 1 -5 5 H19 a5 5 0 0 1 -5 -5 V16 a5 5 0 0 1 5 -5 Z"
              fill={fg}
            />
            <path d="M38 11 V16 a3 3 0 0 0 3 3 H46" fill={fold} />
            <circle cx="25" cy="27.5" r="2.3" fill="#1d1a17" />
            <circle cx="35" cy="27.5" r="2.3" fill="#1d1a17" />
            <path
              d="M27.5 34.5 h5"
              stroke="#1d1a17"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M20 42 h14 M20 46.5 h9"
              stroke="#1d1a17"
              strokeOpacity="0.3"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </span>
  );
}

const PROOF_AGENTS: { agent: string; title: string; stat: string }[] = [
  {
    agent: "scout",
    title: "Scout finds the leads",
    stat: `${PROOF.companies} companies researched in ${PROOF.month}`,
  },
  {
    agent: "hunter",
    title: "Hunter writes the outreach",
    stat: `${PROOF.emails} emails drafted, 0 sent without approval`,
  },
  {
    agent: "scribe",
    title: "Scribe drafts the proposals",
    stat: `${PROOF.proposals} proposals written`,
  },
  {
    agent: "chief",
    title: "Chief runs the day",
    stat: "A brief every morning at 7:00",
  },
];

/* ----------------------------------------------------------------------- *
 * Dashboard illustrations (§6). Each is a 900×560 artboard, static artwork.
 * Scaled to card width with transform:scale in the parent ex-art wrapper.
 * ----------------------------------------------------------------------- */

const room = (
  num: string,
  label: string,
  bg: string,
  color: string,
  star?: boolean,
  cleaning?: boolean,
) => (
  <div
    style={{
      position: "relative",
      background: cleaning
        ? "repeating-linear-gradient(45deg,#e9edf2 0 6px,#d6dde6 6px 12px)"
        : bg,
      border: "1.5px solid #b9c4d2",
      borderRadius: 4,
      color,
      padding: 6,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <b style={{ fontSize: 13 }}>{num}</b>
    <span style={{ fontSize: 10 }}>{label}</span>
    {star && (
      <span
        style={{
          position: "absolute",
          right: 5,
          top: 4,
          color: "#c8a24a",
          fontSize: 12,
        }}
      >
        ★
      </span>
    )}
  </div>
);

// 1 — hotel live floor plan
function DashHotel() {
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#f4f6f9",
        color: "#16263b",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 48,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 16px",
          background: "#1f3a5f",
          color: "#fff",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "2px solid #c8a24a",
          }}
        />
        <b style={{ fontSize: 13, letterSpacing: "0.04em" }}>
          AL SEEF BOUTIQUE HOTEL
        </b>
        <span
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.14)",
          }}
        >
          Floor 3
        </span>
        <span style={{ opacity: 0.6 }}>Floor 2</span>
        <span style={{ opacity: 0.6 }}>Floor 1</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 18 }}>
          <span>
            Occupancy <b style={{ color: "#c8a24a" }}>86%</b>
          </span>
          <span>
            ADR <b>AED 740</b>
          </span>
          <span>
            Rating <b>4.7</b>
          </span>
        </span>
      </div>
      <div
        style={{ flex: 1, display: "flex", gap: 12, padding: 14, minHeight: 0 }}
      >
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #dfe5ec",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: 13 }}>Floor 3 · live room status</b>
            <span style={{ color: "#6b7a8d" }}>
              Housekeeping agent · 3 rooms in progress
            </span>
          </div>
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateRows: "1fr 30px 1fr",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px repeat(8,1fr)",
                gap: 5,
              }}
            >
              <div
                style={{
                  background: "#e3e8ef",
                  borderRadius: 4,
                  display: "grid",
                  placeItems: "center",
                  color: "#6b7a8d",
                  fontSize: 10,
                  writingMode: "vertical-rl",
                }}
              >
                LIFT
              </div>
              {room("301", "In house", "#dfe7f1", "#1f3a5f")}
              {room("302", "In house", "#dfe7f1", "#1f3a5f")}
              {room("303", "Out 12:00", "#f6e7c4", "#7a5a12")}
              {room("304", "In house", "#dfe7f1", "#1f3a5f", true)}
              {room("305", "Ready", "#ffffff", "#4b5b70")}
              {room("306", "In house", "#dfe7f1", "#1f3a5f")}
              {room("307", "Cleaning", "", "#4b5b70", false, true)}
              {room("308", "In house", "#dfe7f1", "#1f3a5f")}
            </div>
            <div
              style={{
                background:
                  "repeating-linear-gradient(90deg,#f1f4f8 0 18px,#e8edf3 18px 20px)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8a97a8",
                fontSize: 10,
                letterSpacing: "0.2em",
              }}
            >
              CORRIDOR
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px repeat(8,1fr)",
                gap: 5,
              }}
            >
              <div
                style={{
                  background: "#e3e8ef",
                  borderRadius: 4,
                  display: "grid",
                  placeItems: "center",
                  color: "#6b7a8d",
                  fontSize: 10,
                  writingMode: "vertical-rl",
                }}
              >
                STAIRS
              </div>
              {room("316", "Out 12:00", "#f6e7c4", "#7a5a12")}
              {room("315", "In house", "#dfe7f1", "#1f3a5f")}
              {room("314", "In house", "#dfe7f1", "#1f3a5f")}
              {room("313", "Ready", "#ffffff", "#4b5b70")}
              {room("312", "In house", "#dfe7f1", "#1f3a5f")}
              {room("311", "Cleaning", "", "#4b5b70", false, true)}
              {room("310", "In house", "#dfe7f1", "#1f3a5f", true)}
              {room("309", "Out 12:00", "#f6e7c4", "#7a5a12")}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 14, color: "#4b5b70", fontSize: 11 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#dfe7f1",
                  border: "1px solid #b9c4d2",
                }}
              />
              Occupied
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#f6e7c4",
                  border: "1px solid #b9c4d2",
                }}
              />
              Check-out today
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background:
                    "repeating-linear-gradient(45deg,#e9edf2 0 6px,#d6dde6 6px 12px)",
                  border: "1px solid #b9c4d2",
                }}
              />
              Being cleaned
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#ffffff",
                  border: "1px solid #b9c4d2",
                }}
              />
              Ready
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#c8a24a" }}>★</span>VIP
            </span>
          </div>
        </div>
        <div
          style={{
            width: 270,
            flex: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 0,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #dfe5ec",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>Arrivals today</b>
              <span style={{ color: "#6b7a8d" }}>12</span>
            </div>
            {[
              ["Ms. Laurent", "Honeymoon", "14:00 · 305"],
              ["Mr. Okafor", "Airport pickup", "16:30 · 312"],
              ["The Haddads", "2 adults, 1 child", "19:00 · 309"],
            ].map(([n, sub, when]) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #eef1f5",
                  paddingTop: 6,
                }}
              >
                <span>
                  <b>{n}</b>
                  <br />
                  <span style={{ color: "#6b7a8d" }}>{sub}</span>
                </span>
                <span style={{ color: "#6b7a8d", textAlign: "right" }}>
                  {when}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              background: "#1f3a5f",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <b>Guest request · room 304</b>
            <span style={{ opacity: 0.75 }}>
              &ldquo;Could we check out at 2pm?&rdquo;
            </span>
            <div
              style={{
                padding: "7px 9px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                border: "1px dashed rgba(255,255,255,0.4)",
              }}
            >
              Of course. Late check-out until 14:00 is confirmed, with our
              compliments.
            </div>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Concierge agent · drafted
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  background: "#c8a24a",
                  color: "#1f3a5f",
                  padding: "5px 12px",
                  borderRadius: 5,
                  fontWeight: 700,
                }}
              >
                Send
              </span>
              <span
                style={{
                  border: "1px solid rgba(255,255,255,0.35)",
                  padding: "5px 12px",
                  borderRadius: 5,
                }}
              >
                Edit
              </span>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid #dfe5ec",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <b>Amenities today</b>
            {[
              ["Spa", "9 of 12 slots", "75%"],
              ["Restaurant", "64 covers", "80%"],
              ["Pool cabanas", "4 of 6", "66%"],
            ].map(([n, v, w]) => (
              <div key={n}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>{n}</span>
                  <span style={{ color: "#6b7a8d" }}>{v}</span>
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    background: "#eef1f5",
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ width: w, height: "100%", background: "#c8a24a" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2 — sales pipeline kanban
function DashPipeline() {
  const card = (
    title: string,
    sub: string,
    amt: string,
    tagBg: string,
    tagFg: string,
    tag: string,
    strong?: boolean,
  ) => (
    <div
      style={{
        background: "#fff",
        border: strong ? "1.5px solid #141414" : "1px solid #e6e5e1",
        borderRadius: 8,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      <b>{title}</b>
      <span style={{ color: "#76756f" }}>{sub}</span>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
          marginTop: 2,
        }}
      >
        <b style={{ whiteSpace: "nowrap" }}>{amt}</b>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 4,
            background: tagBg,
            color: tagFg,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      </div>
    </div>
  );
  const won = (title: string, when: string, amt: string) => (
    <div
      style={{
        background: "#eaf5ee",
        borderRadius: 8,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      <b>{title}</b>
      <span style={{ color: "#2d6b45" }}>{when}</span>
      <b>{amt}</b>
    </div>
  );
  const col = (head: string, meta: string, children: React.ReactNode) => (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#76756f",
        }}
      >
        <b style={{ color: "#141414" }}>{head}</b>
        <span>{meta}</span>
      </div>
      {children}
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#f5f5f3",
        color: "#141414",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 48,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 16px",
          background: "#fff",
          borderBottom: "1px solid #e6e5e1",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "#d9412b",
          }}
        />
        <b style={{ fontSize: 13 }}>Northwind Fire &amp; Safety</b>
        <span
          style={{
            marginLeft: 14,
            padding: "6px 11px",
            borderRadius: 6,
            background: "#141414",
            color: "#fff",
          }}
        >
          Pipeline
        </span>
        <span style={{ color: "#76756f" }}>Renewals</span>
        <span style={{ color: "#76756f" }}>Reports</span>
        <span style={{ marginLeft: "auto", color: "#76756f" }}>
          Open pipeline <b style={{ color: "#141414" }}>AED 168,500</b>
        </span>
      </div>
      <div
        style={{ flex: 1, display: "flex", gap: 12, padding: 14, minHeight: 0 }}
      >
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 10,
          }}
        >
          {col(
            "Prospect",
            "6 · 212k",
            <>
              {card(
                "Al Habtoor Tower",
                "Alarm AMC · 14 floors",
                "AED 42k",
                "#fde9e5",
                "#b3321f",
                "Lead Scout",
              )}
              {card(
                "Cove Hotel",
                "Pre-opening fit-out",
                "AED 66k",
                "#fde9e5",
                "#b3321f",
                "Lead Scout",
              )}
              {card(
                "Marina Gate 3",
                "Handover this quarter",
                "AED 31k",
                "#fde9e5",
                "#b3321f",
                "Lead Scout",
              )}
            </>,
          )}
          {col(
            "Contacted",
            "4 · 96k",
            <>
              {card(
                "Marina Kitchens",
                "Day 3 follow-up due",
                "AED 18k",
                "#e6f2ea",
                "#2d6b45",
                "Outreach",
              )}
              {card(
                "Bay Square 9",
                "Replied, wants a visit",
                "AED 24k",
                "#e6f2ea",
                "#2d6b45",
                "Outreach",
              )}
            </>,
          )}
          {col(
            "Proposal",
            "3 · 140k",
            <>
              {card(
                "Halden Group",
                "Opened 2× · 14:02",
                "AED 84k",
                "#e7eefb",
                "#2b4f99",
                "Proposals",
                true,
              )}
              {card(
                "Oud Metha Clinic",
                "Sent yesterday",
                "AED 22k",
                "#e7eefb",
                "#2b4f99",
                "Proposals",
              )}
            </>,
          )}
          {col(
            "Won",
            "2 · 58k",
            <>
              {won("Northgate Mall", "Signed 08 Oct", "AED 36k")}
              {won("JLT Tower 2", "Signed 02 Oct", "AED 22k")}
            </>,
          )}
        </div>
        <div
          style={{
            width: 230,
            flex: "none",
            background: "#fff",
            border: "1px solid #e6e5e1",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <b style={{ fontSize: 13 }}>Waiting for you</b>
            <span
              style={{
                background: "#141414",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 7px",
              }}
            >
              3
            </span>
          </div>
          {[
            [
              "Email · Outreach",
              "Day 3 follow-up · Marina Kitchens",
              "Send",
              true,
            ],
            ["Proposal · Proposals", "Halden Group · AED 84,000", "Send", true],
            ["Renewals", "3 AMC contracts lapse in 60 days", "Review", false],
          ].map(([role, title, verb, solid]) => (
            <div
              key={title as string}
              style={{
                borderTop: "1px solid #eee",
                paddingTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ color: "#76756f" }}>{role}</span>
              <b>{title}</b>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "5px 12px",
                  borderRadius: 5,
                  ...(solid
                    ? { background: "#141414", color: "#fff" }
                    : { border: "1px solid #d6d5d0" }),
                }}
              >
                {verb}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3 — clinic day schedule + WhatsApp inbox
function DashClinic() {
  const appt = (
    left: string,
    top: number,
    height: number,
    bg: string,
    color: string,
    title: string,
    sub: string,
  ) => (
    <div
      style={{
        position: "absolute",
        left,
        width: "32%",
        top,
        height,
        borderRadius: 6,
        background: bg,
        color,
        padding: "6px 8px",
        overflow: "hidden",
      }}
    >
      <b>{title}</b>
      <div style={{ opacity: 0.8 }}>{sub}</div>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#ffffff",
        color: "#0f2b2a",
        fontSize: 12,
        display: "flex",
      }}
    >
      <div
        style={{
          width: 58,
          flex: "none",
          background: "#0f5e57",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          paddingTop: 16,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#7fe0d2",
          }}
        />
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "rgba(255,255,255,0.9)",
          }}
        />
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "rgba(255,255,255,0.3)",
          }}
        />
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "rgba(255,255,255,0.3)",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 18px",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <b style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
            Tuesday, 13 Oct
          </b>
          <span style={{ color: "#5d7472" }}>
            Smile Studio · 9 visits · 2 gaps
          </span>
          <span
            style={{
              marginLeft: "auto",
              padding: "5px 10px",
              borderRadius: 999,
              background: "#e3f5f2",
              color: "#0f5e57",
              fontWeight: 600,
            }}
          >
            Recalls: 14 due
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px repeat(3,1fr)",
            marginTop: 12,
            color: "#5d7472",
          }}
        >
          <span />
          <b style={{ color: "#0f2b2a" }}>Dr Rania</b>
          <b style={{ color: "#0f2b2a" }}>Dr Omar</b>
          <b style={{ color: "#0f2b2a" }}>Hygienist</b>
        </div>
        <div style={{ flex: 1, display: "flex", marginTop: 6, minHeight: 0 }}>
          <div
            style={{
              width: 44,
              display: "flex",
              flexDirection: "column",
              color: "#8aa09e",
            }}
          >
            {[
              "08:00",
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "13:00",
              "14:00",
              "15:00",
              "16:00",
            ].map((t) => (
              <span key={t} style={{ height: 46 }}>
                {t}
              </span>
            ))}
          </div>
          <div
            style={{
              flex: 1,
              position: "relative",
              background:
                "repeating-linear-gradient(180deg,#eef3f2 0 1px,transparent 1px 46px)",
            }}
          >
            {appt("0.6%", 0, 66, "#d9f1ed", "#0f5e57", "Check-up", "L. Rahman")}
            {appt(
              "0.6%",
              92,
              92,
              "#0f5e57",
              "#ffffff",
              "Root canal",
              "K. Patel",
            )}
            {appt(
              "0.6%",
              230,
              46,
              "#d9f1ed",
              "#0f5e57",
              "Consult",
              "New patient",
            )}
            {appt(
              "0.6%",
              322,
              70,
              "#d9f1ed",
              "#0f5e57",
              "Crown fit",
              "M. Aziz",
            )}
            {appt(
              "33.93%",
              46,
              92,
              "#fde7d3",
              "#7a3e10",
              "Braces adjust",
              "J. Lopez",
            )}
            {appt(
              "33.93%",
              184,
              46,
              "#ffffff",
              "#0f5e57",
              "Open slot",
              "Front desk is filling",
            )}
            {appt(
              "33.93%",
              276,
              92,
              "#fde7d3",
              "#7a3e10",
              "Implant review",
              "S. Haddad",
            )}
            {appt(
              "67.26%",
              23,
              46,
              "#e7e4fb",
              "#3b2f8c",
              "Cleaning",
              "Sara M.",
            )}
            {appt(
              "67.26%",
              92,
              46,
              "#e7e4fb",
              "#3b2f8c",
              "Cleaning",
              "O. Karim",
            )}
            {appt(
              "67.26%",
              184,
              46,
              "#e7e4fb",
              "#3b2f8c",
              "Whitening",
              "L. Rose",
            )}
            {appt(
              "67.26%",
              276,
              46,
              "#e7e4fb",
              "#3b2f8c",
              "Cleaning",
              "A. Nair",
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          width: 240,
          flex: "none",
          borderLeft: "1px solid #e3ebea",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "#f7fbfa",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b style={{ fontSize: 13 }}>WhatsApp</b>
          <span style={{ color: "#5d7472" }}>3 new</span>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e3ebea",
            borderRadius: 10,
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <b>Sara M.</b>
          <div
            style={{
              padding: "7px 9px",
              borderRadius: 10,
              background: "#eef3f2",
            }}
          >
            Can I move my cleaning to next week?
          </div>
          <div
            style={{
              padding: "7px 9px",
              borderRadius: 10,
              background: "#d9f1ed",
              border: "1.5px dashed #0f5e57",
            }}
          >
            Of course. Tuesday 10:30 or Thursday 16:00?
          </div>
          <span style={{ color: "#5d7472", fontSize: 10 }}>
            Front desk agent · drafted
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <span
              style={{
                background: "#0f5e57",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: 5,
              }}
            >
              Send
            </span>
            <span
              style={{
                border: "1px solid #c9d8d6",
                padding: "5px 12px",
                borderRadius: 5,
              }}
            >
              Edit
            </span>
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e3ebea",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <b>Omar K.</b>
          <div style={{ color: "#5d7472", marginTop: 4 }}>
            Do you take Daman insurance?
          </div>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e3ebea",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <b>Lina R.</b>
          <div style={{ color: "#5d7472", marginTop: 4 }}>
            Price for whitening?
          </div>
        </div>
      </div>
    </div>
  );
}

// 4 — project Gantt with supplier confirmations
function DashGantt() {
  const section = (title: string) => (
    <div
      style={{
        height: 28,
        display: "flex",
        alignItems: "flex-end",
        padding: "0 0 4px 0",
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {title}
    </div>
  );
  const bar = (
    name: string,
    left: string,
    width: string,
    fill: string,
    tint: string,
    border: string,
    progress: string,
    diamond: string,
  ) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "150px 1fr",
        alignItems: "center",
        height: 30,
        borderTop: "1px solid #eeece8",
      }}
    >
      <span style={{ paddingLeft: 14, color: "#44403c" }}>{name}</span>
      <div style={{ position: "relative", height: "100%" }}>
        <div
          style={{
            position: "absolute",
            left,
            width,
            top: 7,
            height: 16,
            borderRadius: 4,
            background: tint,
            border: `1px solid ${border}`,
            overflow: "hidden",
          }}
        >
          <div style={{ width: progress, height: "100%", background: fill }} />
        </div>
        <span
          style={{
            position: "absolute",
            left: diamond,
            top: 10,
            width: 10,
            height: 10,
            transform: "rotate(45deg)",
            background: fill,
          }}
        />
      </div>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#faf9f7",
        color: "#1c1917",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        padding: "14px 16px",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 22,
            height: 22,
            background: "#1c1917",
            borderRadius: 3,
          }}
        />
        <b style={{ fontSize: 14 }}>Linea Interiors</b>
        <span style={{ color: "#78716c" }}>
          / Project timeline · 6 Oct – 30 Nov
        </span>
        <span
          style={{
            marginLeft: "auto",
            padding: "6px 11px",
            borderRadius: 6,
            border: "1px solid #d6d3d1",
          }}
        >
          3 projects · 1 at risk
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 12, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #e7e5e4",
            borderRadius: 10,
            padding: "10px 12px",
            position: "relative",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr" }}>
            <span />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8,1fr)",
                color: "#78716c",
                fontSize: 11,
              }}
            >
              {[
                "6 Oct",
                "13 Oct",
                "20 Oct",
                "27 Oct",
                "3 Nov",
                "10 Nov",
                "17 Nov",
                "24 Nov",
              ].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
          {section("Cove Hotel lobby")}
          {bar(
            "Design sign-off",
            "0%",
            "15%",
            "#2f2f2f",
            "#2f2f2f22",
            "#2f2f2f55",
            "100%",
            "calc(15% - 5px)",
          )}
          {bar(
            "Procurement",
            "12.5%",
            "30%",
            "#c2410c",
            "#c2410c22",
            "#c2410c55",
            "70%",
            "calc(42.5% - 5px)",
          )}
          {bar(
            "Joinery",
            "32.5%",
            "27.5%",
            "#c2410c",
            "#c2410c22",
            "#c2410c55",
            "20%",
            "calc(60% - 5px)",
          )}
          {bar(
            "Install",
            "60%",
            "30%",
            "#c2410c",
            "#c2410c22",
            "#c2410c55",
            "0%",
            "calc(90% - 5px)",
          )}
          {section("DIFC office, L12")}
          {bar(
            "Strip-out",
            "0%",
            "17.5%",
            "#2f2f2f",
            "#2f2f2f22",
            "#2f2f2f55",
            "100%",
            "calc(17.5% - 5px)",
          )}
          {bar(
            "MEP",
            "17.5%",
            "32.5%",
            "#0f766e",
            "#0f766e22",
            "#0f766e55",
            "55%",
            "calc(50% - 5px)",
          )}
          {bar(
            "Fit-out",
            "47.5%",
            "37.5%",
            "#0f766e",
            "#0f766e22",
            "#0f766e55",
            "0%",
            "calc(85% - 5px)",
          )}
          {section("Marina café")}
          {bar(
            "Kitchen and signage",
            "37.5%",
            "43.75%",
            "#6d28d9",
            "#6d28d922",
            "#6d28d955",
            "0%",
            "calc(81.25% - 5px)",
          )}
          <div
            style={{
              position: "absolute",
              top: 28,
              bottom: 10,
              left: "calc(162px + (100% - 174px) * 0.36)",
              width: 2,
              background: "#dc2626",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -16,
                left: -14,
                fontSize: 10,
                color: "#dc2626",
                fontWeight: 700,
              }}
            >
              Today
            </span>
          </div>
        </div>
        <div
          style={{
            width: 240,
            flex: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #e7e5e4",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <b>Supplier confirmations</b>
            {[
              ["Marble slabs", "Confirmed for Thu", "#15803d"],
              ["Lobby lighting", "Chased twice · waiting", "#c2410c"],
              ["Joinery delivery", "Confirmed 22 Oct", "#15803d"],
              ["Glass partitions", "Quote received", "#78716c"],
            ].map(([n, v, c]) => (
              <div
                key={n}
                style={{ borderTop: "1px solid #f0eeec", paddingTop: 7 }}
              >
                <b>{n}</b>
                <div style={{ color: c, marginTop: 2 }}>{v}</div>
              </div>
            ))}
            <span style={{ fontSize: 10, color: "#78716c" }}>
              Project agent chases every morning at 09:00
            </span>
          </div>
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <b style={{ color: "#9a3412" }}>Risk · Cove Hotel</b>
            <span style={{ color: "#7c2d12" }}>
              Lighting delay could push Install back 3 days.
            </span>
            <span
              style={{
                alignSelf: "flex-start",
                background: "#1c1917",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: 5,
              }}
            >
              Email the client
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5 — candidate table + funnel
function DashCandidates() {
  const funnel = (
    flex: number,
    bg: string,
    fg: string,
    label: string,
    n: string,
    radius: string,
    labelColor: string,
  ) => (
    <div
      style={{
        flex,
        background: bg,
        color: fg,
        padding: "9px 12px",
        borderRadius: radius,
      }}
    >
      <div style={{ color: labelColor }}>{label}</div>
      <b style={{ fontSize: 20 }}>{n}</b>
    </div>
  );
  const row = (
    name: string,
    now: string,
    pct: number,
    score: string,
    touch: string,
    status: string,
    stBg: string,
    stFg: string,
  ) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.3fr 1.1fr 1.3fr 0.9fr 1fr",
        gap: 10,
        alignItems: "center",
        padding: "9px 12px",
        borderTop: "1px solid #ebe8fa",
      }}
    >
      <b>{name}</b>
      <span style={{ color: "#6a6585" }}>{now}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg,#5b4bd6 ${pct}%,#e3dff7 ${pct}%)`,
          }}
        />
        <b style={{ width: 26 }}>{score}</b>
      </span>
      <span style={{ color: "#6a6585" }}>{touch}</span>
      <span
        style={{
          justifySelf: "start",
          padding: "3px 9px",
          borderRadius: 999,
          background: stBg,
          color: stFg,
        }}
      >
        {status}
      </span>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#f7f6ff",
        color: "#1d1838",
        fontSize: 12,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#5b4bd6",
          }}
        />
        <b style={{ fontSize: 14 }}>Talent Bridge</b>
        <span style={{ color: "#6a6585" }}>/ Head of Finance · Emaar</span>
        <span
          style={{
            marginLeft: "auto",
            padding: "7px 12px",
            borderRadius: 6,
            background: "#1d1838",
            color: "#fff",
          }}
        >
          Share shortlist
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, height: 58 }}>
        {funnel(
          124,
          "#e3dff7",
          "#1d1838",
          "Sourced",
          "124",
          "8px 0 0 8px",
          "#6a6585",
        )}
        {funnel(58, "#c9c1f2", "#1d1838", "Contacted", "58", "0", "#4b4370")}
        {funnel(
          30,
          "#9a8bea",
          "#fff",
          "Replied",
          "21",
          "0",
          "rgba(255,255,255,0.85)",
        )}
        {funnel(
          22,
          "#5b4bd6",
          "#fff",
          "Interviews",
          "9",
          "0 8px 8px 0",
          "rgba(255,255,255,0.85)",
        )}
      </div>
      <div
        style={{
          flex: 1,
          background: "#fff",
          border: "1px solid #ebe8fa",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1.1fr 1.3fr 0.9fr 1fr",
            gap: 10,
            padding: "10px 12px",
            color: "#6a6585",
            background: "#fbfaff",
          }}
        >
          <span>Candidate</span>
          <span>Now at</span>
          <span>Match</span>
          <span>Last touch</span>
          <span>Status</span>
        </div>
        {row(
          "R. Haddad",
          "CFO, regional retail",
          94,
          "94",
          "Replied today",
          "Wants a call",
          "#5b4bd6",
          "#fff",
        )}
        {row(
          "J. Pereira",
          "Finance Director",
          88,
          "88",
          "2 days ago",
          "Intro sent",
          "#ece9fd",
          "#3b2f8c",
        )}
        {row(
          "S. Khan",
          "VP Finance, energy",
          85,
          "85",
          "Draft ready",
          "Needs you",
          "#ffe9c7",
          "#7a4a00",
        )}
        {row(
          "M. Lopez",
          "Group Controller",
          79,
          "79",
          "4 days ago",
          "Follow-up due",
          "#ece9fd",
          "#3b2f8c",
        )}
        {row(
          "A. Nasser",
          "Head of FP&A",
          76,
          "76",
          "Sourced",
          "Researching",
          "#f1f0f6",
          "#6a6585",
        )}
        {row(
          "T. Okafor",
          "CFO, logistics",
          72,
          "72",
          "Sourced",
          "Researching",
          "#f1f0f6",
          "#6a6585",
        )}
      </div>
    </div>
  );
}

// 6 — dark store analytics
function DashStore() {
  const stat = (label: string, value: string, delta: string, dc: string) => (
    <div style={{ background: "#181a1f", borderRadius: 10, padding: 12 }}>
      <div style={{ color: "#8b8d96" }}>{label}</div>
      <b
        style={{
          display: "block",
          fontSize: 22,
          letterSpacing: "-0.02em",
          marginTop: 6,
        }}
      >
        {value}
      </b>
      <span style={{ color: dc }}>{delta}</span>
    </div>
  );
  const ticket = (id: string, text: string, status: string, sc: string) => (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "7px 9px",
        borderRadius: 7,
        background: "#1f2228",
      }}
    >
      <span style={{ color: "#8b8d96" }}>{id}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ color: sc }}>{status}</span>
    </div>
  );
  const content = (bg: string, kind: string, title: string) => (
    <div
      style={{
        flex: 1,
        borderRadius: 8,
        background: "#1f2228",
        padding: 9,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          width: "100%",
          height: 44,
          borderRadius: 6,
          background: bg,
          opacity: 0.25,
        }}
      />
      <span style={{ color: "#8b8d96", marginTop: 6 }}>{kind}</span>
      <b>{title}</b>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#101114",
        color: "#e9e9ec",
        fontSize: 12,
        padding: 16,
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gridTemplateRows: "auto minmax(0,1.2fr) minmax(0,1fr)",
        gap: 12,
      }}
    >
      {stat("Orders today", "142", "+18%", "#7ee0f0")}
      {stat("Revenue", "AED 12,450", "+12%", "#7ee0f0")}
      {stat("Refund rate", "1.4%", "−0.3", "#7ee0f0")}
      {stat("Open tickets", "6", "4 drafted", "#ffb27a")}
      <div
        style={{
          gridColumn: "span 3",
          background: "#181a1f",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>Revenue · 30 days</b>
          <span style={{ color: "#8b8d96" }}>Dune Coffee Co.</span>
        </div>
        <svg
          viewBox="0 0 600 170"
          preserveAspectRatio="none"
          style={{ flex: 1, width: "100%", marginTop: 8 }}
          aria-hidden="true"
        >
          <path
            d="M0 140 L40 132 L80 136 L120 118 L160 122 L200 104 L240 110 L280 92 L320 96 L360 78 L400 84 L440 64 L480 70 L520 48 L560 52 L600 30 L600 170 L0 170 Z"
            fill="rgba(126,224,240,0.12)"
          />
          <path
            d="M0 140 L40 132 L80 136 L120 118 L160 122 L200 104 L240 110 L280 92 L320 96 L360 78 L400 84 L440 64 L480 70 L520 48 L560 52 L600 30"
            fill="none"
            stroke="#7ee0f0"
            strokeWidth="2.5"
          />
          <path
            d="M0 85 H600 M0 42 H600 M0 128 H600"
            stroke="rgba(255,255,255,0.06)"
          />
        </svg>
      </div>
      <div
        style={{
          background: "#181a1f",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <b style={{ alignSelf: "flex-start" }}>Channels</b>
        <svg viewBox="0 0 42 42" width="110" height="110" aria-hidden="true">
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#2a2d34"
            strokeWidth="6"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#7ee0f0"
            strokeWidth="6"
            strokeDasharray="58 42"
            strokeDashoffset="25"
          />
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#ffb27a"
            strokeWidth="6"
            strokeDasharray="27 73"
            strokeDashoffset="67"
          />
        </svg>
        <span style={{ color: "#8b8d96" }}>Web 58% · Insta 27% · B2B 15%</span>
      </div>
      <div
        style={{
          gridColumn: "span 2",
          background: "#181a1f",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <b>Support · Support agent</b>
        {ticket(
          "#4821",
          "Damaged bag, wants a refund",
          "Reply drafted",
          "#ffb27a",
        )}
        {ticket("#4817", "Where is my order?", "Tracking sent", "#7ee0f0")}
        {ticket("#4809", "Wholesale price list", "Reply drafted", "#ffb27a")}
      </div>
      <div
        style={{
          gridColumn: "span 2",
          background: "#181a1f",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <b>Content · Content agent</b>
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          {content("#7ee0f0", "Reel", "New single origin")}
          {content("#ffb27a", "Email", "Subscriber offer")}
          {content("#b9a6ff", "Post", "Behind the roast")}
        </div>
      </div>
    </div>
  );
}

// 7 — property map with maintenance
function DashProperty() {
  const pin = (cx: number, cy: number, n: string, fill: string) => (
    <g>
      <circle cx={cx} cy={cy} r="15" fill={fill} />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#fff"
      >
        {n}
      </text>
    </g>
  );
  const issue = (dot: string, title: string, loc: string, note: string) => (
    <div
      style={{
        borderTop: "1px solid #edf1f2",
        paddingTop: 9,
        display: "flex",
        gap: 9,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          marginTop: 4,
          flex: "none",
        }}
      />
      <div>
        <b>{title}</b>
        <div style={{ color: "#5f717a" }}>{loc}</div>
        <div style={{ color: "#13222b", marginTop: 3, fontSize: 11 }}>
          {note}
        </div>
      </div>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#e6ecee",
        color: "#13222b",
        fontSize: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        width="900"
        height="560"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <path d="M560 0 C600 120 700 160 900 170 L900 0 Z" fill="#cfe1ea" />
        <g fill="#d9e1e4">
          <rect x="300" y="60" width="110" height="70" rx="6" />
          <rect x="430" y="50" width="90" height="90" rx="6" />
          <rect x="300" y="160" width="80" height="60" rx="6" />
          <rect x="400" y="170" width="120" height="70" rx="6" />
          <rect x="560" y="240" width="100" height="80" rx="6" />
          <rect x="690" y="260" width="120" height="60" rx="6" />
          <rect x="320" y="270" width="100" height="90" rx="6" />
          <rect x="460" y="300" width="80" height="70" rx="6" />
          <rect x="580" y="360" width="130" height="70" rx="6" />
          <rect x="330" y="400" width="110" height="80" rx="6" />
          <rect x="480" y="410" width="80" height="60" rx="6" />
          <rect x="740" y="360" width="100" height="90" rx="6" />
          <rect x="620" y="460" width="120" height="60" rx="6" />
        </g>
        <path
          d="M270 0 L290 560 M0 240 C300 230 600 220 900 230 M520 0 C540 200 520 380 560 560 M300 390 C500 380 700 350 900 330"
          stroke="#ffffff"
          strokeWidth="14"
          fill="none"
        />
        {pin(360, 110, "12", "#13222b")}
        {pin(470, 95, "8", "#13222b")}
        {pin(450, 205, "3", "#e0582f")}
        {pin(610, 280, "16", "#13222b")}
        {pin(740, 290, "5", "#e0582f")}
        {pin(370, 315, "9", "#13222b")}
        {pin(640, 395, "2", "#e8a33a")}
        {pin(390, 440, "11", "#13222b")}
        {pin(790, 405, "7", "#13222b")}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          bottom: 16,
          width: 250,
          background: "#fff",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "0 10px 30px rgba(19,34,43,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: "#13222b",
            }}
          />
          <b style={{ fontSize: 13 }}>Harbour Homes</b>
        </div>
        <div style={{ color: "#5f717a" }}>Maintenance · 6 open</div>
        {issue(
          "#e0582f",
          "Leak, kitchen sink",
          "Marina 3 · 1204",
          "Dispatch agent · Plumber booked 14:00",
        )}
        {issue(
          "#e0582f",
          "AC not cooling",
          "JLT T2 · 803",
          "Dispatch agent · Contractor quote in",
        )}
        {issue(
          "#e8a33a",
          "Door lock",
          "Bay 9 · 311",
          "Dispatch agent · Tenant replied",
        )}
        {issue(
          "#9fb1b9",
          "Repaint before move-in",
          "Marina 3 · 907",
          "Dispatch agent · Scheduled Thu",
        )}
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          width: 240,
          background: "#13222b",
          color: "#fff",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <b>Tenant messages</b>
        <span style={{ opacity: 0.75 }}>
          6 replies drafted by the Tenant desk agent
        </span>
        <span
          style={{
            alignSelf: "flex-start",
            background: "#fff",
            color: "#13222b",
            padding: "6px 12px",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          Review and send
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          width: 240,
          background: "#fff",
          borderRadius: 12,
          padding: 14,
          boxShadow: "0 10px 30px rgba(19,34,43,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#5f717a" }}>Rent collected · October</span>
          <b>94%</b>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: "#e6ecee",
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{ width: "94%", height: "100%", background: "#13222b" }}
          />
        </div>
        <div style={{ color: "#5f717a", marginTop: 8 }}>
          4 reminders scheduled
        </div>
      </div>
    </div>
  );
}

// 8 — law firm triaged inbox
function DashLaw() {
  const navItem = (label: string, n: string, active?: boolean) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 9px",
        borderRadius: 6,
        ...(active ? { background: "#1e1b2e", color: "#fff" } : {}),
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>{n}</span>
    </div>
  );
  const mail = (
    name: string,
    pill: string,
    pillBg: string,
    pillFg: string,
    body: string,
    active?: boolean,
  ) => (
    <div
      style={{
        padding: "11px 14px",
        borderBottom: "1px solid #f1eff5",
        ...(active ? { background: "#f5f3ff" } : {}),
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>{name}</b>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 999,
            background: pillBg,
            color: pillFg,
          }}
        >
          {pill}
        </span>
      </div>
      <div style={{ color: "#4b4862", marginTop: 3 }}>{body}</div>
    </div>
  );
  return (
    <div
      style={{
        width: 900,
        height: 560,
        background: "#ffffff",
        color: "#1e1b2e",
        fontSize: 12,
        display: "flex",
      }}
    >
      <div
        style={{
          width: 170,
          flex: "none",
          background: "#f6f5f8",
          borderRight: "1px solid #e9e7ef",
          padding: "14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <b style={{ fontSize: 13, marginBottom: 10 }}>Harlow &amp; Co.</b>
        {navItem("Inbox", "24", true)}
        {navItem("New matters", "6")}
        {navItem("Deadlines", "3")}
        {navItem("Drafts to approve", "4")}
        {navItem("Invoices", "9")}
        {navItem("Archive", "")}
        <div
          style={{
            marginTop: "auto",
            padding: 10,
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #e9e7ef",
          }}
        >
          <b>Next deadline</b>
          <div style={{ color: "#dc2626", marginTop: 3 }}>
            Filing · Thu 16 Oct
          </div>
        </div>
      </div>
      <div
        style={{
          width: 280,
          flex: "none",
          borderRight: "1px solid #e9e7ef",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #e9e7ef",
            color: "#6b6880",
          }}
        >
          Sorted by Intake agent
        </div>
        {mail(
          "A. Rahman",
          "New matter",
          "#7c3aed18",
          "#7c3aed",
          "Tenancy dispute, notice received",
          true,
        )}
        {mail(
          "Court registry",
          "Deadline",
          "#dc262618",
          "#dc2626",
          "Hearing date set · Case 2026/411",
        )}
        {mail(
          "K. Sato",
          "Intake",
          "#0f766e18",
          "#0f766e",
          "Signed engagement letter",
        )}
        {mail(
          "Billing",
          "Invoices",
          "#a1620718",
          "#a16207",
          "September invoices ready to send",
        )}
        {mail(
          "M. Ibrahim",
          "Client",
          "#47556918",
          "#475569",
          "Question about the share agreement",
        )}
      </div>
      <div
        style={{
          flex: 1,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div>
          <b style={{ fontSize: 15 }}>Tenancy dispute, notice received</b>
          <div style={{ color: "#6b6880", marginTop: 3 }}>
            A. Rahman · today 08:41
          </div>
        </div>
        <div style={{ lineHeight: 1.55, color: "#3a3750" }}>
          Hello, my landlord has served a 12-month notice on my office lease.
          I&apos;d like advice on whether it&apos;s valid and what my options
          are.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              background: "#ecfdf5",
              color: "#047857",
            }}
          >
            ✓ Conflict check clear
          </span>
          <span
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              background: "#f5f3ff",
              color: "#6d28d9",
            }}
          >
            Matter #2026-118 opened
          </span>
        </div>
        <div
          style={{
            flex: 1,
            border: "1.5px dashed #c4b5fd",
            borderRadius: 10,
            padding: 12,
            background: "#faf9ff",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "#6d28d9" }}>
            Intake agent · reply drafted
          </span>
          <div style={{ lineHeight: 1.55 }}>
            Dear Mr Rahman, thank you for getting in touch. We can review the
            notice this week. Could you send the lease and the notice letter?
            Our initial consultation is AED 1,500, credited against the matter
            if you go ahead.
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
            <span
              style={{
                background: "#1e1b2e",
                color: "#fff",
                padding: "7px 14px",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Approve and send
            </span>
            <span
              style={{
                border: "1px solid #d6d3e4",
                padding: "7px 14px",
                borderRadius: 6,
              }}
            >
              Edit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DASHBOARDS = [
  DashHotel,
  DashPipeline,
  DashClinic,
  DashGantt,
  DashCandidates,
  DashStore,
  DashProperty,
  DashLaw,
];

/* ----------------------------------------------------------------------- *
 * Shared arrow + hover rows
 * ----------------------------------------------------------------------- */

function Arrow({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="arrow"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M4 12 H19 M13 6 L19 12 L13 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

// §9 proof video. Autoplays muted + looping (browsers block autoplay with sound);
// a sound toggle unmutes it (the clip has embedded audio). `object-fit: contain`
// keeps its aspect ratio — it is never cropped. Sits on the drawn board below.
function ProofVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    const next = !sound;
    v.muted = !next;
    if (next) {
      v.volume = 1;
      void v.play();
    }
    setSound(next);
  };
  return (
    <>
      {/* biome-ignore lint/a11y/useMediaCaption: ambient dashboard clip, no dialogue */}
      <video
        ref={ref}
        className="proof-video"
        src="/media/persept_on_persept.mp4"
        poster="/media/persept_on_persept.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="The Persept OS dashboard, running live"
      />
      <button
        type="button"
        className="proof-sound"
        onClick={toggle}
        aria-pressed={sound}
        aria-label={sound ? "mute the video" : "play the video with sound"}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path
            d="M11 5 6 9H2v6h4l5 4V5Z"
            fill="currentColor"
            strokeWidth="1.6"
          />
          {sound ? (
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
          ) : (
            <path d="M22 9l-6 6M16 9l6 6" />
          )}
        </svg>
        <span>{sound ? "sound on" : "sound"}</span>
      </button>
    </>
  );
}

// The proof "meeting room" — hand-drawn cream line art (feTurbulence wobble) of a
// team facing a presentation board that plays the real dashboard video, with a
// cream "Outreach · 02:14" notification card overlapping the board. On phones the
// drawings drop and the video fills the width at its natural ratio.
function ProofScene() {
  return (
    <div className="proof-scene">
      <svg
        viewBox="0 0 1400 860"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="proof-svg"
        fill="none"
        stroke="#ecebe5"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <filter id="wob">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves={2}
              seed={4}
            />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--acc)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop
              offset="0"
              stopColor="oklch(0.7 0.1 220)"
              stopOpacity="0.22"
            />
            <stop offset="1" stopColor="oklch(0.7 0.1 220)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="700"
          cy="340"
          rx="660"
          ry="400"
          fill="url(#glow)"
          stroke="none"
        />
        <polygon
          points="120,40 20,420 220,420"
          fill="url(#beam)"
          stroke="none"
          opacity="0.7"
        />
        <polygon
          points="1280,40 1180,420 1380,420"
          fill="url(#beam)"
          stroke="none"
          opacity="0.7"
        />
        <g filter="url(#wob)">
          <path d="M120 -60 L120 16 M1280 -60 L1280 16" />
          <path
            d="M92 40 Q92 16 120 16 Q148 16 148 40 Z M1252 40 Q1252 16 1280 16 Q1308 16 1308 40 Z"
            fill="#0c0c0c"
          />
          <path d="M236 60 Q236 46 250 46 L1150 46 Q1164 46 1164 60 L1164 620 Q1164 634 1150 634 L250 634 Q236 634 236 620 Z" />
          <path d="M320 652 L1080 652" strokeWidth={3} />
          <path
            d="M860 646 L900 646 M916 646 L950 646"
            stroke="var(--acc)"
            strokeWidth={4}
          />
          <path
            d="M0 600 C200 598 190 602 210 600 M1190 600 C1210 598 1300 602 1400 600"
            strokeWidth={1.6}
            opacity="0.45"
          />
          <path
            d="M60 860 L72 780 L140 780 L152 860 M84 780 C70 720 40 690 30 640 M104 780 C104 710 96 660 110 600 M124 780 C140 720 170 700 184 660 M96 740 C80 730 60 732 48 720 M112 700 C126 690 140 690 150 676"
            strokeWidth={2}
          />
          <path d="M480 688 L920 688 L1180 820 L220 820 Z" fill="#0c0c0c" />
          <path d="M220 820 L220 836 L1180 836 L1180 820" />
          <path
            d="M540 716 L620 716 L610 690 M540 716 L552 690"
            strokeWidth={2}
          />
          <path
            d="M790 712 L790 734 Q790 740 796 740 L816 740 Q822 740 822 734 L822 712 Z M822 718 Q832 718 832 726 Q832 732 822 732"
            strokeWidth={2}
            fill="#0c0c0c"
          />
          <path
            d="M680 760 L740 752 L748 790 L688 798 Z"
            strokeWidth={1.8}
            opacity="0.8"
          />
          <path
            d="M300 862 L300 846 Q300 824 330 822 L470 822 Q500 824 500 846 L500 862"
            fill="#0c0c0c"
          />
          <path
            d="M318 862 Q318 806 360 796 Q384 790 390 780 Q366 760 366 730 A34 34 0 1 1 434 730 Q434 760 410 780 Q416 790 440 796 Q482 806 482 862"
            fill="#0c0c0c"
          />
          <path
            d="M900 862 L900 846 Q900 824 930 822 L1070 822 Q1100 824 1100 846 L1100 862"
            fill="#0c0c0c"
          />
          <path
            d="M918 862 Q918 806 960 796 Q984 790 990 780 Q966 760 966 730 A34 34 0 1 1 1034 730 Q1034 760 1010 780 Q1016 790 1040 796 Q1082 806 1082 862"
            fill="#0c0c0c"
          />
          <path
            d="M560 862 L560 846 Q560 816 600 812 L800 812 Q840 816 840 846 L840 862"
            fill="#0c0c0c"
          />
          <path
            d="M586 862 Q586 790 640 776 Q670 768 676 754 Q644 728 644 690 A56 56 0 1 1 756 690 Q756 728 724 754 Q730 768 760 776 Q814 790 814 862"
            fill="#0c0c0c"
          />
          <path
            d="M540 862 L540 842 Q540 828 560 828 L840 828 Q860 828 860 842 L860 862"
            fill="#0c0c0c"
          />
        </g>
      </svg>
      {/* the video plays on the drawn presentation board (muted autoplay loop) */}
      <ProofVideo />
    </div>
  );
}

/* SSR-safe desktop flag used only for the collage layout branch. Default
 * false so the server render matches the mobile (margin-based) markup and
 * there is no hydration mismatch. */
function useIsWide(min: number) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width:${min}px)`);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [min]);
  return wide;
}

/* ----------------------------------------------------------------------- *
 * Component
 * ----------------------------------------------------------------------- */

export function Landing12() {
  const [revealed, setRevealed] = useState(false);
  const [stampPressed, setStampPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // approval queue: index → "sent"
  const [sent, setSent] = useState<Record<number, boolean>>({});

  const stampTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const wideCollage = useIsWide(1100);

  // hero load reveal (load-only, honours reduced motion via the CSS)
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setRevealed(true), prefersReduced ? 0 : 150);
    return () => clearTimeout(t);
  }, []);

  // approval queue: flip "Waiting for you" → "Sent" one by one on a ~2.8s tick
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    let i = 0;
    const iv = setInterval(() => {
      setSent((prev) => {
        if (i >= QUEUE.length) {
          // small pause with all sent, then reset the sequence
          if (Object.keys(prev).length >= QUEUE.length) {
            i = 0;
            return {};
          }
          return prev;
        }
        const next = { ...prev, [i]: true };
        i += 1;
        return next;
      });
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  const pressStamp = () => {
    setStampPressed(true);
    clearTimeout(stampTimer.current);
    stampTimer.current = setTimeout(() => setStampPressed(false), 170);
  };

  const markSent = (i: number) => setSent((prev) => ({ ...prev, [i]: true }));

  const navHref = (i: number) => NAV[i][1];

  return (
    <div className={`pl12${revealed ? " revealed" : ""}`}>
      {/* grain overlay */}
      <svg className="grain" aria-hidden="true">
        <filter id="pl12-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pl12-grain)" />
      </svg>

      {/* 1 — NAV */}
      <nav className="plnav">
        <div className="nav-links">
          <div className="nav-group">
            <a href="#idea">The idea</a>
            <a href="#work">What it does</a>
            <a href="#examples">Built for you</a>
          </div>
        </div>
        <a href="#top" className="wordmark">
          <svg
            viewBox="10.31 8 79.38 84"
            width="18"
            height="19"
            aria-hidden="true"
          >
            <path
              d="M10.31 16.51L68.86 16.51L56.69 32.09L10.31 32.09ZM80.26 32.09L89.16 20.7L89.16 32.09Z"
              style={{ fill: "var(--acc)" }}
            />
            <path
              fillRule="evenodd"
              d="M77.41 8L89.69 17.59L31.55 92L19.28 82.41ZM70.67 24.3a3.89 3.89 0 1 0 7.79 0a3.89 3.89 0 1 0 -7.79 0Z"
              style={{ fill: "var(--acc)" }}
            />
          </svg>
          <span>persept</span>
        </a>
        <div className="nav-links-r">
          <div className="nav-group">
            <a href="#process">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <a
            className="wa-pill"
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
          >
            <span className="wa-dot" />
            WhatsApp
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true">
              <path
                d="M0 1 H20 M0 6 H20 M0 11 H20"
                stroke="#ecebe5"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* 2 — HERO */}
      <header id="top" className="hero">
        <div className="eyebrow">(Custom-built for your business)</div>
        <h1>
          <span className="line line-1">
            <span>Hire your</span>
          </span>
          <span className="line line-2">
            <span>own AI</span>
          </span>
          <span className="line line-3">
            <span>Workforce</span>
          </span>
          <button
            type="button"
            className={`stamp${stampPressed ? " pressed" : ""}`}
            onClick={pressStamp}
            aria-label="Approved by you"
          >
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <filter
                  id="pl12-stampInk"
                  x="-5%"
                  y="-5%"
                  width="110%"
                  height="110%"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.85"
                    numOctaves="2"
                    seed="5"
                    result="n"
                  />
                  <feColorMatrix
                    in="n"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.8 1.35"
                    result="m"
                  />
                  <feComposite in="SourceGraphic" in2="m" operator="in" />
                </filter>
                <path
                  id="pl12-stampRing"
                  d="M100 100 m-75 0 a75 75 0 1 1 150 0 a75 75 0 1 1 -150 0"
                />
              </defs>
              <g
                filter="url(#pl12-stampInk)"
                style={{ fill: "var(--acc)", stroke: "var(--acc)" }}
              >
                <circle cx="100" cy="100" r="95" fill="none" strokeWidth="5" />
                <circle cx="100" cy="100" r="57" fill="none" strokeWidth="3" />
                <text
                  fontFamily="var(--font-outfit), Outfit, sans-serif"
                  fontWeight="700"
                  fontSize="17"
                  letterSpacing="3.4"
                  stroke="none"
                >
                  <textPath href="#pl12-stampRing">
                    APPROVED BY YOU ✦ APPROVED BY YOU ✦
                  </textPath>
                </text>
                <path
                  d="M74 102 L93 121 L128 82"
                  fill="none"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </button>
        </h1>
        <div className="hero-copy">
          <p>
            Persept builds a custom AI Workforce for your business. It finds
            work, follows up and writes, every day. You press approve.
          </p>
          <div className="cta-row">
            <a className="btn-primary" href="#start">
              Book a call
            </a>
            <a className="btn-secondary" href="#examples">
              See examples
            </a>
          </div>
          <div className="tools">
            <span className="tools-label">
              Works with the tools you already use
            </span>
            <div className="tools-names">
              <span>Gmail</span>
              <span>Outlook</span>
              <span>WhatsApp</span>
              <span>HubSpot</span>
              <span>Zoho</span>
              <span>Google Sheets</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3 — TICKER */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((k) => (
            <span key={k}>
              Finding leads <b>✦</b> Writing proposals <b>✦</b> Answering
              WhatsApp <b>✦</b> Day 3 follow-ups <b>✦</b> Booking site visits{" "}
              <b>✦</b> Chasing suppliers <b>✦</b> Renewals <b>✦</b> The 7:00
              brief <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      {/* 4 — THE IDEA */}
      <section id="idea" className="idea-sec">
        <div className="idea-grid">
          <div className="label">(The idea)</div>
          <p>
            Most businesses don&apos;t need more people. They need the same work
            done every day, without anyone having to remember it.{" "}
            <span className="dim">
              Persept builds you an AI Workforce that does exactly that, in your
              tools and in your tone, and checks with you before anything
              leaves.
            </span>
          </p>
        </div>
      </section>

      {/* 5 — WHAT IT DOES */}
      <section id="work" className="sec ruled">
        <div className="wrap">
          <div className="work-head">
            <div>
              <div className="label">(What it does)</div>
              <h2 className="h2">
                What your
                <br />
                workforce takes on
              </h2>
            </div>
            <p>
              Pick the work that eats your week. We build an agent for each job,
              connected to your tools and written in your tone.
            </p>
          </div>
          <div className="caps">
            {CAPS.map(([name, desc, tags], i) => (
              <div className="cap" key={name}>
                <span className="cap-no">{`0${i + 1}`}</span>
                <span className="cap-name">{name}</span>
                <span className="cap-desc">{desc}</span>
                <span className="cap-tags">
                  {tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — BUILT FOR YOU (light) */}
      <section id="examples" className="examples">
        <div className="collage">
          <div className="ex-text">
            <div className="label">(Built for you)</div>
            <h2>Designed around your business</h2>
            <p>
              No templates. We sit down with you, map how your business actually
              runs, then design the agents and the dashboard around it.
              That&apos;s why no two workforces we build look the same.
            </p>
            <a href="#start">Design mine</a>
          </div>
          {DASHBOARDS.map((Dash, i) => {
            const [w, x, y, r] = (wideCollage ? POS : POS_MOB)[i];
            const cardStyle: React.CSSProperties = wideCollage
              ? {
                  width: `${w}%`,
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `rotate(${r}deg)`,
                  zIndex: 1,
                }
              : {
                  width: `${w}%`,
                  marginLeft: `${x}%`,
                  marginTop: `${y}%`,
                  transform: `rotate(${r}deg)`,
                  zIndex: i + 1,
                };
            // scale the 900px artboard to the card's current pixel width.
            // cardWidth = w% of the collage width; we scale via the art
            // wrapper using (cardWidth − 14) / 900 relative to a 900px box.
            return (
              <figure className="ex-card" key={Dash.name} style={cardStyle}>
                <div className="ex-frame">
                  <div className="ex-screen">
                    <ExArt>
                      <Dash />
                    </ExArt>
                  </div>
                </div>
              </figure>
            );
          })}
        </div>
      </section>

      {/* 7 — HOW IT WORKS */}
      <section id="process" className="sec">
        <div className="wrap">
          <div className="label" style={{ marginBottom: 18 }}>
            (How it works)
          </div>
          <h2 className="process-head">
            Call to crew
            <br />
            <span className="outline-ink">in seven days</span>
          </h2>
          <div className="steps">
            {[
              [
                "01",
                "Day 1",
                "We map how you work",
                "A 15-minute call, then a short workshop. We find the work that repeats and what it costs you.",
              ],
              [
                "02",
                "Days 2–5",
                "We build your agents",
                "Custom roles, connected to your tools, trained on your past work, your prices and your tone.",
              ],
              [
                "03",
                "Day 7",
                "You approve, they run",
                "The agents work every day. Anything going out waits for you in one approvals inbox.",
              ],
              [
                "04",
                "Every week",
                "It improves",
                "A weekly review shows what worked. We tune the team as your business grows.",
              ],
            ].map(([num, when, title, copy], i) => (
              <div className="step" key={num}>
                <span className={`num${i === 3 ? " solid" : ""}`}>{num}</span>
                <span className="step-when">{when}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — FINAL SAY */}
      <section className="final">
        <div className="final-wrap">
          <div className="final-left">
            <div className="label">(You keep the final say)</div>
            <h2>Nothing leaves without you</h2>
            <div className="final-points">
              <div>
                Every email, price and post waits in your approvals inbox.
              </div>
              <div>Clear it in a few minutes a day, from your phone.</div>
              <div>
                Prices come only from your rate card. The agents never invent a
                number.
              </div>
              <div>The agents never phone anyone. Calls are yours.</div>
            </div>
          </div>
          <div className="queue">
            {QUEUE.map((q, i) => {
              const isSent = !!sent[i];
              return (
                <div
                  className="qcard"
                  key={q.t}
                  style={{
                    opacity: isSent ? 0.55 : 1,
                    transform: isSent ? "translateX(16px)" : "translateX(0)",
                  }}
                >
                  <div className="q-role">
                    <span className="q-sq" style={{ background: QC[q.k] }} />
                    <span>{q.who}</span>
                  </div>
                  <div className="q-title">{q.t}</div>
                  <div className="q-foot">
                    <button
                      type="button"
                      className="q-btn"
                      onClick={() => markSent(i)}
                    >
                      {q.verb}
                    </button>
                    <span className="q-state">
                      {isSent ? "Sent" : "Waiting for you"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9 — PERSEPT RUNS ON PERSEPT */}
      <section id="proof" className="sec">
        <div className="wrap">
          <div className="proof-head">
            <div>
              <div className="label">(Proof)</div>
              <h2 className="h2">
                Persept runs
                <br />
                <span className="acc">on Persept</span>
              </h2>
            </div>
            <p>
              Our own AI Workforce finds our leads, writes our outreach and
              drafts our proposals. This is the dashboard we run the company
              from every day.
            </p>
          </div>
          <ProofScene />
          <div className="proof-agents">
            {PROOF_AGENTS.map((p) => (
              <div className="pagent" key={p.agent}>
                <Persona agent={p.agent} size={40} />
                <div>
                  <div className="p-title">{p.title}</div>
                  <div className="p-stat">{p.stat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 — COMPARISON */}
      <section id="compare" className="sec ruled">
        <div className="wrap">
          <div className="label" style={{ marginBottom: 18 }}>
            (Comparison)
          </div>
          <h2 className="h2 cmp-head">
            What else
            <br />
            you could do
          </h2>

          {/* desktop table ≥760 */}
          <div className="cmp-table-wrap cmp-desk">
            <div className="cmp-table">
              <div className="ch" />
              <div className="ch ch-alt">Hire a sales coordinator</div>
              <div className="ch ch-alt">Pay-per-lead sites</div>
              <div className="ch ch-alt">Do it yourself</div>
              <div className="ch ch-persept cmp-tint">Persept</div>
              {CMP.map(([label, persept, alts]) => (
                <Fragment key={label}>
                  <div className="cell cell-label">{label}</div>
                  <div className="cell">{alts[0]}</div>
                  <div className="cell">{alts[1]}</div>
                  <div className="cell">{alts[2]}</div>
                  <div className="cell cell-persept cmp-tint">{persept}</div>
                </Fragment>
              ))}
            </div>
          </div>

          {/* mobile cards <760 */}
          <div className="cmp-cards cmp-mob">
            {CMP.map(([label, persept, alts]) => (
              <div className="cmp-card" key={label}>
                <div className="cc-head cmp-tint">
                  <div className="cc-l">{label}</div>
                  <div className="cc-p">Persept · {persept}</div>
                </div>
                {CMP_ALTS.map((n, i) => (
                  <div className="cc-row" key={n}>
                    <span className="cc-n">{n}</span>
                    <span className="cc-v">{alts[i]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11 — PRICING */}
      <section id="pricing" className="sec ruled">
        <div className="wrap">
          <div className="label" style={{ marginBottom: 18 }}>
            (Pricing)
          </div>
          <h2 className="h2 cmp-head">Start small</h2>
          <div className="tier-grid">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`tier${t.featured ? " featured" : ""}`}
              >
                <div className="tier-head">
                  <h3>{t.name}</h3>
                  {t.tag && <span className="tier-tag">{t.tag}</span>}
                </div>
                <p className="tier-gets">{t.gets}</p>
                {t.custom ? (
                  <div className="tier-price tier-price-custom">
                    <span className="tier-custom">{t.custom}</span>
                  </div>
                ) : (
                  <div className="tier-price">
                    <span className="tier-amt">{t.monthly}</span>
                    <span className="tier-per">/ month</span>
                    {t.was && <span className="tier-was">{t.was}</span>}
                  </div>
                )}
                <dl className="tier-rows">
                  {t.setup && (
                    <div>
                      <dt>Setup</dt>
                      <dd>{t.setup}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Minimum term</dt>
                    <dd>{t.term}</dd>
                  </div>
                  <div>
                    <dt>Live in</dt>
                    <dd>{t.live}</dd>
                  </div>
                </dl>
                {t.guarantee && (
                  <div className="tier-guar">30-day guarantee</div>
                )}
                <a
                  className={t.featured ? "btn-primary" : "btn-secondary"}
                  href="#start"
                >
                  {t.featured ? "Claim a spot" : "Book a call"}
                </a>
              </div>
            ))}
          </div>
          <div className="price-notes">
            <p>
              <span className="pn-mark" />
              Founding pricing is for the first three clients only, in exchange
              for a case study and a testimonial. Three spots, then it&apos;s
              gone.
            </p>
            <p>
              <span className="pn-mark" />
              30-day guarantee on Founding: if your agent hasn&apos;t won you a
              lead or saved you real time in the first month, your setup fee is
              refunded.
            </p>
          </div>
        </div>
      </section>

      {/* 12 — FAQ */}
      <section id="faq" className="faq-sec ruled">
        <div className="faq-grid">
          <div className="label">(Questions)</div>
          <div className="faq-list">
            {FAQ.map(([q, a]) => (
              <details className="faq" key={q}>
                <summary>
                  <span>{q}</span>
                  <span className="faq-plus">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 13 — START A PROJECT */}
      <section id="start" className="sec ruled">
        <div className="start-wrap">
          <div className="start-head">
            <div className="label">(Start a project)</div>
            <h2>
              Let&apos;s build
              <br />
              your <span className="acc">workforce</span>
            </h2>
            <p>
              Tell us what eats your week. We&apos;ll show you what a workforce
              for it would look like.
            </p>
            <div className="founder">
              <div className="photo" aria-hidden="true">
                {FOUNDER.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="f-text">
                <b>{FOUNDER.name}</b>, founder
                <br />
                <span>Every workforce is set up and looked after by me.</span>
              </div>
            </div>
          </div>
          <div className="start-nav">
            <a
              className="hrow wa"
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <span className="r-kicker">Message us</span>
                <span className="r-name">WhatsApp</span>
              </span>
              {/* arrow by default; the WhatsApp glyph (white) on hover */}
              <Arrow />
              <svg
                className="brand"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a className="hrow mail" href={EMAIL_HREF}>
              <span>
                <span className="r-kicker">Email</span>
                <span className="r-name">{EMAIL}</span>
              </span>
              {/* arrow by default; a white mail icon on hover */}
              <Arrow />
              <svg
                className="brand"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 14 — FOOTER */}
      <footer className="plfoot">
        <div className="foot-wrap">
          <div className="foot-nav">
            <div className="foot-tag">
              <span className="dot" />
              Navigation
            </div>
            {NAV.map(([n], i) => (
              <a className="hrow" href={navHref(i)} key={n}>
                <span>{n}</span>
                <Arrow size={44} />
              </a>
            ))}
          </div>
          <div className="foot-right">
            <div className="foot-col">
              <span className="col-label">(Studio details)</span>
              <a className="mail" href={EMAIL_HREF}>
                {EMAIL}
              </a>
              <span className="detail">
                Based in Dubai.
                <br />
                Working with businesses across the UAE.
              </span>
            </div>
            <div className="foot-col">
              <span className="col-label">(Product)</span>
              <a href={GYST_HREF}>GYST ↗</a>
            </div>
            <div className="foot-col socials">
              <span className="col-label">(Socials)</span>
              <a href={LINKEDIN_HREF} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
                WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 Persept Software Solutions</span>
          <div className="legal-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/trust">Trust</a>
            <a href="/login">Client sign in</a>
          </div>
        </div>
      </footer>

      {/* full-screen menu */}
      {menuOpen && (
        <div className="menu">
          <div className="menu-top">
            <div className="nav-tag">
              <span className="dot" />
              Navigation
            </div>
            <button
              type="button"
              className="menu-close"
              onClick={() => setMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="menu-rows">
            {NAV.map(([n], i) => (
              <a
                className="hrow"
                href={navHref(i)}
                key={n}
                onClick={() => setMenuOpen(false)}
              >
                <span>{n}</span>
                <Arrow size={48} />
              </a>
            ))}
          </div>
          <div className="menu-foot">
            <a
              className="menu-signin"
              href="/login"
              onClick={() => setMenuOpen(false)}
            >
              Client sign in
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* Wrapper that measures the rendered card width and scales the 900px
 * artboard to fit it ((cardWidth − 14) / 900), keeping the collage artwork
 * crisp at any card size. */
function ExArt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current?.parentElement; // .ex-screen
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w) setScale((w - 14) / 900);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="ex-art" ref={ref} style={{ transform: `scale(${scale})` }}>
      {children}
    </div>
  );
}
