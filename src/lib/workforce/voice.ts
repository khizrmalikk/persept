// Server-only helpers for call-mode text-to-speech. The ElevenLabs key never
// reaches the client (only the /api/workforce/tts route reads it).

/** Per-agent ElevenLabs voice id from env, falling back to the default. */
export function voiceIdFor(agentId: string): string | undefined {
  const key = `ELEVENLABS_VOICE_${agentId.trim().toUpperCase()}`;
  return process.env[key] || process.env.ELEVENLABS_VOICE_DEFAULT || undefined;
}

/** TTS model — turbo by default (natural + fast); overridable to A/B. */
export function ttsModel(): string {
  return process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";
}

export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
};

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 0.45,
  similarity_boost: 0.8,
  style: 0.35,
  use_speaker_boost: true,
  speed: 0.95,
};

/** Default voice settings with a per-agent JSON override merged over them. */
export function voiceSettingsFor(agentId: string): VoiceSettings {
  const raw = process.env[`ELEVENLABS_SETTINGS_${agentId.trim().toUpperCase()}`];
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const over = JSON.parse(raw) as Partial<VoiceSettings>;
    return { ...DEFAULT_SETTINGS, ...over };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ── Text preparation (spoken, not read) ──────────────────────────────────────

const HOUR_WORDS = [
  "twelve", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten", "eleven",
];

// "09:00" → "nine", "09:30" → "half nine", "09:15" → "nine fifteen",
// "09:45" → "quarter to ten", else "<hour> <mm>".
function expandTimes(s: string): string {
  return s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_m, hh: string, mm: string) => {
    const h = Number.parseInt(hh, 10);
    const m = Number.parseInt(mm, 10);
    const hw = HOUR_WORDS[h % 12];
    if (m === 0) return hw;
    if (m === 15) return `${hw} fifteen`;
    if (m === 30) return `half ${hw}`;
    if (m === 45) return `quarter to ${HOUR_WORDS[(h + 1) % 12]}`;
    return `${hw} ${mm}`;
  });
}

/**
 * Turn an agent reply into clean spoken text: strip markdown / [voice call]
 * markers, drop URLs, expand a few things a reader would stumble on, and keep
 * commas / full stops / ellipses (they are the pauses). Pure + deterministic.
 */
export function prepareForSpeech(input: string | null | undefined): string {
  let s = input ?? "";
  // [voice call] / [voice call ended] markers
  s = s.replace(/\[voice call(?: ended)?\]/gi, "");
  // links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // bare URLs → say nothing
  s = s.replace(/\bhttps?:\/\/\S+/gi, "");
  s = s.replace(/\bwww\.\S+/gi, "");
  // headings, emphasis, inline code markers
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  s = s.replace(/[*_`]+/g, "");
  // list dashes → sentence breaks ("keep <a> - <b>" and "- item")
  s = s.replace(/^\s*[-*+]\s+/gm, ". ");
  s = s.replace(/\s+-\s+/g, ". ");
  // currency: "AED 6,000" → "6,000 dirhams"
  s = s.replace(/\bAED\s*([\d.,]+)/g, "$1 dirhams");
  s = s.replace(/\bAED\b/g, "dirhams");
  // symbols / abbreviations
  s = s.replace(/\s*&\s*/g, " and ");
  s = s.replace(/\be\.g\.\s*/gi, "for example ");
  s = s.replace(/\bi\.e\.\s*/gi, "that is ");
  // "content/sales" → "content or sales" (slash between words only)
  s = s.replace(/([A-Za-z])\s*\/\s*([A-Za-z])/g, "$1 or $2");
  // clock times
  s = expandTimes(s);
  // tidy: collapse spaces, fix doubled periods from dash substitution, no space before punctuation
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\.\s*\.\s*/g, ". ");
  s = s.replace(/\s+([.,!?…])/g, "$1");
  return s.trim();
}

/** Back-compat alias (older callers) — same as prepareForSpeech. */
export const stripMarkdown = prepareForSpeech;
