"use client";

import { useRef, useState, useTransition } from "react";
import {
  saveCampaign,
  sendAgentCommand,
  uploadCampaignAsset,
} from "@/lib/workforce/actions";
import type {
  AssetType,
  Campaign,
  CampaignAsset,
} from "@/lib/workforce/outreach";

// Client editor for one campaign. The main fields submit through saveCampaign (a
// server action that writes the `campaigns` row and redirects back to the saved
// campaign). Assets are held in local state and serialised into a hidden field so
// they save with the rest. Uploads stream to the `campaign-assets` bucket via
// uploadCampaignAsset and come back as public URLs. "add prospects" sends Hunter
// one message per line, tagged with the campaign slug.

// Local copy of the bridge's slug rule (can't import the server-only outreach
// module into a client bundle). Keep in lockstep with slugify() there.
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CHANNELS = ["email", "instagram", "whatsapp", "linkedin"] as const;
const ASSET_TYPES: AssetType[] = ["link", "video", "image", "file"];

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function isMp4(url: string): boolean {
  return /\.mp4($|\?)/i.test(url);
}

function AssetPreview({ asset }: { asset: CampaignAsset }) {
  const { url, type } = asset;
  if (type === "video") {
    const yt = youtubeId(url);
    if (yt)
      return (
        <iframe
          className="wf-asset-embed"
          src={`https://www.youtube.com/embed/${yt}`}
          title={asset.title || "video"}
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    const vm = vimeoId(url);
    if (vm)
      return (
        <iframe
          className="wf-asset-embed"
          src={`https://player.vimeo.com/video/${vm}`}
          title={asset.title || "video"}
          allowFullScreen
        />
      );
    if (isMp4(url))
      return (
        // biome-ignore lint/a11y/useMediaCaption: owner-supplied outreach asset, no captions available
        <video
          className="wf-asset-embed"
          src={url}
          controls
          preload="metadata"
        />
      );
  }
  if (type === "image")
    // biome-ignore lint/performance/noImgElement: arbitrary external asset URLs, not build-time known
    return <img className="wf-asset-thumb" src={url} alt={asset.title || ""} />;
  return (
    <a className="wf-asset-link" href={url} target="_blank" rel="noreferrer">
      {url}
    </a>
  );
}

export function CampaignEditor({
  campaign,
  isNew,
}: {
  campaign: Campaign;
  isNew: boolean;
}) {
  const [assets, setAssets] = useState<CampaignAsset[]>(campaign.assets);
  const [name, setName] = useState(campaign.name);
  const [uploading, start] = useTransition();
  const [uploadErr, setUploadErr] = useState("");

  // add-by-URL draft
  const [aUrl, setAUrl] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aType, setAType] = useState<AssetType>("link");
  const [aUse, setAUse] = useState("");

  // add-prospects
  const [prospects, setProspects] = useState("");
  const [prospectPending, startProspects] = useTransition();
  const [prospectDone, setProspectDone] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const campaignSlug = slug(name || campaign.name);

  const move = (i: number, dir: -1 | 1) => {
    setAssets((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const remove = (i: number) =>
    setAssets((prev) => prev.filter((_, k) => k !== i));

  const addUrl = () => {
    const url = aUrl.trim();
    if (!url) return;
    setAssets((prev) => [
      ...prev,
      { url, title: aTitle.trim(), type: aType, use: aUse.trim() },
    ]);
    setAUrl("");
    setATitle("");
    setAUse("");
    setAType("link");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    const fd = new FormData();
    fd.set("campaignId", campaign.id || "new");
    fd.set("file", file);
    start(async () => {
      const res = await uploadCampaignAsset(fd);
      if ("error" in res) {
        setUploadErr(res.error);
      } else {
        const type: AssetType = file.type.startsWith("image/")
          ? "image"
          : file.type === "video/mp4"
            ? "video"
            : "file";
        setAssets((prev) => [
          ...prev,
          { url: res.url, title: file.name, type, use: "" },
        ]);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const addProspects = () => {
    const lines = prospects
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    startProspects(async () => {
      for (const line of lines) {
        await sendAgentCommand(
          "hunter",
          `add prospect: ${line} (campaign: ${campaignSlug})`,
        );
      }
      setProspectDone(lines.length);
      setProspects("");
      setTimeout(() => setProspectDone(0), 2500);
    });
  };

  const rules = campaign.rules;

  return (
    <div className="wf-ce">
      <form action={saveCampaign} className="wf-ce-form">
        <input type="hidden" name="id" value={campaign.id} />
        <input type="hidden" name="assets" value={JSON.stringify(assets)} />

        <div className="wf-ce-grid">
          <label className="wf-field wf-ce-span">
            <span>name</span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. holiday-home spring"
              required
            />
          </label>
          <label className="wf-field">
            <span>status</span>
            <select name="status" defaultValue={campaign.status}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="wf-field wf-ce-span">
            <span>goal</span>
            <input
              type="text"
              name="goal"
              defaultValue={campaign.goal}
              placeholder="what does a win look like?"
            />
          </label>
          <label className="wf-field">
            <span>audience</span>
            <input
              type="text"
              name="audience"
              defaultValue={campaign.audience}
              placeholder="who are we reaching?"
            />
          </label>
          <label className="wf-field">
            <span>offer</span>
            <input
              type="text"
              name="offer"
              defaultValue={campaign.offer}
              placeholder="what are we offering?"
            />
          </label>
          <label className="wf-field wf-ce-span">
            <span>description / instructions</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={campaign.description}
              placeholder="how hunter should approach this campaign…"
            />
          </label>
        </div>

        <fieldset className="wf-ce-rules">
          <legend>rules</legend>
          <div className="wf-ce-channels">
            <span className="wf-ce-rules-label">channels</span>
            {CHANNELS.map((ch) => (
              <label key={ch} className="wf-ce-check">
                <input
                  type="checkbox"
                  name="channels"
                  value={ch}
                  defaultChecked={rules.channels.includes(ch)}
                />
                {ch}
              </label>
            ))}
          </div>
          <div className="wf-ce-rule-row">
            <label className="wf-field wf-field-sm">
              <span>daily cap</span>
              <input
                type="number"
                name="daily_cap"
                min={1}
                defaultValue={rules.daily_cap}
              />
            </label>
            <label className="wf-field wf-field-sm">
              <span>follow-up day 1</span>
              <input
                type="number"
                name="follow_up_1"
                min={1}
                defaultValue={rules.follow_up_days[0] ?? 3}
              />
            </label>
            <label className="wf-field wf-field-sm">
              <span>follow-up day 2</span>
              <input
                type="number"
                name="follow_up_2"
                min={1}
                defaultValue={rules.follow_up_days[1] ?? 7}
              />
            </label>
          </div>
        </fieldset>

        <div className="wf-ce-save">
          <button type="submit" className="act">
            {isNew ? "create campaign" : "save changes"}
          </button>
          <span className="wf-ce-save-note muted">
            hunter sees changes within a minute
          </span>
        </div>
      </form>

      {/* assets — kept outside the save form's flow but sharing its state via the
          hidden `assets` field above. */}
      <section className="wf-ce-assets" aria-label="assets">
        <h3 className="wf-out-h">assets</h3>
        {assets.length > 0 && (
          <ul className="wf-asset-list">
            {assets.map((a, i) => (
              <li key={`${a.url}-${i}`} className="wf-asset">
                <AssetPreview asset={a} />
                <div className="wf-asset-body">
                  <div className="wf-asset-head">
                    <span className="wf-chip sm">{a.type}</span>
                    <span className="wf-asset-title">
                      {a.title || "untitled"}
                    </span>
                  </div>
                  {a.use && <p className="wf-asset-use">{a.use}</p>}
                </div>
                <div className="wf-asset-actions">
                  <button
                    type="button"
                    className="wf-icon-btn"
                    aria-label="move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="wf-icon-btn"
                    aria-label="move down"
                    disabled={i === assets.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="wf-icon-btn danger"
                    aria-label="remove"
                    onClick={() => remove(i)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="wf-asset-add">
          <div className="wf-asset-add-row">
            <input
              type="text"
              value={aUrl}
              onChange={(e) => setAUrl(e.target.value)}
              placeholder="asset url (youtube, vimeo, link…)"
            />
            <select
              value={aType}
              onChange={(e) => setAType(e.target.value as AssetType)}
              aria-label="asset type"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="wf-asset-add-row">
            <input
              type="text"
              value={aTitle}
              onChange={(e) => setATitle(e.target.value)}
              placeholder="title"
            />
            <input
              type="text"
              value={aUse}
              onChange={(e) => setAUse(e.target.value)}
              placeholder="when to use it"
            />
            <button type="button" className="act secondary" onClick={addUrl}>
              add
            </button>
          </div>
          <div className="wf-asset-upload">
            <label className="act secondary wf-upload-btn">
              {uploading ? "uploading…" : "upload file"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,video/mp4,.docx"
                hidden
                disabled={uploading}
                onChange={onFile}
              />
            </label>
            <span className="muted wf-upload-note">
              images, pdf, mp4 or docx · max 25mb
            </span>
            {uploadErr && <span className="err">{uploadErr}</span>}
          </div>
        </div>
      </section>

      {/* add prospects — one per line, tagged with this campaign's slug. */}
      <section className="wf-ce-prospects" aria-label="add prospects">
        <h3 className="wf-out-h">add prospects</h3>
        <p className="muted wf-ce-prospects-help">
          one per line: company | contact | channel | address | angle
        </p>
        <textarea
          rows={4}
          value={prospects}
          onChange={(e) => setProspects(e.target.value)}
          placeholder="acme co | jo bloggs | email | jo@acme.co | saw their new site"
        />
        <div className="wf-ce-prospects-actions">
          {prospectDone > 0 && (
            <span className="wf-compose-ok">sent {prospectDone} to hunter</span>
          )}
          <button
            type="button"
            className="act secondary"
            disabled={prospectPending || !prospects.trim()}
            onClick={addProspects}
          >
            {prospectPending ? "adding…" : "add to campaign"}
          </button>
        </div>
      </section>
    </div>
  );
}
