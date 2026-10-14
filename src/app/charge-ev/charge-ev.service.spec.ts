import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChargeEvService, chargeReadyBy } from './charge-ev.service';
import { V1PlansDto } from '../shared/models/api-v1.model';

const plans = (startTime?: string, endTime?: string, latestEnd = '2026-10-08T05:00:00.000Z'): V1PlansDto =>
  ({
    request: {
      durationHours: 4,
      energyKwh: 44,
      earliestStart: '2026-10-07T10:45:00.000Z',
      latestEnd,
    },
    plans:
      startTime && endTime ? [{ startTime, endTime, priceAvg: 2, category: 'CHEAP', costCents: 88 }] : [],
  }) as unknown as V1PlansDto;

describe('chargeReadyBy', () => {
  it('is 08:00 tomorrow from 04:00 on', () => {
    // 13:42 Finnish summer time
    expect(chargeReadyBy(new Date('2026-10-07T10:42:00.000Z')).toISOString()).toBe('2026-10-08T05:00:00.000Z');
    // 04:00
    expect(chargeReadyBy(new Date('2026-10-07T01:00:00.000Z')).toISOString()).toBe('2026-10-08T05:00:00.000Z');
  });

  it('is 08:00 today before 04:00', () => {
    // 03:59
    expect(chargeReadyBy(new Date('2026-10-07T00:59:00.000Z')).toISOString()).toBe('2026-10-07T05:00:00.000Z');
    // 00:30
    expect(chargeReadyBy(new Date('2026-10-06T21:30:00.000Z')).toISOString()).toBe('2026-10-07T05:00:00.000Z');
  });

  it('follows Finnish winter time and the month end', () => {
    // Summer time ends on 25.10. at 04:00: 08:00 that morning is UTC+2
    expect(chargeReadyBy(new Date('2026-10-24T12:00:00.000Z')).toISOString()).toBe('2026-10-25T06:00:00.000Z');
    // 31.12. 20:00 winter time
    expect(chargeReadyBy(new Date('2026-12-31T18:00:00.000Z')).toISOString()).toBe('2027-01-01T06:00:00.000Z');
  });
});

describe('ChargeEvService', () => {
  let service: ChargeEvService;
  let http: HttpTestingController;
  // 13:42 Finnish summer time
  const now = new Date('2026-10-07T10:42:00.000Z');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChargeEvService, provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChargeEvService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const respond = (byMorning: V1PlansDto, all: V1PlansDto) => {
    http.expectOne((request) => request.url.includes('latestEnd=2026-10-08T05%3A00%3A00.000Z')).flush(byMorning);
    http.expectOne((request) => !request.url.includes('latestEnd')).flush(all);
  };

  it('answers with the cheapest window that ends by 08:00 and keeps the cheapest of all', () => {
    let result: unknown;
    service.getOptimalWindows(now).subscribe((windows) => (result = windows));
    respond(
      plans('2026-10-07T22:00:00.000Z', '2026-10-08T02:00:00.000Z'),
      plans('2026-10-08T18:00:00.000Z', '2026-10-08T22:00:00.000Z', '2026-10-08T21:00:00.000Z'),
    );

    expect(result).toEqual(
      jasmine.objectContaining({
        readyBy: '2026-10-08T05:00:00.000Z',
        fitsReadyBy: true,
        windows: [jasmine.objectContaining({ startTime: '2026-10-07T22:00:00.000Z' })],
        bestAvailable: jasmine.objectContaining({ startTime: '2026-10-08T18:00:00.000Z' }),
      }),
    );
  });

  it('falls back to the cheapest of all when no window ends by 08:00', () => {
    let result: unknown;
    service.getOptimalWindows(now).subscribe((windows) => (result = windows));
    respond(plans(), plans('2026-10-07T18:00:00.000Z', '2026-10-07T22:00:00.000Z', '2026-10-07T21:00:00.000Z'));

    expect(result).toEqual(
      jasmine.objectContaining({
        fitsReadyBy: false,
        windows: [jasmine.objectContaining({ startTime: '2026-10-07T18:00:00.000Z' })],
      }),
    );
  });
});
