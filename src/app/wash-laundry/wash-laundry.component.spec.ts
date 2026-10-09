import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { WashLaundryComponent } from './wash-laundry.component';
import { LaundrySchedule, WashLaundryService } from './wash-laundry.service';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import { StartDelayDto } from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');

const delay = (delayHours: number, costCents: number, isBest = false): StartDelayDto => ({
  delayHours,
  startTime: '',
  endTime: '',
  priceAvg: costCents,
  priceCategory: 'CHEAP',
  costCents,
  isBest,
});

const schedule = (startDelays: StartDelayDto[]): LaundrySchedule => ({
  startDelays,
  durationHours: 2,
  energyKwh: 1.5,
});

const overview = {
  current: { price: 4.82, priceCategory: 'NORMAL' },
} as OverviewDto;

describe('WashLaundryComponent', () => {
  let fixture: ComponentFixture<WashLaundryComponent>;

  const render = (schedule$: Observable<LaundrySchedule>) => {
    TestBed.configureTestingModule({
      imports: [WashLaundryComponent],
      providers: [
        provideRouter([]),
        { provide: WashLaundryService, useValue: { getOptimalSchedule: () => schedule$ } },
        { provide: OverviewService, useValue: { getOverview: () => of(overview) } },
      ],
    });
    fixture = TestBed.createComponent(WashLaundryComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string =>
    element().querySelector(selector)?.textContent?.trim() ?? '';

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => jasmine.clock().uninstall());

  const texts = (selector: string): string[] =>
    Array.from(element().querySelectorAll(selector)).map((e) => e.textContent?.trim() ?? '');

  /** Delays Nyt, +1, +2 … with these costs; isBest marks the cheapest as the backend does */
  const delays = (...costs: number[]): StartDelayDto[] => {
    const min = Math.min(...costs);
    return costs.map((cost, hours) => delay(hours, cost, cost === min));
  };

  it('recommends a delay that saves enough and tells about a cheaper later start', () => {
    render(of(schedule(delays(14.8, 12.9, 6.6, 6.1, 5.4, 5.0))));

    expect(text('h1')).toBe('Milloin pestään pyykit?');
    expect(text('.answer__value')).toBe('+2 h');
    expect(text('.answer__instruction')).toBe('Aseta koneen ajastus kahteen tuntiin.');
    expect(text('.answer__reason')).toBe(
      'Säästät 8,2 senttiä verrattuna heti käynnistämiseen. ' +
        'Pesu olisi 5 tunnin päästä vielä 1,6 senttiä halvempi, mutta lisäodotus ei kannata.',
    );
    expect(text('.answer__times')).toBe('käynnistyy 15:42 · valmis 17:42');
    expect(text('app-answer-header .price')).toContain('nyt 4,82');
  });

  it('recommends a delay that is also the cheapest', () => {
    render(of(schedule(delays(10, 5, 5, 5, 5, 5))));

    expect(text('.answer__value')).toBe('+1 h');
    expect(text('.answer__instruction')).toBe('Aseta koneen ajastus yhteen tuntiin.');
    expect(text('.answer__reason')).toBe('Säästät 5,0 senttiä verrattuna heti käynnistämiseen.');
    expect(texts('.legend__item')).toEqual(['suositus']);
  });

  it('starts now when a cheaper later start saves too little', () => {
    render(of(schedule(delays(7.6, 8.1, 6.9, 5.2, 4.5, 6.3))));

    expect(text('.answer__value')).toBe('Nyt');
    expect(text('.answer__instruction')).toBe('Käynnistä kone nyt.');
    expect(text('.answer__reason')).toBe(
      'Pesu olisi 4 tunnin päästä 3,1 senttiä halvempi, mutta niin pieni säästö ei ole odottamisen arvoinen.',
    );
    expect(text('.answer__times')).toBe('käynnistyy 13:42 · valmis 15:42');
  });

  it('says one hour as "tunnin päästä"', () => {
    render(of(schedule(delays(5.8, 4.0, 4.2, 8.5, 14.6, 16.6))));

    expect(text('.answer__reason')).toBe(
      'Pesu olisi tunnin päästä 1,8 senttiä halvempi, mutta niin pieni säästö ei ole odottamisen arvoinen.',
    );
  });

  it('says the price stays nearly the same when a later start saves under a cent', () => {
    render(of(schedule(delays(5, 4.5, 6, 7))));

    expect(text('.answer__reason')).toBe(
      'Hinta pysyy lähes samana seuraavat 3 tuntia, joten odottaminen ei kannata.',
    );
  });

  it('starts now when now is cheapest', () => {
    render(of(schedule(delays(3, 4, 5, 6, 7, 8))));

    expect(text('.answer__value')).toBe('Nyt');
    expect(text('.answer__instruction')).toBe('Käynnistä kone nyt.');
    expect(text('.answer__reason')).toBe('Seuraavan 5 tunnin aikana pesu ei tule halvemmaksi.');
    expect(texts('.stat dt')[1]).toBe('Halvin vaihtoehto');
    expect(texts('.stat:nth-child(2) dd')).toEqual(['Nyt', 'halvin seuraaviin 5 tuntiin']);
  });

  it('marks the recommended and the cheapest delay in the strip', () => {
    render(of(schedule(delays(14.8, 12.9, 6.6, 6.1, 5.4, 5.0))));

    const cells = Array.from(element().querySelectorAll<HTMLElement>('.delay'));
    expect(cells.map((d) => d.querySelector('.delay__label')?.textContent?.trim())).toEqual([
      'Nyt',
      '+1',
      '+2',
      '+3',
      '+4',
      '+5',
    ]);
    expect(cells.map((d) => d.querySelector('.delay__cost')?.textContent?.trim())).toEqual([
      '25,2',
      '23,3',
      '17,0',
      '16,5',
      '15,8',
      '15,4',
    ]);
    expect(cells[2].tagName).toBe('BUTTON');
    expect(cells[2].classList).toContain('delay--recommended');
    expect(cells[2].getAttribute('aria-label')).toBe('2 tunnin päästä: 17,0 senttiä, suositus');
    expect(cells[5].classList).toContain('delay--cheapest');
    expect(cells[5].getAttribute('aria-label')).toBe('5 tunnin päästä: 15,4 senttiä, halvin');
    expect(cells[1].getAttribute('aria-label')).toBe('tunnin päästä: 23,3 senttiä');
    expect((cells[0].querySelector('.delay__bar') as HTMLElement).style.height).toBe('64px');
    expect(texts('.legend__item')).toEqual(['suositus', 'halvin']);
  });

  it('says suositus ja halvin when the recommendation is the cheapest', () => {
    render(of(schedule(delays(3, 4))));

    const button = element().querySelector('[data-test-id="laundry-recommended-delay"]');
    expect(button?.getAttribute('aria-label')).toBe('Nyt: 13,4 senttiä, suositus ja halvin');
    expect(element().querySelector('.delay--cheapest')).toBeNull();
  });

  it('shows the cost, saving and spot price of the recommended delay', () => {
    render(of(schedule(delays(14.8, 12.9, 6.6, 6.1, 5.4, 5.0))));

    expect(texts('.stat__value')).toEqual(['17,0', '−33 %', '6,60']);
    expect(text('.stat:nth-child(2) dt')).toBe('Säästö vs. nyt');
    expect(text('.stat:nth-child(2) .stat__note')).toBe('8,2 senttiä');
    expect(text('.stat:nth-child(3) .stat__note')).toBe('c/kWh · halpa');
    expect(texts('.basis p')).toEqual([
      'Laskettu 2 tunnin ohjelmalle ja 1,5 kWh:n kulutukselle.',
      'Hinta = 1,5 kWh × (spot 4,40 + siirto 3,50 + sähkövero 2,92 + marginaali 0,50 c/kWh) = 17,0 snt. ' +
        'Siirto ja marginaali ovat tyypillisiä arvoja. Hinnat sis. alv 25,5 %, kuukausimaksut eivät sisälly.',
    ]);
  });

  it('shows the cheapest option when waiting is not worth it', () => {
    render(of(schedule(delays(7.6, 8.1, 6.9, 5.2, 4.5, 6.3))));

    expect(texts('.stat__value')).toEqual(['18,0', '+4 h', '7,60']);
    expect(text('.stat:nth-child(2) dt')).toBe('Halvin vaihtoehto');
    expect(text('.stat:nth-child(2) .stat__note')).toBe('3,1 snt halvempi');
  });

  describe('rule tooltip', () => {
    const tip = () => element().querySelector<HTMLElement>('[role="tooltip"]')!;
    const button = () =>
      element().querySelector<HTMLButtonElement>('[data-test-id="laundry-recommended-delay"]')!;
    const tap = (target: HTMLElement) => {
      target.dispatchEvent(new PointerEvent('click', { bubbles: true, detail: 1, pointerType: 'touch' }));
      fixture.detectChanges();
    };

    beforeEach(() => render(of(schedule(delays(14.8, 12.9, 6.6, 6.1, 5.4, 5.0)))));

    it('explains the rule and is described by the recommended cell', () => {
      expect(tip().hidden).toBeTrue();
      expect(tip().textContent?.trim()).toBe(
        'Odottaminen kannattaa vasta, kun säästö on vähintään 5 senttiä. ' +
          'Jokainen lisätunti vaatii 2 senttiä enemmän säästöä.',
      );
      expect(button().getAttribute('aria-describedby')).toBe(tip().id);
      expect(tip().classList).toContain('tip--center');
    });

    it('toggles on tap and closes on a tap elsewhere', () => {
      tap(button());
      expect(tip().hidden).toBeFalse();
      tap(button());
      expect(tip().hidden).toBeTrue();

      tap(button());
      tap(element().querySelector('h1')!);
      expect(tip().hidden).toBeTrue();
    });

    it('opens on mouse hover and closes on Esc', () => {
      button().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      fixture.detectChanges();
      expect(tip().hidden).toBeFalse();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(tip().hidden).toBeTrue();
    });
  });

  it('explains when there are not enough prices', () => {
    render(of(schedule([])));

    expect(text('.message')).toContain('Hintoja ei ole vielä julkaistu');
    expect(element().querySelector('.delays')).toBeNull();
  });

  it('shows the error from the service', () => {
    render(throwError(() => ({ userMessage: 'Verkkoyhteysvirhe - tarkista internetyhteys' })));

    expect(text('[role="alert"]')).toBe('Verkkoyhteysvirhe - tarkista internetyhteys');
  });
});
