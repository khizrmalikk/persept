import {
  handoffDoneFromForm,
  handoffDropFromForm,
} from "@/lib/workforce/actions";
import type { Handoff } from "@/lib/workforce/outreach";
import { ago } from "@/lib/workforce/types";

// Open hand-offs from Hunter: a prospect that now needs a human. Each row can be
// marked done or dropped (a direct write to `handoffs` via the server actions).
// Rendered on Hunter's outreach tab and on the dashboard home.
export function Handoffs({
  handoffs,
  heading = "hand-offs",
}: {
  handoffs: Handoff[];
  heading?: string;
}) {
  return (
    <section className="wf-handoffs" aria-label="hand-offs">
      <h3 className="wf-out-h">{heading}</h3>
      {handoffs.length === 0 ? (
        <p className="empty">nothing waiting on you.</p>
      ) : (
        <ul className="wf-handoff-list">
          {handoffs.map((h) => (
            <li key={h.id} className="wf-handoff">
              <div className="wf-handoff-top">
                <span className="wf-handoff-co">{h.company ?? "someone"}</span>
                {h.contact && (
                  <span className="wf-handoff-contact">{h.contact}</span>
                )}
                <span className="wf-handoff-age mono">{ago(h.ts)}</span>
              </div>
              {h.why && <p className="wf-handoff-why">{h.why}</p>}
              {h.next && (
                <p className="wf-handoff-next">
                  <span className="wf-handoff-next-label">next</span> {h.next}
                </p>
              )}
              <div className="wf-handoff-actions">
                <form action={handoffDoneFromForm}>
                  <input type="hidden" name="id" value={h.id} />
                  <button type="submit" className="act sm">
                    done
                  </button>
                </form>
                <form action={handoffDropFromForm}>
                  <input type="hidden" name="id" value={h.id} />
                  <button type="submit" className="act sm secondary">
                    drop
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
