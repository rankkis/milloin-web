import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { SaunaComponent } from './sauna.component';
import { SaunaService } from './sauna.service';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');
// 22:30 the same day, after the last evening start
const LATE = new Date('2026-10-07T19:30:00.000Z');
// Midnight starting 2026-10-07 in Finnish time
const TODAY = Date.parse('2026-10-06T21:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;
const at = (hour: number) => new Date(TODAY + hour * HOUR_MS).toISOString();

/** A start every full hour from 14:00 today to lastStartHour; 21:00 today and 18:00 tomorrow are cheap */
const response = (
  lastStartHour: number,
  pricesEndHour: number,
  costOf = (hour: number): number => (hour === 21 ? 39.7 : hour === 42 ? 24 : 52),
): OptimalWindowsDto => ({
  durationHours: 3,
  energyKwh: 8,
  earliestStart: NOW.toISOString(),
  latestEnd: at(pricesEndHour),
  windows: [],
  startOffsets: Array.from({ length: lastStartHour - 13 }, (_, i): StartOffsetWindowDto => {
    const hour = 14 + i;
    const costCents = costOf(hour);
    return {
      offsetHours: i + 0.25,
      startTime: at(hour),
      endTime: at(hour + 3),
      priceAvg: costCents / 8,
      priceCategory: 'NORMAL',
      pricePoints: [],
      costCents,
    };
  }),
});

const overview = { current: { price: 4.82, priceCategory: 'NORMAL' }, upcomingHours: [] } as unknown as OverviewDto;

describe('SaunaComponent', () => {
  let fixture: ComponentFixture<SaunaComponent>;

  const render = (starts$: Observable<OptimalWindowsDto>) => {
    TestBed.configureTestingModule({
      imports: [SaunaComponent],
      providers: [
        provideRouter([]),
        { provide: SaunaService, useValue: { getStarts: () => starts$ } },
        { provide: OverviewService, useValue: { getOverview: () => of(overview) } },
      ],
    });
    fixture = TestBed.createComponent(SaunaComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string => element().querySelector(selector)?.textContent?.trim() ?? '';
  const button = (testId: string) => element().querySelector<HTMLButtonElement>(`[data-test-id="${testId}"]`)!;
  const click = (testId: string) => {
    button(testId).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('answers with the cheapest evening start today', () => {
    render(of(response(45, 48)));

    expect(text('h1')).toBe('Milloin saunotaan?');
    expect(text('.answer__value')).toBe('22:00');
    expect(text('.answer__instruction')).toBe('Aloita lämmitys tänään kello 21:00, niin sauna on lämmin kello 22:00.');
    expect(text('.answer__reason')).toBe(
      'Saunominen maksaa 39,7 senttiä, eli 12,3 senttiä vähemmän kuin jos lämmitys aloitetaan kello 17:00.',
    );
    expect(text('.answer__times')).toBe('tänään · kiuas päällä 21:00–24:00');
    expect(button('sauna-day-today').getAttribute('aria-pressed')).toBe('true');
    expect(button('sauna-part-evening').getAttribute('aria-pressed')).toBe('true');
    expect(button('sauna-part-day').disabled).toBeFalse();
    expect(element().querySelector('.notice')).toBeNull();
  });

  it('recommends the usual sauna time when a later start saves only a little', () => {
    // Warm at 22:00 is 6 cents cheaper than warm at 20:00
    render(of(response(45, 48, (hour) => (hour === 21 ? 44 : hour === 19 ? 50 : 52))));

    expect(text('.answer__value')).toBe('20:00');
    expect(text('.answer__instruction')).toBe('Aloita lämmitys tänään kello 19:00, niin sauna on lämmin kello 20:00.');
    expect(text('.answer__reason')).toBe(
      'Saunominen maksaa 50,0 senttiä, eli 2,0 senttiä vähemmän kuin jos lämmitys aloitetaan kello 17:00. ' +
        'Kello 22:00 sauna olisi 6,0 senttiä halvempi, mutta niin pieni säästö ei ole tavallisesta ' +
        'saunomisajasta luopumisen arvoinen.',
    );
    expect(element().querySelectorAll('.start__bar--best').length).toBe(1);
    expect(element().querySelectorAll('.start__bar--cheapest').length).toBe(1);
    expect(text('.starts__picked-compare')).toBe(
      'Suositus: sauna lämmin klo 20:00. Halvin aloitus (klo 21:00) olisi 6,0 snt halvempi.',
    );
  });

  it('switches to tomorrow from the cheaper-day button', () => {
    render(of(response(45, 48)));

    expect(text('[data-test-id="sauna-other-day"]')).toBe('Huomenna saunaan kello 19:00, 15,7 snt halvempi');
    click('sauna-other-day');

    expect(text('.answer__value')).toBe('19:00');
    expect(button('sauna-day-tomorrow').getAttribute('aria-pressed')).toBe('true');
  });

  it('shows starts without prices as missing and explains why', () => {
    render(of(response(39, 42)));
    click('sauna-day-tomorrow');

    expect(button('sauna-part-evening').disabled).toBeTrue();
    expect(button('sauna-part-day').getAttribute('aria-pressed')).toBe('true');
    expect(text('[data-test-id="sauna-day-tomorrow"] .choice__note')).toBe('hinnat klo 18:00 asti');
    expect(element().querySelectorAll('.start__bar--missing').length).toBe(1);
    expect(text('.notice')).toContain('Huomisen hinnat ovat tiedossa vain kello 18:00 asti');
  });

  it('disables tomorrow before its prices are published', () => {
    render(of(response(21, 24)));

    expect(button('sauna-day-tomorrow').disabled).toBeTrue();
    expect(text('.notice')).toBe(
      'Huomisen hinnat julkaistaan noin kello 14. Silloin voit verrata, onko huominen halvempi.',
    );
  });

  it('shows the price of a tapped start', () => {
    render(of(response(45, 48)));

    expect(text('.starts__picked-main')).toBe('Kiuas päälle klo 21:00 · yhteensä 39,7 snt');
    expect(text('.starts__picked-compare')).toBe('Halvin aloitus: 24 % halvempi kuin kallein (klo 17:00).');
    element().querySelectorAll<HTMLButtonElement>('[data-test-id="sauna-start-bar"]')[0].click();
    fixture.detectChanges();
    expect(text('.starts__picked-main')).toBe('Kiuas päälle klo 17:00 · yhteensä 52,0 snt');
    expect(text('.starts__picked-compare')).toBe('12,3 snt (+31 %) kalliimpi kuin halvin (klo 21:00).');
  });

  it('shows tomorrow once the evening is over, with a button for tonight', () => {
    jasmine.clock().mockDate(LATE);
    render(of(response(45, 48)));

    expect(text('.answer__value')).toBe('19:00');
    expect(button('sauna-day-tomorrow').getAttribute('aria-pressed')).toBe('true');
    expect(text('.notice')).toBe('Tämän illan saunavuorot ovat jo ohi, joten näytämme huomisen.');
    expect(element().querySelector('[data-test-id="sauna-other-day"]')).toBeNull();
    expect(text('[data-test-id="sauna-tonight"]')).toBe('Saunotko vielä tänään? Saunaan kello 00:00, 52,0 snt');

    click('sauna-tonight');
    expect(text('.answer__value')).toBe('00:00');
    expect(button('sauna-day-today').getAttribute('aria-pressed')).toBe('true');
    expect(button('sauna-part-any').getAttribute('aria-pressed')).toBe('true');
    expect(element().querySelector('[data-test-id="sauna-tonight"]')).toBeNull();
  });

  it('shows the error message', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('.message')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
  });
});
