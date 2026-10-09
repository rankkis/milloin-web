import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import {
  LaundrySchedule,
  WashLaundryService,
} from '../wash-laundry/wash-laundry.service';
import { ChargeEvService } from '../charge-ev/charge-ev.service';
import { SaunaService } from '../sauna/sauna.service';
import { EnceService } from '../ence/ence.service';
import { EnceDto } from '../ence/ence.model';
import {
  HourlyPriceDto,
  OptimalTimeDto,
  OptimalWindowsDto,
  StartDelayDto,
  StartOffsetWindowDto,
} from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');
// 13:00 Finnish time, the current hour
const HOUR_START = Date.parse('2026-10-07T10:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;

/** 13:00 today to 23:00 tomorrow; 6 c/kWh, 3 c/kWh from the 6th hour, 24 c/kWh at the end */
const hours: HourlyPriceDto[] = Array.from({ length: 35 }, (_, hour) => ({
  startTime: new Date(HOUR_START + hour * HOUR_MS).toISOString(),
  endTime: new Date(HOUR_START + (hour + 1) * HOUR_MS).toISOString(),
  priceAvg: hour === 34 ? 24 : hour >= 6 ? 3 : 6,
  priceCategory: 'NORMAL',
}));

const optimal = (start: string, end: string, priceAvg: number): OptimalTimeDto => ({
  startTime: start,
  endTime: end,
  priceAvg,
  priceCategory: 'CHEAP',
  pricePoints: [],
});

const overview: OverviewDto = {
  current: { price: 4.82, priceCategory: 'NORMAL' },
  next12Hours: { priceAvg: 5, priceCategory: 'NORMAL', pricePoints: [] },
  future: { priceAvg: 5, priceCategory: 'NORMAL', pricePoints: [] },
  upcomingHours: hours,
};

const delay = (delayHours: number, costCents: number, isBest = false): StartDelayDto => ({
  delayHours,
  startTime: '',
  endTime: '',
  priceAvg: costCents,
  priceCategory: 'CHEAP',
  costCents,
  isBest,
});

const laundry: LaundrySchedule = {
  startDelays: [delay(0, 9.5), delay(1, 4.02), delay(2, 4.5), delay(3, 4, true)],
  durationHours: 2,
  energyKwh: 1,
};

const ev: OptimalWindowsDto = {
  durationHours: 4,
  energyKwh: 11,
  earliestStart: '2026-10-07T10:30:00.000Z',
  latestEnd: '2026-10-08T21:00:00.000Z',
  startNow: optimal('2026-10-07T10:30:00.000Z', '2026-10-07T14:30:00.000Z', 5),
  windows: [optimal('2026-10-07T22:00:00.000Z', '2026-10-08T02:00:00.000Z', 2.2)],
};

// Sauna starts at 16:00 and 19:00 today (Finnish time); 19:00 is cheaper
const saunaStart = (startTime: string, costCents: number): StartOffsetWindowDto => ({
  ...optimal(startTime, startTime, costCents / 8),
  offsetHours: 0,
  costCents,
});

const sauna: OptimalWindowsDto = {
  durationHours: 3,
  energyKwh: 8,
  earliestStart: '2026-10-07T10:30:00.000Z',
  latestEnd: '2026-10-08T21:00:00.000Z',
  windows: [],
  startOffsets: [saunaStart('2026-10-07T13:00:00.000Z', 52), saunaStart('2026-10-07T16:00:00.000Z', 39.7)],
};

// ENCE plays tomorrow at 18:30 Finnish time
const ence: EnceDto = {
  updatedAt: '2026-10-07T10:12:00.000Z',
  source: 'PandaScore',
  team: { name: 'ENCE' },
  nextMatch: {
    startTime: '2026-10-08T15:30:00.000Z',
    live: false,
    opponent: { name: 'Sashi' },
    event: 'CCT Europe Series 9',
    format: 'Bo3',
    streams: [],
  },
  upcoming: [],
  results: [],
  news: [],
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  const render = (overview$: Observable<OverviewDto> = of(overview)) => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: OverviewService, useValue: { getOverview: () => overview$ } },
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => of(laundry) } },
        { provide: ChargeEvService, useValue: { getOptimalWindows: () => of(ev) } },
        { provide: SaunaService, useValue: { getStarts: () => of(sauna) } },
        { provide: EnceService, useValue: { getEnce: () => of(ence) } },
      ],
    });
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = <T extends HTMLElement = HTMLElement>(selector: string): T | null =>
    (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  const text = (selector: string): string => element(selector)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';

  const texts = (selector: string): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector)).map(
      (el) => el.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    );

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('shows the title and the date', () => {
    render();

    expect(text('h1')).toBe('Milloin…');
    expect(text('.clock')).toBe('ke 7.10. · 13:42');
  });

  it('lists the questions as whole sentences under their category', () => {
    render();

    expect(texts('.group__link')).toEqual(['Sähkö', 'Raha', 'Sekalaista']);
    expect(texts('.question__text')).toEqual([
      'Milloin saunotaan?',
      'Milloin pestään pyykit?',
      'Milloin ladataan auto?',
      'Milloin Kelan tuet maksetaan?',
      'Milloin veronpalautukset tulevat?',
      'Milloin eläke maksetaan?',
      'Milloin Ence pelaa?',
    ]);
  });

  it('links each category heading to its page and each question to its answer page', () => {
    render();

    expect(element('[data-test-id="home-category-sahko"]')?.getAttribute('href')).toBe('/sahko-on-halpaa');
    expect(element('[data-test-id="home-sauna"]')?.getAttribute('href')).toBe('/saunotaan');
    expect(element('[data-test-id="home-laundry"]')?.getAttribute('href')).toBe('/pestaan-pyykit');
    expect(element('[data-test-id="home-ev"]')?.getAttribute('href')).toBe('/ladataan-auto');
    expect(element('[data-test-id="home-category-raha"]')?.getAttribute('href')).toBe('/raha-tulee-tilille');
    expect(element('[data-test-id="home-kela"]')?.getAttribute('href')).toBe('/kelan-tuet-maksetaan');
    expect(element('[data-test-id="home-tax-refund"]')?.getAttribute('href')).toBe('/veronpalautukset-tulevat');
    expect(element('[data-test-id="home-pension"]')?.getAttribute('href')).toBe('/elake-maksetaan');
    expect(element('[data-test-id="home-category-sekalaista"]')?.getAttribute('href')).toBe('/mitakin-tapahtuu');
    expect(element('[data-test-id="home-ence"]')?.getAttribute('href')).toBe('/ence-pelaa');
  });

  it('answers when ENCE plays next', () => {
    render();

    expect(text('[data-test-id="home-ence"] .question__answer')).toBe('to 18:30');
    expect(text('[data-test-id="home-ence"] .question__short')).toBe('huomenna · vs. Sashi');
    expect(text('[data-test-id="home-ence"] .question__detail')).toBe('huomenna vs. Sashi · CCT Europe Series 9, Bo3');
  });

  it('shows the current price in the Sähkö heading', () => {
    render();

    expect(text('.group__meta')).toBe('nyt 4,82 c/kWh · normaali');
  });

  it('answers each question in its row', () => {
    render();

    expect(text('[data-test-id="home-sauna"] .question__answer')).toBe('20:00');
    expect(text('[data-test-id="home-sauna"] .question__short')).toBe('tänään · 0,95 €');
    expect(text('[data-test-id="home-laundry"] .question__answer')).toBe('+1 h');
    expect(text('[data-test-id="home-laundry"] .question__detail')).toBe('ajastus, käynnistyy 14:42 · 10,9 snt');
    expect(text('[data-test-id="home-ev"] .question__answer')).toBe('01:00–05:00');
    expect(text('[data-test-id="home-ev"] .question__detail')).toBe('ensi yönä · 1,00 €');
  });

  it('answers the Raha questions with payment days, without a price', () => {
    render();

    expect(text('[data-test-id="home-kela"] .question__answer')).toBe('ke 7.10.');
    expect(text('[data-test-id="home-kela"] .question__detail')).toBe('kansaneläke ja vammaistuet · tänään');
    expect(text('[data-test-id="home-tax-refund"] .question__short')).toBe('27 päivän päästä');
    expect(text('[data-test-id="home-pension"] .question__answer')).toBe('ma 2.11.');
  });

  it('filters the questions by category', () => {
    render();

    expect(texts('.chip')).toEqual(['Kaikki', 'Sähkö', 'Raha', 'Sekalaista']);
    element<HTMLButtonElement>('[data-test-id="home-filter-raha"]')?.click();
    fixture.detectChanges();

    expect(texts('.group__link')).toEqual(['Raha']);
    expect(element('[data-test-id="home-filter-raha"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the error and retries', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('.error p')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
    expect(text('[data-test-id="home-retry"]')).toBe('Yritä uudelleen');
    expect(texts('.question__text').length).toBe(7);
  });
});
