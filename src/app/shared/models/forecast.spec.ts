import { ForecastDto, estimatedHours } from './forecast';

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse('2026-10-15T21:00:00.000Z');

const point = (hour: number, price: number, published: boolean) => ({
  startTime: new Date(START + hour * HOUR_MS).toISOString(),
  endTime: new Date(START + (hour + 1) * HOUR_MS).toISOString(),
  price,
  published,
});

const forecast = (points: ForecastDto['points'], resolution: ForecastDto['resolution'] = 'hour'): ForecastDto => ({
  horizon: '72h',
  resolution,
  issuedAt: '2026-10-15T09:00:00.000Z',
  points,
});

describe('estimatedHours', () => {
  it('keeps the unpublished hours from the end of the published prices on, as estimates', () => {
    const hours = estimatedHours(
      forecast([point(2, 12.345, false), point(0, 4, true), point(1, 1.5, false), point(-1, 3, false)]),
      START + HOUR_MS,
    );

    expect(hours).toEqual([
      { ...hourAt(1), priceAvg: 1.5, priceCategory: 'VERY_CHEAP', estimate: true },
      { ...hourAt(2), priceAvg: 12.35, priceCategory: 'EXPENSIVE', estimate: true },
    ]);
  });

  it('leaves out daily forecasts and a missing forecast', () => {
    expect(estimatedHours(forecast([point(1, 5, false)], 'day'), START)).toEqual([]);
    expect(estimatedHours(undefined, START)).toEqual([]);
  });
});

function hourAt(hour: number) {
  return {
    startTime: new Date(START + hour * HOUR_MS).toISOString(),
    endTime: new Date(START + (hour + 1) * HOUR_MS).toISOString(),
  };
}
