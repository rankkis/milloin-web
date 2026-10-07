import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnswerHeaderComponent } from '../shared/answer-header/answer-header.component';
import { HourlyChartComponent } from '../shared/hourly-chart/hourly-chart.component';
import {
  formatClock,
  formatDay,
  formatNumber,
  formatPrice,
  formatTimeUntil,
  formatWindow,
} from '../shared/format/format';
import { hourlyAverages } from '../shared/format/hourly';
import { PRICE_CATEGORY_TEXT, priceCategoryOf } from '../shared/format/price-category';
import { resourceErrorMessage } from '../shared/resource-error';
import { OverviewService } from '../shared/services/overview.service';
import { ChargeEvService } from './charge-ev.service';

const HOUR_MS = 60 * 60 * 1000;
/** Hours on the chart */
const CHART_HOURS = 24;

const euros = (cents: number): string => `${formatNumber(cents / 100, 2)} €`;
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

@Component({
  selector: 'app-charge-ev',
  imports: [AnswerHeaderComponent, HourlyChartComponent],
  templateUrl: './charge-ev.component.html',
  styleUrl: './charge-ev.component.scss',
})
export class ChargeEvComponent {
  private readonly chargeEvService = inject(ChargeEvService);
  private readonly overviewService = inject(OverviewService);

  readonly schedule = rxResource({ stream: () => this.chargeEvService.getOptimalSchedule() });
  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });

  readonly now = signal(new Date());

  readonly errorMessage = resourceErrorMessage;

  readonly currentPrice = computed(() =>
    this.overview.hasValue() ? formatPrice(this.overview.value().current.price) : undefined,
  );

  /** Cheapest charging window: the next 12 hours, or later if that is cheaper */
  readonly bestWindow = computed(() => {
    if (!this.schedule.hasValue()) return undefined;
    const { next12Hours, extended } = this.schedule.value();
    return extended && extended.priceAvg < next12Hours.priceAvg ? extended : next12Hours;
  });

  /** Energy cost in cents of a window */
  private costCents(priceAvg: number): number {
    const kwh = this.schedule.hasValue() ? this.schedule.value().defaults.powerConsumptionKwh : 0;
    return priceAvg * kwh;
  }

  readonly answer = computed(() => {
    const best = this.bestWindow();
    if (!best) return undefined;

    const now = this.now();
    const until = formatTimeUntil(best.startTime, now);
    const day = formatDay(best.startTime, now);
    return {
      window: formatWindow(best.startTime, best.endTime),
      sentence: until
        ? `Ajasta lataus alkamaan kello ${formatClock(best.startTime)}.`
        : 'Aloita lataus nyt, halvin jakso on käynnissä.',
      when: until ? `${day} · alkaa ${until} päästä` : `käynnissä · päättyy ${formatClock(best.endTime)}`,
    };
  });

  readonly chart = computed(() => {
    const overview = this.overview.hasValue() ? this.overview.value() : undefined;
    if (!overview) return undefined;

    const hours = hourlyAverages(overview.future.pricePoints).slice(0, CHART_HOURS);
    if (hours.length === 0) return undefined;

    // "nyt" under the first bar, then the clock hour at each quarter of the chart
    const first = Date.parse(hours[0].startTime);
    const axisLabels = [
      'nyt',
      ...[1, 2, 3, 4].map((quarter) =>
        formatClock(new Date(first + Math.round((hours.length * quarter) / 4) * HOUR_MS)).slice(0, 2),
      ),
    ];
    return { hours, axisLabels };
  });

  readonly stats = computed(() => {
    const best = this.bestWindow();
    if (!best || !this.schedule.hasValue()) return undefined;

    const schedule = this.schedule.value();
    const bestCost = this.costCents(best.priceAvg);
    const nowCost = this.costCents(schedule.now.priceAvg);
    const saved = nowCost - bestCost;
    const savedPct = nowCost > 0 ? Math.round((saved / nowCost) * 100) : 0;

    return {
      cost: euros(bestCost),
      kwh: `${formatNumber(schedule.defaults.powerConsumptionKwh, 0)} kWh`,
      savingPct: savedPct > 0 ? `−${savedPct} %` : '0 %',
      saving: saved > 0 ? euros(saved) : 'nyt on halvin',
      spot: formatPrice(best.priceAvg),
      category: PRICE_CATEGORY_TEXT[priceCategoryOf(best.priceAvg)].toLowerCase(),
    };
  });

  readonly comparison = computed(() => {
    const best = this.bestWindow();
    if (!best || !this.schedule.hasValue()) return [];

    const schedule = this.schedule.value();
    return [
      {
        label: capitalize(formatDay(best.startTime, this.now())),
        window: formatWindow(best.startTime, best.endTime),
        cost: euros(this.costCents(best.priceAvg)),
        isBest: true,
      },
      {
        label: 'Jos lataat heti',
        window: formatWindow(schedule.now.startTime, schedule.now.endTime),
        cost: euros(this.costCents(schedule.now.priceAvg)),
        isBest: false,
      },
    ];
  });

  readonly basis = computed(() => {
    const defaults = this.schedule.hasValue() ? this.schedule.value().defaults : undefined;
    if (!defaults) return undefined;
    return (
      `Laskettu ${defaults.periodHours} tunnin lataukselle ja ` +
      `${formatNumber(defaults.powerConsumptionKwh, 0)} kWh:n energialle. ` +
      'Hinnat sisältävät arvonlisäveron mutta eivät siirtomaksuja.'
    );
  });

  refresh(): void {
    this.now.set(new Date());
    this.schedule.reload();
    this.overview.reload();
  }
}
