import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, signal, computed, effect, ElementRef, Renderer2, DestroyRef, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CarPublicService } from '../services/car-public.service';
import { PaymentService, PaymentOrder, PaymentVerification } from '../services/payment.service';
import { TokenService } from '../services/token.service';
import { BookNowTokenService } from '../services/book-now-token.service';
import { AuthService } from '../services/auth.service';
import { AnimationService } from '../services/animation.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car-details.html',
  styleUrls: ['./car-details.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class CarDetails implements OnInit, OnDestroy, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    public router: Router,
    private carService: CarPublicService,
    private paymentService: PaymentService,
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private authService: AuthService,
    private userService: UserService,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private animationService: AnimationService
  ) {
    // Effect to reinitialize animations when car data changes
    // Use DestroyRef to properly manage effect lifecycle
    const effectRef = effect(() => {
      const carData = this.carData();
      const isLoading = this.loading();
      
      if (!isLoading && carData && isPlatformBrowser(this.platformId)) {
        // Delay animation refresh to ensure DOM is updated
        setTimeout(() => {
          this.initAngularAnimations();
        }, 200);
      }
    });
    
    // Register effect cleanup with component destruction
    this.destroyRef.onDestroy(() => {
      effectRef.destroy();
    });
  }

  // Car data properties - converted to signals
  protected carId = signal<string>('');
  protected carData = signal<any>(null);
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);
  
  // Computed property to check if bookings are stopped
  protected isBookingStopped = computed(() => {
    const car = this.carData();
    return car?.stopBookings === true;
  });

  // User data properties
  protected user = signal<any>({
    _id: '',
    name: '',
    email: '',
    phone: '',
    dateofbirth: '',
    location: '',
    address: '',
    pincode: '',
    profileimage: '',
    verified: false,
    kycStatus: 'pending',
    governmentid: {
      aadharid: '',
      panid: '',
      licenseid: '',
      income: ''
    },
    createdAt: ''
  });
  protected userLoading = signal<boolean>(false);
  protected userError = signal<string>('');

  // Carousel properties
  protected currentSlide = signal<number>(0);
  protected totalSlides = signal<number>(4);
  carouselInterval: any;

  // Mobile menu properties
  protected isMobileMenuOpen = signal<boolean>(false);

  // Payment properties
  protected razorpayKey = signal<string>('');
  protected isPaymentLoading = signal<boolean>(false);
  protected paymentError = signal<string | null>(null);
  protected showPaymentModal = signal<boolean>(false);
  protected paymentType = signal<'book-now' | 'waitlist' | null>(null);
  protected recordCreated = signal<boolean>(false);
  protected recordId = signal<string | null>(null);
  
  // Purchase status properties
  protected hasBookNowToken = signal<boolean>(false);
  protected hasWaitlistToken = signal<boolean>(false);
  protected checkingPurchaseStatus = signal<boolean>(true);
  protected totalBookNowTokens = signal<number>(0);
  protected totalWaitlistTokens = signal<number>(0);
  protected maxTotalTokens = 6; // Total tokens allowed (any combination of waitlist + book now)

  // Token data properties (similar to profile)
  protected tokens = signal<any[]>([]);
  protected tokensLoading = signal<boolean>(false);
  protected tokensError = signal<string>('');

  protected bookNowTokens = signal<any[]>([]);
  protected bookNowTokensLoading = signal<boolean>(false);
  protected bookNowTokensError = signal<string>('');

  // Authentication flow properties
  protected showLoginModal = signal<boolean>(false);
  protected pendingPaymentType = signal<'book-now' | 'waitlist' | null>(null);
  protected returnUrl = signal<string>('');
  protected authSuccessMessage = signal<string>('');

  // Info modal properties
  protected showInfoModal = signal<boolean>(false);
  protected infoModalType = signal<'book-now' | 'waitlist' | null>(null);

  // Car details modal properties
  protected showSpecsModal = signal<boolean>(false);
  protected showFeaturesModal = signal<boolean>(false);
  protected showLocationModal = signal<boolean>(false);

  // New modal properties
  protected showFractionDetailsModal = signal<boolean>(false);
  protected showBookNowModal = signal<boolean>(false);
  protected showWaitlistModal = signal<boolean>(false);
  protected showAMCModal = signal<boolean>(false);


  // Description toggle properties
  protected showFullDescription = signal<boolean>(false);

  // Calendar properties
  protected viewDate = signal<Date>(new Date());
  protected bookedRanges = signal<string[][]>([
    ['2024-12-24','2024-12-26'],
    ['2025-01-05','2025-01-10'],
    ['2025-02-14','2025-02-14']
  ]);

  ngOnInit() {
    // Get car ID from route parameters
    this.carId.set(this.route.snapshot.paramMap.get('id') || '');
    
    // Set return URL for authentication flow
    this.returnUrl.set(`/car-details/${this.carId()}`);
    
    // Load car data
    this.loadCarData();

    // Load Razorpay key
    this.loadRazorpayKey();
    
    // Load user profile first (similar to profile component)
    this.loadUserProfile();

    // Check if user just returned from authentication
    this.checkAuthReturn();

    // Listen for navigation events to refresh purchase status when returning to this page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // If we're navigating to this car details page, refresh purchase status
      if (event.url.includes(`/car-details/${this.carId()}`)) {
        // Small delay to ensure any auth state changes are processed
        setTimeout(() => {
          this.loadUserProfile();
        }, 200);
      }
    });

    // Listen for page visibility changes to refresh status when user returns to tab
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.onPageVisible();
        }
      });
      
      // Listen for window focus events
      window.addEventListener('focus', () => {
        this.onWindowFocus();
      });
    }

    // Initialize Angular animations
    if (isPlatformBrowser(this.platformId)) {
      this.initAngularAnimations();
    }
  }

  loadCarData() {
    if (!this.carId()) {
      this.error.set('Car ID not found');
      this.loading.set(false);
      return;
    }

    this.carService.getPublicCarById(this.carId()).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.carData.set(response.body.car);
          this.totalSlides.set(this.carData().images?.length || 1);
          this.loading.set(false);
          
          // Track car view for retargeting
          this.trackCarView();
        } else {
          this.error.set(response.message || 'Failed to load car data');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading car data:', error);
        this.error.set('Failed to load car data');
        this.loading.set(false);
      }
    });
  }

  trackCarView() {
    if (!this.carId()) {
      return;
    }

    // Check if user has a token (more lenient check for retargeting)
    const token = this.authService.getToken();
    
    if (token) {
      // Use authenticated endpoint for retargeting (even if user not fully verified)
      this.carService.trackCarViewWithRetargeting(this.carId()).subscribe({
        next: (response) => {
          console.log('Car view tracked with retargeting:', response);
        },
        error: (error) => {
          console.error('Error tracking car view with retargeting:', error);
          // Fallback to anonymous tracking if authenticated tracking fails
          this.trackAnonymousView();
        }
      });
    } else {
      // Use anonymous endpoint for basic tracking
      this.trackAnonymousView();
    }
  }

  trackAnonymousView() {
    if (!this.carId()) {
      return;
    }

    this.carService.trackCarView(this.carId()).subscribe({
      next: (response) => {
        console.log('Anonymous car view tracked:', response);
      },
      error: (error) => {
        console.error('Error tracking anonymous car view:', error);
      }
    });
  }

  loadUserProfile() {
    this.userLoading.set(true);
    this.userError.set('');
    
    // First try to get from localStorage if available
    const storedUser = this.authService.getUserData();
    if (storedUser) {
      this.user.set({ ...this.user(), ...storedUser });
    }

    // Check if user is authenticated
    const token = this.authService.getToken();
    if (!token) {
      this.userLoading.set(false);
      this.userError.set('Please login to view purchase options.');
      this.checkingPurchaseStatus.set(false);
      return;
    }

    // If user is authenticated, close any open login modal
    if (this.showLoginModal()) {
      this.closeLoginModal();
    }

    // Then fetch fresh data from API
    this.userService.getProfile().subscribe({
      next: (response) => {
        this.userLoading.set(false);
        if (response && response.body && response.body.user) {
          this.user.set({ ...this.user(), ...response.body.user });
          // Update stored user data
          this.authService.setUserData(this.user());
          // Track car view now that user is authenticated (for retargeting)
          this.trackCarView();
          // Now load tokens and book now tokens since user is authenticated
          this.loadUserTokens();
          this.loadUserBookNowTokens();
        }
      },
      error: (error) => {
        this.userLoading.set(false);
        console.error('Error loading profile:', error);
        
        if (error.status === 401) {
          this.userError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.userError.set('Access denied. You do not have permission to view this page.');
        } else {
          this.userError.set('Failed to load user data. Please try again later.');
        }
        
        // If API fails but we have stored data, use that
        if (!this.user().name && storedUser) {
          this.user.set({ ...this.user(), ...storedUser });
          // Still try to load tokens with stored data
          this.loadUserTokens();
          this.loadUserBookNowTokens();
        } else {
          this.checkingPurchaseStatus.set(false);
        }
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCarousel();
      this.initializeBookingCalendar();
      this.initAngularAnimations();
    }
  }

  private initAngularAnimations(): void {
    // Initialize animations using the animation service
    this.animationService.initAnimations(this.elRef, this.renderer);
  }

  ngOnDestroy() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    
    // Remove event listeners
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onPageVisible.bind(this));
      window.removeEventListener('focus', this.onWindowFocus.bind(this));
    }
  }

  // Mobile menu methods
  openMobileMenu() {
    this.isMobileMenuOpen.set(true);
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = mobileMenu?.querySelector('.absolute.inset-0') as HTMLElement;
    const mobileMenuContent = mobileMenu?.querySelector('.absolute.inset-y-0.right-0') as HTMLElement;
    const menuLinks = mobileMenu?.querySelectorAll('nav a') as NodeListOf<HTMLElement>;

    if (mobileMenu && mobileMenuOverlay && mobileMenuContent) {
      mobileMenu.classList.remove('pointer-events-none');
      mobileMenu.classList.add('pointer-events-auto');
      mobileMenu.style.opacity = '1';
      mobileMenuOverlay.style.opacity = '1';
      mobileMenuContent.style.transform = 'translateX(0) scale(1)';
      mobileMenuContent.style.opacity = '1';
      
      // Animate menu items
      menuLinks?.forEach((link, index) => {
        setTimeout(() => {
          link.style.opacity = '1';
        }, 100 + (index * 100));
      });
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = mobileMenu?.querySelector('.absolute.inset-0') as HTMLElement;
    const mobileMenuContent = mobileMenu?.querySelector('.absolute.inset-y-0.right-0') as HTMLElement;
    const menuLinks = mobileMenu?.querySelectorAll('nav a') as NodeListOf<HTMLElement>;

    if (mobileMenu && mobileMenuOverlay && mobileMenuContent) {
      mobileMenu.style.opacity = '0';
      mobileMenuOverlay.style.opacity = '0';
      mobileMenuContent.style.transform = 'translateX(100%) scale(0.95)';
      mobileMenuContent.style.opacity = '0';
      
      // Reset menu items opacity
      menuLinks?.forEach(link => {
        link.style.opacity = '0';
      });

      setTimeout(() => {
        mobileMenu.classList.remove('pointer-events-auto');
        mobileMenu.classList.add('pointer-events-none');
      }, 700);
    }
  }

  // Carousel methods
  initializeCarousel() {
    const carouselContainer = document.querySelector('.carousel-container') as HTMLElement;
    if (carouselContainer) {
      carouselContainer.style.transition = 'transform 0.5s ease-in-out';
      
      // Auto-advance carousel every 3 seconds
      this.carouselInterval = setInterval(() => {
        this.moveCarousel(1);
      }, 3000);

      // Keep position correct on resize
      window.addEventListener('resize', () => this.updateCarousel());
    }
  }

  updateCarousel() {
    const carouselContainer = document.querySelector('.carousel-container') as HTMLElement;
    const indicators = document.querySelectorAll('.bottom-4 button') as NodeListOf<HTMLElement>;

    if (carouselContainer) {
      const wrapper = carouselContainer.parentElement as HTMLElement;
      const slideWidth = wrapper ? wrapper.clientWidth : 0;
      const offsetPx = this.currentSlide() * slideWidth;
      carouselContainer.style.transform = `translateX(-${offsetPx}px)`;
    }
    
    // Update indicators
    indicators?.forEach((indicator, index) => {
      if (index === this.currentSlide()) {
        indicator.classList.remove('opacity-60');
      } else {
        indicator.classList.add('opacity-60');
      }
    });
  }

  moveCarousel(direction: number) {
    this.currentSlide.set((this.currentSlide() + direction + this.totalSlides()) % this.totalSlides());
    this.updateCarousel();
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.updateCarousel();
  }

  // Calendar methods
  initializeBookingCalendar() {
    this.renderCalendar();
  }

  parseDate(s: string): Date {
    const p = s.split('-');
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  }

  formatYMD(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  isBooked(date: Date): boolean {
    const ymd = this.formatYMD(date);
    return this.bookedRanges().some(r => {
      const start = this.parseDate(r[0]);
      const end = this.parseDate(r[1]);
      return date >= start && date <= end;
    });
  }

  renderCalendar() {
    const wrapper = document.getElementById('booking-calendar');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'flex items-center justify-between mb-3';
    const monthLabel = document.createElement('div');
    monthLabel.className = 'font-medium';
    monthLabel.textContent = this.viewDate().toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const controls = document.createElement('div');
    controls.className = 'flex gap-2';
    const prev = document.createElement('button');
    prev.textContent = '◀';
    prev.className = 'px-2 py-1 rounded bg-gray-700 hover:bg-gray-600';
    const next = document.createElement('button');
    next.textContent = '▶';
    next.className = 'px-2 py-1 rounded bg-gray-700 hover:bg-gray-600';
    
    prev.addEventListener('click', () => {
      const newDate = new Date(this.viewDate());
      newDate.setMonth(newDate.getMonth() - 1);
      this.viewDate.set(newDate);
      this.renderCalendar();
    });
    
    next.addEventListener('click', () => {
      const newDate = new Date(this.viewDate());
      newDate.setMonth(newDate.getMonth() + 1);
      this.viewDate.set(newDate);
      this.renderCalendar();
    });
    
    controls.appendChild(prev);
    controls.appendChild(next);
    head.appendChild(monthLabel);
    head.appendChild(controls);
    wrapper.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-7 gap-1 text-center';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
      const el = document.createElement('div');
      el.className = 'text-xs text-text-secondary';
      el.textContent = d;
      grid.appendChild(el);
    });

    const first = new Date(this.viewDate().getFullYear(), this.viewDate().getMonth(), 1);
    const last = new Date(this.viewDate().getFullYear(), this.viewDate().getMonth() + 1, 0);
    const startIndex = first.getDay();

    // empty slots
    for (let i = 0; i < startIndex; i++) {
      const empty = document.createElement('div');
      empty.innerHTML = '&nbsp;';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(this.viewDate().getFullYear(), this.viewDate().getMonth(), d);
      const cell = document.createElement('div');
      const booked = this.isBooked(date);
      cell.className = 'p-2 rounded-lg text-sm cursor-default ' + (booked ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white/95');
      cell.textContent = d.toString();
      // show tooltip for full date
      cell.title = this.formatYMD(date) + (booked ? ' — Booked' : ' — Available');
      grid.appendChild(cell);
    }

    wrapper.appendChild(grid);
  }

  setCalendarView(d: Date) {
    this.viewDate.set(d);
    this.renderCalendar();
  }

  // Helper methods for template
  getFormattedPrice(price: string | undefined): string {
    if (!price) return 'N/A';
    // If price doesn't include currency symbol, add ₹
    if (!price.includes('₹') && !price.includes('Rs')) {
      return `₹${price}`;
    }
    return price;
  }

  getFractionPrice(): string {
    const carData = this.carData();
    if (carData?.fractionprice) {
      return this.getFormattedPrice(carData.fractionprice);
    }
    
    // Calculate fraction price if not provided
    if (carData?.price && carData?.totaltickets) {
      const priceNum = parseFloat(carData.price.replace(/[₹,\s]/g, ''));
      const fractionPrice = priceNum / carData.totaltickets;
      return `₹${fractionPrice.toFixed(2)}`;
    }
    
    return 'N/A';
  }

  hasMultipleImages(): boolean {
    const carData = this.carData();
    return carData?.images && carData.images.length > 1;
  }

  getContractYears(): number {
    const carData = this.carData();
    return carData?.contractYears || 5; // Default to 5 years if not set
  }

  getAMCPerYear(): string {
    const carData = this.carData();
    if (carData?.amcperticket) {
      const amcPerTicket = parseFloat(carData.amcperticket.replace(/[₹,\s]/g, ''));
      const contractYears = this.getContractYears();
      const amcPerYear = amcPerTicket / contractYears;
      return `₹${amcPerYear.toFixed(0)}`;
    }
    return '₹11,000'; // Default fallback (₹55,000 / 5 years)
  }

  getTotalAMCForContract(): string {
    const carData = this.carData();
    if (carData?.amcperticket) {
      const amcPerTicket = parseFloat(carData.amcperticket.replace(/[₹,\s]/g, ''));
      return `₹${amcPerTicket.toFixed(0)}`;
    }
    return '₹55,000'; // Default fallback
  }

  // Payment methods
  loadRazorpayKey() {
    this.paymentService.getRazorpayKey().subscribe({
      next: (response) => {
        this.razorpayKey.set(response.key);
      },
      error: (error) => {
        console.error('Failed to load Razorpay key:', error);
        this.paymentError.set('Failed to load payment system. Please refresh the page.');
      }
    });
  }

  loadUserTokens() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.tokensError.set('Please login to view your tokens');
      return;
    }

    this.tokensLoading.set(true);
    this.tokensError.set('');

    this.tokenService.getUserTokens().subscribe({
      next: (response) => {
        this.tokensLoading.set(false);
        
        if (response && response.body && response.body.tokens) {
          this.tokens.set(response.body.tokens);
          this.totalWaitlistTokens.set(response.body.tokens.length);
          
          // Check if user has waitlist token for this car
          const hasWaitlist = response.body.tokens.some((token: any) => 
            token.carid?._id === this.carId() || token.carid === this.carId()
          );
          this.hasWaitlistToken.set(hasWaitlist);
        }
        
        // Check if both token types are loaded to update checking status
        this.updatePurchaseStatusCheck();
      },
      error: (error) => {
        this.tokensLoading.set(false);
        console.error('Error loading tokens:', error);
        
        if (error.status === 401) {
          this.tokensError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.tokensError.set('Access denied. You do not have permission to view tokens.');
        } else {
          this.tokensError.set('Failed to load tokens. Please try again later.');
        }
        
        // Check if both token types are loaded to update checking status
        this.updatePurchaseStatusCheck();
      }
    });
  }

  loadUserBookNowTokens() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.bookNowTokensError.set('Please login to view your book now tokens');
      return;
    }

    this.bookNowTokensLoading.set(true);
    this.bookNowTokensError.set('');

    this.bookNowTokenService.getUserBookNowTokens().subscribe({
      next: (response) => {
        this.bookNowTokensLoading.set(false);
        
        if (response && response.body && response.body.bookNowTokens) {
          this.bookNowTokens.set(response.body.bookNowTokens);
          this.totalBookNowTokens.set(response.body.bookNowTokens.length);
          
          // Check if user has book now token for this car
          const hasBookNow = response.body.bookNowTokens.some((token: any) => 
            token.carid?._id === this.carId() || token.carid === this.carId()
          );
          this.hasBookNowToken.set(hasBookNow);
        }
        
        // Check if both token types are loaded to update checking status
        this.updatePurchaseStatusCheck();
      },
      error: (error) => {
        this.bookNowTokensLoading.set(false);
        console.error('Error loading book now tokens:', error);
        
        if (error.status === 401) {
          this.bookNowTokensError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.bookNowTokensError.set('Access denied. You do not have permission to view book now tokens.');
        } else {
          this.bookNowTokensError.set('Failed to load book now tokens. Please try again later.');
        }
        
        // Check if both token types are loaded to update checking status
        this.updatePurchaseStatusCheck();
      }
    });
  }

  updatePurchaseStatusCheck() {
    // Only update checking status when both token types have finished loading
    if (!this.tokensLoading() && !this.bookNowTokensLoading()) {
      this.checkingPurchaseStatus.set(false);
      
      // If there's a pending payment, show success message (don't auto-process)
      if (this.pendingPaymentType()) {
        this.processPendingPayment();
      }
    }
  }

  checkAuthReturn() {
    // Avoid SSR/hydration issues
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if user just returned from authentication
    const urlParams = new URLSearchParams(window.location.search);
    const authReturn = urlParams.get('auth_return');
    const pendingPayment = urlParams.get('pending_payment');
    
    if (authReturn === 'true' && pendingPayment) {
      // User returned from authentication, check if they're now logged in
      if (this.authService.isLoggedIn()) {
        // Close any open login modal
        this.closeLoginModal();
        
        // Reload user profile and tokens
        this.loadUserProfile();
        
        // If there was a pending payment, process it directly after data loads
        if (pendingPayment === 'book-now' || pendingPayment === 'waitlist') {
          this.pendingPaymentType.set(pendingPayment as 'book-now' | 'waitlist');
          // Process the pending payment after user data is loaded
          this.processPendingPayment();
        }
      }
      
      // Clean up URL parameters
      this.cleanUrlParams();
    }
  }

  cleanUrlParams() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Remove auth_return and pending_payment parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('auth_return');
    url.searchParams.delete('pending_payment');
    window.history.replaceState({}, '', url.toString());
  }

  // Method to handle page visibility changes (when user returns to tab)
  onPageVisible() {
    // When page becomes visible, reload user profile and tokens
    this.loadUserProfile();
  }

  // Method to handle focus events (when user returns to window)
  onWindowFocus() {
    // When window gains focus, reload user profile and tokens
    this.loadUserProfile();
  }

  // Method to refresh purchase status (can be called externally)
  refreshPurchaseStatus() {
    this.loadUserProfile();
  }

  // Method to handle authentication state changes
  onAuthStateChange() {
    // When auth state changes, reload user profile and tokens
    this.loadUserProfile();
  }

  // Method to check if user is logged in and refresh status if needed
  checkAuthAndRefresh() {
    if (this.authService.isLoggedIn()) {
      this.loadUserProfile();
    } else {
      this.checkingPurchaseStatus.set(false);
    }
  }

  // Authentication modal methods
  openLoginModal() {
    // Only show modal if user is not logged in
    if (!this.authService.isLoggedIn()) {
      this.showLoginModal.set(true);
    }
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
    this.pendingPaymentType.set(null);
  }

  // Method to check if login modal should be shown
  shouldShowLoginModal(): boolean {
    return this.showLoginModal() && !this.authService.isLoggedIn();
  }

  // Getter for auth success message
  getAuthSuccessMessage(): string {
    return this.authSuccessMessage();
  }

  redirectToLogin() {
    const returnUrl = encodeURIComponent(this.returnUrl());
    const pendingPayment = this.pendingPaymentType();
    this.router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: returnUrl,
        pending_payment: pendingPayment
      }
    });
  }

  redirectToRegister() {
    const returnUrl = encodeURIComponent(this.returnUrl());
    const pendingPayment = this.pendingPaymentType();
    this.router.navigate(['/register'], { 
      queryParams: { 
        returnUrl: returnUrl,
        pending_payment: pendingPayment
      }
    });
  }

  // Method to handle successful authentication return
  onAuthSuccess() {
    this.closeLoginModal();
    this.loadUserProfile();
    
    // Track car view now that user is authenticated (for retargeting)
    this.trackCarView();
    
    // If there was a pending payment, show success message (don't auto-process)
    const pendingPayment = this.pendingPaymentType();
    if (pendingPayment) {
      this.showAuthSuccessMessage(pendingPayment);
      this.pendingPaymentType.set(null);
    }
  }

  // Method to process pending payment after authentication
  processPendingPayment() {
    const pendingPayment = this.pendingPaymentType();
    if (pendingPayment && this.authService.isLoggedIn()) {
      // Clear the pending payment type
      this.pendingPaymentType.set(null);
      
      // Show a success message instead of automatically initiating payment
      this.showAuthSuccessMessage(pendingPayment);
    }
  }

  // Method to show authentication success message
  showAuthSuccessMessage(paymentType: 'book-now' | 'waitlist') {
    const message = paymentType === 'book-now' 
      ? 'Login successful! You can now proceed to book this car.'
      : 'Login successful! You can now join the waitlist for this car.';
    
    this.authSuccessMessage.set(message);
    
    // Clear the message after 5 seconds
    setTimeout(() => {
      this.authSuccessMessage.set('');
    }, 5000);
  }

  initiatePayment(type: 'book-now' | 'waitlist') {
    // Check if bookings are stopped for this car
    if (this.isBookingStopped()) {
      this.paymentError.set('Bookings are currently stopped for this car. Please try again later.');
      return;
    }
    
    // First check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.pendingPaymentType.set(type);
      this.showLoginModal.set(true);
      return;
    }

    // Clear any pending payment type since we're processing now
    this.pendingPaymentType.set(null);

    if (!this.razorpayKey()) {
      this.paymentError.set('Payment system not ready. Please refresh the page.');
      return;
    }

    // Check if user already has this token type for this specific car
    if (type === 'book-now' && this.hasBookNowToken()) {
      this.paymentError.set('You have already purchased a Book Now token for this car.');
      return;
    }

    if (type === 'waitlist' && this.hasWaitlistToken()) {
      this.paymentError.set('You have already joined the waitlist for this car.');
      return;
    }

    // Check total token limits (6 total tokens allowed)
    const totalTokens = this.totalBookNowTokens() + this.totalWaitlistTokens();
    if (totalTokens >= this.maxTotalTokens) {
      this.paymentError.set(`You have reached the maximum limit of ${this.maxTotalTokens} tokens total.`);
      return;
    }

    this.paymentType.set(type);
    this.isPaymentLoading.set(true);
    this.paymentError.set(null);

    const carData = this.carData();
    let amount = 0;
    let description = '';

    if (type === 'book-now') {
      amount = parseFloat(carData?.bookNowTokenPrice?.replace(/[₹,\s]/g, '') || '3999');
      description = 'Book Now Token - ' + (carData?.carname || 'Car');
    } else {
      amount = parseFloat(carData?.tokenprice?.replace(/[₹,\s]/g, '') || '199');
      description = 'Waitlist Token - ' + (carData?.carname || 'Car');
    }

    const orderData: PaymentOrder = {
      amount: amount,
      currency: 'INR',
      receipt: `${type}_${Date.now()}`.substring(0, 40)
    };

    this.paymentService.createOrder(orderData).subscribe({
      next: (response) => {
        if (response.success) {
          this.openRazorpayCheckout(response.order, description);
        } else {
          this.paymentError.set(response.message || 'Failed to create payment order');
          this.isPaymentLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating payment order:', error);
        this.paymentError.set('Failed to create payment order. Please try again.');
        this.isPaymentLoading.set(false);
      }
    });
  }

  openRazorpayCheckout(order: any, description: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    const options = {
      key: this.razorpayKey(),
      amount: order.amount,
      currency: order.currency,
      name: 'Fraction Car Co-ownership',
      description: description,
      order_id: order.id,
      handler: (response: any) => {
        this.verifyPayment(response);
      },
      prefill: {
        name: this.authService.getUserData()?.name || 'User',
        email: this.authService.getUserData()?.email || 'user@example.com',
        contact: this.authService.getUserData()?.phone || '9999999999'
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: () => {
          this.isPaymentLoading.set(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  verifyPayment(response: any) {
    const verificationData: PaymentVerification = {
      order_id: response.razorpay_order_id,
      payment_id: response.razorpay_payment_id,
      signature: response.razorpay_signature
    };

    this.paymentService.verifyPayment(verificationData).subscribe({
      next: (result) => {
        if (result.success) {
          // Payment verified successfully, now create the appropriate record
          this.createPaymentRecord(result.payment);
        } else {
          this.paymentError.set('Payment verification failed. Please contact support.');
          this.isPaymentLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.paymentError.set('Payment verification failed. Please contact support.');
        this.isPaymentLoading.set(false);
      }
    });
  }

  createPaymentRecord(paymentData: any) {
    const carData = this.carData();
    const userData = this.authService.getUserData();
    const currentDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

    if (this.paymentType() === 'book-now') {
      // Create Book Now Token record
      const bookNowTokenData = {
        carid: carData, // Pass the full car object
        customtokenid: `BNT_${Date.now()}`,
        userid: userData?._id || userData?.id,
        amountpaid: this.getPaymentAmount(),
        date: currentDate,
        expirydate: expiryDate.toISOString(),
        status: 'active',
        // Add payment information for refund tracking
        paymentTransactionId: paymentData?.payment_id || '',
        razorpayOrderId: paymentData?.order_id || '',
        razorpayPaymentId: paymentData?.payment_id || ''
      };

      this.bookNowTokenService.createBookNowToken(bookNowTokenData).subscribe({
        next: (response) => {
          // Update the car's bookNowTokenAvailable count
          this.updateCarBookNowTokenCount();
          
          // Refresh the entire purchase status to ensure consistency
          this.loadUserProfile();
          
          this.isPaymentLoading.set(false);
          this.recordCreated.set(true);
          this.recordId.set(response.body?.bookNowToken?._id || 'N/A');
          this.showPaymentModal.set(true);
          this.paymentError.set(null);
        },
        error: (error) => {
          console.error('Error creating Book Now Token:', error);
          this.paymentError.set('Payment successful but failed to create booking record. Please contact support.');
          this.isPaymentLoading.set(false);
        }
      });
    } else if (this.paymentType() === 'waitlist') {
      // Create Waitlist Token record
      const tokenData = {
        carid: carData, // Pass the full car object
        customtokenid: `WT_${Date.now()}`,
        userid: userData?._id || userData?.id,
        amountpaid: this.getPaymentAmount(),
        date: currentDate,
        expirydate: expiryDate.toISOString(),
        status: 'active',
        // Add payment information for refund tracking
        paymentTransactionId: paymentData?.payment_id || '',
        razorpayOrderId: paymentData?.order_id || '',
        razorpayPaymentId: paymentData?.payment_id || ''
      };

      this.tokenService.createToken(tokenData).subscribe({
        next: (response) => {
          // Refresh the entire purchase status to ensure consistency
          this.loadUserProfile();
          
          this.isPaymentLoading.set(false);
          this.recordCreated.set(true);
          this.recordId.set(response.body?.token?._id || 'N/A');
          this.showPaymentModal.set(true);
          this.paymentError.set(null);
        },
        error: (error) => {
          console.error('Error creating Waitlist Token:', error);
          this.paymentError.set('Payment successful but failed to create waitlist record. Please contact support.');
          this.isPaymentLoading.set(false);
        }
      });
    }
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.paymentType.set(null);
    this.paymentError.set(null);
    this.recordCreated.set(false);
    this.recordId.set(null);
  }

  getPaymentAmount(): number {
    const carData = this.carData();
    if (this.paymentType() === 'book-now') {
      return parseFloat(carData?.bookNowTokenPrice?.replace(/[₹,\s]/g, '') || '3999');
    } else {
      return parseFloat(carData?.tokenprice?.replace(/[₹,\s]/g, '') || '199');
    }
  }

  getPaymentDescription(): string {
    const carData = this.carData();
    if (this.paymentType() === 'book-now') {
      return 'Book Now Token - ' + (carData?.carname || 'Car');
    } else {
      return 'Waitlist Token - ' + (carData?.carname || 'Car');
    }
  }

  getRecordTypeDescription(): string {
    if (this.paymentType() === 'book-now') {
      return 'Your booking token has been created and you will be notified when the car is ready for deployment.';
    } else {
      return 'You have been added to the waitlist and will get priority access when the car launches in your city.';
    }
  }

  hasReachedBookNowLimit(): boolean {
    // Book Now should only be available when all waitlist tokens are sold out
    const carData = this.carData();
    if (!carData) return true;
    
    // Book Now is blocked if there are still waitlist tokens available
    // tokensavailble === 0 means all waitlist tokens are sold out
    const waitlistTokensSoldOut = carData.tokensavailble === 0;
    const totalTokens = this.totalBookNowTokens() + this.totalWaitlistTokens();
    const userReachedLimit = totalTokens >= this.maxTotalTokens;
    
    return !waitlistTokensSoldOut || userReachedLimit;
  }

  hasReachedWaitlistLimit(): boolean {
    // Join Waitlist should be blocked when waitlist is full
    const carData = this.carData();
    if (!carData) return true;
    
    // Waitlist is full when tokensavailble === 0 (all waitlist tokens sold out)
    const waitlistFull = carData.tokensavailble === 0;
    const totalTokens = this.totalBookNowTokens() + this.totalWaitlistTokens();
    const userReachedLimit = totalTokens >= this.maxTotalTokens;
    
    return waitlistFull || userReachedLimit;
  }

  getBookNowLimitMessage(): string {
    const carData = this.carData();
    if (!carData) return 'Car data not available';
    
    if (carData.tokensavailble > 0) {
      return 'Book Now is not available yet. Please join the waitlist first.';
    }
    
    return `You have reached the maximum limit of ${this.maxTotalTokens} tokens total.`;
  }

  getWaitlistLimitMessage(): string {
    const carData = this.carData();
    if (!carData) return 'Car data not available';
    
    if (carData.tokensavailble === 0) {
      return 'Waitlist is full. Book Now is now available!';
    }
    
    return `You have reached the maximum limit of ${this.maxTotalTokens} tokens total.`;
  }

  updateCarBookNowTokenCount() {
    const carData = this.carData();
    if (carData && carData.bookNowTokenAvailable > 0) {
      const newCount = carData.bookNowTokenAvailable - 1;
      
      // Update the local car data to reflect the decrease
      const updatedCarData = {
        ...carData,
        bookNowTokenAvailable: newCount
      };
      this.carData.set(updatedCarData);
      
      // Update the backend
      this.carService.updateBookNowTokenCount(this.carId(), newCount).subscribe({
        next: (response) => {
        },
        error: (error) => {
          console.error('Error updating car bookNowTokenAvailable count:', error);
          // Revert the local change if backend update fails
          this.carData.set(carData);
        }
      });
    }
  }

  // Info modal methods
  openInfoModal(type: 'book-now' | 'waitlist') {
    this.infoModalType.set(type);
    this.showInfoModal.set(true);
  }

  closeInfoModal() {
    this.showInfoModal.set(false);
    this.infoModalType.set(null);
  }

  getInfoModalTitle(): string {
    const type = this.infoModalType();
    return type === 'book-now' ? 'Book Now Information' : 'Join Waitlist Information';
  }

  getInfoModalPrice(): string {
    const carData = this.carData();
    const type = this.infoModalType();
    
    if (type === 'book-now') {
      return this.getFormattedPrice(carData?.bookNowTokenPrice) || '₹3,999';
    } else {
      return this.getFormattedPrice(carData?.tokenprice) || '₹199';
    }
  }

  getWaitlistPrice(): string {
    const carData = this.carData();
    return this.getFormattedPrice(carData?.tokenprice) || '₹199';
  }

  // Car details modal methods
  openSpecsModal() {
    this.showSpecsModal.set(true);
  }

  closeSpecsModal() {
    this.showSpecsModal.set(false);
  }

  openFeaturesModal() {
    this.showFeaturesModal.set(true);
  }

  closeFeaturesModal() {
    this.showFeaturesModal.set(false);
  }

  openLocationModal() {
    this.showLocationModal.set(true);
  }

  closeLocationModal() {
    this.showLocationModal.set(false);
  }


  // Description toggle methods
  toggleDescription() {
    this.showFullDescription.set(!this.showFullDescription());
  }

  // New modal methods
  openFractionDetailsModal() {
    this.showFractionDetailsModal.set(true);
  }

  closeFractionDetailsModal() {
    this.showFractionDetailsModal.set(false);
  }

  openBookNowModal() {
    this.showBookNowModal.set(true);
  }

  closeBookNowModal() {
    this.showBookNowModal.set(false);
  }

  openWaitlistModal() {
    this.showWaitlistModal.set(true);
  }

  closeWaitlistModal() {
    this.showWaitlistModal.set(false);
  }

  openAMCModal() {
    this.showAMCModal.set(true);
  }

  closeAMCModal() {
    this.showAMCModal.set(false);
  }
}