import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { BookNowTokenService, BookNowToken, Car, User } from '../services/book-now-token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';

@Component({
  selector: 'app-book-now',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DialogComponent, LoadingDialogComponent],
  templateUrl: './book-now.html',
  styleUrl: './book-now.css'
})
export class BookNow implements OnInit {
  // Data arrays
  bookNowTokens: BookNowToken[] = [];
  filteredBookNowTokens: BookNowToken[] = [];
  users: User[] = [];
  cars: CarType[] = [];
  selectedBookNowToken: BookNowToken | null = null;

  // Search and filter properties
  searchTerm: string = '';
  statusFilter: string = 'all';
  carFilter: string = 'all';

  // Form properties
  newBookNowToken: Partial<BookNowToken> = {
    customtokenid: '',
    userid: '',
    carid: '',
    amountpaid: 0,
    expirydate: '',
    status: 'active'
  };

  // UI state
  isEditMode: boolean = false;
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
    private bookNowTokenService: BookNowTokenService,
    private userService: UserService,
    private carService: CarService,
    public dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.getBookNowTokens();
    this.getUsers();
    this.getCars();
    this.checkFontAwesomeLoaded();
  }

  // Font Awesome loading detection
  checkFontAwesomeLoaded(): void {
    setTimeout(() => {
      const testElement = document.createElement('i');
      testElement.className = 'fas fa-test';
      testElement.style.fontFamily = 'Font Awesome 5 Free';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const fontFamily = computedStyle.getPropertyValue('font-family');
      
      document.body.removeChild(testElement);
      
      const searchContainer = document.querySelector('.search-input-container');
      if (searchContainer) {
        if (fontFamily.includes('Font Awesome')) {
          searchContainer.classList.add('fa-loaded');
        } else {
          searchContainer.classList.remove('fa-loaded');
        }
      }
    }, 100);
  }

  // Data fetching methods
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
      next: (response) => {
        this.users = response.body.users || [];
      },
      error: (error) => {
      }
    });
  }

  getCars(): void {
    this.carService.getCars().subscribe({
      next: (response) => {
        this.cars = response.body.cars.map((car: any) => ({
          _id: car._id,
          carname: car.carname,
          color: car.color,
          milege: car.milege,
          seating: car.seating,
          features: car.features || [],
          brandname: car.brandname,
          price: car.price,
          fractionprice: car.fractionprice,
          tokenprice: car.tokenprice,
          bookNowTokenPrice: car.bookNowTokenPrice,
          expectedpurchasedate: car.expectedpurchasedate,
          status: car.status || 'active',
          totaltickets: car.totaltickets,
          bookNowTokenAvailable: car.bookNowTokenAvailable,
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
      },
      error: (error) => {
      }
    });
  }

  // Stats methods
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
    let filtered = [...this.bookNowTokens];

    // Search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(token => {
        const user = this.getUser(token);
        const car = this.getCar(token);
        return (
          token.customtokenid.toLowerCase().includes(searchLower) ||
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          car.carname.toLowerCase().includes(searchLower) ||
          car.brandname.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(token => token.status === this.statusFilter);
    }

    // Car filter
    if (this.carFilter !== 'all') {
      filtered = filtered.filter(token => token.carid === this.carFilter);
    }

    this.filteredBookNowTokens = filtered;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.carFilter = 'all';
    this.currentPage = 1;
    this.filteredBookNowTokens = [...this.bookNowTokens];
    this.updatePagination();
  }

  // Helper methods
  getUser(token: BookNowToken): User {
    if (typeof token.userid === 'object' && token.userid !== null) {
      return token.userid as User;
    }
    
    const user = this.users.find(u => u._id === token.userid);
    return user || {
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

  getCar(token: BookNowToken): CarType {
    if (typeof token.carid === 'object' && token.carid !== null) {
      return token.carid as CarType;
    }
    
    const car = this.cars.find(c => c._id === token.carid);
    return car || {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBookNowTokens.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
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

  // Modal methods
  viewBookNowTokenDetails(token: BookNowToken): void {
    this.selectedBookNowToken = token;
  }

  closeViewModal(): void {
    this.selectedBookNowToken = null;
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
    this.showModal();
  }

  closeModal(): void {
    this.hideModal();
  }

  private showModal(): void {
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.classList.remove('hidden');
      (modal as HTMLElement).style.display = 'block';
    }
  }

  private hideModal(): void {
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.classList.add('hidden');
      (modal as HTMLElement).style.display = 'none';
    }
  }

  // Form submission
  submitBookNowTokenForm(): void {
    if (this.isEditMode && this.currentBookNowTokenId) {
      this.updateBookNowToken();
    } else {
      this.createBookNowToken();
    }
  }

  createBookNowToken(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = 'Creating book now token...';
    
    this.bookNowTokenService.createBookNowToken(this.newBookNowToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        this.getBookNowTokens();
        this.closeModal();
        this.resetForm();
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
        this.resetForm();
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

  private resetForm(): void {
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
}
