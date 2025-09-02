import { Component, AfterViewInit, OnInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import AOS from 'aos'; // Import AOS properly
import 'aos/dist/aos.css'; // Import AOS CSS
import { CarPublicService } from '../services/car-public.service';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css']
})
export class Cars implements OnInit, AfterViewInit {
  cars: any[] = [];
  allCars: any[] = []; // Store all cars
  filteredCars: any[] = []; // Store filtered and sorted cars
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  totalItems: number = 0;
  paginatedCars: any[] = [];
  
  // Filter and Sort properties
  currentFilter: string = 'All';
  currentSort: string = 'A-Z (Sort by Car Name)';
  private dropdownsInitialized: boolean = false;
  
  // Search properties
  searchQuery: string = '';
  searchType: string = '';
  isSearchActive: boolean = false;
  
  // Make Math available to template
  Math = Math;

  constructor(
    private carService: CarPublicService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  ngOnInit(): void {
    // Check for search parameters in URL
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.searchType = params['type'] || 'location';
        this.isSearchActive = true;
        console.log('Search parameters found:', { search: this.searchQuery, type: this.searchType });
      }
    });

    // Fetch public cars from backend
    this.carService.getPublicCars().subscribe({
      next: (res: any) => {
        // API returns { status, body: { cars }, message }
        this.allCars = (res && res.body && res.body.cars) ? res.body.cars : (Array.isArray(res) ? res : []);
        this.applyFiltersAndSort();
        this.updatePagination();
      },
      error: () => {
        this.allCars = [];
        this.cars = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize AOS only on the client side
    if (this.isBrowser()) {
      AOS.init({
        duration: 1000,
        easing: 'ease',
        once: false
      });
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
      
      console.log(`Looking for dropdown: ${button}`, { btn, menuEl }); // Debug log
      
      if (!btn || !menuEl) {
        console.warn(`Dropdown elements not found for ${button}`);
        return;
      }
      
      foundElements++;
      
      // Button click handler
      this.renderer.listen(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`Dropdown clicked: ${button}`); // Debug log
        
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
          console.log(`Menu item clicked: ${linkText} in ${menu}`); // Debug log
          
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
      console.log('Dropdowns initialized successfully');
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

  // Filter and Sort methods
  applyFiltersAndSort(): void {
    console.log('applyFiltersAndSort called');
    console.log('allCars count:', this.allCars.length);
    console.log('currentFilter:', this.currentFilter);
    console.log('currentSort:', this.currentSort);
    console.log('searchQuery:', this.searchQuery);
    console.log('searchType:', this.searchType);
    
    // Apply search filter first
    let searchFilteredCars = this.allCars;
    if (this.isSearchActive && this.searchQuery) {
      searchFilteredCars = this.applySearchFilter(this.allCars, this.searchQuery, this.searchType);
    }
    
    // Apply other filters
    this.filteredCars = this.applyFilter(searchFilteredCars, this.currentFilter);
    
    // Then apply sorting
    this.filteredCars = this.applySort(this.filteredCars, this.currentSort);
    
    // Update pagination info
    this.totalItems = this.filteredCars.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page when filter/sort changes
    
    console.log('Final filteredCars count:', this.filteredCars.length);
  }

  applySearchFilter(cars: any[], searchQuery: string, searchType: string): any[] {
    console.log('applySearchFilter called with:', { searchQuery, searchType, carsCount: cars.length });
    
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
    
    console.log('Search filtered cars count:', filteredCars.length);
    return filteredCars;
  }

  applyFilter(cars: any[], filter: string): any[] {
    console.log('applyFilter called with:', filter, 'cars count:', cars.length);
    
    let filteredCars: any[];
    switch (filter) {
      case 'All':
        filteredCars = [...cars];
        break;
      case 'Book Now':
        // Cars with tokens available (can book now)
        filteredCars = cars.filter(car => {
          const hasTokens = (car.tokensavailble && car.tokensavailble > 0) || 
                           (car.bookNowTokenAvailable && car.bookNowTokenAvailable > 0);
          console.log(`Car ${car.carname}: tokensavailble=${car.tokensavailble}, bookNowTokenAvailable=${car.bookNowTokenAvailable}, hasTokens=${hasTokens}`);
          return hasTokens;
        });
        break;
      case 'Join Waitlist':
        // Cars without tokens available (need to join waitlist)
        filteredCars = cars.filter(car => {
          const needsWaitlist = (!car.tokensavailble || car.tokensavailble === 0) && 
                               (!car.bookNowTokenAvailable || car.bookNowTokenAvailable === 0);
          console.log(`Car ${car.carname}: needs waitlist=${needsWaitlist}`);
          return needsWaitlist;
        });
        break;
      case 'Relevance':
        // Sort by relevance (active status first, then by creation date)
        filteredCars = cars.filter(car => car.status === 'active');
        break;
      default:
        filteredCars = [...cars];
    }
    
    console.log('Filtered cars count:', filteredCars.length);
    return filteredCars;
  }

  applySort(cars: any[], sort: string): any[] {
    console.log('applySort called with:', sort, 'cars count:', cars.length);
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
          console.log(`Sorting: ${a.carname} (${priceA}) vs ${b.carname} (${priceB})`);
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
    
    console.log('Sorted cars count:', result.length);
    return result;
  }

  // Filter and Sort event handlers
  onFilterChange(filter: string): void {
    console.log('onFilterChange called with:', filter);
    this.currentFilter = filter;
    this.applyFiltersAndSort();
    this.updatePagination();
    console.log('After filter change - cars count:', this.cars.length);
  }

  onSortChange(sort: string): void {
    console.log('onSortChange called with:', sort);
    this.currentSort = sort;
    this.applyFiltersAndSort();
    this.updatePagination();
    console.log('After sort change - cars count:', this.cars.length);
  }

  // Pagination methods
  updatePagination(): void {
    console.log('updatePagination called');
    console.log('currentPage:', this.currentPage);
    console.log('itemsPerPage:', this.itemsPerPage);
    console.log('filteredCars count:', this.filteredCars.length);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.cars = this.filteredCars.slice(startIndex, endIndex);
    
    console.log('startIndex:', startIndex, 'endIndex:', endIndex);
    console.log('Final cars to display:', this.cars.length);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
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
    this.goToPage(this.totalPages);
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, this.currentPage + 2);
      
      // Adjust if we're at the beginning or end
      if (this.currentPage <= 3) {
        end = maxVisiblePages;
      } else if (this.currentPage >= this.totalPages - 2) {
        start = this.totalPages - maxVisiblePages + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Search functionality methods
  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.isSearchActive = true;
      this.searchType = this.isPincode(this.searchQuery.trim()) ? 'pincode' : 'location';
      this.applyFiltersAndSort();
      this.updatePagination();
      
      // Update URL with search parameters
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchQuery.trim(),
          type: this.searchType
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
    this.searchQuery = '';
    this.isSearchActive = false;
    this.searchType = '';
    this.applyFiltersAndSort();
    this.updatePagination();
    
    // Remove search parameters from URL
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
    if (!this.isSearchActive || !this.searchQuery) {
      return '';
    }
    
    const typeText = this.searchType === 'pincode' ? 'Pincode' : 'Location';
    return `Searching by ${typeText}: "${this.searchQuery}"`;
  }

  // Navigation method for car details
  navigateToCarDetails(carId: string): void {
    if (carId) {
      this.router.navigate(['/car-details', carId]);
    }
  }
}
