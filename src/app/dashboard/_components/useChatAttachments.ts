"use client";

import { useRef, useState } from "react";
import { uploadChatFile } from "@/lib/workforce/actions";

// Shared chat-attachment state for the drawer + mobile composers. Each file is
// uploaded to the private chat bucket (uploadChatFile) and kept as a signed URL;
// `compose` folds the text + attachments into the single message body the bridge
// relays (an image as a markdown image, a file as a markdown link) — the same
// string we show optimistically, so it reconciles cleanly with the server echo.
export type ChatAttachment = {
  id: string;
  name: string;
  url: string;
  isImage: boolean;
};

export function useChatAttachments(onError?: (msg: string) => void) {
  const [items, setItems] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(0);
  const nid = useRef(0);

  const addFiles = async (agentId: string, files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("agent", agentId);
        fd.append("file", file);
        const res = await uploadChatFile(fd);
        if ("url" in res) {
          setItems((x) => [
            ...x,
            {
              id: `a${nid.current++}`,
              name: res.name,
              url: res.url,
              isImage: res.isImage,
            },
          ]);
        } else {
          onError?.(res.error);
        }
      } catch {
        onError?.("upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const remove = (id: string) => setItems((x) => x.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  // text + attachments → the one message body (markdown image / link per item).
  const compose = (text: string): string =>
    [
      text.trim(),
      ...items.map((a) =>
        a.isImage ? `![${a.name}](${a.url})` : `[${a.name}](${a.url})`,
      ),
    ]
      .filter(Boolean)
      .join("\n\n");

  return { items, addFiles, remove, clear, uploading, compose };
}
