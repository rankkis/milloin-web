export type PriceCategory = 'VERY_CHEAP' | 'CHEAP' | 'NORMAL' | 'EXPENSIVE' | 'VERY_EXPENSIVE';

export interface OptimalTimeDto {
  startTime: string;
  endTime: string;
  priceAvg: number;
  priceCategory: PriceCategory;
  estimatedTotalPrice: number;
  potentialSavings?: number | null;
  potentialSavingsPercentage?: number | null;
}

export interface ForecastDefaultsDto {
  exchangeTariffCentsKwh: number;
  marginTariffCentsKwh: number;
  powerConsumptionKwh: number;
  periodHours: number;
}