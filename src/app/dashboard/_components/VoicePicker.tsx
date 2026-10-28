"use client";

import { useEffect, useState } from "react";

// Percy's call voice. Lists the bridge's voices (GET /call/voices) and persists
// the choice in localStorage as `os-call-voice`, which the call panel sends as
// `voice` on every /tts. A change also fires `os-voice-change` so a live call
// picks it up without a reload. Hidden entirely when the bridge lists no voices.

type Voice = { id: string; name: string };

// the bridge may return strings or objects — normalise to { id, name }.
function normalize(raw: unknown): Voice[] {
  if (!Array.isArray(raw)) return [];
  const out: Voice[] = [];
  for (const v of raw) {
    if (typeof v === "string") out.push({ id: v, name: v });
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const id = String(o.id ?? o.voice_id ?? o.name ?? "");
      if (!id) continue;
      out.push({ id, name: String(o.name ?? o.label ?? id) });
    }
  }
  return out;
}

export function VoicePicker() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voice, setVoice] = useState("");

  useEffect(() => {
    try {
      setVoice(window.localStorage.getItem("os-call-voice") ?? "");
    } catch {
      /* no localStorage */
    }
    let alive = true;
    fetch("/api/workforce/call/voices")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setVoices(normalize(d.voices));
      })
      .catch(() => {
        /* channel not wired — stay hidden */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (voices.length === 0) return null;

  const pick = (v: string) => {
    setVoice(v);
    try {
      if (v) window.localStorage.setItem("os-call-voice", v);
      else window.localStorage.removeItem("os-call-voice");
    } catch {
      /* no localStorage */
    }
    window.dispatchEvent(new CustomEvent("os-voice-change", { detail: v }));
  };

  return (
    <label
      title="Percy's call voice"
      style={{ display: "flex", alignItems: "center" }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Percy's call voice
      </span>
      <select
        value={voice}
        onChange={(e) => pick(e.target.value)}
        style={{
          appearance: "none",
          border: "1px solid var(--line)",
          background: "var(--surf2)",
          color: "var(--soft)",
          borderRadius: 8,
          padding: "4px 8px",
          fontSize: 11,
          fontFamily: "var(--font-ui)",
          cursor: "pointer",
          maxWidth: 108,
        }}
      >
        <option value="">default voice</option>
        {voices.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </label>
  );
}
