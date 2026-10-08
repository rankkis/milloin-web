import { RESPONSE_INIT, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * A page rendered on the server while the API failed shows an error, so it
 * must not be kept in the CDN cache. Does nothing in the browser.
 */
export const noStoreOnApiError: HttpInterceptorFn = (req, next) => {
  const responseInit = inject(RESPONSE_INIT, { optional: true });
  return next(req).pipe(
    tap({
      error: () => {
        if (responseInit?.headers instanceof Headers) {
          responseInit.headers.set('Cache-Control', 'no-store');
        }
      },
    }),
  );
};
