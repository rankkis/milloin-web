import { InjectionToken, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Key that identifies server-side renders to the API, whose per-IP rate limit
 * would otherwise count every visitor's render from the same Vercel addresses.
 * Provided only in the server config, from the SSR_API_KEY environment
 * variable, so it never reaches the browser.
 */
export const SSR_API_KEY = new InjectionToken<string | undefined>('SSR_API_KEY', {
  providedIn: 'root',
  factory: () => undefined,
});

export const ssrApiKey: HttpInterceptorFn = (req, next) => {
  const key = inject(SSR_API_KEY);
  if (!key || !req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { 'x-milloin-ssr-key': key } }));
};
