import { PriceCategory } from '../models/price.model';

/** Category names, as the price pill shows them */
export const PRICE_CATEGORY_TEXT: Record<PriceCategory, string> = {
  VERY_CHEAP: 'Erittäin halpa',
  CHEAP: 'Halpa',
  NORMAL: 'Normaali',
  EXPENSIVE: 'Kallis',
  VERY_EXPENSIVE: 'Erittäin kallis',
};

/** Category of a price in c/kWh, with the same limits as the backend */
export function priceCategoryOf(centsPerKwh: number): PriceCategory {
  if (centsPerKwh < 2.5) return 'VERY_CHEAP';
  if (centsPerKwh < 5) return 'CHEAP';
  if (centsPerKwh < 10) return 'NORMAL';
  if (centsPerKwh < 20) return 'EXPENSIVE';
  return 'VERY_EXPENSIVE';
}
