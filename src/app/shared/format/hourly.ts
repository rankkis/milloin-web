import { HourlyPriceDto, PricePointDto } from '../models/price.model';
import { priceCategoryOf } from './price-category';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Averages 15-minute prices into clock hours, in time order. Finnish
 * clock hours start on whole UTC hours, so hours are UTC-aligned.
 */
export function hourlyAverages(points: PricePointDto[]): HourlyPriceDto[] {
  const hours = new Map<number, number[]>();
  for (const point of points) {
    const hourStart = Math.floor(Date.parse(point.startTime) / HOUR_MS) * HOUR_MS;
    hours.set(hourStart, [...(hours.get(hourStart) ?? []), point.price]);
  }

  return [...hours.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hourStart, prices]) => {
      const priceAvg =
        Math.round((prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100) / 100;
      return {
        startTime: new Date(hourStart).toISOString(),
        endTime: new Date(hourStart + HOUR_MS).toISOString(),
        priceAvg,
        priceCategory: priceCategoryOf(priceAvg),
      };
    });
}
