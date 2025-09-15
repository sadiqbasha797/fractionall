import { Component, OnInit } from '@angular/core';
import { TokenService, Token, User, Car } from '../services/token.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DialogComponent, LoadingDialogComponent],
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

  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private carService: CarService,
    public dialogService: DialogService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.getTokens();
    this.getUsers();
    this.getCars();
    this.checkFontAwesomeLoaded();
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
        console.log('Tokens response:', response);
        if (response.status === 'success') {
          this.tokens = response.body.tokens || [];
          this.filteredTokens = [...this.tokens];
        } else {
          console.error('Failed to get tokens:', response.message);
        }
      },
      error: (error) => {
        console.error('Error getting tokens:', error);
      }
    });
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        if (response.status === 'success') {
          this.users = response.body.users;
          console.log('Users loaded:', this.users);
        } else {
          console.error('Failed to get users:', response.message);
        }
      },
      error: (error) => {
        console.error('Error getting users:', error);
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
        console.error('Failed to get cars:', response.message);
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
    return token.userid;
  }

  getCar(token: Token): Car {
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
        createdAt: '',
        updatedAt: ''
      };
    }
    return token.carid;
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
          this.dialogService.showSuccess('Success', 'Token created successfully!');
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
          this.getTokens(); // Refresh the list
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
              this.getTokens(); // Refresh the list
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
      console.error('Error in delete confirmation:', error);
    }
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
