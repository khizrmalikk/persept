// Tolerant GFM pipe-table parser. Kept in its own module (no server imports) so it
// can be unit-tested without pulling in the Supabase / next/headers chain that the
// rest of files.ts needs. files.ts re-exports it, so `@/lib/workforce/files` is the
// public import path for the app.
//
// It locates the table by its `|---|---|` SEPARATOR row and reads column names from
// the HEADER row directly above it — so a prose/legend line that merely contains a
// pipe no longer gets mistaken for the header, and new columns (e.g. `campaign`
// before `notes`) are picked up automatically. Tolerant of a missing leading or
// trailing pipe, extra whitespace, escaped pipes (`\|`) inside cells, and stray
// separator rows anywhere in the body.

export type MarkdownTable = {
  columns: string[];
  rows: Record<string, string>[];
};

// Split a table row into trimmed cells: strip one optional leading/trailing table
// pipe, split on UNescaped pipes only, then unescape `\|` inside each cell.
export function splitCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  // strip a trailing table pipe, but not an escaped one ("…\|")
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}

// A GFM separator row: every cell is dashes with an optional leading/trailing colon.
export function isSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 &&
    cells.every((c) => /^:?-{1,}:?$/.test(c.replace(/\s+/g, "")))
  );
}

export function parseMarkdownTable(
  md: string | null | undefined,
): MarkdownTable {
  const empty: MarkdownTable = { columns: [], rows: [] };
  if (!md) return empty;
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  // Header = the nearest non-empty pipe-bearing line ABOVE the first separator row.
  // This skips any prose/legend line that merely contains a pipe.
  let headerIdx = -1;
  let sepIdx = -1;
  for (let i = 1; i < lines.length && headerIdx < 0; i++) {
    if (!lines[i].includes("|")) continue;
    if (!isSeparatorRow(splitCells(lines[i]))) continue;
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === "") continue;
      if (lines[j].includes("|")) {
        headerIdx = j;
        sepIdx = i;
      }
      break; // stop at the first non-empty line above the separator either way
    }
  }

  // Fallback: no separator row at all → the first two non-empty pipe lines are the
  // header + first data row.
  if (headerIdx < 0) {
    const pipeLines = lines
      .map((l, i) => ({ l, i }))
      .filter((x) => x.l.trim() !== "" && x.l.includes("|"));
    if (pipeLines.length < 2) return empty;
    headerIdx = pipeLines[0].i;
    sepIdx = headerIdx; // no separator to skip; data begins at the next line
  }

  const columns = splitCells(lines[headerIdx]).map((c) => c.toLowerCase());
  if (columns.length === 0) return empty;

  const rows: Record<string, string>[] = [];
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      if (rows.length > 0) break; // a blank line ends the table
      continue; // tolerate a blank line before the first data row
    }
    if (!line.includes("|")) break; // a non-table line ends the table
    const cells = splitCells(line);
    if (isSeparatorRow(cells)) continue; // skip stray separators anywhere
    if (cells.every((c) => c === "")) continue;
    const row: Record<string, string> = {};
    columns.forEach((col, idx) => {
      row[col] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return { columns, rows };
}
