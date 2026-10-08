import { InjectionToken } from '@angular/core';

/** How many times the API services retry a failed request (0 on the server) */
export const API_RETRY_COUNT = new InjectionToken<number>('API_RETRY_COUNT', {
  providedIn: 'root',
  factory: () => 3,
});
