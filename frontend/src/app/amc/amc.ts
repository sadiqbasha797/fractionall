import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmcService, AMC, AMCAmount, PaymentStatusUpdate } from '../services/amc.service';
import { UserService, User } from '../services/user.service';
import { CarService, Car } from '../services/car.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { DialogComponent, DialogConfig } from '../shared/dialog/dialog.component';

@Component({
  selector: 'app-amc',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './amc.html',
  styleUrl: './amc.css'
})
export class Amc implements OnInit {
  amcs: AMC[] = [];
  users: User[] = [];
  cars: Car[] = [];
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
  showDialog = false;
  dialogConfig: DialogConfig = {
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    showCancel: true,
    showClose: true,
    size: 'md'
  };
  
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
    private ticketService: TicketService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadData();
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
    this.dialogConfig = {
      title: 'Delete AMC',
      message: `Are you sure you want to delete this AMC for ${this.getUserName(amc)}?`,
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true,
      showClose: true,
      size: 'md'
    };
    this.showDialog = true;
    
    // Store the AMC to delete
    this.editingAmc = amc;
  }

  confirmDelete() {
    if (this.editingAmc?._id) {
      this.isSubmitting = true;
      this.amcService.deleteAMC(this.editingAmc._id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.successMessage = 'AMC deleted successfully!';
            this.loadData();
          } else {
            this.errorMessage = response.message || 'Failed to delete AMC';
          }
          this.isSubmitting = false;
          this.showDialog = false;
        },
        error: (error) => {
          console.error('Error deleting AMC:', error);
          this.errorMessage = 'Failed to delete AMC. Please try again.';
          this.isSubmitting = false;
          this.showDialog = false;
        }
      });
    }
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Dialog methods
  onDialogConfirm() {
    this.confirmDelete();
  }

  onDialogCancel() {
    this.showDialog = false;
    this.editingAmc = null;
  }

  onDialogClose() {
    this.showDialog = false;
    this.editingAmc = null;
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
  exportToCSV() {
    const csvData = this.filteredAmcs.map(amc => ({
      'User Name': this.getUserName(amc),
      'User Email': this.getUserEmail(amc),
      'Car': this.getCarName(amc),
      'Ticket ID': this.getTicketId(amc),
      'Years': amc.amcamount.map(a => a.year).join(', '),
      'Total Amount': this.getTotalAmount(amc),
      'Paid Amount': this.getPaidAmount(amc),
      'Pending Amount': this.getPendingAmount(amc),
      'Status': this.getPaymentStatus(amc),
      'Created Date': this.formatDate(amc.createdAt || ''),
      'Payment Details': amc.amcamount.map(a => 
        `${a.year}: ${a.paid ? 'Paid' : 'Unpaid'} (${this.formatCurrency(a.amount)})`
      ).join('; ')
    }));

    this.downloadCSV(csvData, 'amc-data.csv');
  }

  exportToExcel() {
    // For Excel export, we'll use a simple CSV format that can be opened in Excel
    this.exportToCSV();
  }

  private downloadCSV(data: any[], filename: string) {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
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
}
