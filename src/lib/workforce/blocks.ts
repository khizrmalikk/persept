// Parser for the bridge's block grammar. Agent messages (events.kind=message,
// payload.text) carry structured blocks as PLAIN TEXT — this turns that text into
// { parts } the drawer / agent pages render as cards. No VPS change; purely a read.
//
// Kept import-free (like markdown-table.ts) so it can be unit-tested without the
// Supabase / next chain, and imported from both the server loader (threads.ts +
// block-status.ts) and the client card (BlockCard.tsx). `parseBlocks` NEVER throws.

// Same string union as AgentKey, declared locally so this module pulls no imports
// (keeps it testable). Assignable to AgentKey wherever the client needs it.
export type BlockAgent =
  | "chief"
  | "scout"
  | "hunter"
  | "scribe"
  | "muse"
  | "fixer"
  | "you";

export type BlockType =
  | "COPY REQUEST"
  | "COPY"
  | "LEAD"
  | "FIX REQUEST"
  | "APPROVAL REQUEST"
  | "HANDOFF"
  | "BACKLOG"
  | "IDEA"
  | "CAMPAIGN"
  | "QUESTION"
  | "CONFIG"
  | "GOAL"
  | "PLAN"
  | "MOVER"
  | "TASK"
  | "RUN";

// a live status pill, filled in server-side by block-status.ts where a table knows.
export type BlockStatus = {
  label: string;
  tone: "working" | "waiting" | "failed" | "done" | "muted";
  approvalId?: number | null; // COPY REQUEST / APPROVAL REQUEST → approvals deep link
  detail?: string; // e.g. the refused reason, shown on expand
};

export type TextPart = { kind: "text"; text: string };
export type SystemPart = { kind: "system"; text: string };
export type BlockPart = {
  kind: "block";
  type: BlockType;
  op: string; // "accept" | "add" | "PR_OPEN" | … ; "" when the header has none
  fields: Record<string, string>;
  raw: string; // the exact source text of the block (behind "show raw")
  status?: BlockStatus;
};
export type Part = TextPart | BlockPart | SystemPart;

export type ParseResult = { parts: Part[] };

const ROSTER: BlockAgent[] = [
  "chief",
  "scout",
  "hunter",
  "scribe",
  "muse",
  "fixer",
];

// owner / you → "you"; a roster id → itself; anything else → null (fall back to
// the thread's agent at render time).
function asAgent(v: string | undefined): BlockAgent | null {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "owner" || s === "you") return "you";
  return (ROSTER as string[]).includes(s) ? (s as BlockAgent) : null;
}

function firstLine(s: string): string {
  for (const l of (s ?? "").split("\n")) {
    const t = l.trim();
    if (t) return t;
  }
  return "";
}

// ── block specs ─────────────────────────────────────────────────────────────
// Each header matcher returns the op + any fields parsed from the header line
// itself (null when the line is not that header). `keys` are the field names that
// matter inside the body — a line `key: value` starts a field, a value spans lines
// until the next known key.
type HeaderMatch = { op: string; fields?: Record<string, string> };
type Spec = {
  type: BlockType;
  match: (line: string) => HeaderMatch | null;
  keys: string[];
};

