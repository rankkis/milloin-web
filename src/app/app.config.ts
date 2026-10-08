import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './shared/seo/seo-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withXhr()),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
  ],
};
