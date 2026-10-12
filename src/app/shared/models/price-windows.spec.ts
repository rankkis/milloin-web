import { V1PriceDto, V1PricesDto } from './api-v1.model';
import { hourlyPrices, priceCategory, windowAt } from './price-windows';
import { toOverview } from '../services/overview.service';
import { laundryWindows } from '../../wash-laundry/wash-laundry.service';
import { saunaWindows } from '../../sauna/sauna.service';
import { toChargeWindows } from '../../charge-ev/charge-ev.service';

const QUARTER_MS = 15 * 60 * 1000;
const START = Date.parse('2026-10-12T10:00:00.000Z');

/** 15-minute prices in c/kWh from START */
const quarters = (cents: number[]): V1PriceDto[] =>
  cents.map((price, q) => ({
    startTime: new Date(START + q * QUARTER_MS).toISOString(),
    endTime: new Date(START + (q + 1) * QUARTER_MS).toISOString(),
    price,
    category: priceCategory(price),
    dayCategory: 'NORMAL',
  }));

/** A /v1/electricity/prices response with the current quarter at `currentQuarter` */
const response = (cents: number[], currentQuarter = 0): V1PricesDto => {
  const prices = quarters(cents);
  return {
    current: prices[currentQuarter],
    prices,
    meta: { pricesUntil: prices[prices.length - 1].endTime, tomorrowPublished: false },
  };
};

describe('price windows', () => {
  it('averages clock hours from a given hour on', () => {
    const hours = hourlyPrices(quarters([1, 2, 3, 4, 10, 10, 10, 10]), START + 4 * QUARTER_MS);

    expect(hours).toEqual([
      {
        startTime: '2026-10-12T11:00:00.000Z',
        endTime: '2026-10-12T12:00:00.000Z',
        priceAvg: 10,
        priceCategory: 'EXPENSIVE',
      },
    ]);
  });

  it('costs a run and leaves out one past the published prices', () => {
    const prices = quarters([2, 4, 6, 8]);

    expect(windowAt(prices, START, 0, 1, 2)).toEqual(
      jasmine.objectContaining({ priceAvg: 5, costCents: 10, priceCategory: 'NORMAL' }),
    );
    expect(windowAt(prices, START, 0.25, 1, 2)).toBeUndefined();
  });

  it('turns /v1/electricity/prices into the overview', () => {
    const overview = toOverview(response([1, 2, 3, 4, 8, 8, 8, 8], 1));

    expect(overview.current).toEqual({ price: 2, priceCategory: 'VERY_CHEAP' });
    expect(overview.upcomingHours.map((hour) => hour.priceAvg)).toEqual([2.5, 8]);
  });

  it('costs the laundry program now and after each timer delay that fits', () => {
    // 4 hours of prices: starts at +0, +1 and +2 h fit
    const windows = laundryWindows(response(Array(16).fill(4)));

    expect(windows.startOffsets?.map((window) => [window.offsetHours, window.costCents])).toEqual([
      [0, 6],
      [1, 6],
      [2, 6],
    ]);
  });

  it('starts sauna sessions on every full hour after now', () => {
    // Now 10:15; prices until 16:00, so sessions start 11, 12 and 13
    const windows = saunaWindows(response(Array(24).fill(5), 1));

    expect(windows.startOffsets?.map((window) => window.startTime)).toEqual([
      '2026-10-12T11:00:00.000Z',
      '2026-10-12T12:00:00.000Z',
      '2026-10-12T13:00:00.000Z',
    ]);
    expect(windows.startOffsets?.[0].costCents).toBe(40);
  });

  it('reads charging windows from /v1/electricity/plans', () => {
    const windows = toChargeWindows({
      request: {
        durationHours: 4,
        energyKwh: 44,
        earliestStart: '2026-10-12T10:00:00.000Z',
        latestEnd: '2026-10-13T21:00:00.000Z',
      },
      startNow: {
        startTime: '2026-10-12T10:00:00.000Z',
        endTime: '2026-10-12T14:00:00.000Z',
        priceAvg: 8,
        category: 'NORMAL',
        costCents: 352,
      },
      plans: [
        {
          startTime: '2026-10-13T00:00:00.000Z',
          endTime: '2026-10-13T04:00:00.000Z',
          priceAvg: 2,
          category: 'VERY_CHEAP',
          costCents: 88,
          savingsCents: 264,
        },
      ],
    });

    expect(windows.startNow?.priceAvg).toBe(8);
    expect(windows.windows[0]).toEqual(
      jasmine.objectContaining({ priceAvg: 2, priceCategory: 'VERY_CHEAP', savingsCents: 264 }),
    );
  });
});
