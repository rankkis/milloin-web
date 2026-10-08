import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import {
  WashLaundryOptimalScheduleDto,
  WashLaundryService,
} from '../wash-laundry/wash-laundry.service';
import { ChargeEvService, ChargeOptimalScheduleDto } from '../charge-ev/charge-ev.service';
import { HourlyPriceDto, OptimalTimeDto, StartDelayDto } from '../shared/models/price.model';

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

const laundry: WashLaundryOptimalScheduleDto = {
  startDelays: [delay(0, 9.5), delay(1, 4.02), delay(2, 4.5), delay(3, 4, true)],
  defaults: {
    exchangeTariffCentsKwh: 0,
    marginTariffCentsKwh: 0,
    powerConsumptionKwh: 1,
    periodHours: 2,
  },
};

const ev: ChargeOptimalScheduleDto = {
  now: optimal('2026-10-07T10:30:00.000Z', '2026-10-07T14:30:00.000Z', 5),
  next12Hours: optimal('2026-10-07T22:00:00.000Z', '2026-10-08T02:00:00.000Z', 2.2),
  defaults: {
    exchangeTariffCentsKwh: 0,
    marginTariffCentsKwh: 0,
    powerConsumptionKwh: 11,
    periodHours: 4,
  },
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  const render = (
    overview$: Observable<OverviewDto> = of(overview),
    laundrySchedule: WashLaundryOptimalScheduleDto = laundry,
  ) => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: OverviewService, useValue: { getOverview: () => overview$ } },
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => of(laundrySchedule) } },
        { provide: ChargeEvService, useValue: { getOptimalSchedule: () => of(ev) } },
      ],
    });
    fixture = TestBed.createComponent(HomeComponent);
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

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('shows the date and the current price', () => {
    render();

    expect(text('.clock')).toBe('ke 7.10. · 13:42');
    expect(text('h1')).toBe('Milloin…');
    expect(text('.now__value')).toBe('4,82');
    expect(text('.pill')).toBe('Normaali');
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

    const row = '[data-test-id="home-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('+1 h');
    expect(text(`${row} .question__short`)).toBe('ajastus · 4,0 snt');
    expect(text(`${row} .question__detail`)).toBe('ajastus, käynnistyy 14:42');
  });

  it('says waiting is not worth it when a later start saves too little', () => {
    render(of(overview), { ...laundry, startDelays: [delay(0, 5.2), delay(1, 4.02, true), delay(2, 4.5)] });

    const row = '[data-test-id="home-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('Nyt');
    expect(text(`${row} .question__short`)).toBe('heti · 5,2 snt');
    expect(text(`${row} .question__detail`)).toBe('odottaminen ei kannata');
  });

  it('says now is cheapest when no later start is cheaper', () => {
    render(of(overview), { ...laundry, startDelays: [delay(0, 3, true), delay(1, 4.02), delay(2, 4.5)] });

    const row = '[data-test-id="home-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('Nyt');
    expect(text(`${row} .question__detail`)).toBe('nyt on halvinta');
  });

  it('answers the EV question with the charging window and its cost', () => {
    render();

    const row = '[data-test-id="home-charge-ev"]';
    expect(text(`${row} .question__answer`)).toBe('01:00–05:00');
    expect(text(`${row} .question__short`)).toBe('ensi yönä · 0,24 €');
  });

  it('shows the error and retries', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('.error p')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
    expect(text('[data-test-id="home-retry"]')).toBe('Yritä uudelleen');
  });
});
