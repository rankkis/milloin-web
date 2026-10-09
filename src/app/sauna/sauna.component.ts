import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnswerHeaderComponent } from '../shared/answer-header/answer-header.component';
import { formatNumber, formatPrice } from '../shared/format/format';
import { IconComponent } from '../shared/icon/icon.component';
import { initialNow } from '../shared/render-time';
import { resourceErrorMessage } from '../shared/resource-error';
import { OverviewService } from '../shared/services/overview.service';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import {
  DAYS,
  PARTS,
  SaunaDay,
  SaunaPart,
  cents,
  cheaperOtherDay,
  dayHasPrices,
  hasPrices,
  hourClock,
  OFF_HOURS_MIN_SAVING_CENTS,
  OFF_HOURS_MIN_SAVING_PCT,
  laterToday,
  readyClock,
  missingPricesNotice,
  planSauna,
  tomorrowNote,
} from './sauna-plan';
import { TARIFF_NOTE, costFormula, formatKwh, totalCents } from '../shared/tariffs/tariffs';
import { SaunaService } from './sauna.service';

/** Bars of the start-time chart scale to the most expensive start */
const BAR_MIN_PCT = 6;
/** With more starts than this, only every third hour is labelled */
const MAX_LABELLED_BARS = 12;

const DAY_TEXT: Record<SaunaDay, string> = { 0: 'Tänään', 1: 'Huomenna' };
const PART_TEXT: Record<SaunaPart, string> = { day: 'Päivä', evening: 'Ilta', any: 'Ei väliä' };

@Component({
  selector: 'app-sauna',
  imports: [AnswerHeaderComponent, IconComponent, SpinnerComponent],
  templateUrl: './sauna.component.html',
  styleUrl: './sauna.component.scss',
})
export class SaunaComponent {
  private readonly saunaService = inject(SaunaService);
  private readonly overviewService = inject(OverviewService);

  readonly starts = rxResource({ stream: () => this.saunaService.getStarts() });
  readonly overview = rxResource({ stream: () => this.overviewService.getOverview() });

  /** When the answer was calculated; start hours that have begun are left out */
  readonly now = signal(initialNow());

  /**
   * The visitor's choice; a choice without prices falls back to another.
   * Without a chosen day it is today, or tomorrow once today's time of day is over.
   */
  readonly wantedDay = signal<SaunaDay | undefined>(undefined);
  readonly wantedPart = signal<SaunaPart>('evening');
  /** Start hour whose price is shown under the chart; the cheapest by default */
  readonly pickedHour = signal<number | undefined>(undefined);

  readonly errorMessage = resourceErrorMessage;

  private readonly response = computed(() => (this.starts.hasValue() ? this.starts.value() : undefined));

  readonly currentPrice = computed(() =>
    this.overview.hasValue() ? formatPrice(this.overview.value().current.price) : undefined,
  );

  private readonly kwh = computed(() => this.response()?.energyKwh ?? 0);

  /** Total cost of a start in cents: energy plus transfer, tax and margin */
  private total(start: { window: { costCents: number } }): number {
    return totalCents(start.window.costCents, this.kwh());
  }

  readonly plan = computed(() => {
    const response = this.response();
    return response && planSauna(response, this.now(), this.wantedDay(), this.wantedPart());
  });

  readonly days = computed(() => {
    const response = this.response();
    const plan = this.plan();
    if (!response || !plan) return [];
    const note = tomorrowNote(response, this.now());
    return DAYS.map((day) => ({
      day,
      label: DAY_TEXT[day],
      note: day === 1 ? note : undefined,
      selected: plan.day === day,
      disabled: !dayHasPrices(response, this.now(), day),
      testId: day === 0 ? 'sauna-day-today' : 'sauna-day-tomorrow',
    }));
  });

  readonly parts = computed(() => {
    const response = this.response();
    const plan = this.plan();
    if (!response || !plan) return [];
    return PARTS.map((part) => ({
      part,
      label: PART_TEXT[part],
      selected: plan.part === part,
      disabled: !hasPrices(response, this.now(), plan.day, part),
      testId: `sauna-part-${part}`,
    }));
  });

  readonly answer = computed(() => {
    const plan = this.plan();
    if (!plan) return undefined;
    const { recommended: best, cheapest, worst } = plan;
    const day = plan.day === 0 ? 'tänään' : 'huomenna';
    const saving = worst.window.costCents - best.window.costCents;
    const durationHours = this.response()?.durationHours ?? 3;
    let reason = `Saunominen maksaa ${cents(this.total(best))} senttiä`;
    reason += saving >= 0.05 ? `, eli ${cents(saving)} senttiä vähemmän kuin jos lämmitys aloitetaan kello ${hourClock(worst.hour)}.` : '.';
    const extra = best.window.costCents - cheapest.window.costCents;
    if (extra >= 0.05) {
      reason +=
        ` Kello ${readyClock(cheapest.hour)} sauna olisi ${cents(extra)} senttiä halvempi, ` +
        'mutta niin pieni säästö ei ole tavallisesta saunomisajasta luopumisen arvoinen.';
    }
    return {
      value: readyClock(best.hour),
      instruction: `Aloita lämmitys ${day} kello ${hourClock(best.hour)}, niin sauna on lämmin kello ${readyClock(best.hour)}.`,
      reason,
      times: `${day} · kiuas päällä ${hourClock(best.hour)}–${hourClock((best.hour + durationHours) % 24 || 24)}`,
    };
  });

