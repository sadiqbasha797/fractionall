import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { ScrollNavigationService } from '../services/scroll-navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  profileDropdownOpen = false;
  isLoggedIn = false;
  userData: any = null;
  isMobile = false;
  private authSubscription?: Subscription;
  private scrollSubscription?: Subscription;
  activeScrollSection = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollNavigationService: ScrollNavigationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Check initial auth state
    this.checkAuthState();
    
    // Detect mobile device using user agent instead of screen width
    // since we're forcing desktop view on mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Listen for auth state changes (if you implement a subject for this)
    // For now, we'll check on component init and after navigation
    
    // Listen for route changes to update auth state
    this.router.events.subscribe(() => {
      this.checkAuthState();
    });

    // Subscribe to scroll navigation service for active section updates
    this.scrollSubscription = this.scrollNavigationService.activeSection$.subscribe(
      (activeSection) => {
        this.activeScrollSection = activeSection;
        // Trigger change detection after the current cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    );
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
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


  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    this.closeProfileDropdown();
    this.router.navigate(['/profile']);
  }

  navigateToInvestor() {
    this.router.navigate(['/contact-us'], { queryParams: { type: 'investor' } });
  }

  scrollToFAQ() {
    // Check if we're already on the home page
    if (this.router.url === '/home') {
      // If already on home page, scroll directly to FAQ section
      this.scrollToFAQSection();
    } else {
      // Navigate to home page first, then scroll to FAQ section
      this.router.navigate(['/home']).then(() => {
        this.scrollToFAQSection();
      });
    }
  }

  private scrollToFAQSection() {
    // Use a more robust approach to ensure the element is available
    const scrollToElement = () => {
      const faqElement = document.querySelector('[data-faq-section]');
      if (faqElement) {
        // Get navbar height to offset the scroll position
        const navbar = document.querySelector('nav');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        
        // Check if we're on mobile for additional offset
        const mobileOffset = this.isMobile ? 40 : 20; // More offset on mobile
        
        // Calculate the position to scroll to (accounting for navbar height and device type)
        const elementPosition = faqElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight - mobileOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // If element not found, try again after a short delay
        setTimeout(scrollToElement, 100);
      }
    };
    
    // Start scrolling after a short delay to ensure page is loaded
    setTimeout(scrollToElement, 200);
  }

  logout() {
    this.authService.logout();
    this.checkAuthState();
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

  // Check if a navigation item should be active based on scroll position
  isNavItemActive(route: string): boolean {
    // For home page, check if we're on home route and not in FAQ section
    if (route === '/home') {
      return this.router.url === '/home' && this.activeScrollSection !== 'faq';
    }
    
    // For FAQ, check if we're in FAQ section
    if (route === 'faq') {
      return this.activeScrollSection === 'faq';
    }
    
    // For other routes, use routerLinkActive
    return this.router.url === route;
  }

  // Check if FAQ should be active
  isFaqActive(): boolean {
    return this.activeScrollSection === 'faq';
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
