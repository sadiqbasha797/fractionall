import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

// Track navigation attempts to prevent infinite loops
let navigationAttempts = new Map<string, number>();

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const routePath = state.url;
    
    // Superadmin has access to everything
    if (this.authService.isSuperAdmin()) {
      return true;
    }

    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/login-selection']);
      return false;
    }

    // Get the required permission for this route
    const requiredPermission = route.data?.['permission'];
    if (!requiredPermission) {
      return true; // No permission required
    }

    // Get admin data and check permissions
    const admin = this.authService.getCurrentAdmin();
    
    if (!admin) {
      this.router.navigate(['/login-selection']);
      return false;
    }

    // If admin has no permissions array or empty permissions, grant access to basic routes
    if (!admin.permissions || admin.permissions.length === 0) {
      // Allow access to basic routes like dashboard, cars, etc.
      const basicRoutes = ['dashboard', 'cars', 'bookings', 'tickets', 'users'];
      if (basicRoutes.includes(requiredPermission)) {
        return true;
      }
    }

    // Check if admin has the required permission
    const hasPermission = admin.permissions && admin.permissions.includes(requiredPermission);
    
    if (!hasPermission) {
      // Check for infinite loop prevention
      const attemptKey = `${routePath}-${requiredPermission}`;
      const attempts = navigationAttempts.get(attemptKey) || 0;
      
      if (attempts >= 3) {
        return true;
      }
      
      navigationAttempts.set(attemptKey, attempts + 1);
      
      // For tokens permission, show a more specific message
      if (requiredPermission === 'tokens') {
        console.warn('Admin does not have tokens permission');
        // Still allow access but the component will handle the permission gracefully
        return true;
      }
      
      // Redirect to cars instead of dashboard to avoid potential loops
      this.router.navigate(['/cars']);
      return false;
    }

    // Clear navigation attempts on successful access
    navigationAttempts.clear();
    return true;
  }
}
