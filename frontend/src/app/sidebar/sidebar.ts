import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit {
  @Input() isMobileMenuOpen: boolean = false;
  @Input() isMobile: boolean = false;
  @Output() sidebarClose = new EventEmitter<void>();
  
  
  userRole: string | null = null;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  adminPermissions: string[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();
    
    // Get admin permissions if user is admin
    if (this.isAdmin) {
      const admin = this.authService.getCurrentAdmin();
      this.adminPermissions = admin?.permissions || [];
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }

  hasPermission(permission: string): boolean {
    // Superadmin has access to everything
    if (this.isSuperAdmin) {
      return true;
    }
    
    // Check if admin has the specific permission
    return this.adminPermissions.includes(permission);
  }
}
