// Asia/Dubai calendar helpers for the panels. Files are dated YYYY-MM-DD in the
// agent's own (Dubai) day, so "today"/"yesterday" and overdue checks must use the
// same wall clock rather than the server's UTC date.

const TZ = "Asia/Dubai";

/** YYYY-MM-DD for a given instant in Asia/Dubai (defaults to now). */
export function dubaiDate(d: Date = new Date()): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Today's Dubai date string. */
export function today(): string {
  return dubaiDate();
}

/** Yesterday's Dubai date string. */
export function yesterday(): string {
  return dubaiDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

/** Compare a YYYY-MM-DD due date against today: "overdue" | "today" | "future" | "". */
export function dueState(
  due: string | undefined | null,
): "overdue" | "today" | "future" | "" {
  const d = (due ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const t = today();
  if (d < t) return "overdue";
  if (d === t) return "today";
  return "future";
}
