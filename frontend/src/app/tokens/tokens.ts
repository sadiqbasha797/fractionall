import { Component, OnInit, inject, Renderer2 } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService, Token, User, Car } from '../services/token.service';
import { BookNowTokenService, BookNowToken } from '../services/book-now-token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, LoadingDialogComponent],
  templateUrl: './tokens.html',
  styleUrl: './tokens.css'
})
export class Tokens implements OnInit {
  // Active tab management
  activeTab: 'waitlist' | 'booknow' = 'waitlist';

  // Data arrays
  tokens: Token[] = [];
  bookNowTokens: BookNowToken[] = [];
  filteredTokens: Token[] = [];
  filteredBookNowTokens: BookNowToken[] = [];
  users: User[] = [];
  cars: CarType[] = [];
  
  // Selected items for detail view
  selectedToken: Token | null = null;
  selectedBookNowToken: BookNowToken | null = null;

  // Search and filter properties
  searchTerm: string = '';
  statusFilter: string = 'all';
  carFilter: string = 'all';
  userFilter: string = 'all';
  amountRangeFilter: string = 'all';
  uniqueUsers: string[] = [];
  uniqueCars: string[] = [];
  showFilters = false;

  // Form properties
  newToken: Token = {
    carid: '',
    customtokenid: '',
    userid: '',
    amountpaid: 0,
    expirydate: '',
    status: 'active'
  };
  
  newBookNowToken: Partial<BookNowToken> = {
    customtokenid: '',
    userid: '',
    carid: '',
    amountpaid: 0,
    expirydate: '',
    status: 'active'
  };

  // Form properties for unified binding
  formUserid: string = '';
  formCarid: string = '';
  formCustomTokenId: string = '';
  formAmountPaid: number = 0;
  formExpiryDate: string = '';
  formStatus: string = 'active';

  // UI state
  isEditMode: boolean = false;
  currentTokenId: string | null = null;
  currentBookNowTokenId: string | null = null;
  
  // Dialog states
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';
  private dialogElement: HTMLElement | null = null;

  // Loading state for refresh functionality
  isLoading: boolean = false;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Permission state
  hasTokensPermission: boolean = true;

  // Make Math available in template
  Math = Math;

  // Inject services
  private tokenService = inject(TokenService);
  private bookNowTokenService = inject(BookNowTokenService);
  private userService = inject(UserService);
  private carService = inject(CarService);
  private exportService = inject(ExportService);
  private authService = inject(AuthService);
  private renderer = inject(Renderer2);

  ngOnInit(): void {
    this.checkPermissions();
    this.loadAllData();
    this.checkFontAwesomeLoaded();
  }

