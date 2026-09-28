import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Markdown } from "@/app/dashboard/_components/panels/Markdown";
import { PerseptMark } from "@/components/ui/logo";
import {
  getProposalByToken,
  PUBLIC_STATUSES,
  recordProposalView,
} from "@/lib/workforce/proposals";
import "./proposal.css";

// Public, read-only proposal for prospects — OUTSIDE the dashboard layout and auth
// (proxy.ts only gates /dashboard + /login). A draft is never public; approved and
// later are. Each real (non-bot) open bumps the view count and, if `sent`, flips it
// to `viewed`. Prints cleanly (see proposal.css @media print).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const p = await getProposalByToken(token);
  const title = p && PUBLIC_STATUSES.includes(p.status) ? p.title : "Proposal";
  return { title, robots: { index: false, follow: false } };
}

export default async function PublicProposal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await getProposalByToken(token);
  if (!proposal || !PUBLIC_STATUSES.includes(proposal.status)) notFound();

  // count the view (server-side, best-effort, skips bots / link-preview fetchers)
  const ua = (await headers()).get("user-agent") ?? "";
  await recordProposalView(proposal, ua);

  // "prepared for <company> by <prepared_by> · <date> · valid until <date>"
  const by = [
    proposal.company ? `prepared for ` : "",
    proposal.prepared_by ? ` by ${proposal.prepared_by}` : "",
  ];
  const tail = [
    proposal.date,
    proposal.valid_until ? `valid until ${proposal.valid_until}` : "",
  ].filter(Boolean);

  return (
    <main className="prop-page">
      <article className="prop-doc">
        <header className="prop-head">
          <span className="prop-brand">
            <PerseptMark size={22} style={{ color: "#1a1714" }} />
            <span className="prop-brand-word">Persept</span>
          </span>
          <span className="prop-kicker">proposal</span>
        </header>

        {(proposal.company || tail.length > 0) && (
          <p className="prop-prepared">
            {by[0]}
            {proposal.company && <strong>{proposal.company}</strong>}
            {by[1]}
            {tail.length > 0 && ` · ${tail.join(" · ")}`}
          </p>
        )}
        {proposal.title && <h1 className="prop-title">{proposal.title}</h1>}

        <div className="prop-body">
          <Markdown source={proposal.markdown} />
        </div>

        <footer className="prop-footer">
          <span className="prop-mark">Persept</span>
          <span>an ai workforce studio · Dubai</span>
          <a className="prop-mail" href="mailto:khizr@persept.ai">
            khizr@persept.ai
          </a>
        </footer>
      </article>
    </main>
  );
}
