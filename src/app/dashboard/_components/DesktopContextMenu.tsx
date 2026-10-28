"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOS } from "./os-store";

// v3 §7 desktop context menu. Right-clicking the wallpaper opens a 244px menu at
// the cursor (clamped inside the viewport), styled like the menu-bar panels. A
// full-screen catcher behind it closes on any click / right-click; Esc closes it
// first via the store's Esc chain.

type Row =
  | { sep: true }
  | {
      sep?: false;
      label: string;
      kb?: string;
      mark?: boolean; // show a ✓ when `checked`
      checked?: boolean;
      onClick: () => void;
    };

export function DesktopContextMenu() {
  const os = useOS();
  const pos = os.ctxMenu;
  const ref = useRef<HTMLDivElement>(null);
  // start at the raw cursor point, then clamp once measured
  const [xy, setXy] = useState<{ x: number; y: number }>(pos ?? { x: 0, y: 0 });

  // clamp inside the viewport after the menu has a measured size
  useLayoutEffect(() => {
    if (!pos) return;
    const el = ref.current;
    const w = el?.offsetWidth ?? 244;
    const h = el?.offsetHeight ?? 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    setXy({
      x: Math.min(pos.x, vw - w - pad),
      y: Math.min(pos.y, vh - h - pad),
    });
  }, [pos]);

  // close on scroll/resize (the cursor anchor would drift otherwise)
  useEffect(() => {
    if (!pos) return;
    const close = () => os.closeCtxMenu();
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos, os]);

  if (!pos) return null;

  const run = (fn: () => void) => () => {
    os.closeCtxMenu();
    fn();
  };

  const rows: Row[] = [
    { label: "ask percy…", kb: "⌘K", onClick: os.openPal },
    {
      label: "new task for percy",
      kb: "⌘J",
      onClick: () => os.openDrawer("percy"),
    },
    { sep: true },
    {
      label: os.view.widgets ? "hide widgets" : "show widgets",
      onClick: () => os.toggleView("widgets"),
    },
    {
      label: "heat map",
      mark: true,
      checked: os.view.heatMap,
      onClick: () => os.toggleView("heatMap"),
    },
    {
      label: "data links",
      mark: true,
      checked: os.view.dataLinks,
      onClick: () => os.toggleView("dataLinks"),
    },
    { sep: true },
    { label: "system monitor", onClick: os.openMonitor },
    { label: "lock screen", kb: "⌥L", onClick: os.lock },
    { label: "about persept os", onClick: os.openAbout },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="close menu"
        onClick={os.closeCtxMenu}
        onContextMenu={(e) => {
          e.preventDefault();
          os.closeCtxMenu();
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 44,
          background: "transparent",
          border: "none",
          cursor: "default",
        }}
      />
      <div
        ref={ref}
        className="os-menu-panel"
        style={{
          left: xy.x,
          top: xy.y,
          width: 244,
          minWidth: 244,
          display: "flex",
          flexDirection: "column",
          zIndex: 45,
        }}
      >
        {rows.map((r, i) =>
          r.sep ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: separators are positional + static
            <div key={`sep-${i}`} className="os-menu-sep" />
          ) : (
            <button
              key={r.label}
              type="button"
              className="os-menu-row"
              onClick={run(r.onClick)}
            >
              <span className="os-menu-mark">
                {r.mark && r.checked ? "✓" : ""}
              </span>
              <span className="os-menu-label">{r.label}</span>
              {r.kb ? <span className="os-menu-key">{r.kb}</span> : null}
            </button>
          ),
        )}
      </div>
    </>
  );
}
