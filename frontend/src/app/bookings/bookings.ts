import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { DialogComponent, DialogConfig } from '../shared/dialog/dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

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
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css'
})
export class Bookings implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  
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
  dialogConfig: DialogConfig = {
    title: '',
    message: '',
    type: 'info'
  };
  
  // Status update
  statusUpdateBooking: Booking | null = null;
  newStatus: 'accepted' | 'rejected' = 'accepted';
  
  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private exportService: ExportService
  ) {}
  
  ngOnInit() {
    this.loadBookings();
  }
  
  loadBookings() {
    this.bookingService.getBookings().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.bookings) {
          this.bookings = response.body.bookings;
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.showErrorDialog('Failed to load bookings. Please try again.');
      }
    });
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
    this.dialogConfig = {
      title: `${status === 'accepted' ? 'Accept' : 'Reject'} Booking`,
      message: `Are you sure you want to ${status === 'accepted' ? 'accept' : 'reject'} this booking?`,
      type: 'confirm',
      confirmText: status === 'accepted' ? 'Accept' : 'Reject',
      cancelText: 'Cancel'
    };
    this.showStatusDialog = true;
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
    this.dialogConfig = {
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      type: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };
    
    // We'll use the status dialog for delete confirmation
    this.statusUpdateBooking = booking;
    this.showStatusDialog = true;
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
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
  
  private showSuccessDialog(message: string) {
    this.dialogConfig = {
      title: 'Success',
      message,
      type: 'success',
      showCancel: false,
      confirmText: 'OK'
    };
    this.showStatusDialog = true;
  }
  
  private showErrorDialog(message: string) {
    this.dialogConfig = {
      title: 'Error',
      message,
      type: 'error',
      showCancel: false,
      confirmText: 'OK'
    };
    this.showStatusDialog = true;
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
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
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

}
