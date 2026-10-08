import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnswerHeaderComponent } from '../shared/answer-header/answer-header.component';
import { IconComponent } from '../shared/icon/icon.component';
import { formatClock, formatNumber, formatPrice } from '../shared/format/format';
import { PRICE_CATEGORY_TEXT } from '../shared/format/price-category';
import { StartDelayDto } from '../shared/models/price.model';
import { resourceErrorMessage } from '../shared/resource-error';
import { OverviewService } from '../shared/services/overview.service';
import { WashLaundryService } from './wash-laundry.service';

const HOUR_MS = 60 * 60 * 1000;
/** Height of the tallest cost bar in pixels */
const BAR_MAX_PX = 64;
const BAR_MIN_PX = 4;

/** "Aseta koneen ajastus ___" for each delay */
const DELAY_WORDS: Record<number, string> = {
  1: 'yhteen tuntiin',
  2: 'kahteen tuntiin',
  3: 'kolmeen tuntiin',
  4: 'neljään tuntiin',
  5: 'viiteen tuntiin',
};

interface DelayOption {
  label: string;
  cost: string;
  barPx: number;
  isBest: boolean;
  ariaLabel: string;
}

@Component({
  selector: 'app-wash-laundry',
  imports: [AnswerHeaderComponent, IconComponent],
  templateUrl: './wash-laundry.component.html',
  styleUrl: './wash-laundry.component.scss',
})
export class WashLaundryComponent {
  private readonly washLaundryService = inject(WashLaundryService);
  private readonly overviewService = inject(OverviewService);

  readonly schedule = rxResource({ stream: () => this.washLaundryService.getOptimalSchedule() });
  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });

  /** When the answer was calculated; start and end clock times count from here */
  readonly now = signal(new Date());

  readonly errorMessage = resourceErrorMessage;

  readonly currentPrice = computed(() =>
    this.overview.hasValue() ? formatPrice(this.overview.value().current.price) : undefined,
  );

  private readonly delays = computed<StartDelayDto[]>(() =>
    this.schedule.hasValue() ? (this.schedule.value().startDelays ?? []) : [],
  );

  readonly answer = computed(() => {
    const best = this.delays().find((delay) => delay.isBest);
    if (!best) return undefined;

    const start = new Date(this.now().getTime() + best.delayHours * HOUR_MS);
    const periodHours = this.schedule.value()?.defaults.periodHours ?? 2;
    const end = new Date(start.getTime() + periodHours * HOUR_MS);
    const isNow = best.delayHours === 0;

    return {
      value: isNow ? 'Nyt' : `+${best.delayHours} h`,
      sentence: isNow
        ? 'Käynnistä kone heti, nyt on halvinta.'
        : `Aseta koneen ajastus ${DELAY_WORDS[best.delayHours] ?? `${best.delayHours} tuntiin`}.`,
      times: `käynnistyy ${formatClock(start)} · valmis ${formatClock(end)}`,
    };
  });

  readonly options = computed<DelayOption[]>(() => {
    const delays = this.delays();
    const maxCost = Math.max(...delays.map((delay) => delay.costCents), 0);

    return delays.map((delay) => {
      const label = delay.delayHours === 0 ? 'Nyt' : `+${delay.delayHours}`;
      const cost = formatNumber(delay.costCents, 1);
      const ratio = maxCost > 0 ? Math.max(delay.costCents, 0) / maxCost : 0;
      return {
        label,
        cost,
        barPx: Math.max(Math.round(ratio * BAR_MAX_PX), BAR_MIN_PX),
        isBest: delay.isBest,
        ariaLabel:
          `${delay.delayHours === 0 ? 'Nyt' : `${delay.delayHours} tunnin päästä`}: ${cost} senttiä` +
          (delay.isBest ? ', halvin' : ''),
      };
    });
  });

  readonly stats = computed(() => {
    const delays = this.delays();
    const best = delays.find((delay) => delay.isBest);
    const now = delays.find((delay) => delay.delayHours === 0);
    if (!best) return undefined;

    const savedCents = now ? now.costCents - best.costCents : 0;
    const savedPct = now && now.costCents > 0 ? Math.round((savedCents / now.costCents) * 100) : 0;

    return {
      cost: formatNumber(best.costCents, 1),
      savingPct: savedPct > 0 ? `−${savedPct} %` : '0 %',
      saving: savedCents > 0 ? `${formatNumber(savedCents, 1)} senttiä` : 'nyt on halvin',
      spot: formatPrice(best.priceAvg),
      category: PRICE_CATEGORY_TEXT[best.priceCategory]?.toLowerCase(),
    };
  });

  readonly basis = computed(() => {
    const defaults = this.schedule.hasValue() ? this.schedule.value().defaults : undefined;
    if (!defaults) return undefined;
    const kwh = formatNumber(defaults.powerConsumptionKwh, defaults.powerConsumptionKwh % 1 ? 1 : 0);
    return `Laskettu ${defaults.periodHours} tunnin ohjelmalle ja ${kwh} kWh:n kulutukselle.`;
  });

  refresh(): void {
    this.now.set(new Date());
    this.schedule.reload();
    this.overview.reload();
  }
}
