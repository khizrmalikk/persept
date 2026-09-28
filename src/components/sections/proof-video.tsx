"use client";

import { useRef, useState } from "react";

// The showreel on the proof board. The video autoplays MUTED (browser policy),
// and the mix (persept-mix.wav) is a separate, perfectly-synced track: a hidden
// <audio> the viewer turns on with the sound button. We resync the audio to the
// video only when it drifts (>0.25s) — which is really just the loop boundary —
// so it stays aligned without stutter. One shared position style with the old img.

const FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "17.14%",
  top: "6.4%",
  width: "65.71%",
  height: "66.9%",
  objectFit: "contain",
  objectPosition: "center",
  background: "#0e0d0c",
  borderRadius: 6,
  display: "block",
};

export function ProofVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sound, setSound] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;
    if (sound) {
      a.pause();
      setSound(false);
    } else {
      a.currentTime = v.currentTime;
      a.play()
        .then(() => setSound(true))
        .catch(() => setSound(false));
    }
  };

  // keep the mix locked to the video (mainly across the loop restart)
  const onTimeUpdate = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a || a.paused) return;
    if (Math.abs(a.currentTime - v.currentTime) > 0.25)
      a.currentTime = v.currentTime;
  };

  return (
    <>
      {/* biome-ignore lint/a11y/useMediaCaption: showreel with a music mix, no spoken dialogue */}
      <video
        ref={videoRef}
        src="/persept-showreel.mp4"
        poster="/images/dashboard-office.png"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        aria-label="The Persept office dashboard showreel, running on the board"
        style={FRAME_STYLE}
      />
      {/* biome-ignore lint/a11y/useMediaCaption: instrumental mix, no dialogue */}
      <audio ref={audioRef} src="/persept-mix.wav" loop preload="auto" />
      <button
        type="button"
        className="pl-proof-sound"
        onClick={toggle}
        aria-pressed={sound}
        aria-label={
          sound ? "mute the showreel" : "play the showreel with sound"
        }
      >
        {sound ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M11 5 6 9H2v6h4l5 4V5Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M11 5 6 9H2v6h4l5 4V5Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M22 9l-6 6M16 9l6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
        <span>{sound ? "sound on" : "sound"}</span>
      </button>
    </>
  );
}
