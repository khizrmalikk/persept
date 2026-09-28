"use client";

import { useEffect, useState } from "react";
import { PerseptMark } from "@/components/ui/logo";

// Mobile top bar (< 768px): skewed amber logo mark + "Persept" on the left, a
// green live dot + "LIVE · HH:MM GST" on the right. Client for the ticking clock.

function gst(now: Date): string {
  const g = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  return g.toTimeString().slice(0, 5);
}

export function MobileTopBar() {
  const [clock, setClock] = useState("--:--");
  useEffect(() => {
    setClock(gst(new Date()));
    const iv = setInterval(() => setClock(gst(new Date())), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <header className="wf-mtop">
      <div className="wf-mtop-brand">
        <PerseptMark size={18} />
        <span className="wf-mtop-word">Persept</span>
      </div>
      <div className="wf-mtop-live">
        <span className="wf-mtop-dot" aria-hidden="true" />
        <span>LIVE · {clock} GST</span>
      </div>
    </header>
  );
}
