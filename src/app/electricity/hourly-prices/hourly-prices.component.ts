import { Component, computed, input, signal } from '@angular/core';
import { HourlyPriceDto, PriceCategory } from '../../shared/models/price.model';
import { dayOffset, formatClock, formatDate, formatPrice } from '../../shared/format/format';
import { PRICE_CATEGORY_TEXT } from '../../shared/format/price-category';

interface HourRow {
  start: string;
  hours: string;
  price: string;
  category: string;
  tone: string;
  isNow: boolean;
  /** milloin.xyz's forecast, not a published price */
  estimate: boolean;
}

interface DayTable {
  title: string;
  date: string;
  /** Every hour of the day is an estimate */
  estimate: boolean;
  rows: HourRow[];
}

const DAY_TITLES = ['Tänään', 'Huomenna', 'Ylihuomenna'];

const weekdayFormat = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', weekday: 'long' });

/** Tänään, Huomenna, Ylihuomenna, then the weekday, e.g. Lauantai */
function dayTitle(offset: number, date: Date): string {
  const weekday = weekdayFormat.format(date);
  return DAY_TITLES[offset] ?? weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

/** Dot color of each price category, matching the price box */
const PRICE_TONE: Record<PriceCategory, string> = {
  VERY_CHEAP: 'very-cheap',
  CHEAP: 'cheap',
  NORMAL: 'normal',
  EXPENSIVE: 'expensive',
  VERY_EXPENSIVE: 'very-expensive',
};

/**
 * Hourly spot prices as text, one table per day: today from the current hour
 * and tomorrow once its prices are published. Search engines read these, and
 * they match searches like "sähkön hinta tänään" and "…huomenna". Estimated
 * hours (milloin.xyz's forecast) follow in grey, behind one button.
 */
@Component({
  selector: 'app-hourly-prices',
  templateUrl: './hourly-prices.component.html',
  styleUrl: './hourly-prices.component.scss',
})
export class HourlyPricesComponent {
  readonly hours = input.required<HourlyPriceDto[]>();
  readonly now = input.required<Date>();

  /** Estimated hours, shown once the visitor opens them */
  readonly estimates = computed(() => this.hours().filter((hour) => hour.estimate).length);

  readonly showEstimates = signal(false);

  toggleEstimates(): void {
    this.showEstimates.update((show) => !show);
  }

  readonly days = computed<DayTable[]>(() => {
    const now = this.now();
    const nowMs = now.getTime();
    const byDay = new Map<number, HourlyPriceDto[]>();
    for (const hour of this.hours()) {
      const offset = dayOffset(hour.startTime, now);
      byDay.set(offset, [...(byDay.get(offset) ?? []), hour]);
    }
    return [...byDay.entries()].map(([offset, hours]) => {
      const first = new Date(hours[0].startTime);
      return {
        title: dayTitle(offset, first),
        date: formatDate(first),
        estimate: hours.every((hour) => hour.estimate),
        rows: hours.map((hour) => ({
          start: hour.startTime,
          hours: `${formatClock(hour.startTime)}–${formatClock(hour.endTime)}`,
          price: formatPrice(hour.priceAvg),
          category: PRICE_CATEGORY_TEXT[hour.priceCategory] ?? PRICE_CATEGORY_TEXT.NORMAL,
          tone: PRICE_TONE[hour.priceCategory] ?? PRICE_TONE.NORMAL,
          isNow: Date.parse(hour.startTime) <= nowMs && nowMs < Date.parse(hour.endTime),
          estimate: !!hour.estimate,
        })),
      };
    });
  });
}
