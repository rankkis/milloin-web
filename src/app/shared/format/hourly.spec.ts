import { hourlyAverages } from './hourly';

describe('hourlyAverages', () => {
  const point = (startTime: string, price: number) => ({
    startTime,
    endTime: new Date(Date.parse(startTime) + 15 * 60 * 1000).toISOString(),
    price,
  });

  it('averages quarters into clock hours, including a partial first hour', () => {
    const hours = hourlyAverages([
      point('2026-10-07T10:45:00.000Z', 4),
      point('2026-10-07T11:00:00.000Z', 1),
      point('2026-10-07T11:15:00.000Z', 2),
      point('2026-10-07T11:30:00.000Z', 3),
      point('2026-10-07T11:45:00.000Z', 4),
    ]);

    expect(hours).toEqual([
      {
        startTime: '2026-10-07T10:00:00.000Z',
        endTime: '2026-10-07T11:00:00.000Z',
        priceAvg: 4,
        priceCategory: 'CHEAP',
      },
      {
        startTime: '2026-10-07T11:00:00.000Z',
        endTime: '2026-10-07T12:00:00.000Z',
        priceAvg: 2.5,
        priceCategory: 'CHEAP',
      },
    ]);
  });
});
