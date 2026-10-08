"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The office panel: a room per agent. Static data comes from the server; this
// island only adds the *live feel* — sub-agent dots wander their room and the
// progress bar of a working agent climbs. Purely visual (real state arrives on
// the 6s refresh); nothing here writes.

export type OfficeWorker = { color: string; fill: string; task: string };
export type OfficeRoom = {
  id: string;
  href: string;
  room: string;
  name: string;
  emoji: string;
  color: string;
  tint: string;
  glow: string;
  border: string;
  borderStyle: string;
  avatarShadow: string;
  statusLabel: string;
  chipBg: string;
  chipFg: string;
  status: "working" | "waiting" | "idle" | "soon";
  task: string;
  basePct: number;
  workerLine: string;
  // a small extra chip on the card (e.g. Fixer's "N open PRs"); "" = none.
  badge: string;
  waiting: boolean;
  waitingText: string;
  opacity: number;
  workers: OfficeWorker[];
};

// deterministic start position for worker `i` (avoids an SSR/client mismatch)
const startX = (i: number) => (i % 2 === 0 ? 22 : 78);
const startY = (i: number) => 30 + ((i * 17) % 38);
// a random "wander" spot kept clear of the room centre
const wanderX = () =>
  Math.random() < 0.5 ? 12 + Math.random() * 16 : 72 + Math.random() * 16;
const wanderY = () => 26 + Math.random() * 40;

export function OfficeRooms({ rooms }: { rooms: OfficeRoom[] }) {
  // per-room worker positions + per-room animated pct
  const [pos, setPos] = useState<Record<string, { x: number; y: number }[]>>(
    () =>
      Object.fromEntries(
        rooms.map((r) => [
          r.id,
          r.workers.map((_, i) => ({ x: startX(i), y: startY(i) })),
        ]),
      ),
  );
  const [pct, setPct] = useState<Record<string, number>>(() =>
    Object.fromEntries(rooms.map((r) => [r.id, r.basePct])),
  );

  useEffect(() => {
    const wander = setInterval(() => {
      setPos((prev) => {
        const next: Record<string, { x: number; y: number }[]> = {};
        for (const r of rooms)
          next[r.id] = r.workers.map((_, i) =>
            Math.random() < 0.55
              ? { x: wanderX(), y: wanderY() }
              : (prev[r.id]?.[i] ?? { x: startX(i), y: startY(i) }),
          );
        return next;
      });
    }, 2600);
    const climb = setInterval(() => {
      setPct((prev) => {
        const next = { ...prev };
        for (const r of rooms) {
          if (r.status !== "working") continue;
          const v = (prev[r.id] ?? 0) + 4 + Math.random() * 10;
          next[r.id] = v >= 100 ? 6 : v;
        }
        return next;
      });
    }, 1200);
    return () => {
      clearInterval(wander);
      clearInterval(climb);
    };
  }, [rooms]);

  return (
    <div className="of-office">
      <div className="of-office-head">
        <div className="of-office-head-l">
          <span className="of-office-title">the office</span>
          <span className="of-office-sub">
            six rooms · click a room to open the agent
          </span>
        </div>
        <div className="of-legend">
          <span>
            <i style={{ background: "var(--ink)" }} />
            working
          </span>
          <span>
            <i style={{ border: "1.5px solid var(--ink-mut)" }} />
            worker
          </span>
          <span>
            <i style={{ background: "var(--accent)" }} />
            needs you
          </span>
        </div>
      </div>
      <div className="of-grid">
        {rooms.map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className="of-room"
            style={{
              border: `1px ${r.borderStyle} ${r.border}`,
              opacity: r.opacity,
            }}
          >
            <span className="of-room-floor" />
            <span className="of-room-glow" style={{ background: r.glow }} />
            <span className="of-room-top">
              <span className="of-room-label">{r.room}</span>
              <span
                className="of-room-chip"
                style={{ background: r.chipBg, color: r.chipFg }}
              >
                {r.statusLabel}
              </span>
            </span>
            <span className="of-room-desk" />
            {r.workers.map((w, i) => {
              const p = pos[r.id]?.[i] ?? { x: startX(i), y: startY(i) };
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: workers are positional and unlabeled per-room
                  key={i}
                  className="of-worker"
                  title={w.task}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    border: `1.5px solid ${w.color}`,
                    background: w.fill,
                  }}
                >
                  <i style={{ background: w.color }} />
                </span>
              );
            })}
            <span className="of-room-center">
              {r.waiting && <span className="of-bubble">{r.waitingText}</span>}
              <span
                className="of-avatar"
                style={{ background: r.tint, boxShadow: r.avatarShadow }}
              >
                {r.emoji}
              </span>
              <span className="of-room-name">{r.name}</span>
            </span>
            <span className="of-room-bottom">
              <span className="of-room-taskrow">
                <span className="of-room-task">{r.task}</span>
                {r.badge && <span className="of-room-badge">{r.badge}</span>}
                {r.workerLine && (
                  <span className="of-room-wl">{r.workerLine}</span>
                )}
              </span>
              <span className="of-bar">
                <span
                  className="of-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round(pct[r.id] ?? 0))}%`,
                    background: r.color,
                  }}
                />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
