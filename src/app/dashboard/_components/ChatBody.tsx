"use client";

import type { ReactNode } from "react";

// Renders a chat message body: plain text, plus any attachments the composer
// inlined as markdown — `![name](url)` images become thumbnails, `[name](url)`
// files become a paperclip chip link. Used for both sent (mine) and received
// bubbles so an attachment looks the same wherever it shows. Opening a link is
// the only action; the url is a short-lived signed url from the chat bucket.
const ATT = /(!)?\[([^\]]*)\]\(([^)\s]+)\)/g;

export function ChatBody({ text, mine }: { text: string; mine: boolean }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const pushText = (s: string) => {
    const t = s.replace(/\n{3,}/g, "\n\n").trim();
    if (t)
      nodes.push(
        <span key={`t${key++}`} style={{ whiteSpace: "pre-wrap" }}>
          {t}
        </span>,
      );
  };

  // reset lastIndex on a fresh regex each render
  const re = new RegExp(ATT);
  let m: RegExpExecArray | null = re.exec(text);
  while (m !== null) {
    if (m.index > last) pushText(text.slice(last, m.index));
    const isImg = m[1] === "!";
    const name = m[2] || (isImg ? "image" : "file");
    const url = m[3];
    if (isImg) {
      nodes.push(
        <a
          key={`a${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", lineHeight: 0 }}
        >
          {/* biome-ignore lint/performance/noImgElement: short-lived signed url, not a static asset */}
          <img
            src={url}
            alt={name}
            style={{
              maxWidth: 220,
              maxHeight: 220,
              borderRadius: 10,
              display: "block",
            }}
          />
        </a>,
      );
    } else {
      nodes.push(
        <a
          key={`a${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 11px",
            borderRadius: 10,
            maxWidth: "100%",
            background: mine ? "rgba(255,255,255,0.14)" : "var(--surf)",
            border: "1px solid var(--line)",
            color: "inherit",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flex: "none", opacity: 0.8 }}
          >
            <path d="M21.4 11.1 12.3 20.2a5 5 0 0 1-7.1-7.1l9-9a3.3 3.3 0 0 1 4.7 4.7l-9.1 9a1.7 1.7 0 0 1-2.3-2.3l8.4-8.5" />
          </svg>
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </span>
        </a>,
      );
    }
    last = m.index + m[0].length;
    m = re.exec(text);
  }
  if (last < text.length) pushText(text.slice(last));

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}
    >
      {nodes}
    </div>
  );
}
