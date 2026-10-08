"use client";

import { useState, useTransition } from "react";
import { markMessageSent } from "@/lib/workforce/actions";

// A message the owner sends himself by hand: status `approved_manual`, channel
// whatsapp, instagram or linkedin (LinkedIn has no permitted send API, so it is
// always manual). We give him a one-tap link that opens the app/profile with the
// message prefilled where possible, a copy button, and a "mark sent" that tells
// the agent `sent <company>` and flips the row to `sent`. Bridge-owned message
// row; the dashboard only patches status.

const CONNECTION_NOTE_LIMIT = 300;

// digits only, from a phone number or a wa.me/... link.
function waNumber(contact: string): string {
  const m = contact.match(/wa\.me\/(\+?[\d]+)/i);
  return (m ? m[1] : contact).replace(/\D/g, "");
}

// an instagram handle if the contact looks like one (not a phone / url with a
// different host). returns "" when it doesn't.
function igHandle(contact: string): string {
  const c = contact.trim();
  const urlMatch = c.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (urlMatch) return urlMatch[1];
  const handle = c.replace(/^@/, "");
  return /^[A-Za-z0-9._]{2,30}$/.test(handle) ? handle : "";
}

// a profile URL from the contact (the draft's `to:`). Accepts a full URL or a
// bare linkedin.com/in/... path; returns "" when it isn't a usable link.
function profileUrl(contact: string): string {
  const c = contact.trim();
  if (/^https?:\/\//i.test(c)) return c;
  if (/linkedin\.com\//i.test(c)) return `https://${c.replace(/^\/+/, "")}`;
  return "";
}

export function ManualSend({
  messageId,
  agentId,
  company,
  channel,
  contact,
  body,
  why = "",
}: {
  messageId: string;
  agentId: string;
  company: string;
  channel: string;
  contact: string;
  body: string;
  // the draft's "why" line; a connection note is flagged from here or the body.
  why?: string;
}) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const ch = channel.toLowerCase();
  const isWhatsapp = ch === "whatsapp";
  const isInstagram = ch === "instagram";
  const isLinkedin = ch === "linkedin";
  if (!isWhatsapp && !isInstagram && !isLinkedin) return null;

  const number = isWhatsapp ? waNumber(contact) : "";
  const waHref = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(body)}`
    : "";
  const handle = isInstagram ? igHandle(contact) : "";
  const igHref = handle ? `https://instagram.com/${handle}` : "";
  const liHref = isLinkedin ? profileUrl(contact) : "";

  // connection notes are capped at 300 chars; show a counter so the owner can
  // trim before copying. Flagged when the why line or the body says so.
  const isConnectionNote = /connection note/i.test(`${why}\n${body}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const markSent = () =>
    start(async () => {
      await markMessageSent(messageId, agentId, company);
      setSent(true);
    });

  return (
    <div className="wf-manualsend">
      {isConnectionNote && (
        <div className="wf-ls-counter">
          <span
            className={body.length > CONNECTION_NOTE_LIMIT ? "over" : "amber"}
          >
            {body.length}
          </span>{" "}
          / {CONNECTION_NOTE_LIMIT} · connection note
        </div>
      )}
      {isWhatsapp && waHref && (
        <a
          className="wf-hn-btn amber sm"
          href={waHref}
          target="_blank"
          rel="noreferrer noopener"
        >
          open in whatsapp
        </a>
      )}
      {(isInstagram || isLinkedin) && (
        <button type="button" className="wf-hn-btn ghost sm" onClick={copy}>
          {copied ? "copied" : "copy message"}
        </button>
      )}
      {isInstagram && igHref && (
        <a
          className="wf-hn-btn amber sm"
          href={igHref}
          target="_blank"
          rel="noreferrer noopener"
        >
          open instagram
        </a>
      )}
      {isLinkedin && liHref && (
        <a
          className="wf-hn-btn amber sm"
          href={liHref}
          target="_blank"
          rel="noreferrer noopener"
        >
          open profile
        </a>
      )}
      <button
        type="button"
        className="wf-hn-btn ghost sm"
        disabled={pending || sent}
        onClick={markSent}
      >
        {sent ? "marked sent" : pending ? "…" : "mark sent"}
      </button>
    </div>
  );
}
