import { Component, AfterViewInit, OnInit, Renderer2, ElementRef, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarPublicService } from '../services/car-public.service';
import { AnimationService } from '../services/animation.service';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class Cars implements OnInit, AfterViewInit {
  // Convert to signals for proper reactivity with zoneless change detection
  protected allCars = signal<any[]>([]);
  protected currentPage = signal<number>(1);
  protected itemsPerPage = signal<number>(9);
  protected currentFilter = signal<string>('All');
  protected currentSort = signal<string>('A-Z (Sort by Car Name)');
  protected searchQuery = signal<string>('');
  protected searchType = signal<string>('');
  protected isSearchActive = signal<boolean>(false);
  
  // Location search functionality
  protected locationSearchQuery = signal<string>('');
  protected locationSearchType = signal<string>('');
  protected isLocationSearchActive = signal<boolean>(false);
  
  // Brand filter functionality
  brandFilter = signal<string>('');
  isBrandFilterActive = signal<boolean>(false);
  
  protected isLoading = signal<boolean>(true);
  private dropdownsInitialized: boolean = false;
  
  // Make Math available to template
  Math = Math;

  // Computed signals for derived data
  protected filteredCars = computed(() => {
    let cars = this.allCars();
    
    // Apply brand filter first
    if (this.isBrandFilterActive() && this.brandFilter()) {
      cars = this.applyBrandFilter(cars, this.brandFilter());
    }
    
    // Apply main search filter (by car name, brand, etc.)
    if (this.isSearchActive() && this.searchQuery()) {
      cars = this.applyMainSearchFilter(cars, this.searchQuery());
    }
    
    // Apply location search filter
    if (this.isLocationSearchActive() && this.locationSearchQuery()) {
      cars = this.applyLocationSearchFilter(cars, this.locationSearchQuery(), this.locationSearchType());
    }
    
    // Apply other filters
    cars = this.applyFilter(cars, this.currentFilter());
    
    // Then apply sorting
    cars = this.applySort(cars, this.currentSort());
    
    return cars;
  });

  protected totalItems = computed(() => this.filteredCars().length);
  protected totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));

  protected cars = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    const paginatedCars = this.filteredCars().slice(startIndex, endIndex);
    return paginatedCars;
  });

  constructor(
    private carService: CarPublicService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private animationService: AnimationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Effect to reinitialize animations when cars data changes
    effect(() => {
      const carsData = this.cars();
      const isLoading = this.isLoading();
      
      if (!isLoading && carsData.length > 0 && this.isBrowser()) {
        // Delay animation refresh to ensure DOM is updated
        setTimeout(() => {
          this.initAngularAnimations();
        }, 200);
      }
    });
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Set a timeout to force loading to false after 10 seconds as a fallback
    setTimeout(() => {
      if (this.isLoading()) {
        this.isLoading.set(false);
      }
    }, 10000);
    
    // Check for search parameters in URL
    this.route.queryParams.subscribe(params => {
      // Handle brand filter parameters
      if (params['brand']) {
        this.brandFilter.set(params['brand']);
        this.isBrandFilterActive.set(true);
      }
      
      // Handle main search parameters
      if (params['search'] && params['type'] === 'main') {
        this.searchQuery.set(params['search']);
        this.isSearchActive.set(true);
      }
      
      // Handle location search parameters
      if (params['locationSearch']) {
        this.locationSearchQuery.set(params['locationSearch']);
        this.locationSearchType.set(params['locationType'] || 'location');
        this.isLocationSearchActive.set(true);
      }
    });

    // Fetch public cars from backend
    this.carService.getPublicCars().subscribe({
      next: (res: any) => {
        // API returns { status, body: { cars }, message }
        const carsData = (res && res.body && res.body.cars) ? res.body.cars : (Array.isArray(res) ? res : []);
        this.allCars.set(carsData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.allCars.set([]);
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize Angular animations only on the client side
    if (this.isBrowser()) {
      // Use multiple attempts to ensure animations are properly initialized
      setTimeout(() => this.initAngularAnimations(), 100);
      setTimeout(() => this.initAngularAnimations(), 500);
      setTimeout(() => this.initAngularAnimations(), 1000);
    }

    // Only run DOM initializers on the client
    if (this.isBrowser()) {
      // Use multiple setTimeout attempts to ensure DOM is fully rendered
      setTimeout(() => this.initializeDropdowns(), 100);
      setTimeout(() => this.initializeDropdowns(), 500);
      setTimeout(() => this.initializeDropdowns(), 1000);
      
      setTimeout(() => {
        this.initializeMobileMenu();
        this.initializePaginationLoader();
        this.initializeCarousels();
      }, 100);
    }
  }

  // ...existing DOM initializer methods (kept unchanged) ...
  private initializeMobileMenu(): void {
    if (!this.isBrowser()) return;

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && closeMenuButton && mobileMenu) {
      const mobileMenuOverlay = mobileMenu.querySelector('.absolute.inset-0') as HTMLElement;
      const mobileMenuContent = mobileMenu.querySelector('.absolute.inset-y-0.right-0') as HTMLElement;
      const menuLinks = mobileMenu.querySelectorAll('nav a');

      const openMenu = () => {
        mobileMenu.classList.remove('pointer-events-none');
        mobileMenu.classList.add('pointer-events-auto');
        mobileMenu.style.opacity = '1';
        if (mobileMenuOverlay) mobileMenuOverlay.style.opacity = '1';
        if (mobileMenuContent) {
          mobileMenuContent.style.transform = 'translateX(0) scale(1)';
          mobileMenuContent.style.opacity = '1';
        }

        menuLinks.forEach((link, index) => {
          setTimeout(() => {
            (link as HTMLElement).style.opacity = '1';
          }, 100 + (index * 100));
        });
      };

      const closeMenu = () => {
        mobileMenu.style.opacity = '0';
        if (mobileMenuOverlay) mobileMenuOverlay.style.opacity = '0';
        if (mobileMenuContent) {
          mobileMenuContent.style.transform = 'translateX(100%) scale(0.95)';
          mobileMenuContent.style.opacity = '0';
        }

        menuLinks.forEach(link => {
          (link as HTMLElement).style.opacity = '0';
        });

        setTimeout(() => {
          mobileMenu.classList.remove('pointer-events-auto');
          mobileMenu.classList.add('pointer-events-none');
        }, 700);
      };

      mobileMenuButton.addEventListener('click', openMenu);
      closeMenuButton.addEventListener('click', closeMenu);
      mobileMenuOverlay?.addEventListener('click', closeMenu);
    }
  }

  private initializePaginationLoader(): void {
    const pagination = document.getElementById('pagination');
    const loader = document.getElementById('pagination-loader');
    if (!pagination || !loader) return;

    pagination.addEventListener('click', function(e) {
      const target = (e.target as HTMLElement).closest('button');
      if (!target) return;

      // Don't prevent default for button clicks, just show loader
      loader.classList.add('visible');
      loader.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        loader.classList.remove('visible');
        loader.setAttribute('aria-hidden', 'true');
      }, 800);
    });
  }

  private initializeDropdowns(): void {
    if (!this.isBrowser() || this.dropdownsInitialized) return;
    
    const dropdowns = [
      { button: 'sort-dropdown', menu: 'sort-menu' },
      { button: 'filter-dropdown', menu: 'filter-menu' }
    ];

    let foundElements = 0;
    dropdowns.forEach(({ button, menu }) => {
      const btn = this.elementRef.nativeElement.querySelector(`#${button}`);
      const menuEl = this.elementRef.nativeElement.querySelector(`#${menu}`);
      
      if (!btn || !menuEl) {
        return;
      }
      
      foundElements++;
      
      // Button click handler
      this.renderer.listen(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(({ menu: m }) => {
          const el = this.elementRef.nativeElement.querySelector(`#${m}`);
          if (el && m !== menu) {
            this.renderer.addClass(el, 'hidden');
          }
        });
        
        // Toggle current dropdown
        if (menuEl.classList.contains('hidden')) {
          this.renderer.removeClass(menuEl, 'hidden');
        } else {
          this.renderer.addClass(menuEl, 'hidden');
        }
      });

      // Handle menu item clicks
      const links = menuEl.querySelectorAll('a');
      links.forEach((link: Element) => {
        this.renderer.listen(link, 'click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const linkText = link.textContent?.trim() || '';
          
          // Close all dropdowns
          dropdowns.forEach(({ menu: m }) => {
            const el = this.elementRef.nativeElement.querySelector(`#${m}`);
            if (el) this.renderer.addClass(el, 'hidden');
          });
          
          // Update button label
          const label = btn.querySelector('p');
          if (label) label.textContent = linkText;
          btn.setAttribute('data-active', linkText);
          
          // Apply filter or sort based on which dropdown
          if (menu === 'filter-menu') {
            this.onFilterChange(linkText);
          } else if (menu === 'sort-menu') {
            this.onSortChange(linkText);
          }
        });
      });
    });
    
    if (foundElements === 2) {
      this.dropdownsInitialized = true;
    }
  }

  private handleDropdownClick = (e: Event) => {
    // Placeholder for event handler reference
  }

  private initializeCarousels(): void {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
      const track = carousel.querySelector('.carousel-track') as HTMLElement;
      if (!track) return;
      const slides = Array.from(track.children);
      const dots = Array.from(carousel.querySelectorAll('.carousel-dots button'));
      let index = 0;
      let intervalId: any = null;
      const intervalMs = 3000;

      let isPointerDown = false;
      let startX = 0;
      let currentTranslate = 0;
      let prevTranslate = 0;
      let animationFrame: number | null = null;

      const getWidth = () => carousel.clientWidth;
      const setTranslate = (x: number) => { track.style.transform = `translateX(${x}px)`; };

      const update = () => {
        const w = getWidth();
        prevTranslate = -index * w;
        currentTranslate = prevTranslate;
        track.style.transition = 'transform 0.35s ease';
        setTranslate(prevTranslate);
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
      };

      const next = () => { index = (index + 1) % slides.length; update(); };

      dots.forEach(d => d.addEventListener('click', () => {
        index = Number((d as HTMLElement).dataset['index']);
        update();
        resetAutoplay();
      }));

      const startAutoplay = () => { if (intervalId) return; intervalId = setInterval(next, intervalMs); };
      const stopAutoplay = () => { if (intervalId) { clearInterval(intervalId); intervalId = null; } };
      const resetAutoplay = () => { stopAutoplay(); startAutoplay(); };

      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', startAutoplay);

      const pointerDown = (event: PointerEvent | TouchEvent) => {
        isPointerDown = true;
        carousel.classList.add('dragging');
        startX = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientX : (event as PointerEvent).clientX;
        track.style.transition = 'none';
        stopAutoplay();
        animationFrame = requestAnimationFrame(animation);
      };

      const pointerMove = (event: PointerEvent | TouchEvent) => {
        if (!isPointerDown) return;
        const currentX = (event as TouchEvent).touches ? (event as TouchEvent).touches[0].clientX : (event as PointerEvent).clientX;
        const delta = currentX - startX;
        currentTranslate = prevTranslate + delta;
      };

      const pointerUp = () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        carousel.classList.remove('dragging');
        if (animationFrame) cancelAnimationFrame(animationFrame);
        const movedBy = currentTranslate - prevTranslate;
        const w = getWidth();
        if (movedBy < -w * 0.25) { index = Math.min(index + 1, slides.length - 1); }
        else if (movedBy > w * 0.25) { index = Math.max(index - 1, 0); }
        update();
        resetAutoplay();
      };

      const animation = () => { setTranslate(currentTranslate); if (isPointerDown) animationFrame = requestAnimationFrame(animation); };

      carousel.addEventListener('pointerdown', (e) => { e.preventDefault(); pointerDown(e as PointerEvent); });
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      window.addEventListener('resize', update);

      const initSizes = () => { update(); startAutoplay(); };
      setTimeout(initSizes, 50);
    });
  }

  // Filter and Sort methods - now handled by computed signals
  // The applyFiltersAndSort method is no longer needed as filtering is handled by computed signals

  // Brand filter (by brand name)
  applyBrandFilter(cars: any[], brandName: string): any[] {
    if (!brandName || !brandName.trim()) {
      return cars;
    }
    
    const query = brandName.toLowerCase().trim();
    const filteredCars = cars.filter(car => {
      const carBrandName = (car.brandname || '').toLowerCase();
      return carBrandName.includes(query);
    });
    
    return filteredCars;
  }

  // Main search filter (by car name, brand, etc.)
  applyMainSearchFilter(cars: any[], searchQuery: string): any[] {
    if (!searchQuery || !searchQuery.trim()) {
      return cars;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filteredCars = cars.filter(car => {
      const carName = (car.carname || '').toLowerCase();
      const brandName = (car.brandname || '').toLowerCase();
      const fuel = (car.fuel || '').toLowerCase();
      const color = (car.color || '').toLowerCase();
      
      return carName.includes(query) || 
             brandName.includes(query) || 
             fuel.includes(query) || 
             color.includes(query);
    });
    
    return filteredCars;
  }

  // Location search filter (by location or pincode)
  applyLocationSearchFilter(cars: any[], searchQuery: string, searchType: string): any[] {
    if (!searchQuery || !searchQuery.trim()) {
      return cars;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filteredCars = cars.filter(car => {
      if (searchType === 'pincode') {
        // Search by pincode - exact match
        return car.pincode && car.pincode.toString() === query;
      } else {
        // Search by location - partial match
        const location = (car.location || '').toLowerCase();
        return location.includes(query);
      }
    });
    
    return filteredCars;
  }

  applyFilter(cars: any[], filter: string): any[] {
    let filteredCars: any[];
    switch (filter) {
      case 'All':
        filteredCars = [...cars];
        break;
      case 'Book Now':
        // Cars with tokens available (can book now)
        // Based on template logic: tokensavailble === 0 means "Book Now" is shown
        filteredCars = cars.filter(car => {
          const canBookNow = car.tokensavailble === 0 && car.ticketsavilble > 0;
          return canBookNow;
        });
        break;
      case 'Join Waitlist':
        // Cars without tokens available (need to join waitlist)
        // Based on template logic: tokensavailble !== 0 means "Join Waitlist" is shown
        filteredCars = cars.filter(car => {
          const needsWaitlist = car.tokensavailble !== 0 && car.ticketsavilble > 0;
          return needsWaitlist;
        });
        break;
      case 'Relevance':
        // Sort by relevance - show all active cars, prioritizing those with better availability
        filteredCars = cars.filter(car => {
          const isActive = car.status === 'active' || car.status === undefined; // Assume active if no status
          const hasTickets = car.ticketsavilble > 0;
          return isActive && hasTickets;
        });
        break;
      default:
        filteredCars = [...cars];
    }
    
    return filteredCars;
  }

  applySort(cars: any[], sort: string): any[] {
    const sortedCars = [...cars];
    
    let result: any[];
    switch (sort) {
      case 'A-Z (Sort by Car Name)':
        result = sortedCars.sort((a, b) => {
          const nameA = (a.carname || a.brandname || '').toLowerCase();
          const nameB = (b.carname || b.brandname || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'Newest Arrivals':
        result = sortedCars.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
        break;
      case 'Top Selling':
        result = sortedCars.sort((a, b) => {
          // Sort by tickets sold (totaltickets - ticketsavilble)
          const soldA = (a.totaltickets || 0) - (a.ticketsavilble || 0);
          const soldB = (b.totaltickets || 0) - (b.ticketsavilble || 0);
          return soldB - soldA; // Most sold first
        });
        break;
      case 'Ticket Price (Low-High)':
        result = sortedCars.sort((a, b) => {
          const priceA = parseFloat(a.fractionprice || a.tokenprice || '0');
          const priceB = parseFloat(b.fractionprice || b.tokenprice || '0');
          return priceA - priceB; // Low to high
        });
        break;
      case 'Ticket Price (High-Low)':
        result = sortedCars.sort((a, b) => {
          const priceA = parseFloat(a.fractionprice || a.tokenprice || '0');
          const priceB = parseFloat(b.fractionprice || b.tokenprice || '0');
          return priceB - priceA; // High to low
        });
        break;
      default:
        result = sortedCars;
    }
    
    return result;
  }

  // Filter and Sort event handlers
  onFilterChange(filter: string): void {
    this.currentFilter.set(filter);
    this.currentPage.set(1); // Reset to first page when filter changes
  }

  onSortChange(sort: string): void {
    this.currentSort.set(sort);
    this.currentPage.set(1); // Reset to first page when sort changes
  }

  // Clear all filters and searches
  clearAllFilters(): void {
    this.currentFilter.set('All');
    this.currentSort.set('A-Z (Sort by Car Name)');
    this.searchQuery.set('');
    this.isSearchActive.set(false);
    this.locationSearchQuery.set('');
    this.isLocationSearchActive.set(false);
    this.brandFilter.set('');
    this.isBrandFilterActive.set(false);
    this.currentPage.set(1);
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

  // Pagination methods - now handled by computed signals
  // updatePagination is no longer needed as pagination is handled by computed signals

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Scroll to top of car grid
      if (this.isBrowser()) {
        const carGrid = document.getElementById('car-grid');
        if (carGrid) {
          carGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages());
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 3) {
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisiblePages + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Main search functionality methods
  onSearchSubmit(): void {
    if (this.searchQuery().trim()) {
      this.isSearchActive.set(true);
      this.currentPage.set(1); // Reset to first page when searching
      
      // Update URL with search parameters
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchQuery().trim(),
          type: 'main'
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchSubmit();
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.isSearchActive.set(false);
    this.currentPage.set(1); // Reset to first page when clearing search
    
    // Remove search parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  // Location search functionality methods
  onLocationSearchSubmit(): void {
    if (this.locationSearchQuery().trim()) {
      this.isLocationSearchActive.set(true);
      this.locationSearchType.set(this.isPincode(this.locationSearchQuery().trim()) ? 'pincode' : 'location');
      this.currentPage.set(1); // Reset to first page when searching
      
      // Update URL with location search parameters
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          locationSearch: this.locationSearchQuery().trim(),
          locationType: this.locationSearchType()
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  onLocationSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onLocationSearchSubmit();
    }
  }

  clearLocationSearch(): void {
    this.locationSearchQuery.set('');
    this.isLocationSearchActive.set(false);
    this.locationSearchType.set('');
    this.currentPage.set(1); // Reset to first page when clearing search
    
    // Remove location search parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  clearBrandFilter(): void {
    this.brandFilter.set('');
    this.isBrandFilterActive.set(false);
    this.currentPage.set(1); // Reset to first page when clearing filter
    
    // Remove brand filter parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  clearAllSearches(): void {
    this.searchQuery.set('');
    this.isSearchActive.set(false);
    this.locationSearchQuery.set('');
    this.isLocationSearchActive.set(false);
    this.locationSearchType.set('');
    this.brandFilter.set('');
    this.isBrandFilterActive.set(false);
    this.currentPage.set(1); // Reset to first page when clearing search
    
    // Remove all search parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  private isPincode(query: string): boolean {
    // Check if the query is a 6-digit pincode
    return /^\d{6}$/.test(query);
  }

  getSearchDisplayText(): string {
    if (!this.isSearchActive() || !this.searchQuery()) {
      return '';
    }
    
    const typeText = this.searchType() === 'pincode' ? 'Pincode' : 'Location';
    return `Searching by ${typeText}: "${this.searchQuery()}"`;
  }

  // Navigation method for car details
  navigateToCarDetails(carId: string): void {
    if (carId) {
      this.router.navigate(['/car-details', carId]);
    }
  }

  private initAngularAnimations(): void {
    // Initialize animations using the animation service
    this.animationService.initAnimations(this.elementRef, this.renderer);
    
    // Fallback: Ensure all animated elements are visible after a short delay
    setTimeout(() => {
      this.ensureElementsVisible();
    }, 2000);
  }

  private ensureElementsVisible(): void {
    if (!this.isBrowser()) return;
    
    const animatedElements = this.elementRef.nativeElement.querySelectorAll('[data-animation]');
    
    animatedElements.forEach((el: HTMLElement) => {
      if (el.classList.contains('animation-hidden')) {
        el.classList.remove('animation-hidden');
        el.classList.add('animation-visible');
      }
    });
  }
}
