import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { EnceComponent } from './ence.component';
import { EnceDto } from './ence.model';
import { EnceService } from './ence.service';

// Friday 9.10.2026 13:50 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-09T10:50:00.000Z');

const stream = (name: string, language: string, official = false) => ({
  name,
  platform: 'Twitch',
  language,
  url: `https://www.twitch.tv/${name}`,
  official,
});

const ence: EnceDto = {
  updatedAt: '2026-10-09T10:12:00.000Z',
  source: 'PandaScore',
  team: { name: 'ENCE', logo: 'ence/logos/0123456789abcdef' },
  nextMatch: {
    startTime: '2026-10-10T15:30:00.000Z',
    live: false,
    opponent: { name: 'Sashi' },
    event: 'CCT Europe Series 9',
    format: 'Bo3',
    streams: [stream('cct_cs', 'en', true), stream('suomistriimi', 'fi')],
  },
  upcoming: [
    {
      startTime: '2026-10-13T13:00:00.000Z',
      live: false,
      opponent: { name: 'Rebels' },
      event: 'CCT Europe Series 9',
      format: 'Bo3',
    },
  ],
  results: [],
  news: [
    {
      title: 'ENCE sign a new coach',
      source: 'HLTV.org',
      url: 'https://news.example/1',
      publishedAt: '2026-10-08T09:12:00.000Z',
    },
  ],
};

describe('EnceComponent', () => {
  let fixture: ComponentFixture<EnceComponent>;

  const render = (ence$: Observable<EnceDto>) => {
    TestBed.configureTestingModule({
      imports: [EnceComponent],
      providers: [
        provideRouter([]),
        {
          provide: EnceService,
          useValue: { getEnce: () => ence$, logoUrl: (path: string) => `https://api.test/${path}` },
        },
      ],
    });
    fixture = TestBed.createComponent(EnceComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  const element = (selector: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector);

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

  it('answers with the next match', () => {
    render(of(ence));

    expect(text('h1')).toBe('Milloin Ence pelaa?');
    expect(text('.answer__value')).toBe('la 18:30');
    expect(text('.answer__sentence')).toBe('ENCE vs. Sashi');
    expect(text('.answer__when')).toBe('huomenna · alkaa 1 pv 4 h 40 min päästä');
    expect(element('.live')).toBeNull();
  });

  it('shows both teams, with the copied logo or a placeholder', () => {
    render(of(ence));

    expect(texts('.team__name')).toEqual(['ENCE', 'Sashi']);
    expect(element('img.team__logo')?.getAttribute('src')).toBe('https://api.test/ence/logos/0123456789abcdef');
    expect(element('.team__logo--none')).not.toBeNull();
    expect(texts('.match__facts span')).toEqual(['CCT Europe Series 9', 'Bo3', 'la 10.10. 18:30']);
  });

  it('links each stream in its own tab', () => {
    render(of(ence));

    const first = element('[data-test-id="ence-stream-1"]');
    expect(first?.getAttribute('href')).toBe('https://www.twitch.tv/cct_cs');
    expect(first?.getAttribute('target')).toBe('_blank');
    expect(texts('.stream__meta')).toEqual(['Twitch · englanti', 'Twitch · suomi']);
    expect(texts('.stream__tag')).toEqual(['virallinen']);
  });

  it('lists the next matches and news', () => {
    render(of(ence));

    expect(texts('.row__when')).toEqual(['ti 13.10. 16:00', 'to 8.10.']);
    expect(text('[data-test-id="ence-news-1"] .row__text')).toBe('ENCE sign a new coach HLTV.org');
  });

  it('shows a running match as live', () => {
    render(of({ ...ence, nextMatch: { ...ence.nextMatch!, startTime: '2026-10-09T10:30:00.000Z', live: true } }));

    expect(text('.answer__value')).toBe('Nyt');
    expect(text('.live')).toBe('LIVE');
    expect(text('.answer__when')).toBe('alkoi 13:30');
  });

  it('shows the latest results when no match is scheduled', () => {
    render(
      of({
        ...ence,
        nextMatch: undefined,
        upcoming: [],
        results: [
          {
            startTime: '2026-10-07T16:00:00.000Z',
            opponent: { name: 'Sashi' },
            event: 'CCT',
            teamScore: 2,
            opponentScore: 1,
          },
        ],
      }),
    );

    expect(text('.answer__value')).toBe('Ei tiedossa');
    expect(element('.match')).toBeNull();
    expect(element('.streams')).toBeNull();
    expect(text('#results-title')).toBe('Viimeksi pelatut');
    expect(text('.row__end')).toBe('2–1');
  });

  it('shows the error', () => {
    render(throwError(() => ({ userMessage: 'Palvelinvirhe - yritä myöhemmin uudelleen' })));

    expect(text('.message')).toBe('Palvelinvirhe - yritä myöhemmin uudelleen');
  });
});
