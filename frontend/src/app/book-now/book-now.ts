import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { BookNowTokenService, BookNowToken, Car, User } from '../services/book-now-token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';

@Component({
  selector: 'app-book-now',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, LoadingDialogComponent],
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
  
  // Dialog element
  private dialogElement: HTMLElement | null = null;

  constructor(
    private bookNowTokenService: BookNowTokenService,
    private userService: UserService,
    private carService: CarService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.getBookNowTokens();
    this.getUsers();
    this.getCars();
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
    const titleEl = this.renderer.createElement('div');
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

  // Font Awesome loading detection
  checkFontAwesomeLoaded(): void{
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
        // Initialize pagination after loading book now tokens
        this.applyFilters();
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
        this.resetForm();
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
