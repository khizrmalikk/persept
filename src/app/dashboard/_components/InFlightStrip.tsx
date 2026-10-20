"use client";

import { useState } from "react";
import {
  ageLabel,
  FLIGHT_ORDER,
  type FlightStatus,
  inFlightSummary,
  type OSFlightRow,
} from "../_data/copy-types";
import { type AgentKey, Persona } from "./Persona";

// day-47 "work in flight": a collapsible strip of copy requests still moving
// between agents — Scribe writing, a question waiting on you, a stalled or
// refused one — so nothing vanishes for an hour between the ask and the draft.
// Shown above "waiting for you" on approvals, and (filtered) on the front desk
// and marketing. Collapsed to one line by default; click to expand.

const STATUS_COLOR: Record<FlightStatus, string> = {
  question: "var(--ambink)",
  refused: "var(--bad)",
  stalled: "var(--ambink)",
  writing: "var(--c-muse)",
  requested: "var(--soft)",
};

export function InFlightStrip({
  rows,
  onOpenApproval,
}: {
  rows: OSFlightRow[];
  onOpenApproval: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  const ordered = [...rows].sort(
    (a, b) =>
      FLIGHT_ORDER.indexOf(a.status) - FLIGHT_ORDER.indexOf(b.status) ||
      b.ageMin - a.ageMin,
  );

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--line)",
        background: "var(--surf)",
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--ink)",
          textAlign: "left",
        }}
      >
        <span
          className="os-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--t-muse)",
            color: "var(--c-muse)",
            flex: "none",
          }}
        >
          in flight · {rows.length}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            color: "var(--soft)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {inFlightSummary(ordered)}
        </span>
        <span style={{ fontSize: 11, color: "var(--mute)", flex: "none" }}>
          {open ? "hide" : "show"}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid var(--line)",
          }}
        >
          {ordered.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                borderTop: "1px solid var(--line)",
                fontSize: 12.5,
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", flex: "none" }}
              >
                <Persona
                  agent={(r.forAgent as AgentKey) || "chief"}
                  size={20}
                />
                <span style={{ color: "var(--mute)", margin: "0 5px" }}>→</span>
                <Persona agent="scribe" size={20} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{r.kind || "copy"}</b>
                {r.who ? ` · ${r.who}` : ""}
                {r.campaign ? (
                  <span style={{ color: "var(--mute)" }}> · {r.campaign}</span>
                ) : null}
                {r.status === "refused" && r.reason && (
                  <span
                    style={{
                      display: "block",
                      color: "var(--ambink)",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {r.reason}
                  </span>
                )}
              </span>
              <span
                style={{
                  color: STATUS_COLOR[r.status],
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                {r.status} · {ageLabel(r.ageMin)}
              </span>
              {r.status === "question" && r.approvalId != null && (
                <button
                  type="button"
                  onClick={() => onOpenApproval(r.approvalId as number)}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flex: "none",
                  }}
                >
                  answer →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
