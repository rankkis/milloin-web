import { helsinkiParts } from '../shared/format/format';

/**
 * Finnish banking days. Dates here are calendar days, kept as Date objects at
 * noon UTC so that the weekday and the Finnish date always agree.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A calendar day */
export function calendarDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** Today's date in Finland */
export function finnishToday(now: Date): Date {
  const { year, month, day } = helsinkiParts(now);
  return calendarDay(year, month, day);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Whole days from one calendar day to another */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** Easter Sunday (Gregorian calendar, anonymous algorithm) */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return calendarDay(year, month, day);
}

const key = (date: Date): string => date.toISOString().slice(0, 10);

const holidayCache = new Map<number, Set<string>>();

/**
 * Weekdays Finnish banks are closed: New Year's Day, Epiphany, Good Friday,
 * Easter Monday, May Day, Ascension Day, Midsummer Eve, Independence Day,
 * Christmas Eve, Christmas Day and Boxing Day.
 */
function bankHolidays(year: number): Set<string> {
  let holidays = holidayCache.get(year);
  if (!holidays) {
    const easter = easterSunday(year);
    // Midsummer Eve is the Friday between 19 and 25 June
    const june19 = calendarDay(year, 6, 19);
    const midsummerEve = addDays(june19, (5 - june19.getUTCDay() + 7) % 7);
    holidays = new Set(
      [
        calendarDay(year, 1, 1),
        calendarDay(year, 1, 6),
        addDays(easter, -2),
        addDays(easter, 1),
        calendarDay(year, 5, 1),
        addDays(easter, 39),
        midsummerEve,
        calendarDay(year, 12, 6),
        calendarDay(year, 12, 24),
        calendarDay(year, 12, 25),
        calendarDay(year, 12, 26),
      ].map(key),
    );
    holidayCache.set(year, holidays);
  }
  return holidays;
}

export function isBankingDay(date: Date): boolean {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6 && !bankHolidays(date.getUTCFullYear()).has(key(date));
}

/** The day itself if banks are open, otherwise the banking day before it */
export function bankingDayOnOrBefore(date: Date): Date {
  let day = date;
  while (!isBankingDay(day)) day = addDays(day, -1);
  return day;
}

/** The day itself if banks are open, otherwise the banking day after it */
export function bankingDayOnOrAfter(date: Date): Date {
  let day = date;
  while (!isBankingDay(day)) day = addDays(day, 1);
  return day;
}

/** Last calendar day of a month */
export function lastDayOfMonth(year: number, month: number): Date {
  return calendarDay(year, month + 1, 0);
}
