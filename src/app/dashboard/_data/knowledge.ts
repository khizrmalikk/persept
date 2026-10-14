import { getKnowledgeFiles } from "@/lib/workforce/knowledge";
import { ago } from "@/lib/workforce/types";
import type { AgentKey } from "../_components/Persona";
import {
  KNOWLEDGE_AGENTS,
  type OSKnowledge,
  type OSKnowledgeFile,
} from "./knowledge-types";

export type { OSKnowledge, OSKnowledgeFile } from "./knowledge-types";

// Knowledge files for the OS window. Reads the dashboard-owned `knowledge_files`
// table (via the existing defensive getKnowledgeFiles) and shapes each row into a
// serializable view model. Server-only; shared types live in ./knowledge-types.

const AGENT_SET = new Set<string>(KNOWLEDGE_AGENTS);

function humanSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(path: string, title: string, mime: string): string {
  const fromName =
    path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ??
    title.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (fromName) return fromName;
  const sub = mime.split("/")[1] ?? "";
  if (sub.includes("markdown")) return "md";
  if (sub.includes("pdf")) return "pdf";
  if (sub.includes("word")) return "docx";
  if (sub.includes("csv")) return "csv";
  if (sub.includes("plain")) return "txt";
  return sub || "file";
}

export async function loadKnowledge(): Promise<OSKnowledge> {
  let files: OSKnowledgeFile[] = [];
  try {
    const rows = await getKnowledgeFiles();
    files = rows.map((f): OSKnowledgeFile => {
      const filename = f.path.split("/").pop() ?? f.title;
      const agents = f.agent_ids.filter((a): a is AgentKey => AGENT_SET.has(a));
      const excerpt = (f.text?.trim() || f.summary || "").slice(0, 600);
      return {
        id: f.id,
        name: f.title || filename,
        type: fileExt(f.path, f.title, f.mime),
        size: humanSize(f.bytes),
        updated: ago(f.updated_at ?? f.created_at),
        project: f.project || null,
        agents,
        title: f.title,
        summary: f.summary,
        excerpt,
      };
    });
  } catch {
    files = [];
  }
  return { files };
}
