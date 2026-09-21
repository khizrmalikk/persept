// Lenient parser for scout's daily digest files (memory/digests/<date>.md). The
// shape is a header line, a one-line lead, then numbered items. Each item:
//   1. Title of the thing
//   for: gyst  tag: content
//   https://example.com/whatever
//   (optionally a "what it means" sentence somewhere in the block)
// We parse tolerantly: an item starts at ^\d+. ; the for:/tag: line and the URL are
// found anywhere in the item's lines; anything left over is the "what it means" text.
// If an item can't be split, we keep its raw lines so nothing is silently dropped.

export type DigestFor = "gyst" | "workforce" | "";
export type DigestTag = "content" | "sales" | "product" | "watch" | "";

export type DigestItem = {
  n: number;
  title: string;
  source: string;
  meaning: string;
  for: DigestFor;
  tag: DigestTag;
  url: string;
  raw: string; // full raw block, shown when structured parse is thin
};

export type Digest = {
  date: string; // YYYY-MM-DD derived from the file path
  header: string;
  lead: string;
  items: DigestItem[];
};

const URL_RE = /(https?:\/\/[^\s)]+)/;

function pickFor(line: string): DigestFor {
  const m = /for:\s*(gyst|workforce)/i.exec(line);
  return (m?.[1]?.toLowerCase() as DigestFor) ?? "";
}
function pickTag(line: string): DigestTag {
  const m = /tag:\s*(content|sales|product|watch)/i.exec(line);
  return (m?.[1]?.toLowerCase() as DigestTag) ?? "";
}

function dateFromPath(path: string): string {
  const m = /(\d{4}-\d{2}-\d{2})/.exec(path);
  return m?.[1] ?? path.replace(/^.*\//, "").replace(/\.md$/, "");
}

export function parseDigest(path: string, content: string): Digest {
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");
  const date = dateFromPath(path);

  // Header = first non-empty line; lead = next non-empty line before the first item.
  let header = "";
  let lead = "";
  let idx = 0;
  for (; idx < lines.length; idx++) {
    const l = lines[idx].trim();
    if (!l) continue;
    if (/^\d+\.\s/.test(l)) break;
    if (!header) header = l.replace(/^#+\s*/, "");
    else if (!lead) lead = l;
  }

  // Split the rest into numbered item blocks.
  const items: DigestItem[] = [];
  let cur: string[] | null = null;
  let curN = 0;
  const flush = () => {
    if (!cur) return;
    const raw = cur.join("\n").trim();
    const forTagLine =
      cur.find((l) => /for:/i.test(l) || /tag:/i.test(l)) ?? "";
    const urlLine = cur.find((l) => URL_RE.test(l)) ?? "";
    const url = URL_RE.exec(urlLine)?.[1] ?? "";
    const title = (cur[0] ?? "").replace(/^\d+\.\s*/, "").trim();
    // meaning = any remaining prose that isn't the title, for/tag line, or the url line.
    const meaning = cur
      .slice(1)
      .filter((l) => l.trim() && l !== forTagLine && l !== urlLine)
      .join(" ")
      .replace(URL_RE, "")
      .trim();
    const source = (() => {
      try {
        return url ? new URL(url).hostname.replace(/^www\./, "") : "";
      } catch {
        return "";
      }
    })();
    items.push({
      n: curN,
      title,
      source,
      meaning,
      for: pickFor(forTagLine),
      tag: pickTag(forTagLine),
      url,
      raw,
    });
    cur = null;
  };
  for (; idx < lines.length; idx++) {
    const l = lines[idx];
    const m = /^(\d+)\.\s/.exec(l.trim());
    if (m) {
      flush();
      cur = [l.trim()];
      curN = Number(m[1]);
    } else if (cur) {
      cur.push(l.trim());
    }
  }
  flush();

  return { date, header, lead, items };
}
