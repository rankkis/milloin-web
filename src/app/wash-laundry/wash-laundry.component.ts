import { Component, afterNextRender, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnswerHeaderComponent } from '../shared/answer-header/answer-header.component';
import { IconComponent } from '../shared/icon/icon.component';
import { formatClock, formatNumber, formatPrice } from '../shared/format/format';
import { PRICE_CATEGORY_TEXT } from '../shared/format/price-category';
import { StartDelayDto } from '../shared/models/price.model';
import { initialNow } from '../shared/render-time';
import { resourceErrorMessage } from '../shared/resource-error';
import { OverviewService } from '../shared/services/overview.service';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { TARIFF_NOTE, costFormula, formatKwh, totalCents } from '../shared/tariffs/tariffs';
import { RULE_TEXT, recommendDelay } from './laundry-recommendation';
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
  isRecommended: boolean;
  isCheapest: boolean;
  ariaLabel: string;
}

type TipAlign = 'start' | 'center' | 'end';

/** "{k} tunnin päästä", or "tunnin päästä" for one hour */
const inHours = (hours: number) => (hours === 1 ? 'tunnin päästä' : `${hours} tunnin päästä`);

/** Cents with one decimal, e.g. 3,1 */
const cents = (value: number) => formatNumber(value, 1);

@Component({
  selector: 'app-wash-laundry',
  imports: [NgTemplateOutlet, AnswerHeaderComponent, IconComponent, SpinnerComponent],
  templateUrl: './wash-laundry.component.html',
  styleUrl: './wash-laundry.component.scss',
  host: {
    '(document:click)': 'closeTipOutside($event)',
    '(document:keydown.escape)': 'tipOpen.set(false)',
  },
})
export class WashLaundryComponent {
  private readonly washLaundryService = inject(WashLaundryService);
  private readonly overviewService = inject(OverviewService);

