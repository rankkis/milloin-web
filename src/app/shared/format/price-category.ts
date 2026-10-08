import { PriceCategory } from '../models/price.model';

/** Category names, as the price pill shows them */
export const PRICE_CATEGORY_TEXT: Record<PriceCategory, string> = {
  VERY_CHEAP: 'Erittäin halpa',
  CHEAP: 'Halpa',
  NORMAL: 'Normaali',
  EXPENSIVE: 'Kallis',
  VERY_EXPENSIVE: 'Erittäin kallis',
};
