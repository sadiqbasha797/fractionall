import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpirationService } from './session-expiration.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionExpirationService = inject(SessionExpirationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 Unauthorized responses (session expired/invalid token)
      // Don't handle 403 Forbidden as it might be permission-based and not session-related
      if (error.status === 401) {
        // Check if it's a token validation error vs permission error
        const errorMessage = error.error?.message || error.message || '';
        
        // Only trigger logout for actual authentication failures, not permission issues
        if (errorMessage.includes('token') || 
            errorMessage.includes('unauthorized') || 
            errorMessage.includes('authentication') ||
            errorMessage.includes('expired') ||
            errorMessage.includes('invalid')) {
          sessionExpirationService.handleSessionExpiration();
        }
        return throwError(() => error);
      }

      // For 403 and other errors, just pass them through without triggering logout
      return throwError(() => error);
    })
  );
};
