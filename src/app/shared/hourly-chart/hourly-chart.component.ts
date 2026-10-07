import { Component, computed, input } from '@angular/core';
import { HourlyPriceDto } from '../models/price.model';
import { formatClock, formatPrice } from '../format/format';

type BarState = 'past' | 'current' | 'window' | 'future';

interface Bar {
  height: string;
  state: BarState;
}

/** Minimum bar height so free and negative hours still show */
const MIN_HEIGHT_PCT = 2;

/**
 * Bar chart of today's hourly prices. Past hours are dimmed, the current
 * hour is highlighted and hours in the highlighted window use the accent.
 */
@Component({
  selector: 'app-hourly-chart',
  templateUrl: './hourly-chart.component.html',
  styleUrl: './hourly-chart.component.scss',
})
export class HourlyChartComponent {
  readonly hours = input.required<HourlyPriceDto[]>();
  readonly now = input.required<Date>();
  /** Window to highlight, e.g. the cheapest 2 hours */
  readonly highlight = input<{ startTime: string; endTime: string }>();
  /** Chart name for screen readers */
  readonly title = input('Tänään tunneittain');
  /** Labels spread evenly under the bars */
  readonly axisLabels = input(['00', '06', '12', '18', '24']);

  readonly bars = computed<Bar[]>(() => {
    const hours = this.hours();
    const now = this.now().getTime();
    const highlight = this.highlight();
    const windowStart = highlight ? Date.parse(highlight.startTime) : NaN;
    const windowEnd = highlight ? Date.parse(highlight.endTime) : NaN;
    const max = Math.max(...hours.map((hour) => hour.priceAvg), 0);

    return hours.map((hour) => {
      const start = Date.parse(hour.startTime);
      const end = Date.parse(hour.endTime);
      const pct = max > 0 ? (Math.max(hour.priceAvg, 0) / max) * 100 : 0;

      let state: BarState = 'future';
      if (start < windowEnd && end > windowStart) state = 'window';
      else if (end <= now) state = 'past';
      else if (start <= now) state = 'current';

      return { height: `${Math.max(pct, MIN_HEIGHT_PCT)}%`, state };
    });
  });

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
}
