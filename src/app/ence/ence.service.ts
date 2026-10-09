import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { API_RETRY_COUNT } from '../shared/services/api-retry';
import { environment } from '../../environments/environment';
import { EnceDto } from './ence.model';

@Injectable({
  providedIn: 'root',
})
export class EnceService {
  private readonly http = inject(HttpClient);
  private readonly retryCount = inject(API_RETRY_COUNT);

  // Only CORS-safelisted headers, so the browser skips the preflight request
  private readonly httpOptions = {
    headers: new HttpHeaders({
      Accept: 'application/json',
    }),
  };

  /** ENCE's next match, streams, results and news */
  getEnce(): Observable<EnceDto> {
    return this.http.get<EnceDto>(`${environment.apiUrl}/ence`, this.httpOptions).pipe(
      timeout(30000),
      retry({
        count: this.retryCount,
        delay: (_error, retryIndex) => timer(Math.min(1000 * Math.pow(2, retryIndex), 10000)),
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[EnceService] Error:', error.status, error.statusText);

        let userMessage = 'Otteluiden lataaminen epäonnistui';
        if (error.status === 0) {
          userMessage = 'Verkkoyhteysvirhe - tarkista internetyhteys';
        } else if (error.status >= 400) {
          userMessage = 'Palvelinvirhe - yritä myöhemmin uudelleen';
        }
        return throwError(() => ({ userMessage }));
      }),
    );
  }

  /** Address of a team logo from its path in the response */
  logoUrl(path: string): string {
    return `${environment.apiUrl}/${path}`;
  }
}
