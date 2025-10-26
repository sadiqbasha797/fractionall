import { Component, AfterViewInit, OnInit, Renderer2, ElementRef, signal, computed, effect, Inject, PLATFORM_ID, HostListener, DestroyRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarPublicService } from '../services/car-public.service';
import { AnimationService } from '../services/animation.service';
import { LocationSuggestionsService, LocationSuggestion } from '../services/location-suggestions.service';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class Cars implements OnInit, AfterViewInit {
  private destroyRef = inject(DestroyRef);
  
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
  protected isLocationDropdownOpen = signal<boolean>(false);
  protected locationSuggestions = signal<LocationSuggestion[]>([]);
  protected isLocationLoading = signal<boolean>(false);
  
  // Location modal functionality
  protected isLocationModalOpen = signal<boolean>(false);
  protected locationModalQuery = signal<string>('');
  protected locationModalSuggestions = signal<LocationSuggestion[]>([]);
  protected isLocationModalLoading = signal<boolean>(false);
  
  // Location filter for cars
  protected selectedLocation = signal<string>('');
  protected selectedState = signal<string>('');
  
  // Filter popup options
  protected   sortOptions = [
    'A-Z (Sort by Car Name)',
    'Newest Arrivals',
    'Top Selling',
    'Share Price (Low-High)',
    'Share Price (High-Low)'
  ];
  
  protected filterOptions = [
    'Join Waitlist',
    'Book Now', 
    'Relevance'
  ];
  
  // Mobile filter/sort popup
  protected isMobileFilterPopupOpen = signal<boolean>(false);
  protected isMobileSortPopupOpen = signal<boolean>(false);
  
  // Computed filtered cities based on search query
  protected filteredCities = computed(() => {
    const query = this.locationSearchQuery().toLowerCase().trim();
    if (!query) {
      return this.indianCities;
    }
    return this.indianCities.filter(city => 
      city.toLowerCase().includes(query)
    ).sort((a, b) => {
      // Sort by relevance: exact matches first, then starts with, then contains
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (aLower === queryLower) return -1;
      if (bLower === queryLower) return 1;
      if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
      if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
      
      return a.localeCompare(b);
    });
  });

  // Combined suggestions from both static cities and API suggestions
  protected allLocationSuggestions = computed(() => {
    const query = this.locationSearchQuery().toLowerCase().trim();
    const staticCities = this.filteredCities();
    const apiSuggestions = this.locationSuggestions();
    const selectedLocation = this.locationSearchQuery().trim();
    const isLocationSelected = this.isLocationSearchActive() && selectedLocation;
    
    // Create base suggestions array
    let suggestions: any[] = [];
    
    // If a location is selected, show all cities (not filtered by query)
    if (isLocationSelected) {
      // Use all cities from the indianCities array, not filtered ones
      suggestions = this.indianCities.map(city => ({ 
        name: city, 
        display_name: city, 
        state: '', 
        country: 'India', 
        lat: '', 
        lon: '', 
        type: 'city' 
      }));
    } else if (!query) {
      suggestions = staticCities.map(city => ({ name: city, display_name: city, state: '', country: 'India', lat: '', lon: '', type: 'city' }));
    } else {
      // If we have API suggestions, prioritize them and add static cities that aren't already included
      if (apiSuggestions.length > 0) {
        const apiCityNames = apiSuggestions.map(s => s.name.toLowerCase());
        const additionalStaticCities = staticCities.filter(city => 
          !apiCityNames.includes(city.toLowerCase())
        );
        
        suggestions = [
          ...apiSuggestions,
          ...additionalStaticCities.map(city => ({ 
            name: city, 
            display_name: city, 
            state: '', 
            country: 'India', 
            lat: '', 
            lon: '', 
            type: 'city' 
          }))
        ];
        
        suggestions = this.sortSuggestionsByRelevance(suggestions, query);
      } else {
        // Fallback to static cities only
        suggestions = staticCities.map(city => ({ 
          name: city, 
          display_name: city, 
          state: '', 
          country: 'India', 
          lat: '', 
          lon: '', 
          type: 'city' 
        }));
      }
    }
    
    // If there's a selected location, ensure it appears at the top
    if (isLocationSelected) {
      const selectedLocationLower = selectedLocation.toLowerCase();
      
      // Remove the selected location from the suggestions if it exists
      const filteredSuggestions = suggestions.filter(suggestion => 
        suggestion.name.toLowerCase() !== selectedLocationLower
      );
      
      // Add the selected location at the top with a special flag
      const selectedSuggestion = {
        name: selectedLocation,
        display_name: selectedLocation,
        state: '',
        country: 'India',
        lat: '',
        lon: '',
        type: 'city',
        isSelected: true
      };
      
      // Combine selected location at top with remaining suggestions
      suggestions = [selectedSuggestion, ...filteredSuggestions];
    }
    
    return suggestions.slice(0, 10);
  });

  /**
   * Sort suggestions by relevance to the search query
   */
  private sortSuggestionsByRelevance(suggestions: any[], query: string): any[] {
    const queryLower = query.toLowerCase();
    
    return suggestions.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === queryLower) return -1;
      if (bName === queryLower) return 1;
      
      // Starts with query gets second priority
      const aStartsWith = aName.startsWith(queryLower);
      const bStartsWith = bName.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Contains query gets third priority
      const aContains = aName.includes(queryLower);
      const bContains = bName.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;
      
      // Shorter names get priority for same relevance
      if (aContains && bContains) {
        return aName.length - bName.length;
      }
      
      // Alphabetical order as fallback
      return aName.localeCompare(bName);
    });
  }
  
  // Indian cities list
  protected indianCities = [
    'Bangalore',
    'Mysore', 
    'Mangalore',
    'Visakhapatnam',
    'Vijaywada',
    'Chennai',
    'Coimbatore',
    'Mumbai',
    'Pune',
    'Gurgaon',
    'Delhi-NCR',
    'Ahmedabad',
    'Jaipur',
    'Bhuvneshwar',
    'Hyderabad',
    'Surat',
    'Kolkata',
    'Cochin',
    'Nagpur',
    'Indore',
    'Dehradun',
    'Chandigarh'
  ];
  
  // Brand filter functionality
  brandFilter = signal<string>('');
  isBrandFilterActive = signal<boolean>(false);
  
  // Most browsed cars functionality
  protected mostBrowsedCars = signal<any[]>([]);
  protected isLoadingMostBrowsed = signal<boolean>(false);
  protected showMostBrowsed = signal<boolean>(false);
  
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

  // All location suggestions for modal
  protected allLocationModalSuggestions = computed(() => {
    const query = this.locationModalQuery();
    if (query.length > 0) {
      return this.locationModalSuggestions();
    }
    return this.locationSuggestionsService.getFallbackSuggestions();
  });

  constructor(
    private carService: CarPublicService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private animationService: AnimationService,
    private locationSuggestionsService: LocationSuggestionsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Effect to reinitialize animations when cars data changes
    // Use DestroyRef to properly manage effect lifecycle
    const effectRef = effect(() => {
      const carsData = this.cars();
      const isLoading = this.isLoading();
      
      if (!isLoading && carsData.length > 0 && this.isBrowser()) {
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

    // Subscribe to location suggestions
    this.locationSuggestionsService.searchResults$.subscribe({
      next: (suggestions) => {
        this.locationSuggestions.set(suggestions);
        this.isLocationLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching location suggestions:', error);
        this.isLocationLoading.set(false);
        // Show fallback suggestions on error
        this.locationSuggestions.set(this.locationSuggestionsService.getFallbackSuggestions());
      }
    });
  }

  protected isBrowser(): boolean {
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
      
      // Handle location filter from navbar
      if (params['location']) {
        this.selectedLocation.set(params['location']);
        this.selectedState.set(params['state'] || '');
        this.isLocationSearchActive.set(true);
        this.locationSearchQuery.set(params['location']);
      }
    });

    // Fetch public cars from backend
    this.carService.getPublicCars().subscribe({
      next: (res: any) => {
        // API returns { status, body: { cars }, message }
        const carsData = (res && res.body && res.body.cars) ? res.body.cars : (Array.isArray(res) ? res : []);
        // Filter out cars with stopped bookings
        const activeCars = carsData.filter((car: any) => !car.stopBookings);
        this.allCars.set(activeCars);
        this.isLoading.set(false);
        
        // Show location modal if no location is selected
        if (!this.isLocationSearchActive() && !this.selectedLocation()) {
          this.isLocationModalOpen.set(true);
        }
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.allCars.set([]);
        this.isLoading.set(false);
        
        // Show location modal even on error if no location is selected
        if (!this.isLocationSearchActive() && !this.selectedLocation()) {
          this.isLocationModalOpen.set(true);
        }
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
    // Initialize desktop pagination loader
    const pagination = document.getElementById('pagination');
    const loader = document.getElementById('pagination-loader');
    if (pagination && loader) {
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

    // Initialize mobile pagination loader
    const mobilePagination = document.querySelector('.mobile-pagination');
    const mobileLoader = document.getElementById('pagination-loader-mobile');
    if (mobilePagination && mobileLoader) {
      mobilePagination.addEventListener('click', function(e) {
        const target = (e.target as HTMLElement).closest('button');
        if (!target) return;

        // Don't prevent default for button clicks, just show loader
        mobileLoader.classList.add('visible');
        mobileLoader.setAttribute('aria-hidden', 'false');

        setTimeout(() => {
          mobileLoader.classList.remove('visible');
          mobileLoader.setAttribute('aria-hidden', 'true');
        }, 800);
      });
    }
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
      case 'Most Browsed':
        result = sortedCars.sort((a, b) => {
          const viewCountA = a.viewCount || 0;
          const viewCountB = b.viewCount || 0;
          return viewCountB - viewCountA; // Most browsed first
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
        case 'Share Price (Low-High)':
        result = sortedCars.sort((a, b) => {
          // Extract numeric value from price string, handling commas and other formatting
          const getNumericPrice = (price: any) => {
            if (!price) return 0;
            const priceStr = String(price).replace(/[^\d.]/g, ''); // Remove non-numeric characters except decimal
            const numPrice = parseFloat(priceStr);
            return isNaN(numPrice) ? 0 : numPrice;
          };
          
          const priceA = getNumericPrice(a.fractionprice || a.tokenprice || a.price);
          const priceB = getNumericPrice(b.fractionprice || b.tokenprice || b.price);
          
          // Debug logging
          if (sortedCars.length <= 3) {
            console.log('Sorting Low-High:', {
              carA: a.carname || a.brandname,
              priceA: a.fractionprice || a.tokenprice || a.price,
              numericA: priceA,
              carB: b.carname || b.brandname,
              priceB: b.fractionprice || b.tokenprice || b.price,
              numericB: priceB
            });
          }
          
          return priceA - priceB; // Low to high
        });
        break;
        case 'Share Price (High-Low)':
        result = sortedCars.sort((a, b) => {
          // Extract numeric value from price string, handling commas and other formatting
          const getNumericPrice = (price: any) => {
            if (!price) return 0;
            const priceStr = String(price).replace(/[^\d.]/g, ''); // Remove non-numeric characters except decimal
            const numPrice = parseFloat(priceStr);
            return isNaN(numPrice) ? 0 : numPrice;
          };
          
          const priceA = getNumericPrice(a.fractionprice || a.tokenprice || a.price);
          const priceB = getNumericPrice(b.fractionprice || b.tokenprice || b.price);
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
    this.closeMobilePopups(); // Close popup after selection
  }

  onSortChange(sort: string): void {
    console.log('Sorting changed to:', sort);
    this.currentSort.set(sort);
    this.currentPage.set(1); // Reset to first page when sort changes
    this.closeMobilePopups(); // Close popup after selection
    
    // Debug: Log first few cars after sorting
    setTimeout(() => {
      const sortedCars = this.cars();
      console.log('First 3 cars after sorting:', sortedCars.slice(0, 3).map(car => ({
        name: car.carname || car.brandname,
        price: car.fractionprice || car.tokenprice || car.price
      })));
    }, 100);
  }

  // Mobile popup control methods
  toggleMobileSortPopup(): void {
    if (!this.isBrowser()) return; // Prevent SSR issues
    this.isMobileSortPopupOpen.set(!this.isMobileSortPopupOpen());
    if (this.isMobileSortPopupOpen()) {
      this.isMobileFilterPopupOpen.set(false); // Close filter popup if open
    }
  }

  toggleMobileFilterPopup(): void {
    if (!this.isBrowser()) return; // Prevent SSR issues
    this.isMobileFilterPopupOpen.set(!this.isMobileFilterPopupOpen());
    if (this.isMobileFilterPopupOpen()) {
      this.isMobileSortPopupOpen.set(false); // Close sort popup if open
    }
  }

  closeMobilePopups(): void {
    if (!this.isBrowser()) return; // Prevent SSR issues
    this.isMobileSortPopupOpen.set(false);
    this.isMobileFilterPopupOpen.set(false);
  }

  // Format sort text for mobile display
  getMobileSortText(): string {
    const sortText = this.currentSort();
    if (sortText === 'A-Z (Sort by Car Name)') {
      return 'A-Z sort...';
    }
    if (sortText === 'Share Price (Low-High)') {
      return 'Price Low-High';
    }
    if (sortText === 'Share Price (High-Low)') {
      return 'Price High-Low';
    }
    // For other options, truncate if too long
    return sortText.length > 12 ? sortText.substring(0, 12) + '...' : sortText;
  }

  // Clear all filters and searches
  clearAllFilters(): void {
    this.currentFilter.set('All');
    this.currentSort.set('A-Z (Sort by Car Name)');
    this.searchQuery.set('');
    this.isSearchActive.set(false);
    this.locationSearchQuery.set('');
    this.isLocationSearchActive.set(false);
    this.locationSuggestions.set([]);
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
      // Scroll to slightly above "Available Cars" text
      if (this.isBrowser()) {
        setTimeout(() => {
          const availableCarsElement = document.getElementById('available-cars-heading');
          if (availableCarsElement) {
            // Scroll to element with offset to position it higher
            const elementPosition = availableCarsElement.offsetTop;
            const offsetPosition = elementPosition - 100; // 100px above the element
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          } else {
            // Fallback: scroll to car grid
            const carGrid = document.getElementById('car-grid');
            if (carGrid) {
              carGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Final fallback: scroll to top of page
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }, 100);
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

  getMobilePageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 3; // Show fewer pages on mobile
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - 1) {
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
      
      // Close dropdown after search
      this.closeLocationDropdown();
      
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
    this.locationSuggestions.set([]);
    this.currentPage.set(1); // Reset to first page when clearing search
    
    // Remove location search parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  toggleLocationDropdown(): void {
    this.isLocationDropdownOpen.set(!this.isLocationDropdownOpen());
  }

  closeLocationDropdown(): void {
    this.isLocationDropdownOpen.set(false);
    // Clear suggestions when dropdown is closed
    this.locationSuggestions.set([]);
  }

  selectCity(city: string | LocationSuggestion): void {
    let cityName: string;
    let searchType: string;
    
    if (typeof city === 'string') {
      cityName = city;
      searchType = this.locationSuggestionsService.isPincode(city) ? 'pincode' : 'location';
    } else {
      cityName = this.locationSuggestionsService.getFormattedLocation(city);
      searchType = 'location';
    }
    
    this.locationSearchQuery.set(cityName);
    this.locationSearchType.set(searchType);
    this.isLocationSearchActive.set(true);
    // Keep dropdown open instead of closing it
    // this.closeLocationDropdown();
    this.currentPage.set(1);
    
    // Update URL with location search
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        locationSearch: cityName,
        locationType: searchType
      },
      queryParamsHandling: 'merge'
    });
  }

  onLocationInputChange(value: string): void {
    this.locationSearchQuery.set(value);
    if (!this.isLocationDropdownOpen()) {
      this.isLocationDropdownOpen.set(true);
    }
    
    // Trigger location suggestions search if query is long enough
    if (value && value.trim().length >= 1) { // Reduced from 2 to 1 for better responsiveness
      this.isLocationLoading.set(true);
      this.locationSuggestionsService.search(value);
    } else {
      this.locationSuggestions.set([]);
      this.isLocationLoading.set(false);
    }
  }

  // Location modal methods
  openLocationModal(): void {
    this.isLocationModalOpen.set(true);
  }

  closeLocationModal(): void {
    this.isLocationModalOpen.set(false);
    this.locationModalQuery.set('');
    this.locationModalSuggestions.set([]);
  }

  onLocationModalInputChange(query: string): void {
    this.locationModalQuery.set(query);
    if (query.length > 2) {
      this.searchLocationModal(query);
    } else {
      this.locationModalSuggestions.set([]);
    }
  }

  onLocationModalSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchLocationModal(this.locationModalQuery());
    }
  }

  private searchLocationModal(query: string): void {
    if (query.length < 3) return;
    
    this.isLocationModalLoading.set(true);
    this.locationSuggestionsService.searchLocations(query).subscribe({
      next: (suggestions) => {
        this.locationModalSuggestions.set(suggestions);
        this.isLocationModalLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching location suggestions:', error);
        this.locationModalSuggestions.set([]);
        this.isLocationModalLoading.set(false);
      }
    });
  }

  selectLocationFromModal(suggestion: LocationSuggestion): void {
    const cityName = this.locationSuggestionsService.getFormattedLocation(suggestion);
    const searchType = 'location';
    
    this.locationSearchQuery.set(cityName);
    this.locationSearchType.set(searchType);
    this.isLocationSearchActive.set(true);
    this.selectedLocation.set(suggestion.name);
    this.selectedState.set(suggestion.state);
    this.currentPage.set(1);
    
    // Close the modal
    this.closeLocationModal();
    
    // Update URL with location search
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        locationSearch: cityName,
        locationType: searchType
      },
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

  clearLocationFilter(): void {
    this.selectedLocation.set('');
    this.selectedState.set('');
    this.isLocationSearchActive.set(false);
    this.locationSearchQuery.set('');
    this.currentPage.set(1); // Reset to first page when clearing filter
    
    // Remove location filter parameters from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  applyFilters(): void {
    // Close the popup
    this.closeMobilePopups();
    
    // Reset to first page when applying filters
    this.currentPage.set(1);
    
    // The filtering logic is already handled by the computed properties
    // This method just closes the popup and resets pagination
  }

  clearAllSearches(): void {
    this.searchQuery.set('');
    this.isSearchActive.set(false);
    this.locationSearchQuery.set('');
    this.isLocationSearchActive.set(false);
    this.locationSearchType.set('');
    this.locationSuggestions.set([]);
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

  // Track car view when navigating to details
  trackCarView(carId: string): void {
    this.carService.trackCarView(carId).subscribe({
      next: (res: any) => {
        // View tracked successfully
        console.log('Car view tracked:', res);
      },
      error: (error) => {
        console.error('Error tracking car view:', error);
        // Don't prevent navigation if tracking fails
      }
    });
  }

  // Load most browsed cars
  loadMostBrowsedCars(): void {
    this.isLoadingMostBrowsed.set(true);
    this.carService.getMostBrowsedCars(6).subscribe({
      next: (res: any) => {
        const carsData = (res && res.body && res.body.cars) ? res.body.cars : (Array.isArray(res) ? res : []);
        this.mostBrowsedCars.set(carsData);
        this.isLoadingMostBrowsed.set(false);
      },
      error: (error) => {
        console.error('Error loading most browsed cars:', error);
        this.mostBrowsedCars.set([]);
        this.isLoadingMostBrowsed.set(false);
      }
    });
  }

  // Toggle most browsed cars section
  toggleMostBrowsedCars(): void {
    this.showMostBrowsed.set(!this.showMostBrowsed());
    if (this.showMostBrowsed() && this.mostBrowsedCars().length === 0) {
      this.loadMostBrowsedCars();
    }
  }

  // Navigate to car details with view tracking
  navigateToCarDetailsWithTracking(carId: string): void {
    this.trackCarView(carId);
    this.navigateToCarDetails(carId);
  }

  // Mobile detection
  isMobile(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // md breakpoint
    }
    return false;
  }


  // Show pricing information tooltip
  showPricingInfo(event: Event): void {
    event.stopPropagation();
    // The tooltip is handled by CSS hover states, this method can be used for additional functionality if needed
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

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.isLocationDropdownOpen()) return;
    
    const target = event.target as HTMLElement;
    const dropdown = this.elementRef.nativeElement.querySelector('.location-dropdown');
    const button = this.elementRef.nativeElement.querySelector('.location-search-input');
    const input = this.elementRef.nativeElement.querySelector('.location-search-input input');
    
    // Don't close if clicking on dropdown, button, or input
    if (!dropdown?.contains(target) && !button?.contains(target) && !input?.contains(target)) {
      this.closeLocationDropdown();
    }
  }

  // Helper method to format prices with commas
  protected formatPrice(price: number | string | undefined): string {
    if (!price) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return numPrice.toLocaleString('en-IN');
  }
}
