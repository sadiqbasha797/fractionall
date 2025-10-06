import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmcService, AMC, AMCAmount, PaymentStatusUpdate } from '../services/amc.service';
import { UserService, User } from '../services/user.service';
import { CarService, Car } from '../services/car.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-amc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './amc.html',
  styleUrl: './amc.css'
})
export class Amc implements OnInit {
  amcs: AMC[] = [];
  users: User[] = [];
  cars: Car[] = [];
  filteredCars: Car[] = []; // Cars filtered based on selected user's tickets
  userTickets: Ticket[] = []; // Tickets for the selected user
  tickets: Ticket[] = [];
  filteredAmcs: AMC[] = [];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Search and filter
  searchTerm = '';
  statusFilter = 'all';
  yearFilter = 'all';
  
  // Form data
  showCreateForm = false;
  showEditForm = false;
  editingAmc: AMC | null = null;
  
  // Form fields
  selectedUserId = '';
  selectedCarId = '';
  selectedTicketId = '';
  amcAmounts: AMCAmount[] = [];
  
  // Dialog
  private dialogElement: HTMLElement | null = null;
  
  // Loading states
  isSubmitting = false;
  
  // Error handling
  errorMessage = '';
  successMessage = '';

  // User role and permissions
  currentUser: any = null;
  userRole: string = '';
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  constructor(
    private amcService: AmcService,
    private userService: UserService,
    private carService: CarService,
    private ticketService: TicketService,
    private exportService: ExportService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadData();
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

  checkUserRole() {
    // Check if user is logged in and get their role
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const admin = localStorage.getItem('admin');
    const superAdmin = localStorage.getItem('superadmin');
    
    // If no role data in localStorage, try to get it from JWT token
    if (!user && !admin && !superAdmin && token) {
      try {
        const payload = this.parseJWT(token);
        
        if (payload.role === 'admin') {
          this.userRole = 'admin';
          this.isAdmin = true;
          this.isSuperAdmin = false;
        } else if (payload.role === 'superadmin') {
          this.userRole = 'superadmin';
          this.isAdmin = true;
          this.isSuperAdmin = true;
        } else if (payload.role === 'user') {
          this.userRole = 'user';
          this.isAdmin = false;
          this.isSuperAdmin = false;
        }
      } catch (error) {
        console.error('Error parsing JWT:', error);
      }
    } else {
      // Use localStorage data if available
      if (superAdmin) {
        this.currentUser = JSON.parse(superAdmin);
        this.userRole = 'superadmin';
        this.isSuperAdmin = true;
        this.isAdmin = true;
      } else if (admin) {
        this.currentUser = JSON.parse(admin);
        this.userRole = 'admin';
        this.isAdmin = true;
        this.isSuperAdmin = false;
      } else if (user) {
        this.currentUser = JSON.parse(user);
        this.userRole = 'user';
        this.isAdmin = false;
        this.isSuperAdmin = false;
      }
    }
  }

  parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  loadData() {
    this.errorMessage = '';
    
    // Load all data in parallel
    Promise.all([
      this.amcService.getAMCs().toPromise(),
      this.userService.getUsers().toPromise(),
      this.carService.getCars().toPromise(),
      this.ticketService.getTickets().toPromise()
    ]).then(([amcResponse, userResponse, carResponse, ticketResponse]) => {
      if (amcResponse?.status === 'success') {
        this.amcs = amcResponse.body.amcs || [];
        this.filteredAmcs = [...this.amcs];
        this.calculatePagination();
      }
      
      if (userResponse?.status === 'success') {
        this.users = userResponse.body.users || [];
      }
      
      if (carResponse?.status === 'success') {
        this.cars = carResponse.body.cars || [];
        this.filteredCars = [...this.cars]; // Initialize filtered cars with all cars
      }
      
      if (ticketResponse?.status === 'success') {
        this.tickets = ticketResponse.body.tickets || [];
      }
    }).catch(error => {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load data. Please try again.';
    });
  }

  // Search and filter methods
  onSearch() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onYearFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredAmcs = this.amcs.filter(amc => {
      const matchesSearch = this.searchTerm === '' || 
        this.getUserName(amc).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCarName(amc).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getTicketId(amc).toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || 
        this.getPaymentStatus(amc) === this.statusFilter;
      
      const matchesYear = this.yearFilter === 'all' || 
        amc.amcamount.some(amount => amount.year.toString() === this.yearFilter);
      
      return matchesSearch && matchesStatus && matchesYear;
    });
    
    this.currentPage = 1;
    this.calculatePagination();
  }

