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
      this.router.navigate(['/admin/login']);
      return of(false);
    }

    const token = this.authService.getToken();
    if (token) {
      // Optionally, you could add a token validation call here if needed
      // For now, just checking for presence of token
      return of(true);
    } else {
      this.router.navigate(['/admin/login']);
      return of(false);
    }
  }
}