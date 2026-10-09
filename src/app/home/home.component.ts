import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
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
import { PriceCategory } from '../shared/models/price.model';
import { OverviewService } from '../shared/services/overview.service';
import { initialNow } from '../shared/render-time';
import { resourceErrorMessage } from '../shared/resource-error';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { SaunaService } from '../sauna/sauna.service';
import { cents, hourClock, planSauna } from '../sauna/sauna-plan';
import { recommendDelay } from '../wash-laundry/laundry-recommendation';
import { WashLaundryService } from '../wash-laundry/wash-laundry.service';

/** Color of the current price box, by price category */
const PRICE_TONE: Record<PriceCategory, string> = {
  VERY_CHEAP: 'very-cheap',
  CHEAP: 'cheap',
  NORMAL: 'normal',
  EXPENSIVE: 'expensive',
  VERY_EXPENSIVE: 'very-expensive',
};

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
  imports: [NgTemplateOutlet, RouterLink, HourlyChartComponent, IconComponent, SpinnerComponent, TrendTilesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly overviewService = inject(OverviewService);
  private readonly washLaundryService = inject(WashLaundryService);
  private readonly chargeEvService = inject(ChargeEvService);
  private readonly saunaService = inject(SaunaService);

  readonly paths = APP_NAVIGATION_PATHS;
  readonly now = signal(initialNow());

  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });
  readonly laundry = rxResource({ stream: () => this.washLaundryService.getOptimalSchedule() });
  readonly ev = rxResource({ stream: () => this.chargeEvService.getOptimalWindows() });
  readonly sauna = rxResource({ stream: () => this.saunaService.getStarts() });

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

  /** Color of the current price box; neutral while loading or after an error */
  readonly tone = computed(() => {
    const category = this.overviewData()?.current.priceCategory;
    return (category && PRICE_TONE[category]) ?? PRICE_TONE.NORMAL;
  });

  /** Hourly prices from the current hour on; drops hours that ended since loading */
  readonly upcoming = computed(() => {
    const now = this.now().getTime();
    return (this.overviewData()?.upcomingHours ?? []).filter((hour) => Date.parse(hour.endTime) > now);
  });

  readonly laundryAnswer = computed<Answer | undefined>(() => {
    const delays = this.laundry.hasValue() ? this.laundry.value().startDelays : [];
    const recommendation = recommendDelay(delays);
    if (!recommendation) return undefined;
    const { recommended, cheapest } = recommendation;

    const price = `${formatNumber(recommended.costCents, 1)} snt`;
    if (recommended.delayHours === 0) {
      const detail = cheapest !== recommended ? 'odottaminen ei kannata' : 'nyt on halvinta';
      return { value: 'Nyt', short: 'heti', detail, price, highlight: true };
    }
    const start = new Date(this.now().getTime() + recommended.delayHours * HOUR_MS);
    return {
      value: `+${recommended.delayHours} h`,
      short: 'ajastus',
      detail: `ajastus, käynnistyy ${formatClock(start)}`,
      price,
      highlight: true,
    };
  });

  readonly evAnswer = computed<Answer | undefined>(() => {
    const schedule = this.ev.hasValue() ? this.ev.value() : undefined;

    const window = schedule?.windows[0];
    if (!window) return undefined;
    const costEuros = (window.priceAvg * (schedule.energyKwh ?? 0)) / 100;
    const day = formatDay(window.startTime, this.now());
    return {
      value: formatWindow(window.startTime, window.endTime),
      short: day,
      detail: day,
      price: `${formatNumber(costEuros, 2)} €`,
      highlight: false,
    };
  });

  /** The sauna page's default answer: the cheapest afternoon start today */
  readonly saunaAnswer = computed<Answer | undefined>(() => {
    const plan = this.sauna.hasValue() ? planSauna(this.sauna.value(), this.now(), 0, 'pm') : undefined;
    if (!plan) return undefined;
    const day = plan.day === 0 ? 'tänään' : 'huomenna';
    const price = `${cents(plan.best.window.costCents)} snt`;
    return { value: hourClock(plan.best.hour), short: day, detail: day, price, highlight: false };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Browser only: the clock and reloading when the tab comes back
    afterNextRender(() => {
      this.now.set(new Date());
      const tick = setInterval(() => this.now.set(new Date()), 30 * 1000);
      destroyRef.onDestroy(() => clearInterval(tick));

      const onVisible = () => {
        if (document.visibilityState === 'visible' && Date.now() - this.loadedAt > STALE_AFTER_MS) {
          this.reload();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
    });
  }

  reload(): void {
    this.loadedAt = Date.now();
    this.now.set(new Date());
    this.overview.reload();
    this.laundry.reload();
    this.ev.reload();
    this.sauna.reload();
  }

  readonly errorMessage = resourceErrorMessage;
}
