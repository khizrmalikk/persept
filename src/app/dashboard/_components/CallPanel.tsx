"use client";

import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  endCall,
  latestEventId,
  liveCallAvailable,
  sendVoiceUtterance,
} from "@/lib/workforce/actions";
import { stripCallNote } from "@/lib/workforce/types";

// ── Web Speech API types ───────────────────────────────────────────────────
// The DOM lib ships no types for SpeechRecognition, so we declare the minimal
// surface we actually use. Kept intentionally small and tsc-clean.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ── Component ──────────────────────────────────────────────────────────────
type Props = {
  agentId: string;
  agentName: string;
  emoji: string | null;
  // Optional: notified whenever the call's active-ness or speaking-ness changes,
  // so a parent (e.g. the office page) can drive the constellation's node
  // animation. `active` = a call is running; `speaking` = the agent's audio is
  // currently playing. Existing callers omit this and are unaffected.
  onCallState?: (s: { active: boolean; speaking: boolean }) => void;
  // Optional: when true, the call begins automatically on mount (used when the
  // call is initiated from elsewhere — e.g. clicking a sphere in the office —
  // where there is no idle button for the user to press). Fires the EXISTING
  // startCall() exactly once; the voice pipeline is otherwise unchanged.
  autoStart?: boolean;
};

type CallStatus = "listening" | "sending" | "thinking" | "speaking";

// `streaming` is true while a live-mode reply is still arriving (grey, in place);
// it flips false on `final`. Supabase-mode turns never stream (arrive whole).
type Turn = { id: number; mine: boolean; text: string; streaming?: boolean };

type Worker = { id: string; label: string; model: string; startedAt: string };

// null until the first tts response resolves; then either the elevenlabs path
// or a browser fallback with the reason we fell back.
type VoiceKind = null | "elevenlabs" | string; // string = `browser (<reason>)`

// which speech-to-text path is capturing: elevenlabs Scribe, or the browser
// Web Speech recogniser fallback. null until resolved at call start.
type HearingKind = null | "scribe" | "browser";

// per-turn diagnostics, measured from the commit time (t0 = when the utterance
// was sent). all values in seconds; undefined until the relevant event fires.
type TurnDiag = {
  id: number;
  heard?: number; // first partial → commit (capture duration)
  firstWord?: number; // t0 → first delta/reply token
  firstAudio?: number; // t0 → first tts audio
};

const PTT_KEY = "wf.call.ptt";

function readPtt(): boolean {
  try {
    return localStorage.getItem(PTT_KEY) === "1";
  } catch {
    return false;
  }
}
function writePtt(on: boolean): void {
  try {
    localStorage.setItem(PTT_KEY, on ? "1" : "0");
  } catch {
    /* private mode / disabled storage — ignore */
  }
}

