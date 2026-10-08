import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './shared/seo/seo-title-strategy';
import { noStoreOnApiError } from './shared/services/no-store-on-api-error.interceptor';
import { ssrApiKey } from './shared/services/ssr-api-key.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([ssrApiKey, noStoreOnApiError])),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    // Hydrates the server-rendered page and reuses the server's API responses
    // (HTTP transfer cache) instead of fetching them again
    provideClientHydration(withEventReplay()),
  ],
};
