import { isDevMode } from '@angular/core';
import { inject as injectVercelAnalytics } from '@vercel/analytics';

/**
 * Counts page views with Vercel Web Analytics: cookieless and stores nothing
 * on the device, so it needs no consent. Page views in the app are tracked
 * from the router's history changes. Browser only: call after the first
 * render. Nothing is counted in development or from automated browsers
 * (the Playwright e2e tests), which would use up the monthly event quota.
 */
export function startAnalytics(win: Window): void {
  if (isDevMode() || win.navigator.webdriver) return;
  injectVercelAnalytics({ mode: 'production', framework: 'angular' });
}
