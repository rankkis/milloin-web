import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
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
import { PRICE_CATEGORY_TEXT } from '../shared/format/price-category';
import { initialNow } from '../shared/render-time';
import { resourceErrorMessage } from '../shared/resource-error';
import { OverviewService } from '../shared/services/overview.service';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { TARIFF_NOTE, costFormula, formatEuros as euros, totalCents } from '../shared/tariffs/tariffs';
import { ChargeEvService } from './charge-ev.service';

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

@Component({
  selector: 'app-charge-ev',
  imports: [AnswerHeaderComponent, HourlyChartComponent, SpinnerComponent],
  templateUrl: './charge-ev.component.html',
  styleUrl: './charge-ev.component.scss',
})
export class ChargeEvComponent {
  private readonly chargeEvService = inject(ChargeEvService);
  private readonly overviewService = inject(OverviewService);

  readonly schedule = rxResource({ stream: () => this.chargeEvService.getOptimalWindows() });
  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });

  readonly now = signal(initialNow());

  readonly errorMessage = resourceErrorMessage;

  readonly currentPrice = computed(() =>
    this.overview.hasValue() ? formatPrice(this.overview.value().current.price) : undefined,
  );

  /** Cheapest charging window that starts by 04:00 next morning, so the car is charged at 08:00 */
  readonly bestWindow = computed(() =>
    this.schedule.hasValue() ? this.schedule.value().windows[0] : undefined,
  );

  private readonly kwh = computed(() => (this.schedule.hasValue() ? (this.schedule.value().energyKwh ?? 0) : 0));

  /** Total cost in cents of a window: energy plus transfer, tax and margin */
  private costCents(priceAvg: number): number {
    return totalCents(priceAvg * this.kwh(), this.kwh());
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

  /** Every published hour from the current one */
  readonly chartHours = computed(() => {
    if (!this.overview.hasValue()) return [];
    const now = this.now().getTime();
    return (this.overview.value().upcomingHours ?? []).filter((hour) => Date.parse(hour.endTime) > now);
  });

  /** Cheapest charging window in all published prices, whenever it ends */
  readonly bestAvailable = computed(() => {
    const best = this.schedule.hasValue() ? this.schedule.value().bestAvailable : undefined;
    if (!best) return undefined;
    return {
      window: formatWindow(best.startTime, best.endTime),
      note: `${formatDay(best.startTime, this.now())} · ${euros(this.costCents(best.priceAvg))}`,
    };
  });

  readonly stats = computed(() => {
    const best = this.bestWindow();
    if (!best || !this.schedule.hasValue()) return undefined;

    const schedule = this.schedule.value();
    const bestCost = this.costCents(best.priceAvg);
    const nowCost = schedule.startNow ? this.costCents(schedule.startNow.priceAvg) : bestCost;
    const saved = nowCost - bestCost;
    const savedPct = nowCost > 0 ? Math.round((saved / nowCost) * 100) : 0;

    return {
      cost: euros(bestCost),
      kwh: `${formatNumber(schedule.energyKwh ?? 0, 0)} kWh`,
      savingPct: savedPct > 0 ? `−${savedPct} %` : '0 %',
      saving: saved > 0 ? euros(saved) : 'nyt on halvin',
      spot: formatPrice(best.priceAvg),
      category: PRICE_CATEGORY_TEXT[best.priceCategory]?.toLowerCase(),
    };
  });

  readonly comparison = computed(() => {
    const best = this.bestWindow();
    if (!best || !this.schedule.hasValue()) return [];

    const { startNow } = this.schedule.value();
    const rows = [
      {
        label: capitalize(formatDay(best.startTime, this.now())),
        window: formatWindow(best.startTime, best.endTime),
        cost: euros(this.costCents(best.priceAvg)),
        isBest: true,
      },
    ];
    if (startNow) {
      rows.push({
        label: 'Jos lataat heti',
        window: formatWindow(startNow.startTime, startNow.endTime),
        cost: euros(this.costCents(startNow.priceAvg)),
        isBest: false,
      });
    }
    return rows;
  });

  readonly basis = computed(() => {
    const schedule = this.schedule.hasValue() ? this.schedule.value() : undefined;
    if (!schedule) return undefined;
    const charge =
      `Laskettu ${formatNumber(schedule.durationHours, 0)} tunnin lataukselle ja ` +
      `${formatNumber(schedule.energyKwh ?? 0, 0)} kWh:n energialle`;
    const readyBy = formatClock(schedule.readyBy);
    return schedule.fitsReadyBy
      ? `${charge}, joka on valmis viimeistään kello ${readyBy}.`
      : `${charge}. Kello ${readyBy} mennessä valmista latausta ei löydy julkaistuista hinnoista, ` +
          'joten vastaus on halvin julkaistu jakso.';
  });

  /** How the cheapest window's price is calculated */
  readonly formula = computed(() => {
    const best = this.bestWindow();
    return best && costFormula(best.priceAvg * this.kwh(), this.kwh(), '€');
  });

  readonly tariffNote = TARIFF_NOTE;

  constructor() {
    // A server-rendered page shows the server's time until the browser takes over
    afterNextRender(() => this.now.set(new Date()));
  }

  refresh(): void {
    this.now.set(new Date());
    this.schedule.reload();
    this.overview.reload();
  }
}
