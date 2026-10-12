import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { V1PricesDto } from '../shared/models/api-v1.model';
import { windowAt } from '../shared/models/price-windows';
import { OptimalWindowsDto, StartDelayDto } from '../shared/models/price.model';
import { PricesService, apiError } from '../shared/services/prices.service';

export type { StartDelayDto };

export interface LaundrySchedule {
  /** Cost of starting now or after a 1-5 hour timer delay, in order of delay */
  startDelays: StartDelayDto[];
  /** Length of the washing program, hours */
  durationHours: number;
  /** Electricity used by one wash, kWh */
  energyKwh: number;
}

/** The start offsets as timer delays; the cheapest (earliest on a tie) is isBest */
export function toLaundrySchedule(response: OptimalWindowsDto): LaundrySchedule {
  const startDelays: StartDelayDto[] = (response.startOffsets ?? []).map((window) => ({
    delayHours: window.offsetHours,
    startTime: window.startTime,
    endTime: window.endTime,
    priceAvg: window.priceAvg,
    priceCategory: window.priceCategory,
    costCents: window.costCents ?? 0,
    isBest: false,
  }));
  const best = startDelays.reduce<StartDelayDto | undefined>(
    (cheapest, delay) => (!cheapest || delay.costCents < cheapest.costCents ? delay : cheapest),
    undefined,
  );
  if (best) best.isBest = true;
  return { startDelays, durationHours: response.durationHours, energyKwh: response.energyKwh ?? 0 };
}

/** A washing machine program */
export const LAUNDRY_HOURS = 2;
export const LAUNDRY_KWH = 1.5;
/** Start now or with a timer delay of 1 to 5 hours */
const TIMER_DELAYS_HOURS = [0, 1, 2, 3, 4, 5];

/** The program started now and after each timer delay, from the current quarter hour */
export function laundryWindows(response: V1PricesDto): OptimalWindowsDto {
  const from = Date.parse(response.current.startTime);
  return {
    durationHours: LAUNDRY_HOURS,
    energyKwh: LAUNDRY_KWH,
    earliestStart: response.current.startTime,
    latestEnd: response.meta.pricesUntil,
    windows: [],
    startOffsets: TIMER_DELAYS_HOURS.flatMap((delay) => {
      const window = windowAt(response.prices, from, delay, LAUNDRY_HOURS, LAUNDRY_KWH);
      return window ? [window] : [];
    }),
  };
}

@Injectable({
  providedIn: 'root'
})
export class WashLaundryService {
  private readonly prices = inject(PricesService);

  getOptimalSchedule(): Observable<LaundrySchedule> {
    return this.prices.getPrices().pipe(
      map((response) => toLaundrySchedule(laundryWindows(response))),
      catchError(apiError('WashLaundryService', 'Aikataulun lataaminen epäonnistui')),
    );
  }
}
