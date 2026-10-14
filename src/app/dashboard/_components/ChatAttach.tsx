"use client";

import { useRef } from "react";
import type { useChatAttachments } from "./useChatAttachments";

// Shared composer attachment UI for the drawer + mobile chat: the paperclip
// button (with hidden file input) and the row of pending attachment chips
// (image thumbnail or filename) with a remove control. Driven by the
// useChatAttachments hook so both composers stay in sync with one implementation.
type Att = ReturnType<typeof useChatAttachments>;

const ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.json,.rtf,.zip";

export function AttachButton({ agentId, att }: { agentId: string; att: Att }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) void att.addFiles(agentId, files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label="attach a file or image"
        title="attach a file or image"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "transparent",
          color: "var(--soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flex: "none",
          border: "none",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21.4 11.1 12.3 20.2a5 5 0 0 1-7.1-7.1l9-9a3.3 3.3 0 0 1 4.7 4.7l-9.1 9a1.7 1.7 0 0 1-2.3-2.3l8.4-8.5" />
        </svg>
      </button>
    </>
  );
}

export function AttachChips({ att }: { att: Att }) {
  if (att.items.length === 0 && att.uploading === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: "0 2px 8px",
      }}
    >
      {att.items.map((a) => (
        <div
          key={a.id}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: a.isImage ? 0 : "6px 9px",
            paddingRight: a.isImage ? 0 : 24,
            borderRadius: 10,
            background: "var(--surf)",
            border: "1px solid var(--line)",
            maxWidth: 180,
            overflow: "hidden",
          }}
        >
          {a.isImage ? (
            // biome-ignore lint/performance/noImgElement: short-lived signed url preview
            <img
              src={a.url}
              alt={a.name}
              style={{
                width: 52,
                height: 52,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flex: "none", opacity: 0.7 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {a.name}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={() => att.remove(a.id)}
            aria-label={`remove ${a.name}`}
            style={{
              position: "absolute",
              top: a.isImage ? 3 : "50%",
              right: 3,
              transform: a.isImage ? "none" : "translateY(-50%)",
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
              fontSize: 11,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      {att.uploading > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 10,
            background: "var(--surf)",
            border: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--soft)",
          }}
        >
          <svg
            className="os-spin"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.25"
            />
            <path
              d="M12 3a9 9 0 0 1 9 9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          uploading…
        </div>
      )}
    </div>
  );
}
