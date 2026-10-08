import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_NAVIGATION_PATHS } from '../app.paths';
import { ChargeEvService } from '../charge-ev/charge-ev.service';
import { HourlyChartComponent } from '../shared/hourly-chart/hourly-chart.component';
import { IconComponent } from '../shared/icon/icon.component';
import { TrendTilesComponent } from '../shared/trend-tiles/trend-tiles.component';
import {
  formatClock,
  formatDate,
  formatDay,
  formatNumber,
  formatPrice,
  formatWindow,
} from '../shared/format/format';
import { PRICE_CATEGORY_TEXT } from '../shared/format/price-category';
import { OverviewService } from '../shared/services/overview.service';
import { resourceErrorMessage } from '../shared/resource-error';
import { WashLaundryService } from '../wash-laundry/wash-laundry.service';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
/** Reload when the page comes back into view with older data than this */
const STALE_AFTER_MS = 15 * MINUTE_MS;

interface Answer {
  value: string;
  /** Shown under the answer on phones */
  short: string;
  /** Shown in its own column on wider screens */
  detail: string;
  price: string;
  highlight: boolean;
}

@Component({
  selector: 'app-home',
  imports: [NgTemplateOutlet, RouterLink, HourlyChartComponent, IconComponent, TrendTilesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly overviewService = inject(OverviewService);
  private readonly washLaundryService = inject(WashLaundryService);
  private readonly chargeEvService = inject(ChargeEvService);

  readonly paths = APP_NAVIGATION_PATHS;
  readonly now = signal(new Date());

  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });
  readonly laundry = rxResource({ stream: () => this.washLaundryService.getOptimalSchedule() });
  readonly ev = rxResource({ stream: () => this.chargeEvService.getOptimalSchedule() });

  private loadedAt = Date.now();

  /** Overview data; undefined while loading or after an error */
  readonly overviewData = computed(() =>
    this.overview.hasValue() ? this.overview.value() : undefined,
  );

  readonly date = computed(() => `${formatDate(this.now())} · ${formatClock(this.now())}`);

  readonly current = computed(() => {
    const current = this.overviewData()?.current;
    return current && {
      price: formatPrice(current.price),
      category: PRICE_CATEGORY_TEXT[current.priceCategory] ?? PRICE_CATEGORY_TEXT.NORMAL,
    };
  });

  /** Hourly prices from the current hour on; drops hours that ended since loading */
  readonly upcoming = computed(() => {
    const now = this.now().getTime();
    return (this.overviewData()?.upcomingHours ?? []).filter((hour) => Date.parse(hour.endTime) > now);
  });

  readonly laundryAnswer = computed<Answer | undefined>(() => {
    const best = (this.laundry.hasValue() ? this.laundry.value() : undefined)?.startDelays?.find((delay) => delay.isBest);
    if (!best) return undefined;

    const price = `${formatNumber(best.costCents, 1)} snt`;
    if (best.delayHours === 0) {
      return { value: 'Nyt', short: 'heti', detail: 'käynnistä heti', price, highlight: true };
    }
    const start = new Date(this.now().getTime() + best.delayHours * HOUR_MS);
    return {
      value: `+${best.delayHours} h`,
      short: 'ajastus',
      detail: `ajastus, käynnistyy ${formatClock(start)}`,
      price,
      highlight: true,
    };
  });

  readonly evAnswer = computed<Answer | undefined>(() => {
    const schedule = this.ev.hasValue() ? this.ev.value() : undefined;
    if (!schedule) return undefined;

    const window =
      schedule.extended && schedule.extended.priceAvg < schedule.next12Hours.priceAvg
        ? schedule.extended
        : schedule.next12Hours;
    const costEuros = (window.priceAvg * schedule.defaults.powerConsumptionKwh) / 100;
    const day = formatDay(window.startTime, this.now());
    return {
      value: formatWindow(window.startTime, window.endTime),
      short: day,
      detail: day,
      price: `${formatNumber(costEuros, 2)} €`,
      highlight: false,
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    const tick = setInterval(() => this.now.set(new Date()), 30 * 1000);
    destroyRef.onDestroy(() => clearInterval(tick));

    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - this.loadedAt > STALE_AFTER_MS) {
        this.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  reload(): void {
    this.loadedAt = Date.now();
    this.now.set(new Date());
    this.overview.reload();
    this.laundry.reload();
    this.ev.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
