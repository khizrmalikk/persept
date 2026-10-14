"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// The OS's single live-update mechanism. Polls GET /api/os/tick every 5s (15s
// when the tab is hidden) and calls router.refresh() ONLY when a value changed —
// so the server components re-pull fresh data without a blanket timer and without
// exposing any table to the client. The war room keeps its own optimistic state
// and reconciles on the same refresh.
export function TickPoller() {
  const router = useRouter();
  const last = useRef<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await fetch("/api/os/tick", { cache: "no-store" });
        if (!res.ok) return;
        const sig = JSON.stringify(await res.json());
        if (last.current !== null && sig !== last.current) router.refresh();
        last.current = sig;
      } catch {
        // offline / transient — try again next tick
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      const delay = document.hidden ? 15_000 : 5_000;
      timer = window.setTimeout(async () => {
        if (stop) return;
        await poll();
        schedule();
      }, delay);
    };

    void poll(); // prime the baseline immediately
    schedule();
    const onVis = () => schedule();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router]);

  return null;
}
