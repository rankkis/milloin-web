import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PriceCategory, OptimalTimeDto, OptimalScheduleDefaultsDto } from '../shared/models/price.model';

export type { PriceCategory, OptimalTimeDto, OptimalScheduleDefaultsDto };

export interface WashLaundryOptimalScheduleDto {
  now?: OptimalTimeDto;
  today?: OptimalTimeDto;
  tonight?: OptimalTimeDto;
  tomorrow?: OptimalTimeDto;
  defaults: OptimalScheduleDefaultsDto;
}

@Injectable({
  providedIn: 'root'
})
export class WashLaundryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wash-laundry/optimal-schedule`;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })
  };

  getOptimalSchedule(): Observable<WashLaundryOptimalScheduleDto> {
    const url = this.apiUrl;


    return this.http.get<WashLaundryOptimalScheduleDto>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: 3,
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