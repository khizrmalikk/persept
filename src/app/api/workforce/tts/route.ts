import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import {
  prepareForSpeech,
  ttsModel,
  voiceIdFor,
  voiceSettingsFor,
} from "@/lib/workforce/voice";

// POST /api/workforce/tts { agentId, text, previousText?, nextText? } — streams
// ElevenLabs speech for one sentence (the body is streamed so the client starts
// playing before the whole clip downloads). previousText/nextText are the
// neighbouring sentences, sent to ElevenLabs for prosody continuity. The key is
// read at REQUEST time and never reaches the client. Allowlist-gated.
//
// x-voice-reason header: 200 → "elevenlabs"; 204 → "no key" / "no voice id" /
// "empty"; 502 → "http <status>".
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { allowed } = await currentUser();
  if (!allowed) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { agentId?: string; text?: string; previousText?: string; nextText?: string }
    | null;
  const agentId = (body?.agentId ?? "").trim();
  const text = prepareForSpeech(body?.text ?? "");
  if (!text) {
    return new NextResponse(null, {
      status: 204,
      headers: { "x-voice-reason": "empty" },
    });
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new NextResponse(null, {
      status: 204,
      headers: { "x-voice-reason": "no key" },
    });
  }
  // A key with no voice id configured for this agent (nor ELEVENLABS_VOICE_DEFAULT)
  // is the common "I set the key but still hear the browser voice" case.
  const voiceId = voiceIdFor(agentId);
  if (!voiceId) {
    return new NextResponse(null, {
      status: 204,
      headers: { "x-voice-reason": "no voice id" },
    });
  }

  const previous_text = prepareForSpeech(body?.previousText ?? "") || undefined;
  const next_text = prepareForSpeech(body?.nextText ?? "") || undefined;

  let res: Response;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128&optimize_streaming_latency=2`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: ttsModel(),
          previous_text,
          next_text,
          voice_settings: voiceSettingsFor(agentId),
        }),
      },
    );
  } catch (e) {
    console.error("[tts] elevenlabs request failed:", e);
    return new NextResponse(null, {
      status: 502,
      headers: { "x-voice-reason": "http fetch" },
    });
  }
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    console.error(`[tts] elevenlabs ${res.status}: ${errText.slice(0, 200)}`);
    return new NextResponse(null, {
      status: 502,
      headers: { "x-voice-reason": `http ${res.status}` },
    });
  }

  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
      "x-voice-reason": "elevenlabs",
    },
  });
}
