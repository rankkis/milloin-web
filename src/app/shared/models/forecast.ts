import { HourlyPriceDto } from './price.model';
import { priceCategory } from './price-windows';

/** An hour of GET /v1/electricity/forecasts/72h (milloin.xyz's own forecast) */
export interface ForecastPointDto {
  startTime: string;
  endTime: string;
  /** c/kWh including VAT */
  price: number;
  /** The real day-ahead price, already published when the forecast was made */
  published: boolean;
}

/** GET /v1/electricity/forecasts/:horizon */
export interface ForecastDto {
  horizon: string;
  resolution: 'hour' | 'day';
  issuedAt: string;
  points: ForecastPointDto[];
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The forecast's estimated hours after `after` (the end of the last published
 * hour), marked as estimates. Hours the forecast had already published are
 * left out: the page has their real prices.
 */
export function estimatedHours(forecast: ForecastDto | undefined, after: number): HourlyPriceDto[] {
  if (forecast?.resolution !== 'hour') return [];
  return forecast.points
    .filter((point) => !point.published && Date.parse(point.startTime) >= after)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    .map((point) => ({
      startTime: point.startTime,
      endTime: point.endTime,
      priceAvg: round2(point.price),
      priceCategory: priceCategory(point.price),
      estimate: true,
    }));
}
