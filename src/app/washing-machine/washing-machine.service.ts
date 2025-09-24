import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface OptimalTimeDto {
  startTime: string;
  endTime: string;
  price: number;
  rank: number;
  savings: number;
  savingsPercentage: number;
  period: 'day' | 'night';
}

export interface WashingForecastDto {
  today?: OptimalTimeDto;
  tonight?: OptimalTimeDto;
  tomorrow?: OptimalTimeDto;
}

@Injectable({
  providedIn: 'root'
})
export class WashingMachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/washing-machine`;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    })
  };

  getForecast(): Observable<WashingForecastDto> {
    const url = `${this.apiUrl}/forecast?hours=36`;

    console.log(`[WashingMachineService] Fetching forecast from: ${url}`);
    console.log('[WashingMachineService] User Agent:', navigator.userAgent);
    console.log('[WashingMachineService] Environment:', environment);

    return this.http.get<WashingForecastDto>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: 3,
        delay: (error, retryIndex) => {
          const delayMs = Math.min(1000 * Math.pow(2, retryIndex), 10000);
          console.log(`[WashingMachineService] Retry ${retryIndex} after ${delayMs}ms, error:`, error);
          return timer(delayMs);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[WashingMachineService] HTTP Error Details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url,
          headers: error.headers,
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          timestamp: new Date().toISOString()
        });

        let userMessage = 'Ennusteen lataaminen epäonnistui';

        if (error.status === 0) {
          userMessage = 'Verkkoyhteysvirhe - tarkista internetyhteys';
        } else if (error.status >= 400 && error.status < 500) {
          userMessage = `Palvelinvirhe (${error.status}) - yritä myöhemmin uudelleen`;
        } else if (error.status >= 500) {
          userMessage = 'Palvelinvirhe - yritä myöhemmin uudelleen';
        }

        return throwError(() => ({
          userMessage,
          technicalDetails: {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            timestamp: new Date().toISOString()
          }
        }));
      })
    );
  }
}