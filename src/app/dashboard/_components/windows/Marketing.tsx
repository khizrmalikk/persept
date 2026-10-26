"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  createCampaign,
  removeCampaign,
  rerunRun,
  sendAgentCommand,
  updateCampaign,
} from "@/lib/workforce/actions";
import { copyStatusStyle, type OSCopyRow } from "../../_data/copy-types";
import {
  ASSET_FILTERS,
  CAMPAIGN_BADGE,
  CAMPAIGN_CHANNELS,
  type OSAssetKind,
  type OSCampaign,
  type OSDraft,
  type OSMarketing,
  type OSPublished,
  type OSWeekItem,
  PLAN_LABEL,
  PLAN_STYLE,
} from "../../_data/marketing-types";
import { AGENT_HUE_VAR, AGENT_TINT_VAR } from "../../_data/windows";
import { InFlightStrip } from "../InFlightStrip";
import { useOS } from "../os-store";
import { Persona } from "../Persona";

// Marketing — owner Muse. content studio / campaigns / assets. Reads loadMarketing()
// data; the one live mutation is "ask Muse" (sendAgentCommand → muse) which opens
// her drawer. Posts/campaign/asset editing reuse existing actions where noted.

const TABS: [string, string][] = [
  ["studio", "content studio"],
  ["library", "library"],
  ["campaigns", "campaigns"],
  ["assets", "assets"],
];
const CAMP_STATUS: Record<string, [string, string]> = {
  active: ["oklch(0.72 0.15 150 / 0.16)", "var(--ok)"],
  paused: ["oklch(0.8 0.14 70 / 0.2)", "var(--ambink)"],
  archived: ["var(--surf2)", "var(--soft)"],
};
const reRunBtn: CSSProperties = {
  padding: "6px 11px",
  borderRadius: 999,
  background: "transparent",
  border: "1px solid var(--line)",
  color: "var(--soft)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

// day-47: copy the finished text to the clipboard, with a brief "copied" state.
function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1500);
          },
          () => {},
        );
      }}
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "transparent",
        color: done ? "var(--ok)" : "var(--ink)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {done ? "copied" : "copy text"}
    </button>
  );
}

// the full finished copy in a monospace block (shared by published / drafts /
// library / the deal panel).
function CopyBody({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--surf2)",
        border: "1px solid var(--line)",
        fontSize: 12.5,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "var(--ink)",
      }}
    >
      {text || "no text yet."}
    </div>
  );
}

export function Marketing({ data }: { data: OSMarketing }) {
  const os = useOS();
  const router = useRouter();
  const [tab, setTab] = useState("studio");
  const [af, setAf] = useState<"all" | OSAssetKind>("all");

  useEffect(() => {
    if (os.sub.tab) setTab(os.sub.tab);
  }, [os.sub.tab]);

  const askMuse = (text: string) => {
    void sendAgentCommand("muse", text).then(() => router.refresh());
    os.openDrawer("muse");
  };
  const rerun = (name: string) => {
    void rerunRun("muse", name).then(() => router.refresh());
    os.showToast(`re-running Muse's ${name}`);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {TABS.map(([k, n]) => {
          const on = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                padding: "7px 13px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                whiteSpace: "nowrap",
                background: on ? "var(--surf2)" : "transparent",
                color: on ? "var(--ink)" : "var(--soft)",
              }}
            >
              {n}
            </button>
          );
        })}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => rerun("daily run")}
            title="run Muse's daily content job now"
            style={reRunBtn}
          >
            re-run daily
          </button>
          <button
            type="button"
            onClick={() => rerun("weekly plan")}
            title="re-plan Muse's week now"
            style={reRunBtn}
          >
            re-run weekly plan
          </button>
          <button
            type="button"
            onClick={() => os.openDrawer("muse")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px 5px 5px",
              borderRadius: 999,
              background: "var(--t-muse)",
              color: "var(--c-muse)",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            <Persona agent="muse" size={24} />
            ask Muse for a post
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18 }}>
        {tab === "studio" && (
          <Studio
            data={data}
            onAsk={askMuse}
            onReview={(id) => os.open("approvals", { id: String(id) })}
          />
        )}
        {tab === "library" && <Library data={data} />}
        {tab === "campaigns" && <Campaigns data={data} />}
        {tab === "assets" && <Assets data={data} af={af} setAf={setAf} />}
      </div>
    </div>
  );
}

