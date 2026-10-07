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

export interface OptimalScheduleDefaultsDto {
  exchangeTariffCentsKwh: number;
  marginTariffCentsKwh: number;
  powerConsumptionKwh: number;
  periodHours: number;
}

/** Average price of one hour on today's chart */
export interface HourlyPriceDto {
  startTime: string;
  endTime: string;
  priceAvg: number;
  priceCategory: PriceCategory;
}

/** Cost of starting a program now or after a timer delay */
export interface StartDelayDto {
  delayHours: number;
  startTime: string;
  endTime: string;
  priceAvg: number;
  costCents: number;
  isBest: boolean;
}
