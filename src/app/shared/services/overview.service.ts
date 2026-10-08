import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { API_RETRY_COUNT } from './api-retry';
import { environment } from '../../../environments/environment';
import {
  HourlyPriceDto,
  OptimalTimeDto,
  PriceCategory,
  PricePointDto,
} from '../models/price.model';

export type { HourlyPriceDto, OptimalTimeDto, PriceCategory, PricePointDto };

export interface CurrentPriceDto {
  price: number;
  priceCategory: PriceCategory;
}

export interface FuturePriceSummaryDto {
  priceAvg: number;
  priceCategory: PriceCategory;
  pricePoints: PricePointDto[];
}

export interface OverviewDto {
  current: CurrentPriceDto;
  next12Hours: FuturePriceSummaryDto;
  future: FuturePriceSummaryDto;
  /** Hourly prices from the start of the current hour to the last published price */
  upcomingHours: HourlyPriceDto[];
}

@Injectable({
  providedIn: 'root'
})
export class OverviewService {
  private readonly http = inject(HttpClient);
  private readonly retryCount = inject(API_RETRY_COUNT);
  private readonly apiUrl = `${environment.apiUrl}/overview`;

  // Only CORS-safelisted headers, so the browser skips the preflight request

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json'
    })
  };

  getOverview(): Observable<OverviewDto> {
    const url = this.apiUrl;

    return this.http.get<OverviewDto>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: this.retryCount,
        delay: (_error, retryIndex) => {
          const delayMs = Math.min(1000 * Math.pow(2, retryIndex), 10000);
          return timer(delayMs);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[OverviewService] Error:', error.status, error.statusText);

        let userMessage = 'Yleiskatsauksen lataaminen epäonnistui';

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
