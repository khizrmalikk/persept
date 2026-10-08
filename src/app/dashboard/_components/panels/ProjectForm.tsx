"use client";

import { saveProject } from "@/lib/workforce/actions";
// type-only: projects.ts is server-only (supabaseAdmin).
import type { Project } from "@/lib/workforce/projects";

// Create or edit a Fixer project. Uncontrolled form posting to the saveProject
// server action (which bumps updated_at). `project` undefined = create mode (an
// editable id, defaulting to a slug of the name server-side).

export function ProjectForm({ project }: { project?: Project }) {
  const create = !project;
  const p = project;
  return (
    <form action={saveProject} className="wf-proj-form">
      {create ? (
        <input type="hidden" name="create" value="1" />
      ) : (
        <input type="hidden" name="id" value={p?.id ?? ""} />
      )}

      <label className="wf-hn-field">
        name
        <input name="name" defaultValue={p?.name ?? ""} placeholder="my app" />
      </label>

      {create && (
        <label className="wf-hn-field">
          id
          <input name="id" placeholder="defaults to a slug of the name" />
        </label>
      )}

      <label className="wf-hn-field">
        repository
        <input
          name="repo"
          defaultValue={p?.repo ?? ""}
          placeholder="owner/name or a GitHub URL"
        />
      </label>

      <div className="wf-proj-form-row">
        <label className="wf-hn-field">
          default branch
          <input
            name="default_branch"
            defaultValue={p?.default_branch ?? ""}
            placeholder="main"
          />
        </label>
        <label className="wf-hn-field">
          dev command
          <input
            name="dev"
            defaultValue={p?.dev ?? ""}
            placeholder="npm run dev"
          />
        </label>
        <label className="wf-hn-field">
          local URL
          <input
            name="url"
            defaultValue={p?.url ?? ""}
            placeholder="http://localhost:3000"
          />
        </label>
      </div>

      <label className="wf-hn-field">
        description
        <input name="description" defaultValue={p?.description ?? ""} />
      </label>
      <label className="wf-hn-field">
        your notes
        <textarea name="notes" rows={3} defaultValue={p?.notes ?? ""} />
      </label>
      <label className="wf-hn-field">
        checks — one command per line
        <textarea
          name="checks"
          rows={3}
          defaultValue={(p?.checks ?? []).join("\n")}
          placeholder={"npm run lint\nnpm run build"}
        />
      </label>
      <label className="wf-hn-field">
        extra allowed tools — one per line
        <textarea
          name="allowed_tools"
          rows={2}
          defaultValue={(p?.allowed_tools ?? []).join("\n")}
        />
      </label>

      <fieldset className="wf-proj-login">
        <legend>local preview login</legend>
        <p className="wf-hn-note">
          the runner logs in with &lt;ENV&gt;_EMAIL / &lt;ENV&gt;_PASSWORD from
          its env file; never put the password here.
        </p>
        <div className="wf-proj-form-row">
          <label className="wf-hn-field">
            login path
            <input
              name="login_path"
              defaultValue={p?.login.path ?? ""}
              placeholder="/login"
            />
          </label>
          <label className="wf-hn-field">
            env name
            <input
              name="login_env"
              defaultValue={p?.login.env ?? ""}
              placeholder="MYAPP"
            />
          </label>
        </div>
        <div className="wf-proj-form-row">
          <label className="wf-hn-field">
            email selector
            <input
              name="login_email_selector"
              defaultValue={p?.login.email_selector ?? ""}
              placeholder="#email"
            />
          </label>
          <label className="wf-hn-field">
            password selector
            <input
              name="login_password_selector"
              defaultValue={p?.login.password_selector ?? ""}
              placeholder="#password"
            />
          </label>
          <label className="wf-hn-field">
            submit selector
            <input
              name="login_submit_selector"
              defaultValue={p?.login.submit_selector ?? ""}
              placeholder="button[type=submit]"
            />
          </label>
        </div>
      </fieldset>

      <div className="wf-proj-form-row">
        <label className="wf-hn-field">
          deploy
          <select name="deploy" defaultValue={p?.deploy ?? ""}>
            <option value="">none</option>
            <option value="vercel">vercel</option>
            <option value="flag">this VPS</option>
          </select>
        </label>
        <label className="wf-hn-field">
          research
          <select
            name="research_cadence"
            defaultValue={p?.research_cadence ?? "none"}
          >
            <option value="none">on request</option>
            <option value="weekly">weekly</option>
          </select>
        </label>
        <label className="wf-hn-field wf-proj-enabled">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={p?.enabled ?? true}
          />
          enabled
        </label>
      </div>

      <div className="wf-proj-form-foot">
        <button type="submit" className="wf-hn-btn amber">
          {create ? "create project" : "save"}
        </button>
      </div>
    </form>
  );
}
