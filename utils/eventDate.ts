// Single source of truth for parsing event date/time strings and deciding
// whether an event is upcoming or past. Every surface (desktop gallery cards,
// mobile cards, "My Tickets") must go through here — divergent ad-hoc parsers
// caused the same bug repeatedly: a naive `split("/")` turns a legacy value
// like "10/09/26" (2-digit year) into year 26 AD, so the event reads as long
// past. When in doubt we return null / "not past" rather than guess.

export type DateParts = { y: number; m: number; d: number };

/**
 * Strictly parse an event date string into calendar parts.
 * Accepts ISO "YYYY-MM-DD" (optionally with a trailing time component) and the
 * app's canonical "DD/MM/YYYY" / "DD.MM.YYYY" (4-digit year, day first).
 * Returns null for anything else.
 */
export function parseEventDateParts(date: string): DateParts | null {
  if (!date) return null;
  const iso = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] };
  const dmy = date.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (dmy) return { y: +dmy[3], m: +dmy[2], d: +dmy[1] };
  return null;
}

/**
 * Parse date + optional "HH:MM" time into a Date in local time.
 * Defaults to a typical 20:00 show time when no valid time is given.
 * Returns null if the date can't be confidently parsed.
 */
export function parseEventDate(date: string, time?: string): Date | null {
  const p = parseEventDateParts(date);
  if (!p) return null;
  const [h, mi] =
    time && /^\d{1,2}:\d{2}/.test(time)
      ? time.split(":").map((v) => parseInt(v, 10))
      : [20, 0];
  const dt = new Date(p.y, p.m - 1, p.d, h, mi);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * True only when the event's calendar day is strictly before today.
 * Unparseable dates are treated as NOT past (benign) so a bad value never
 * hides a ticket in the "past" bucket.
 */
export function isEventPast(date: string): boolean {
  const p = parseEventDateParts(date);
  if (!p) return false;
  const target = new Date(p.y, p.m - 1, p.d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today.getTime();
}

/**
 * Local midnight of the event's calendar day, or null if unparseable.
 * Use for date-range filtering — avoids the `new Date("YYYY-MM-DD")` UTC
 * gotcha (which shifts the day backwards in positive-offset timezones).
 */
export function eventDayStart(date: string): Date | null {
  const p = parseEventDateParts(date);
  return p ? new Date(p.y, p.m - 1, p.d) : null;
}

/**
 * When escrowed funds become eligible for payout: 7 days after the event day.
 * Falls back to 14 days from now when the event date can't be parsed, so a bad
 * value never makes funds payable immediately.
 */
export function payoutEligibleAt(date: string): Date {
  const p = parseEventDateParts(date);
  if (!p) return new Date(Date.now() + 14 * 864e5);
  const payout = new Date(p.y, p.m - 1, p.d);
  payout.setDate(payout.getDate() + 7);
  return payout;
}

export type TimeLeft = {
  days: number;
  hours: number;
  mins: number;
  past: boolean;
};

const HEB_DAYS_FULL = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];
const HEB_MONTHS_FULL = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];
const HEB_MONTHS_SHORT = [
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

/** "יום, D בMonth YYYY" — full Hebrew. Null if the date can't be parsed. */
export function formatHebrewDateLong(date: string): string | null {
  const p = parseEventDateParts(date);
  if (!p) return null;
  const dt = new Date(p.y, p.m - 1, p.d);
  return `${HEB_DAYS_FULL[dt.getDay()]}, ${p.d} ב${HEB_MONTHS_FULL[p.m - 1]} ${p.y}`;
}

/** Weekday + day-of-month + short month, or null. For compact date columns. */
export function hebDatePartsShort(
  date: string,
): { dayOfWeek: string; day: string; month: string } | null {
  const p = parseEventDateParts(date);
  if (!p) return null;
  const dt = new Date(p.y, p.m - 1, p.d);
  return {
    dayOfWeek: HEB_DAYS_FULL[dt.getDay()],
    day: String(p.d),
    month: HEB_MONTHS_SHORT[p.m - 1],
  };
}

/** Countdown breakdown until the event. `past` is true once it has started. */
export function timeUntilEvent(date: string, time?: string): TimeLeft {
  const target = parseEventDate(date, time)?.getTime();
  if (target == null) return { days: 0, hours: 0, mins: 0, past: false };
  let diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, past: true };
  const days = Math.floor(diff / 86400e3);
  diff -= days * 86400e3;
  const hours = Math.floor(diff / 3600e3);
  diff -= hours * 3600e3;
  const mins = Math.floor(diff / 60e3);
  return { days, hours, mins, past: false };
}
