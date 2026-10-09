/**
 * Finnish formatting for prices, clock times and durations.
 * Clock times are always shown in Finnish time, wherever the user is.
 */

const TIME_ZONE = 'Europe/Helsinki';
const MINUTE_MS = 60 * 1000;

const partsFormat = new Intl.DateTimeFormat('fi-FI', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

const weekdayFormat = new Intl.DateTimeFormat('fi-FI', {
  timeZone: TIME_ZONE,
  weekday: 'short',
});

interface HelsinkiParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** Calendar date and clock time of an instant in Finnish time */
export function helsinkiParts(date: Date): HelsinkiParts {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
  };
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** Number with a decimal comma, e.g. 4,82 */
export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Price in c/kWh with two decimals, e.g. 4,82 */
export function formatPrice(centsPerKwh: number): string {
  return formatNumber(centsPerKwh, 2);
}

/** Clock time, e.g. 15:00 */
export function formatClock(date: Date | string): string {
  const { hour, minute } = helsinkiParts(new Date(date));
  return `${pad(hour)}:${pad(minute)}`;
}

/** Time window, e.g. 15:00–17:00 */
export function formatWindow(start: Date | string, end: Date | string): string {
  return `${formatClock(start)}–${formatClock(end)}`;
}

/** Weekday abbreviation, e.g. to */
export function formatWeekday(date: Date | string): string {
  return weekdayFormat.format(new Date(date));
}

/** True when both moments fall on the same Finnish calendar day */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  return dayNumber(helsinkiParts(new Date(a))) === dayNumber(helsinkiParts(new Date(b)));
}

/** Weekday and date, e.g. ke 7.10. */
export function formatDate(date: Date): string {
  const { day, month } = helsinkiParts(date);
  return `${weekdayFormat.format(date)} ${day}.${month}.`;
}

/** Time from now until a moment, e.g. 1 h 18 min. Null once it has passed. */
export function formatTimeUntil(target: Date | string, now: Date): string | null {
  const minutes = Math.ceil((new Date(target).getTime() - now.getTime()) / MINUTE_MS);
  if (minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

const dayNumber = ({ year, month, day }: HelsinkiParts): number =>
  Date.UTC(year, month - 1, day) / (24 * 60 * MINUTE_MS);

/** Finnish calendar days from now's day to the moment's day: 0 today, 1 tomorrow */
export function dayOffset(date: Date | string, now: Date): number {
  return dayNumber(helsinkiParts(new Date(date))) - dayNumber(helsinkiParts(now));
}

/**
 * When a window starts, relative to now: nyt, tänään, tänä yönä,
 * ensi yönä or huomenna.
 */
export function formatDay(start: Date | string, now: Date): string {
  const startDate = new Date(start);
  if (startDate.getTime() <= now.getTime()) return 'nyt';

  const startParts = helsinkiParts(startDate);
  const daysAhead = dayNumber(startParts) - dayNumber(helsinkiParts(now));
  const isNight = startParts.hour < 6;

  if (daysAhead === 0) return isNight || startParts.hour >= 22 ? 'tänä yönä' : 'tänään';
  if (daysAhead === 1) return isNight ? 'ensi yönä' : 'huomenna';
  return 'ylihuomenna';
}
