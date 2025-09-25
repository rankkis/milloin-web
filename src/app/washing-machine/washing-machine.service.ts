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
  potentialSavings?: number;
  potentialSavingsPercentage?: number;
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
      'Content-Type': 'application/json'
    })
  };

  getForecast(): Observable<WashingForecastDto> {
    const url = `${this.apiUrl}/forecast?hours=36`;


    return this.http.get<WashingForecastDto>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: 3,
        delay: (error, retryIndex) => {
          const delayMs = Math.min(1000 * Math.pow(2, retryIndex), 10000);
          return timer(delayMs);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[WashingMachineService] Error:', error.status, error.statusText);

        let userMessage = 'Ennusteen lataaminen epäonnistui';

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