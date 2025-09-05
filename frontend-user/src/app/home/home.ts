import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild, HostListener, Inject, PLATFORM_ID, OnInit, signal, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomePublicService, HeroContent } from '../services/home-public.service';
import { FaqPublicService, FAQ } from '../services/faq-public.service';
import { CarPublicService } from '../services/car-public.service';
import { AnimationService } from '../services/animation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private observer: IntersectionObserver | null = null;
  private isBrowser = false;
  @ViewChild('carouselTrack', { static: false }) private carouselTrack?: ElementRef<HTMLDivElement>;

  // Dynamic content - converted to signals
  heroContent = signal<HeroContent | null>(null);
  faqs = signal<FAQ[]>([]);
  faqsByCategory = signal<{ [key: string]: FAQ[] }>({});
  activeFaqCategory = signal<string>('Understanding');
  loading = signal<boolean>(true);
  carsLoading = signal<boolean>(true);

  // Dynamic carousel state - converted to signals
  cars = signal<any[]>([]);
  currentIndex = signal<number>(0);
  visibleCount = signal<number>(3);
  
  // Auto-scroll functionality
  private autoScrollInterval: any = null;
  private isAutoScrollPaused = signal<boolean>(false);
  private autoScrollDelay = 3000; // 3 seconds
  
  // Touch/swipe functionality
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private minSwipeDistance = 50;


  constructor(
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private homeService: HomePublicService,
    private faqService: FaqPublicService,
    private carService: CarPublicService,
    private animationService: AnimationService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Effect to handle data loading and ensure proper change detection
    effect(() => {
      if (this.isBrowser) {
        // Trigger change detection when data changes
        setTimeout(() => {
          this.initAngularAnimations();
        }, 100);
      }
    });
  }

  ngOnInit(): void {
    this.loadHeroContent();
    this.loadFAQs();
    this.loadCars();
  }

  loadHeroContent(): void {
    // Ensure hero content starts as null to show skeleton
    this.heroContent.set(null);
    
    this.homeService.getPublicHeroContent().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.heroContent.length > 0) {
          this.heroContent.set(response.body.heroContent[0]); // Use the first hero content
        } else {
          // If no hero content from API, set a default
          this.heroContent.set({
            _id: 'default-hero',
            heroText: 'Own Your Dream Car at Just 8.33% Cost',
            subText: 'India\'s first fractional car ownership platform',
            bgImage: './herocar.jpg',
            createdBy: null,
            createdAt: new Date().toISOString()
          });
        }
      },
      error: (error) => {
        console.error('Error loading hero content:', error);
        // Set default content on error
        this.heroContent.set({
          _id: 'default-hero',
          heroText: 'Own Your Dream Car at Just 8.33% Cost',
          subText: 'India\'s first fractional car ownership platform',
          bgImage: './herocar.jpg',
          createdBy: null,
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  loadFAQs(): void {
    this.faqService.getPublicFaqs().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.faqs.set(response.body.faqs);
          this.groupFAQsByCategory();
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading FAQs:', error);
        this.loading.set(false);
      }
    });
  }

  loadCars(): void {
    this.carService.getPublicCars().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.cars.set(response.body.cars
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
            })));
          this.carsLoading.set(false);
          // Restart auto-scroll after cars are loaded
          setTimeout(() => {
            this.startAutoScroll();
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.carsLoading.set(false);
        // Fallback to static data if API fails (also limited to 9)
        this.cars.set([
          { image: '/car-1.jpg', tokenPrice: '3,735', name: 'Model S', brand: 'Tesla', fuel: 'Electric', seats: 5, color: 'White', ticketsAvailable: 5, totalTickets: 20 },
          { image: '/car-2.jpg', tokenPrice: '2,905', name: 'M4', brand: 'BMW', fuel: 'Petrol', seats: 4, color: 'Black', ticketsAvailable: 3, totalTickets: 20 },
          { image: '/car-3.jpg', tokenPrice: '4,565', name: 'C-Class', brand: 'Mercedes-Benz', fuel: 'Diesel', seats: 5, color: 'Silver', ticketsAvailable: 7, totalTickets: 20 },
          { image: '/car-4.jpg', tokenPrice: '3,200', name: 'Q7', brand: 'Audi', fuel: 'Diesel', seats: 5, color: 'Blue', ticketsAvailable: 4, totalTickets: 20 },
          { image: '/car-5.jpg', tokenPrice: '6,100', name: '911', brand: 'Porsche', fuel: 'Petrol', seats: 2, color: 'Red', ticketsAvailable: 2, totalTickets: 20 }
        ].slice(0, 9)); // Ensure fallback is also limited to 9
        
        // Start auto-scroll for fallback data too
        setTimeout(() => {
          this.startAutoScroll();
        }, 500);
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


  groupFAQsByCategory(): void {
    const faqsByCategory: { [key: string]: FAQ[] } = {};
    this.faqs().forEach(faq => {
      if (!faqsByCategory[faq.category]) {
        faqsByCategory[faq.category] = [];
      }
      faqsByCategory[faq.category].push(faq);
    });
    this.faqsByCategory.set(faqsByCategory);
  }

  showFAQSection(category: string): void {
    this.activeFaqCategory.set(category);
  }

  getFAQsForCategory(category: string): FAQ[] {
    return this.faqsByCategory()[category] || [];
  }

  // Make Object.keys available in template
  Object = Object;

  // Get category icon based on category name
  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Understanding': 'info',
      'Pricing': 'dollar',
      'Delivery': 'calendar',
      'Usage Policy': 'check'
    };
    return iconMap[category] || 'info';
  }

  // Get FAQ icon based on question content
  getFaqIcon(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('what\'s') || lowerQuestion.includes('what is fractional')) {
      return 'question';
    } else if (lowerQuestion.includes('how does') || lowerQuestion.includes('how to') || lowerQuestion.includes('how it works')) {
      return 'lightbulb';
    } else if (lowerQuestion.includes('who') || lowerQuestion.includes('ownership') || lowerQuestion.includes('own')) {
      return 'users';
    } else if (lowerQuestion.includes('car') || lowerQuestion.includes('vehicle') || lowerQuestion.includes('drive')) {
      return 'car';
    } else if (lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('payment') || lowerQuestion.includes('money')) {
      return 'money';
    } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('pickup') || lowerQuestion.includes('location') || lowerQuestion.includes('when')) {
      return 'calendar';
    } else if (lowerQuestion.includes('security') || lowerQuestion.includes('safe') || lowerQuestion.includes('insurance') || lowerQuestion.includes('secure')) {
      return 'shield';
    } else if (lowerQuestion.includes('time') || lowerQuestion.includes('duration') || lowerQuestion.includes('long')) {
      return 'clock';
    } else if (lowerQuestion.includes('policy') || lowerQuestion.includes('rules') || lowerQuestion.includes('usage') || lowerQuestion.includes('terms')) {
      return 'check';
    }
    
    return 'question'; // default icon
  }

  // Get FAQ subtitle based on question content
  getFaqSubtitle(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('what\'s')) {
      return 'Learn about our innovative car ownership model';
    } else if (lowerQuestion.includes('how does') || lowerQuestion.includes('how to')) {
      return 'Understanding the co-ownership process';
    } else if (lowerQuestion.includes('who') || lowerQuestion.includes('ownership')) {
      return 'Legal ownership structure explained';
    } else if (lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('payment')) {
      return 'Transparent pricing and payment options';
    } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('pickup') || lowerQuestion.includes('location')) {
      return 'Convenient pickup and delivery services';
    } else if (lowerQuestion.includes('usage') || lowerQuestion.includes('policy') || lowerQuestion.includes('rules')) {
      return 'Clear guidelines for car usage';
    } else if (lowerQuestion.includes('security') || lowerQuestion.includes('safe') || lowerQuestion.includes('insurance')) {
      return 'Your safety and security matters';
    } else if (lowerQuestion.includes('time') || lowerQuestion.includes('when') || lowerQuestion.includes('duration')) {
      return 'Flexible timing and scheduling options';
    }
    
    return 'Get answers to your questions';
  }

  ngAfterViewInit(): void {
    // Only run browser-specific DOM & window logic in the browser.
    if (!this.isBrowser) return;

    // compute responsive visibleCount initially
    this.updateVisibleCount();

    // Initialize Angular animations
    this.initAngularAnimations();
    
    // Start auto-scroll after a short delay
    setTimeout(() => {
      this.startAutoScroll();
    }, 1000);
  }

  private initAngularAnimations(): void {
    // Initialize animations using the animation service
    this.animationService.initAnimations(this.elRef, this.renderer);
  }

  // Recalculate visible cards on window resize
  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser) return;
    this.updateVisibleCount();
    // clamp currentIndex to valid range after change
    const totalCards = this.cars().length;
    if (totalCards >= 2) {
      const maxIndex = Math.max(0, totalCards - this.visibleCount());
      if (this.currentIndex() > maxIndex) this.currentIndex.set(maxIndex);
    } else {
      this.currentIndex.set(0);
    }
  }

  private updateVisibleCount() {
  if (!this.isBrowser) return;
  const w = window.innerWidth;
  if (w >= 1200) this.visibleCount.set(3);
  else if (w >= 768) this.visibleCount.set(2);
  else this.visibleCount.set(1);
  }

  prev() {
    const totalCards = this.cars().length;
    if (totalCards < 2) return;
    
    const maxIndex = Math.max(0, totalCards - this.visibleCount());
    const prevIndex = this.currentIndex() - 1;
    
    // If we're at the beginning, loop to the end
    if (prevIndex < 0) {
      this.currentIndex.set(maxIndex);
    } else {
      this.currentIndex.set(prevIndex);
    }
  }

  next() {
    const totalCards = this.cars().length;
    if (totalCards < 2) return;
    
    const maxIndex = Math.max(0, totalCards - this.visibleCount());
    const nextIndex = this.currentIndex() + 1;
    
    // If we've reached the end, loop back to the beginning
    if (nextIndex > maxIndex) {
      this.currentIndex.set(0);
    } else {
      this.currentIndex.set(nextIndex);
    }
  }

  navigateToCarDetails(carId: string) {
    this.router.navigate(['/car-details', carId]);
  }

  navigateToCars() {
    this.router.navigate(['/cars']);
  }

  navigateToCarsWithBrand(brandName: string) {
    this.router.navigate(['/cars'], {
      queryParams: {
        brand: brandName
      }
    });
  }

  // Auto-scroll functionality
  private startAutoScroll(): void {
    if (!this.isBrowser || this.cars().length < 2) return;
    
    this.stopAutoScroll(); // Clear any existing interval
    
    this.autoScrollInterval = setInterval(() => {
      if (!this.isAutoScrollPaused() && this.cars().length >= 2) {
        this.next();
      }
    }, this.autoScrollDelay);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  pauseAutoScroll(): void {
    this.isAutoScrollPaused.set(true);
  }

  resumeAutoScroll(): void {
    this.isAutoScrollPaused.set(false);
  }

  // Touch/swipe functionality
  onTouchStart(event: TouchEvent): void {
    if (!this.isBrowser) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.pauseAutoScroll();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isBrowser) return;
    
    // Prevent default scrolling behavior
    event.preventDefault();
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isBrowser) return;
    
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    
    this.handleSwipe();
    this.resumeAutoScroll();
  }

  private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        this.prev();
      } else {
        // Swipe left - go to next
        this.next();
      }
    }
  }

  // Get color code for color display
  getColorCode(colorName: string): string {
    if (!colorName) return '#6b7280'; // Default gray
    
    const colorMap: { [key: string]: string } = {
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#10b981',
      'yellow': '#f59e0b',
      'orange': '#f97316',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'black': '#000000',
      'white': '#ffffff',
      'gray': '#6b7280',
      'grey': '#6b7280',
      'silver': '#c0c0c0',
      'gold': '#fbbf24',
      'brown': '#a3a3a3',
      'navy': '#1e40af',
      'maroon': '#7c2d12',
      'beige': '#f5f5dc',
      'cream': '#f5f5dc'
    };
    
    return colorMap[colorName.toLowerCase()] || '#6b7280';
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Clean up auto-scroll interval
    this.stopAutoScroll();
  }

}


