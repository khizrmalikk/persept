import { DigestCards } from "./DigestCards";
import type { Digest } from "./digest";
import { HudPanel } from "./HudPanel";

// The newest digest, with working for:/tag: filters. Parsing happens in the page
// (server); this receives the parsed Digest and a museEnabled flag.
export function LatestDigest({
  digest,
  museEnabled,
  leadCompanies,
}: {
  digest: Digest | null;
  museEnabled: boolean;
  leadCompanies?: string[];
}) {
  if (!digest || !digest.items.length) {
    return (
      <HudPanel title="latest digest">
        <p className="empty">scout has not written a digest yet</p>
      </HudPanel>
    );
  }
  return (
    <HudPanel title="latest digest" right={digest.date}>
      {digest.header ? <p className="wf-di-header">{digest.header}</p> : null}
      <DigestCards
        digest={digest}
        museEnabled={museEnabled}
        leadCompanies={leadCompanies}
        filters
      />
    </HudPanel>
  );
}
