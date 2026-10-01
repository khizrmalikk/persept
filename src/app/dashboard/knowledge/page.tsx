import { KnowledgeList } from "@/app/dashboard/_components/KnowledgeList";
import { KnowledgeUploader } from "@/app/dashboard/_components/KnowledgeUploader";
import { getKnowledgeFiles } from "@/lib/workforce/knowledge";
import "../hunter.css";
import "../knowledge.css";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const files = await getKnowledgeFiles();
  return (
    <div className="wf-kb">
      <header className="wf-kb-head">
        <div className="wf-kb-eyebrow">knowledge</div>
        <h1 className="wf-kb-h1">what the agents know</h1>
        <p className="wf-kb-lede">
          upload a file and pick who gets it. the text is read out on upload and
          lands in each agent&rsquo;s workspace within two minutes.
        </p>
      </header>
      <KnowledgeUploader />
      <KnowledgeList files={files} />
    </div>
  );
}
