import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { ExportService, ExportOptions } from '../services/export.service';
import { UserService, User } from '../services/user.service';
import { CarService, Car } from '../services/car.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { BlockedDateService, BlockedDate } from '../services/blocked-date.service';

interface FilterOptions {
  status: string;
  dateRange: string;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css'
})
export class Bookings implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  users: User[] = [];
  cars: Car[] = [];
  filteredCars: Car[] = []; // Cars filtered based on selected user's tickets
  userTickets: Ticket[] = []; // Tickets for the selected user
  
  // Filter and search options
  filters: FilterOptions = {
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Dialog states
  showBookingDialog = false;
  showStatusDialog = false;
  showBookingFormDialog = false;
  
  // Dialog element
  private dialogElement: HTMLElement | null = null;
  
  // Loading state for refresh functionality
  isLoading: boolean = false;
  
  // Status update
  statusUpdateBooking: Booking | null = null;
  newStatus: 'accepted' | 'rejected' = 'accepted';
  
  // Booking form
  isEditMode = false;
  currentBookingId: string | null = null;
  newBooking: Partial<Booking> = {
    userid: '',
    carid: '',
    bookingFrom: '',
    bookingTo: '',
    comments: '',
    status: 'accepted'
  };
  
  // Calendar view
  showCalendarView = false;
  currentDate = new Date();
  
  // Blocked dates
  showBlockedDatesDialog = false;
  blockedDates: BlockedDate[] = [];
  newBlockedDate: Partial<BlockedDate> = {
    carid: '',
    blockedFrom: '',
    blockedTo: '',
    reason: 'Maintenance'
  };
  isEditBlockedDateMode = false;
  currentBlockedDateId: string | null = null;
  
  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private exportService: ExportService,
    private userService: UserService,
    private carService: CarService,
    private ticketService: TicketService,
    private blockedDateService: BlockedDateService,
    private renderer: Renderer2
  ) {}
  
  ngOnInit() {
    this.loadBookings();
    this.loadUsers();
    this.loadCars();
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

  loadBookings() {
    this.isLoading = true;
    this.bookingService.getBookings().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.bookings) {
          this.bookings = response.body.bookings;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.showErrorDialog('Failed to load bookings. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // Refresh functionality
  refreshBookings(): void {
    this.loadBookings();
    this.loadUsers();
    this.loadCars();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.users) {
          this.users = response.body.users;
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadCars() {
    this.carService.getCars().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.cars) {
          this.cars = response.body.cars;
          this.filteredCars = [...this.cars]; // Initialize filtered cars
        }
      },
      error: (error) => {
        console.error('Error loading cars:', error);
      }
    });
  }

  // Get tickets for a specific user
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
    if (this.newBooking.userid) {
      const userId = typeof this.newBooking.userid === 'string' ? this.newBooking.userid : this.newBooking.userid._id;
      this.getUserTickets(userId);
    } else {
      this.userTickets = [];
      this.filteredCars = [...this.cars];
    }
  }
  
  applyFilters() {
    let filtered = [...this.bookings];
    
    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === this.filters.status);
    }
    
    // Date range filter
    if (this.filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (this.filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(booking => 
            new Date(booking.createdAt!).toDateString() === now.toDateString()
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(booking => 
            new Date(booking.createdAt!) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(booking => 
            new Date(booking.createdAt!) >= filterDate
          );
          break;
      }
    }
    
    // Search filter
    if (this.filters.searchTerm) {
      const searchTerm = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        const user = typeof booking.userid === 'object' ? booking.userid : null;
        const car = typeof booking.carid === 'object' ? booking.carid : null;
        
        return (
          user?.name?.toLowerCase().includes(searchTerm) ||
          user?.email?.toLowerCase().includes(searchTerm) ||
          car?.carname?.toLowerCase().includes(searchTerm) ||
          car?.brandname?.toLowerCase().includes(searchTerm) ||
          booking.status.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (this.filters.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt!);
          bValue = new Date(b.createdAt!);
          break;
        case 'bookingFrom':
          aValue = new Date(a.bookingFrom);
          bValue = new Date(b.bookingFrom);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'user':
          aValue = typeof a.userid === 'object' ? a.userid.name : '';
          bValue = typeof b.userid === 'object' ? b.userid.name : '';
          break;
        case 'car':
          aValue = typeof a.carid === 'object' ? a.carid.carname : '';
          bValue = typeof b.carid === 'object' ? b.carid.carname : '';
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (aValue < bValue) return this.filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredBookings = filtered;
    this.updatePagination();
  }
  
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }
  
  get paginatedBookings(): Booking[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookings.slice(startIndex, endIndex);
  }
  
  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  onSortChange(sortBy: string) {
    if (this.filters.sortBy === sortBy) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = 'desc';
    }
    this.applyFilters();
  }
  
  viewBookingDetails(booking: Booking) {
    this.selectedBooking = booking;
    this.showBookingDialog = true;
  }
  
  initiateStatusUpdate(booking: Booking, status: 'accepted' | 'rejected') {
    this.statusUpdateBooking = booking;
    this.newStatus = status;
    this.showConfirmDialog(
      `${status === 'accepted' ? 'Accept' : 'Reject'} Booking`,
      `Are you sure you want to ${status === 'accepted' ? 'accept' : 'reject'} this booking?`,
      () => this.confirmStatusUpdate()
    );
  }
  
  confirmStatusUpdate() {
    if (!this.statusUpdateBooking) return;
    
    this.showStatusDialog = false;
    
    this.bookingService.updateBookingStatus(this.statusUpdateBooking._id!, this.newStatus).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(`Booking ${this.newStatus} successfully!`);
          this.loadBookings();
        } else {
          this.showErrorDialog('Failed to update booking status.');
        }
        this.statusUpdateBooking = null;
      },
      error: (error) => {
        console.error('Error updating booking status:', error);
        this.showErrorDialog('Failed to update booking status. Please try again.');
        this.statusUpdateBooking = null;
      }
    });
  }
  
  deleteBooking(booking: Booking) {
    this.showConfirmDialog(
      'Delete Booking',
      'Are you sure you want to delete this booking? This action cannot be undone.',
      () => {
        this.statusUpdateBooking = booking;
        this.confirmDelete();
      }
    );
  }
  
  confirmDelete() {
    if (!this.statusUpdateBooking) return;
    
    this.showStatusDialog = false;
    
    this.bookingService.deleteBooking(this.statusUpdateBooking._id!).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog('Booking deleted successfully!');
          this.loadBookings();
        } else {
          this.showErrorDialog('Failed to delete booking.');
        }
        this.statusUpdateBooking = null;
      },
      error: (error) => {
        console.error('Error deleting booking:', error);
        this.showErrorDialog('Failed to delete booking. Please try again.');
        this.statusUpdateBooking = null;
      }
    });
  }
  
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateForInput(dateString: string): string {
    // Convert ISO date string to YYYY-MM-DD format for HTML date input
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  
  formatDateRange(from: string, to: string): string {
    const fromDate = new Date(from).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const toDate = new Date(to).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${fromDate} - ${toDate}`;
  }
  
  getUserName(booking: Booking): string {
    return typeof booking.userid === 'object' ? booking.userid.name : 'Unknown User';
  }
  
  getUserEmail(booking: Booking): string {
    return typeof booking.userid === 'object' ? booking.userid.email : '';
  }
  
  getCarName(booking: Booking): string {
    return typeof booking.carid === 'object' ? `${booking.carid.brandname} ${booking.carid.carname}` : 'Unknown Car';
  }
  
  getCarImage(booking: Booking): string {
    if (typeof booking.carid === 'object' && booking.carid.images && booking.carid.images.length > 0) {
      return booking.carid.images[0];
    }
    return '/assets/placeholder-car.jpg';
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-approved';
      case 'rejected':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-rejected';
      default:
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-inactive';
    }
  }
  
  // Add Math property for template access
  Math = Math;
  
  clearFilters() {
    this.filters = {
      status: 'all',
      dateRange: 'all',
      searchTerm: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.onFilterChange();
  }
  
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/assets/placeholder-car.jpg';
    }
  }
  
  getBookingsCountByStatus(status: string): number {
    return this.bookings.filter(booking => booking.status === status).length;
  }
  
  getDaysDifference(from: string, to: string): number {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const timeDifference = toDate.getTime() - fromDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }
  
  trackByBookingId(index: number, booking: Booking): string {
    return booking._id || index.toString();
  }

  // Permission checks
  canCreateBooking(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperAdmin();
  }

  canEditBooking(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperAdmin();
  }

  // Booking form methods
  showCreateBookingModal() {
    this.isEditMode = false;
    this.currentBookingId = null;
    this.newBooking = {
      userid: '',
      carid: '',
      bookingFrom: '',
      bookingTo: '',
      comments: '',
      status: 'accepted'
    };
    // Reset filtered cars and user tickets
    this.userTickets = [];
    this.filteredCars = [...this.cars];
    this.showBookingFormDialog = true;
  }

  editBooking(booking: Booking) {
    this.isEditMode = true;
    this.currentBookingId = booking._id!;
    this.newBooking = {
      userid: typeof booking.userid === 'object' ? booking.userid._id : booking.userid,
      carid: typeof booking.carid === 'object' ? booking.carid._id : booking.carid,
      bookingFrom: this.formatDateForInput(booking.bookingFrom),
      bookingTo: this.formatDateForInput(booking.bookingTo),
      comments: booking.comments || '',
      status: booking.status
    };
    // Load user tickets and filter cars for editing
    if (this.newBooking.userid) {
      const userId = typeof this.newBooking.userid === 'string' ? this.newBooking.userid : this.newBooking.userid._id;
      this.getUserTickets(userId);
    }
    this.showBookingFormDialog = true;
  }

  submitBookingForm() {
    if (!this.newBooking.userid || !this.newBooking.carid || !this.newBooking.bookingFrom || !this.newBooking.bookingTo) {
      this.showErrorDialog('Please fill in all required fields.');
      return;
    }

    if (new Date(this.newBooking.bookingFrom) >= new Date(this.newBooking.bookingTo)) {
      this.showErrorDialog('Booking end date must be after start date.');
      return;
    }

    // Convert dates to ISO format for backend
    const bookingData = {
      ...this.newBooking,
      bookingFrom: new Date(this.newBooking.bookingFrom).toISOString(),
      bookingTo: new Date(this.newBooking.bookingTo).toISOString()
    };

    if (this.isEditMode && this.currentBookingId) {
      this.updateBooking(bookingData);
    } else {
      this.createBooking(bookingData);
    }
  }

  createBooking(bookingData: any) {
    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog('Booking created successfully!');
          this.closeBookingFormDialog();
          this.loadBookings();
        } else {
          this.showErrorDialog('Failed to create booking.');
        }
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.showErrorDialog('Failed to create booking. Please try again.');
      }
    });
  }

  updateBooking(bookingData: any) {
    if (!this.currentBookingId) return;

    this.bookingService.updateBooking(this.currentBookingId, bookingData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog('Booking updated successfully!');
          this.closeBookingFormDialog();
          this.loadBookings();
        } else {
          this.showErrorDialog('Failed to update booking.');
        }
      },
      error: (error) => {
        console.error('Error updating booking:', error);
        this.showErrorDialog('Failed to update booking. Please try again.');
      }
    });
  }

  closeBookingFormDialog() {
    this.showBookingFormDialog = false;
    this.isEditMode = false;
    this.currentBookingId = null;
    this.newBooking = {
      userid: '',
      carid: '',
      bookingFrom: '',
      bookingTo: '',
      comments: '',
      status: 'accepted'
    };
    // Reset filtered cars and user tickets
    this.userTickets = [];
    this.filteredCars = [...this.cars];
  }

  // Calendar view methods
  toggleCalendarView() {
    this.showCalendarView = !this.showCalendarView;
  }

  getBookingsForDate(date: Date): Booking[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.filteredBookings.filter(booking => {
      const fromDate = new Date(booking.bookingFrom).toISOString().split('T')[0];
      const toDate = new Date(booking.bookingTo).toISOString().split('T')[0];
      return dateStr >= fromDate && dateStr <= toDate;
    });
  }

  getCalendarDays(): Date[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  }

  navigateMonth(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }
  
  private showSuccessDialog(message: string) {
    this.showMessageDialog('Success', message, '#10B981');
  }
  
  private showErrorDialog(message: string) {
    this.showMessageDialog('Error', message, '#DC2626');
  }

  closeBookingDialog() {
    this.showBookingDialog = false;
    this.selectedBooking = null;
  }
  
  closeStatusDialog() {
    this.showStatusDialog = false;
    this.statusUpdateBooking = null;
  }

  // Helper methods for template
  getUserLocation(booking: Booking): string {
    const user = booking.userid as any;
    if (user && user.location && user.pincode) {
      return `${user.location}, ${user.pincode}`;
    }
    return user?.location || '';
  }

  getUserDateOfBirth(booking: Booking): string {
    const user = booking.userid as any;
    return user?.dateofbirth || '';
  }

  getCarSeating(booking: Booking): number {
    const car = booking.carid as any;
    return car?.seating || 0;
  }

  getCarStatus(booking: Booking): string {
    const car = booking.carid as any;
    return car?.status || '';
  }

  getCarStatusClass(booking: Booking): string {
    const status = this.getCarStatus(booking);
    switch (status) {
      case 'active':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-approved';
      case 'pending':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-pending';
      default:
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-rejected';
    }
  }

  getCarMileage(booking: Booking): string {
    const car = booking.carid as any;
    return car?.milege || '';
  }

  getCarPincode(booking: Booking): string {
    const car = booking.carid as any;
    return car?.pincode || '';
  }

  getCarTicketsAvailable(booking: Booking): number {
    const car = booking.carid as any;
    return car?.ticketsavilble || 0;
  }

  getCarTotalTickets(booking: Booking): number {
    const car = booking.carid as any;
    return car?.totaltickets || 0;
  }

  getCarFeatures(booking: Booking): string[] {
    const car = booking.carid as any;
    return car?.features || [];
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
    const exportData = this.filteredBookings.map(booking => ({
      userName: this.getUserName(booking),
      userEmail: this.getUserEmail(booking),
      carName: this.getCarName(booking),
      bookingFrom: this.formatDate(booking.bookingFrom),
      bookingTo: this.formatDate(booking.bookingTo),
      bookingDays: this.getDaysDifference(booking.bookingFrom, booking.bookingTo),
      status: booking.status,
      createdDate: this.formatDate(booking.createdAt!),
      userLocation: this.getUserLocation(booking),
      carSeating: this.getCarSeating(booking),
      carMileage: this.getCarMileage(booking),
      carStatus: this.getCarStatus(booking)
    }));

    const options: ExportOptions = {
      filename: `bookings-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Bookings Management Report',
      columns: [
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Car', key: 'carName', width: 25 },
        { header: 'Booking From', key: 'bookingFrom', width: 20 },
        { header: 'Booking To', key: 'bookingTo', width: 20 },
        { header: 'Days', key: 'bookingDays', width: 10 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created Date', key: 'createdDate', width: 20 },
        { header: 'User Location', key: 'userLocation', width: 25 },
        { header: 'Car Seating', key: 'carSeating', width: 15 },
        { header: 'Car Mileage', key: 'carMileage', width: 15 },
        { header: 'Car Status', key: 'carStatus', width: 15 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  // Blocked Dates Methods
  canManageBlockedDates(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === 'admin' || userRole === 'superadmin';
  }

  showBlockedDatesModal(): void {
    this.showBlockedDatesDialog = true;
    this.loadBlockedDates();
  }

  closeBlockedDatesModal(): void {
    this.showBlockedDatesDialog = false;
    this.resetBlockedDateForm();
  }

  loadBlockedDates(): void {
    this.blockedDateService.getBlockedDates().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.blockedDates = response.body.blockedDates || [];
        }
      },
      error: (error) => {
        console.error('Error loading blocked dates:', error);
      }
    });
  }

  createBlockedDate(): void {
    if (!this.newBlockedDate.carid || !this.newBlockedDate.blockedFrom || !this.newBlockedDate.blockedTo) {
      alert('Please fill in all required fields');
      return;
    }

    const blockedDateData = {
      carid: this.newBlockedDate.carid,
      blockedFrom: this.newBlockedDate.blockedFrom,
      blockedTo: this.newBlockedDate.blockedTo,
      reason: this.newBlockedDate.reason || 'Maintenance'
    };

    this.blockedDateService.createBlockedDate(blockedDateData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadBlockedDates();
          this.resetBlockedDateForm();
          alert('Blocked date created successfully');
        } else {
          alert(response.message || 'Failed to create blocked date');
        }
      },
      error: (error) => {
        console.error('Error creating blocked date:', error);
        alert('Failed to create blocked date');
      }
    });
  }

  editBlockedDate(blockedDate: BlockedDate): void {
    this.isEditBlockedDateMode = true;
    this.currentBlockedDateId = blockedDate._id;
    this.newBlockedDate = {
      carid: typeof blockedDate.carid === 'string' ? blockedDate.carid : blockedDate.carid._id,
      blockedFrom: blockedDate.blockedFrom,
      blockedTo: blockedDate.blockedTo,
      reason: blockedDate.reason
    };
  }

  updateBlockedDate(): void {
    if (!this.currentBlockedDateId) return;

    const blockedDateData = {
      blockedFrom: this.newBlockedDate.blockedFrom,
      blockedTo: this.newBlockedDate.blockedTo,
      reason: this.newBlockedDate.reason
    };

    this.blockedDateService.updateBlockedDate(this.currentBlockedDateId, blockedDateData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadBlockedDates();
          this.resetBlockedDateForm();
          alert('Blocked date updated successfully');
        } else {
          alert(response.message || 'Failed to update blocked date');
        }
      },
      error: (error) => {
        console.error('Error updating blocked date:', error);
        alert('Failed to update blocked date');
      }
    });
  }

  deleteBlockedDate(id: string): void {
    if (confirm('Are you sure you want to delete this blocked date?')) {
      this.blockedDateService.deleteBlockedDate(id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.loadBlockedDates();
            alert('Blocked date deleted successfully');
          } else {
            alert(response.message || 'Failed to delete blocked date');
          }
        },
        error: (error) => {
          console.error('Error deleting blocked date:', error);
          alert('Failed to delete blocked date');
        }
      });
    }
  }

  resetBlockedDateForm(): void {
    this.newBlockedDate = {
      carid: '',
      blockedFrom: '',
      blockedTo: '',
      reason: 'Maintenance'
    };
    this.isEditBlockedDateMode = false;
    this.currentBlockedDateId = null;
  }

  getCarNameForBlockedDate(carid: any): string {
    if (typeof carid === 'string') {
      const car = this.cars.find(c => c._id === carid);
      return car ? `${car.carname} - ${car.brandname}` : 'Unknown Car';
    }
    return `${carid.carname} - ${carid.brandname}`;
  }

  getCreatedBy(createdBy: any): string {
    if (typeof createdBy === 'string') {
      return 'Admin';
    }
    return createdBy.name || 'Admin';
  }

}