// one entry in a day card — published / waiting / planned, with its campaign
// badge. Waiting entries carry a review button that opens the approval.
function WeekCard({
  item,
  onReview,
}: {
  item: OSWeekItem;
  onReview: (id: number) => void;
}) {
  const style = PLAN_STYLE[item.status];
  const badge = item.campaign ? CAMPAIGN_BADGE[item.campaign] : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        style={{
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {item.channel && (
          <span
            className="os-mono"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 5,
              background: "var(--surf2)",
              color: "var(--soft)",
            }}
          >
            {item.channel}
          </span>
        )}
        {badge && item.campaign && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 5,
              background: badge[0],
              color: badge[1],
            }}
          >
            {item.campaign}
          </span>
        )}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>
        {item.title}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            whiteSpace: "nowrap",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            background: style[0],
            color: style[1],
          }}
        >
          {PLAN_LABEL[item.status]}
        </span>
        {item.status === "waiting" && item.approvalId != null && (
          <button
            type="button"
            onClick={() => onReview(item.approvalId as number)}
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "var(--accent)",
              color: "var(--accent-ink)",
            }}
          >
            review
          </button>
        )}
      </div>
    </div>
  );
}

// day-47: a draft row that expands to the full draft text (approvals.draft).
function DraftRow({
  p,
  onReview,
}: {
  p: OSDraft;
  onReview: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Persona agent="muse" size={30} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink)",
            padding: 0,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {open ? "▾ " : "▸ "}
            {p.title}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
            {p.channel}
          </span>
          {p.state === "writing" && (
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--track)",
                marginTop: 2,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${p.pct}%`,
                  borderRadius: 2,
                  background: "var(--c-muse)",
                }}
              />
            </div>
          )}
        </button>
        {p.state === "waiting" && p.approvalId != null && (
          <button
            type="button"
            onClick={() => onReview(p.approvalId as number)}
            style={{
              padding: "7px 12px",
              borderRadius: 9,
              background: "var(--accent)",
              color: "var(--accent-ink)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            review
          </button>
        )}
        {p.state === "writing" && (
          <span
            style={{ fontSize: 12, color: "var(--soft)", whiteSpace: "nowrap" }}
          >
            Muse is writing
          </span>
        )}
        {p.state === "gone" && (
          <span
            style={{ fontSize: 12, color: "var(--ok)", whiteSpace: "nowrap" }}
          >
            decided
          </span>
        )}
      </div>
      {open && (
        <div>
          <CopyBody text={p.body} />
          <div style={{ marginTop: 8 }}>
            <CopyButton text={p.body} />
          </div>
        </div>
      )}
    </div>
  );
}

// day-47: a published row that expands to the full post text (posts.text).
function PublishedRow({ p }: { p: OSPublished }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink)",
            padding: 0,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {open ? "▾ " : "▸ "}
            {p.title}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
            {p.channel} · {p.date || p.when}
          </span>
        </button>
        <div
          style={{
            width: 90,
            height: 5,
            borderRadius: 3,
            background: "var(--track)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${p.barPct}%`,
              borderRadius: 3,
              background: "var(--c-muse)",
            }}
          />
        </div>
        <span
          className="os-mono"
          style={{
            fontSize: 12,
            whiteSpace: "nowrap",
            width: 150,
            textAlign: "right",
          }}
        >
          {p.impressions.toLocaleString("en-US")} · {p.reactions} · {p.comments}
        </span>
      </div>
      {open && (
        <div>
          <CopyBody text={p.text} />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CopyButton text={p.text} />
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11.5,
                  color: "var(--soft)",
                  textDecoration: "none",
                }}
              >
                open post ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── content studio ────────────────────────────────────────────────────────────