  readonly schedule = rxResource({ stream: () => this.washLaundryService.getOptimalSchedule() });
  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });

  /** When the answer was calculated; start and end clock times count from here */
  readonly now = signal(initialNow());

  readonly errorMessage = resourceErrorMessage;
  readonly ruleText = RULE_TEXT;

  /** Whether the rule tooltip of the recommended option is shown */
  readonly tipOpen = signal(false);

  private readonly tipTrigger = viewChild<ElementRef<HTMLElement>>('tipTrigger');

  readonly currentPrice = computed(() =>
    this.overview.hasValue() ? formatPrice(this.overview.value().current.price) : undefined,
  );

  private readonly delays = computed<StartDelayDto[]>(() =>
    [...(this.schedule.hasValue() ? this.schedule.value().startDelays : [])].sort(
      (a, b) => a.delayHours - b.delayHours,
    ),
  );

  readonly recommendation = computed(() => recommendDelay(this.delays()));

  private readonly kwh = computed(() => (this.schedule.hasValue() ? this.schedule.value().energyKwh : 0));

  /** Total cost of a start in cents: energy plus transfer, tax and margin */
  private total(delay: StartDelayDto): number {
    return totalCents(delay.costCents, this.kwh());
  }

  readonly answer = computed(() => {
    const recommendation = this.recommendation();
    if (!recommendation) return undefined;
    const { recommended, cheapest, saving, extraSavingIfWaitLonger: diff, hours } = recommendation;

    const start = new Date(this.now().getTime() + recommended.delayHours * HOUR_MS);
    const periodHours = this.schedule.value()?.durationHours ?? 2;
    const end = new Date(start.getTime() + periodHours * HOUR_MS);
    const times = `käynnistyy ${formatClock(start)} · valmis ${formatClock(end)}`;
    const cheaperLater = cheapest !== recommended;

    if (recommended.delayHours === 0) {
      let reason: string | undefined;
      if (!cheaperLater) {
        reason =
          hours > 0
            ? `${hours === 1 ? 'Seuraavan tunnin' : `Seuraavan ${hours} tunnin`} aikana pesu ei tule halvemmaksi.`
            : undefined;
      } else if (diff < 1) {
        reason =
          `Hinta pysyy lähes samana ${hours === 1 ? 'seuraavan tunnin' : `seuraavat ${hours} tuntia`}, ` +
          'joten odottaminen ei kannata.';
      } else {
        reason =
          `Pesu olisi ${inHours(cheapest.delayHours)} ${cents(diff)} senttiä halvempi, ` +
          'mutta niin pieni säästö ei ole odottamisen arvoinen.';
      }
      return { value: 'Nyt', instruction: 'Käynnistä kone nyt.', reason, times };
    }

    let reason = `Säästät ${cents(saving)} senttiä verrattuna heti käynnistämiseen.`;
    if (cheaperLater) {
      reason +=
        ` Pesu olisi ${inHours(cheapest.delayHours)} vielä ${cents(diff)} senttiä halvempi, ` +
        'mutta lisäodotus ei kannata.';
    }
    return {
      value: `+${recommended.delayHours} h`,
      instruction: `Aseta koneen ajastus ${DELAY_WORDS[recommended.delayHours] ?? `${recommended.delayHours} tuntiin`}.`,
      reason,
      times,
    };
  });

  readonly options = computed<DelayOption[]>(() => {
    const delays = this.delays();
    const recommendation = this.recommendation();
    // Bars show the spot energy cost: transfer, tax and margin are the same for every start
    const maxCost = Math.max(...delays.map((delay) => delay.costCents), 0);

    return delays.map((delay) => {
      const label = delay.delayHours === 0 ? 'Nyt' : `+${delay.delayHours}`;
      const cost = cents(this.total(delay));
      const ratio = maxCost > 0 ? Math.max(delay.costCents, 0) / maxCost : 0;
      const isRecommended = delay === recommendation?.recommended;
      const isCheapest = delay === recommendation?.cheapest;
      const roles = [isRecommended && 'suositus', isCheapest && 'halvin'].filter(Boolean);
      return {
        label,
        cost,
        barPx: Math.max(Math.round(ratio * BAR_MAX_PX), BAR_MIN_PX),
        isRecommended,
        isCheapest,
        ariaLabel:
          `${delay.delayHours === 0 ? 'Nyt' : inHours(delay.delayHours)}: ${cost} senttiä` +
          (roles.length ? `, ${roles.join(' ja ')}` : ''),
      };
    });
  });

  /** Whether the cheapest option is another cell than the recommended one */
  readonly cheapestDiffers = computed(() => {
    const recommendation = this.recommendation();
    return !!recommendation && recommendation.cheapest !== recommendation.recommended;
  });

  /** Keeps the tooltip on screen: over the first, middle or last cells */
  readonly tipAlign = computed<TipAlign>(() => {
    const options = this.options();
    const index = options.findIndex((option) => option.isRecommended);
    const position = (index + 0.5) / options.length;
    return position < 1 / 3 ? 'start' : position > 2 / 3 ? 'end' : 'center';
  });

  readonly stats = computed(() => {
    const recommendation = this.recommendation();
    if (!recommendation) return undefined;
    const { recommended, cheapest, saving, extraSavingIfWaitLonger: diff, hours } = recommendation;
    const now = this.delays()[0];

    let middle: { title: string; value: string; note: string; accent: boolean };
    if (recommended.delayHours > 0) {
      const nowTotal = this.total(now);
      const savedPct = nowTotal > 0 ? Math.round((saving / nowTotal) * 100) : 0;
      middle = {
        title: 'Säästö vs. nyt',
        value: `−${savedPct} %`,
        note: `${cents(saving)} senttiä`,
        accent: true,
      };
    } else if (cheapest !== recommended) {
      middle = {
        title: 'Halvin vaihtoehto',
        value: `+${cheapest.delayHours} h`,
        note: `${cents(diff)} snt halvempi`,
        accent: false,
      };
    } else {
      middle = {
        title: 'Halvin vaihtoehto',
        value: 'Nyt',
        note:
          hours === 0
            ? 'ainoa vaihtoehto'
            : `halvin ${hours === 1 ? 'seuraavaan tuntiin' : `seuraaviin ${hours} tuntiin`}`,
        accent: false,
      };
    }

    return {
      cost: cents(this.total(recommended)),
      middle,
      spot: formatPrice(recommended.priceAvg),
      category: PRICE_CATEGORY_TEXT[recommended.priceCategory]?.toLowerCase(),
    };
  });

  readonly basis = computed(() => {
    const schedule = this.schedule.hasValue() ? this.schedule.value() : undefined;
    if (!schedule) return undefined;
    const hours = formatNumber(schedule.durationHours, schedule.durationHours % 1 ? 1 : 0);
    return `Laskettu ${hours} tunnin ohjelmalle ja ${formatKwh(schedule.energyKwh)} kWh:n kulutukselle.`;
  });

  /** How the recommended start's price is calculated */
  readonly formula = computed(() => {
    const recommendation = this.recommendation();
    return recommendation && costFormula(recommendation.recommended.costCents, this.kwh(), 'snt');
  });

  readonly tariffNote = TARIFF_NOTE;

  /** Shows the tooltip for a mouse; touch and pen open it with a tap */
  hoverTip(open: boolean, event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.tipOpen.set(open);
  }

  /** Shows the tooltip when the cell gets keyboard focus */
  focusTip(event: FocusEvent): void {
    if ((event.target as HTMLElement).matches(':focus-visible')) this.tipOpen.set(true);
  }

  /** A tap toggles the tooltip; a mouse click keeps it open, Enter and Space leave it as focus set it */
  toggleTip(event: MouseEvent): void {
    if (event.detail === 0) return;
    if ((event as PointerEvent).pointerType === 'mouse') this.tipOpen.set(true);
    else this.tipOpen.update((open) => !open);
  }

  closeTipOutside(event: MouseEvent): void {
    const trigger = this.tipTrigger()?.nativeElement;
    if (trigger && !trigger.contains(event.target as Node)) this.tipOpen.set(false);
  }

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
