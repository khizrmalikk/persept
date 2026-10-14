"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { upsertProjectOS } from "@/lib/workforce/actions";
import type { OSProject } from "../../_data/dev-types";
import { useOS } from "../os-store";
import { Spinner } from "../Spinner";

// The project editor — a 560px panel over the dev window. `projects` is
// dashboard-owned; this posts to upsertProjectOS (create or update, no redirect)
// and the bridge mirrors the row to the runner within a minute. Uncontrolled
// inputs read via the form's FormData on submit so create can surface {error}
// inline (e.g. a duplicate id). `project` undefined = create mode (the id is a
// slug of the name, derived server-side).
export function ProjectEditor({
  project,
  onClose,
}: {
  project?: OSProject;
  onClose: () => void;
}) {
  const os = useOS();
  const router = useRouter();
  const create = !project;
  const p = project;
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    if (create) fd.set("create", "1");
    else fd.set("id", p?.id ?? "");
    setErr(null);
    setSaving(true);
    const res = await upsertProjectOS(fd);
    setSaving(false);
    if ("error" in res) {
      setErr(res.error);
      return;
    }
    os.showToast(create ? "project created" : "project saved");
    router.refresh();
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="close editor"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          background: "var(--scrim)",
          border: "none",
          cursor: "default",
        }}
      />
      <section
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 560,
          maxWidth: "100%",
          zIndex: 21,
          background: "var(--surf)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span
            className="os-display"
            style={{ fontWeight: 800, fontSize: 18 }}
          >
            {create ? "new project" : "edit project"}
          </span>
          {!create && (
            <span
              className="os-mono"
              style={{ fontSize: 12, color: "var(--mute)" }}
            >
              {p?.id}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            style={{
              marginLeft: "auto",
              width: 30,
              height: 30,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--soft)",
              background: "transparent",
              border: "none",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Field label="name">
            <input
              name="name"
              defaultValue={p?.name ?? ""}
              placeholder="my app"
              style={inputStyle}
            />
          </Field>

          <Field
            label="repository"
            hint="GitHub owner/name or URL — required for Fixer to touch the code"
          >
            <input
              name="repo"
              defaultValue={p?.repo ?? ""}
              placeholder="owner/name or a GitHub URL"
              style={inputStyle}
            />
          </Field>

          <Row>
            <Field label="default branch">
              <input
                name="default_branch"
                defaultValue={p?.default_branch ?? ""}
                placeholder="main"
                style={inputStyle}
              />
            </Field>
            <Field label="dev command">
              <input
                name="dev"
                defaultValue={p?.dev ?? ""}
                placeholder="npm run dev"
                style={inputStyle}
              />
            </Field>
            <Field label="local url">
              <input
                name="url"
                defaultValue={p?.url ?? ""}
                placeholder="http://localhost:3000"
                style={inputStyle}
              />
            </Field>
          </Row>

          <Field label="description">
            <input
              name="description"
              defaultValue={p?.description ?? ""}
              placeholder="what this project is"
              style={inputStyle}
            />
          </Field>

          <Field label="your notes" hint="standing notes Fixer reads every run">
            <textarea
              name="notes"
              rows={3}
              defaultValue={p?.notes ?? ""}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="checks — one command per line">
            <textarea
              name="checks"
              rows={3}
              defaultValue={(p?.checks ?? []).join("\n")}
              placeholder={"npm run lint\nnpm run build"}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "var(--font-mono)",
              }}
            />
          </Field>

          <Field label="extra allowed tools — one per line">
            <textarea
              name="allowed_tools"
              rows={2}
              defaultValue={(p?.allowed_tools ?? []).join("\n")}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "var(--font-mono)",
              }}
            />
          </Field>

          <fieldset
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              margin: 0,
            }}
          >
            <legend
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                padding: "0 6px",
                color: "var(--soft)",
              }}
            >
              local preview login
            </legend>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: "var(--mute)",
                lineHeight: 1.45,
              }}
            >
              the runner logs in with &lt;ENV&gt;_EMAIL / &lt;ENV&gt;_PASSWORD
              from its env file; never put a password here.
            </p>
            <Row>
              <Field label="login path">
                <input
                  name="login_path"
                  defaultValue={p?.login.path ?? ""}
                  placeholder="/login"
                  style={inputStyle}
                />
              </Field>
              <Field label="env name">
                <input
                  name="login_env"
                  defaultValue={p?.login.env ?? ""}
                  placeholder="MYAPP"
                  style={inputStyle}
                />
              </Field>
            </Row>
            <Row>
              <Field label="email selector">
                <input
                  name="login_email_selector"
                  defaultValue={p?.login.email_selector ?? ""}
                  placeholder="#email"
                  style={inputStyle}
                />
              </Field>
              <Field label="password selector">
                <input
                  name="login_password_selector"
                  defaultValue={p?.login.password_selector ?? ""}
                  placeholder="#password"
                  style={inputStyle}
                />
              </Field>
              <Field label="submit selector">
                <input
                  name="login_submit_selector"
                  defaultValue={p?.login.submit_selector ?? ""}
                  placeholder="button[type=submit]"
                  style={inputStyle}
                />
              </Field>
            </Row>
          </fieldset>

          <Row>
            <Field label="deploy">
              <select
                name="deploy"
                defaultValue={p?.deploy ?? ""}
                style={inputStyle}
              >
                <option value="">none</option>
                <option value="flag">this VPS</option>
                <option value="vercel">vercel</option>
              </select>
            </Field>
            <Field label="vercel project id" hint="only for vercel deploys">
              <input
                name="vercel_project_id"
                defaultValue={p?.vercel_project_id ?? ""}
                placeholder="prj_…"
                style={inputStyle}
              />
            </Field>
          </Row>

          <Row>
            <Field label="research">
              <select
                name="research_cadence"
                defaultValue={p?.research_cadence ?? "none"}
                style={inputStyle}
              >
                <option value="none">on request</option>
                <option value="weekly">weekly</option>
              </select>
            </Field>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                alignSelf: "flex-end",
                paddingBottom: 9,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={p?.enabled ?? true}
              />
              enabled
            </label>
          </Row>

          {err && (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--bad)",
                padding: "8px 12px",
                borderRadius: 9,
                background: "oklch(0.66 0.18 28 / 0.1)",
              }}
            >
              {err}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              paddingTop: 2,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 10,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                border: "none",
              }}
            >
              {saving && <Spinner size={14} />}
              {create ? "create project" : "save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--ink)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              cancel
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  background: "var(--surf2)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: 13.5,
  outline: "none",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the input/select/textarea is passed in as children
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--soft)",
        flex: 1,
        minWidth: 0,
      }}
    >
      {label}
      {children}
      {hint && (
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--mute)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{children}</div>
  );
}
