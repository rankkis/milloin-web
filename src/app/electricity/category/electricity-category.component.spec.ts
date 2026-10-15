import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ElectricityCategoryComponent } from './electricity-category.component';
import { OverviewDto, OverviewService } from '../../shared/services/overview.service';
import {
  LaundrySchedule,
  WashLaundryService,
} from '../../wash-laundry/wash-laundry.service';
import { ChargeEvService } from '../../charge-ev/charge-ev.service';
import { SaunaService } from '../../sauna/sauna.service';
import {
  HourlyPriceDto,
  OptimalTimeDto,
  OptimalWindowsDto,
  StartDelayDto,
  StartOffsetWindowDto,
} from '../../shared/models/price.model';

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

describe('ElectricityCategoryComponent', () => {
  let fixture: ComponentFixture<ElectricityCategoryComponent>;

  const render = (overview$: Observable<OverviewDto> = of(overview)) => {
    TestBed.configureTestingModule({
      imports: [ElectricityCategoryComponent],
      providers: [
        provideRouter([]),
        { provide: OverviewService, useValue: { getOverview: () => overview$ } },
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => of(laundry) } },
        { provide: ChargeEvService, useValue: { getOptimalWindows: () => of(ev) } },
        { provide: SaunaService, useValue: { getStarts: () => of(sauna) } },
      ],
    });
    fixture = TestBed.createComponent(ElectricityCategoryComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = (selector: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(selector);

  const text = (selector: string): string => element(selector)?.textContent?.trim() ?? '';

  const texts = (selector: string): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector)).map(
      (item) => item.textContent?.trim() ?? '',
    );

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('is titled with the category name, like the other category pages', () => {
    render();

    expect(text('h1')).toBe('Sähkö');
    expect(text('.clock')).toBe('ke 7.10. · 13:42');
  });

  it('lists only the electricity questions, without prices or charts', () => {
    render();

    expect(texts('.question__text')).toEqual([
      'Milloin sähkö on halpaa?',
      'Milloin saunotaan?',
      'Milloin pestään pyykit?',
      'Milloin ladataan auto?',
    ]);
    expect(element('app-hourly-chart')).toBeNull();
    expect(element('app-trend-tiles')).toBeNull();
    expect(element('app-hourly-prices')).toBeNull();
  });

  it('links each question to its page, the price question to /sahko-on-halpaa', () => {
    render();

    expect(element('[data-test-id="electricity-category-price"]')?.getAttribute('href')).toBe('/sahko-on-halpaa');
    expect(element('[data-test-id="electricity-category-sauna"]')?.getAttribute('href')).toBe('/saunotaan');
    expect(element('[data-test-id="electricity-category-laundry"]')?.getAttribute('href')).toBe('/pestaan-pyykit');
    expect(element('[data-test-id="electricity-category-ev"]')?.getAttribute('href')).toBe('/ladataan-auto');
  });

  it('answers each question in its row', () => {
    render();

    expect(text('[data-test-id="electricity-category-price"] .question__answer')).toBe('19:00');
    expect(text('[data-test-id="electricity-category-price"] .question__detail')).toBe('halvin tunti tänään · 3,00 c/kWh');
    expect(text('[data-test-id="electricity-category-sauna"] .question__answer')).toBe('20:00');
    expect(text('[data-test-id="electricity-category-laundry"] .question__answer')).toBe('+1 h');
    expect(text('[data-test-id="electricity-category-ev"] .question__answer')).toBe('01:00–05:00');
  });

  it('answers "Nyt" when the current hour is the cheapest', () => {
    render(of({ ...overview, upcomingHours: overview.upcomingHours.map((hour, index) => ({ ...hour, priceAvg: index === 0 ? 1 : 5 })) }));

    expect(text('[data-test-id="electricity-category-price"] .question__answer')).toBe('Nyt');
    expect(text('[data-test-id="electricity-category-price"] .question__short')).toBe('halvin tunti · 1,00 c/kWh');
  });

  it('offers a retry when prices fail to load', () => {
    render(throwError(() => new Error('down')));

    expect(element('[data-test-id="electricity-category-retry"]')).not.toBeNull();
  });
});
