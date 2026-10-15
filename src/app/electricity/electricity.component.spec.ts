import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ElectricityComponent } from './electricity.component';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import {
  LaundrySchedule,
  WashLaundryService,
} from '../wash-laundry/wash-laundry.service';
import { ChargeEvService } from '../charge-ev/charge-ev.service';
import { SaunaService } from '../sauna/sauna.service';
import { PricesService } from '../shared/services/prices.service';
import { ForecastDto } from '../shared/models/forecast';
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

/** Forecast hours from 21:00 today (published) to 22:00 the day after tomorrow, 8 c/kWh */
const FORECAST_START = HOUR_START + 8 * HOUR_MS;
const forecast: ForecastDto = {
  horizon: '72h',
  resolution: 'hour',
  issuedAt: '2026-10-07T09:00:00.000Z',
  points: Array.from({ length: 50 }, (_, hour) => ({
    startTime: new Date(FORECAST_START + hour * HOUR_MS).toISOString(),
    endTime: new Date(FORECAST_START + (hour + 1) * HOUR_MS).toISOString(),
    price: 8,
    published: hour < 27,
  })),
};

describe('ElectricityComponent', () => {
  let fixture: ComponentFixture<ElectricityComponent>;

  const render = (
    overview$: Observable<OverviewDto> = of(overview),
    laundrySchedule: LaundrySchedule = laundry,
    forecast$: Observable<ForecastDto> = throwError(() => new Error('503')),
  ) => {
    TestBed.configureTestingModule({
      imports: [ElectricityComponent],
      providers: [
        provideRouter([]),
        { provide: OverviewService, useValue: { getOverview: () => overview$ } },
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => of(laundrySchedule) } },
        { provide: ChargeEvService, useValue: { getOptimalWindows: () => of(ev) } },
        { provide: SaunaService, useValue: { getStarts: () => of(sauna) } },
        { provide: PricesService, useValue: { getForecast: () => forecast$ } },
      ],
    });
    fixture = TestBed.createComponent(ElectricityComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const text = (selector: string): string =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim() ?? '';

  const texts = (selector: string): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector)).map(
      (element) => element.textContent?.trim() ?? '',
    );

  const boxClasses = (): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelector('.now__box')?.classList ?? []);

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('shows the date and the current price', () => {
    render();

    expect(text('.clock')).toBe('ke 7.10. · 13:42');
    expect(text('h1')).toBe('Sähkön hinta nyt');
    expect(text('.now__value')).toBe('4,82');
    expect(text('.pill')).toBe('Normaali');
    expect(boxClasses()).toContain('now__box--normal');
  });

  it('lists the hourly prices of today and tomorrow as tables', () => {
    render();

    expect(texts('app-hourly-prices h3').map((title) => title.replace(/\s+/g, ' '))).toEqual([
      'Tänään ke 7.10.',
      'Huomenna to 8.10.',
    ]);
    const today = texts('app-hourly-prices .day:first-child tbody th');
    expect(today.length).toBe(11);
    expect(today[0].replace(/\s+/g, ' ')).toBe('13:00–14:00 nyt');
    expect(today[10]).toBe('23:00–00:00');
    expect(texts('app-hourly-prices .day:last-child tbody tr').length).toBe(24);
    expect(texts('app-hourly-prices .day:first-child tbody .table__price').slice(0, 1)).toEqual(['6,00']);
    expect(texts('app-hourly-prices .now')).toHaveSize(1);
  });

  it('links Takaisin to home when the page was opened directly', () => {
    render();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-test-id="electricity-back"]')?.getAttribute('href')).toBe('/');
  });

  it('explains spot prices', () => {
    render();

    expect(text('.explainer h2')).toBe('Mikä on pörssisähkö?');
  });

  it('colors the price box by the price category', () => {
    render(of({ ...overview, current: { price: 14.23, priceCategory: 'EXPENSIVE' } }));

    expect(text('.pill')).toBe('Kallis');
    expect(boxClasses()).toContain('now__box--expensive');
    expect(boxClasses()).toContain('now__box');
  });

  it('keeps the price box neutral while prices load', () => {
    render(new Observable<OverviewDto>());

    expect(boxClasses()).toContain('now__box--normal');
  });

  it('shows a spinner in place of the price while it loads', () => {
    render(new Observable<OverviewDto>());

    const spinner = (fixture.nativeElement as HTMLElement).querySelector('.now__value app-spinner');
    expect(spinner?.getAttribute('role')).toBe('status');
    expect(spinner?.textContent?.trim()).toBe('Ladataan hintoja');
  });

  it('charts the hours from now to the last published price', () => {
    render();

    const element = fixture.nativeElement as HTMLElement;
    const bars = Array.from(element.querySelectorAll('.bar')).map((bar) => bar.className);
    expect(bars.length).toBe(35);
    expect(bars[0]).toContain('bar--current');
    expect(bars[1]).toContain('bar--future');
    expect(text('app-hourly-chart h2')).toBe('Nyt → to 23:00');
    expect(texts('.scale__value')).toEqual(['0', '10', '20']);
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tick')).map((tick) =>
        Array.from(tick.children)
          .map((line) => line.textContent?.trim())
          .join(' '),
      ),
    ).toEqual([
      'nyt 13:42',
      '+6 h 19:00',
      '+12 h 01:00',
      '+24 h 13:00',
      'to 23:00',
    ]);
  });

  it('goes on with the forecast after the last published price, striped and tagged arvio', () => {
    render(of(overview), laundry, of(forecast));

    const element = fixture.nativeElement as HTMLElement;
    // 35 published hours to 23:00 tomorrow, then 23 estimated hours to 22:00 the day after
    expect(element.querySelectorAll('.bar').length).toBe(58);
    expect(element.querySelectorAll('.bar--estimate').length).toBe(23);
    expect(element.querySelector('.bar:nth-child(1)')?.className).not.toContain('bar--estimate');
    expect(text('app-hourly-chart h2')).toBe('Nyt → pe 22:00');
    expect(text('[data-test-id="electricity-forecast-note"]')).toContain('milloin.xyz:n oma ennuste');
    expect(element.querySelector('[data-test-id="electricity-forecast-contact"]')?.getAttribute('href')).toBe(
      'mailto:jarkko.peltola@hurlumhei.xyz',
    );

    expect(texts('app-hourly-prices h3').map((title) => title.replace(/\s+/g, ' '))).toEqual([
      'Tänään ke 7.10.',
      'Huomenna to 8.10.',
      'Ylihuomenna pe 9.10. · arvio',
    ]);
    const estimates = texts('app-hourly-prices tr.estimate');
    expect(estimates.length).toBe(23);
    expect(texts('app-hourly-prices tr.estimate th')[0].replace(/\s+/g, ' ')).toBe('00:00–01:00 arvio');
    expect(texts('app-hourly-prices tr.estimate .table__price')[0]).toBe('≈ 8,00');
    expect(text('app-hourly-prices .note')).toContain('Arvio-tunnit ovat milloin.xyz:n oma ennuste');
    // The averages stay on published prices
    expect(texts('.tile__value').map((value) => value.split(' ')[0])).toEqual(['6,00', '4,50', '3,75']);
  });

  it('shows only published prices when the forecast is unavailable', () => {
    render();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.bar--estimate').length).toBe(0);
    expect(text('[data-test-id="electricity-forecast-note"]')).toBe('');
    expect(text('app-hourly-prices .note')).not.toContain('Arvio');
  });

  it('shows the price of an hour under the pointer', () => {
    render();

    const plot = (fixture.nativeElement as HTMLElement).querySelector('.plot') as HTMLElement;
    const rect = plot.getBoundingClientRect();
    plot.dispatchEvent(
      new PointerEvent('pointermove', { clientX: rect.left + (rect.width * 12.5) / 35, pointerType: 'mouse' }),
    );
    fixture.detectChanges();
    expect(text('.tip')).toBe('to 01:00–02:00 · 3,00 c/kWh');

    plot.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(text('.tip')).toBe('');
  });

  it('compares the average of the next 6, 12 and 24 hours with now', () => {
    render();

    expect(texts('.tile__label')).toEqual(['+6 h keskihinta', '+12 h keskihinta', '+24 h keskihinta']);
    expect(texts('.tile__value').map((value) => value.split(' ')[0])).toEqual(['6,00', '4,50', '3,75']);
    expect(texts('.tile__change')).toEqual(['+24 % vs. nyt', '−7 % vs. nyt', '−22 % vs. nyt']);
  });

  it('answers the laundry question with the recommended start delay, not the cheapest', () => {
    render();

    const row = '[data-test-id="electricity-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('+1 h');
    expect(text(`${row} .question__short`)).toBe('ajastus · 10,9 snt');
    expect(text(`${row} .question__detail`)).toBe('ajastus, käynnistyy 14:42');
  });

  it('says waiting is not worth it when a later start saves too little', () => {
    render(of(overview), { ...laundry, startDelays: [delay(0, 5.2), delay(1, 4.02, true), delay(2, 4.5)] });

    const row = '[data-test-id="electricity-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('Nyt');
    expect(text(`${row} .question__short`)).toBe('heti · 12,1 snt');
    expect(text(`${row} .question__detail`)).toBe('odottaminen ei kannata');
  });

  it('says now is cheapest when no later start is cheaper', () => {
    render(of(overview), { ...laundry, startDelays: [delay(0, 3, true), delay(1, 4.02), delay(2, 4.5)] });

    const row = '[data-test-id="electricity-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('Nyt');
    expect(text(`${row} .question__detail`)).toBe('nyt on halvinta');
  });

  it('answers the EV question with the charging window and its cost', () => {
    render();

    const row = '[data-test-id="electricity-charge-ev"]';
    expect(text(`${row} .question__answer`)).toBe('01:00–05:00');
    expect(text(`${row} .question__short`)).toBe('ensi yönä · 1,00 €');
  });

  it('answers the sauna question with when the sauna is warm after the recommended evening start', () => {
    render();

    const row = '[data-test-id="electricity-sauna"]';
    expect(text(`${row} .question__answer`)).toBe('20:00');
    expect(text(`${row} .question__short`)).toBe('tänään · 0,95 €');
    expect(text(`${row} .question__detail`)).toBe('tänään, lämmitys 19:00');
  });

  it('shows the error and retries', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('.error p')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
    expect(text('[data-test-id="electricity-retry"]')).toBe('Yritä uudelleen');
  });
});