  // Local dialog methods
  showConfirmDialog(title: string, message: string, confirmCallback: () => void): void {
    this.removeDialog();
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '500px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', 'white');
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    const btnContainer = this.renderer.createElement('div');
    this.renderer.setStyle(btnContainer, 'display', 'flex');
    this.renderer.setStyle(btnContainer, 'justify-content', 'flex-end');
    this.renderer.setStyle(btnContainer, 'gap', '12px');
    const cancelBtn = this.renderer.createElement('button');
    const cancelText = this.renderer.createText('Cancel');
    this.renderer.appendChild(cancelBtn, cancelText);
    this.renderer.setStyle(cancelBtn, 'background', '#6B7280');
    this.renderer.setStyle(cancelBtn, 'color', 'white');
    this.renderer.setStyle(cancelBtn, 'border', 'none');
    this.renderer.setStyle(cancelBtn, 'padding', '10px 20px');
    this.renderer.setStyle(cancelBtn, 'border-radius', '8px');
    this.renderer.setStyle(cancelBtn, 'cursor', 'pointer');
    this.renderer.listen(cancelBtn, 'click', () => this.removeDialog());
    const confirmBtn = this.renderer.createElement('button');
    const confirmText = this.renderer.createText('Confirm');
    this.renderer.appendChild(confirmBtn, confirmText);
    this.renderer.setStyle(confirmBtn, 'background', '#DC2626');
    this.renderer.setStyle(confirmBtn, 'color', 'white');
    this.renderer.setStyle(confirmBtn, 'border', 'none');
    this.renderer.setStyle(confirmBtn, 'padding', '10px 20px');
    this.renderer.setStyle(confirmBtn, 'border-radius', '8px');
    this.renderer.setStyle(confirmBtn, 'cursor', 'pointer');
    this.renderer.listen(confirmBtn, 'click', () => {
      this.removeDialog();
      confirmCallback();
    });
    this.renderer.appendChild(btnContainer, cancelBtn);
    this.renderer.appendChild(btnContainer, confirmBtn);
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, btnContainer);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
  }
  removeDialog(): void {
    if (this.dialogElement) {
      this.renderer.removeChild(document.body, this.dialogElement);
      this.dialogElement = null;
    }
  }
  showSuccessDialog(message: string): void {
    this.showMessageDialog('Success', message, '#10B981');
  }
  showErrorDialog(message: string): void {
    this.showMessageDialog('Error', message, '#DC2626');
  }
  showMessageDialog(title: string, message: string, color: string): void {
    this.removeDialog();
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '400px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    this.renderer.setStyle(dialog, 'text-align', 'center');
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', color);
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    this.renderer.setStyle(titleEl, 'font-weight', '600');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    const okBtn = this.renderer.createElement('button');
    const okText = this.renderer.createText('OK');
    this.renderer.appendChild(okBtn, okText);
    this.renderer.setStyle(okBtn, 'background', color);
    this.renderer.setStyle(okBtn, 'color', 'white');
    this.renderer.setStyle(okBtn, 'border', 'none');
    this.renderer.setStyle(okBtn, 'padding', '10px 30px');
    this.renderer.setStyle(okBtn, 'border-radius', '8px');
    this.renderer.setStyle(okBtn, 'cursor', 'pointer');
    this.renderer.setStyle(okBtn, 'font-size', '14px');
    this.renderer.setStyle(okBtn, 'font-weight', '600');
    this.renderer.listen(okBtn, 'click', () => this.removeDialog());
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, okBtn);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
  }

  checkPermissions(): void {
    // Check if admin has tokens permission
    if (this.authService.isAdmin()) {
      const admin = this.authService.getCurrentAdmin();
      if (admin && admin.permissions) {
        this.hasTokensPermission = admin.permissions.includes('tokens');
      }
    } else if (this.authService.isSuperAdmin()) {
      // Superadmin has all permissions
      this.hasTokensPermission = true;
    }
  }

  loadAllData(): void {
    // Only load data if user has tokens permission
    if (this.hasTokensPermission) {
      this.getTokens();
      this.getBookNowTokens();
      this.getUsers();
      this.getCars();
    }
  }

  checkFontAwesomeLoaded(): void {
    setTimeout(() => {
      const testElement = document.createElement('i');
      testElement.className = 'fas fa-search';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement, ':before');
      const fontFamily = computedStyle.getPropertyValue('font-family');
      
      document.body.removeChild(testElement);
      
      const searchContainer = document.querySelector('.search-input-container');
      if (searchContainer) {
        if (fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome')) {
          searchContainer.classList.add('fa-loaded');
        } else {
          searchContainer.classList.remove('fa-loaded');
        }
      }
    }, 100);
  }

  // Tab management
  switchTab(tab: 'waitlist' | 'booknow'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.clearFilters();
  }

  // Data fetching methods
  getTokens(): void {
    this.isLoading = true;
    this.tokenService.getTokens().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          this.tokens = response.body.tokens || [];
          this.filteredTokens = [...this.tokens];
          this.extractUniqueUsersAndCars();
          // Initialize pagination after loading tokens
          this.applyFilters();
        } else {
          console.warn('Failed to fetch tokens:', response.message);
          this.tokens = [];
          this.filteredTokens = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching tokens:', error);
        this.tokens = [];
        this.filteredTokens = [];
        // Don't show error dialog for permission issues, just log and continue
        if (error.status !== 403) {
          this.showErrorDialog('Failed to load tokens. Please try again.');
        }
      }
    });
  }

  getBookNowTokens(): void {
    this.isLoading = true;
    this.bookNowTokenService.getBookNowTokens().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.bookNowTokens = response.body.bookNowTokens || [];
        this.filteredBookNowTokens = [...this.bookNowTokens];
        this.extractUniqueUsersAndCars();
        // Initialize pagination after loading book now tokens
        this.applyFilters();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching book now tokens:', error);
        this.bookNowTokens = [];
        this.filteredBookNowTokens = [];
        // Don't show error dialog for permission issues, just log and continue
        if (error.status !== 403) {
          this.showErrorDialog('Failed to load book now tokens. Please try again.');
        }
      }
    });
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.users = response.body.users;
        } else {
          console.warn('Failed to fetch users:', response.message);
          this.users = [];
        }
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.users = [];
        // Don't show error dialog for permission issues, just log and continue
        if (error.status !== 403) {
          this.showErrorDialog('Failed to load users. Please try again.');
        }
      }
    });
  }

  getCars(): void {
    this.carService.getCars().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.cars = response.body.cars.map((car: any) => ({
            _id: car._id,
            carname: car.carname,
            brandname: car.brandname,
            color: car.color,
            milege: car.milege,
            seating: car.seating,
            features: car.features || [],
            price: car.price,
            fractionprice: car.fractionprice,
            tokenprice: car.tokenprice,
            expectedpurchasedate: car.expectedpurchasedate,
            status: car.status,
            totaltickets: car.totaltickets,
            bookNowTokenAvailable: car.bookNowTokenAvailable,
            bookNowTokenPrice: car.bookNowTokenPrice,
            tokensavailble: car.tokensavailble,
            images: car.images || [],
            createdBy: car.createdBy,
            createdByModel: car.createdByModel,
            createdAt: car.createdAt,
            __v: car.__v,
            ticketsavilble: car.ticketsavilble,
            location: car.location,
            pincode: car.pincode,
            amcperticket: car.amcperticket,
            contractYears: car.contractYears,
            description: car.description || ''
          }));
        } else {
          console.warn('Failed to fetch cars:', response.message);
          this.cars = [];
        }
      },
      error: (error) => {
        console.error('Error fetching cars:', error);
        this.cars = [];
        // Don't show error dialog for permission issues, just log and continue
        if (error.status !== 403) {
          this.showErrorDialog('Failed to load cars. Please try again.');
        }
      }
    });
  }

  // Stats methods
  getActiveTokensCount(): number {
    return this.tokens.filter(token => token.status === 'active').length;
  }

  getActiveBookNowTokensCount(): number {
    return this.bookNowTokens.filter(token => token.status === 'active').length;
  }

  // Search and filter methods
  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onCarFilterChange(): void {
    this.applyFilters();
  }

  onUserFilterChange(): void {
    this.applyFilters();
  }

  onAmountRangeFilterChange(): void {
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    if (this.activeTab === 'waitlist') {
      this.filteredTokens = this.tokens.filter(token => {
        const matchesSearch = !this.searchTerm || 
          token.customtokenid.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getUser(token).name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getUser(token).email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getCar(token).carname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getCar(token).brandname.toLowerCase().includes(this.searchTerm.toLowerCase());

        const matchesStatus = this.statusFilter === 'all' || token.status === this.statusFilter;
        
        // Fix car filter - compare with the actual car ID
        const tokenCarId = typeof token.carid === 'string' ? token.carid : token.carid._id;
        const matchesCar = this.carFilter === 'all' || tokenCarId === this.carFilter;

        // User filter
        const matchesUser = this.userFilter === 'all' || 
          this.getUser(token).name === this.userFilter;

        // Amount range filter
        const amountPaid = token.amountpaid || 0;
        const matchesAmountRange = this.amountRangeFilter === 'all' ||
          (this.amountRangeFilter === '0-1000' && amountPaid >= 0 && amountPaid <= 1000) ||
          (this.amountRangeFilter === '1000-5000' && amountPaid > 1000 && amountPaid <= 5000) ||
          (this.amountRangeFilter === '5000-10000' && amountPaid > 5000 && amountPaid <= 10000) ||
          (this.amountRangeFilter === '10000+' && amountPaid > 10000);

        return matchesSearch && matchesStatus && matchesCar && matchesUser && matchesAmountRange;
      });
    } else {
      let filtered = [...this.bookNowTokens];

      if (this.searchTerm.trim()) {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(token => {
          const user = this.getBookNowUser(token);
          const car = this.getBookNowCar(token);
          return (
            token.customtokenid.toLowerCase().includes(searchLower) ||
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            car.carname.toLowerCase().includes(searchLower) ||
            car.brandname.toLowerCase().includes(searchLower)
          );
        });
      }

      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(token => token.status === this.statusFilter);
      }

      if (this.carFilter !== 'all') {
        // Fix car filter for book now tokens - compare with the actual car ID
        filtered = filtered.filter(token => {
          const tokenCarId = typeof token.carid === 'string' ? token.carid : token.carid._id;
          return tokenCarId === this.carFilter;
        });
      }

      // User filter for book now tokens
      if (this.userFilter !== 'all') {
        filtered = filtered.filter(token => {
          const user = this.getBookNowUser(token);
          return user.name === this.userFilter;
        });
      }

      // Amount range filter for book now tokens
      if (this.amountRangeFilter !== 'all') {
        filtered = filtered.filter(token => {
          const amountPaid = token.amountpaid || 0;
          return (this.amountRangeFilter === '0-1000' && amountPaid >= 0 && amountPaid <= 1000) ||
                 (this.amountRangeFilter === '1000-5000' && amountPaid > 1000 && amountPaid <= 5000) ||
                 (this.amountRangeFilter === '5000-10000' && amountPaid > 5000 && amountPaid <= 10000) ||
                 (this.amountRangeFilter === '10000+' && amountPaid > 10000);
        });
      }

      this.filteredBookNowTokens = filtered;
    }
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.carFilter = 'all';
    this.userFilter = 'all';
    this.amountRangeFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  extractUniqueUsersAndCars(): void {
    const allUsers = new Set<string>();
    const allCars = new Set<string>();

    // Extract from waitlist tokens
    this.tokens.forEach(token => {
      const user = this.getUser(token);
      const car = this.getCar(token);
      if (user.name) allUsers.add(user.name);
      if (car.carname) allCars.add(car.carname);
    });

    // Extract from book now tokens
    this.bookNowTokens.forEach(token => {
      const user = this.getBookNowUser(token);
      const car = this.getBookNowCar(token);
      if (user.name) allUsers.add(user.name);
      if (car.carname) allCars.add(car.carname);
    });

    this.uniqueUsers = Array.from(allUsers);
    this.uniqueCars = Array.from(allCars);
  }

  // Helper methods for waitlist tokens
  getUser(token: Token): User {
    // If userid is already populated (object), return it directly
    if (typeof token.userid === 'object' && token.userid !== null) {
      return token.userid as User;
    }
    
    // If userid is a string, try to find it in the users array
    if (typeof token.userid === 'string') {
      const user = this.users.find(u => u._id === token.userid);
      return user || this.getDefaultUser();
    }
    
    return this.getDefaultUser();
  }

  getCar(token: Token): Car {
    // If carid is already populated (object), return it directly
    if (typeof token.carid === 'object' && token.carid !== null) {
      return token.carid as Car;
    }
    
    // If carid is a string, try to find it in the cars array
    if (typeof token.carid === 'string') {
      const car = this.cars.find(c => c._id === token.carid);
      return car || this.getDefaultCar();
    }
    
    return this.getDefaultCar();
  }

  // Helper methods for book now tokens
  getBookNowUser(token: BookNowToken): User {
    // If userid is already populated (object), return it directly
    if (typeof token.userid === 'object' && token.userid !== null) {
      return token.userid as User;
    }
    
    // If userid is a string, try to find it in the users array
    if (typeof token.userid === 'string') {
      const user = this.users.find(u => u._id === token.userid);
      return user || this.getDefaultUser();
    }
    
    return this.getDefaultUser();
  }

  getBookNowCar(token: BookNowToken): CarType {
    // If carid is already populated (object), return it directly
    if (typeof token.carid === 'object' && token.carid !== null) {
      return token.carid as CarType;
    }
    
    // If carid is a string, try to find it in the cars array
    if (typeof token.carid === 'string') {
      const car = this.cars.find(c => c._id === token.carid);
      return car || this.getDefaultCar();
    }
    
    return this.getDefaultCar();
  }

  private getDefaultUser(): User {
    return {
      _id: '',
      name: 'Unknown User',
      email: 'unknown@example.com',
      phone: '',
      dateofbirth: '',
      address: '',
      location: '',
      pincode: '',
      kycStatus: 'pending',
      profileimage: '',
      governmentid: {},
      createdAt: '',
      updatedAt: ''
    };
  }

  private getDefaultCar(): CarType {
    return {
      _id: '',
      carname: 'Unknown Car',
      color: '',
      milege: '',
      seating: 0,
      features: [],
      brandname: 'Unknown Brand',
      price: 0,
      fractionprice: 0,
      tokenprice: 0,
      bookNowTokenPrice: 0,
      expectedpurchasedate: '',
      status: 'active',
      totaltickets: 0,
      bookNowTokenAvailable: 0,
      tokensavailble: 0,
      images: [],
      createdBy: '',
      createdByModel: '',
      createdAt: '',
      ticketsavilble: 0,
      location: '',
      pincode: '',
      amcperticket: 0,
      contractYears: 0,
      description: ''
    };
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openDatePicker(fieldId: string) {
    // Programmatically trigger the date picker
    const dateInput = document.getElementById(fieldId) as HTMLInputElement;
    if (dateInput) {
      dateInput.focus();
      // Try modern showPicker() method first
      if (dateInput.showPicker) {
        dateInput.showPicker();
      } else {
        // Fallback: trigger click event to open picker
        dateInput.click();
      }
    }
  }

  // Pagination methods
  updatePagination(): void {
    const totalItems = this.activeTab === 'waitlist' ? 
      this.filteredTokens.length : 
      this.filteredBookNowTokens.length;
    
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPaginatedTokens(): Token[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTokens.slice(startIndex, endIndex);
  }

  getPaginatedBookNowTokens(): BookNowToken[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookNowTokens.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Modal methods for waitlist tokens
  viewTokenDetails(token: Token): void {
    this.selectedToken = token;
  }

  closeViewModal(): void {
    this.selectedToken = null;
    this.selectedBookNowToken = null;
  }

  showCreateTokenModal(): void {
    this.isEditMode = false;
    this.currentTokenId = null;
    this.newToken = {
      carid: '',
      customtokenid: '',
      userid: '',
      amountpaid: 0,
      expirydate: '',
      status: 'active'
    };
    this.syncFormFields();
    this.showModal();
  }

  editToken(token: Token): void {
    this.isEditMode = true;
    this.currentTokenId = token._id || null;
    this.newToken = {
      carid: typeof token.carid === 'string' ? token.carid : token.carid._id || '',
      customtokenid: token.customtokenid,
      userid: typeof token.userid === 'string' ? token.userid : token.userid._id || '',
      amountpaid: token.amountpaid,
      expirydate: token.expirydate,
      status: token.status
    };
    this.syncFormFields();
    this.showModal();
  }

  // Modal methods for book now tokens
  viewBookNowTokenDetails(token: BookNowToken): void {
    this.selectedBookNowToken = token;
  }

  showCreateBookNowTokenModal(): void {
    this.isEditMode = false;
    this.currentBookNowTokenId = null;
    this.newBookNowToken = {
      customtokenid: '',
      userid: '',
      carid: '',
      amountpaid: 0,
      expirydate: '',
      status: 'active'
    };
    this.syncFormFields();
    this.showModal();
  }

  editBookNowToken(token: BookNowToken): void {
    this.isEditMode = true;
    this.currentBookNowTokenId = token._id || null;
    this.newBookNowToken = {
      customtokenid: token.customtokenid,
      userid: typeof token.userid === 'string' ? token.userid : token.userid._id || '',
      carid: typeof token.carid === 'string' ? token.carid : token.carid._id || '',
      amountpaid: token.amountpaid,
      expirydate: token.expirydate,
      status: token.status
    };
    this.syncFormFields();
    this.showModal();
  }

  // Modal helper methods
  showModal(): void {
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeModal(): void {
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Form submission methods
  submitTokenForm(): void {
    this.updateFormData(); // Sync form fields back to the appropriate object
    if (this.activeTab === 'waitlist') {
      if (this.isEditMode && this.currentTokenId) {
        this.updateToken();
      } else {
        this.createToken();
      }
    } else {
      if (this.isEditMode && this.currentBookNowTokenId) {
        this.updateBookNowToken();
      } else {
        this.createBookNowToken();
      }
    }
  }

  // Waitlist token CRUD operations
  createToken(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = 'Creating token...';
    
    this.tokenService.createToken(this.newToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        if (response.status === 'success') {
          this.getTokens();
          this.closeModal();
          this.showSuccessDialog('Token created successfully!');
          this.resetTokenForm();
        } else {
          this.showErrorDialog(`Failed to create token: ${response.message}`);
        }
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error creating token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  updateToken(): void {
    if (!this.currentTokenId) return;

    this.showLoadingDialog = true;
    this.loadingMessage = 'Updating token...';

    this.tokenService.updateToken(this.currentTokenId, this.newToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        if (response.status === 'success') {
          this.getTokens();
          this.closeModal();
          this.showSuccessDialog('Token updated successfully!');
        } else {
          this.showErrorDialog(`Failed to update token: ${response.message}`);
        }
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error updating token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  deleteToken(token: Token): void {
    if (!token._id) return;

    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete Token ${token.customtokenid}?`, () => {
      this.showLoadingDialog = true;
      this.loadingMessage = 'Deleting token...';
      
      this.tokenService.deleteToken(token._id!).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getTokens();
            this.showSuccessDialog('Token deleted successfully!');
          } else {
            this.showErrorDialog(`Failed to delete token: ${response.message}`);
          }
        },
        error: (error) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error deleting token: ${error.message || 'Unknown error'}`);
        }
      });
    });
  }

  // Book now token CRUD operations
  createBookNowToken(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = 'Creating book now token...';
    
    this.bookNowTokenService.createBookNowToken(this.newBookNowToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        this.getBookNowTokens();
        this.closeModal();
        this.resetBookNowTokenForm();
        this.showSuccessDialog('Book now token created successfully!');
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error creating book now token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  updateBookNowToken(): void {
    if (!this.currentBookNowTokenId) return;

    this.showLoadingDialog = true;
    this.loadingMessage = 'Updating book now token...';

    this.bookNowTokenService.updateBookNowToken(this.currentBookNowTokenId, this.newBookNowToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        this.getBookNowTokens();
        this.closeModal();
        this.resetBookNowTokenForm();
        this.showSuccessDialog('Book now token updated successfully!');
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error updating book now token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  deleteBookNowToken(token: BookNowToken): void {
    if (!token._id) return;

    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete Book Now Token ${token.customtokenid}?`, () => {
      this.showLoadingDialog = true;
      this.loadingMessage = 'Deleting book now token...';
      
      this.bookNowTokenService.deleteBookNowToken(token._id!).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          this.getBookNowTokens();
          this.showSuccessDialog('Book now token deleted successfully!');
        },
        error: (error) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error deleting book now token: ${error.message || 'Unknown error'}`);
        }
      });
    });
  }

  private resetTokenForm(): void {
    this.newToken = {
      carid: '',
      customtokenid: '',
      userid: '',
      amountpaid: 0,
      expirydate: '',
      status: 'active'
    };
    this.isEditMode = false;
    this.currentTokenId = null;
  }

  private resetBookNowTokenForm(): void {
    this.newBookNowToken = {
      customtokenid: '',
      userid: '',
      carid: '',
      amountpaid: 0,
      expirydate: '',
      status: 'active'
    };
    this.isEditMode = false;
    this.currentBookNowTokenId = null;
  }

  // Sync form fields when switching tabs or opening modals
  private syncFormFields(): void {
    if (this.activeTab === 'waitlist') {
      this.formUserid = typeof this.newToken.userid === 'string' ? this.newToken.userid : '';
      this.formCarid = typeof this.newToken.carid === 'string' ? this.newToken.carid : '';
      this.formCustomTokenId = this.newToken.customtokenid;
      this.formAmountPaid = this.newToken.amountpaid;
      this.formExpiryDate = this.newToken.expirydate;
      this.formStatus = this.newToken.status;
    } else {
      this.formUserid = typeof this.newBookNowToken.userid === 'string' ? this.newBookNowToken.userid || '' : '';
      this.formCarid = typeof this.newBookNowToken.carid === 'string' ? this.newBookNowToken.carid || '' : '';
      this.formCustomTokenId = this.newBookNowToken.customtokenid || '';
      this.formAmountPaid = this.newBookNowToken.amountpaid || 0;
      this.formExpiryDate = this.newBookNowToken.expirydate || '';
      this.formStatus = this.newBookNowToken.status || 'active';
    }
  }

  // Update the appropriate form object when form fields change
  updateFormData(): void {
    if (this.activeTab === 'waitlist') {
      this.newToken.userid = this.formUserid;
      this.newToken.carid = this.formCarid;
      this.newToken.customtokenid = this.formCustomTokenId;
      this.newToken.amountpaid = this.formAmountPaid;
      this.newToken.expirydate = this.formExpiryDate;
      this.newToken.status = this.formStatus as 'active' | 'expired' | 'dropped';
    } else {
      this.newBookNowToken.userid = this.formUserid;
      this.newBookNowToken.carid = this.formCarid;
      this.newBookNowToken.customtokenid = this.formCustomTokenId;
      this.newBookNowToken.amountpaid = this.formAmountPaid;
      this.newBookNowToken.expirydate = this.formExpiryDate;
      this.newBookNowToken.status = this.formStatus as 'active' | 'expired' | 'dropped';
    }
  }

  // Refresh functionality
  refreshTokens(): void {
    this.getTokens();
  }

  refreshBookNowTokens(): void {
    this.getBookNowTokens();
  }

  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToExcel() {
    if (this.activeTab === 'waitlist') {
      const exportData = this.filteredTokens.map(token => ({
        tokenId: token.customtokenid,
        userName: this.getUser(token).name,
        userEmail: this.getUser(token).email,
        userPhone: this.getUser(token).phone,
        carName: this.getCar(token).carname,
        carBrand: this.getCar(token).brandname,
        carColor: this.getCar(token).color,
        amountPaid: token.amountpaid,
        tokenPrice: this.getCar(token).tokenprice,
        status: token.status,
        date: token.date,
        expiryDate: token.expirydate,
        carLocation: this.getCar(token).location,
        carSeating: this.getCar(token).seating
      }));

      const options: ExportOptions = {
        filename: `waitlist-tokens-${new Date().toISOString().split('T')[0]}`,
        title: 'Waitlist Tokens Report',
        columns: [
          { header: 'Token ID', key: 'tokenId', width: 20 },
          { header: 'User Name', key: 'userName', width: 25 },
          { header: 'Email', key: 'userEmail', width: 30 },
          { header: 'Phone', key: 'userPhone', width: 15 },
          { header: 'Car', key: 'carName', width: 20 },
          { header: 'Brand', key: 'carBrand', width: 20 },
          { header: 'Color', key: 'carColor', width: 15 },
          { header: 'Amount Paid', key: 'amountPaid', width: 15 },
          { header: 'Token Price', key: 'tokenPrice', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Date', key: 'date', width: 20 },
          { header: 'Expiry Date', key: 'expiryDate', width: 20 },
          { header: 'Car Location', key: 'carLocation', width: 25 },
          { header: 'Car Seating', key: 'carSeating', width: 10 }
        ],
        data: exportData
      };

      this.exportService.exportToExcel(options);
    } else {
      const exportData = this.filteredBookNowTokens.map(token => ({
        tokenId: token.customtokenid,
        userName: this.getBookNowUser(token).name,
        userEmail: this.getBookNowUser(token).email,
        userPhone: this.getBookNowUser(token).phone,
        carName: this.getBookNowCar(token).carname,
        carBrand: this.getBookNowCar(token).brandname,
        carColor: this.getBookNowCar(token).color,
        amountPaid: token.amountpaid,
        tokenPrice: this.getBookNowCar(token).bookNowTokenPrice,
        status: token.status,
        date: token.date,
        expiryDate: token.expirydate,
        carLocation: this.getBookNowCar(token).location,
        carSeating: this.getBookNowCar(token).seating
      }));

      const options: ExportOptions = {
        filename: `booknow-tokens-${new Date().toISOString().split('T')[0]}`,
        title: 'Book Now Tokens Report',
        columns: [
          { header: 'Token ID', key: 'tokenId', width: 20 },
          { header: 'User Name', key: 'userName', width: 25 },
          { header: 'Email', key: 'userEmail', width: 30 },
          { header: 'Phone', key: 'userPhone', width: 15 },
          { header: 'Car', key: 'carName', width: 20 },
          { header: 'Brand', key: 'carBrand', width: 20 },
          { header: 'Color', key: 'carColor', width: 15 },
          { header: 'Amount Paid', key: 'amountPaid', width: 15 },
          { header: 'Token Price', key: 'tokenPrice', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Date', key: 'date', width: 20 },
          { header: 'Expiry Date', key: 'expiryDate', width: 20 },
          { header: 'Car Location', key: 'carLocation', width: 25 },
          { header: 'Car Seating', key: 'carSeating', width: 10 }
        ],
        data: exportData
      };

      this.exportService.exportToExcel(options);
    }
  }

  // Approve token refund
  approveTokenRefund(token: any) {
    if (confirm('Are you sure you want to approve the refund for this token?')) {
      this.tokenService.approveTokenRefund(token._id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            alert('Token refund approved successfully');
            this.getTokens();
          } else {
            alert('Failed to approve refund: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error approving token refund:', error);
          alert('Failed to approve refund. Please try again.');
        }
      });
    }
  }

  // Reject token refund
  rejectTokenRefund(token: any) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null && reason.trim() !== '') {
      this.tokenService.rejectTokenRefund(token._id, reason).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            alert('Token refund rejected successfully');
            this.getTokens();
          } else {
            alert('Failed to reject refund: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error rejecting token refund:', error);
          alert('Failed to reject refund. Please try again.');
        }
      });
    }
  }

  // Approve book now token refund
  approveBookNowTokenRefund(token: any) {
    if (confirm('Are you sure you want to approve the refund for this book now token?')) {
      this.bookNowTokenService.approveBookNowTokenRefund(token._id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            alert('Book now token refund approved successfully');
            this.getBookNowTokens();
          } else {
            alert('Failed to approve refund: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error approving book now token refund:', error);
          alert('Failed to approve refund. Please try again.');
        }
      });
    }
  }

  // Reject book now token refund
  rejectBookNowTokenRefund(token: any) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason !== null && reason.trim() !== '') {
      this.bookNowTokenService.rejectBookNowTokenRefund(token._id, reason).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            alert('Book now token refund rejected successfully');
            this.getBookNowTokens();
          } else {
            alert('Failed to reject refund: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error rejecting book now token refund:', error);
          alert('Failed to reject refund. Please try again.');
        }
      });
    }
  }
}
