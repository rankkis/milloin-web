import { dayOffset, formatClock, formatNumber } from '../shared/format/format';
import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';

export type SaunaDay = 0 | 1;
export type SaunaPart = 'day' | 'evening' | 'any';

/** First and last hour the heater may be switched on, Finnish time */
export const PART_HOURS: Record<SaunaPart, [number, number]> = {
  day: [6, 16],
  evening: [17, 21],
  any: [0, 23],
};

export const DAYS: SaunaDay[] = [0, 1];
export const PARTS: SaunaPart[] = ['day', 'evening', 'any'];

/** The time of day tried first, then the others in this order */
const PART_FALLBACK: SaunaPart[] = ['evening', 'day', 'any'];

/** Another day is suggested when it is at least this many cents cheaper */
const OTHER_DAY_MIN_SAVING_CENTS = 1;

/** A start hour of a day; window is missing when its prices are not published yet */
export interface SaunaStart {
  hour: number;
  window?: StartOffsetWindowDto & { costCents: number };
}

export interface SaunaPlan {
  day: SaunaDay;
  part: SaunaPart;
  starts: SaunaStart[];
  best: SaunaStart & { window: NonNullable<SaunaStart['window']> };
  worst: SaunaStart & { window: NonNullable<SaunaStart['window']> };
  /** Today's time of day is over, so tomorrow is shown without the visitor choosing it */
  autoTomorrow: boolean;
}

type Priced = SaunaPlan['best'];

const isPriced = (start: SaunaStart): start is Priced => start.window !== undefined;

/** Start hours of a day and time of day, from the next full hour on, with their windows */
export function saunaStarts(
  response: OptimalWindowsDto,
  now: Date,
  day: SaunaDay,
  part: SaunaPart,
): SaunaStart[] {
  const byHour = new Map<number, SaunaStart['window']>();
  for (const window of response.startOffsets ?? []) {
    if (window.costCents === undefined || dayOffset(window.startTime, now) !== day) continue;
    byHour.set(Number(formatClock(window.startTime).slice(0, 2)), { ...window, costCents: window.costCents });
  }

  const nowHour = Number(formatClock(now).slice(0, 2));
  const [first, last] = PART_HOURS[part];
  const starts: SaunaStart[] = [];
  for (let hour = first; hour <= last; hour++) {
    if (day === 0 && hour <= nowHour) continue;
    starts.push({ hour, window: byHour.get(hour) });
  }
  return starts;
}

const cheapest = (starts: Priced[]): Priced =>
  starts.reduce((best, start) => (start.window.costCents < best.window.costCents ? start : best));

/** Whether a day and time of day has at least one start with a known price */
export function hasPrices(response: OptimalWindowsDto, now: Date, day: SaunaDay, part: SaunaPart): boolean {
  return saunaStarts(response, now, day, part).some(isPriced);
}

export function dayHasPrices(response: OptimalWindowsDto, now: Date, day: SaunaDay): boolean {
  return PARTS.some((part) => hasPrices(response, now, day, part));
}

/**
 * The cheapest start of the chosen day and time of day. Without a chosen
 * day it is today, or tomorrow when today's time of day is over. A choice
 * without prices falls back to today, then to the evening, the day and any
 * time. Undefined when no start has a price.
 */
export function planSauna(
  response: OptimalWindowsDto,
  now: Date,
  wantedDay: SaunaDay | undefined,
  wantedPart: SaunaPart,
): SaunaPlan | undefined {
  const autoTomorrow =
    wantedDay === undefined &&
    !hasPrices(response, now, 0, wantedPart) &&
    hasPrices(response, now, 1, wantedPart);
  const day = [autoTomorrow ? 1 : (wantedDay ?? 0), 0, 1].find((d): d is SaunaDay =>
    dayHasPrices(response, now, d as SaunaDay),
  );
  if (day === undefined) return undefined;
  const part = [wantedPart, ...PART_FALLBACK].find((p) => hasPrices(response, now, day, p))!;

  const starts = saunaStarts(response, now, day, part);
  const priced = starts.filter(isPriced);
  const worst = priced.reduce((max, start) => (start.window.costCents > max.window.costCents ? start : max));
  return { day, part, starts, best: cheapest(priced), worst, autoTomorrow };
}