  readonly otherDay = computed(() => {
    const response = this.response();
    const plan = this.plan();
    if (!response || !plan) return undefined;
    const other = cheaperOtherDay(response, this.now(), plan);
    return (
      other && {
        day: other.day,
        text: `${DAY_TEXT[other.day]} saunaan kello ${readyClock(other.hour)}, ${cents(plan.recommended.window.costCents - other.window.costCents)} snt halvempi`,
      }
    );
  });

  /** Tomorrow is shown because this evening is over; the cheapest start still left tonight */
  readonly tonight = computed(() => {
    const response = this.response();
    const plan = this.plan();
    const start = response && plan && laterToday(response, this.now(), plan);
    return start && `Saunotko vielä tänään? Saunaan kello ${readyClock(start.hour)}, ${cents(this.total(start))} snt`;
  });

  readonly notice = computed(() => {
    const response = this.response();
    const plan = this.plan();
    return response && plan ? missingPricesNotice(response, this.now(), plan) : undefined;
  });

  readonly bars = computed(() => {
    const plan = this.plan();
    if (!plan) return [];
    const maxCost = this.total(plan.worst);
    const every = plan.starts.length > MAX_LABELLED_BARS ? 3 : 1;
    const picked = this.picked();
    const cheapestDiffers = plan.cheapest !== plan.recommended;
    return plan.starts.map((start, index) => {
      const cost = start.window && this.total({ window: start.window });
      const roles = [start === plan.recommended && 'suositus', cheapestDiffers && start === plan.cheapest && 'halvin'];
      const price = cost === undefined ? 'hinta ei vielä tiedossa' : `${cents(cost)} senttiä`;
      return {
        hour: start.hour,
        label: index % every === 0 ? String(start.hour).padStart(2, '0') : '',
        heightPct:
          cost === undefined ? 100 : Math.max(BAR_MIN_PCT, Math.round((Math.max(cost, 0) / maxCost) * 100) || 0),
        missing: cost === undefined,
        best: start === plan.recommended,
        cheapest: cheapestDiffers && start === plan.cheapest,
        picked: start === picked && start !== plan.recommended,
        ariaLabel: `Kello ${hourClock(start.hour)}: ${[price, ...roles.filter(Boolean)].join(', ')}`,
      };
    });
  });

  private readonly picked = computed(() => {
    const plan = this.plan();
    return plan && (plan.starts.find((start) => start.hour === this.pickedHour()) ?? plan.recommended);
  });

  /** The tapped start: its total cost, and how it compares with the recommended, the cheapest or the most expensive start */
  readonly pickedText = computed(() => {
    const plan = this.plan();
    const picked = this.picked();
    if (!plan || !picked) return undefined;
    const main = `Kiuas päälle klo ${hourClock(picked.hour)} · `;
    if (!picked.window) return { main: main + 'hinta ei vielä tiedossa', compare: undefined };

    const { recommended, cheapest: best, worst } = plan;
    const cost = this.total({ window: picked.window });
    let compare: string;
    if (picked === recommended && recommended !== best) {
      compare =
        `Suositus: sauna lämmin klo ${readyClock(picked.hour)}. ` +
        `Halvin aloitus (klo ${hourClock(best.hour)}) olisi ${cents(cost - this.total(best))} snt halvempi.`;
    } else if (picked === best) {
      const worstCost = this.total(worst);
      const saving = worstCost - cost;
      const savedPct = Math.round((saving / worstCost) * 100);
      compare =
        saving >= 0.05 && worstCost > 0
          ? `Halvin aloitus: ${savedPct} % halvempi kuin kallein (klo ${hourClock(worst.hour)}).`
          : 'Halvin aloitus.';
    } else {
      const bestCost = this.total(best);
      const extra = cost - bestCost;
      const extraPct = bestCost > 0 ? ` (+${Math.round((extra / bestCost) * 100)} %)` : '';
      compare = `${cents(extra)} snt${extraPct} kalliimpi kuin halvin (klo ${hourClock(best.hour)}).`;
    }
    return { main: `${main}yhteensä ${cents(cost)} snt`, compare };
  });

  readonly basis = computed(() => {
    const response = this.response();
    if (!response) return undefined;
    return (
      `Laskettu ${formatNumber(response.durationHours, 0)} tunnin saunomiselle ja ${formatKwh(this.kwh())} kWh:lle. ` +
      'Päivä: kiuas päälle klo 6–16, ilta 17–21. ' +
      'Illalla suosittelemme saunaa, joka on lämmin klo 19–21, ' +
      `ellei muu aika ole vähintään ${OFF_HOURS_MIN_SAVING_CENTS} senttiä ja ` +
      `sähköenergialtaan ${OFF_HOURS_MIN_SAVING_PCT} % halvempi.`
    );
  });

  /** How the price of the start shown under the chart is calculated */
  readonly formula = computed(() => {
    const window = this.picked()?.window;
    return window && costFormula(window.costCents, this.kwh(), 'snt');
  });

  readonly tariffNote = TARIFF_NOTE;

  constructor() {
    // A server-rendered page shows the server's time until the browser takes over
    afterNextRender(() => this.now.set(new Date()));
  }

  chooseDay(day: SaunaDay): void {
    this.wantedDay.set(day);
    this.pickedHour.set(undefined);
  }

  /** Today at any time, for a sauna still tonight */
  chooseTonight(): void {
    this.wantedDay.set(0);
    this.choosePart('any');
  }

  choosePart(part: SaunaPart): void {
    this.wantedPart.set(part);
    this.pickedHour.set(undefined);
  }

  refresh(): void {
    this.now.set(new Date());
    this.starts.reload();
    this.overview.reload();
  }
}
