import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { WashLaundryComponent } from './wash-laundry.component';
import { WashLaundryOptimalScheduleDto, WashLaundryService } from './wash-laundry.service';
import { OverviewDto, OverviewService } from '../shared/services/overview.service';
import { StartDelayDto } from '../shared/models/price.model';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');

const delay = (delayHours: number, costCents: number, isBest = false): StartDelayDto => ({
  delayHours,
  startTime: '',
  endTime: '',
  priceAvg: costCents,
  costCents,
  isBest,
});

const schedule = (startDelays: StartDelayDto[]): WashLaundryOptimalScheduleDto => ({
  startDelays,
  defaults: {
    exchangeTariffCentsKwh: 0,
    marginTariffCentsKwh: 0,
    powerConsumptionKwh: 1,
    periodHours: 2,
  },
});

const overview = {
  current: { price: 4.82, priceCategory: 'NORMAL' },
} as OverviewDto;

describe('WashLaundryComponent', () => {
  let fixture: ComponentFixture<WashLaundryComponent>;

  const render = (schedule$: Observable<WashLaundryOptimalScheduleDto>) => {
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

  it('answers with the best start delay and when the wash runs', () => {
    render(of(schedule([delay(0, 5.8), delay(1, 4.02, true), delay(2, 4.2), delay(3, 8.5)])));

    expect(text('h1')).toBe('Milloin kannattaa pestä pyykkiä?');
    expect(text('.answer__value')).toBe('+1 h');
    expect(text('.answer__sentence')).toBe('Aseta koneen ajastus yhteen tuntiin.');
    expect(text('.answer__times')).toBe('käynnistyy 14:42 · valmis 16:42');
    expect(text('app-answer-header .price')).toContain('nyt 4,82');
  });

  it('shows the cost of every delay and highlights the best', () => {
    render(of(schedule([delay(0, 5.8), delay(1, 4.02, true), delay(2, 8)])));

    const delays = Array.from(element().querySelectorAll('.delay'));
    expect(delays.map((d) => d.querySelector('.delay__label')?.textContent?.trim())).toEqual([
      'Nyt',
      '+1',
      '+2',
    ]);
    expect(delays.map((d) => d.querySelector('.delay__cost')?.textContent?.trim())).toEqual([
      '5,8',
      '4,0',
      '8,0',
    ]);
    expect(delays[1].classList).toContain('delay--best');
    expect(delays[1].getAttribute('aria-label')).toBe('1 tunnin päästä: 4,0 senttiä, halvin');
    expect((delays[2].querySelector('.delay__bar') as HTMLElement).style.height).toBe('64px');
  });

  it('shows the cost, saving and spot price of the best delay', () => {
    render(of(schedule([delay(0, 5.8), delay(1, 4.02, true)])));

    const values = Array.from(element().querySelectorAll('.stat__value')).map((v) =>
      v.textContent?.trim(),
    );
    expect(values).toEqual(['4,0', '−31 %', '4,02']);
    expect(text('.stat:nth-child(2) .stat__note')).toBe('1,8 senttiä');
    expect(text('.stat:nth-child(3) .stat__note')).toBe('c/kWh · halpa');
    expect(text('.basis')).toContain('Laskettu 2 tunnin ohjelmalle ja 1 kWh:n kulutukselle.');
  });

  it('says to start now when now is cheapest', () => {
    render(of(schedule([delay(0, 3, true), delay(1, 4)])));

    expect(text('.answer__value')).toBe('Nyt');
    expect(text('.answer__sentence')).toBe('Käynnistä kone heti, nyt on halvinta.');
    expect(text('.stat:nth-child(2) .stat__value')).toBe('0 %');
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
