"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  saveCampaign,
  sendAgentCommand,
  uploadCampaignAsset,
} from "@/lib/workforce/actions";
import type { CampaignAsset } from "@/lib/workforce/outreach";

const CHANNELS = ["email", "instagram", "whatsapp", "linkedin"];

export type CampaignForm = {
  id: string;
  name: string;
  status: string;
  goal: string;
  audience: string;
  offer: string;
  description: string;
  channels: string[];
  daily_cap: number;
  follow_up_days: number[];
  assets: CampaignAsset[];
  slug: string;
};

export function HunterCampaignForm({ initial }: { initial: CampaignForm }) {
  const isNew = !initial.id;
  const [channels, setChannels] = useState<string[]>(initial.channels);
  const [assets, setAssets] = useState<CampaignAsset[]>(initial.assets);
  const [assetUrl, setAssetUrl] = useState("");
  const [addList, setAddList] = useState("");
  const [uploading, startUpload] = useTransition();
  const [adding, startAdd] = useTransition();
  const [added, setAdded] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (c: string) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("campaignId", initial.id || "new");
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadCampaignAsset(fd);
      if (!("error" in res)) {
        const type: CampaignAsset["type"] = file.type.startsWith("image/")
          ? "image"
          : file.type === "video/mp4"
            ? "video"
            : "file";
        setAssets((prev) => [
          ...prev,
          { url: res.url, title: file.name, type, use: "" },
        ]);
      }
    });
    e.target.value = "";
  };

  const addUrl = () => {
    const url = assetUrl.trim();
    if (!url) return;
    setAssets((prev) => [...prev, { url, title: url, type: "link", use: "" }]);
    setAssetUrl("");
  };

  const sendProspects = () => {
    const text = addList.trim();
    if (!text) return;
    const list = text.split("\n").filter(Boolean);
    startAdd(async () => {
      await sendAgentCommand(
        "hunter",
        `add prospects to ${initial.slug || initial.name}: ${list.join("; ")}`,
      );
      setAdded(list.length);
      setAddList("");
    });
  };

  const backHref = isNew ? "../campaigns" : `../${initial.id}`;

  return (
    <div className="wf-hn-editor">
      <form action={saveCampaign} className="wf-hn-editor-main">
        <input type="hidden" name="id" value={initial.id} />
        {channels.map((c) => (
          <input key={c} type="hidden" name="channels" value={c} />
        ))}
        <input type="hidden" name="assets" value={JSON.stringify(assets)} />
        <div>
          <Link href={backHref} className="wf-hn-back">
            ← {isNew ? "campaigns" : initial.name}
          </Link>
          <h2 className="wf-hn-cv-title" style={{ marginTop: 8, fontSize: 24 }}>
            {isNew ? "new campaign" : `edit · ${initial.name}`}
          </h2>
        </div>

        <div className="wf-hn-grid2" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <label className="wf-hn-field">
            name
            <input
              name="name"
              defaultValue={initial.name}
              placeholder="e.g. holiday-home spring"
            />
          </label>
          <label className="wf-hn-field">
            status
            <select name="status" defaultValue={initial.status}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </label>
        </div>

        <label className="wf-hn-field">
          goal
          <input
            name="goal"
            defaultValue={initial.goal}
            placeholder="what does a win look like?"
          />
        </label>
        <div className="wf-hn-grid2">
          <label className="wf-hn-field">
            audience
            <input
              name="audience"
              defaultValue={initial.audience}
              placeholder="who are we reaching?"
            />
          </label>
          <label className="wf-hn-field">
            offer
            <input
              name="offer"
              defaultValue={initial.offer}
              placeholder="what are we offering?"
            />
          </label>
        </div>
        <label className="wf-hn-field">
          description / instructions
          <textarea
            name="description"
            defaultValue={initial.description}
            placeholder="how hunter should approach this campaign…"
          />
        </label>

        <div className="wf-hn-rules">
          <div className="wf-hn-cv-k">rules</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: 12, color: "var(--ink-faint)", width: 70 }}
            >
              channels
            </span>
            {CHANNELS.map((c) => {
              const on = channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  className={`wf-hn-toggle${on ? " on" : ""}`}
                  onClick={() => toggle(c)}
                >
                  {on ? "✓ " : ""}
                  {c}
                </button>
              );
            })}
          </div>
          <div className="wf-hn-grid3">
            <label className="wf-hn-field">
              daily cap
              <input
                type="number"
                name="daily_cap"
                defaultValue={initial.daily_cap}
              />
            </label>
            <label className="wf-hn-field">
              follow-up day 1
              <input
                type="number"
                name="follow_up_1"
                defaultValue={initial.follow_up_days[0] ?? 3}
              />
            </label>
            <label className="wf-hn-field">
              follow-up day 2
              <input
                type="number"
                name="follow_up_2"
                defaultValue={initial.follow_up_days[1] ?? 7}
              />
            </label>
          </div>
        </div>

        <div className="wf-hn-saverow">
          <button type="submit" className="wf-hn-btn amber lg">
            {isNew ? "create campaign" : "save changes"}
          </button>
          <span className="wf-hn-savehint">
            hunter sees changes within a minute
          </span>
        </div>
      </form>

      <div className="wf-hn-editor-side">
        <div className="wf-hn-panel">
          <div className="wf-hn-panel-title">assets</div>
          {assets.map((a, i) => (
            <div key={`${a.url}-${i}`} className="wf-hn-asset">
              <span style={{ color: "var(--ink-faint)" }}>▤</span>
              <span className="name">{a.title || a.url}</span>
              <button
                type="button"
                onClick={() => setAssets((p) => p.filter((_, j) => j !== i))}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="wf-hn-search"
              style={{ flex: 1 }}
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="add by url"
            />
            <button type="button" className="wf-hn-btn ghost" onClick={addUrl}>
              add
            </button>
          </div>
          <button
            type="button"
            className="wf-hn-upload"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "uploading…" : "upload a file"}
          </button>
          <input ref={fileRef} type="file" hidden onChange={onFile} />
        </div>

        <div className="wf-hn-panel">
          <div className="wf-hn-panel-title">add prospects</div>
          <div
            style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5 }}
          >
            paste company names, websites or a list. hunter researches each one
            and adds it to this campaign.
          </div>
          <textarea
            className="wf-hn-textarea"
            style={{ minHeight: 100, fontSize: 13 }}
            value={addList}
            onChange={(e) => setAddList(e.target.value)}
            placeholder={"La Brisa Dubai\nfrankporter.com\n…"}
          />
          <button
            type="button"
            className="wf-hn-btn cream"
            style={{ alignSelf: "flex-start" }}
            disabled={adding || !addList.trim()}
            onClick={sendProspects}
          >
            {adding ? "sending…" : "send to hunter"}
          </button>
          {added > 0 && (
            <span
              style={{ fontSize: 12, color: "var(--ok)" }}
            >{`sent to hunter · ${added} prospect${added > 1 ? "s" : ""}`}</span>
          )}
        </div>
      </div>
    </div>
  );
}
