"use client";

import { useState, useTransition } from "react";
import { markMessageSent } from "@/lib/workforce/actions";

// A message the owner sends himself from his phone: status `approved_manual`,
// channel whatsapp or instagram. We give him a one-tap link that opens the app
// with the message prefilled, and a "mark sent" that tells the agent and flips
// the row to `sent`. Bridge-owned message row; the dashboard only patches status.

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

export function ManualSend({
  messageId,
  agentId,
  company,
  channel,
  contact,
  body,
}: {
  messageId: string;
  agentId: string;
  company: string;
  channel: string;
  contact: string;
  body: string;
}) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const ch = channel.toLowerCase();
  const isWhatsapp = ch === "whatsapp";
  const isInstagram = ch === "instagram";
  if (!isWhatsapp && !isInstagram) return null;

  const number = isWhatsapp ? waNumber(contact) : "";
  const waHref = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(body)}`
    : "";
  const handle = isInstagram ? igHandle(contact) : "";
  const igHref = handle ? `https://instagram.com/${handle}` : "";

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
      {isInstagram && (
        <>
          <button type="button" className="wf-hn-btn ghost sm" onClick={copy}>
            {copied ? "copied" : "copy message"}
          </button>
          {igHref && (
            <a
              className="wf-hn-btn amber sm"
              href={igHref}
              target="_blank"
              rel="noreferrer noopener"
            >
              open instagram
            </a>
          )}
        </>
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
