import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { V1PlanDto, V1PlansDto } from '../shared/models/api-v1.model';
import { OptimalWindowsDto, WindowDto } from '../shared/models/price.model';
import { PricesService, apiError } from '../shared/services/prices.service';

export type { OptimalWindowsDto };

/** An 11 kW charger running the whole window: 4 h × 11 kW */
export const CHARGE_HOURS = 4;
export const CHARGE_KWH = 44;

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

@Injectable({
  providedIn: 'root'
})
export class ChargeEvService {
  private readonly prices = inject(PricesService);

  /** The cheapest 4-hour charging windows in all published prices, cheapest first */
  getOptimalWindows(): Observable<OptimalWindowsDto> {
    return this.prices
      .getPlans({ durationHours: CHARGE_HOURS, energyKwh: CHARGE_KWH, limit: 3 })
      .pipe(
        map(toChargeWindows),
        catchError(apiError('ChargeEvService', 'Ennusteen lataaminen epäonnistui')),
      );
  }
}
