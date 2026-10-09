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

/** A window from the API's optimal-window endpoints */
export interface WindowDto extends OptimalTimeDto {
  /** Present when the request had energyKwh */
  costCents?: number;
  /** Saving vs. startNow; present when energyKwh and startNow are known */
  savingsCents?: number;
}

/** Cheapest windows for a preset or custom request, cheapest first */
export interface OptimalWindowsDto {
  durationHours: number;
  energyKwh?: number;
  earliestStart: string;
  latestEnd: string;
  /** The window starting now, left out when prices do not reach far enough */
  startNow?: WindowDto;
  windows: WindowDto[];
  /** The window of each requested start offset or full hour, in order of offsetHours */
  startOffsets?: StartOffsetWindowDto[];
}

/** The window starting a given number of hours from now */
export interface StartOffsetWindowDto extends WindowDto {
  offsetHours: number;
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
  priceCategory: PriceCategory;
  costCents: number;
  isBest: boolean;
}