function Studio({
  data,
  onAsk,
  onReview,
}: {
  data: OSMarketing;
  onAsk: (text: string) => void;
  onReview: (id: number) => void;
}) {
  return (
    <>
      <InFlightStrip rows={data.inFlight} onOpenApproval={onReview} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>this week</span>
        <span
          style={{ fontSize: 12, color: "var(--soft)", whiteSpace: "nowrap" }}
        >
          Muse plans it. you approve each post.
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0,1fr))",
          gap: 8,
          marginBottom: 22,
        }}
      >
        {data.week.map((d) => (
          <div
            key={d.day}
            style={{
              padding: 12,
              borderRadius: 14,
              border: `1px solid ${d.today ? "oklch(0.8 0.14 70 / 0.5)" : "var(--line)"}`,
              background: d.today ? "oklch(0.8 0.14 70 / 0.05)" : "transparent",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 150,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{d.day}</span>
              {d.today && (
                <span
                  className="os-mono"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ambink)",
                  }}
                >
                  today
                </span>
              )}
            </div>
            {d.items.length === 0 ? (
              <button
                type="button"
                onClick={() => onAsk(`plan a post for ${d.day}`)}
                style={{
                  marginTop: "auto",
                  fontSize: 12,
                  color: "var(--soft)",
                  padding: 8,
                  borderRadius: 9,
                  border: "1px dashed var(--line)",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                + ask Muse
              </button>
            ) : (
              d.items.map((item, i) => (
                <WeekCard
                  key={`${item.status}-${item.campaign ?? ""}-${i}`}
                  item={item}
                  onReview={onReview}
                />
              ))
            )}
          </div>
        ))}
      </div>
      {data.planCaption && (
        <div
          className="os-mono"
          style={{
            fontSize: 10.5,
            color: "var(--mute)",
            marginTop: -14,
            marginBottom: 22,
          }}
        >
          {data.planCaption}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            drafts
          </span>
          {data.drafts.length === 0 ? (
            <span
              style={{ fontSize: 12.5, color: "var(--mute)", padding: "8px 0" }}
            >
              no drafts waiting. ask Muse for a post.
            </span>
          ) : (
            data.drafts.map((p) => (
              <DraftRow key={p.id} p={p} onReview={onReview} />
            ))
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>published</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--soft)",
                  whiteSpace: "nowrap",
                }}
              >
                impressions · reactions · comments
              </span>
            </div>
            {data.published.length === 0 ? (
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--mute)",
                  padding: "8px 0",
                }}
              >
                nothing published yet. approved posts appear here with their
                stats.
              </span>
            ) : (
              data.published.map((p) => <PublishedRow key={p.id} p={p} />)
            )}
          </div>
          {data.learned && (
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 16,
                background: "var(--t-muse)",
              }}
            >
              <Persona agent="muse" size={30} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--c-muse)",
                  }}
                >
                  what Muse learned this week
                </span>
                <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                  {data.learned}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── library (day-47): everything Scribe has written ───────────────────────────
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
const libSelect: CSSProperties = {
  height: 32,
  padding: "0 8px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--surf2)",
  color: "var(--ink)",
  fontSize: 12.5,
  cursor: "pointer",
};

function LibraryRow({ r }: { r: OSCopyRow }) {
  const [open, setOpen] = useState(false);
  const [bg, fg] = copyStatusStyle(r.status);
  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "11px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {open ? "▾ " : "▸ "}
            {r.subject || r.body.split("\n")[0]?.slice(0, 64) || "untitled"}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
            {[r.company, r.kind, r.channel, `for ${r.forAgent}`, r.when]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </button>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: bg,
            color: fg,
            whiteSpace: "nowrap",
          }}
        >
          {r.status}
        </span>
      </div>
      {open && (
        <div>
          <CopyBody text={r.body} />
          <div style={{ marginTop: 8 }}>
            <CopyButton text={r.body} />
          </div>
        </div>
      )}
    </div>
  );
}

