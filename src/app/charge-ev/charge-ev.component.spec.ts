import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ChargeEvComponent } from './charge-ev.component';
import { ChargeEvService, ChargeOptimalScheduleDto } from './charge-ev.service';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import { OptimalTimeDto, PricePointDto } from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');
const QUARTER_MS = 15 * 60 * 1000;

const optimal = (startTime: string, endTime: string, priceAvg: number): OptimalTimeDto => ({
  startTime,
  endTime,
  priceAvg,
  priceCategory: 'CHEAP',
  pricePoints: [],
});

const schedule = (extended?: OptimalTimeDto): ChargeOptimalScheduleDto => ({
  now: optimal('2026-10-07T10:30:00.000Z', '2026-10-07T14:30:00.000Z', 3.36),
  // 01:00–05:00 Finnish time
  next12Hours: optimal('2026-10-07T22:00:00.000Z', '2026-10-08T02:00:00.000Z', 2.23),
  ...(extended && { extended }),
  defaults: {
    exchangeTariffCentsKwh: 0,
    marginTariffCentsKwh: 0,
    powerConsumptionKwh: 11,
    periodHours: 4,
  },
});

// 24 hours of quarters from 13:45 Finnish time
const futurePoints: PricePointDto[] = Array.from({ length: 97 }, (_, q) => {
  const start = Date.parse('2026-10-07T10:45:00.000Z') + q * QUARTER_MS;
  return {
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + QUARTER_MS).toISOString(),
    price: 5,
  };
});

const overview = {
  current: { price: 4.82, priceCategory: 'NORMAL' },
  future: { priceAvg: 5, priceCategory: 'NORMAL', pricePoints: futurePoints },
} as OverviewDto;

describe('ChargeEvComponent', () => {
  let fixture: ComponentFixture<ChargeEvComponent>;

  const render = (schedule$: Observable<ChargeOptimalScheduleDto>) => {
    TestBed.configureTestingModule({
      imports: [ChargeEvComponent],
      providers: [
        provideRouter([]),
        { provide: ChargeEvService, useValue: { getOptimalSchedule: () => schedule$ } },
        { provide: OverviewService, useValue: { getOverview: () => of(overview) } },
      ],
    });
    fixture = TestBed.createComponent(ChargeEvComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string =>
    element().querySelector(selector)?.textContent?.trim() ?? '';
  const texts = (selector: string): string[] =>
    Array.from(element().querySelectorAll(selector)).map((el) => el.textContent?.trim() ?? '');

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('answers with the charging window and when it starts', () => {
    render(of(schedule()));

    expect(text('h1')).toBe('Milloin kannattaa ladata auto?');
    expect(text('.answer__value')).toBe('01:00–05:00');
    expect(text('.answer__sentence')).toBe('Ajasta lataus alkamaan kello 01:00.');
    expect(text('.answer__when')).toBe('ensi yönä · alkaa 11 h 18 min päästä');
  });

  it('uses the later window when it is cheaper', () => {
    // 03:00–07:00 Finnish time the day after tomorrow's night
    render(of(schedule(optimal('2026-10-08T00:00:00.000Z', '2026-10-08T04:00:00.000Z', 1.5))));

    expect(text('.answer__value')).toBe('03:00–07:00');
  });

  it('shows the cost, saving and spot price for 11 kWh', () => {
    render(of(schedule()));

    expect(texts('.stat__value')).toEqual(['0,25 €', '−34 %', '2,23']);
    expect(texts('.stat__note')).toEqual(['11 kWh', '0,12 €', 'c/kWh · erittäin halpa']);
    expect(text('.basis')).toContain('Laskettu 4 tunnin lataukselle ja 11 kWh:n energialle.');
  });

  it('compares the window with charging right away', () => {
    render(of(schedule()));

    expect(texts('.comparison__label')).toEqual(['Ensi yönä', 'Jos lataat heti']);
    expect(texts('.comparison__window')).toEqual(['01:00–05:00', '13:30–17:30']);
    expect(texts('.comparison__cost')).toEqual(['0,25 €', '0,37 €']);
  });

  it('charts the next 24 hours with the window highlighted', () => {
    render(of(schedule()));

    const bars = Array.from(element().querySelectorAll('.bars > div')).map((bar) => bar.className);
    expect(bars.length).toBe(24);
    expect(bars[0]).toBe('bar bar--current');
    // 01:00 Finnish time is the 12th hour after 13:00
    expect(bars.slice(12, 16)).toEqual(Array(4).fill('bar bar--window'));
    expect(texts('.axis span')).toEqual(['nyt', '19', '01', '07', '13']);
  });

  it('shows the error from the service', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('[role="alert"]')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
    expect(element().querySelector('.stats')).toBeNull();
  });
});
