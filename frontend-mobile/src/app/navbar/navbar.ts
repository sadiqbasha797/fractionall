import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ChangeDetectorRef, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationService } from '../services/notification.service';
import { ScrollNavigationService } from '../services/scroll-navigation.service';
import { LocationSuggestionsService, LocationSuggestion } from '../services/location-suggestions.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  menuOpen = false;
  profileDropdownOpen = false;
  isLoggedIn = false;
  userData: any = null;
  private authSubscription?: Subscription;
  private scrollSubscription?: Subscription;
  private notificationSubscription?: Subscription;
  activeScrollSection = '';
  unreadCount = 0;

  // Location popup functionality
  isLocationPopupOpen = signal(false);
  locationSearchQuery = signal('');
  locationSuggestions = signal<LocationSuggestion[]>([]);
  isLocationLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollNavigationService: ScrollNavigationService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private locationSuggestionsService: LocationSuggestionsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Check initial auth state
    this.checkAuthState();
    
    // Listen for route changes to update auth state
    this.router.events.subscribe(() => {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => this.checkAuthState(), 0);
    });

    // Subscribe to scroll navigation service for active section updates
    this.scrollSubscription = this.scrollNavigationService.activeSection$.subscribe(
      (activeSection) => {
        this.activeScrollSection = activeSection;
        // Trigger change detection after the current cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    );

    // Initialize notifications unread count for badge
    this.notificationSubscription = this.notificationService.unreadCount$.subscribe((cnt) => {
      this.unreadCount = cnt || 0;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    // Ensure auth state is properly set after view initialization
    setTimeout(() => this.checkAuthState(), 0);
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  checkAuthState() {
    const loggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn !== loggedIn) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isLoggedIn = loggedIn;
        if (this.isLoggedIn) {
          this.userData = this.authService.getUserData();
          this.notificationService.initializeAutoRefresh();
        } else {
          this.userData = null;
          this.notificationService.clearNotifications();
          this.unreadCount = 0;
        }
        this.cdr.detectChanges();
      }, 0);
    } else if (this.isLoggedIn) {
      // Even if login state is same, update user data in case it changed
      this.userData = this.authService.getUserData();
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

  scrollToFAQ() {
    this.closeMenu();
    
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
        const isMobile = window.innerWidth < 768;
        const mobileOffset = isMobile ? 40 : 20; // More offset on mobile
        
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
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.checkAuthState();
    }, 0);
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

  // Get user location
  getUserLocation(): string {
    if (this.userData && this.userData.location) {
      return this.userData.location;
    }
    return '';
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

  // Location popup methods
  toggleLocationPopup() {
    // Disabled - location search is now handled on the cars page
    // this.isLocationPopupOpen.set(!this.isLocationPopupOpen());
    // if (this.isLocationPopupOpen()) {
    //   this.loadLocationSuggestions();
    // }
  }

  closeLocationPopup() {
    this.isLocationPopupOpen.set(false);
    this.locationSearchQuery.set('');
    this.locationSuggestions.set([]);
  }

  onLocationInputChange(query: string) {
    this.locationSearchQuery.set(query);
    if (query.length > 2) {
      this.searchLocations(query);
    } else {
      this.locationSuggestions.set([]);
    }
  }

  onLocationSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.searchLocations(this.locationSearchQuery());
    }
  }

  private searchLocations(query: string) {
    if (query.length < 3) return;
    
    this.isLocationLoading.set(true);
    // For now, we'll create mock suggestions since the service methods don't exist
    const mockSuggestions: LocationSuggestion[] = [
      { 
        display_name: 'Mumbai, Maharashtra, India', 
        name: 'Mumbai', 
        state: 'Maharashtra', 
        country: 'India', 
        lat: '19.0760', 
        lon: '72.8777', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Delhi, India', 
        name: 'Delhi', 
        state: 'Delhi', 
        country: 'India', 
        lat: '28.7041', 
        lon: '77.1025', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Bangalore, Karnataka, India', 
        name: 'Bangalore', 
        state: 'Karnataka', 
        country: 'India', 
        lat: '12.9716', 
        lon: '77.5946', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Hyderabad, Telangana, India', 
        name: 'Hyderabad', 
        state: 'Telangana', 
        country: 'India', 
        lat: '17.3850', 
        lon: '78.4867', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Chennai, Tamil Nadu, India', 
        name: 'Chennai', 
        state: 'Tamil Nadu', 
        country: 'India', 
        lat: '13.0827', 
        lon: '80.2707', 
        type: 'city', 
        isSelected: false 
      }
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    
    setTimeout(() => {
      this.locationSuggestions.set(mockSuggestions);
      this.isLocationLoading.set(false);
      this.cdr.detectChanges();
    }, 500);
  }

  private loadLocationSuggestions() {
    // Load popular cities
    const popularCities: LocationSuggestion[] = [
      { 
        display_name: 'Mumbai, Maharashtra, India', 
        name: 'Mumbai', 
        state: 'Maharashtra', 
        country: 'India', 
        lat: '19.0760', 
        lon: '72.8777', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Delhi, India', 
        name: 'Delhi', 
        state: 'Delhi', 
        country: 'India', 
        lat: '28.7041', 
        lon: '77.1025', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Bangalore, Karnataka, India', 
        name: 'Bangalore', 
        state: 'Karnataka', 
        country: 'India', 
        lat: '12.9716', 
        lon: '77.5946', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Hyderabad, Telangana, India', 
        name: 'Hyderabad', 
        state: 'Telangana', 
        country: 'India', 
        lat: '17.3850', 
        lon: '78.4867', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Chennai, Tamil Nadu, India', 
        name: 'Chennai', 
        state: 'Tamil Nadu', 
        country: 'India', 
        lat: '13.0827', 
        lon: '80.2707', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Kolkata, West Bengal, India', 
        name: 'Kolkata', 
        state: 'West Bengal', 
        country: 'India', 
        lat: '22.5726', 
        lon: '88.3639', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Pune, Maharashtra, India', 
        name: 'Pune', 
        state: 'Maharashtra', 
        country: 'India', 
        lat: '18.5204', 
        lon: '73.8567', 
        type: 'city', 
        isSelected: false 
      },
      { 
        display_name: 'Ahmedabad, Gujarat, India', 
        name: 'Ahmedabad', 
        state: 'Gujarat', 
        country: 'India', 
        lat: '23.0225', 
        lon: '72.5714', 
        type: 'city', 
        isSelected: false 
      }
    ];
    
    this.locationSuggestions.set(popularCities);
    this.cdr.detectChanges();
  }

  selectLocation(suggestion: LocationSuggestion) {
    // Update user location in the system
    this.updateUserLocation(suggestion.name);
    this.closeLocationPopup();
    
    // Navigate to cars page with location filter
    this.router.navigate(['/cars'], { 
      queryParams: { 
        location: suggestion.name,
        state: suggestion.state 
      } 
    });
  }

  private updateUserLocation(location: string) {
    // Here you would typically update the user's location via API
    // For now, we'll just update the local userData
    if (this.userData) {
      this.userData.location = location;
      this.authService.setUserData(this.userData);
    }
  }

  allLocationSuggestions(): LocationSuggestion[] {
    return this.locationSuggestions();
  }
}
