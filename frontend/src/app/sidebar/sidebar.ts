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
  @Output() sidebarClose = new EventEmitter<void>();
  
  userRole: string | null = null;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  closeSidebar() {
    this.sidebarClose.emit();
  }
}
