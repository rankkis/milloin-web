import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { V1PricesDto } from '../shared/models/api-v1.model';
import { windowAt } from '../shared/models/price-windows';
import { OptimalWindowsDto, StartOffsetWindowDto } from '../shared/models/price.model';
import { PricesService, apiError } from '../shared/services/prices.service';

export type { OptimalWindowsDto };

/** Heating an electric sauna: about an hour to warm up and two hours of bathing */
export const SAUNA_HOURS = 3;
export const SAUNA_KWH = 8;

const HOUR_MS = 60 * 60 * 1000;

/**
 * A session starting at every full hour from the next one on, as far as
 * the published prices reach.
 */
export function saunaWindows(response: V1PricesDto): OptimalWindowsDto {
  const from = Date.parse(response.current.startTime);
  const lastStart = Date.parse(response.meta.pricesUntil) - SAUNA_HOURS * HOUR_MS;
  const startOffsets: StartOffsetWindowDto[] = [];
  for (let start = Math.ceil((from + 1) / HOUR_MS) * HOUR_MS; start <= lastStart; start += HOUR_MS) {
    const window = windowAt(response.prices, from, (start - from) / HOUR_MS, SAUNA_HOURS, SAUNA_KWH);
    if (window) startOffsets.push(window);
  }
  return {
    durationHours: SAUNA_HOURS,
    energyKwh: SAUNA_KWH,
    earliestStart: response.current.startTime,
    latestEnd: response.meta.pricesUntil,
    windows: [],
    startOffsets,
  };
}

@Injectable({
  providedIn: 'root'
})
export class SaunaService {
  private readonly prices = inject(PricesService);

  /** 3-hour sauna sessions starting at every full hour, as far as the prices reach */
  getStarts(): Observable<OptimalWindowsDto> {
    return this.prices.getPrices().pipe(
      map(saunaWindows),
      catchError(apiError('SaunaService', 'Ennusteen lataaminen epäonnistui')),
    );
  }
}
