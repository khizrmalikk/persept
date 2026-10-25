"use client";

import { useEffect } from "react";
import { setPercyMode } from "./percy-bus";

// The single writer of window.PercyBus.mode. Mounted once in the OS shell.
// Commit 2: `thinking` while Percy's own run is in progress
// (agents.percy.status === "working"), else `idle`. Later commits extend this
// with `working` (live view on screen), `listening` (call) and `speaking` (TTS).
export function PercyBusDriver({ percyWorking }: { percyWorking: boolean }) {
  useEffect(() => {
    setPercyMode(percyWorking ? "thinking" : "idle");
  }, [percyWorking]);
  return null;
}
