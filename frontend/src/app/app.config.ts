import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './services/auth.interceptor';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './services/auth.guard';
import { CarService } from './services/car.service';
import { ContactService } from './services/contact.service';
import { TokenService } from './services/token.service';
import { TicketService } from './services/ticket.service';
import { KycService } from './services/kyc.service';
import { BookNowTokenService } from './services/book-now-token.service';
import { ContractService } from './services/contract.service';
import { AmcService } from './services/amc.service';
import { UserService } from './services/user.service';
import { BookingService } from './services/booking.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    provideClientHydration(withEventReplay()),
    AuthService,
    AuthGuard,
    CarService,
    ContactService,
    TokenService,
    TicketService,
    KycService,
    BookNowTokenService,
    ContractService,
    AmcService,
    UserService,
    BookingService
  ]
};
