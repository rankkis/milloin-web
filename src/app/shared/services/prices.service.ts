import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { API_RETRY_COUNT } from './api-retry';
import { environment } from '../../../environments/environment';
import { V1PlansDto, V1PricesDto } from '../models/api-v1.model';

/** The API's error as a Finnish message for the page */
export function apiError(source: string, failure: string) {
  return (error: HttpErrorResponse) => {
    console.error(`[${source}] Error:`, error.status, error.statusText);

    let userMessage = failure;
    if (error.status === 0) {
      userMessage = 'Verkkoyhteysvirhe - tarkista internetyhteys';
    } else if (error.status >= 400 && error.status < 500) {
      userMessage = `Palvelinvirhe (${error.status}) - yritä myöhemmin uudelleen`;
    } else if (error.status >= 500) {
      userMessage = 'Palvelinvirhe - yritä myöhemmin uudelleen';
    }
    return throwError(() => ({ userMessage }));
  };
}

/**
 * The public v1 API. The same URL is asked by every part of a page, so the
 * CDN and the server render's transfer cache answer the repeats.
 */
@Injectable({
  providedIn: 'root'
})
export class PricesService {
  private readonly http = inject(HttpClient);
  private readonly retryCount = inject(API_RETRY_COUNT);

  // Only CORS-safelisted headers, so the browser skips the preflight request
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json'
    })
  };

  /** 15-minute prices from midnight today (Finnish time) to the last published price */
  getPrices(): Observable<V1PricesDto> {
    return this.get<V1PricesDto>(`${environment.apiUrl}/v1/prices`);
  }

  /** GET /v1/plans with the given query */
  getPlans(query: Record<string, string | number>): Observable<V1PlansDto> {
    const params = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    );
    return this.get<V1PlansDto>(`${environment.apiUrl}/v1/plans?${params}`);
  }

  private get<T>(url: string): Observable<T> {
    return this.http.get<T>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: this.retryCount,
        delay: (_error, retryIndex) => timer(Math.min(1000 * Math.pow(2, retryIndex), 10000)),
      }),
    );
  }
}
