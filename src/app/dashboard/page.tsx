import { Desktop } from "./_components/Desktop";
import { OSMobile } from "./_components/OSMobile";
import { loadAgentExtras } from "./_data/agentpage";
import { loadAgents, loadVps } from "./_data/agents";
import { loadApprovals } from "./_data/approvals";
import { loadCommand } from "./_data/command";
import { loadDesktop } from "./_data/desktop";
import { loadDev } from "./_data/dev";
import { loadFrontDesk } from "./_data/frontdesk";
import { loadKnowledge } from "./_data/knowledge";
import { loadMarketing } from "./_data/marketing";
import { loadThreads } from "./_data/threads";
import { loadWarRoom } from "./_data/warroom";

// Rendered fresh on every request + on every router.refresh() from the tick, so
// new events/approvals/etc. propagate to the client shell. Without this the page
// can serve a cached render and the drawer never sees replies.
export const dynamic = "force-dynamic";
export const revalidate = 0;
// supabase-js calls fetch() under the hood; Next caches GET fetches by default,
// so without this every router.refresh() re-serves the SAME cached query result
// (the drawer never saw new events). Force every fetch in this tree to re-run.
export const fetchCache = "force-no-store";

// The Persept OS desktop. Server component: loads live-ish data and hands it to
// the client shell. One window at a time is mounted inside <Desktop/>.
export default async function OSPage() {
  const [
    { agents, working },
    vps,
    { approvals, manual, pending, inFlight },
    frontdesk,
    desktop,
    marketing,
    dev,
    knowledge,
    command,
    warroom,
    agentExtras,
    threads,
  ] = await Promise.all([
    loadAgents(),
    loadVps(),
    loadApprovals(),
    loadFrontDesk(),
    loadDesktop(),
    loadMarketing(),
    loadDev(),
    loadKnowledge(),
    loadCommand(),
    loadWarRoom(),
    loadAgentExtras(),
    loadThreads(),
  ]);
  return (
    <>
      {/* wide screens: the full desktop (hidden < 1280px) */}
      <div className="os-desktop">
        <Desktop
          agents={agents}
          pending={pending}
          working={working}
          vps={vps}
          approvals={approvals}
          manual={manual}
          inFlight={inFlight}
          frontdesk={frontdesk}
          desktop={desktop}
          marketing={marketing}
          dev={dev}
          knowledge={knowledge}
          command={command}
          warroom={warroom}
          agentExtras={agentExtras}
          threads={threads}
        />
      </div>
      {/* < 1280px: the mobile app (chat with Chief + approvals) */}
      <OSMobile agents={agents} approvals={approvals} threads={threads} />
    </>
  );
}
