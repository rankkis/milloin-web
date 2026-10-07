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
const DAY_START = Date.parse('2026-10-06T21:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;

const hours: HourlyPriceDto[] = Array.from({ length: 24 }, (_, hour) => ({
  startTime: new Date(DAY_START + hour * HOUR_MS).toISOString(),
  endTime: new Date(DAY_START + (hour + 1) * HOUR_MS).toISOString(),
  priceAvg: hour === 15 || hour === 16 ? 2.3 : 6,
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
  today: hours,
  cheapestWindow: optimal('2026-10-07T12:00:00.000Z', '2026-10-07T14:00:00.000Z', 2.3),
};

const delay = (delayHours: number, costCents: number, isBest = false): StartDelayDto => ({
  delayHours,
  startTime: '',
  endTime: '',
  priceAvg: costCents,
  costCents,
  isBest,
});

const laundry: WashLaundryOptimalScheduleDto = {
  startDelays: [delay(0, 5.2), delay(1, 4.02, true), delay(2, 4.5)],
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

  const render = (overview$: Observable<OverviewDto> = of(overview)) => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: OverviewService, useValue: { getOverview: () => overview$ } },
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => of(laundry) } },
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

  it('shows the cheapest window and when it starts', () => {
    render();

    expect(text('.window__label')).toBe('Halvimmillaan · 1 h 18 min päästä');
    expect(text('.window__time')).toBe('15:00–17:00');
    expect(text('.window__price')).toContain('2,30');
  });

  it('draws today with past, current and cheapest hours', () => {
    render();

    const bars = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.bars > div'),
    ).map((bar) => bar.className);
    expect(bars.length).toBe(24);
    expect(bars[12]).toBe('bar bar--past');
    expect(bars[13]).toBe('bar bar--current');
    expect(bars[15]).toBe('bar bar--window');
    expect(bars[16]).toBe('bar bar--window');
    expect(bars[17]).toBe('bar bar--future');
  });

  it('answers the laundry question with the best start delay', () => {
    render();

    const row = '[data-test-id="home-wash-laundry"]';
    expect(text(`${row} .question__answer`)).toBe('+1 h');
    expect(text(`${row} .question__short`)).toBe('ajastus · 4,0 snt');
    expect(text(`${row} .question__detail`)).toBe('ajastus, käynnistyy 14:42');
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