const SPECS: Spec[] = [
  {
    type: "COPY REQUEST",
    match: (l) => (/^COPY REQUEST\s*$/.test(l) ? { op: "" } : null),
    keys: [
      "kind",
      "channel",
      "to",
      "company",
      "contact",
      "campaign",
      "thread",
      "image",
      "media",
      "product",
      "context",
    ],
  },
  {
    type: "COPY",
    match: (l) => (/^COPY\s*$/.test(l) ? { op: "" } : null),
    keys: ["request", "subject", "body"],
  },
  {
    type: "LEAD",
    match: (l) => {
      const m = l.match(
        /^LEAD(?:\s+(accept|dismiss|leave))?(?:\s+#?([A-Za-z0-9_-]+))?\s*$/,
      );
      if (!m) return null;
      const fields: Record<string, string> = {};
      if (m[2]) fields.id = m[2];
      return { op: m[1] ?? "", fields };
    },
    keys: [
      "company",
      "website",
      "contact",
      "channel",
      "size",
      "angle",
      "evidence",
      "source",
      "campaign",
      "id",
      "reason",
    ],
  },
  {
    type: "FIX REQUEST",
    match: (l) => (/^FIX REQUEST\s*$/.test(l) ? { op: "" } : null),
    keys: ["project", "kind", "title", "model", "verify", "spec"],
  },
  {
    type: "APPROVAL REQUEST",
    match: (l) => (/^APPROVAL REQUEST\s*$/.test(l) ? { op: "" } : null),
    keys: ["action", "why", "draft", "risk"],
  },
  {
    type: "HANDOFF",
    match: (l) => (/^HANDOFF\s*$/.test(l) ? { op: "" } : null),
    keys: ["company", "contact", "channel", "why", "next"],
  },
  {
    type: "BACKLOG",
    match: (l) => {
      const m = l.match(
        /^BACKLOG(?:\s+(add|done|doing|blocked|update|drop))?(?:\s+#?([A-Za-z0-9_-]+))?\s*$/,
      );
      if (!m) return null;
      const fields: Record<string, string> = {};
      if (m[2]) fields.id = m[2];
      return { op: m[1] ?? "", fields };
    },
    keys: [
      "id",
      "title",
      "detail",
      "owner",
      "due",
      "priority",
      "result",
      "why",
      "note",
    ],
  },
  {
    type: "IDEA",
    match: (l) => {
      const m = l.match(/^IDEA(?:\s+(dismiss|escalated))?\s*$/);
      return m ? { op: m[1] ?? "" } : null;
    },
    keys: ["agent", "idea", "why", "id", "reason"],
  },
  {
    type: "CAMPAIGN",
    match: (l) => {
      const m = l.match(/^CAMPAIGN(?:\s+(add|update))?\s*$/);
      return m ? { op: m[1] ?? "" } : null;
    },
    keys: [
      "name",
      "audience",
      "goal",
      "platforms",
      "search_queries",
      "daily_cap",
    ],
  },
  {
    type: "QUESTION",
    match: (l) => (/^QUESTION\s*$/.test(l) ? { op: "" } : null),
    keys: ["request", "question"],
  },
  {
    type: "CONFIG",
    match: (l) => (/^CONFIG\s*$/.test(l) ? { op: "" } : null),
    keys: ["agent", "model", "heartbeat", "thinking", "why"],
  },
  {
    type: "GOAL",
    match: (l) => (/^GOAL\s*$/.test(l) ? { op: "" } : null),
    keys: ["label", "value"],
  },
  {
    type: "PLAN",
    match: (l) => (/^PLAN\s*$/.test(l) ? { op: "" } : null),
    keys: ["goal", "summary", "step", "phase"],
  },
  {
    type: "MOVER",
    match: (l) => (/^MOVER\s*$/.test(l) ? { op: "" } : null),
    keys: ["text", "why", "agent", "ask", "impact"],
  },
  {
    type: "TASK",
    match: (l) => {
      const m = l.match(/^TASK\s+(\S+):\s*(.+?)\s*$/);
      if (!m) return null;
      return { op: "", fields: { id: m[1], title: m[2] } };
    },
    keys: [], // body → detail (handled specially)
  },
  {
    type: "RUN",
    match: (l) => {
      const m = l.match(
        /^RUN\s+(PR_OPEN|FAILED|RESEARCH_DONE)\s+for\s+fix\s+(\S+):\s*"(.*)"\s*$/,
      );
      if (!m) return null;
      return { op: m[1], fields: { status: m[1], id: m[2], title: m[3] } };
    },
    keys: [], // body → body (handled specially)
  },
];

// ── system lines (muted chips, not bubbles, not blocks) ───────────────────────
const SYSTEM_RES: RegExp[] = [
  /^\d+\s+COPY REQUEST(?:\(S\)|S)?\s+from\s+\S+/i,
  /^candidates,\s+.+:\s*\d+\s+leads\s+from\s+\d+\s+candidates/i,
  /^SENT\b/i,
  /^PUBLISHED\b/i,
  /^APPROVAL DECISION for request #\d+:/i,
  /^CONFIG result:/i,
  /^\[image attached:.*\]\s*$/i,
];

function isSystem(line: string): boolean {
  const l = line.trim();
  if (!l) return false;
  return SYSTEM_RES.some((re) => re.test(l));
}

function matchHeader(line: string): { spec: Spec; m: HeaderMatch } | null {
  for (const spec of SPECS) {
    const m = spec.match(line);
    if (m) return { spec, m };
  }
  return null;
}

function parseFields(
  bodyLines: string[],
  keys: string[],
  fields: Record<string, string>,
): void {
  const keySet = new Set(keys);
  let cur: string | null = null;
  for (const ln of bodyLines) {
    const km = ln.match(/^\s*([A-Za-z_][\w]*)\s*:\s?(.*)$/);
    if (km && keySet.has(km[1].toLowerCase())) {
      const key = km[1].toLowerCase();
      fields[key] =
        fields[key] != null && fields[key] !== ""
          ? `${fields[key]}\n${km[2]}` // repeated key (step / phase / impact)
          : km[2];
      cur = key;
    } else if (cur) {
      fields[cur] = `${fields[cur]}\n${ln}`; // value continues onto this line
    }
    // a line before the first key is left in `raw` only
  }
  for (const k of Object.keys(fields)) fields[k] = fields[k].trim();
}

function readBlock(
  lines: string[],
  start: number,
  spec: Spec,
  m: HeaderMatch,
): { part: BlockPart; next: number } {
  const header = lines[start];
  const fields: Record<string, string> = { ...(m.fields ?? {}) };
  let i = start + 1;
  const bodyLines: string[] = [];
  while (i < lines.length) {
    const ln = lines[i];
    if (isSystem(ln) || matchHeader(ln)) break;
    bodyLines.push(ln);
    i++;
  }
  if (spec.type === "TASK") {
    const body = bodyLines.join("\n").trim();
    if (body) fields.detail = body;
  } else if (spec.type === "RUN") {
    const body = bodyLines.join("\n").trim();
    if (body) fields.body = body;
  } else {
    parseFields(bodyLines, spec.keys, fields);
  }
  const raw = [header, ...bodyLines].join("\n").trim();
  return {
    part: { kind: "block", type: spec.type, op: m.op ?? "", fields, raw },
    next: i,
  };
}

export function parseBlocks(text: string): ParseResult {
  try {
    const src = typeof text === "string" ? text : "";
    const lines = src.split("\n");
    const parts: Part[] = [];
    let buf: string[] = [];
    const flush = () => {
      const t = buf.join("\n").trim();
      if (t) parts.push({ kind: "text", text: t });
      buf = [];
    };
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isSystem(line)) {
        flush();
        parts.push({ kind: "system", text: line.trim() });
        i++;
        continue;
      }
      const h = matchHeader(line);
      if (h) {
        flush();
        const { part, next } = readBlock(lines, i, h.spec, h.m);
        parts.push(part);
        i = next;
        continue;
      }
      buf.push(line);
      i++;
    }
    flush();
    // nothing structured → keep it as the one text part it is today
    if (!parts.some((p) => p.kind !== "text")) {
      const whole = src.trim();
      return { parts: whole ? [{ kind: "text", text: whole }] : [] };
    }
    return { parts };
  } catch {
    const whole = (typeof text === "string" ? text : "").trim();
    return { parts: whole ? [{ kind: "text", text: whole }] : [] };
  }
}

