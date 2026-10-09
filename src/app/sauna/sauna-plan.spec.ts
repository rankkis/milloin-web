import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';
import {
  cheaperOtherDay,
  dayHasPrices,
  hasPrices,
  missingPricesNotice,
  planSauna,
  saunaStarts,
  tomorrowNote,
} from './sauna-plan';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');
// Midnight starting 2026-10-07 in Finnish time
const TODAY = Date.parse('2026-10-06T21:00:00.000Z');
const HOUR_MS = 60 * 60 * 1000;

/** Hour h of today in Finnish time; 24 and later are tomorrow's hours */
const at = (hour: number) => new Date(TODAY + hour * HOUR_MS).toISOString();

/**
 * Sauna starts from 14:00 today, one per hour with these costs, and the
 * prices reaching to `pricesEndHour` (hours from today's midnight).
 */
const saunaResponse = (costs: number[], pricesEndHour = 48): OptimalWindowsDto => ({
  durationHours: 3,
  energyKwh: 8,
  earliestStart: NOW.toISOString(),
  latestEnd: at(pricesEndHour),
  windows: [],
  startOffsets: costs.map(
    (costCents, i): StartOffsetWindowDto => ({
      offsetHours: i + 0.25,
      startTime: at(14 + i),
      endTime: at(17 + i),
      priceAvg: costCents / 8,
      priceCategory: 'NORMAL',
      pricePoints: [],
      costCents,
    }),
  ),
});

/** Cost of each start hour from 14:00 today: index 0 is 14:00, 10 is 24:00 (tomorrow 00:00) */
const costsUntil = (lastStartHour: number, cost: (hour: number) => number) =>
  Array.from({ length: lastStartHour - 14 + 1 }, (_, i) => cost(14 + i));

describe('sauna plan', () => {
  // Prices to the end of tomorrow: the last start is tomorrow 21:00
  const full = saunaResponse(costsUntil(45, (h) => (h === 21 ? 30 : h === 36 ? 20 : 50)));
  // Tomorrow's prices only to 18:00: the last start is tomorrow 15:00
  const partial = saunaResponse(costsUntil(39, (h) => (h === 21 ? 30 : h === 36 ? 20 : 50)), 42);
  // Only today's prices: the last start is today 21:00
  const todayOnly = saunaResponse(costsUntil(21, (h) => (h === 21 ? 30 : 50)), 24);

  it('lists the afternoon starts from the next full hour', () => {
    const starts = saunaStarts(full, NOW, 0, 'pm');
    expect(starts.map((s) => s.hour)).toEqual([14, 15, 16, 17, 18, 19, 20, 21]);
    expect(starts.every((s) => s.window)).toBeTrue();
  });

  it('picks the cheapest start and the most expensive one', () => {
    const plan = planSauna(full, NOW, 0, 'pm')!;
    expect([plan.day, plan.part, plan.best.hour, plan.worst.window.costCents]).toEqual([0, 'pm', 21, 50]);
  });

  it('suggests tomorrow when it is cheaper at the same time of day', () => {
    const plan = planSauna(full, NOW, 0, 'pm')!;
    const other = cheaperOtherDay(full, NOW, plan)!;
    expect([other.day, other.hour, other.window.costCents]).toEqual([1, 12, 20]);
  });

  it('disables a morning that has passed and falls back to the afternoon', () => {
    expect(hasPrices(full, NOW, 0, 'am')).toBeFalse();
    expect(planSauna(full, NOW, 0, 'am')!.part).toBe('pm');
  });

  it('marks starts past the published prices as missing', () => {
    const plan = planSauna(partial, NOW, 1, 'pm')!;
    expect(plan.starts.filter((s) => !s.window).map((s) => s.hour)).toEqual([16, 17, 18, 19, 20, 21]);
    expect(missingPricesNotice(partial, NOW, plan)).toBe(
      'Huomisen hinnat ovat tiedossa vain kello 18:00 asti, joten kello 16:00–21:00 alkavien vuorojen hintaa ' +
        'ei voi vielä laskea. Puuttuvat hinnat päivittyvät tähän, kun ne julkaistaan.',
    );
    expect(tomorrowNote(partial, NOW)).toBe('hinnat klo 18:00 asti');
  });

  it('explains starts that would run past midnight', () => {
    const plan = planSauna(full, NOW, 1, 'any')!;
    expect(missingPricesNotice(full, NOW, plan)).toBe(
      'Sauna jatkuisi yli puolenyön, joten kello 22:00–23:00 alkavien vuorojen hintaa ei voi vielä laskea. ' +
        'Ylihuomisen hinnat julkaistaan huomenna noin kello 14.',
    );
  });

  it('disables tomorrow and says when its prices come', () => {
    expect(dayHasPrices(todayOnly, NOW, 1)).toBeFalse();
    const plan = planSauna(todayOnly, NOW, 1, 'pm')!;
    expect(plan.day).toBe(0);
    expect(tomorrowNote(todayOnly, NOW)).toBe('hinnat noin klo 14');
    expect(missingPricesNotice(todayOnly, NOW, plan)).toBe(
      'Huomisen hinnat julkaistaan noin kello 14. Silloin voit verrata, onko huominen halvempi.',
    );
  });

  it('has no plan when no start has a price', () => {
    expect(planSauna(saunaResponse([], 24), NOW, 0, 'pm')).toBeUndefined();
  });

  it('shows no notice when every start shown has a price', () => {
    expect(missingPricesNotice(full, NOW, planSauna(full, NOW, 0, 'pm')!)).toBeUndefined();
  });
});
