import { Component, OnInit, Renderer2 } from '@angular/core';
import { TokenService, Token, User, Car } from '../services/token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, LoadingDialogComponent],
  templateUrl: './waitlist.html',
  styleUrl: './waitlist.css'
})
export class Waitlist implements OnInit {
  tokens: Token[] = [];
  filteredTokens: Token[] = [];
  users: User[] = [];
  cars: CarType[] = [];
  selectedToken: Token | null = null;
  searchTerm: string = '';
  statusFilter: string = 'all';
  carFilter: string = 'all';
  newToken: Token = {
    carid: '',
    customtokenid: '',
    userid: '',
    amountpaid: 0,
    expirydate: '',
    status: 'active'
  };
  isEditMode: boolean = false;
  currentTokenId: string | null = null;
  
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
    private tokenService: TokenService,
    private userService: UserService,
    private carService: CarService,
    private exportService: ExportService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.getTokens();
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

  checkFontAwesomeLoaded(): void {
    // Check if Font Awesome is loaded by testing if the CSS is available
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

  getTokens(): void {
    this.tokenService.getTokens().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.tokens = response.body.tokens || [];
          this.filteredTokens = [...this.tokens];
          // Initialize pagination after loading tokens
          this.applyFilters();
        } else {
        }
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

  getActiveTokensCount(): number {
    return this.tokens.filter(token => token.status === 'active').length;
  }

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
    this.filteredTokens = this.tokens.filter(token => {
      const matchesSearch = !this.searchTerm || 
        token.customtokenid.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getUser(token).name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getUser(token).email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCar(token).carname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCar(token).brandname.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'all' || token.status === this.statusFilter;
      const matchesCar = this.carFilter === 'all' || token.carid === this.carFilter;

      return matchesSearch && matchesStatus && matchesCar;
    });
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.carFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  getUser(token: Token): User {
    // If userid is already populated (object), return it directly
    if (typeof token.userid === 'object' && token.userid !== null) {
      return token.userid as User;
    }
    
    // If userid is a string, try to find it in the users array
    if (typeof token.userid === 'string') {
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

  getCar(token: Token): Car {
    // If carid is already populated (object), return it directly
    if (typeof token.carid === 'object' && token.carid !== null) {
      return token.carid as Car;
    }
    
    // If carid is a string, try to find it in the cars array
    if (typeof token.carid === 'string') {
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
        expectedpurchasedate: '',
        ticketsavilble: 0,
        totaltickets: 0,
        tokensavailble: 0,
        bookNowTokenAvailable: 0,
        bookNowTokenPrice: 0,
        amcperticket: 0,
        contractYears: 0,
        location: '',
        pincode: '',
        description: '',
        images: [],
        createdBy: '',
        createdByModel: '',
        status: 'inactive',
        createdAt: ''
      };
    }
    
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
      expectedpurchasedate: '',
      ticketsavilble: 0,
      totaltickets: 0,
      tokensavailble: 0,
      bookNowTokenAvailable: 0,
      bookNowTokenPrice: 0,
      amcperticket: 0,
      contractYears: 0,
      location: '',
      pincode: '',
      description: '',
      images: [],
      createdBy: '',
      createdByModel: '',
      status: 'inactive',
      createdAt: ''
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
    this.totalPages = Math.ceil(this.filteredTokens.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPaginatedTokens(): Token[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTokens.slice(startIndex, endIndex);
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

  viewTokenDetails(token: Token): void {
    this.selectedToken = token;
  }

  closeViewModal(): void {
    this.selectedToken = null;
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
    this.showModal();
  }

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

  submitTokenForm(): void {
    if (this.isEditMode && this.currentTokenId) {
      this.updateToken();
    } else {
      this.createToken();
    }
  }

  createToken(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = 'Creating token...';
    
    this.tokenService.createToken(this.newToken).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        if (response.status === 'success') {
          this.getTokens(); // Refresh the list
          this.closeModal();
          this.showSuccessDialog('Token created successfully!');
          // Reset form
          this.newToken = {
            carid: '',
            customtokenid: '',
            userid: '',
            amountpaid: 0,
            expirydate: '',
            status: 'active'
          };
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
          this.getTokens(); // Refresh the list
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
            this.getTokens(); // Refresh the list
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

  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToPDF() {
    // This method is kept for backward compatibility but should not be used
    return;
  }

  exportToExcel() {
    const exportData = this.filteredTokens.map(token => ({
      tokenId: token.customtokenid,
      userName: this.getUser(token).name,
      userEmail: this.getUser(token).email,
      userPhone: this.getUser(token).phone,
      carName: this.getCar(token).carname,
      carBrand: this.getCar(token).brandname,
      carColor: this.getCar(token).color,
      carSeating: this.getCar(token).seating,
      amountPaid: token.amountpaid,
      tokenPrice: this.getCar(token).tokenprice,
      status: token.status,
      date: token.date,
      expiryDate: token.expirydate,
      carLocation: this.getCar(token).location,
      carMileage: this.getCar(token).milege
    }));

    const options: ExportOptions = {
      filename: `waitlist-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Waitlist Management Report',
      columns: [
        { header: 'Token ID', key: 'tokenId', width: 20 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Phone', key: 'userPhone', width: 15 },
        { header: 'Car', key: 'carName', width: 20 },
        { header: 'Brand', key: 'carBrand', width: 20 },
        { header: 'Color', key: 'carColor', width: 15 },
        { header: 'Seating', key: 'carSeating', width: 10 },
        { header: 'Amount Paid', key: 'amountPaid', width: 15 },
        { header: 'Token Price', key: 'tokenPrice', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Expiry Date', key: 'expiryDate', width: 20 },
        { header: 'Car Location', key: 'carLocation', width: 25 },
        { header: 'Car Mileage', key: 'carMileage', width: 15 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

}
