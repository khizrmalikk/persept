import type { ReactNode } from "react";

// Shared panel chrome for the agent detail page. Two shapes, both dressed as the
// signature bracket-corner .hud-panel with a mono .hud-head:
//   <HudPanel>            → always-open panel (title left, optional right slot)
//   <HudPanel collapsible> → native <details>/<summary>, closed by default, no JS
// The summary IS the hud-head so the whole header is the click target.

type BaseProps = {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
};

export function HudPanel({
  title,
  right,
  collapsible = false,
  open = false,
  children,
}: BaseProps & { collapsible?: boolean; open?: boolean }) {
  if (collapsible) {
    return (
      <details
        className="hud-panel hud-bracket wf-panel wf-collapse"
        open={open}
      >
        <summary className="hud-head">
          <span className="hud-head-l">
            <span className="sep">{"// "}</span>
            {title}
          </span>
          <span className="hud-head-r wf-collapse-hint">
            {right ?? "expand"}
          </span>
        </summary>
        <div className="hud-body">{children}</div>
      </details>
    );
  }
  return (
    <div className="hud-panel hud-bracket wf-panel">
      <div className="hud-head">
        <span className="hud-head-l">
          <span className="sep">{"// "}</span>
          {title}
        </span>
        {right ? <span className="hud-head-r">{right}</span> : null}
      </div>
      <div className="hud-body">{children}</div>
    </div>
  );
}