/**
 * The other day's cheapest start at the same time of day, when it is clearly
 * cheaper. Not offered when today's time of day is already over.
 */
export function cheaperOtherDay(response: OptimalWindowsDto, now: Date, plan: SaunaPlan): Priced & { day: SaunaDay } | undefined {
  if (plan.autoTomorrow) return undefined;
  const day: SaunaDay = plan.day === 0 ? 1 : 0;
  const priced = saunaStarts(response, now, day, plan.part).filter(isPriced);
  if (!priced.length) return undefined;
  const best = cheapest(priced);
  return best.window.costCents <= plan.best.window.costCents - OTHER_DAY_MIN_SAVING_CENTS
    ? { ...best, day }
    : undefined;
}

/** The cheapest start still left today, offered when tomorrow is shown because today's time of day is over */
export function laterToday(response: OptimalWindowsDto, now: Date, plan: SaunaPlan): Priced | undefined {
  if (!plan.autoTomorrow) return undefined;
  const priced = saunaStarts(response, now, 0, 'any').filter(isPriced);
  return priced.length ? cheapest(priced) : undefined;
}

/** Hour as a clock time, e.g. 09:00; 24 is midnight at the end of the day */
export const hourClock = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

/** "kello 16:00" or "kello 16:00–21:00" for a run of start hours */
const hourRange = (hours: number[]): string =>
  hours.length > 1
    ? `kello ${hourClock(hours[0])}–${hourClock(hours[hours.length - 1])}`
    : `kello ${hourClock(hours[0])}`;

/**
 * Why some starts or a whole day have no price yet, or undefined when
 * everything shown has one.
 */
export function missingPricesNotice(
  response: OptimalWindowsDto,
  now: Date,
  plan: SaunaPlan,
): string | undefined {
  const missing = plan.starts.filter((start) => !start.window).map((start) => start.hour);
  const pricesEnd = new Date(response.latestEnd);
  const endDay = dayOffset(pricesEnd, now);
  const endsAtMidnight = formatClock(pricesEnd) === '00:00';

  if (missing.length) {
    const starts = `${hourRange(missing)} alkavien vuorojen hintaa ei voi vielä laskea.`;
    if (!endsAtMidnight) {
      const whose = endDay === 0 ? 'Tämän päivän' : 'Huomisen';
      return (
        `${whose} hinnat ovat tiedossa vain kello ${formatClock(pricesEnd)} asti, joten ${starts} ` +
        'Puuttuvat hinnat päivittyvät tähän, kun ne julkaistaan.'
      );
    }
    const next =
      plan.day === 0 ? 'Huomisen hinnat julkaistaan' : 'Ylihuomisen hinnat julkaistaan huomenna';
    return `Sauna jatkuisi yli puolenyön, joten ${starts} ${next} noin kello 14.`;
  }

  if (!dayHasPrices(response, now, 1)) {
    return 'Huomisen hinnat julkaistaan noin kello 14. Silloin voit verrata, onko huominen halvempi.';
  }
  if (plan.autoTomorrow) {
    const whose = plan.part === 'day' ? 'Tämän päivän' : 'Tämän illan';
    return `${whose} saunavuorot ovat jo ohi, joten näytämme huomisen.`;
  }
  return undefined;
}

/** Short note on the Huomenna button when tomorrow's prices are missing or partial */
export function tomorrowNote(response: OptimalWindowsDto, now: Date): string | undefined {
  if (!dayHasPrices(response, now, 1)) return 'hinnat noin klo 14';
  const pricesEnd = new Date(response.latestEnd);
  if (dayOffset(pricesEnd, now) === 1 && formatClock(pricesEnd) !== '00:00') {
    return `hinnat klo ${formatClock(pricesEnd)} asti`;
  }
  return undefined;
}

/** Cents with one decimal, e.g. 39,7 */
export const cents = (value: number): string => formatNumber(value, 1);
