"use client";

import { useRef, useState, useTransition } from "react";
import {
  approveFromForm,
  rejectFromForm,
  sendApprovedEdit,
  uploadPostImage,
} from "@/lib/workforce/actions";
import type { PostChannel } from "@/lib/workforce/posts";

// A pending Muse draft, flattened server-side from the approval + its matching
// posts/*.md file. `image` is the approval's own image: header; `imageBrief` is
// the file front matter's image_brief (shown when there's no image yet).
export type MuseDraft = {
  approvalId: number;
  agentId: string;
  channel: PostChannel;
  body: string;
  image: string | null;
  comment: string | null;
  slug: string | null;
  imageBrief: string | null;
  action: string | null;
  ago: string;
};

// Upload an image for a draft with a brief but no image. On success the action
// tells Muse (`image for <slug>: <url>`), which re-raises the approval with the
// image, so the card refreshes on the next poll.
function NeedsImage({ slug, brief }: { slug: string | null; brief: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slug) return;
    setErr("");
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("file", file);
    start(async () => {
      const res = await uploadPostImage(fd);
      if ("error" in res) setErr(res.error);
      else setDone(true);
    });
  };

  return (
    <div className="wf-muse-needsimg">
      <div className="wf-muse-brief">
        <span className="wf-muse-brief-tag">needs an image</span>
        <span className="wf-muse-brief-text">{brief}</span>
      </div>
      {done ? (
        <p className="wf-muse-brief-done">uploaded — muse is adding it…</p>
      ) : (
        <>
          <button
            type="button"
            className="act sm secondary"
            disabled={pending || !slug}
            onClick={() => fileRef.current?.click()}
          >
            {pending ? "uploading…" : "upload image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
          />
        </>
      )}
      {err && <p className="wf-muse-brief-err">{err}</p>}
    </div>
  );
}

function DraftCard({ d }: { d: MuseDraft }) {
  const isInstagram = d.channel === "instagram";
  const publishLabel = isInstagram ? "approve (I'll post by hand)" : "publish";
  // draft text for the edit box: keep the outbound header so Muse/bridge still
  // parse channel + image on re-send.
  const editText = [
    `channel: ${d.channel}-post`,
    d.image ? `image: ${d.image}` : "",
    d.comment ? `comment: ${d.comment}` : "",
    "",
    d.body,
  ]
    .filter((l, i) => l !== "" || i === 3)
    .join("\n");

  return (
    <article className="wf-muse-draft">
      <div className="wf-muse-draft-head">
        <span className={`wf-chip sm is-${d.channel}`}>{d.channel}</span>
        <span className="wf-muse-draft-when">{d.ago}</span>
      </div>
      <p className="wf-muse-draft-text">{d.body}</p>
      {d.comment && (
        <p className="wf-muse-draft-comment">first comment: {d.comment}</p>
      )}
      {d.image ? (
        // biome-ignore lint/performance/noImgElement: user-supplied campaign-assets URL, not a build-time asset
        <img className="wf-muse-draft-img" src={d.image} alt="" />
      ) : d.imageBrief ? (
        <NeedsImage slug={d.slug} brief={d.imageBrief} />
      ) : null}

      <div className="wf-muse-draft-actions">
        <form action={approveFromForm}>
          <input type="hidden" name="id" value={d.approvalId} />
          <input type="hidden" name="agent" value={d.agentId} />
          <button className="act sm" type="submit">
            {publishLabel}
          </button>
        </form>
        <form action={rejectFromForm}>
          <input type="hidden" name="id" value={d.approvalId} />
          <input type="hidden" name="agent" value={d.agentId} />
          <button className="act sm danger" type="submit">
            reject
          </button>
        </form>
      </div>

      <details className="wf-muse-draft-edit">
        <summary>edit and publish</summary>
        <form action={sendApprovedEdit}>
          <input type="hidden" name="id" value={d.approvalId} />
          <input type="hidden" name="agent" value={d.agentId} />
          <textarea
            name="text"
            rows={8}
            defaultValue={editText}
            className="wf-outbound-editbox"
          />
          <button className="act sm" type="submit">
            {isInstagram ? "save edited (I'll post)" : "publish edited"}
          </button>
        </form>
      </details>
    </article>
  );
}

export function MuseDraftsPanel({ drafts }: { drafts: MuseDraft[] }) {
  if (drafts.length === 0) {
    return (
      <p className="wf-of-mini-empty">
        no drafts waiting; ask muse to post about a topic in the chat.
      </p>
    );
  }
  return (
    <div className="wf-muse-drafts">
      {drafts.map((d) => (
        <DraftCard key={d.approvalId} d={d} />
      ))}
    </div>
  );
}
