"use client";

import { useEffect, useRef, useState } from "react";
import type { OSAgent } from "../_data/agents";
import { DOCK_WS, WINDOWS } from "../_data/windows";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// ⌘K palette. Typing anything and pressing Enter asks Percy (opens the drawer on
// the Percy thread, carrying the text). It doubles as navigation: workspaces,
// agents, deals and projects — indexed from the real tables, filtered by query.
export function Palette({
  agents,
  deals,
  projects,
}: {
  agents: OSAgent[];
  deals: { key: string; company: string; stage: string }[];
  projects: { id: string; name: string }[];
}) {
  const os = useOS();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const query = q.trim().toLowerCase();
  const wsItems = DOCK_WS.map((k) => WINDOWS[k]).filter(
    (w) => !query || w.name.includes(query) || w.cat.includes(query),
  );
  const agentItems = agents.filter(
    (a) =>
      !query || a.name.toLowerCase().includes(query) || a.room.includes(query),
  );
  const dealItems = deals
    .filter((d) => !query || d.company.toLowerCase().includes(query))
    .slice(0, query ? 6 : 3);
  const projectItems = projects
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .slice(0, query ? 5 : 2);

  const askPercy = () => {
    os.openDrawer("percy");
    os.closePal();
    // The Percy thread composer picks up a pending ask via sessionStorage.
    if (q.trim()) window.sessionStorage.setItem("os-ask-percy", q.trim());
    window.dispatchEvent(new CustomEvent("os-ask-percy"));
  };

  return (
    <>
      <button
        type="button"
        aria-label="close palette"
        onClick={os.closeOverlays}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          background: "var(--scrim)",
          backdropFilter: "blur(4px)",
          border: "none",
          cursor: "default",
        }}
      />
      <div
        className="os-popin-cx"
        style={{
          position: "absolute",
          top: 140,
          left: "50%",
          transform: "translateX(-50%)",
          width: 680,
          zIndex: 51,
          background: "var(--surf)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          boxShadow: "var(--shadow)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Persona agent="percy" size={34} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) askPercy();
            }}
            placeholder="ask percy anything, or jump to a deal, project or agent"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-ui)",
              fontSize: 18,
            }}
          />
          <span
            className="os-mono"
            style={{
              fontSize: 11,
              color: "var(--mute)",
              padding: "3px 7px",
              border: "1px solid var(--line)",
              borderRadius: 6,
            }}
          >
            esc
          </span>
        </div>
        <div
          style={{
            padding: "8px 10px 12px",
            display: "flex",
            flexDirection: "column",
            maxHeight: 460,
            overflow: "auto",
          }}
        >
          {q.trim() && (
            <button
              type="button"
              onClick={askPercy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 10px",
                borderRadius: 10,
                background: "var(--surf2)",
                cursor: "pointer",
                margin: "4px 0 6px",
                border: "none",
                textAlign: "left",
                color: "var(--ink)",
              }}
            >
              <span style={{ fontSize: 14, flex: 1 }}>
                ask percy: <b>{q}</b>
              </span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>
                ↵ percy hands it to the right agent
              </span>
            </button>
          )}
          {wsItems.length > 0 && <GroupLabel>go to</GroupLabel>}
          {wsItems.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => os.open(w.key)}
              style={rowStyle}
            >
              <span
                className={w.key === "approvals" ? undefined : "os-header-tile"}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background:
                    w.key === "approvals" ? "var(--accent)" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={w.key === "approvals" ? "var(--onacc)" : "var(--ink)"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={w.glyph} />
                </svg>
              </span>
              <span style={{ fontSize: 13.5, flex: 1 }}>{w.name}</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>
                {w.cat}
              </span>
            </button>
          ))}
          {agentItems.length > 0 && <GroupLabel>agents</GroupLabel>}
          {agentItems.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => os.openAgent(a.id)}
              style={rowStyle}
            >
              <Persona agent={a.id} size={24} status={a.status} />
              <span style={{ fontSize: 13.5, flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>
                {a.room}
              </span>
            </button>
          ))}
          {dealItems.length > 0 && <GroupLabel>deals</GroupLabel>}
          {dealItems.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => os.open("frontdesk", { deal: d.key })}
              style={rowStyle}
            >
              <Persona agent="hunter" size={24} />
              <span style={{ fontSize: 13.5, flex: 1 }}>{d.company}</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>
                {d.stage}
              </span>
            </button>
          ))}
          {projectItems.length > 0 && <GroupLabel>projects</GroupLabel>}
          {projectItems.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => os.open("dev", { p: p.id })}
              style={rowStyle}
            >
              <Persona agent="fixer" size={24} />
              <span style={{ fontSize: 13.5, flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>
                project
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  border: "none",
  background: "transparent",
  textAlign: "left",
  color: "var(--ink)",
};

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="os-mono"
      style={{
        fontSize: 10.5,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--mute)",
        padding: "10px 10px 4px",
      }}
    >
      {children}
    </span>
  );
}
