import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ChangeDetectorRef, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { NotificationService } from '../services/notification.service';
import { ScrollNavigationService } from '../services/scroll-navigation.service';
import { LocationSuggestionsService, LocationSuggestion } from '../services/location-suggestions.service';
import { CarPublicService } from '../services/car-public.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
  private routerSubscription?: Subscription;
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
    private carPublicService: CarPublicService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    // Check initial auth state
    this.checkAuthState();

    // Listen for route changes to update auth state and check location
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navEvent = event as NavigationEnd;
      // Update auth state
      setTimeout(() => this.checkAuthState(), 0);
      
      // Check if navigated to cars page without location
      if (navEvent.url.includes('/cars')) {
        setTimeout(() => this.checkAndOpenLocationPopup(), 300);
      }
    });

    // Check if we're on cars page and no location is set - auto open location popup
    this.checkAndOpenLocationPopup();

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
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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

    console.log('FAQ button clicked, current URL:', this.router.url);

    // Always navigate to home with a flag to open FAQs modal
    // Use replaceUrl: false to ensure navigation happens even if already on home
    this.router.navigate(['/home'], {
      queryParams: { openFaqs: '1', timestamp: Date.now() }, // Add timestamp to force navigation
      queryParamsHandling: 'merge'
    }).then((success) => {
      console.log('Navigation to home completed:', success);

      // Additional fallback: if we're already on home, try to trigger the modal directly
      if (this.router.url.includes('/home')) {
        setTimeout(() => {
          // Emit a custom event that the home component can listen to
          if (typeof window !== 'undefined') {
            console.log('Dispatching custom openFaqModal event');
            window.dispatchEvent(new CustomEvent('openFaqModal'));
          }
        }, 100);
      }
    }).catch((error) => {
      console.error('Navigation error:', error);
    });
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
    this.isLocationPopupOpen.set(!this.isLocationPopupOpen());
    if (this.isLocationPopupOpen()) {
      this.loadLocationSuggestions();
    }
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
    // Fetch cities from cars in database
    this.isLocationLoading.set(true);

    this.carPublicService.getPublicCars().subscribe({
      next: (res: any) => {
        const carsData = (res && res.body && res.body.cars) ? res.body.cars : (Array.isArray(res) ? res : []);

        // Extract unique cities from cars
        const citiesSet = new Set<string>();
        const citiesWithState: { [key: string]: string } = {};

        carsData.forEach((car: any) => {
          if (car.location && car.location.trim()) {
            const cityName = car.location.trim();
            citiesSet.add(cityName);
            // Store state if available (you might need to add state field to car model)
            if (car.state) {
              citiesWithState[cityName] = car.state;
            }
          }
        });

        // Convert to LocationSuggestion array and sort alphabetically
        const citySuggestions: LocationSuggestion[] = Array.from(citiesSet)
          .sort((a, b) => a.localeCompare(b))
          .map(city => ({
            display_name: citiesWithState[city] ? `${city}, ${citiesWithState[city]}` : city,
            name: city,
            state: citiesWithState[city] || '',
            country: 'India',
            lat: '',
            lon: '',
            type: 'city',
            isSelected: false
          }));

        this.locationSuggestions.set(citySuggestions);
        this.isLocationLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading cities from database:', error);
        // Fallback to empty array on error
        this.locationSuggestions.set([]);
        this.isLocationLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  selectLocation(suggestion: LocationSuggestion) {
    // Store location in session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selectedLocation', suggestion.name);
      if (suggestion.state) {
        sessionStorage.setItem('selectedState', suggestion.state);
      }
    }

    // Update user location in the system
    this.updateUserLocation(suggestion.name);
    this.closeLocationPopup();

    // Navigate to cars page with location filter
    // If already on cars page, reload with new location
    if (this.router.url.includes('/cars')) {
      // Already on cars page - navigate with location parameter to trigger reload
      this.router.navigate(['/cars'], {
        queryParams: {
          location: suggestion.name,
          state: suggestion.state || '',
          timestamp: Date.now() // Force navigation even if on same route
        },
        queryParamsHandling: 'merge'
      }).then(() => {
        // Force page reload to apply location filter
        window.location.reload();
      });
    } else {
      // Navigate to cars page with location filter
      this.router.navigate(['/cars'], {
        queryParams: {
          location: suggestion.name,
          state: suggestion.state || ''
        }
      });
    }
  }

  private updateUserLocation(location: string) {
    // Update location in session storage for persistence
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selectedLocation', location);
    }

    // Update local userData if available
    if (this.userData) {
      this.userData.location = location;
      this.authService.setUserData(this.userData);
    }
  }

  // Get selected location from session storage
  getSelectedLocation(): string {
    if (typeof sessionStorage === 'undefined') {
      return '';
    }
    const location = sessionStorage.getItem('selectedLocation');
    return location || '';
  }

  allLocationSuggestions(): LocationSuggestion[] {
    return this.locationSuggestions();
  }

  // Check if location is set and auto-open popup on cars page if not set
  private checkAndOpenLocationPopup() {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    // Only check if we're on the cars page
    if (!this.router.url.includes('/cars')) {
      return;
    }

    // Check if location is not set
    const savedLocation = sessionStorage.getItem('selectedLocation');
    if (!savedLocation) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (!this.isLocationPopupOpen()) {
          this.isLocationPopupOpen.set(true);
          this.loadLocationSuggestions();
          this.cdr.detectChanges();
        }
      }, 500);
    }
  }
}
