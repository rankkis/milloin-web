import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_RETRY_COUNT } from './shared/services/api-retry';
import { SSR_API_KEY } from './shared/services/ssr-api-key.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Render at once with what the API gives; the browser retries if it failed
    { provide: API_RETRY_COUNT, useValue: 0 },
    { provide: SSR_API_KEY, useFactory: () => process.env['SSR_API_KEY'] },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
