import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';
import {
  cheaperOtherDay,
  dayHasPrices,
  hasPrices,
  laterToday,
  missingPricesNotice,
  offHoursWorthIt,
  planSauna,
  saunaStarts,
  tomorrowNote,
} from './sauna-plan';

// 2026-10-07 13:42 Finnish summer time (UTC+3)
const NOW = new Date('2026-10-07T10:42:00.000Z');
// 22:30 the same day, after the last evening start
const LATE = new Date('2026-10-07T19:30:00.000Z');
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
  // Prices to the end of tomorrow: the last start is tomorrow 21:00; cheap at 21:00 today and 18:00 tomorrow
  const cost = (h: number) => (h === 21 ? 30 : h === 42 ? 20 : 50);
  const full = saunaResponse(costsUntil(45, cost));
  // Tomorrow's prices only to 18:00: the last start is tomorrow 15:00
  const partial = saunaResponse(costsUntil(39, cost), 42);
  // Only today's prices: the last start is today 21:00
  const todayOnly = saunaResponse(costsUntil(21, cost), 24);

  it('lists the evening starts from the next full hour', () => {
    const starts = saunaStarts(full, NOW, 0, 'evening');
    expect(starts.map((s) => s.hour)).toEqual([17, 18, 19, 20, 21]);
    expect(starts.every((s) => s.window)).toBeTrue();
    expect(saunaStarts(full, NOW, 0, 'day').map((s) => s.hour)).toEqual([14, 15, 16]);
  });

  it('leaves out night starts 00–05 at any time of day', () => {
    const starts = saunaStarts(full, NOW, 1, 'any').map((s) => s.hour);
    expect(starts[0]).toBe(6);
    expect(starts[starts.length - 1]).toBe(23);
  });

  it('recommends a usual sauna time unless another start saves enough', () => {
    // 21:00 start (warm 22:00) is 8 cents cheaper than 19:00: too little to give up the usual time
    const small = saunaResponse(costsUntil(45, (h) => (h === 21 ? 42 : h === 19 ? 50 : 60)));
    const plan = planSauna(small, NOW, 0, 'evening')!;
    expect([plan.recommended.hour, plan.cheapest.hour]).toEqual([19, 21]);

    // 12 cents cheaper is enough
    const large = saunaResponse(costsUntil(45, (h) => (h === 21 ? 38 : h === 19 ? 50 : 60)));
    expect(planSauna(large, NOW, 0, 'evening')!.recommended.hour).toBe(21);
  });

  it('needs the saving to be both 10 cents and 10 %', () => {
    expect(offHoursWorthIt(50, 40)).toBeTrue();
    expect(offHoursWorthIt(50, 40.1)).toBeFalse();
    expect(offHoursWorthIt(300, 280)).toBeFalse();
    expect(offHoursWorthIt(300, 270)).toBeTrue();
    expect(offHoursWorthIt(-5, -20)).toBeTrue();
  });

  it('recommends the cheapest start by day and at any time', () => {
    const small = saunaResponse(costsUntil(45, (h) => (h === 21 || h === 16 ? 42 : 50)));
    expect(planSauna(small, NOW, 0, 'any')!.recommended.hour).toBe(16);
    expect(planSauna(small, NOW, 0, 'day')!.recommended.hour).toBe(16);
  });

  it('recommends a start outside the usual time when no usual start is left', () => {
    // 20:30: only the 21:00 start is left this evening
    const plan = planSauna(full, new Date('2026-10-07T17:30:00.000Z'), 0, 'evening')!;
    expect(plan.recommended.hour).toBe(21);
  });

  it('compares the other day by its recommended start', () => {
    // Tomorrow's 21:00 start is cheapest but only 5 cents under its 19:00 start, which is 1 cent under today's
    const costs = costsUntil(45, (h) => (h === 19 ? 50 : h === 43 ? 49 : h === 45 ? 44 : 60));
    const response = saunaResponse(costs);
    const other = cheaperOtherDay(response, NOW, planSauna(response, NOW, 0, 'evening')!)!;
    expect([other.day, other.hour]).toEqual([1, 19]);
  });

  it('picks the cheapest start and the most expensive one', () => {
    const plan = planSauna(full, NOW, undefined, 'evening')!;
    expect([plan.day, plan.part, plan.recommended.hour, plan.worst.window.costCents, plan.autoTomorrow]).toEqual([
      0,
      'evening',
      21,
      50,
      false,
    ]);
  });

  it('suggests tomorrow when it is cheaper at the same time of day', () => {
    const plan = planSauna(full, NOW, 0, 'evening')!;
    const other = cheaperOtherDay(full, NOW, plan)!;
    expect([other.day, other.hour, other.window.costCents]).toEqual([1, 18, 20]);
  });

  it('shows tomorrow once the evening is over and offers the rest of tonight', () => {
    expect(hasPrices(full, LATE, 0, 'evening')).toBeFalse();
    const plan = planSauna(full, LATE, undefined, 'evening')!;
    expect([plan.day, plan.part, plan.recommended.hour, plan.autoTomorrow]).toEqual([1, 'evening', 18, true]);
    expect(missingPricesNotice(full, LATE, plan)).toBe('Tämän illan saunavuorot ovat jo ohi, joten näytämme huomisen.');
    expect(cheaperOtherDay(full, LATE, plan)).toBeUndefined();
    expect(laterToday(full, LATE, plan)!.hour).toBe(23);
  });

  it('keeps today when the visitor chose it, falling back to any time', () => {
    const plan = planSauna(full, LATE, 0, 'evening')!;
    expect([plan.day, plan.part, plan.autoTomorrow]).toEqual([0, 'any', false]);
    expect(laterToday(full, LATE, plan)).toBeUndefined();
  });

  it('falls back to the day when the evening has no prices', () => {
    const plan = planSauna(partial, NOW, 1, 'evening')!;
    expect([plan.day, plan.part]).toEqual([1, 'day']);
  });

  it('marks starts past the published prices as missing', () => {
    const plan = planSauna(partial, NOW, 1, 'day')!;
    expect(plan.starts.filter((s) => !s.window).map((s) => s.hour)).toEqual([16]);
    expect(missingPricesNotice(partial, NOW, plan)).toBe(
      'Huomisen hinnat ovat tiedossa vain kello 18:00 asti, joten kello 16:00 alkavien vuorojen hintaa ' +
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
    const plan = planSauna(todayOnly, NOW, 1, 'evening')!;
    expect(plan.day).toBe(0);
    expect(tomorrowNote(todayOnly, NOW)).toBe('hinnat noin klo 14');
    expect(missingPricesNotice(todayOnly, NOW, plan)).toBe(
      'Huomisen hinnat julkaistaan noin kello 14. Silloin voit verrata, onko huominen halvempi.',
    );
  });

  it('has no plan when no start has a price', () => {
    expect(planSauna(saunaResponse([], 24), NOW, undefined, 'evening')).toBeUndefined();
  });

  it('shows no notice when every start shown has a price', () => {
    expect(missingPricesNotice(full, NOW, planSauna(full, NOW, 0, 'evening')!)).toBeUndefined();
  });
});
