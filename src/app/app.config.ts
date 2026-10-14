import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withNavigationErrorHandler, withPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './shared/seo/seo-title-strategy';
import { noStoreOnApiError } from './shared/services/no-store-on-api-error.interceptor';
import { ssrApiKey } from './shared/services/ssr-api-key.interceptor';
import { BrowserPreloading } from './shared/stale-chunk/browser-preloading';
import { reloadOnStaleChunk } from './shared/stale-chunk/stale-chunk-reload';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      // Every page's code is loaded ahead, so a deploy doesn't break moving around
      withPreloading(BrowserPreloading),
      // If a page's code is gone anyway, loads that page from the server
      withNavigationErrorHandler(reloadOnStaleChunk),
    ),
    provideHttpClient(withFetch(), withInterceptors([ssrApiKey, noStoreOnApiError])),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    // Hydrates the server-rendered page and reuses the server's API responses
    // (HTTP transfer cache) instead of fetching them again
    provideClientHydration(withEventReplay()),
  ],
};
