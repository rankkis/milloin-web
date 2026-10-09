import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EnceService } from '../ence/ence.service';
import { MiscComponent } from './misc.component';

describe('MiscComponent', () => {
  beforeEach(() => {
    jasmine.clock().install();
    // Friday 9.10.2026 13:50 Finnish time
    jasmine.clock().mockDate(new Date('2026-10-09T10:50:00.000Z'));
  });

  afterEach(() => jasmine.clock().uninstall());

  it('lists the questions with their answers', () => {
    TestBed.configureTestingModule({
      imports: [MiscComponent],
      providers: [
        provideRouter([]),
        {
          provide: EnceService,
          useValue: {
            getEnce: () =>
              of({
                updatedAt: '2026-10-09T10:12:00.000Z',
                source: 'PandaScore',
                team: { name: 'ENCE' },
                nextMatch: {
                  startTime: '2026-10-10T15:30:00.000Z',
                  live: false,
                  opponent: { name: 'Sashi' },
                  event: 'CCT Europe Series 9',
                  streams: [],
                },
                upcoming: [],
                results: [],
                news: [],
              }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MiscComponent);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const text = (selector: string) => page.querySelector(selector)?.textContent?.trim().replace(/\s+/g, ' ');

    expect(text('h1')).toBe('Sekalaista');
    expect(text('.question__text')).toBe('Milloin Ence pelaa?');
    expect(page.querySelector('[data-test-id="misc-ence"]')?.getAttribute('href')).toBe('/ence-pelaa');
    expect(text('.question__answer')).toBe('la 18:30');
    expect(text('.question__short')).toBe('huomenna · vs. Sashi');
  });
});
