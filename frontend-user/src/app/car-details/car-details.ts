import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, signal, computed, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CarPublicService } from '../services/car-public.service';
import { PaymentService, PaymentOrder, PaymentVerification } from '../services/payment.service';
import { TokenService } from '../services/token.service';
import { BookNowTokenService } from '../services/book-now-token.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car-details.html',
  styleUrl: './car-details.css'
})
export class CarDetails implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private carService: CarPublicService,
    private paymentService: PaymentService,
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private authService: AuthService
  ) {
    // Effect to reinitialize AOS when car data changes
    effect(() => {
      const carData = this.carData();
      const isLoading = this.loading();
      
      if (!isLoading && carData && isPlatformBrowser(this.platformId)) {
        // Delay AOS refresh to ensure DOM is updated
        setTimeout(() => {
          if (typeof (window as any).AOS !== 'undefined') {
            (window as any).AOS.refresh();
          }
        }, 200);
        
        // Also refresh after a longer delay to catch any late DOM updates
        setTimeout(() => {
          if (typeof (window as any).AOS !== 'undefined') {
            (window as any).AOS.refresh();
          }
        }, 1000);
      }
    });
  }

  // Car data properties - converted to signals
  protected carId = signal<string>('');
  protected carData = signal<any>(null);
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);

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
    
    // Load car data
    this.loadCarData();

    // Load Razorpay key
    this.loadRazorpayKey();
    
    // Check user's purchase status for this car
    this.checkUserPurchaseStatus();

    // Initialize AOS if available
    if (isPlatformBrowser(this.platformId) && typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 800,
        easing: 'slide',
        offset: 100,
        delay: 0
      });
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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCarousel();
      this.initializeBookingCalendar();
    }
  }

  ngOnDestroy() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
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
      
      // Auto-advance carousel every 5 seconds
      this.carouselInterval = setInterval(() => {
        this.moveCarousel(1);
      }, 5000);
    }
  }

  updateCarousel() {
    const carouselContainer = document.querySelector('.carousel-container') as HTMLElement;
    const indicators = document.querySelectorAll('.bottom-4 button') as NodeListOf<HTMLElement>;
    
    if (carouselContainer) {
      carouselContainer.style.transform = `translateX(-${this.currentSlide() * 100}%)`;
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

  getAMCPerYear(): string {
    const carData = this.carData();
    if (carData?.amcperticket) {
      const amcPerTicket = parseFloat(carData.amcperticket.replace(/[₹,\s]/g, ''));
      const amcPerYear = amcPerTicket / 2; // Assuming AMC per ticket is for 2 years, so divide by 2 for per year
      return `₹${amcPerYear.toFixed(0)}`;
    }
    return '₹27,500'; // Default fallback
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

  checkUserPurchaseStatus() {
    const userData = this.authService.getUserData();
    if (!userData || !userData._id) {
      this.checkingPurchaseStatus.set(false);
      return;
    }

    // Check for existing Book Now Token
    this.bookNowTokenService.getUserBookNowTokens().subscribe({
      next: (response) => {
        if (response.body?.bookNowTokens) {
          const hasBookNow = response.body.bookNowTokens.some((token: any) => 
            token.carid?._id === this.carId() || token.carid === this.carId()
          );
          this.hasBookNowToken.set(hasBookNow);
        }
      },
      error: (error) => {
        console.error('Error checking Book Now Token status:', error);
      }
    });

    // Check for existing Waitlist Token
    this.tokenService.getUserTokens().subscribe({
      next: (response) => {
        if (response.body?.tokens) {
          const hasWaitlist = response.body.tokens.some((token: any) => 
            token.carid?._id === this.carId() || token.carid === this.carId()
          );
          this.hasWaitlistToken.set(hasWaitlist);
        }
        this.checkingPurchaseStatus.set(false);
      },
      error: (error) => {
        console.error('Error checking Waitlist Token status:', error);
        this.checkingPurchaseStatus.set(false);
      }
    });
  }

  initiatePayment(type: 'book-now' | 'waitlist') {
    if (!this.razorpayKey()) {
      this.paymentError.set('Payment system not ready. Please refresh the page.');
      return;
    }

    // Check if user already has this token type
    if (type === 'book-now' && this.hasBookNowToken()) {
      this.paymentError.set('You have already purchased a Book Now token for this car.');
      return;
    }

    if (type === 'waitlist' && this.hasWaitlistToken()) {
      this.paymentError.set('You have already joined the waitlist for this car.');
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
        name: 'User',
        email: 'user@example.com',
        contact: '9999999999'
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
        status: 'active'
      };

      this.bookNowTokenService.createBookNowToken(bookNowTokenData).subscribe({
        next: (response) => {
          // Update the car's bookNowTokenAvailable count
          this.updateCarBookNowTokenCount();
          
          // Update purchase status
          this.hasBookNowToken.set(true);
          
          this.isPaymentLoading.set(false);
          this.recordCreated.set(true);
          this.recordId.set(response.body?.bookNowToken?._id || 'N/A');
          this.showPaymentModal.set(true);
          this.paymentError.set(null);
          console.log('Book Now Token created successfully:', response);
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
        status: 'active'
      };

      this.tokenService.createToken(tokenData).subscribe({
        next: (response) => {
          // Update purchase status
          this.hasWaitlistToken.set(true);
          
          this.isPaymentLoading.set(false);
          this.recordCreated.set(true);
          this.recordId.set(response.body?.token?._id || 'N/A');
          this.showPaymentModal.set(true);
          this.paymentError.set(null);
          console.log('Waitlist Token created successfully:', response);
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
          console.log('Car bookNowTokenAvailable count updated successfully:', response);
        },
        error: (error) => {
          console.error('Error updating car bookNowTokenAvailable count:', error);
          // Revert the local change if backend update fails
          this.carData.set(carData);
        }
      });
    }
  }
}