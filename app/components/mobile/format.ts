// Shared formatters for the mobile redesign — Hebrew dates and ILS currency.
// Date parsing / past / countdown logic lives in @/utils/eventDate so desktop
// and mobile stay in lockstep; this file only adds Hebrew display formatting.
import {
  parseEventDateParts,
  isEventPast,
  timeUntilEvent,
} from "@/utils/eventDate";

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

// Display-only parse: the strict shared parser first, then a lenient Date
// fallback so odd-but-valid strings still render *something* in the UI.
// (Decision logic — past/countdown — must use the strict parser only.)
function parseDate(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const strict = parseEventDateParts(iso);
  if (strict) return strict;
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

export const timeUntil = timeUntilEvent;

export const isPastDate = isEventPast;

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
