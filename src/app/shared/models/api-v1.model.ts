import { PriceCategory } from './price.model';

/** A price from the API's GET /v1/electricity/prices */
export interface V1PriceDto {
  startTime: string;
  endTime: string;
  /** c/kWh including VAT */
  price: number;
  category: PriceCategory;
  dayCategory: PriceCategory;
}

/** GET /v1/electricity/prices: the price now and prices from Finnish midnight today to the last published one */
export interface V1PricesDto {
  current: V1PriceDto;
  prices: V1PriceDto[];
  meta: {
    pricesUntil: string;
    tomorrowPublished: boolean;
  };
}

/** A plan from GET /v1/electricity/plans */
export interface V1PlanDto {
  startTime: string;
  endTime: string;
  priceAvg: number;
  category: PriceCategory;
  costCents?: number;
  savingsCents?: number;
}

/** GET /v1/electricity/plans: ranked plans and the run starting now */
export interface V1PlansDto {
  request: {
    durationHours: number;
    energyKwh?: number;
    earliestStart: string;
    latestEnd: string;
  };
  startNow?: V1PlanDto;
  plans: V1PlanDto[];
}
