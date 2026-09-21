"use client";
import { useEffect, useState } from "react";

// Ticking local-time readout for the Jarvis top bar. Renders nothing until mounted
// so server and client agree on first paint (avoids a hydration mismatch), then
// updates once a second in Asia/Dubai.
const FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function HudClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(FMT.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hud-clock" suppressHydrationWarning>
      {now ?? "--:--:--"}
    </span>
  );
}
