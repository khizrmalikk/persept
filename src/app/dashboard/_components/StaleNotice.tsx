// A one-line amber notice so stale or not-yet-run data is never mistaken for
// live data. Used on the command today tab and the agent pages (vps_metrics has
// no row newer than 10 minutes, or integrations.ledger.status = pending). Shared,
// client-safe (no server imports). Renders nothing when there's nothing to say.
export function StaleNotice({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        background: "oklch(0.8 0.14 70 / 0.14)",
        border: "1px solid oklch(0.8 0.14 70 / 0.3)",
        fontSize: 12.5,
        lineHeight: 1.4,
        color: "var(--ambink)",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flex: "none" }}
      >
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
