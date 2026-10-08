import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { API_RETRY_COUNT } from '../shared/services/api-retry';
import { environment } from '../../environments/environment';
import { OptimalWindowsDto, StartDelayDto } from '../shared/models/price.model';

export type { StartDelayDto };

export interface LaundrySchedule {
  /** Cost of starting now or after a 1-5 hour timer delay, in order of delay */
  startDelays: StartDelayDto[];
  /** Length of the washing program, hours */
  durationHours: number;
  /** Electricity used by one wash, kWh */
  energyKwh: number;
}

/** The preset's start offsets as timer delays; the cheapest (earliest on a tie) is isBest */
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

@Injectable({
  providedIn: 'root'
})
export class WashLaundryService {
  private readonly http = inject(HttpClient);
  private readonly retryCount = inject(API_RETRY_COUNT);
  private readonly apiUrl = `${environment.apiUrl}/optimal-window/presets/wash-laundry`;

  // Only CORS-safelisted headers, so the browser skips the preflight request

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json'
    })
  };

  getOptimalSchedule(): Observable<LaundrySchedule> {
    const url = this.apiUrl;


    return this.http.get<OptimalWindowsDto>(url, this.httpOptions).pipe(
      map(toLaundrySchedule),
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: this.retryCount,
        delay: (_error, retryIndex) => {
          const delayMs = Math.min(1000 * Math.pow(2, retryIndex), 10000);
          return timer(delayMs);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[WashLaundryService] Error:', error.status, error.statusText);

        let userMessage = 'Aikataulun lataaminen epäonnistui';

        if (error.status === 0) {
          userMessage = 'Verkkoyhteysvirhe - tarkista internetyhteys';
        } else if (error.status >= 400 && error.status < 500) {
          userMessage = `Palvelinvirhe (${error.status}) - yritä myöhemmin uudelleen`;
        } else if (error.status >= 500) {
          userMessage = 'Palvelinvirhe - yritä myöhemmin uudelleen';
        }

        return throwError(() => ({ userMessage }));
      })
    );
  }
}