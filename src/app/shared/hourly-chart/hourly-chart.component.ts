import { Component, computed, input, signal } from '@angular/core';
import { HourlyPriceDto } from '../models/price.model';
import { formatClock, formatPrice, formatWeekday, formatWindow, isSameDay } from '../format/format';

type BarState = 'current' | 'window' | 'future';
type TipAlign = 'start' | 'center' | 'end';

interface Bar {
  /** Bar height as a percentage of the plot */
  height: number;
  state: BarState;
  tip: string;
  tipAlign: TipAlign;
}

interface Marker {
  /** Distance from the left edge as a percentage of the plot */
  left: number;
  label: string;
  time: string;
  /** False when the label would collide with the start or end label */
  showLabel: boolean;
}

/** Minimum bar height so free and negative hours still show */
const MIN_HEIGHT_PCT = 2;
/** Hours from now that get a dashed marker */
const MARKER_HOURS = [6, 12, 24];
/** A gridline every this many c/kWh */
const GRID_STEP = 10;
/** The scale reaches at least this many c/kWh so low prices look low */
const MIN_SCALE = 10;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Hourly price bars from the current hour onwards, scaled to the highest
 * price but at least 10 c/kWh, with gridlines every 10 c/kWh, dashed
 * markers at +6, +12 and +24 hours and a tooltip on hover or tap. The
 * first hour is the current one.
 */
@Component({
  selector: 'app-hourly-chart',
  templateUrl: './hourly-chart.component.html',
  styleUrl: './hourly-chart.component.scss',
})
export class HourlyChartComponent {
  /** Hourly prices, starting with the current hour */
  readonly hours = input.required<HourlyPriceDto[]>();
  readonly now = input.required<Date>();
  /** Window to show in the accent color, e.g. the cheapest charging time */
  readonly highlight = input<{ startTime: string; endTime: string }>();
  /** Chart heading; defaults to the range, e.g. Nyt → to 23:00 */
  readonly heading = input<string>();

  /** Index of the bar under the pointer */
  readonly hovered = signal<number | null>(null);

  /** Top of the scale: the highest price, at least MIN_SCALE */
  private readonly max = computed(() =>
    Math.max(...this.hours().map((hour) => hour.priceAvg), MIN_SCALE),
  );

  readonly end = computed(() => {
    const hours = this.hours();
    const last = hours[hours.length - 1];
    return last && { weekday: formatWeekday(last.startTime), time: formatClock(last.startTime) };
  });

  readonly title = computed(() => {
    const end = this.end();
    return this.heading() ?? (end ? `Nyt → ${end.weekday} ${end.time}` : 'Nyt');
  });

  readonly bars = computed<Bar[]>(() => {
    const hours = this.hours();
    const now = this.now();
    const max = this.max();
    const highlight = this.highlight();
    const windowStart = highlight ? Date.parse(highlight.startTime) : NaN;
    const windowEnd = highlight ? Date.parse(highlight.endTime) : NaN;

    return hours.map((hour, index) => {
      const start = Date.parse(hour.startTime);
      const end = Date.parse(hour.endTime);
      const pct = (Math.max(hour.priceAvg, 0) / max) * 100;

      let state: BarState = 'future';
      if (start < windowEnd && end > windowStart) state = 'window';
      else if (index === 0) state = 'current';

      const day = isSameDay(hour.startTime, now) ? '' : `${formatWeekday(hour.startTime)} `;
      const position = index / hours.length;
      return {
        height: Math.max(pct, MIN_HEIGHT_PCT),
        state,
        tip: `${day}${formatWindow(hour.startTime, hour.endTime)} · ${formatPrice(hour.priceAvg)} c/kWh`,
        tipAlign: position < 0.2 ? 'start' : position > 0.8 ? 'end' : 'center',
      };
    });
  });

  /** Baseline and a line at every 10 c/kWh up to the top of the scale */
  readonly gridlines = computed(() => {
    const max = this.max();
    const lines = [{ value: '0', bottom: 0 }];
    for (let value = GRID_STEP; value <= max; value += GRID_STEP) {
      lines.push({ value: String(value), bottom: (value / max) * 100 });
    }
    return lines;
  });

  readonly markers = computed<Marker[]>(() => {
    const hours = this.hours();
    if (hours.length === 0) return [];
    const first = Date.parse(hours[0].startTime);

    return MARKER_HOURS.filter((offset) => offset < hours.length).map((offset) => {
      const left = (offset / hours.length) * 100;
      return {
        left,
        label: `+${offset} h`,
        time: formatClock(new Date(first + offset * HOUR_MS)),
        showLabel: left >= 12 && left <= 85,
      };
    });
  });

  readonly startTime = computed(() => formatClock(this.now()));

  /** Screen reader summary: cheapest and most expensive hour */
  readonly summary = computed(() => {
    const hours = this.hours();
    if (hours.length === 0) return `${this.title()}: hintoja ei ole saatavilla`;

    const byPrice = [...hours].sort((a, b) => a.priceAvg - b.priceAvg);
    const cheapest = byPrice[0];
    const priciest = byPrice[byPrice.length - 1];
    return (
      `${this.title()}. Halvin tunti ${formatClock(cheapest.startTime)}, ` +
      `${formatPrice(cheapest.priceAvg)} c/kWh. Kallein tunti ` +
      `${formatClock(priciest.startTime)}, ${formatPrice(priciest.priceAvg)} c/kWh.`
    );
  });

  /** Shows the tooltip of the bar under a mouse, pen or finger */
  point(event: PointerEvent, plot: HTMLElement): void {
    const count = this.hours().length;
    if (count === 0) return;
    const rect = plot.getBoundingClientRect();
    const index = Math.floor(((event.clientX - rect.left) / rect.width) * count);
    this.hovered.set(Math.min(Math.max(index, 0), count - 1));
  }

  /** Hides the tooltip when the mouse leaves; a tapped tooltip stays */
  leave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.hovered.set(null);
  }
}
