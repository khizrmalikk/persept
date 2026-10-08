"use client";

import { useState } from "react";
// type-only: these libs are server-only (supabaseAdmin).
import type { KnowledgeFile } from "@/lib/workforce/knowledge";
import type { Project } from "@/lib/workforce/projects";
import { ProjectCard, type ProjectStats } from "./ProjectCard";
import { ProjectForm } from "./ProjectForm";

export function ProjectsPanel({
  projects,
  statsById,
  filesById,
}: {
  projects: Project[];
  statsById: Record<string, ProjectStats>;
  filesById: Record<string, KnowledgeFile[]>;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="wf-projects">
      <div className="wf-projects-top">
        <button
          type="button"
          className="wf-hn-btn amber sm"
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? "close" : "new project"}
        </button>
      </div>
      {creating && (
        <div className="wf-proj-card">
          <ProjectForm />
        </div>
      )}
      {projects.length === 0 && !creating && (
        <p className="wf-of-mini-empty">no projects yet.</p>
      )}
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          stats={
            statsById[p.id] ?? { openPrs: 0, merged30: 0, lastActivity: null }
          }
          files={filesById[p.id] ?? []}
        />
      ))}
    </div>
  );
}
