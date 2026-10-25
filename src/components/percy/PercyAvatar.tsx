"use client";

import { type CSSProperties, type HTMLAttributes, useEffect } from "react";

// React wrapper for the vanilla <percy-avatar> custom element (percy-3d.js).
// The element is registered client-only (dynamic import on first mount) so it
// never runs during SSR. It fills its parent; callers (e.g. Persona) own the
// size, ring and clipping. mode="auto" follows window.PercyBus.mode.

// Teach TSX about the custom element so <percy-avatar mode=…> type-checks.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "percy-avatar": HTMLAttributes<HTMLElement> & { mode?: string };
    }
  }
}

let elementRequested = false;

function ensurePercyElement() {
  if (elementRequested) return;
  elementRequested = true;
  import("./percy-3d.js").catch((e) => {
    console.warn("[percy] failed to load avatar element", e);
  });
}

export function PercyAvatar({
  mode = "auto",
  style,
}: {
  mode?: string;
  style?: CSSProperties;
}) {
  useEffect(() => {
    ensurePercyElement();
  }, []);

  return (
    <percy-avatar
      mode={mode}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
