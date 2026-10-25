// window.PercyBus — the single channel the <percy-avatar> renderer reads.
//  - mode: drives the pose (idle | listening | thinking | speaking | working)
//  - look: a viewport-space point the eyes track (set while Percy's cursor moves)
//  - call: perks the "ears" while a call is live
// Keep exactly one writer of `mode` (see PercyBusDriver) so avatars stay in sync.

export type PercyMode =
  | "auto"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "working";

export type PercyBus = {
  mode: Exclude<PercyMode, "auto">;
  look: { x: number; y: number } | null;
  call: boolean;
};

declare global {
  interface Window {
    PercyBus?: PercyBus;
  }
}

function bus(): PercyBus | null {
  if (typeof window === "undefined") return null;
  window.PercyBus ??= { mode: "idle", look: null, call: false };
  return window.PercyBus;
}

export function setPercyMode(mode: Exclude<PercyMode, "auto">) {
  const b = bus();
  if (b) b.mode = mode;
}

export function setPercyLook(look: { x: number; y: number } | null) {
  const b = bus();
  if (b) b.look = look;
}

export function setPercyCall(call: boolean) {
  const b = bus();
  if (b) b.call = call;
}
