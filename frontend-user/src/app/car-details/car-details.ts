import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CarPublicService } from '../services/car-public.service';

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
    private carService: CarPublicService
  ) {}
  // Car data properties
  carId: string = '';
  carData: any = null;
  loading = true;
  error: string | null = null;

  // Carousel properties
  currentSlide = 0;
  totalSlides = 4;
  carouselInterval: any;

  // Mobile menu properties
  isMobileMenuOpen = false;

  // Calendar properties
  viewDate = new Date();
  bookedRanges = [
    ['2024-12-24','2024-12-26'],
    ['2025-01-05','2025-01-10'],
    ['2025-02-14','2025-02-14']
  ];

  ngOnInit() {
    // Get car ID from route parameters
    this.carId = this.route.snapshot.paramMap.get('id') || '';
    
    // Load car data
    this.loadCarData();

    // Initialize AOS if available
    if (isPlatformBrowser(this.platformId) && typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 800,
        easing: 'slide'
      });
    }
  }

  loadCarData() {
    if (!this.carId) {
      this.error = 'Car ID not found';
      this.loading = false;
      return;
    }

    this.carService.getPublicCarById(this.carId).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.carData = response.body.car;
          this.totalSlides = this.carData.images?.length || 1;
          this.loading = false;
        } else {
          this.error = response.message || 'Failed to load car data';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading car data:', error);
        this.error = 'Failed to load car data';
        this.loading = false;
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
    this.isMobileMenuOpen = true;
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
    this.isMobileMenuOpen = false;
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
      carouselContainer.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }
    
    // Update indicators
    indicators?.forEach((indicator, index) => {
      if (index === this.currentSlide) {
        indicator.classList.remove('opacity-60');
      } else {
        indicator.classList.add('opacity-60');
      }
    });
  }

  moveCarousel(direction: number) {
    this.currentSlide = (this.currentSlide + direction + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }

  goToSlide(index: number) {
    this.currentSlide = index;
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
    return this.bookedRanges.some(r => {
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
    monthLabel.textContent = this.viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const controls = document.createElement('div');
    controls.className = 'flex gap-2';
    const prev = document.createElement('button');
    prev.textContent = '◀';
    prev.className = 'px-2 py-1 rounded bg-gray-700 hover:bg-gray-600';
    const next = document.createElement('button');
    next.textContent = '▶';
    next.className = 'px-2 py-1 rounded bg-gray-700 hover:bg-gray-600';
    
    prev.addEventListener('click', () => {
      this.viewDate.setMonth(this.viewDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    next.addEventListener('click', () => {
      this.viewDate.setMonth(this.viewDate.getMonth() + 1);
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

    const first = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
    const last = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0);
    const startIndex = first.getDay();

    // empty slots
    for (let i = 0; i < startIndex; i++) {
      const empty = document.createElement('div');
      empty.innerHTML = '&nbsp;';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), d);
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
    this.viewDate = d;
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
    if (this.carData?.fractionprice) {
      return this.getFormattedPrice(this.carData.fractionprice);
    }
    
    // Calculate fraction price if not provided
    if (this.carData?.price && this.carData?.totaltickets) {
      const priceNum = parseFloat(this.carData.price.replace(/[₹,\s]/g, ''));
      const fractionPrice = priceNum / this.carData.totaltickets;
      return `₹${fractionPrice.toFixed(2)}`;
    }
    
    return 'N/A';
  }

  hasMultipleImages(): boolean {
    return this.carData?.images && this.carData.images.length > 1;
  }

  getAMCPerYear(): string {
    if (this.carData?.amcperticket) {
      const amcPerTicket = parseFloat(this.carData.amcperticket.replace(/[₹,\s]/g, ''));
      const amcPerYear = amcPerTicket / 2; // Assuming AMC per ticket is for 2 years, so divide by 2 for per year
      return `₹${amcPerYear.toFixed(0)}`;
    }
    return '₹27,500'; // Default fallback
  }
}