// ── presentation meta (pure, shared by the loader and the card) ───────────────
// target = whose colour the card wears (null → fall back to the thread's agent).
export function blockMeta(p: BlockPart): {
  target: BlockAgent | null;
  title: string;
} {
  const f = p.fields;
  switch (p.type) {
    case "COPY REQUEST": {
      const right = f.company || f.product || f.channel || "";
      const title =
        [f.kind, right].filter(Boolean).join(" · ") || "copy request";
      return { target: "scribe", title };
    }
    case "COPY":
      return {
        target: null,
        title: f.subject || firstLine(f.body) || "copy",
      };
    case "LEAD":
      return {
        target: "hunter",
        title: p.op ? `${p.op} lead #${f.id || "?"}` : f.company || "lead",
      };
    case "FIX REQUEST":
      return { target: "fixer", title: f.title || "fix request" };
    case "APPROVAL REQUEST":
      return { target: "you", title: f.action || "approval request" };
    case "HANDOFF":
      return { target: "you", title: f.company || "handoff" };
    case "BACKLOG":
      return {
        target: asAgent(f.owner),
        title: f.title || `#${f.id || "?"}`,
      };
    case "IDEA":
      return {
        target: "chief",
        title: firstLine(f.idea) || (p.op ? `idea ${p.op}` : "idea"),
      };
    case "CAMPAIGN":
      return { target: null, title: f.name || "campaign" };
    case "QUESTION":
      return {
        target: "you",
        title: firstLine(f.question) || f.request || "question",
      };
    case "CONFIG":
      return {
        target: asAgent(f.agent),
        title: f.agent ? `config · ${f.agent}` : "config",
      };
    case "GOAL":
      return { target: "chief", title: f.label || "goal" };
    case "PLAN":
      return { target: "chief", title: f.goal ? `plan · ${f.goal}` : "plan" };
    case "MOVER":
      return {
        target: asAgent(f.agent) ?? "chief",
        title: firstLine(f.text) || "mover",
      };
    case "TASK":
      return { target: null, title: f.title || `task ${f.id || ""}`.trim() };
    case "RUN":
      return { target: "fixer", title: f.title || `fix ${f.id || ""}`.trim() };
    default:
      return { target: null, title: String((p as BlockPart).type ?? "") };
  }
}
