import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { API_RETRY_COUNT } from '../shared/services/api-retry';
import { environment } from '../../environments/environment';
import { OptimalWindowsDto } from '../shared/models/price.model';

export type { OptimalWindowsDto };

@Injectable({
  providedIn: 'root'
})
export class ChargeEvService {
  private readonly http = inject(HttpClient);
  private readonly retryCount = inject(API_RETRY_COUNT);
  private readonly apiUrl = `${environment.apiUrl}/optimal-window/presets/charge-ev`;

  // Only CORS-safelisted headers, so the browser skips the preflight request

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json'
    })
  };

  /** The cheapest 4-hour charging windows in all published prices, cheapest first */
  getOptimalWindows(): Observable<OptimalWindowsDto> {
    const url = this.apiUrl;

    return this.http.get<OptimalWindowsDto>(url, this.httpOptions).pipe(
      timeout(30000), // 30 second timeout for iOS
      retry({
        count: this.retryCount,
        delay: (_error, retryIndex) => {
          const delayMs = Math.min(1000 * Math.pow(2, retryIndex), 10000);
          return timer(delayMs);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[ChargeEvService] Error:', error.status, error.statusText);

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