function Library({ data }: { data: OSMarketing }) {
  const rows = data.library;
  const [agent, setAgent] = useState("all");
  const [kind, setKind] = useState("all");
  const [campaign, setCampaign] = useState("all");
  const [company, setCompany] = useState("all");
  const [q, setQ] = useState("");

  const kinds = uniq(rows.map((r) => r.kind));
  const campaigns = uniq(rows.map((r) => r.campaign));
  const companies = uniq(rows.map((r) => r.company));
  const ql = q.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (agent === "all" || r.forAgent === agent) &&
      (kind === "all" || r.kind === kind) &&
      (campaign === "all" || r.campaign === campaign) &&
      (company === "all" || r.company === company) &&
      (!ql ||
        `${r.body} ${r.subject} ${r.company} ${r.contact}`
          .toLowerCase()
          .includes(ql)),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>library</span>
        <span style={{ fontSize: 12, color: "var(--soft)" }}>
          everything Scribe has written — the actual words.
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search the text…"
          style={{ ...libSelect, flex: 1, minWidth: 160, cursor: "text" }}
        />
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          style={libSelect}
        >
          <option value="all">all agents</option>
          <option value="muse">muse</option>
          <option value="hunter">hunter</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          style={libSelect}
        >
          <option value="all">all kinds</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          style={libSelect}
        >
          <option value="all">all campaigns</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={libSelect}
        >
          <option value="all">all companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px dashed var(--line)",
            fontSize: 13.5,
            color: "var(--soft)",
          }}
        >
          {rows.length === 0
            ? "nothing written yet. Scribe's finished copy lands here."
            : "no copy matches those filters."}
        </div>
      ) : (
        <div>
          {filtered.map((r) => (
            <LibraryRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── campaigns ─────────────────────────────────────────────────────────────────
function Campaigns({ data }: { data: OSMarketing }) {
  const os = useOS();
  const router = useRouter();
  const [sel, setSel] = useState<OSCampaign | null>(null);

  // keep the open panel in sync with refreshed data (so a save reflects back)
  const current = sel
    ? (data.campaigns.find((c) => c.id === sel.id) ?? sel)
    : null;

  const makeNew = (owner: "hunter" | "muse") => {
    void createCampaign(owner).then((res) => {
      if ("error" in res) {
        os.showToast(res.error);
        return;
      }
      // open the editor prefilled immediately; data refreshes behind it
      setSel({
        id: res.id,
        name: "new campaign",
        owner,
        ownerName: owner === "muse" ? "Muse" : "Hunter",
        status: "draft",
        collab: [],
        objs: "",
        assets: 0,
        aps: 0,
        last: "now",
        description: "",
        goal: "",
        channels: ["email"],
        platforms: [],
        searchQueries: [],
        dailyCap: 20,
        notes: "",
        searchQueryCount: 0,
      });
      router.refresh();
    });
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))",
          gap: 14,
        }}
      >
        {data.campaigns.map((c) => {
          const ownerHue = `var(${AGENT_HUE_VAR[c.owner]})`;
          const st = CAMP_STATUS[c.status] ?? ["var(--surf2)", "var(--soft)"];
          return (
            <button
              key={c.id}
              data-pc={`campaign-${c.id}`}
              type="button"
              onClick={() => setSel(c)}
              style={{
                borderRadius: 18,
                border: `1px solid ${current?.id === c.id ? ownerHue : "var(--line)"}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                background: "transparent",
                color: "var(--ink)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div style={{ height: 5, background: ownerHue, width: "100%" }} />
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Persona agent={c.owner} size={42} />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15.5,
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{ fontSize: 12, color: ownerHue, fontWeight: 600 }}
                    >
                      owned by {c.ownerName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: st[0],
                      color: st[1],
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                {c.collab.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {c.collab.map((k) => (
                      <span
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "2px 9px 2px 2px",
                          borderRadius: 999,
                          background: `var(${AGENT_TINT_VAR[k]})`,
                          color: `var(${AGENT_HUE_VAR[k]})`,
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        <Persona agent={k} size={20} />
                        {cap(k)}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 8,
                    paddingTop: 10,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <Stat label="contains" value={c.objs} />
                  <Stat label="assets" value={String(c.assets)} />
                  <Stat
                    label="for you"
                    value={String(c.aps)}
                    color={c.aps ? "var(--ambink)" : "var(--ink)"}
                  />
                </div>
                <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                  {c.searchQueryCount > 0
                    ? `search queries: ${c.searchQueryCount} · `
                    : ""}
                  last activity {c.last}
                </span>
              </div>
            </button>
          );
        })}
        <div
          style={{
            borderRadius: 18,
            border: "1.5px dashed var(--line)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            justifyContent: "center",
            minHeight: 220,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>new campaign</span>
          <span
            style={{ fontSize: 13, color: "var(--soft)", lineHeight: 1.45 }}
          >
            pick who leads it. Hunter runs outreach campaigns, Muse runs content
            ones. they share the assets.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["hunter", "muse"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => makeNew(o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 13px 6px 6px",
                  borderRadius: 999,
                  background: `var(${AGENT_TINT_VAR[o]})`,
                  color: `var(${AGENT_HUE_VAR[o]})`,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <Persona agent={o} size={24} />
                {cap(o)} leads
              </button>
            ))}
          </div>
        </div>
      </div>

      {current && (
        <CampaignPanel
          key={current.id}
          c={current}
          onClose={() => setSel(null)}
          onSaved={() => {
            router.refresh();
            os.showToast("campaign saved");
          }}
        />
      )}
    </>
  );
}

// the campaign editor: a 560px right-hand panel like the deal panel. Every field
// the agents read (brief, goal, platforms, Scout's search queries, daily cap) is
// editable; save patches the row via updateCampaign (no redirect). The slug/id
// never changes.
function CampaignPanel({
  c,
  onClose,
  onSaved,
}: {
  c: OSCampaign;
  onClose: () => void;
  onSaved: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [owner, setOwner] = useState<"hunter" | "muse">(
    c.owner === "muse" ? "muse" : "hunter",
  );
  const [channels, setChannels] = useState<Set<string>>(
    () => new Set(c.channels),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toggleChannel = (ch: string) =>
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });

  const saveWith = (statusOverride?: string) => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    fd.set("id", c.id);
    fd.set("owner", owner);
    if (statusOverride) fd.set("status", statusOverride);
    void updateCampaign(fd).then((res) => {
      if ("error" in res) return;
      onSaved();
    });
  };

  const live = c.status === "active";
  const archived = c.status === "archived";

  return (
    <>
      <button
        type="button"
        aria-label="close campaign"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--scrim)",
          zIndex: 5,
          border: "none",
          cursor: "default",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 560,
          zIndex: 6,
          background: "var(--surf)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <Persona agent={owner} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              className="os-mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--mute)",
              }}
            >
              campaign
            </span>
            <div
              className="os-display"
              style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}
            >
              {c.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 12,
              color: "var(--soft)",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            close ✕
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            saveWith();
          }}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Field label="name">
            <input name="name" defaultValue={c.name} style={inputStyle} />
          </Field>
          <Field label="owner — who leads it">
            <div style={{ display: "flex", gap: 8 }}>
              {(["hunter", "muse"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOwner(o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 13px 6px 6px",
                    borderRadius: 999,
                    background:
                      owner === o ? `var(${AGENT_TINT_VAR[o]})` : "transparent",
                    color:
                      owner === o ? `var(${AGENT_HUE_VAR[o]})` : "var(--soft)",
                    border: `1px solid ${owner === o ? `var(${AGENT_HUE_VAR[o]})` : "var(--line)"}`,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Persona agent={o} size={22} />
                  {cap(o)}
                </button>
              ))}
            </div>
          </Field>
          <Field label="brief — audience, angle, offer">
            <textarea
              name="description"
              defaultValue={c.description}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <Field label="goal">
            <input name="goal" defaultValue={c.goal} style={inputStyle} />
          </Field>
          <Field label="channels — where Hunter reaches out">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CAMPAIGN_CHANNELS.map((ch) => {
                const on = channels.has(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      border: `1px solid ${on ? "var(--c-hunter)" : "var(--line)"}`,
                      background: on ? "var(--t-hunter)" : "transparent",
                      color: on ? "var(--c-hunter)" : "var(--soft)",
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
            {[...channels].map((ch) => (
              <input key={ch} type="hidden" name="channels" value={ch} />
            ))}
          </Field>
          <Field label="platforms">
            <textarea
              name="platforms"
              defaultValue={c.platforms.join("\n")}
              rows={3}
              placeholder="one per line, e.g. linkedin"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <Field label="search queries — Scout's daily candidate sourcing">
            <textarea
              name="search_queries"
              defaultValue={c.searchQueries.join("\n")}
              rows={4}
              placeholder="one search per line, e.g. holiday home operators Dubai Marina"
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
              }}
            />
          </Field>
          <Field label="daily cap">
            <input
              name="daily_cap"
              type="number"
              min={0}
              defaultValue={c.dailyCap}
              style={inputStyle}
            />
          </Field>
          <Field label="notes">
            <textarea
              name="notes"
              defaultValue={c.notes}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <input type="hidden" name="status" defaultValue={c.status} />
        </form>

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            onClick={() => saveWith()}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 10,
              borderRadius: 10,
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
            }}
          >
            save
          </button>
          {!archived && (
            <button
              type="button"
              onClick={() => saveWith(live ? "paused" : "active")}
              style={ghostBtn}
            >
              {live ? "pause" : "resume"}
            </button>
          )}
          <button
            type="button"
            onClick={() => saveWith(archived ? "active" : "archived")}
            style={ghostBtn}
          >
            {archived ? "reopen" : "mark done"}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                void removeCampaign(c.id).then(() => onSaved());
              }}
              style={{
                ...ghostBtn,
                borderColor: "var(--bad)",
                color: "#fff",
                background: "var(--bad)",
              }}
            >
              delete for good
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{ ...ghostBtn, color: "var(--bad)" }}
            >
              delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--surf2)",
  color: "var(--ink)",
  fontFamily: "var(--font-ui)",
  fontSize: 13.5,
  outline: "none",
};
const ghostBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--ink)",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        className="os-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--mute)",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, color: "var(--mute)" }}>{label}</span>
      <b style={{ fontSize: 13, color: color ?? "var(--ink)" }}>{value}</b>
    </div>
  );
}

// ── assets ────────────────────────────────────────────────────────────────────
function Assets({
  data,
  af,
  setAf,
}: {
  data: OSMarketing;
  af: "all" | OSAssetKind;
  setAf: (v: "all" | OSAssetKind) => void;
}) {
  const shown = data.assets.filter((a) => af === "all" || a.kind === af);
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {ASSET_FILTERS.map((f) => {
          const on = af === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setAf(f.key)}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                cursor: "pointer",
                background: on ? "var(--ink)" : "transparent",
                color: on ? "var(--bg)" : "var(--soft)",
              }}
            >
              {f.label}
            </button>
          );
        })}
        <span
          style={{ marginLeft: "auto", fontSize: 12, color: "var(--soft)" }}
        >
          campaign-assets · shared by Hunter and Muse
        </span>
      </div>
      {shown.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px dashed var(--line)",
            fontSize: 13.5,
            color: "var(--soft)",
          }}
        >
          no assets yet. images Muse makes and copy Scribe writes land here,
          grouped by campaign.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))",
            gap: 14,
          }}
        >
          {shown.map((a) => (
            <div
              key={a.id}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                style={{
                  aspectRatio: "4/3",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  background: "var(--surf2)",
                  position: "relative",
                }}
              >
                {a.kind === "copy" ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      padding: 16,
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "var(--soft)",
                      overflow: "hidden",
                    }}
                  >
                    {a.text}
                  </div>
                ) : a.url ? (
                  // biome-ignore lint/performance/noImgElement: supabase storage url, no next/image optimisation wanted
                  <img
                    src={a.url}
                    alt={a.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--mute)",
                      fontSize: 12,
                    }}
                  >
                    {a.kind}
                  </div>
                )}
                <span
                  className="os-mono"
                  style={{
                    position: "absolute",
                    left: 8,
                    top: 8,
                    fontSize: 9.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 7px",
                    borderRadius: 5,
                    background: "var(--surf)",
                    color: "var(--soft)",
                    pointerEvents: "none",
                  }}
                >
                  {a.kind}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Persona agent={a.by} size={20} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--mute)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    in {a.used}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const cap = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
