import { HourlyPriceDto, PriceCategory, StartOffsetWindowDto } from './price.model';
import { V1PriceDto } from './api-v1.model';

const QUARTER_MS = 15 * 60 * 1000;
const HOUR_MS = 4 * QUARTER_MS;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** The API's price categories (c/kWh with VAT), for averages computed here */
export function priceCategory(cents: number): PriceCategory {
  const shown = round2(cents);
  if (shown < 2.5) return 'VERY_CHEAP';
  if (shown < 5) return 'CHEAP';
  if (shown < 10) return 'NORMAL';
  if (shown < 20) return 'EXPENSIVE';
  return 'VERY_EXPENSIVE';
}

/** Clock-hour averages of 15-minute prices from the hour starting at `from` on */
export function hourlyPrices(prices: V1PriceDto[], from: number): HourlyPriceDto[] {
  const hours = new Map<number, number[]>();
  for (const price of prices) {
    const hourStart = Math.floor(Date.parse(price.startTime) / HOUR_MS) * HOUR_MS;
    if (hourStart < from) continue;
    hours.set(hourStart, [...(hours.get(hourStart) ?? []), price.price]);
  }
  return [...hours.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hourStart, cents]) => {
      const priceAvg = cents.reduce((sum, value) => sum + value, 0) / cents.length;
      return {
        startTime: new Date(hourStart).toISOString(),
        endTime: new Date(hourStart + HOUR_MS).toISOString(),
        priceAvg: round2(priceAvg),
        priceCategory: priceCategory(priceAvg),
      };
    });
}

/**
 * The run of `durationHours` starting `offsetHours` after `from`, costed
 * with `energyKwh` spread evenly; undefined when a price on the way is not
 * published.
 */
export function windowAt(
  prices: V1PriceDto[],
  from: number,
  offsetHours: number,
  durationHours: number,
  energyKwh: number,
): StartOffsetWindowDto | undefined {
  const byStart = new Map(prices.map((price) => [Date.parse(price.startTime), price]));
  const start = from + offsetHours * HOUR_MS;
  const quarters = Math.round(durationHours * 4);
  const slice: V1PriceDto[] = [];
  for (let q = 0; q < quarters; q++) {
    const price = byStart.get(start + q * QUARTER_MS);
    if (!price) return undefined;
    slice.push(price);
  }
  const priceAvg = slice.reduce((sum, price) => sum + price.price, 0) / quarters;
  return {
    offsetHours,
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + quarters * QUARTER_MS).toISOString(),
    priceAvg: round2(priceAvg),
    priceCategory: priceCategory(priceAvg),
    pricePoints: slice.map(({ startTime, endTime, price }) => ({ startTime, endTime, price })),
    costCents: round2(priceAvg * energyKwh),
  };
}
