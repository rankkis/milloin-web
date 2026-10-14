import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { V1PlanDto, V1PlansDto } from '../shared/models/api-v1.model';
import { OptimalWindowsDto, WindowDto } from '../shared/models/price.model';
import { helsinkiParts, helsinkiTime } from '../shared/format/format';
import { PricesService, apiError } from '../shared/services/prices.service';

/** An 11 kW charger running the whole window: 4 h × 11 kW */
export const CHARGE_HOURS = 4;
export const CHARGE_KWH = 44;
/** The car is charged by 08:00 Finnish time, so charging starts by 04:00 */
export const READY_HOUR = 8;

/** Charging windows: the answer first, the cheapest that ends by the next morning */
export interface ChargeWindowsDto extends OptimalWindowsDto {
  /** When the car should be charged: 08:00 Finnish time on the next morning */
  readyBy: string;
  /** False when no window ends by readyBy in the published prices; windows are then the cheapest of all */
  fitsReadyBy: boolean;
  /** The cheapest window in all published prices, whenever it ends */
  bestAvailable?: WindowDto;
}

/**
 * 08:00 Finnish time on the morning a charge started now must end by:
 * today's when it is not yet 04:00, otherwise tomorrow's.
 */
export function chargeReadyBy(now: Date): Date {
  const { year, month, day, hour } = helsinkiParts(now);
  const startBy = READY_HOUR - CHARGE_HOURS;
  return helsinkiTime(year, month, hour < startBy ? day : day + 1, READY_HOUR);
}

const toWindow = (plan: V1PlanDto): WindowDto => ({
  startTime: plan.startTime,
  endTime: plan.endTime,
  priceAvg: plan.priceAvg,
  priceCategory: plan.category,
  pricePoints: [],
  ...(plan.costCents !== undefined && { costCents: plan.costCents }),
  ...(plan.savingsCents !== undefined && { savingsCents: plan.savingsCents }),
});

/** The API's continuous plans as charging windows, cheapest first */
export function toChargeWindows(response: V1PlansDto): OptimalWindowsDto {
  return {
    durationHours: response.request.durationHours,
    energyKwh: response.request.energyKwh,
    earliestStart: response.request.earliestStart,
    latestEnd: response.request.latestEnd,
    ...(response.startNow && { startNow: toWindow(response.startNow) }),
    windows: response.plans.map(toWindow),
  };
}

/** The windows that end by readyBy, or the cheapest of all when none does */
export function toReadyByWindows(readyBy: Date, byMorning: V1PlansDto, all: V1PlansDto): ChargeWindowsDto {
  const fitsReadyBy = byMorning.plans.length > 0;
  return {
    ...toChargeWindows(fitsReadyBy ? byMorning : all),
    readyBy: readyBy.toISOString(),
    fitsReadyBy,
    ...(all.plans[0] && { bestAvailable: toWindow(all.plans[0]) }),
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChargeEvService {
  private readonly prices = inject(PricesService);

  /**
   * The cheapest 4-hour charging window that starts by 04:00 next morning,
   * so the car is charged at 08:00, and the cheapest in all published prices
   */
  getOptimalWindows(now: Date = new Date()): Observable<ChargeWindowsDto> {
    const query = { durationHours: CHARGE_HOURS, energyKwh: CHARGE_KWH, limit: 1 };
    const readyBy = chargeReadyBy(now);
    return forkJoin({
      byMorning: this.prices.getPlans({ ...query, latestEnd: readyBy.toISOString() }),
      all: this.prices.getPlans(query),
    }).pipe(
      map(({ byMorning, all }) => toReadyByWindows(readyBy, byMorning, all)),
      catchError(apiError('ChargeEvService', 'Ennusteen lataaminen epäonnistui')),
    );
  }
}
