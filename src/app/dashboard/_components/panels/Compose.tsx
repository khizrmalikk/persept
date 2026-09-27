"use client";

import { useEffect, useState, useTransition } from "react";
import { sendOutboundAsOwner } from "@/lib/workforce/actions";
import type { ReplySeed } from "./Conversations";

export type CampaignOption = { slug: string; name: string };

// "send as me" — the owner writes a message and the bridge sends it as-is. Email
// goes out automatically; other channels are recorded and sent by hand. Submitting
// inserts one `actions` row (kind "send") via sendOutboundAsOwner. `seed` pre-fills
// the box when the owner clicks "reply" on an inbound message.
export function Compose({
  campaigns,
  seed,
  onConsumed,
}: {
  campaigns: CampaignOption[];
  seed?: ReplySeed | null;
  onConsumed?: () => void;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("email");
  const [campaign, setCampaign] = useState("");
  const [thread, setThread] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: apply a new reply seed only when it arrives
  useEffect(() => {
    if (!seed) return;
    setTo(seed.to);
    setSubject(seed.subject);
    setChannel(seed.channel || "email");
    setThread(seed.thread);
    setCampaign(seed.campaign);
    onConsumed?.();
  }, [seed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return;
    const fd = new FormData();
    fd.set("to", to);
    fd.set("subject", subject);
    fd.set("body", body);
    fd.set("channel", channel);
    fd.set("campaign", campaign);
    fd.set("thread", thread);
    start(async () => {
      await sendOutboundAsOwner(fd);
      setSubject("");
      setBody("");
      setThread("");
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  };

  return (
    <section className="wf-compose" aria-label="send as me">
      <h3 className="wf-out-h">send as me</h3>
      <form className="wf-compose-form" onSubmit={submit}>
        <label className="wf-field">
          <span>to</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="name <address>"
          />
        </label>
        <div className="wf-field-row">
          <label className="wf-field">
            <span>channel</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="email">email</option>
              <option value="instagram">instagram</option>
              <option value="whatsapp">whatsapp</option>
              <option value="linkedin">linkedin</option>
            </select>
          </label>
          <label className="wf-field">
            <span>campaign</span>
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option value="">none</option>
              {campaigns.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="wf-field">
          <span>subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="subject"
          />
        </label>
        <label className="wf-field">
          <span>message</span>
          <textarea
            value={body}
            rows={5}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write the message…"
          />
        </label>
        {channel !== "email" && (
          <p className="wf-compose-note muted">
            recorded as sent by hand — {channel} isn't sent automatically.
          </p>
        )}
        <div className="wf-compose-actions">
          {done && <span className="wf-compose-ok">sent</span>}
          <button
            type="submit"
            className="act"
            disabled={pending || !to.trim() || !body.trim()}
          >
            {pending ? "sending…" : "send"}
          </button>
        </div>
      </form>
    </section>
  );
}
