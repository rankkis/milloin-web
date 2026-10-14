import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ChargeEvComponent } from './charge-ev.component';
import { ChargeEvService, ChargeWindowsDto } from './charge-ev.service';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import { HourlyPriceDto, OptimalTimeDto } from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');

const optimal = (startTime: string, endTime: string, priceAvg: number): OptimalTimeDto => ({
  startTime,
  endTime,
  priceAvg,
  priceCategory: 'CHEAP',
  pricePoints: [],
});

// 01:00–05:00 Finnish time
const tonight = optimal('2026-10-07T22:00:00.000Z', '2026-10-08T02:00:00.000Z', 2.23);

// 13:00–17:00 Finnish time tomorrow, after the car should be charged
const tomorrowEvening = optimal('2026-10-08T10:00:00.000Z', '2026-10-08T14:00:00.000Z', 1.2);

const schedule = (
  windows: OptimalTimeDto[] = [tonight],
  startNow: OptimalTimeDto | null = optimal(
    '2026-10-07T10:30:00.000Z',
    '2026-10-07T14:30:00.000Z',
    3.36,
  ),
  bestAvailable: OptimalTimeDto | null = tomorrowEvening,
): ChargeWindowsDto => ({
  durationHours: 4,
  energyKwh: 11,
  earliestStart: '2026-10-07T10:30:00.000Z',
  latestEnd: '2026-10-08T05:00:00.000Z',
  // 08:00 Finnish time tomorrow
  readyBy: '2026-10-08T05:00:00.000Z',
  fitsReadyBy: true,
  ...(startNow && { startNow }),
  ...(bestAvailable && { bestAvailable }),
  windows,
});

const HOUR_MS = 60 * 60 * 1000;

// 30 hours from 13:00 Finnish time, the current hour
const upcomingHours: HourlyPriceDto[] = Array.from({ length: 30 }, (_, hour) => {
  const start = Date.parse('2026-10-07T10:00:00.000Z') + hour * HOUR_MS;
  return {
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + HOUR_MS).toISOString(),
    priceAvg: 5,
    priceCategory: 'NORMAL',
  };
});

const overview = {
  current: { price: 4.82, priceCategory: 'NORMAL' },
  upcomingHours,
} as OverviewDto;

describe('ChargeEvComponent', () => {
  let fixture: ComponentFixture<ChargeEvComponent>;

  const render = (schedule$: Observable<ChargeWindowsDto>) => {
    TestBed.configureTestingModule({
      imports: [ChargeEvComponent],
      providers: [
        provideRouter([]),
        { provide: ChargeEvService, useValue: { getOptimalWindows: () => schedule$ } },
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

    expect(text('h1')).toBe('Milloin ladataan auto?');
    expect(text('.answer__value')).toBe('01:00–05:00');
    expect(text('.answer__sentence')).toBe('Ajasta lataus alkamaan kello 01:00.');
    expect(text('.answer__when')).toBe('ensi yönä · alkaa 11 h 18 min päästä');
  });

  it('shows a spinner while the answer loads', () => {
    render(new Observable<ChargeWindowsDto>());

    expect(element().querySelector('.answer__value app-spinner[role="status"]')).not.toBeNull();
  });

  it('answers with the first window, the cheapest', () => {
    // 03:00–07:00 Finnish time
    render(of(schedule([optimal('2026-10-08T00:00:00.000Z', '2026-10-08T04:00:00.000Z', 1.5), tonight])));

    expect(text('.answer__value')).toBe('03:00–07:00');
  });

  it('shows the cost, saving and spot price for 11 kWh', () => {
    render(of(schedule()));

    expect(texts('.stat__value').slice(0, 3)).toEqual(['1,01 €', '−11 %', '2,23']);
    expect(texts('.stat__note').slice(0, 3)).toEqual(['11 kWh', '0,12 €', 'c/kWh · halpa']);
    expect(texts('.basis p')).toEqual([
      'Laskettu 4 tunnin lataukselle ja 11 kWh:n energialle, joka on valmis viimeistään kello 08:00.',
      'Hinta = 11 kWh × (spot 2,23 + siirto 3,50 + sähkövero 2,92 + marginaali 0,50 c/kWh) = 1,01 €. ' +
        'Siirto ja marginaali ovat tyypillisiä arvoja. Hinnat sis. alv 25,5 %, kuukausimaksut eivät sisälly.',
    ]);
  });

  it('says so when no charge is ready by 08:00 in the published prices', () => {
    render(of({ ...schedule(), fitsReadyBy: false }));

    expect(text('.basis p')).toBe(
      'Laskettu 4 tunnin lataukselle ja 11 kWh:n energialle. Kello 08:00 mennessä valmista latausta ' +
        'ei löydy julkaistuista hinnoista, joten vastaus on halvin julkaistu jakso.',
    );
  });

  it('compares the window with charging right away', () => {
    render(of(schedule()));

    expect(texts('.comparison__label')).toEqual(['Ensi yönä', 'Jos lataat heti', 'Huomenna, halvin']);
    expect(texts('.comparison__window')).toEqual(['01:00–05:00', '13:30–17:30', '13:00–17:00']);
    expect(texts('.comparison__cost')).toEqual(['1,01 €', '1,13 €', '0,89 €']);
  });

  it('leaves the cheapest published window out unless it is cheaper than the answer', () => {
    render(of(schedule([tonight], undefined, optimal('2026-10-08T10:00:00.000Z', '2026-10-08T14:00:00.000Z', 2.23))));

    expect(texts('.comparison__label')).toEqual(['Ensi yönä', 'Jos lataat heti']);
    expect(element().querySelector('.bar--secondary')).toBeNull();
    expect(element().querySelector('.bar')?.className).toBe('bar bar--current');
  });

  it('leaves charging right away out when prices do not reach far enough', () => {
    render(of(schedule([tonight], null, null)));

    expect(texts('.comparison__label')).toEqual(['Ensi yönä']);
    expect(texts('.stat__value').slice(0, 3)).toEqual(['1,01 €', '0 %', '2,23']);
  });

  it('charts every published hour with the answer in green and the cheaper window in white', () => {
    render(of(schedule()));

    const bars = Array.from(element().querySelectorAll('.bar')).map((bar) => bar.className);
    expect(bars.length).toBe(30);
    // White marks the cheaper window, not the current hour
    expect(bars[0]).toBe('bar bar--future');
    // 01:00 Finnish time is the 12th hour after 13:00
    expect(bars.slice(12, 16)).toEqual(Array(4).fill('bar bar--window'));
    // 13:00 tomorrow is the 24th
    expect(bars.slice(24, 28)).toEqual(Array(4).fill('bar bar--secondary'));
    expect(text('app-hourly-chart h2')).toBe('Nyt → to 18:00');
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
      'to 18:00',
    ]);
  });

  it('shows the error from the service', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('[role="alert"]')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
    expect(element().querySelector('.stats')).toBeNull();
  });
});
