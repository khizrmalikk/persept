"use client";

import { useTransition } from "react";
import { deleteCampaign } from "@/lib/workforce/actions";

// Delete a campaign, with a confirm so a stray click can't wipe a brief. Small
// icon variant for the board card; labelled variant for the campaign page.
export function DeleteCampaignButton({
  id,
  name,
  variant = "icon",
}: {
  id: string;
  name: string;
  variant?: "icon" | "button";
}) {
  const [pending, start] = useTransition();
  const onClick = () => {
    if (!confirm(`delete “${name}”? this removes the campaign for good.`))
      return;
    start(() => void deleteCampaign(id));
  };
  if (variant === "button") {
    return (
      <button
        type="button"
        className="wf-hn-btn danger"
        disabled={pending}
        onClick={onClick}
      >
        {pending ? "deleting…" : "delete"}
      </button>
    );
  }
  return (
    <button
      type="button"
      title="delete"
      aria-label={`delete ${name}`}
      className="wf-hn-editbtn"
      style={{ display: "grid", placeItems: "center", color: "var(--err)" }}
      disabled={pending}
      onClick={onClick}
    >
      ×
    </button>
  );
}
