// Shared formatters for the mobile redesign — Hebrew dates and ILS currency.
export function nis(n: number): string {
  if (!Number.isFinite(n)) return "₪0";
  return "₪" + Math.round(n).toLocaleString("he-IL");
}

const HEB_MONTHS_SHORT = [
  "ינו",
  "פבר",
  "מרץ",
  "אפר",
  "מאי",
  "יוני",
  "יולי",
  "אוג",
  "ספט",
  "אוק",
  "נוב",
  "דצמ",
];

const HEB_MONTHS = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

const HEB_DAYS = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];

function parseDate(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  // "YYYY-MM-DD" or full ISO.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  // "DD/MM/YYYY" — the app's canonical stored format. Must be handled before
  // the Date fallback, which would misread it as MM/DD/YYYY.
  const heb = iso.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (heb) return { y: +heb[3], m: +heb[2], d: +heb[1] };
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

export function hebDate(iso: string): string {
  const p = parseDate(iso);
  if (!p) return iso || "";
  return `${p.d} ${HEB_MONTHS_SHORT[p.m - 1]}`;
}

export function hebDateFull(iso: string): string {
  const p = parseDate(iso);
  if (!p) return iso || "";
  const dt = new Date(p.y, p.m - 1, p.d);
  return `${HEB_DAYS[dt.getDay()]}, ${p.d} ${HEB_MONTHS[p.m - 1]}`;
}

// Accepts "YYYY-MM-DD" or "DD/MM/YYYY".
function parseLoose(date: string): { y: number; m: number; d: number } | null {
  if (!date) return null;
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] };
  const heb = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (heb) return { y: +heb[3], m: +heb[2], d: +heb[1] };
  return null;
}

export function timeUntil(
  date: string,
  time?: string,
): { days: number; hours: number; mins: number; past: boolean } {
  const p = parseLoose(date);
  if (!p) return { days: 0, hours: 0, mins: 0, past: false };
  const [h, mi] = (time || "20:00").split(":").map((v) => parseInt(v, 10));
  const target = new Date(p.y, p.m - 1, p.d, h || 20, mi || 0).getTime();
  let diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, past: true };
  const days = Math.floor(diff / 86400e3);
  diff -= days * 86400e3;
  const hours = Math.floor(diff / 3600e3);
  diff -= hours * 3600e3;
  const mins = Math.floor(diff / 60e3);
  return { days, hours, mins, past: false };
}

export function isPastDate(date: string): boolean {
  const p = parseLoose(date);
  if (!p) return false;
  const target = new Date(p.y, p.m - 1, p.d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today.getTime();
}

// City names that overflow compact UI cells (boarding pass stubs, event card chips).
// Sorted longest-first so substring replacement picks the most specific match.
const CITY_ABBREV: [string, string][] = [
  ['תל אביב - יפו', 'ת"א'],
  ['תל אביב-יפו',   'ת"א'],
  ['תל אביב',       'ת"א'],
  ['ראשון לציון',   'ראשל"צ'],
  ['רמת השרון',     'רמה"ש'],
  ['הוד השרון',     'הוד"ש'],
  ['פתח תקווה',     'פ"ת'],
  ['פתח-תקווה',     'פ"ת'],
  ['קריית שמונה',   'ק"ש'],
  ['קרית שמונה',    'ק"ש'],
  ['קריית אונו',    'ק"א'],
  ['קרית אונו',     'ק"א'],
  ['קריית גת',      'ק"ג'],
  ['קרית גת',       'ק"ג'],
  ['באר שבע',       'ב"ש'],
  ['נס ציונה',      'נ"צ'],
  ['רמת גן',        'ר"ג'],
];

/**
 * Abbreviates all known city names within a string for compact UI cells.
 * Handles exact matches, venue strings, and event titles containing multiple cities.
 */
export function abbrevCity(name: string): string {
  if (!name) return name;
  let result = name.trim();
  // Exact match — return immediately
  for (const [full, abbr] of CITY_ABBREV) {
    if (result === full) return abbr;
  }
  // Replace every occurrence of every known city (longest-first prevents partial collisions)
  for (const [full, abbr] of CITY_ABBREV) {
    if (result.includes(full)) {
      result = result.split(full).join(abbr);
    }
  }
  return result;
}
