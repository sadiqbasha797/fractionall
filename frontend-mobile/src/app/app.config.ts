import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withNoHttpTransferCache } from '@angular/platform-browser';

// Custom error handler
class CustomErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Global error caught:', error);
    // You can add additional error handling logic here
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top'
    })),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
    { provide: ErrorHandler, useClass: CustomErrorHandler }
  ]
};
