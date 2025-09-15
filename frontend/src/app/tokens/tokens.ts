import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService, Token, User, Car } from '../services/token.service';
import { BookNowTokenService, BookNowToken } from '../services/book-now-token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DialogComponent, LoadingDialogComponent],
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

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Make Math available in template
  Math = Math;

  constructor(
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private userService: UserService,
    private carService: CarService,
    public dialogService: DialogService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
    this.checkFontAwesomeLoaded();
  }

  loadAllData(): void {
    this.getTokens();
    this.getBookNowTokens();
    this.getUsers();
    this.getCars();
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
    this.tokenService.getTokens().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.tokens = response.body.tokens || [];
          this.filteredTokens = [...this.tokens];
        } else {
        }
      },
      error: (error) => {
      }
    });
  }

  getBookNowTokens(): void {
    this.bookNowTokenService.getBookNowTokens().subscribe({
      next: (response) => {
        this.bookNowTokens = response.body.bookNowTokens || [];
        this.filteredBookNowTokens = [...this.bookNowTokens];
      },
      error: (error) => {
      }
    });
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.users = response.body.users;
        } else {
        }
      },
      error: (error) => {
      }
    });
  }

  getCars(): void {
    this.carService.getCars().subscribe((response) => {
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

        return matchesSearch && matchesStatus && matchesCar;
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

      this.filteredBookNowTokens = filtered;
    }
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.carFilter = 'all';
    this.currentPage = 1;
    if (this.activeTab === 'waitlist') {
      this.filteredTokens = [...this.tokens];
    } else {
      this.filteredBookNowTokens = [...this.bookNowTokens];
    }
    this.updatePagination();
  }

  // Helper methods for waitlist tokens
  getUser(token: Token): User {
    if (typeof token.userid === 'string') {
      const user = this.users.find(u => u._id === token.userid);
      return user || this.getDefaultUser();
    }
    return token.userid;
  }

  getCar(token: Token): Car {
    if (typeof token.carid === 'string') {
      const car = this.cars.find(c => c._id === token.carid);
      return car || this.getDefaultCar();
    }
    return token.carid;
  }

  // Helper methods for book now tokens
  getBookNowUser(token: BookNowToken): User {
    if (typeof token.userid === 'object' && token.userid !== null) {
      return token.userid as User;
    }
    
    const user = this.users.find(u => u._id === token.userid);
    return user || this.getDefaultUser();
  }

  getBookNowCar(token: BookNowToken): CarType {
    if (typeof token.carid === 'object' && token.carid !== null) {
      return token.carid as CarType;
    }
    
    const car = this.cars.find(c => c._id === token.carid);
    return car || this.getDefaultCar();
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
          this.dialogService.showSuccess('Success', 'Token created successfully!');
          this.resetTokenForm();
        } else {
          this.dialogService.showError('Error', `Failed to create token: ${response.message}`);
        }
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.dialogService.showError('Error', `Error creating token: ${error.message || 'Unknown error'}`);
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
          this.dialogService.showSuccess('Success', 'Token updated successfully!');
        } else {
          this.dialogService.showError('Error', `Failed to update token: ${response.message}`);
        }
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.dialogService.showError('Error', `Error updating token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  async deleteToken(token: Token): Promise<void> {
    if (!token._id) return;

    try {
      const confirmed = await this.dialogService.confirmDelete(`Token ${token.customtokenid}`);
      if (confirmed) {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting token...';
        
        this.tokenService.deleteToken(token._id).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            if (response.status === 'success') {
              this.getTokens();
              this.dialogService.showSuccess('Success', 'Token deleted successfully!');
            } else {
              this.dialogService.showError('Error', `Failed to delete token: ${response.message}`);
            }
          },
          error: (error) => {
            this.showLoadingDialog = false;
            this.dialogService.showError('Error', `Error deleting token: ${error.message || 'Unknown error'}`);
          }
        });
      }
    } catch (error) {
    }
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
        this.dialogService.showSuccess('Success', 'Book now token created successfully!');
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.dialogService.showError('Error', `Error creating book now token: ${error.message || 'Unknown error'}`);
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
        this.dialogService.showSuccess('Success', 'Book now token updated successfully!');
      },
      error: (error) => {
        this.showLoadingDialog = false;
        this.dialogService.showError('Error', `Error updating book now token: ${error.message || 'Unknown error'}`);
      }
    });
  }

  async deleteBookNowToken(token: BookNowToken): Promise<void> {
    if (!token._id) return;

    try {
      const confirmed = await this.dialogService.confirmDelete(`Book Now Token ${token.customtokenid}`);
      if (confirmed) {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting book now token...';
        
        this.bookNowTokenService.deleteBookNowToken(token._id).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            this.getBookNowTokens();
            this.dialogService.showSuccess('Success', 'Book now token deleted successfully!');
          },
          error: (error) => {
            this.showLoadingDialog = false;
            this.dialogService.showError('Error', `Error deleting book now token: ${error.message || 'Unknown error'}`);
          }
        });
      }
    } catch (error) {
    }
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
}