import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild, HostListener, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomePublicService, HeroContent } from '../services/home-public.service';
import { FaqPublicService, FAQ } from '../services/faq-public.service';
import { CarPublicService } from '../services/car-public.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer: IntersectionObserver | null = null;
  private isBrowser = false;
  @ViewChild('carouselTrack', { static: false }) private carouselTrack?: ElementRef<HTMLDivElement>;

  // Dynamic content
  heroContent: HeroContent | null = null;
  faqs: FAQ[] = [];
  faqsByCategory: { [key: string]: FAQ[] } = {};
  activeFaqCategory = 'Understanding';
  loading = true;
  carsLoading = true;

  // Dynamic carousel state
  cars: any[] = [];
  currentIndex = 0;
  visibleCount = 3;

  // Search functionality
  showSearchBar = false;
  searchQuery = '';
  searchPlaceholder = 'Enter location or pincode...';

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private homeService: HomePublicService,
    private faqService: FaqPublicService,
    private carService: CarPublicService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadHeroContent();
    this.loadFAQs();
    this.loadCars();
  }

  loadHeroContent(): void {
    this.homeService.getPublicHeroContent().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.heroContent.length > 0) {
          this.heroContent = response.body.heroContent[0]; // Use the first hero content
        }
      },
      error: (error) => {
        console.error('Error loading hero content:', error);
      }
    });
  }

  loadFAQs(): void {
    this.faqService.getPublicFaqs().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.faqs = response.body.faqs;
          this.groupFAQsByCategory();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading FAQs:', error);
        this.loading = false;
      }
    });
  }

  loadCars(): void {
    this.carService.getPublicCars().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.cars = response.body.cars
            .slice(0, 9) // Limit to 9 cars maximum
            .map((car: any) => ({
              id: car._id,
              image: car.images && car.images.length > 0 ? car.images[0] : '/car-1.jpg',
              tokenPrice: car.tokenprice ? car.tokenprice.toLocaleString() : '0',
              name: car.carname || 'Unknown',
              brand: car.brandname || 'Unknown',
              fuel: this.getFuelType(car.milege),
              seats: car.seating || 5,
              color: car.color || 'Unknown',
              ticketsAvailable: car.ticketsavilble || 0,
              totalTickets: car.totaltickets || 0,
              location: car.location || 'Unknown',
              description: car.description || ''
            }));
          this.carsLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.carsLoading = false;
        // Fallback to static data if API fails (also limited to 9)
        this.cars = [
          { image: '/car-1.jpg', tokenPrice: '3,735', name: 'Model S', brand: 'Tesla', fuel: 'Electric', seats: 5, color: 'White', ticketsAvailable: 5, totalTickets: 20 },
          { image: '/car-2.jpg', tokenPrice: '2,905', name: 'M4', brand: 'BMW', fuel: 'Petrol', seats: 4, color: 'Black', ticketsAvailable: 3, totalTickets: 20 },
          { image: '/car-3.jpg', tokenPrice: '4,565', name: 'C-Class', brand: 'Mercedes-Benz', fuel: 'Diesel', seats: 5, color: 'Silver', ticketsAvailable: 7, totalTickets: 20 },
          { image: '/car-4.jpg', tokenPrice: '3,200', name: 'Q7', brand: 'Audi', fuel: 'Diesel', seats: 5, color: 'Blue', ticketsAvailable: 4, totalTickets: 20 },
          { image: '/car-5.jpg', tokenPrice: '6,100', name: '911', brand: 'Porsche', fuel: 'Petrol', seats: 2, color: 'Red', ticketsAvailable: 2, totalTickets: 20 }
        ].slice(0, 9); // Ensure fallback is also limited to 9
      }
    });
  }

  private getFuelType(milege: string): string {
    if (!milege) return 'Petrol';
    const mileage = milege.toLowerCase();
    if (mileage.includes('electric') || mileage.includes('ev')) return 'Electric';
    if (mileage.includes('diesel')) return 'Diesel';
    if (mileage.includes('hybrid')) return 'Hybrid';
    return 'Petrol';
  }

  // Search functionality methods
  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
    if (this.showSearchBar) {
      // Focus on search input after animation
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    } else {
      this.searchQuery = '';
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      const searchTerm = this.searchQuery.trim();
      const searchType = this.isPincode(searchTerm) ? 'pincode' : 'location';
      
      try {
        // Try Angular routing first
        this.router.navigate(['/cars'], { 
          queryParams: { 
            search: searchTerm,
            type: searchType
          } 
        });
      } catch (error) {
        // Fallback to direct navigation if routing fails
        console.log('Router navigation failed, using direct navigation');
        const searchParams = new URLSearchParams({
          search: searchTerm,
          type: searchType
        });
        window.location.href = `cars.html?${searchParams.toString()}`;
      }
    }
  }

  private isPincode(query: string): boolean {
    // Check if the query is a 6-digit pincode
    return /^\d{6}$/.test(query);
  }

  onSearchInputChange(): void {
    // Update placeholder based on input
    if (this.isPincode(this.searchQuery)) {
      this.searchPlaceholder = 'Searching by pincode...';
    } else {
      this.searchPlaceholder = 'Searching by location...';
    }
  }

  groupFAQsByCategory(): void {
    this.faqsByCategory = {};
    this.faqs.forEach(faq => {
      if (!this.faqsByCategory[faq.category]) {
        this.faqsByCategory[faq.category] = [];
      }
      this.faqsByCategory[faq.category].push(faq);
    });
  }

  showFAQSection(category: string): void {
    this.activeFaqCategory = category;
  }

  getFAQsForCategory(category: string): FAQ[] {
    return this.faqsByCategory[category] || [];
  }

  // Make Object.keys available in template
  Object = Object;

  ngAfterViewInit(): void {
    // Only run browser-specific DOM & window logic in the browser.
    if (!this.isBrowser) return;

    // compute responsive visibleCount initially
    this.updateVisibleCount();

    // Ensure all content is visible by default
    this.ensureContentVisibility();

    // Initialize AOS library if available
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
      });
    } else {
      // Fallback: Custom animation implementation
      this.initCustomAnimations();
    }
  }

  private ensureContentVisibility(): void {
    // Ensure all elements with data-aos are visible by default
    const els: NodeListOf<HTMLElement> = this.elRef.nativeElement.querySelectorAll('[data-aos]');
    els.forEach((el) => {
      // Remove any initial hidden state
      this.renderer.removeClass(el, 'aos-init');
      this.renderer.setStyle(el, 'opacity', '1');
      this.renderer.setStyle(el, 'transform', 'none');
    });
  }

  private initCustomAnimations(): void {
    // Select elements that used AOS attributes in the template.
    const els: NodeListOf<HTMLElement> = this.elRef.nativeElement.querySelectorAll('[data-aos]');

    if (!els || els.length === 0) return;

    // Set initial inline styles based on AOS type so the element is ready to animate.
    els.forEach((el) => {
      const type = (el.getAttribute('data-aos') || '').trim();
      const delayAttr = el.getAttribute('data-aos-delay');
      const delay = delayAttr ? parseInt(delayAttr, 10) : 0;

      // base: mark element as initialized for CSS-driven animation
      this.renderer.addClass(el, 'aos-init');
      // set optional delay as a CSS variable used in CSS .aos-animate rule
      if (delay) this.renderer.setStyle(el, '--aos-delay', `${delay}ms`);
    });

    // IntersectionObserver to play animation when element enters viewport.
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          // trigger CSS-driven animation
          this.renderer.addClass(target, 'aos-animate');
          // mark as animated to avoid re-triggering if desired
          this.renderer.addClass(target, 'aos-animated');
          // Once animated, unobserve to keep it simple (one-time animations)
          if (this.observer) this.observer.unobserve(target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.12 });

    els.forEach((el) => this.observer?.observe(el));
  }

  // Recalculate visible cards on window resize
  @HostListener('window:resize')
  onResize() {
  if (!this.isBrowser) return;
  this.updateVisibleCount();
    // clamp currentIndex to valid range after change
    const maxIndex = Math.max(0, this.cars.length - this.visibleCount);
    if (this.currentIndex > maxIndex) this.currentIndex = maxIndex;
  }

  private updateVisibleCount() {
  if (!this.isBrowser) return;
  const w = window.innerWidth;
  if (w >= 1200) this.visibleCount = 3;
  else if (w >= 768) this.visibleCount = 2;
  else this.visibleCount = 1;
  }

  prev() {
    this.currentIndex = Math.max(0, this.currentIndex - 1);
  }

  next() {
    const maxIndex = Math.max(0, this.cars.length - this.visibleCount);
    this.currentIndex = Math.min(maxIndex, this.currentIndex + 1);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

}


