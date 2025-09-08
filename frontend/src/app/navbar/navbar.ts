import { Component, OnInit, Output, EventEmitter, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html'
})
export class Navbar implements OnInit {
  @Output() menuClick = new EventEmitter<void>();
  
  isMobile: boolean = false;
  user = {
    name: 'Admin User',
    role: 'System Administrator',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  };
  currentUser: any = null;
  userRole: string | null = null;
  private isBrowser: boolean;

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  ngOnInit() {
    // Get current user information
    this.userRole = this.authService.getUserRole();
    if (this.userRole === 'admin') {
      this.currentUser = this.authService.getCurrentAdmin();
      if (this.currentUser) {
        this.user.name = this.currentUser.name;
        this.user.role = 'Administrator';
        this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=0D8ABC&color=fff`;
      }
    } else if (this.userRole === 'superadmin') {
      this.currentUser = this.authService.getCurrentSuperAdmin();
      if (this.currentUser) {
        this.user.name = this.currentUser.name;
        this.user.role = 'Super Administrator';
        this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=8B5CF6&color=fff`;
      }
    }
  }


  logout() {
    this.authService.logout();
    this.router.navigate(['/login-selection'], { replaceUrl: true });
  }
}
