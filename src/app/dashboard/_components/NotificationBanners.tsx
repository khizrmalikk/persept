"use client";

import { useEffect, useRef, useState } from "react";
import type { OSEvent } from "../_data/desktop-types";
import { AGENT_HUE_VAR } from "../_data/windows";
import { useOS } from "./os-store";
import { Persona } from "./Persona";

// v3 §8 notification banners. When a genuinely new agent event lands in the
// desktop feed (which refreshes on the tick via router.refresh), one banner
// slides in at the top-right, shows the agent + kind + text, and auto-hides.
//
// All the gating (view.banners off, locked, booting, notifications/search/
// monitor open) is folded into the `suppressed` prop so this component only
// owns the local mechanics: which event id we last saw, the pending queue, and
// the throttle/auto-hide timers. The feed is newest-first, so feed[0] is the
// latest event; we watch its id.

// at most one banner every 8s; each visible banner auto-hides after 5.2s
const THROTTLE_MS = 8000;
const VISIBLE_MS = 5200;

// kind → workspace routing (§8). Anything else opens the agent's own page.
function routeFor(kind: string): "frontdesk" | "dev" | "marketing" | null {
  const k = kind.toLowerCase();
  if (k === "lead" || k === "message" || k === "proposal") return "frontdesk";
  if (k === "fix") return "dev";
  if (k === "post") return "marketing";
  return null;
}

export function NotificationBanners({
  feed,
  suppressed,
}: {
  feed: OSEvent[];
  // true when banners must not appear (view.banners off, locked, booting, or
  // notifications/palette/monitor open). New events are still recorded as seen
  // while suppressed, so they don't all fire the moment suppression lifts.
  suppressed: boolean;
}) {
  const os = useOS();
  const [current, setCurrent] = useState<OSEvent | null>(null);
  const [leaving, setLeaving] = useState(false);

  // the newest id we've already accounted for. Seeded on mount with the current
  // feed head so the backlog never banners — only events newer than mount do.
  const lastSeen = useRef<string | null>(null);
  const seeded = useRef(false);
  // events waiting to be shown (newest arrivals pushed on the end)
  const queue = useRef<OSEvent[]>([]);
  // when the last banner started showing (for the 8s throttle)
  const lastShownAt = useRef(0);
  const hideTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);
  const pumpTimer = useRef<number | undefined>(undefined);

  // ── watch the feed head: enqueue every event newer than the last seen one ──
  useEffect(() => {
    const head = feed[0];
    if (!head) return;

    // first snapshot after mount: remember the head, banner nothing (the
    // backlog already happened before the owner was looking).
    if (!seeded.current) {
      seeded.current = true;
      lastSeen.current = head.id;
      return;
    }

    if (head.id === lastSeen.current) return;

    // collect everything ahead of the last-seen id (feed is newest-first), then
    // re-order oldest-first so they queue in the order they happened.
    const fresh: OSEvent[] = [];
    for (const e of feed) {
      if (e.id === lastSeen.current) break;
      fresh.push(e);
    }
    fresh.reverse();
    lastSeen.current = head.id;

    // drop events you caused (the owner pressing send/approve shows as agent
    // "you"); keep only the ones the workforce produced.
    const theirs = fresh.filter((e) => e.agent !== "you");
    if (theirs.length > 0) queue.current.push(...theirs);
  }, [feed]);

  // ── the pump: show one queued banner at a time, honouring the 8s throttle ──
  useEffect(() => {
    // nothing to show, or one already on screen → idle.
    if (current || queue.current.length === 0) return;
    // while suppressed, leave the queue intact and wait; this effect re-runs
    // when `suppressed` flips back to false.
    if (suppressed) return;

    const since = Date.now() - lastShownAt.current;
    const wait = Math.max(0, THROTTLE_MS - since);

    pumpTimer.current = window.setTimeout(
      () => {
        // re-check guards at fire time (state may have changed during the wait)
        if (suppressed) return;
        const next = queue.current.shift();
        if (!next) return;
        lastShownAt.current = Date.now();
        setLeaving(false);
        setCurrent(next);
      },
      // lastShownAt starts at 0, so the very first banner shows immediately
      lastShownAt.current === 0 ? 0 : wait,
    );

    return () => window.clearTimeout(pumpTimer.current);
    // current/suppressed drive re-evaluation; queue is a ref read inside.
  }, [current, suppressed]);

  // ── auto-hide the visible banner after 5.2s (slide out, then unmount) ──────
  useEffect(() => {
    if (!current) return;
    hideTimer.current = window.setTimeout(() => {
      setLeaving(true);
      leaveTimer.current = window.setTimeout(() => setCurrent(null), 340);
    }, VISIBLE_MS);
    return () => {
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(leaveTimer.current);
    };
  }, [current]);

  // ── if suppression turns on while a banner is up, dismiss it at once ───────
  useEffect(() => {
    if (suppressed && current) {
      setCurrent(null);
      setLeaving(false);
    }
  }, [suppressed, current]);

  // clean up every timer on unmount
  useEffect(() => {
    return () => {
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(leaveTimer.current);
      window.clearTimeout(pumpTimer.current);
    };
  }, []);

  if (!current || suppressed) return null;

  const dismiss = () => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(leaveTimer.current);
    setCurrent(null);
    setLeaving(false);
  };

  const onClick = () => {
    const win = routeFor(current.kind);
    if (win) os.open(win);
    else os.openAgent(current.agent);
    dismiss();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`os-banner${leaving ? " is-leaving" : ""}`}
      style={{ color: "var(--ink)" }}
    >
      <Persona agent={current.agent} size={24} working status="working" />
      <span className="os-banner-body">
        <span className="os-banner-top">
          <span className="os-banner-name">{cap(current.agent)}</span>
          <span
            className="os-banner-kind"
            style={{ color: `var(${AGENT_HUE_VAR[current.agent]})` }}
          >
            {current.kind}
          </span>
        </span>
        <span className="os-banner-text">{current.text}</span>
      </span>
    </button>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
