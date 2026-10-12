import { Component, computed, input } from '@angular/core';
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
}

interface DayTable {
  title: string;
  date: string;
  rows: HourRow[];
}

const DAY_TITLES = ['Tänään', 'Huomenna'];

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
 * they match searches like "sähkön hinta tänään" and "…huomenna".
 */
@Component({
  selector: 'app-hourly-prices',
  templateUrl: './hourly-prices.component.html',
  styleUrl: './hourly-prices.component.scss',
})
export class HourlyPricesComponent {
  readonly hours = input.required<HourlyPriceDto[]>();
  readonly now = input.required<Date>();

  readonly days = computed<DayTable[]>(() => {
    const now = this.now();
    const nowMs = now.getTime();
    return DAY_TITLES.map((title, offset) => {
      const hours = this.hours().filter((hour) => dayOffset(hour.startTime, now) === offset);
      return {
        title,
        date: hours.length > 0 ? formatDate(new Date(hours[0].startTime)) : '',
        rows: hours.map((hour) => ({
          start: hour.startTime,
          hours: `${formatClock(hour.startTime)}–${formatClock(hour.endTime)}`,
          price: formatPrice(hour.priceAvg),
          category: PRICE_CATEGORY_TEXT[hour.priceCategory] ?? PRICE_CATEGORY_TEXT.NORMAL,
          tone: PRICE_TONE[hour.priceCategory] ?? PRICE_TONE.NORMAL,
          isNow: Date.parse(hour.startTime) <= nowMs && nowMs < Date.parse(hour.endTime),
        })),
      };
    }).filter((day) => day.rows.length > 0);
  });
}
