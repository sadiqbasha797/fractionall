import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  profileDropdownOpen = false;
  isLoggedIn = false;
  userData: any = null;
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check initial auth state
    this.checkAuthState();
    
    // Listen for auth state changes (if you implement a subject for this)
    // For now, we'll check on component init and after navigation
    
    // Listen for route changes to update auth state
    this.router.events.subscribe(() => {
      this.checkAuthState();
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  checkAuthState() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userData = this.authService.getUserData();
    } else {
      this.userData = null;
    }
  }

  openMenu() { 
    this.menuOpen = true; 
  }
  
  closeMenu() { 
    this.menuOpen = false; 
  }
  
  toggleMenu() { 
    this.menuOpen = !this.menuOpen; 
  }

  navigateToLogin() {
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    this.closeMenu();
    this.closeProfileDropdown();
    this.router.navigate(['/profile']);
  }

  navigateToInvestor() {
    this.closeMenu();
    this.router.navigate(['/contact-us'], { queryParams: { type: 'investor' } });
  }

  logout() {
    this.authService.logout();
    this.checkAuthState();
    this.closeMenu();
    this.closeProfileDropdown();
    this.router.navigate(['/']);
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  closeProfileDropdown() {
    this.profileDropdownOpen = false;
  }

  openProfileDropdown() {
    this.profileDropdownOpen = true;
  }

  // Get user initials for profile display
  getUserInitials(): string {
    if (this.userData && this.userData.name) {
      const names = this.userData.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      } else {
        return names[0][0].toUpperCase();
      }
    }
    return 'U';
  }

  // Get profile image URL or return null for initials fallback
  getProfileImageUrl(): string | null {
    return this.userData?.profileimage || null;
  }

  // Get first name only
  getFirstName(): string {
    if (this.userData && this.userData.name) {
      return this.userData.name.split(' ')[0];
    }
    return 'User';
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.profileDropdownOpen) return;
    
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.profile-dropdown');
    const button = document.querySelector('.profile-button');
    
    if (!dropdown?.contains(target) && !button?.contains(target)) {
      this.closeProfileDropdown();
    }
  }
}
