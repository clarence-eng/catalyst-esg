export function formatRelativeTime(date: Date): string {
  const ms = date.getTime();
  if (isNaN(ms)) return "unknown time";
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 0) {
    const futureSecs = -secs;
    if (futureSecs < 60) return "in a moment";
    const mins = Math.floor(futureSecs / 60);
    if (mins < 60) return `in ${mins} minute${mins === 1 ? "" : "s"}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
    const days = Math.floor(hours / 24);
    return `in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthIdx = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  if (monthIdx < 0 || monthIdx > 11 || isNaN(monthIdx)) return iso;
  if (isNaN(day) || day < 1 || day > 31) return iso;
  return `${day} ${months[monthIdx]} ${y}`;
}

/** Copy text to clipboard with a window.prompt fallback for non-HTTPS contexts. Returns true on success (clipboard write or absent API → prompt shown). Returns false when clipboard API throws (permission denied) — caller should not show 'Copied!' since the copy did not complete silently. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    window.prompt("Copy manually:", text);
    return true;
  } catch {
    // navigator.clipboard rejected (e.g. permissions denied) — show prompt for manual copy
    // Return false so callers don't flash 'Copied!' while the prompt is still open
    window.prompt("Copy manually:", text);
    return false;
  }
}


/** Returns the company display name or "Unnamed company" when name is blank. */
export const displayName = (name: string): string => name.trim() || "Unnamed company";

/** Parse "Q# YYYY" → [quarter, year]. Non-matching periods return [0, 9999] to sort last. */
export function parsePeriod(p: string): [number, number] {
  const m = p.match(/Q(\d) (\d{4})/);
  if (!m) return [0, 9999];
  return [Number(m[1]), Number(m[2])];
}

/** Chronological comparator for "Q# YYYY" period strings. Use with Array.sort(). */
export function comparePeriods(a: string, b: string): number {
  const [aq, ay] = parsePeriod(a);
  const [bq, by] = parsePeriod(b);
  return ay !== by ? ay - by : aq - bq;
}
