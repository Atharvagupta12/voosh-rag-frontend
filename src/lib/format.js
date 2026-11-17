const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.round((t - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(s / 86400), "day");
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "";
  const h = Math.round(seconds / 3600);
  if (h >= 1) return `${h} hour${h === 1 ? "" : "s"}`;
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} minute${m === 1 ? "" : "s"}`;
}

export function listFormat(items) {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);
}

const CITE_GROUP = /\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\](?!\()/g;

/** Source numbers cited in an answer, e.g. "[1] … [2, 3]" → [1, 2, 3]. */
export function citedNumbers(text) {
  const found = new Set();
  for (const m of text.matchAll(CITE_GROUP)) for (const n of m[1].split(",")) found.add(Number(n.trim()));
  return found;
}

/** Turns [1] / [1, 2] markers into markdown links the renderer styles as citation chips. */
export function linkCitations(text, validNumbers) {
  return text.replace(CITE_GROUP, (whole, group) => {
    const nums = group.split(",").map((n) => Number(n.trim()));
    if (!nums.every((n) => validNumbers.has(n))) return whole;
    return nums.map((n) => `[${n}](#cite-${n})`).join("");
  });
}