export function CallPanel({
  agentId,
  agentName,
  emoji,
  onCallState,
  autoStart,
}: Props) {
  // `emoji` is retained in Props (the agent's mark) — the avatar is now rendered
  // by the chat header, so the call control itself does not paint it. Referenced
  // here so the required prop stays part of the component contract.
  void emoji;
  // Whether the browser supports speech recognition. Resolved in an effect so
  // the server render (where `window` is absent) is stable.
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [ended, setEnded] = useState(false); // shows the "last call" kicker once ended
  const [status, setStatus] = useState<CallStatus>("listening");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState<string | null>(null);
  // diagnostic: which voice is playing + why. resolved on the FIRST tts of the
  // call. Tracked but no longer surfaced in the UI (dev diagnostics removed).
  const [, setVoice] = useState<VoiceKind>(null);
  // legible-wait bits
  const [thinkingSecs, setThinkingSecs] = useState(0);
  const [checkingBg, setCheckingBg] = useState(false);
  // push-to-talk: hands-free (false) vs hold-to-talk (true), persisted
  const [ptt, setPtt] = useState(false);
  const [holding, setHolding] = useState(false);
  // diagnostic: which STT path is capturing (scribe vs browser fallback).
  const [, setHearing] = useState<HearingKind>(null);
  // diagnostic: reply transport — live SSE stream, or the Supabase fallback path.
  const [, setTransport] = useState<"live" | "fallback" | null>(null);
  // a single, user-visible transport line ("transport: live" / "transport:
  // fallback (live channel unreachable)"). The verbose per-turn diagnostics are
  // gone; this one line stays so live-vs-fallback is legible on production.
  const [transportNote, setTransportNote] = useState<string | null>(null);
  // barge-in: when on, a 3+ word commit mid-playback interrupts + sends. default on.
  const [bargeIn, setBargeIn] = useState(true);
  // per-turn timing diagnostics — tracked but no longer rendered (dev-only).
  const [, setDiagTurns] = useState<TurnDiag[]>([]);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // ── Mutable call-scoped machinery (refs so effects/handlers see live values) ─
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // recognition health: detect a rapid restart loop (the mic "flicker") and stop
  // it instead of tight-looping, surfacing the real error.
  const recStartRef = useRef(0);
  const recFailRef = useRef(0);
  const recFatalRef = useRef(false);

  const activeRef = useRef(false); // call is running
  const speakingRef = useRef(false); // audio/speech is playing → recognition + poll paused
  const afterEventIdRef = useRef(0); // reply cursor, call-level state

  // ── Streaming TTS machinery ─────────────────────────────────────────────────
  const ttsAbortRef = useRef<AbortController | null>(null); // aborts the tts fetch
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const ttsObjectUrlRef = useRef<string | null>(null); // MediaSource object URL to revoke
  const voiceResolvedRef = useRef(false); // resolve the diagnostic only once per call

  // ── Send-tick (Web Audio) ────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Push-to-talk ─────────────────────────────────────────────────────────────
  const pttRef = useRef(false); // live copy for handlers
  const holdingRef = useRef(false); // space/button currently held

  // ── Scribe (ElevenLabs realtime STT) machinery ───────────────────────────────
  // Whether Scribe is the active capture path (vs the browser recogniser). Set at
  // call start after a successful connect; false → the browser recogniser runs.
  const scribeActiveRef = useRef(false);
  const scribeConnectFailRef = useRef(0); // connect failures this call (2 → fallback)
  const bargeInRef = useRef(true); // live copy of the barge-in toggle
  // The rendered live "mine" turn id while I speak (partials stream into it, grey).
  // Distinct from the reply stream turn (streamTurnIdRef). null when idle.
  const mineTurnIdRef = useRef<number | null>(null);
  // 400ms commit-join buffer: accumulate near-adjacent committed segments into one
  // utterance before sending.
  const commitBufRef = useRef("");
  const commitJoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // capture timing: performance.now() of the FIRST partial of the current utterance
  // (0 = none yet) → used to measure "heard" (first partial → commit) per turn.
  const firstPartialAtRef = useRef(0);
  // the Scribe path renders my turn itself (settleMineTurn promotes the live grey
  // row); when true, pumpQueue must NOT add a second "mine" turn. queued per send.
  const mineRenderedQueueRef = useRef<boolean[]>([]);

  // end-of-utterance debounce + buffers
  const finalBufRef = useRef(""); // accumulated FINAL text not yet sent
  const interimRef = useRef(""); // current INTERIM text (mid-sentence)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // one-in-flight utterance + queue
  const inFlightRef = useRef(false);
  const utteranceQueueRef = useRef<string[]>([]);

  // replies that arrived while I was mid-sentence, spoken after my utterance sends
  const pendingSpeechRef = useRef<string[]>([]);

  // long-poll control (Supabase mode only)
  const pollAbortRef = useRef<AbortController | null>(null);
  const pollActiveRef = useRef(false);

  // ── LIVE mode (stream-and-speak) machinery ──────────────────────────────────
  // resolved once per call from `liveCallAvailable()`. true → EventSource stream +
  // /call/send; false → the Supabase reply long-poll + sendVoiceUtterance.
  const liveRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  const esFailRef = useRef(0); // consecutive EventSource failures (3 → fallback)
  const esReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // proactive keepalive: reconnect the SSE every 55s so a serverless function
  // time limit (e.g. 60s on a plan that caps below maxDuration=300) never cuts a
  // call mid-reply. A clean close+reopen, NOT counted as a failure.
  const esKeepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // the reply turn we are currently appending deltas into (live mode). null between
  // turns; set on the first delta, updated in place, cleared on final/error.
  const streamTurnIdRef = useRef<number | null>(null);
  const streamTextRef = useRef(""); // full accumulated reply text for the current turn
  const streamRunIdRef = useRef<string | null>(null); // runId of the current turn (dedupe)

  // sentence pipeline: the per-turn delta buffer (text not yet cut into a sentence)
  const deltaBufRef = useRef("");
  // gapless speech queue: sentences waiting to be spoken, plus the prefetch-ahead
  // slot for sentence n+1 (fetched while n plays) and playback flags.
  const speechQueueRef = useRef<string[]>([]);
  const speechBusyRef = useRef(false); // a sentence is currently being spoken
  // prefetched audio for the NEXT queued sentence: the in-flight fetch promise so
  // we don't re-fetch AND so reuse awaits it if it hasn't resolved yet (no gap).
  const prefetchRef = useRef<{
    text: string;
    promise: Promise<Response | null>;
  } | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  // dev timing marks (per turn) — logged to compare first-delta → first-audio.
  const tSendRef = useRef(0);
  const tFirstDeltaLoggedRef = useRef(false);
  const tFirstAudioLoggedRef = useRef(false);

  // per-turn diagnostics: the id of the current diag turn (the one being sent), t0
  // = commit/send time, and the "heard" duration measured at commit. Populated on
  // send; first-word/first-audio are folded in when they arrive.
  const diagTurnIdRef = useRef<number | null>(null);
  const diagT0Ref = useRef(0); // performance.now() at commit/send (t0)
  const diagFirstWordDoneRef = useRef(false);
  const diagFirstAudioDoneRef = useRef(false);
  // capture duration (first-partial → commit) staged for the next send; consumed in
  // pumpQueue. undefined when there is no partial timing (browser-final / ptt).
  const pendingHeardRef = useRef<number | undefined>(undefined);

  // timers
  const noReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workersTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const turnSeqRef = useRef(-1); // local ids for MY turns (agent turns use event id)

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
    const savedPtt = readPtt();
    pttRef.current = savedPtt;
    setPtt(savedPtt);
  }, []);

  // ── Call-state callback: notify the parent when active / speaking changes ────
  // `speaking` mirrors the "speaking" status (the agent's audio is playing).
  // Kept in a stable ref so identity changes to the callback don't re-fire it.
  const onCallStateRef = useRef(onCallState);
  useEffect(() => {
    onCallStateRef.current = onCallState;
  }, [onCallState]);
  useEffect(() => {
    onCallStateRef.current?.({ active, speaking: status === "speaking" });
  }, [active, status]);
  // On unmount, tell the parent the call is over so it can clear its animation.
  useEffect(() => {
    return () => onCallStateRef.current?.({ active: false, speaking: false });
  }, []);

  // ── Thinking counter: tick ~once a second while status === "thinking" ────────
  useEffect(() => {
    if (status !== "thinking") {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      setThinkingSecs(0);
      return;
    }
    setThinkingSecs(0);
    const t = setInterval(() => setThinkingSecs((s) => s + 1), 1000);
    thinkingTimerRef.current = t;
    return () => {
      clearInterval(t);
      if (thinkingTimerRef.current === t) thinkingTimerRef.current = null;
    };
  }, [status]);

  // auto-scroll transcript to newest
  // biome-ignore lint/correctness/useExhaustiveDependencies: `turns` is the change signal — a new line means scroll to bottom
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const addTurn = useCallback((t: Turn) => {
    setTurns((prev) => [...prev, t]);
  }, []);

  // ── Per-turn diagnostics ─────────────────────────────────────────────────────
  // Open a new diag turn at commit/send time (t0). `heard` = first-partial → commit
  // (undefined when no partial was seen, e.g. a browser-final send). Keeps last 5.
  const beginDiagTurn = useCallback((heard?: number) => {
    const id = turnSeqRef.current; // reuse the send turn's id space (unique enough)
    diagTurnIdRef.current = id;
    diagT0Ref.current = performance.now();
    diagFirstWordDoneRef.current = false;
    diagFirstAudioDoneRef.current = false;
    setDiagTurns((prev) => {
      const next: TurnDiag = { id, heard };
      return [next, ...prev].slice(0, 5);
    });
  }, []);
  const beginDiagTurnRef = useRef(beginDiagTurn);
  useEffect(() => {
    beginDiagTurnRef.current = beginDiagTurn;
  }, [beginDiagTurn]);
  // Fold a measured field into the current diag turn (once each).
  const markDiag = useCallback((field: "firstWord" | "firstAudio") => {
    const id = diagTurnIdRef.current;
    if (id === null) return;
    if (field === "firstWord") {
      if (diagFirstWordDoneRef.current) return;
      diagFirstWordDoneRef.current = true;
    } else {
      if (diagFirstAudioDoneRef.current) return;
      diagFirstAudioDoneRef.current = true;
    }
    const secs = (performance.now() - diagT0Ref.current) / 1000;
    setDiagTurns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: secs } : d)),
    );
  }, []);
  // Stable ref to markDiag so deep handlers (handleStreamEvent, playResponse's
  // first-audio callback) can record without joining their dependency arrays.
  const markDiagRef = useRef(markDiag);
  useEffect(() => {
    markDiagRef.current = markDiag;
  }, [markDiag]);

  // ── Reply long-poll: exactly ONE request open whenever active & not speaking ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: `speak` is defined below (circular dep); adding it as a dep would be a TDZ reference at render
  const runPoll = useCallback(async () => {
    // guard: never run two loops at once; never while speaking / inactive
    if (pollActiveRef.current) return;
    if (!activeRef.current || speakingRef.current) return;
    pollActiveRef.current = true;

    while (activeRef.current && !speakingRef.current) {
      const ac = new AbortController();
      pollAbortRef.current = ac;
      try {
        const res = await fetch(
          `/api/workforce/reply?agent=${encodeURIComponent(agentId)}&after=${afterEventIdRef.current}`,
          { signal: ac.signal },
        );
        if (res.status === 204) {
          continue; // re-issue immediately
        }
        if (!res.ok) {
          // transient (e.g. 401) — brief pause, then retry while still active
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        const data = (await res.json()) as { id: number; text: string };
        if (data && typeof data.id === "number") {
          if (data.id > afterEventIdRef.current)
            afterEventIdRef.current = data.id;
          if (noReplyTimerRef.current) {
            clearTimeout(noReplyTimerRef.current);
            noReplyTimerRef.current = null;
          }
          // "checking in background" hint: a reply that is just an ack ("let me
          // check…", "one moment") stays in listening and shows a hint; clear the
          // hint on the NEXT reply that arrives.
          const low = data.text.trim().toLowerCase();
          const isAck =
            low.startsWith("let me check") || low.includes("one moment");
          addTurn({ id: data.id, mine: false, text: data.text });
          if (isAck) {
            setCheckingBg(true);
            // do NOT change status / speak; keep listening + polling
            continue;
          }
          setCheckingBg(false);
          // If I'm mid-sentence, defer speaking until my utterance is sent;
          // otherwise speak it right away (this is how unsolicited replies talk).
          if (interimRef.current.trim().length > 0) {
            pendingSpeechRef.current.push(data.text);
          } else {
            pollActiveRef.current = false;
            void speak(data.text);
            return;
          }
        }
      } catch {
        // aborted (paused for speaking / ended) or network blip → exit the loop;
        // the resume path re-invokes runPoll.
        break;
      }
    }
    pollActiveRef.current = false;
  }, [agentId, addTurn]);

  // ── Speaking: stop recognition, play TTS (or speechSynthesis on 204) ─────────
  // Tear down any in-flight streamed TTS: abort the fetch, close the MediaSource,
  // drop the SourceBuffer, revoke the object URL. Guarded end-to-end so a partial
  // stream never leaves a dangling reader/loop or an "open" MediaSource.
  const cleanupTts = useCallback(() => {
    if (ttsAbortRef.current) {
      try {
        ttsAbortRef.current.abort();
      } catch {
        /* already aborted */
      }
      ttsAbortRef.current = null;
    }
    const ms = mediaSourceRef.current;
    if (ms) {
      try {
        if (ms.readyState === "open") ms.endOfStream();
      } catch {
        /* endOfStream can throw if the buffer is mid-update — ignore */
      }
      mediaSourceRef.current = null;
    }
    sourceBufferRef.current = null;
    if (ttsObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(ttsObjectUrlRef.current);
      } catch {
        /* ignore */
      }
      ttsObjectUrlRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      try {
        audioRef.current.load();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    }
    cleanupTts();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [cleanupTts]);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Declared before speak/startRecognition reference each other; assigned below.
  const startRecognitionRef = useRef<() => void>(() => {});

  // Resolve the voice diagnostic exactly once per call, from the first tts result.
  const resolveVoice = useCallback((kind: VoiceKind) => {
    if (voiceResolvedRef.current) return;
    voiceResolvedRef.current = true;
    setVoice(kind);
  }, []);

  // Browser speechSynthesis fallback (used on 204, on 5xx/other, and on failures).
  const speakSynth = useCallback((text: string, onDone: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => onDone();
      u.onerror = () => onDone();
      window.speechSynthesis.speak(u);
    } else {
      onDone();
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `speak` is defined below (circular dep); adding it as a dep would be a TDZ reference at render
  const finishSpeaking = useCallback(() => {
    if (!speakingRef.current) return;
    speakingRef.current = false;
    stopAudio();
    if (!activeRef.current) return;
    setStatus("listening");
    // speak any queued reply first; otherwise resume mic (+ poll in Supabase mode).
    const next = pendingSpeechRef.current.shift();
    if (next !== undefined) {
      void speak(next);
      return;
    }
    startRecognitionRef.current();
    // Live mode keeps a persistent EventSource — no reply long-poll to resume.
    if (!liveRef.current) void runPoll();
  }, [runPoll, stopAudio]);

  // ── TTS fetch: one sentence → a streamed audio Response ──────────────────────
  // Extended to carry previousText/nextText so ElevenLabs keeps prosody across
  // sentence boundaries (live mode passes the adjacent queued sentences; Supabase
  // mode leaves them empty). Returns the Response (any status) or null on abort.
  const fetchTts = useCallback(
    async (
      text: string,
      opts: { previousText?: string; nextText?: string; signal: AbortSignal },
    ): Promise<Response | null> => {
      try {
        return await fetch("/api/workforce/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            agentId,
            text,
            previousText: opts.previousText ?? "",
            nextText: opts.nextText ?? "",
          }),
          signal: opts.signal,
        });
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return null;
        return null;
      }
    },
    [agentId],
  );

  // ── Playback core: play one already-fetched tts Response, then call onDone ────
  // Shared by Supabase `speak` (whole reply, onDone = finishSpeaking) and the live
  // speech queue (per sentence, onDone = advance the queue). Manages ONLY the audio
  // element + MediaSource; the caller owns speaking/status/recognition. Resolves the
  // voice diagnostic on the first tts of the call (once). `logFirstAudio` marks the
  // dev timing on the first appended chunk of a turn.
  const playResponse = useCallback(
    (
      res: Response | null,
      text: string,
      onDone: () => void,
      logFirstAudio?: () => void,
    ) => {
      if (!res) {
        onDone();
        return;
      }
      const reason = res.headers.get("x-voice-reason");
      if (res.status === 204) {
        resolveVoice(`browser (${reason ?? "no key"})`);
        logFirstAudio?.();
        speakSynth(text, onDone);
        return;
      }
      if (!res.ok) {
        resolveVoice(`browser (${reason ?? `http ${res.status}`})`);
        logFirstAudio?.();
        speakSynth(text, onDone);
        return;
      }

      // 200 → elevenlabs stream.
      resolveVoice("elevenlabs");
      if (!activeRef.current) {
        onDone();
        return;
      }

      const body = res.body;
      const canStream =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported("audio/mpeg") &&
        body !== null;

      if (canStream) {
        // ── MediaSource streaming: start playback on the first appended chunk ──
        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        const url = URL.createObjectURL(mediaSource);
        ttsObjectUrlRef.current = url;
        const audio = new Audio();
        audio.src = url;
        audioRef.current = audio;

        audio.onended = () => onDone();
        audio.onerror = () => onDone();

        // chunk append queue: append one at a time, wait `updateend` between.
        const queue: BufferSource[] = [];
        let streamDone = false;
        let started = false;

        const finalizeStream = () => {
          const ms = mediaSourceRef.current;
          const sb = sourceBufferRef.current;
          if (!ms || !sb) return;
          if (queue.length === 0 && !sb.updating && streamDone) {
            try {
              if (ms.readyState === "open") ms.endOfStream();
            } catch {
              /* ignore */
            }
          }
        };

        const pump = () => {
          const sb = sourceBufferRef.current;
          if (!sb || sb.updating) return;
          const chunk = queue.shift();
          if (chunk === undefined) {
            finalizeStream();
            return;
          }
          try {
            sb.appendBuffer(chunk);
            if (!started) {
              started = true;
              logFirstAudio?.();
              void audio.play().catch(() => onDone());
            }
          } catch {
            onDone();
          }
        };

        mediaSource.addEventListener(
          "sourceopen",
          () => {
            if (mediaSourceRef.current !== mediaSource) return;
            let sb: SourceBuffer;
            try {
              sb = mediaSource.addSourceBuffer("audio/mpeg");
            } catch {
              onDone();
              return;
            }
            sourceBufferRef.current = sb;
            sb.addEventListener("updateend", () => {
              if (queue.length > 0) pump();
              else finalizeStream();
            });

            const reader = body.getReader();
            const readLoop = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (!activeRef.current) break;
                  if (value && value.byteLength > 0) {
                    queue.push(value);
                    pump();
                  }
                }
              } catch {
                /* aborted / network blip — fall through to finalize */
              } finally {
                streamDone = true;
                finalizeStream();
              }
            };
            void readLoop();
          },
          { once: true },
        );
        return;
      }

      // ── Fallback: no MediaSource / audio/mpeg unsupported → blob then play ──
      void (async () => {
        try {
          const blob = await res.blob();
          if (!activeRef.current) {
            onDone();
            return;
          }
          const url = URL.createObjectURL(blob);
          ttsObjectUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => onDone();
          audio.onerror = () => onDone();
          logFirstAudio?.();
          await audio.play().catch(() => onDone());
        } catch (err) {
          if ((err as { name?: string })?.name === "AbortError") return;
          resolveVoice("browser (playback failed)");
          onDone();
        }
      })();
    },
    [resolveVoice, speakSynth],
  );

  // ── Supabase-mode speak: fetch a whole reply and play it, then finishSpeaking ─
  const speak = useCallback(
    async (text: string) => {
      if (!activeRef.current) return;
      // PAUSE recognition + poll while we talk
      speakingRef.current = true;
      setStatus("speaking");
      stopRecognition();
      if (pollAbortRef.current) pollAbortRef.current.abort();
      pollActiveRef.current = false;

      const ac = new AbortController();
      ttsAbortRef.current = ac;
      const res = await fetchTts(text, { signal: ac.signal });
      if (ac.signal.aborted) return; // interrupted/ended mid-fetch
      // Supabase mode has no streaming deltas — the reply arrived whole, so mark
      // "first word" here; "first audio" is marked on the first tts chunk.
      markDiagRef.current("firstWord");
      playResponse(res, text, finishSpeaking, () =>
        markDiagRef.current("firstAudio"),
      );
    },
    [stopRecognition, finishSpeaking, fetchTts, playResponse],
  );

  // ── LIVE mode: sentence cutter ───────────────────────────────────────────────
  // Given the running delta buffer, cut every COMPLETE sentence off the front and
  // return them, leaving the incomplete remainder in `rest`. A sentence ends at
  // `.` `?` `!` `…` followed by a space or end-of-buffer, OR at a newline. Guards:
  //  - don't cut inside a number: a digit on BOTH sides of a `.`/`,` (6,000 / 2.5)
  //  - don't cut right after a single-letter abbreviation: a lone capital + `.`
  //    (e.g. "J. Smith" — the `.` after "J" is not a sentence end)
  const cutSentences = useCallback(
    (buf: string): { sentences: string[]; rest: string } => {
      const sentences: string[] = [];
      let start = 0;
      for (let i = 0; i < buf.length; i++) {
        const ch = buf[i];
        // newline always ends a sentence
        if (ch === "\n") {
          const s = buf.slice(start, i).trim();
          if (s) sentences.push(s);
          start = i + 1;
          continue;
        }
        if (ch === "." || ch === "?" || ch === "!" || ch === "…") {
          const next = buf[i + 1];
          const atEnd = i === buf.length - 1;
          const boundary = atEnd || next === " " || next === "\n";
          if (!boundary) continue;
          // number guard: digit on both sides of a `.` (`,` can't be terminal but
          // guard defensively) → not a sentence end.
          if (ch === ".") {
            const prev = buf[i - 1];
            if (
              prev >= "0" &&
              prev <= "9" &&
              next !== undefined &&
              next >= "0" &&
              next <= "9"
            ) {
              continue;
            }
            // abbreviation guard: a lone capital letter directly before the `.`
            // (start-of-buffer or preceded by a space) → "J. Smith", skip.
            const prev2 = buf[i - 2];
            const loneCapital =
              prev !== undefined &&
              prev >= "A" &&
              prev <= "Z" &&
              (i - 1 === start || prev2 === " ");
            if (loneCapital) continue;
          }
          const end = atEnd ? i + 1 : i + 1; // include the terminator
          const s = buf.slice(start, end).trim();
          if (s) sentences.push(s);
          start = end;
        }
      }
      return { sentences, rest: buf.slice(start) };
    },
    [],
  );

  // Live speech done for the whole turn / queue drained → back to listening,
  // resume recognition. (The EventSource stays open; no poll to restart.)
  const liveSpeechDrained = useCallback(() => {
    speechBusyRef.current = false;
    speakingRef.current = false;
    stopAudio();
    if (!activeRef.current) return;
    setStatus("listening");
    startRecognitionRef.current();
  }, [stopAudio]);

  // Gapless speech queue: play sentences in order, prefetching sentence n+1 while n
  // plays. Reuses playResponse for MediaSource playback + the voice diagnostic.
  const runSpeechQueue = useCallback(() => {
    if (speechBusyRef.current) return; // already playing a sentence
    const text = speechQueueRef.current.shift();
    if (text === undefined) {
      // nothing left AND the turn is complete → drain
      if (streamTurnIdRef.current === null) liveSpeechDrained();
      return;
    }
    if (!activeRef.current) return;
    speechBusyRef.current = true;
    // first sentence of a speaking burst: pause recognition, mark speaking.
    if (!speakingRef.current) {
      speakingRef.current = true;
      setStatus("speaking");
      stopRecognition();
    }

    // Was this sentence prefetched? If so reuse its (possibly still in-flight)
    // fetch promise so we never re-fetch and never race an unresolved response.
    const nextText = speechQueueRef.current[0]; // the sentence after this one
    let resPromise: Promise<Response | null>;
    const pre = prefetchRef.current;
    if (pre && pre.text === text) {
      resPromise = pre.promise;
      prefetchRef.current = null;
    } else {
      const ac = new AbortController();
      ttsAbortRef.current = ac;
      resPromise = fetchTts(text, {
        previousText: "",
        nextText: nextText ?? "",
        signal: ac.signal,
      });
    }

    // start prefetching sentence n+1 while n downloads/plays (gapless).
    if (nextText !== undefined && !prefetchRef.current) {
      const pac = new AbortController();
      prefetchAbortRef.current = pac;
      const afterNext = speechQueueRef.current[1];
      const pending = fetchTts(nextText, {
        previousText: text,
        nextText: afterNext ?? "",
        signal: pac.signal,
      });
      prefetchRef.current = { text: nextText, promise: pending };
    }

    const logFirstAudio = () => {
      markDiagRef.current("firstAudio"); // first tts audio → per-turn diag
      if (
        process.env.NODE_ENV !== "production" &&
        !tFirstAudioLoggedRef.current
      ) {
        tFirstAudioLoggedRef.current = true;
        console.log("[call] t_first_audio", Math.round(performance.now()));
      }
    };

    void resPromise.then((res) => {
      if (!activeRef.current) {
        speechBusyRef.current = false;
        return;
      }
      playResponse(
        res,
        text,
        () => {
          speechBusyRef.current = false;
          stopAudio(); // release the finished sentence's MediaSource
          if (!activeRef.current) return;
          runSpeechQueue(); // play the next queued sentence (or drain)
        },
        logFirstAudio,
      );
    });
  }, [fetchTts, playResponse, stopAudio, stopRecognition, liveSpeechDrained]);

  // Push a sentence into the live speech queue and kick the player.
  const enqueueSpeech = useCallback(
    (sentence: string) => {
      const s = sentence.trim();
      if (!s) return;
      // Hold the queue while I'm mid-sentence (interim speech present): buffer the
      // sentence so it speaks after my utterance sends (parity with Supabase mode).
      if (interimRef.current.trim().length > 0) {
        pendingSpeechRef.current.push(s);
        return;
      }
      speechQueueRef.current.push(s);
      runSpeechQueue();
    },
    [runSpeechQueue],
  );

  // Feed accumulated delta text through the cutter; enqueue every complete sentence.
  const processDeltaBuffer = useCallback(
    (final: boolean) => {
      if (final) {
        // final: whatever remains (even without a terminator) is the last sentence.
        const rest = deltaBufRef.current.trim();
        deltaBufRef.current = "";
        if (rest) enqueueSpeech(rest);
        return;
      }
      const { sentences, rest } = cutSentences(deltaBufRef.current);
      deltaBufRef.current = rest;
      for (const s of sentences) enqueueSpeech(s);
    },
    [cutSentences, enqueueSpeech],
  );

  // Update (or create) the current streaming reply turn in place as text arrives.
  const upsertStreamTurn = useCallback((text: string, streaming: boolean) => {
    const id = streamTurnIdRef.current;
    if (id === null) return;
    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) {
        return [...prev, { id, mine: false, text, streaming }];
      }
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], text, streaming };
      return copy;
    });
  }, []);

  // ── LIVE mode: handle one parsed SSE event ───────────────────────────────────
  // data shapes: {type:"ready"} | {type:"delta",text,runId} |
  // {type:"final",text,runId} | {type:"error",text}. Unsolicited replies arrive on
  // the SAME stream, so a delta with no pending send is treated the same way.
  const handleStreamEvent = useCallback(
    (raw: string) => {
      let msg: {
        type?: string;
        text?: string;
        runId?: string;
      } | null = null;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;
      // a successful message resets the reconnect strike counter.
      esFailRef.current = 0;

      if (msg.type === "ready") return;

      if (msg.type === "error") {
        const text = (msg.text ?? "").trim() || "something went wrong";
        // surface as a completed turn; end the streaming turn if one was open.
        if (streamTurnIdRef.current !== null) {
          upsertStreamTurn(streamTextRef.current, false);
        }
        streamTurnIdRef.current = null;
        streamRunIdRef.current = null;
        streamTextRef.current = "";
        deltaBufRef.current = "";
        addTurn({ id: turnSeqRef.current--, mine: false, text });
        // if nothing is speaking, return to listening
        if (!speechBusyRef.current && !speakingRef.current) {
          if (activeRef.current) {
            setStatus("listening");
            startRecognitionRef.current();
          }
        }
        return;
      }

      const text = msg.text ?? "";
      if (msg.type === "delta") {
        if (!text) return;
        // new turn? (first delta, or a different runId)
        const runId = msg.runId ?? null;
        if (
          streamTurnIdRef.current === null ||
          (runId !== null && runId !== streamRunIdRef.current)
        ) {
          // finalise any previous turn's leftover buffer before starting fresh
          if (streamTurnIdRef.current !== null && deltaBufRef.current.trim()) {
            processDeltaBuffer(true);
            upsertStreamTurn(streamTextRef.current, false);
          }
          streamTurnIdRef.current = turnSeqRef.current--;
          streamRunIdRef.current = runId;
          streamTextRef.current = "";
          deltaBufRef.current = "";
          tFirstDeltaLoggedRef.current = false;
          tFirstAudioLoggedRef.current = false;
        }
        if (
          process.env.NODE_ENV !== "production" &&
          !tFirstDeltaLoggedRef.current
        ) {
          tFirstDeltaLoggedRef.current = true;
          console.log("[call] t_first_delta", Math.round(performance.now()));
        }
        markDiagRef.current("firstWord"); // first reply token → per-turn diag
        // first delta after a send → move the pill off "thinking".
        streamTextRef.current += text;
        deltaBufRef.current += text;
        upsertStreamTurn(streamTextRef.current, true);
        processDeltaBuffer(false);
        return;
      }

      if (msg.type === "final") {
        // some bridges send the full text on final; if it extends what we have,
        // append the tail so the buffer holds the true remainder.
        if (text && text.length > streamTextRef.current.length) {
          const tail = text.slice(streamTextRef.current.length);
          streamTextRef.current = text;
          deltaBufRef.current += tail;
        }
        if (streamTurnIdRef.current === null) {
          // a final with no prior delta (rare) → make a turn from the text.
          if (streamTextRef.current) {
            streamTurnIdRef.current = turnSeqRef.current--;
            deltaBufRef.current = streamTextRef.current;
          }
        }
        upsertStreamTurn(streamTextRef.current, false);
        processDeltaBuffer(true); // flush the remainder as the last sentence
        // mark the turn complete so the queue can drain to listening when done.
        streamTurnIdRef.current = null;
        streamRunIdRef.current = null;
        streamTextRef.current = "";
        deltaBufRef.current = "";
        // if nothing queued/playing, return to listening now.
        if (!speechBusyRef.current && speechQueueRef.current.length === 0) {
          if (activeRef.current && !speakingRef.current) {
            setStatus("listening");
            startRecognitionRef.current();
          }
        }
        return;
      }
    },
    [addTurn, processDeltaBuffer, upsertStreamTurn],
  );

  // ── LIVE mode: EventSource lifecycle + reconnect backoff ─────────────────────
  // Opened once at call start and kept for the whole call. On drop, reconnect with
  // backoff; count CONSECUTIVE failures — 3 in a row permanently falls back to the
  // Supabase path (voice: fallback path). A `ready` / any parsed message resets it.
  const fallbackToSupabaseRef = useRef<() => void>(() => {});

  const openStream = useCallback(() => {
    if (!liveRef.current || !activeRef.current) return;
    if (typeof EventSource === "undefined") {
      // no SSE support → use the Supabase path.
      fallbackToSupabaseRef.current();
      return;
    }
    // tear down any previous source before opening a new one.
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {
        /* ignore */
      }
      esRef.current = null;
    }
    let es: EventSource;
    try {
      es = new EventSource(
        `/api/workforce/call/stream?agent=${encodeURIComponent(agentId)}`,
      );
    } catch {
      esFailRef.current += 1;
      if (esFailRef.current >= 3) fallbackToSupabaseRef.current();
      return;
    }
    esRef.current = es;
    es.onopen = () => {
      esFailRef.current = 0;
    };
    es.onmessage = (e: MessageEvent) => {
      handleStreamEvent(typeof e.data === "string" ? e.data : "");
    };
    es.onerror = () => {
      // EventSource auto-reconnects, but we want our own backoff + strike count and
      // the ability to permanently fall back. Close and schedule our reconnect.
      try {
        es.close();
      } catch {
        /* ignore */
      }
      if (esRef.current === es) esRef.current = null;
      if (!liveRef.current || !activeRef.current) return;
      esFailRef.current += 1;
      if (esFailRef.current >= 3) {
        fallbackToSupabaseRef.current();
        return;
      }
      const delay = Math.min(4000, 500 * esFailRef.current);
      if (esReconnectRef.current) clearTimeout(esReconnectRef.current);
      esReconnectRef.current = setTimeout(() => {
        if (liveRef.current && activeRef.current) openStream();
      }, delay);
    };
  }, [agentId, handleStreamEvent]);

  // Proactively reconnect the SSE every 55s (clean close+reopen, not a failure)
  // so a serverless function time limit below maxDuration=300 never cuts a reply.
  const startEsKeepalive = useCallback(() => {
    if (esKeepaliveRef.current) return;
    esKeepaliveRef.current = setInterval(() => {
      if (liveRef.current && activeRef.current) {
        esFailRef.current = 0; // proactive reconnect — reset the strike count
        openStream();
      }
    }, 55_000);
  }, [openStream]);
  const stopEsKeepalive = useCallback(() => {
    if (esKeepaliveRef.current) {
      clearInterval(esKeepaliveRef.current);
      esKeepaliveRef.current = null;
    }
  }, []);

  // Probe the live channel (?ping=1) before committing to the SSE. false → the
  // bridge is unreachable within 3s → fall back to Supabase now (not after three
  // failed EventSource attempts). Logs the failing bridge host, never the token.
  const preflightLiveChannel = useCallback(async (): Promise<boolean> => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 3000);
    try {
      const res = await fetch(
        `/api/workforce/call/stream?agent=${encodeURIComponent(agentId)}&ping=1`,
        { signal: ac.signal, cache: "no-store" },
      );
      clearTimeout(timer);
      if (!res.ok) {
        const bhost = res.headers.get("x-bridge-host") || "bridge";
        console.warn(
          `[call] live channel unreachable via ${bhost} (http ${res.status}) — using fallback`,
        );
        return false;
      }
      return true;
    } catch (e) {
      clearTimeout(timer);
      console.warn(
        `[call] live channel preflight failed (${(e as Error)?.name ?? "error"}) — using fallback`,
      );
      return false;
    }
  }, [agentId]);

  // ── Send tick: a ~40ms quiet sine so a send is audible, no asset ─────────────
  const sendTick = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      /* audio context unavailable — ignore */
    }
  }, []);

  // release any speech that arrived while I was mid-sentence. Supabase mode holds
  // whole replies (speak each); live mode holds sentences (re-enqueue each).
  const releaseDeferredSpeech = useCallback(() => {
    if (pendingSpeechRef.current.length === 0) return;
    const items = pendingSpeechRef.current;
    pendingSpeechRef.current = [];
    if (liveRef.current) {
      for (const s of items) enqueueSpeech(s);
    } else {
      const first = items.shift();
      // keep the rest queued for the Supabase finishSpeaking chain
      pendingSpeechRef.current = items;
      if (first !== undefined && !speakingRef.current) void speak(first);
    }
  }, [enqueueSpeech, speak]);

  // ── Sending an utterance: one-in-flight, rest queued ─────────────────────────
  // LIVE mode sends via POST /api/workforce/call/send (501 → permanent fallback);
  // Supabase mode uses the sendVoiceUtterance action + reply cursor.
  const pumpQueue = useCallback(async () => {
    if (inFlightRef.current) return;
    const next = utteranceQueueRef.current.shift();
    if (next === undefined) return;
    // parallel flag: did the Scribe path already render this "mine" turn? shifted
    // in lockstep with the utterance so pumpQueue doesn't double-render it.
    const mineRendered = mineRenderedQueueRef.current.shift() ?? false;
    inFlightRef.current = true;
    setStatus("sending");
    sendTick();
    // open a per-turn diagnostic at t0 = now (commit/send). `pendingHeardRef` holds
    // the capture duration (first-partial → commit) for Scribe utterances; it is
    // undefined for browser-final or ptt sends where no partial timing exists.
    beginDiagTurnRef.current(pendingHeardRef.current);
    pendingHeardRef.current = undefined;
    if (process.env.NODE_ENV !== "production") {
      tSendRef.current = performance.now();
      console.log("[call] t_send", Math.round(tSendRef.current));
    }

    if (liveRef.current) {
      // Fire the send FIRST, then render my turn (send in flight before re-render).
      const sendPromise = fetch("/api/workforce/call/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, text: next }),
      });
      if (!mineRendered)
        addTurn({ id: turnSeqRef.current--, mine: true, text: next });
      try {
        const res = await sendPromise;
        if (res.status === 501) {
          // live channel became unavailable → permanent fallback, resend there.
          // My turn is already rendered → mark it rendered on the re-queue too.
          fallbackToSupabaseRef.current();
          utteranceQueueRef.current.unshift(next);
          mineRenderedQueueRef.current.unshift(true);
        }
      } catch {
        /* swallow; the stream keeps running / reconnects */
      } finally {
        inFlightRef.current = false;
        if (activeRef.current && !speakingRef.current) setStatus("thinking");
        if (noReplyTimerRef.current) clearTimeout(noReplyTimerRef.current);
        noReplyTimerRef.current = setTimeout(() => {
          if (activeRef.current) {
            addTurn({
              id: turnSeqRef.current--,
              mine: false,
              text: "no reply yet",
            });
            if (!speakingRef.current) setStatus("listening");
          }
        }, 100_000);
        releaseDeferredSpeech();
        if (utteranceQueueRef.current.length > 0) void pumpQueue();
      }
      return;
    }

    // ── Supabase mode ──
    const sendPromise = sendVoiceUtterance(agentId, next);
    if (!mineRendered)
      addTurn({ id: turnSeqRef.current--, mine: true, text: next });
    try {
      const { afterEventId } = await sendPromise;
      // seed/advance the cursor from the first utterance's returned value
      if (afterEventId > afterEventIdRef.current) {
        afterEventIdRef.current = afterEventId;
      }
    } catch {
      /* swallow; the reply loop keeps running */
    } finally {
      inFlightRef.current = false;
      if (activeRef.current && !speakingRef.current) setStatus("thinking");
      // "no reply yet" watchdog — reset each send
      if (noReplyTimerRef.current) clearTimeout(noReplyTimerRef.current);
      noReplyTimerRef.current = setTimeout(() => {
        if (activeRef.current) {
          addTurn({
            id: turnSeqRef.current--,
            mine: false,
            text: "no reply yet",
          });
          if (!speakingRef.current) setStatus("listening");
        }
      }, 100_000);
      releaseDeferredSpeech();
      // more queued? keep pumping
      if (utteranceQueueRef.current.length > 0) void pumpQueue();
    }
  }, [agentId, addTurn, sendTick, releaseDeferredSpeech]);

  // decide whether a finalised utterance is worth sending
  const shouldSend = useCallback((text: string): boolean => {
    const t = text.trim();
    if (!t) return false;
    const words = t.split(/\s+/);
    if (words.length >= 2) return true;
    // allow clear one-word answers
    const single = t.toLowerCase().replace(/[^a-z]/g, "");
    return ["yes", "no", "okay", "ok", "stop"].includes(single);
  }, []);

  // `force` bypasses the word floor: used for a "?"-terminated final and for a
  // push-to-talk release, where the human has clearly finished their turn.
  const flushUtterance = useCallback(
    (force = false) => {
      const text = finalBufRef.current.trim();
      finalBufRef.current = "";
      interimRef.current = "";
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (!text) return;
      if (!force && !shouldSend(text)) return;
      utteranceQueueRef.current.push(text);
      void pumpQueue();
    },
    [pumpQueue, shouldSend],
  );

  // ── Scribe (ElevenLabs realtime STT) input path ──────────────────────────────
  // Barge-in interrupt (stop playback + clear the speech queue, resume listening)
  // is assigned from handleInterrupt below via a ref (handleInterrupt is defined
  // later). Same TDZ dance as startRecognitionRef.
  const interruptRef = useRef<() => void>(() => {});

  // Render a live partial into the "mine" transcript row in grey (reuse the
  // streaming styling). Creates the row on the first partial, updates in place.
  const upsertMineTurn = useCallback((text: string) => {
    const id = mineTurnIdRef.current;
    if (id === null) {
      const newId = turnSeqRef.current--;
      mineTurnIdRef.current = newId;
      setTurns((prev) => [
        ...prev,
        { id: newId, mine: true, text, streaming: true },
      ]);
      return;
    }
    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], text, streaming: true };
      return copy;
    });
  }, []);

  // Finalise the current live "mine" row: either promote it to a normal (non-grey)
  // turn with `finalText`, or drop it if the utterance is discarded.
  const settleMineTurn = useCallback((finalText: string | null) => {
    const id = mineTurnIdRef.current;
    mineTurnIdRef.current = null;
    if (id === null) return;
    setTurns((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      if (finalText === null) {
        const copy = prev.slice();
        copy.splice(idx, 1);
        return copy;
      }
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], text: finalText, streaming: false };
      return copy;
    });
  }, []);

  // A committed segment arrived (or a joined batch is due). Decide whether to send
  // it: apply the word floor, handle mid-playback (barge-in vs ignore), stage the
  // "heard" diagnostic, then push through the existing send path (pumpQueue).
  const sendCommitted = useCallback(
    (text: string, heard: number | undefined) => {
      const t = text.trim();
      if (!t) {
        settleMineTurn(null);
        return;
      }
      const words = t.split(/\s+/).filter(Boolean);
      // mid-playback: hands-free hold-back unless a 3+ word barge-in (and toggle on).
      const speaking = speakingRef.current || speechBusyRef.current;
      if (speaking) {
        if (!bargeInRef.current || words.length < 3) {
          // ignore this commit entirely — drop the live row, keep playing.
          settleMineTurn(null);
          return;
        }
        // barge-in: stop playback + clear the queue, then fall through to send.
        interruptRef.current();
      }
      // word floor: ≥2 words, or a clear one-word answer.
      if (!shouldSend(t)) {
        settleMineTurn(null);
        return;
      }
      // promote the live grey row to my finished turn (don't double-add in
      // pumpQueue — the Scribe path renders the mine turn itself).
      settleMineTurn(t);
      pendingHeardRef.current = heard;
      mineRenderedQueueRef.current.push(true);
      utteranceQueueRef.current.push(t);
      void pumpQueue();
    },
    [pumpQueue, shouldSend, settleMineTurn],
  );

  // Flush the 400ms commit-join buffer as one utterance.
  const flushCommitBuffer = useCallback(() => {
    if (commitJoinTimerRef.current) {
      clearTimeout(commitJoinTimerRef.current);
      commitJoinTimerRef.current = null;
    }
    const text = commitBufRef.current.trim();
    commitBufRef.current = "";
    // "heard" = first partial of this utterance → now (the commit). undefined if we
    // never saw a partial (shouldn't happen with Scribe, but stay safe).
    const heard =
      firstPartialAtRef.current > 0
        ? (performance.now() - firstPartialAtRef.current) / 1000
        : undefined;
    firstPartialAtRef.current = 0;
    if (!text) {
      settleMineTurn(null);
      return;
    }
    sendCommitted(text, heard);
  }, [sendCommitted, settleMineTurn]);

  // Scribe onPartialTranscript → live grey "mine" row + start the "heard" clock.
  const onScribePartial = useCallback(
    (text: string) => {
      if (!activeRef.current || !scribeActiveRef.current) return;
      if (pttRef.current && !holdingRef.current) return; // muted, ignore stray
      if (firstPartialAtRef.current === 0) {
        firstPartialAtRef.current = performance.now();
      }
      const shown = commitBufRef.current
        ? `${commitBufRef.current} ${text}`.trim()
        : text;
      upsertMineTurn(shown);
    },
    [upsertMineTurn],
  );

  // Scribe onCommittedTranscript → buffer + 400ms join window before sending.
  const onScribeCommitted = useCallback(
    (text: string) => {
      if (!activeRef.current || !scribeActiveRef.current) return;
      const seg = text.trim();
      if (!seg) return;
      commitBufRef.current = commitBufRef.current
        ? `${commitBufRef.current} ${seg}`
        : seg;
      upsertMineTurn(commitBufRef.current);
      // join near-adjacent commits: (re)arm a 400ms flush.
      if (commitJoinTimerRef.current) clearTimeout(commitJoinTimerRef.current);
      commitJoinTimerRef.current = setTimeout(() => {
        commitJoinTimerRef.current = null;
        flushCommitBuffer();
      }, 400);
    },
    [upsertMineTurn, flushCommitBuffer],
  );

  // Live refs so the useScribe callbacks (captured once) always call the current
  // handler — the SDK does not re-subscribe when these change.
  const onScribePartialRef = useRef(onScribePartial);
  const onScribeCommittedRef = useRef(onScribeCommitted);
  useEffect(() => {
    onScribePartialRef.current = onScribePartial;
    onScribeCommittedRef.current = onScribeCommitted;
  }, [onScribePartial, onScribeCommitted]);

  // Track connect failures (onError / onAuthError). Two failures this call → we
  // fall back to the browser recogniser (handled in startCall's connect loop).
  const scribeErroredRef = useRef(false);
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "en",
    microphone: { echoCancellation: true, noiseSuppression: true },
    autoConnect: false,
    // The SDK default is CommitStrategy.MANUAL — which never auto-commits, so a
    // turn transcribes forever. "vad" lets the server commit on silence.
    commitStrategy: CommitStrategy.VAD,
    vadSilenceThresholdSecs: 0.6,
    onPartialTranscript: ({ text }) => onScribePartialRef.current(text),
    onCommittedTranscript: ({ text }) => onScribeCommittedRef.current(text),
    onError: () => {
      scribeErroredRef.current = true;
    },
    onAuthError: () => {
      scribeErroredRef.current = true;
    },
  });
  // Live ref to the scribe controls for handlers/teardown that must not depend on
  // the (identity-changing) scribe object.
  const scribeRef = useRef(scribe);
  useEffect(() => {
    scribeRef.current = scribe;
  }, [scribe]);

  // ── Speech recognition lifecycle ─────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!activeRef.current || speakingRef.current) return;
    // Scribe owns capture when active — never start the browser recogniser.
    if (scribeActiveRef.current) return;
    if (recognitionRef.current) return; // already running
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang =
      (typeof navigator !== "undefined" && navigator.language) || "en-GB";
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      recFailRef.current = 0; // capture is working — clear the flicker counter
      let interim = "";
      let sawQuestionFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0]?.transcript ?? "";
        if (r.isFinal) {
          const t = txt.trim();
          finalBufRef.current += `${finalBufRef.current ? " " : ""}${t}`;
          if (t.endsWith("?")) sawQuestionFinal = true;
        } else {
          interim += txt;
        }
      }
      interimRef.current = interim;
      // In push-to-talk the release drives the flush — don't arm the silence timer.
      if (pttRef.current) return;
      // A "?"-terminated final is a complete question: flush now, past the floor.
      if (sawQuestionFinal && finalBufRef.current) {
        flushUtterance(true);
        return;
      }
      // debounce: 500ms after the last final result with nothing further
      if (finalBufRef.current) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          interimRef.current = "";
          flushUtterance();
        }, 500);
      }
    };
    rec.onerror = (ev: unknown) => {
      const err = (ev as { error?: string })?.error ?? "";
      if (err === "not-allowed" || err === "service-not-allowed") {
        recFatalRef.current = true;
        setError(
          "microphone blocked — allow mic access for this site, then call again",
        );
      } else if (err === "audio-capture") {
        recFatalRef.current = true;
        setError("no microphone found");
      } else if (err && err !== "no-speech" && err !== "aborted") {
        setError(`voice: ${err}`); // e.g. "network" — surface but keep trying
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      if (!activeRef.current || speakingRef.current || recFatalRef.current)
        return;
      // Push-to-talk: recognition is driven ONLY by the press — never auto-restart.
      if (pttRef.current) return;
      // A session that ends almost immediately is failing, not real silence —
      // back off instead of tight-looping the mic (that's the "flicker"); after a
      // few rapid failures, stop and surface it rather than loop forever.
      const ran = Date.now() - recStartRef.current;
      if (ran < 1200) {
        recFailRef.current += 1;
        if (recFailRef.current >= 5) {
          setError(
            "voice recognition keeps dropping — check mic access / network, or try chrome",
          );
          return;
        }
      } else {
        recFailRef.current = 0;
      }
      const delay = ran < 1200 ? Math.min(2500, 300 * recFailRef.current) : 250;
      setTimeout(() => {
        if (activeRef.current && !speakingRef.current && !recFatalRef.current) {
          startRecognitionRef.current();
        }
      }, delay);
    };
    recognitionRef.current = rec;
    recStartRef.current = Date.now();
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [flushUtterance]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  // ── Workers line: poll every 5s DURING THE CALL ONLY ─────────────────────────
  const pollWorkers = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/workforce/workers?agent=${encodeURIComponent(agentId)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { workers: Worker[] };
      if (activeRef.current) setWorkers(data.workers ?? []);
    } catch {
      /* ignore */
    }
  }, [agentId]);

  // ── LIVE mode: teardown of the stream + speech queue ─────────────────────────
  const closeStream = useCallback(() => {
    stopEsKeepalive();
    if (esReconnectRef.current) {
      clearTimeout(esReconnectRef.current);
      esReconnectRef.current = null;
    }
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {
        /* ignore */
      }
      esRef.current = null;
    }
  }, [stopEsKeepalive]);

  // Clear the gapless speech queue + any prefetched/next audio (used by interrupt
  // and teardown). Does not touch the audio element — the caller does stopAudio.
  const clearSpeechQueue = useCallback(() => {
    speechQueueRef.current = [];
    speechBusyRef.current = false;
    if (prefetchAbortRef.current) {
      try {
        prefetchAbortRef.current.abort();
      } catch {
        /* ignore */
      }
      prefetchAbortRef.current = null;
    }
    prefetchRef.current = null;
    deltaBufRef.current = "";
    streamTurnIdRef.current = null;
    streamRunIdRef.current = null;
    streamTextRef.current = "";
  }, []);

  // Permanent fallback to the Supabase path for the rest of the call: close the
  // stream, clear the live speech queue, flip liveRef off, set the diagnostic to
  // "fallback path", and start the reply long-poll. Utterances now go via the
  // Supabase action. Idempotent.
  const fallbackToSupabase = useCallback(() => {
    if (!liveRef.current) return;
    liveRef.current = false;
    stopEsKeepalive();
    closeStream();
    clearSpeechQueue();
    stopAudio();
    speakingRef.current = false;
    setTransport("fallback");
    // keep the specific "(live channel unreachable)" note set by the preflight;
    // otherwise (e.g. mid-call drop) show the generic fallback.
    setTransportNote((n) =>
      n === "transport: fallback (live channel unreachable)"
        ? n
        : "transport: fallback",
    );
    setVoice("fallback path");
    voiceResolvedRef.current = true; // don't let a later tts overwrite the notice
    if (!activeRef.current) return;
    // seed the reply cursor at "now" so the poll doesn't replay old events, then
    // resume mic + poll.
    void (async () => {
      try {
        const seed = await latestEventId(agentId);
        if (seed && seed > afterEventIdRef.current)
          afterEventIdRef.current = seed;
      } catch {
        /* keep the existing cursor */
      }
      if (!activeRef.current) return;
      setStatus("listening");
      startRecognitionRef.current();
      void runPoll();
    })();
  }, [
    agentId,
    closeStream,
    clearSpeechQueue,
    stopAudio,
    runPoll,
    stopEsKeepalive,
  ]);

  useEffect(() => {
    fallbackToSupabaseRef.current = fallbackToSupabase;
  }, [fallbackToSupabase]);

  // ── Scribe connect: fetch a fresh token, connect, with a 2-failure budget ─────
  // Returns true if Scribe is connected and now the active capture path; false to
  // fall back to the browser recogniser. Fetches a FRESH single-use token each call
  // (start and reconnect). A 501/5xx token route OR two failed connects → false.
  const tryStartScribe = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      let token: string | null = null;
      try {
        const res = await fetch("/api/workforce/call/scribe-token");
        if (!res.ok) {
          // 501 (no key) / 5xx → Scribe unavailable, use the browser recogniser.
          return false;
        }
        const data = (await res.json().catch(() => null)) as {
          token?: string;
        } | null;
        token = data?.token ?? null;
      } catch {
        return false; // token route unreachable → browser fallback
      }
      if (!token) return false;
      if (!activeRef.current) return false; // call ended while fetching
      scribeErroredRef.current = false;
      try {
        await scribeRef.current.connect({ token });
        // connect resolved — but an onError/onAuthError may have fired during it.
        if (scribeErroredRef.current) {
          scribeConnectFailRef.current += 1;
          try {
            scribeRef.current.disconnect();
          } catch {
            /* ignore */
          }
          continue; // retry (up to the 2-attempt budget)
        }
        return true; // connected + healthy
      } catch {
        scribeConnectFailRef.current += 1;
        try {
          scribeRef.current.disconnect();
        } catch {
          /* ignore */
        }
        // loop retries; after 2 attempts we fall through to false.
      }
    }
    return false;
  }, []);

  // ── Start / end ──────────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!getSpeechRecognitionCtor()) return;
    setError(null);
    recFatalRef.current = false;
    recFailRef.current = 0;
    // SpeechRecognition prompts for the mic itself on start() and manages its own
    // capture — we deliberately do NOT open a getUserMedia stream (holding one
    // open, or racing it, starves the recogniser → no transcript / mic flicker).

    // Lazily create (or resume) the AudioContext for the send tick — the click
    // that started the call is the required user gesture.
    try {
      if (!audioCtxRef.current && typeof window !== "undefined") {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (Ctx) audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current?.state === "suspended")
        void audioCtxRef.current.resume();
    } catch {
      /* audio unavailable — the tick just won't play */
    }

    // seed the reply cursor at "now"
    try {
      const seed = await latestEventId(agentId);
      afterEventIdRef.current = seed ?? 0;
    } catch {
      afterEventIdRef.current = 0;
    }
    // reset call-scoped machinery
    finalBufRef.current = "";
    interimRef.current = "";
    utteranceQueueRef.current = [];
    pendingSpeechRef.current = [];
    inFlightRef.current = false;
    turnSeqRef.current = -1;
    voiceResolvedRef.current = false;
    holdingRef.current = false;
    // reset live-mode machinery
    esFailRef.current = 0;
    clearSpeechQueue();
    tFirstDeltaLoggedRef.current = false;
    tFirstAudioLoggedRef.current = false;
    // reset Scribe + diagnostics machinery
    scribeActiveRef.current = false;
    scribeConnectFailRef.current = 0;
    scribeErroredRef.current = false;
    mineTurnIdRef.current = null;
    mineRenderedQueueRef.current = [];
    commitBufRef.current = "";
    if (commitJoinTimerRef.current) {
      clearTimeout(commitJoinTimerRef.current);
      commitJoinTimerRef.current = null;
    }
    firstPartialAtRef.current = 0;
    diagTurnIdRef.current = null;
    setDiagTurns([]);
    setHearing(null);
    setTransportNote(null);

    // Decide the transport: live stream-and-speak, or the Supabase reply path.
    // Default to Supabase if the check throws — never block starting the call.
    let live = false;
    try {
      live = await liveCallAvailable();
    } catch {
      live = false;
    }
    liveRef.current = live;
    setTransport(live ? "live" : "fallback");

    activeRef.current = true;
    speakingRef.current = false;
    setEnded(false);
    setTurns([]);
    setWorkers([]);
    setVoice(null);
    setCheckingBg(false);
    setHolding(false);
    setStatus("listening");
    setActive(true);

    // ── Choose the capture path: try Scribe, else the browser recogniser. ──
    // Scribe connects in the background; while it does, we do NOT start the browser
    // recogniser (avoids two mics fighting). If Scribe fails, fall back then.
    void (async () => {
      const ok = await tryStartScribe();
      if (!activeRef.current) return; // call ended while connecting
      if (ok) {
        scribeActiveRef.current = true;
        setHearing("scribe");
        // hands-free: stay unmuted (default). hold-to-talk: mute until a press.
        try {
          if (pttRef.current) scribeRef.current.mute();
          else scribeRef.current.unmute();
        } catch {
          /* ignore */
        }
      } else {
        // Scribe unavailable → browser Web Speech recogniser fallback.
        scribeActiveRef.current = false;
        setHearing("browser");
        if (!pttRef.current) startRecognitionRef.current();
      }
    })();

    if (live) {
      // LIVE: preflight the channel; open the SSE only if the bridge is reachable,
      // else fall back to Supabase immediately (not after 3 failed EventSources).
      void (async () => {
        const reachable = await preflightLiveChannel();
        if (!activeRef.current) return;
        if (reachable) {
          setTransportNote("transport: live");
          openStream();
          startEsKeepalive();
        } else {
          setTransportNote("transport: fallback (live channel unreachable)");
          fallbackToSupabaseRef.current();
        }
      })();
    } else {
      // SUPABASE: run the reply long-poll.
      setTransportNote("transport: fallback");
      void runPoll();
    }
    void pollWorkers();
    workersTimerRef.current = setInterval(() => void pollWorkers(), 5000);
  }, [
    agentId,
    pollWorkers,
    runPoll,
    tryStartScribe,
    clearSpeechQueue,
    openStream,
    preflightLiveChannel,
    startEsKeepalive,
  ]);

  const teardown = useCallback(() => {
    activeRef.current = false;
    speakingRef.current = false;
    pollActiveRef.current = false;
    stopRecognition();
    // disconnect Scribe: the SDK releases the mic. Keep all other teardown.
    scribeActiveRef.current = false;
    try {
      scribeRef.current.disconnect();
    } catch {
      /* not connected — ignore */
    }
    if (commitJoinTimerRef.current) {
      clearTimeout(commitJoinTimerRef.current);
      commitJoinTimerRef.current = null;
    }
    commitBufRef.current = "";
    mineTurnIdRef.current = null;
    mineRenderedQueueRef.current = [];
    firstPartialAtRef.current = 0;
    stopAudio();
    closeStream();
    clearSpeechQueue();
    if (pollAbortRef.current) pollAbortRef.current.abort();
    if (noReplyTimerRef.current) {
      clearTimeout(noReplyTimerRef.current);
      noReplyTimerRef.current = null;
    }
    if (workersTimerRef.current) {
      clearInterval(workersTimerRef.current);
      workersTimerRef.current = null;
    }
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    holdingRef.current = false;
    setHolding(false);
    utteranceQueueRef.current = [];
    pendingSpeechRef.current = [];
    inFlightRef.current = false;
  }, [stopAudio, stopRecognition, closeStream, clearSpeechQueue]);

  const handleEndCall = useCallback(async () => {
    teardown();
    setActive(false);
    setEnded(true);
    setWorkers([]);
    try {
      await endCall(agentId);
    } catch {
      /* best-effort */
    }
  }, [agentId, teardown]);

  const handleInterrupt = useCallback(() => {
    // stop the current audio/speech and drop anything queued to be spoken,
    // then return to listening.
    pendingSpeechRef.current = [];
    if (liveRef.current) {
      // live: clear the gapless queue + abort the in-flight/prefetched tts, mark
      // any open streaming turn complete, then resume listening.
      if (streamTurnIdRef.current !== null) {
        upsertStreamTurn(streamTextRef.current, false);
      }
      clearSpeechQueue();
      if (ttsAbortRef.current) {
        try {
          ttsAbortRef.current.abort();
        } catch {
          /* already aborted */
        }
        ttsAbortRef.current = null;
      }
      speechBusyRef.current = false;
      speakingRef.current = false;
      stopAudio();
      if (activeRef.current) {
        setStatus("listening");
        startRecognitionRef.current();
      }
      return;
    }
    finishSpeaking();
  }, [finishSpeaking, clearSpeechQueue, stopAudio, upsertStreamTurn]);

  // keep the barge-in interrupt + toggle live for the Scribe commit handler.
  useEffect(() => {
    interruptRef.current = handleInterrupt;
  }, [handleInterrupt]);
  useEffect(() => {
    bargeInRef.current = bargeIn;
  }, [bargeIn]);

  // ── Push-to-talk toggle ──────────────────────────────────────────────────────
  const togglePtt = useCallback(() => {
    setPtt((prev) => {
      const next = !prev;
      pttRef.current = next;
      writePtt(next);
      // switching mode mid-call: reconcile capture to the new mode
      if (activeRef.current && !speakingRef.current) {
        if (next) {
          // → hold to talk: Scribe stays connected but muted until the next press;
          // the browser recogniser is stopped until the next press.
          holdingRef.current = false;
          setHolding(false);
          if (scribeActiveRef.current) {
            try {
              scribeRef.current.mute();
            } catch {
              /* not connected — ignore */
            }
          } else {
            stopRecognition();
          }
        } else {
          // → hands-free: Scribe stays unmuted; the browser recogniser resumes.
          if (scribeActiveRef.current) {
            try {
              scribeRef.current.unmute();
            } catch {
              /* ignore */
            }
          } else {
            startRecognitionRef.current();
          }
        }
      }
      return next;
    });
  }, [stopRecognition]);

  // press: unmute Scribe / start the recogniser and mark holding. release: send
  // whatever has been committed (+ the current partial), then mute / stop.
  const pttPress = useCallback(() => {
    if (!activeRef.current || !pttRef.current || speakingRef.current) return;
    if (holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    finalBufRef.current = "";
    interimRef.current = "";
    if (scribeActiveRef.current) {
      firstPartialAtRef.current = 0;
      commitBufRef.current = "";
      try {
        scribeRef.current.unmute();
      } catch {
        /* ignore */
      }
      return;
    }
    startRecognitionRef.current();
  }, []);

  const pttRelease = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (scribeActiveRef.current) {
      // release ends the turn: send committed text + the current partial, then mute.
      if (commitJoinTimerRef.current) {
        clearTimeout(commitJoinTimerRef.current);
        commitJoinTimerRef.current = null;
      }
      const partial = (scribeRef.current.partialTranscript ?? "").trim();
      const committed = commitBufRef.current.trim();
      commitBufRef.current = "";
      const text = [committed, partial].filter(Boolean).join(" ").trim();
      const heard =
        firstPartialAtRef.current > 0
          ? (performance.now() - firstPartialAtRef.current) / 1000
          : undefined;
      firstPartialAtRef.current = 0;
      // ptt release is an explicit end-of-turn → send past the word floor.
      if (text) {
        settleMineTurn(text);
        pendingHeardRef.current = heard;
        mineRenderedQueueRef.current.push(true);
        utteranceQueueRef.current.push(text);
        void pumpQueue();
      } else {
        settleMineTurn(null);
      }
      try {
        scribeRef.current.mute();
      } catch {
        /* ignore */
      }
      return;
    }
    stopRecognition();
    // release ends the turn: flush immediately, past the word floor.
    flushUtterance(true);
  }, [stopRecognition, flushUtterance, settleMineTurn, pumpQueue]);

  // Space bar drives push-to-talk while a call is active in ptt mode.
  useEffect(() => {
    if (!active || !ptt) return;
    const isTypingTarget = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        node.isContentEditable === true
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.repeat) return; // ignore auto-repeat
      if (isTypingTarget(e.target)) return; // don't hijack typing
      e.preventDefault(); // stop the page scrolling
      pttPress();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      pttRelease();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [active, ptt, pttPress, pttRelease]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  // ── autoStart: begin the call on mount when requested ────────────────────────
  // Used when the call is opened from elsewhere (e.g. clicking an office sphere)
  // where there's no idle button to press. Invokes the EXISTING startCall() once —
  // guarded so a re-render / a fresh startCall identity can't fire it twice.
  const autoStartedRef = useRef(false);
  const startCallRef = useRef(startCall);
  useEffect(() => {
    startCallRef.current = startCall;
  }, [startCall]);
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startCallRef.current();
  }, [autoStart]);

  // ── Render ───────────────────────────────────────────────────────────────────
  // IDLE (or just-ended): the call button that lives in the chat header. Starts
  // the voice call. When a previous call just ended we keep the same round button
  // (its state resets on the next start) plus any error surfaced below the header.
  if (!active && !ended) {
    return (
      <button
        type="button"
        className="cp-call-btn"
        onClick={startCall}
        disabled={!supported}
        aria-label={
          supported ? `call ${agentName}` : "voice needs chrome or safari"
        }
        title={supported ? `call ${agentName}` : "voice needs chrome or safari"}
      >
        <PhoneIcon />
      </button>
    );
  }

  const workerLine =
    active && workers.length > 0
      ? `working in background: ${workers.map((w) => w.label).join(", ")}`
      : null;

  const statusText =
    status === "thinking" ? `thinking · ${thinkingSecs}s` : status;

  // ACTIVE / ENDED: the round header button becomes an "end call" affordance, and
  // an in-call banner (rendered by the ChatPane header slot's parent flow) shows
  // the live state + transcript. The whole thing is a fragment so the button sits
  // in the header slot and the banner sits directly beneath it.
  return (
    <>
      <button
        type="button"
        className={`cp-call-btn ${active ? "on" : "ended"}`}
        onClick={active ? handleEndCall : startCall}
        aria-label={active ? "end call" : `call ${agentName}`}
        title={active ? "end call" : `call ${agentName}`}
      >
        {active ? <EndCallIcon /> : <PhoneIcon />}
      </button>

      <section className="cp-panel" aria-label="voice call">
        {/* ── section title: gives the call its own clear header ───────────── */}
        <div className="cp-head">
          <span className="cp-head-title">
            <PhoneIcon />
            voice call
          </span>
          <span className="cp-head-with">with {agentName}</span>
          {/* once the call has ended, let the owner dismiss the leftover
              transcript (active call is ended via the round header button). */}
          {ended && !active && (
            <button
              type="button"
              className="cp-close"
              onClick={() => setEnded(false)}
              aria-label="close transcript"
              title="close transcript"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── in-call bar: live indicator + status + quick controls ────────── */}
        <div className="cp-bar">
          <span className="cp-live">
            <span className="cp-live-dot" aria-hidden="true" />
            {ended ? "call ended" : "on call"}
          </span>
          {!ended && (
            <span className="cp-state" aria-live="polite">
              {statusText}
            </span>
          )}
          <span className="cp-bar-actions">
            {active && (
              <button
                type="button"
                className={`cp-chip ${ptt ? "on" : ""}`}
                onClick={togglePtt}
                aria-pressed={ptt}
                title={
                  ptt
                    ? "push-to-talk: hold space or the talk button"
                    : "hands-free: always listening"
                }
              >
                {ptt ? "push-to-talk" : "hands-free"}
              </button>
            )}
            {active && !ptt && (
              <button
                type="button"
                className={`cp-chip ${bargeIn ? "on" : ""}`}
                onClick={() => setBargeIn((v) => !v)}
                aria-pressed={bargeIn}
                title={
                  bargeIn
                    ? "barge-in on: talking over the agent interrupts it"
                    : "barge-in off: the agent finishes before it listens"
                }
              >
                barge-in {bargeIn ? "on" : "off"}
              </button>
            )}
            {active && status === "speaking" && (
              <button
                type="button"
                className="cp-chip cp-interrupt"
                onClick={handleInterrupt}
              >
                interrupt
              </button>
            )}
          </span>
        </div>

        {/* ── transcript: styled like the chat bubbles ─────────────────────── */}
        <div
          ref={transcriptRef}
          className="cp-transcript"
          role="log"
          aria-live="polite"
          aria-label={`call transcript with ${agentName}`}
        >
          {turns.length === 0 ? (
            <p className="cp-hint">
              {active ? (ptt ? "hold to talk" : "listening…") : "call ended"}
            </p>
          ) : (
            turns.map((t) => (
              <div
                key={t.id}
                className={`cp-line ${t.mine ? "mine" : "theirs"}${
                  t.streaming ? " streaming" : ""
                }`}
              >
                <span className="cp-line-t">{stripCallNote(t.text)}</span>
              </div>
            ))
          )}
        </div>

        {/* ── push-to-talk button (full-width, in-flow) ────────────────────── */}
        {active && ptt && (
          <button
            type="button"
            className={`cp-talk ${holding ? "holding" : ""}`}
            onPointerDown={(e) => {
              e.preventDefault();
              pttPress();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              pttRelease();
            }}
            onPointerLeave={() => pttRelease()}
            onPointerCancel={() => pttRelease()}
          >
            {holding ? "listening…" : "hold to talk"}
          </button>
        )}

        {active && checkingBg && (
          <p className="cp-checking">checking in background</p>
        )}
        {workerLine && <p className="cp-workers">{workerLine}</p>}

        {transportNote && (
          <p
            className={`cp-transport${
              transportNote.startsWith("transport: live")
                ? " live"
                : " fallback"
            }`}
          >
            {transportNote}
          </p>
        )}
        {error && <p className="cp-error">{error}</p>}
      </section>
    </>
  );
}

// ── Icons (inline SVG, no deps) ────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.44.57 3.57a1 1 0 01-.24 1l-2.23 2.23z"
        fill="currentColor"
      />
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.44.57 3.57a1 1 0 01-.24 1l-2.23 2.23z"
        fill="currentColor"
        transform="rotate(135 12 12)"
      />
    </svg>
  );
}
