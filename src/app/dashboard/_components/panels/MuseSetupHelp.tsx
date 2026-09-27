"use client";

import { useRef } from "react";

// A small "setup" button on Muse's page that opens a modal explaining the
// integrations Muse needs before drafts can go out end-to-end: LinkedIn
// auto-publish, Instagram/Meta (manual today), and the image storage bucket.
// Reference-only — nothing here writes; it just tells the owner what to wire on
// the VPS bridge / Supabase. Uses the native <dialog> so Esc + backdrop close
// for free and it's keyboard-accessible.

export function MuseSetupHelp() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="wf-chip sm ghost wf-help-btn"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
      >
        setup
      </button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop-click is a mouse-only convenience; the native <dialog> already closes on Esc and there are two keyboard-accessible close buttons (✕ and "got it"). */}
      <dialog
        ref={ref}
        className="wf-help-modal"
        onClick={(e) => {
          // click on the backdrop (the dialog element itself) closes it
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="wf-help-inner">
          <div className="wf-help-head">
            <h3>connect muse</h3>
            <button
              type="button"
              className="wf-help-x"
              onClick={() => ref.current?.close()}
              aria-label="close"
            >
              ✕
            </button>
          </div>
          <p className="wf-help-lede">
            muse drafts and prepares everything now. these are the accounts to
            wire up so approving a draft actually posts. each token lives on the
            vps bridge, never in this dashboard.
          </p>

          <section className="wf-help-sec">
            <h4>
              <span className="wf-chip sm is-linkedin">linkedin</span>
              auto-publish
            </h4>
            <ol>
              <li>
                create an app at{" "}
                <a
                  href="https://www.linkedin.com/developers/apps"
                  target="_blank"
                  rel="noreferrer"
                >
                  linkedin developers
                </a>{" "}
                and link it to the company page.
              </li>
              <li>
                add the products <strong>share on linkedin</strong> and{" "}
                <strong>sign in with linkedin</strong> (scopes{" "}
                <code>w_member_social</code>, <code>openid</code>,{" "}
                <code>profile</code>).
              </li>
              <li>
                authorise the posting account, then put the access token on the
                bridge as <code>LINKEDIN_ACCESS_TOKEN</code> (with the author
                urn).
              </li>
              <li>
                tokens expire (~60 days) — refresh before they lapse or publish
                will start failing.
              </li>
            </ol>
            <p className="wf-help-note">
              once set, approving a <code>linkedin-post</code> draft publishes
              through the bridge and the card moves to “published” with a live
              link.
            </p>
          </section>

          <section className="wf-help-sec">
            <h4>
              <span className="wf-chip sm is-instagram">instagram</span>
              meta (manual today)
            </h4>
            <p>
              instagram drafts are <strong>approve · post by hand</strong> for
              now: muse prepares the caption and image, you post it, then hit
              “posted”. no api needed to start.
            </p>
            <p className="wf-help-note">to automate later you’ll need:</p>
            <ol>
              <li>
                a{" "}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                >
                  meta app
                </a>{" "}
                with the <strong>instagram graph api</strong>.
              </li>
              <li>
                an instagram <strong>business or creator</strong> account linked
                to a facebook page.
              </li>
              <li>
                permissions <code>instagram_content_publish</code> +{" "}
                <code>pages_read_engagement</code> (needs meta app review).
              </li>
              <li>
                a long-lived page access token on the bridge as{" "}
                <code>META_PAGE_TOKEN</code>.
              </li>
            </ol>
          </section>

          <section className="wf-help-sec">
            <h4>
              <span className="wf-chip sm">storage</span>
              image bucket
            </h4>
            <p>
              the “upload image” control needs a public supabase storage bucket
              named <code>campaign-assets</code> (uploads land under{" "}
              <code>posts/&lt;slug&gt;/</code>). create it once from the
              supabase dashboard → storage, set to public. without it, image
              uploads fail.
            </p>
          </section>

          <div className="wf-help-foot">
            <button
              type="button"
              className="act sm"
              onClick={() => ref.current?.close()}
            >
              got it
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
