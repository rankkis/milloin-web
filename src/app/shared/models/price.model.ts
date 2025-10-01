export type PriceCategory = 'VERY_CHEAP' | 'CHEAP' | 'NORMAL' | 'EXPENSIVE' | 'VERY_EXPENSIVE';

export interface PricePointDto {
  startTime: string;
  endTime: string;
  price: number;
}

export interface OptimalTimeDto {
  startTime: string;
  endTime: string;
  priceAvg: number;
  priceCategory: PriceCategory;
  pricePoints: PricePointDto[];
}

export interface ForecastDefaultsDto {
  exchangeTariffCentsKwh: number;
  marginTariffCentsKwh: number;
  powerConsumptionKwh: number;
  periodHours: number;
}