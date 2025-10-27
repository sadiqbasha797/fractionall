import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild, HostListener, Inject, PLATFORM_ID, OnInit, signal, effect, DestroyRef, inject, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomePublicService, HeroContent, SimpleStep, FeaturedCar, Brand, SimpleStepsVideo } from '../services/home-public.service';
import { FaqPublicService, FAQ, FAQCategory } from '../services/faq-public.service';
import { CarPublicService } from '../services/car-public.service';
import { AnimationService } from '../services/animation.service';
import { ScrollNavigationService } from '../services/scroll-navigation.service';

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
  private destroyRef = inject(DestroyRef);
  @ViewChild('carouselTrack', { static: false }) private carouselTrack?: ElementRef<HTMLDivElement>;
  @ViewChild('timelineRef', { static: false }) private timelineRef?: ElementRef<HTMLDivElement>;

  // Dynamic content - converted to signals
  heroContent = signal<HeroContent | null>(null);
  faqs = signal<FAQ[]>([]);
  faqCategories = signal<FAQCategory[]>([]);
  faqsByCategory = signal<{ [key: string]: FAQ[] }>({});
  activeFaqCategory = signal<string>('');
  loading = signal<boolean>(true);
  carsLoading = signal<boolean>(true);
  simpleSteps = signal<SimpleStep[]>([]);
  simpleStepsLoading = signal<boolean>(true);
  simpleStepsVideos = signal<SimpleStepsVideo[]>([]);
  simpleStepsVideosLoading = signal<boolean>(true);
  brands = signal<Brand[]>([]);
  brandsLoading = signal<boolean>(true);
  
  // Brands view more functionality
  visibleBrands = computed(() => this.brands().slice(0, 5));
  remainingBrands = computed(() => this.brands().slice(5));
  showBrandsModal = signal<boolean>(false);
  
  // Simple steps expand/collapse state
  isSimpleStepsExpanded = signal<boolean>(false);

  // Dynamic carousel state - converted to signals
  cars = signal<any[]>([]);
  featuredCars = signal<FeaturedCar[]>([]);
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
    private router: Router,
    private sanitizer: DomSanitizer,
    private scrollNavigationService: ScrollNavigationService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Effect to handle data loading and ensure proper change detection
    // Use DestroyRef to properly manage effect lifecycle
    const effectRef = effect(() => {
      if (this.isBrowser) {
        // Trigger change detection when data changes
        setTimeout(() => {
          this.initAngularAnimations();
        }, 100);
      }
    });
    
    // Register effect cleanup with component destruction
    this.destroyRef.onDestroy(() => {
      effectRef.destroy();
    });
  }

  // Method to sanitize URLs for iframe src
  sanitizeUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    let processedUrl = url;
    
    // Handle YouTube URLs to ensure proper controls and no autoplay
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract video ID and create a proper embed URL
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('/embed/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        // Create proper YouTube embed URL with controls and no autoplay
        processedUrl = `https://www.youtube.com/embed/${videoId}?controls=1&autoplay=0&rel=0&modestbranding=1&playsinline=1`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
  }

  // Method to get YouTube thumbnail URL with fallback
  getYouTubeThumbnail(videoUrl: string): string {
    if (!videoUrl) return '';
    
    // Extract video ID for thumbnail
    let videoId = '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('/embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      // Try high quality first, fallback to medium quality if not available
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    return '';
  }

  // Method to handle thumbnail load error and try fallback
  onThumbnailError(event: any, videoUrl: string): void {
    const img = event.target as HTMLImageElement;
    const videoId = this.extractVideoId(videoUrl);
    
    if (videoId) {
      // Try different thumbnail qualities as fallback
      const fallbackUrls = [
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, // Medium quality
        `https://img.youtube.com/vi/${videoId}/default.jpg`,   // Default quality
        `https://img.youtube.com/vi/${videoId}/0.jpg`         // First frame
      ];
      
      let currentIndex = 0;
      const tryNextFallback = () => {
        if (currentIndex < fallbackUrls.length) {
          img.src = fallbackUrls[currentIndex];
          currentIndex++;
        } else {
          // If all fallbacks fail, show a placeholder
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNDAgODBMMTYwIDEwMEwxNDAgMTIwTDEyMCAxMDBMMTQwIDgwWiIgZmlsbD0iI0VGNjY2NiIvPgo8L3N2Zz4K';
        }
      };
      
      img.onerror = tryNextFallback;
    }
  }

  // Helper method to extract video ID
  private extractVideoId(videoUrl: string): string {
    if (!videoUrl) return '';
    
    if (videoUrl.includes('youtube.com/watch?v=')) {
      return videoUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (videoUrl.includes('youtu.be/')) {
      return videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (videoUrl.includes('youtube.com/embed/')) {
      return videoUrl.split('/embed/')[1]?.split('?')[0] || '';
    }
    
    return '';
  }

  // Method to redirect to YouTube video
  redirectToYouTube(videoUrl: string): void {
    if (!videoUrl) return;
    
    // Convert embed URL to watch URL if needed
    let watchUrl = videoUrl;
    
    if (videoUrl.includes('youtube.com/embed/')) {
      const videoId = videoUrl.split('/embed/')[1]?.split('?')[0];
      if (videoId) {
        watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    
    // Open YouTube video in new tab
    if (this.isBrowser) {
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    }
  }

  ngOnInit(): void {
    this.loadHeroContent();
    this.loadFAQs();
    this.loadSimpleSteps();
    this.loadSimpleStepsVideos();
    this.loadFeaturedCars();
    this.loadBrands();
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
    // Load FAQs and categories in parallel
    Promise.all([
      this.faqService.getPublicFaqs().toPromise(),
      this.faqService.getActiveFaqCategories().toPromise()
    ]).then(([faqResponse, categoryResponse]) => {
      // Handle FAQs
      if (faqResponse?.status === 'success') {
        this.faqs.set(faqResponse.body.faqs);
        this.groupFAQsByCategory();
      }

      // Handle Categories
      if (categoryResponse?.status === 'success') {
        this.faqCategories.set(categoryResponse.body.categories);
        
        // Set the first active category as default if no active category is set
        if (!this.activeFaqCategory()) {
          const firstActiveCategory = categoryResponse.body.categories.find(cat => cat.isActive);
          if (firstActiveCategory) {
            this.activeFaqCategory.set(firstActiveCategory.name);
          }
        }
      }

      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading FAQs and categories:', error);
      this.loading.set(false);
    });
  }

  loadSimpleSteps(): void {
    this.simpleStepsLoading.set(true);
    this.homeService.getPublicSimpleSteps().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.simpleSteps.set(response.body.simpleSteps);
        } else {
          // Set default steps if no data from API
          this.simpleSteps.set([
            {
              _id: 'default-1',
              stepTitle: 'Find Your Dream Car',
              stepName: 'Browse our curated fleet of luxury sedans, sports cars, SUVs, and exotic supercars. Each listing comes with complete car specifications, transparent pricing, token plans, and availability calendars, ensuring clarity before you book your car.',
              createdBy: null,
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-2', 
              stepTitle: 'Purchase Your Share',
              stepName: 'Buy your share through secure payment options. Each car is divided into 12 equal shares, making luxury car ownership accessible and affordable.',
              createdBy: null,
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-3',
              stepTitle: 'Book & Drive',
              stepName: 'Schedule your driving days through our easy-to-use app. Enjoy hassle-free pickup, maintenance-free driving, and premium car experience.',
              createdBy: null,
              createdAt: new Date().toISOString()
            }
          ]);
        }
        this.simpleStepsLoading.set(false);
        setTimeout(() => this.updateTimelineHeight(), 0);
      },
      error: (error) => {
        console.error('Error loading simple steps:', error);
        // Set default steps on error
        this.simpleSteps.set([
          {
            _id: 'default-1',
            stepTitle: 'Find Your Dream Car',
            stepName: 'Browse our curated fleet of luxury sedans, sports cars, SUVs, and exotic supercars. Each listing comes with complete car specifications, transparent pricing, token plans, and availability calendars, ensuring clarity before you book your car.',
            createdBy: null,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-2',
            stepTitle: 'Purchase Your Share', 
            stepName: 'Buy your share through secure payment options. Each car is divided into 12 equal shares, making luxury car ownership accessible and affordable.',
            createdBy: null,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-3',
            stepTitle: 'Book & Drive',
            stepName: 'Schedule your driving days through our easy-to-use app. Enjoy hassle-free pickup, maintenance-free driving, and premium car experience.',
            createdBy: null,
            createdAt: new Date().toISOString()
          }
        ]);
        this.simpleStepsLoading.set(false);
        setTimeout(() => this.updateTimelineHeight(), 0);
      }
    });
  }

  loadSimpleStepsVideos(): void {
    this.simpleStepsVideosLoading.set(true);
    this.homeService.getPublicSimpleStepsVideos().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.simpleStepsVideos.set(response.body.simpleStepsVideos);
        }
        this.simpleStepsVideosLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading simple steps videos:', error);
        this.simpleStepsVideosLoading.set(false);
      }
    });
  }

  loadBrands(): void {
    this.brandsLoading.set(true);
    this.homeService.getPublicBrands().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.brands.set(response.body.brands);
        } else {
          // Set default brands if no data from API
          this.brands.set([
            {
              _id: 'default-1',
              brandName: 'Mercedes-Benz',
              brandLogo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
              subText: 'Luxury Cars',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-2',
              brandName: 'BMW',
              brandLogo: 'https://www.carlogos.org/car-logos/bmw-logo.png',
              subText: 'Performance Luxury',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-3',
              brandName: 'Audi',
              brandLogo: 'https://www.carlogos.org/car-logos/audi-logo.png',
              subText: 'Premium Cars',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-4',
              brandName: 'Tesla',
              brandLogo: 'https://www.carlogos.org/car-logos/tesla-logo.png',
              subText: 'Electric Vehicles',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-5',
              brandName: 'Porsche',
              brandLogo: 'https://www.carlogos.org/car-logos/porsche-logo.png',
              subText: 'Sports Cars',
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-6',
              brandName: 'Lexus',
              brandLogo: 'https://www.carlogos.org/car-logos/lexus-logo.png',
              subText: 'Premium Luxury',
              createdAt: new Date().toISOString()
            }
          ]);
        }
        this.brandsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        // Set default brands on error
        this.brands.set([
          {
            _id: 'default-1',
            brandName: 'Mercedes-Benz',
            brandLogo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
            subText: 'Luxury Cars',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-2',
            brandName: 'BMW',
            brandLogo: 'https://www.carlogos.org/car-logos/bmw-logo.png',
            subText: 'Performance Luxury',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-3',
            brandName: 'Audi',
            brandLogo: 'https://www.carlogos.org/car-logos/audi-logo.png',
            subText: 'Premium Cars',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-4',
            brandName: 'Tesla',
            brandLogo: 'https://www.carlogos.org/car-logos/tesla-logo.png',
            subText: 'Electric Vehicles',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-5',
            brandName: 'Porsche',
            brandLogo: 'https://www.carlogos.org/car-logos/porsche-logo.png',
            subText: 'Sports Cars',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-6',
            brandName: 'Lexus',
            brandLogo: 'https://www.carlogos.org/car-logos/lexus-logo.png',
            subText: 'Premium Luxury',
            createdAt: new Date().toISOString()
          }
        ]);
        this.brandsLoading.set(false);
      }
    });
  }

  loadFeaturedCars(): void {
    this.homeService.getPublicFeaturedCars().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.featuredCars) {
          // Transform featured cars data to match the carousel format
          const transformedCars = response.body.featuredCars
            .filter((featuredCar: FeaturedCar) => featuredCar && featuredCar.carId && featuredCar.carId._id) // Filter out null/undefined items
            .map((featuredCar: FeaturedCar) => ({
              id: featuredCar.carId._id,
              image: featuredCar.carId.images && featuredCar.carId.images.length > 0 ? featuredCar.carId.images[0] : '/car-1.jpg',
              tokenPrice: featuredCar.carId.tokenprice ? Math.abs(featuredCar.carId.tokenprice).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0',
              name: featuredCar.carId.carname || 'Unknown',
              brand: featuredCar.carId.brandname || 'Unknown',
              fuel: this.getFuelType(featuredCar.carId.milege || ''),
              seats: featuredCar.carId.seats || 5,
              color: featuredCar.carId.color || 'Unknown',
              ticketsAvailable: featuredCar.carId.ticketsavilble || 0,
              totalTickets: featuredCar.carId.totaltickets || 0,
              location: featuredCar.carId.location || 'Unknown',
              description: featuredCar.carId.description || '',
              tokensAvailable: featuredCar.carId.tokensavailble || 0,
              bookNowTokenAvailable: featuredCar.carId.bookNowTokenAvailable || 0,
              bookNowTokenPrice: featuredCar.carId.bookNowTokenPrice || 0,
            price: featuredCar.carId.price || 0,
            fractionPrice: featuredCar.carId.fractionprice || 0,
            isFeatured: true
          }));
          
          this.cars.set(transformedCars);
          this.featuredCars.set(response.body.featuredCars);
          this.carsLoading.set(false);
          
          // Restart auto-scroll after cars are loaded
          setTimeout(() => {
            this.startAutoScroll();
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error loading featured cars:', error);
        this.carsLoading.set(false);
        
        // Fallback to regular cars if featured cars API fails
        this.carService.getPublicCars().subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.cars.set(response.body.cars
                .slice(0, 9)
                .map((car: any) => ({
                  id: car._id,
                  image: car.images && car.images.length > 0 ? car.images[0] : '/car-1.jpg',
                  tokenPrice: car.tokenprice ? Math.abs(car.tokenprice).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0',
                  name: car.carname || 'Unknown',
                  brand: car.brandname || 'Unknown',
                  fuel: this.getFuelType(car.milege || ''),
                  seats: car.seating || 5,
                  color: car.color || 'Unknown',
                  ticketsAvailable: car.ticketsavilble || 0,
                  totalTickets: car.totaltickets || 0,
                  location: car.location || 'Unknown',
                  description: car.description || '',
                  tokensAvailable: car.tokensavailble || 0,
                  bookNowTokenAvailable: car.bookNowTokenAvailable || 0,
                  bookNowTokenPrice: car.bookNowTokenPrice || 0,
                  price: car.price || 0,
                  fractionPrice: car.fractionprice || 0,
                  isFeatured: false
                })));
              
              setTimeout(() => {
                this.startAutoScroll();
              }, 500);
            }
          },
          error: (fallbackError) => {
            console.error('Error loading fallback cars:', fallbackError);
            // Final fallback to static data
            this.cars.set([
              { image: '/car-1.jpg', tokenPrice: '3,735', name: 'Model S', brand: 'Tesla', fuel: 'Electric', seats: 5, color: 'White', ticketsAvailable: 5, totalTickets: 20, isFeatured: false },
              { image: '/car-2.jpg', tokenPrice: '2,905', name: 'M4', brand: 'BMW', fuel: 'Petrol', seats: 4, color: 'Black', ticketsAvailable: 3, totalTickets: 20, isFeatured: false },
              { image: '/car-3.jpg', tokenPrice: '4,565', name: 'C-Class', brand: 'Mercedes-Benz', fuel: 'Diesel', seats: 5, color: 'Silver', ticketsAvailable: 7, totalTickets: 20, isFeatured: false }
            ]);
            
            setTimeout(() => {
              this.startAutoScroll();
            }, 500);
          }
        });
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

  // Get category icon - now returns the same icon for all categories
  getCategoryIcon(category: string): string {
    return 'info'; // Always return info icon for all categories
  }

  // Get FAQ icon - now always returns question mark for consistency
  getFaqIcon(question: string): string {
    return 'question'; // Always return question mark icon for all FAQs
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
    
    // Register scroll sections for navigation highlighting
    this.registerScrollSections();
    
    // Start auto-scroll after a short delay
    setTimeout(() => {
      this.startAutoScroll();
    }, 1000);

    // Compute initial timeline line height with longer delay to ensure DOM is ready
    setTimeout(() => this.updateTimelineHeight(), 200);
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

    // Update timeline height on resize
    this.updateTimelineHeight();
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

  // Show pricing information tooltip
  showPricingInfo(event: Event): void {
    event.stopPropagation();
    // The tooltip is handled by CSS hover states, this method can be used for additional functionality if needed
  }

  // Toggle simple steps expand/collapse
  protected toggleSimpleSteps(): void {
    this.isSimpleStepsExpanded.set(!this.isSimpleStepsExpanded());
    // Recalculate timeline height after expand/collapse with longer delay for DOM updates
    setTimeout(() => this.updateTimelineHeight(), 100);
  }

  // Get first 5 steps (always visible)
  protected getVisibleSteps(): SimpleStep[] {
    return this.simpleSteps().slice(0, 5);
  }

  // Get expandable steps (6th and beyond)
  protected getExpandableSteps(): SimpleStep[] {
    return this.simpleSteps().slice(5);
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

  // Brands modal methods
  openBrandsModal(): void {
    this.showBrandsModal.set(true);
  }

  closeBrandsModal(): void {
    this.showBrandsModal.set(false);
  }

  navigateToCarsWithBrandFromModal(brandName: string): void {
    this.closeBrandsModal();
    this.router.navigate(['/cars'], { queryParams: { brand: brandName } });
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

  // Dynamically set the vertical line to stop at the last visible step
  private updateTimelineHeight(): void {
    if (!this.isBrowser || !this.timelineRef) return;
    const timelineEl = this.timelineRef.nativeElement;
    
    // Force a reflow to ensure DOM is updated
    timelineEl.offsetHeight;
    
    // Check if we're on mobile using window width (more reliable than CSS detection)
    const isMobile = window.innerWidth < 768;
    
    // Get the current expansion state
    const isExpanded = this.isSimpleStepsExpanded();
    
    // Find all visible timeline items - specifically check for collapsed state classes
    const items = Array.from(timelineEl.querySelectorAll<HTMLElement>('.timeline-item'))
      .filter(el => {
        // Check if element has collapsed classes (these indicate hidden expandable steps)
        const hasCollapsedClasses = el.classList.contains('opacity-0') || 
                                   el.classList.contains('max-h-0') || 
                                   el.classList.contains('overflow-hidden');
        
        // If it has collapsed classes, it's hidden
        if (hasCollapsedClasses) return false;
        
        // Additional checks for other hidden states
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);
        return rect.height > 0 && 
               computedStyle.display !== 'none' && 
               computedStyle.visibility !== 'hidden' &&
               computedStyle.opacity !== '0';
      });
    
    if (items.length === 0) {
      timelineEl.style.setProperty('--timeline-height', '100%');
      return;
    }
    
    // If not expanded, only consider the first 5 steps (getVisibleSteps)
    const visibleItems = isExpanded ? items : items.slice(0, 5);
    const lastItem = visibleItems[visibleItems.length - 1];
    
    if (!lastItem) {
      timelineEl.style.setProperty('--timeline-height', '100%');
      return;
    }
    
    const icon = lastItem.querySelector<HTMLElement>('.timeline-icon');
    const iconHalf = icon ? Math.round(icon.clientHeight / 2) : 16;
    const timelineTop = timelineEl.getBoundingClientRect().top + window.scrollY;
    const lastCenterY = lastItem.getBoundingClientRect().top + window.scrollY + iconHalf;
    const heightPx = Math.max(0, Math.round(lastCenterY - timelineTop));
    
    // Calculate final height based on expansion state and device type
    let finalHeight = heightPx + iconHalf;
    
    if (isMobile) {
      // On mobile, ensure the line stops exactly at the last visible item
      const lastItemBottom = lastItem.getBoundingClientRect().bottom + window.scrollY;
      const timelineBottom = timelineEl.getBoundingClientRect().bottom + window.scrollY;
      
      // Use the bottom of the last item as the stopping point
      const bottomBasedHeight = Math.max(0, lastItemBottom - timelineTop);
      finalHeight = Math.max(finalHeight, bottomBasedHeight);
      
      // Add a small buffer but don't let it extend too far
      finalHeight = Math.min(finalHeight + 10, bottomBasedHeight + 20);
    }
    
    timelineEl.style.setProperty('--timeline-height', finalHeight + 'px');
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
    
    // Unregister scroll sections
    this.scrollNavigationService.unregisterSections();
  }

  /**
   * Register scroll sections for navigation highlighting
   */
  private registerScrollSections(): void {
    if (!this.isBrowser) return;

    const sections = [];

    // Register FAQ section
    const faqElement = document.querySelector('[data-faq-section]') as HTMLElement;
    if (faqElement) {
      sections.push({
        id: 'faq',
        element: faqElement,
        offset: faqElement.offsetTop
      });
    }

    // Register other sections if needed (hero, about, etc.)
    const heroElement = document.querySelector('[data-hero-section]') as HTMLElement;
    if (heroElement) {
      sections.push({
        id: 'home',
        element: heroElement,
        offset: heroElement.offsetTop
      });
    }

    // Register sections with the scroll navigation service
    if (sections.length > 0) {
      this.scrollNavigationService.registerSections(sections);
    }
  }

  /**
   * Format price with commas for better readability
   */
  formatPrice(price: number | string): string {
    if (typeof price === 'number') {
      // Handle negative numbers and ensure proper formatting
      return Math.abs(price).toLocaleString('en-IN', {
        maximumFractionDigits: 0
      });
    }
    
    if (typeof price === 'string') {
      const num = parseFloat(price);
      if (!isNaN(num)) {
        return Math.abs(num).toLocaleString('en-IN', {
          maximumFractionDigits: 0
        });
      }
    }
    
    return String(price);
  }

}


