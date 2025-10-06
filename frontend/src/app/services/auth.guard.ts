import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (typeof localStorage === 'undefined') {
      // If localStorage is not available (SSR), assume not authenticated
      this.router.navigate(['/login-selection']);
      return of(false);
    }

    const token = this.authService.getToken();
    const userRole = this.authService.getUserRole();
    
    if (token && userRole) {
      // Check if the route requires specific role permissions
      const requiredRole = route.data?.['role'];
      
      if (requiredRole) {
        if (userRole === requiredRole || (requiredRole === 'admin' && userRole === 'superadmin')) {
          return of(true);
        } else {
          // Redirect to appropriate login based on role
          this.router.navigate([userRole === 'admin' ? '/admin-login' : '/superadmin-login']);
          return of(false);
        }
      }
      return of(true);
    } else {
      this.router.navigate(['/login-selection']);
      return of(false);
    }
  }
}