  // Pagination methods
  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredAmcs.length / this.itemsPerPage);
  }

  getPaginatedAmcs(): AMC[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAmcs.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // CRUD operations
  showCreateAMCForm() {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.editingAmc = null;
    this.resetForm();
  }

  showEditAMCForm(amc: AMC) {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingAmc = amc;
    this.populateForm(amc);
  }

  resetForm() {
    this.selectedUserId = '';
    this.selectedCarId = '';
    this.selectedTicketId = '';
    this.amcAmounts = [];
    this.addNewYear();
  }

  populateForm(amc: AMC) {
    this.selectedUserId = typeof amc.userid === 'string' ? amc.userid : (amc.userid._id || '');
    this.selectedCarId = typeof amc.carid === 'string' ? amc.carid : (amc.carid._id || '');
    this.selectedTicketId = typeof amc.ticketid === 'string' ? amc.ticketid : (amc.ticketid._id || '');
    this.amcAmounts = [...amc.amcamount];
  }

  addNewYear() {
    const currentYear = new Date().getFullYear();
    const lastYear = this.amcAmounts.length > 0 ? 
      Math.max(...this.amcAmounts.map(a => a.year)) : currentYear - 1;
    
    this.amcAmounts.push({
      year: lastYear + 1,
      amount: 0,
      paid: false,
      penality: 0
    });
  }

  removeYear(index: number) {
    if (this.amcAmounts.length > 1) {
      this.amcAmounts.splice(index, 1);
    }
  }

  onSubmit() {
    if (this.showCreateForm) {
      this.createAMC();
    } else if (this.showEditForm) {
      this.updateAMC();
    }
  }

  createAMC() {
    if (!this.validateForm()) return;
    
    this.isSubmitting = true;
    const amcData = {
      userid: this.selectedUserId,
      carid: this.selectedCarId,
      ticketid: this.selectedTicketId,
      amcamount: this.amcAmounts
    };
    
    this.amcService.createAMC(amcData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'AMC created successfully!';
          this.loadData();
          this.closeForms();
        } else {
          this.errorMessage = response.message || 'Failed to create AMC';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating AMC:', error);
        this.errorMessage = 'Failed to create AMC. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  updateAMC() {
    if (!this.validateForm() || !this.editingAmc?._id) return;
    
    this.isSubmitting = true;
    const amcData = {
      amcamount: this.amcAmounts
    };
    
    this.amcService.updateAMC(this.editingAmc._id, amcData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'AMC updated successfully!';
          this.loadData();
          this.closeForms();
        } else {
          this.errorMessage = response.message || 'Failed to update AMC';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating AMC:', error);
        this.errorMessage = 'Failed to update AMC. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  deleteAMC(amc: AMC) {
    this.showConfirmDialog('Delete AMC', `Are you sure you want to delete this AMC for ${this.getUserName(amc)}?`, () => {
      if (amc._id) {
        this.isSubmitting = true;
        this.amcService.deleteAMC(amc._id).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.successMessage = 'AMC deleted successfully!';
              this.loadData();
            } else {
              this.errorMessage = response.message || 'Failed to delete AMC';
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error deleting AMC:', error);
            this.errorMessage = 'Failed to delete AMC. Please try again.';
            this.isSubmitting = false;
          }
        });
      }
    });
  }

  updatePaymentStatus(amc: AMC, yearIndex: number, paid: boolean) {
    if (!amc._id) return;
    
    const paymentData: PaymentStatusUpdate = {
      yearIndex,
      paid,
      paiddate: paid ? new Date().toISOString() : undefined
    };
    
    this.amcService.updateAMCPaymentStatus(amc._id, paymentData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'Payment status updated successfully!';
          this.loadData();
        } else {
          this.errorMessage = response.message || 'Failed to update payment status';
        }
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.errorMessage = 'Failed to update payment status. Please try again.';
      }
    });
  }

  // Helper methods
  validateForm(): boolean {
    if (!this.selectedUserId || !this.selectedCarId || !this.selectedTicketId) {
      this.errorMessage = 'Please select user, car, and ticket';
      return false;
    }
    
    if (this.amcAmounts.length === 0) {
      this.errorMessage = 'Please add at least one year of AMC amount';
      return false;
    }
    
    for (const amount of this.amcAmounts) {
      if (amount.amount <= 0) {
        this.errorMessage = 'AMC amount must be greater than 0';
        return false;
      }
    }
    
    return true;
  }

  closeForms() {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingAmc = null;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Display helper methods
  getUserName(amc: AMC): string {
    if (typeof amc.userid === 'string') {
      const user = this.users.find(u => u._id === amc.userid);
      return user ? user.name : 'Unknown User';
    }
    return amc.userid.name;
  }

  getCarName(amc: AMC): string {
    if (typeof amc.carid === 'string') {
      const car = this.cars.find(c => c._id === amc.carid);
      return car ? `${car.brandname} ${car.carname}` : 'Unknown Car';
    }
    return `${amc.carid.brandname} ${amc.carid.carname}`;
  }

  getTicketId(amc: AMC): string {
    if (typeof amc.ticketid === 'string') {
      const ticket = this.tickets.find(t => t._id === amc.ticketid);
      return ticket ? ticket.ticketcustomid : 'Unknown Ticket';
    }
    return amc.ticketid.ticketcustomid;
  }

  getPaymentStatus(amc: AMC): string {
    const totalYears = amc.amcamount.length;
    const paidYears = amc.amcamount.filter(amount => amount.paid).length;
    
    if (paidYears === 0) return 'unpaid';
    if (paidYears === totalYears) return 'paid';
    return 'partial';
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-approved';
      case 'partial': return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-pending';
      case 'unpaid': return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-rejected';
      default: return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-inactive';
    }
  }

  getTotalAmount(amc: AMC): number {
    return amc.amcamount.reduce((total, amount) => total + amount.amount, 0);
  }

  getPaidAmount(amc: AMC): number {
    return amc.amcamount
      .filter(amount => amount.paid)
      .reduce((total, amount) => total + amount.amount, 0);
  }

  getPendingAmount(amc: AMC): number {
    return this.getTotalAmount(amc) - this.getPaidAmount(amc);
  }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  // Additional helper methods for template
  getUniqueYears(): number[] {
    const years = new Set<number>();
    this.amcs.forEach(amc => {
      amc.amcamount.forEach(amount => {
        years.add(amount.year);
      });
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToExcel() {
    const exportData = this.filteredAmcs.map(amc => ({
      userName: this.getUserName(amc),
      userEmail: this.getUserEmail(amc),
      carName: this.getCarName(amc),
      ticketId: this.getTicketId(amc),
      years: this.getAMCYears(amc),
      totalAmount: this.getTotalAmount(amc),
      paidAmount: this.getPaidAmount(amc),
      pendingAmount: this.getPendingAmount(amc),
      status: this.getPaymentStatus(amc),
      createdDate: this.formatDate(amc.createdAt || ''),
      paymentDetails: amc.amcamount.map(a => 
        `${a.year}: ${a.paid ? 'Paid' : 'Unpaid'} (${this.formatCurrency(a.amount)})`
      ).join('; ')
    }));

    const options: ExportOptions = {
      filename: `amc-data-${new Date().toISOString().split('T')[0]}`,
      title: 'AMC Management Report',
      columns: [
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Car', key: 'carName', width: 25 },
        { header: 'Ticket ID', key: 'ticketId', width: 20 },
        { header: 'Years', key: 'years', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 },
        { header: 'Paid Amount', key: 'paidAmount', width: 20 },
        { header: 'Pending Amount', key: 'pendingAmount', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created Date', key: 'createdDate', width: 20 },
        { header: 'Payment Details', key: 'paymentDetails', width: 50 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  getUserEmail(amc: AMC): string {
    if (typeof amc.userid === 'string') {
      const user = this.users.find(u => u._id === amc.userid);
      return user ? user.email : 'Unknown Email';
    }
    return amc.userid.email;
  }

  getCarBrand(amc: AMC): string {
    if (typeof amc.carid === 'string') {
      const car = this.cars.find(c => c._id === amc.carid);
      return car ? car.brandname : 'Unknown Brand';
    }
    return amc.carid.brandname || 'Unknown Brand';
  }

  getTicketPrice(amc: AMC): number {
    if (typeof amc.ticketid === 'string') {
      const ticket = this.tickets.find(t => t._id === amc.ticketid);
      return ticket ? ticket.ticketprice : 0;
    }
    return amc.ticketid.ticketprice || 0;
  }

  getAMCYears(amc: AMC): string {
    return amc.amcamount.map(amount => amount.year).join(', ');
  }

  getPaidAMCsCount(): number {
    return this.amcs.filter(amc => this.getPaymentStatus(amc) === 'paid').length;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.yearFilter = 'all';
    this.applyFilters();
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  // User ticket filtering methods
  getUserTickets(userId: string) {
    if (!userId) {
      this.userTickets = [];
      this.filteredCars = [...this.cars];
      return;
    }

    this.ticketService.getTickets().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.tickets) {
          // Filter tickets for the selected user
          this.userTickets = response.body.tickets.filter((ticket: Ticket) => {
            const ticketUserId = typeof ticket.userid === 'string' ? ticket.userid : ticket.userid._id;
            return ticketUserId === userId && ticket.ticketstatus === 'active';
          });
          
          // Filter cars based on user's tickets
          this.filterCarsByUserTickets();
        } else {
          this.userTickets = [];
          this.filteredCars = [...this.cars];
        }
      },
      error: (error) => {
        console.error('Error loading user tickets:', error);
        this.userTickets = [];
        this.filteredCars = [...this.cars];
      }
    });
  }

  // Filter cars based on user's tickets
  filterCarsByUserTickets() {
    if (this.userTickets.length === 0) {
      this.filteredCars = [];
      return;
    }

    // Get car IDs from user's tickets
    const userCarIds = this.userTickets.map(ticket => {
      return typeof ticket.carid === 'string' ? ticket.carid : ticket.carid._id;
    });

    // Filter cars to only include those the user has tickets for
    this.filteredCars = this.cars.filter(car => userCarIds.includes(car._id!));
  }

  // Handle user selection change
  onUserSelectionChange() {
    if (this.selectedUserId) {
      this.getUserTickets(this.selectedUserId);
      // Reset car and ticket selections when user changes
      this.selectedCarId = '';
      this.selectedTicketId = '';
    } else {
      this.userTickets = [];
      this.filteredCars = [...this.cars];
      this.selectedCarId = '';
      this.selectedTicketId = '';
    }
  }
}
