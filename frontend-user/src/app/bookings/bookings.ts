import { Component, OnInit, ChangeDetectorRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking as BookingServiceType } from '../services/booking.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { AuthService } from '../services/auth.service';

interface Car {
  id: string;
  name: string;
  price: string;
}

interface BookingForm {
  fromDate: string;
  toDate: string;
  selectedCar: string;
  comments: string;
}

interface CalendarDay {
  number: number;
  isEmpty: boolean;
  isAvailable: boolean;
  isBooked: boolean;
  isFirstOrLast: boolean;
  isBookedByUser: boolean;
  isBookedByOthers: boolean;
  date?: Date;
}

interface Booking {
  id: string;
  carName: string;
  dateRange: string;
  status: 'Completed' | 'Upcoming';
  fromDate: Date;
  toDate: Date;
}

interface DateFilter {
  from: string;
  to: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.css']
})
export class Bookings implements OnInit {
  // Form data
  bookingForm: BookingForm = {
    fromDate: '',
    toDate: '',
    selectedCar: '',
    comments: ''
  };

  // User's cars (from tickets) - using signals for better change detection
  userCars = signal<Ticket[]>([]);
  selectedCarForAvailability = signal<string>('');
  carBookings = signal<BookingServiceType[]>([]);
  currentUserId = signal<string>('');
  loading = signal<boolean>(false);
  initialLoading = signal<boolean>(true);

  // Available cars
  availableCars: Car[] = [
    { id: 'tesla-model-s', name: 'Tesla Model S', price: '₹3,735/token' },
    { id: 'bmw-m4', name: 'BMW M4', price: '₹2,905/token' },
    { id: 'mercedes-c-class', name: 'Mercedes C-Class', price: '₹4,565/token' },
    { id: 'audi-a4', name: 'Audi A4', price: '₹3,200/token' },
    { id: 'porsche-911', name: 'Porsche 911', price: '₹8,500/token' }
  ];

  // Calendar data
  currentDate: Date = new Date();
  currentMonthDisplay: string = '';
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];

  // Booking data - will be loaded from API - using signals
  bookings = signal<Booking[]>([]);
  filteredBookings = signal<Booking[]>([]);
  showStatusFilter = signal<boolean>(false);
  statusFilter = signal<'all' | 'previous' | 'upcoming'>('all');

  // Date filter
  dateFilter: DateFilter = {
    from: '',
    to: ''
  };

  // Get today's date in YYYY-MM-DD format for date input min attribute
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Booked dates (for calendar display)
  bookedDates: Set<string> = new Set(['2024-07-15', '2024-07-16', '2024-07-17', '2024-07-18', '2024-07-19', '2024-07-20']);

  constructor(
    private bookingService: BookingService,
    private ticketService: TicketService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Effect to handle reactive updates for zoneless change detection
    effect(() => {
      // This will trigger change detection whenever signals change
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    const token = this.authService.getToken();
    this.currentUserId.set(userData?.id || '');
    
    // Check if user is logged in
    if (!this.isUserAuthenticated()) {
      this.initialLoading.set(false);
      return;
    }
    
    // Use setTimeout to ensure proper initialization in zoneless mode
    setTimeout(() => {
      this.loadUserCars();
      this.loadUserBookings();
      this.updateCalendar();
      this.updateBookingsList();
      this.setupDateInputHandlers();
    }, 0);
  }

  private updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update month display
    this.currentMonthDisplay = new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(this.currentDate);

    // Get first day of the month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    this.calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      this.calendarDays.push({
        number: 0,
        isEmpty: true,
        isAvailable: false,
        isBooked: false,
        isFirstOrLast: false,
        isBookedByUser: false,
        isBookedByOthers: false
      });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);
      
      // Check if date is booked by current user or others
      const isBookedByUser = this.bookingService.isBookedByCurrentUser(this.carBookings(), currentDate, this.currentUserId());
      const isBookedByOthers = this.bookingService.isBookedByOthers(this.carBookings(), currentDate, this.currentUserId());
      const isBooked = isBookedByUser || isBookedByOthers;
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = currentDate < today;
      
      this.calendarDays.push({
        number: day,
        isEmpty: false,
        isAvailable: !isBooked && !isPastDate,
        isBooked: isBooked,
        isFirstOrLast: this.isFirstOrLastInBookedRange(dateString),
        isBookedByUser: isBookedByUser,
        isBookedByOthers: isBookedByOthers,
        date: currentDate
      });
    }
    
    // Trigger change detection for zoneless mode
    this.cdr.detectChanges();
  }

  private isFirstOrLastInBookedRange(dateString: string): boolean {
    if (!this.bookedDates.has(dateString)) return false;
    
    const date = new Date(dateString);
    const prevDay = new Date(date);
    prevDay.setDate(date.getDate() - 1);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const prevDateString = prevDay.toISOString().split('T')[0];
    const nextDateString = nextDay.toISOString().split('T')[0];
    
    const hasPrev = this.bookedDates.has(prevDateString);
    const hasNext = this.bookedDates.has(nextDateString);
    
    return !hasPrev || !hasNext;
  }

  private updateBookingsList(): void {
    const bookings = this.bookings();
    const statusFilter = this.statusFilter();
    
    const filtered = bookings.filter(booking => {
      // Apply status filter
      if (statusFilter === 'previous' && booking.status !== 'Completed') return false;
      if (statusFilter === 'upcoming' && booking.status !== 'Upcoming') return false;
      
      // Apply date filter
      if (this.dateFilter.from) {
        const fromDate = new Date(this.dateFilter.from);
        if (booking.fromDate < fromDate) return false;
      }
      
      if (this.dateFilter.to) {
        const toDate = new Date(this.dateFilter.to);
        if (booking.toDate > toDate) return false;
      }
      
      return true;
    });
    
    this.filteredBookings.set(filtered);
  }

  private setupDateInputHandlers(): void {
    // Check if we're in the browser environment
    if (typeof document === 'undefined') {
      return;
    }
    
    // This would be called after view init in a real Angular app
    setTimeout(() => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      dateInputs.forEach((input: Element) => {
        const dateInput = input as HTMLInputElement;
        
        const openPicker = () => {
          if (typeof (dateInput as any).showPicker === 'function') {
            try { 
              (dateInput as any).showPicker(); 
            } catch (e) {
              console.warn('showPicker not supported');
            }
          } else {
            dateInput.focus();
          }
        };

        dateInput.addEventListener('click', openPicker);
        dateInput.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        });
      });
    }, 0);
  }

  // Event handlers
  async onBookingSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.bookingForm.fromDate || !this.bookingForm.toDate || !this.bookingForm.selectedCar) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const fromDate = new Date(this.bookingForm.fromDate);
    const toDate = new Date(this.bookingForm.toDate);
    
    if (fromDate < today) {
      alert('From date cannot be in the past. Please select today or a future date.');
      return;
    }
    
    if (toDate < today) {
      alert('To date cannot be in the past. Please select today or a future date.');
      return;
    }
    
    if (fromDate > toDate) {
      alert('From date cannot be after To date. Please select valid date range.');
      return;
    }

    // Check availability before submitting
    const isAvailable = await this.checkBookingAvailability();
    if (!isAvailable) {
      alert('Selected dates are not available. Please choose different dates.');
      return;
    }

    // Create booking
    const bookingData = {
      carid: this.bookingForm.selectedCar,
      bookingFrom: this.bookingForm.fromDate,
      bookingTo: this.bookingForm.toDate,
      comments: this.bookingForm.comments
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          alert('Booking submitted successfully!');
          // Reset form
          this.bookingForm = {
            fromDate: '',
            toDate: '',
            selectedCar: '',
            comments: ''
          };
          // Reload car bookings to update calendar
          this.loadCarBookings();
          // Reload user bookings to update the list
          this.loadUserBookings();
        } else {
          alert('Failed to create booking. Please try again.');
        }
        // Trigger change detection for zoneless mode
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        alert('Failed to create booking. Please try again.');
        // Trigger change detection for zoneless mode
        this.cdr.detectChanges();
      }
    });
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendar();
    // Trigger change detection for zoneless mode
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendar();
    // Trigger change detection for zoneless mode
    this.cdr.detectChanges();
  }

  selectDate(day: CalendarDay): void {
    if (day.isEmpty || day.isBooked) {
      if (day.isBookedByOthers) {
        alert('This date is already booked by another user. Please select a different date.');
      } else if (day.isBookedByUser) {
        alert('You already have a booking on this date.');
      }
      return;
    }
    
    const selectedDate = day.date;
    if (selectedDate) {
      // Check if the selected date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        alert('Cannot select past dates. Please select today or a future date.');
        return;
      }
      
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // If no from date is selected, set it
      if (!this.bookingForm.fromDate) {
        this.bookingForm.fromDate = dateString;
      } 
      // If from date is selected but no to date, set to date
      else if (!this.bookingForm.toDate) {
        this.bookingForm.toDate = dateString;
      } 
      // If both are selected, start over with new from date
      else {
        this.bookingForm.fromDate = dateString;
        this.bookingForm.toDate = '';
      }
    }
  }

  toggleStatusFilter(): void {
    this.showStatusFilter.set(!this.showStatusFilter());
  }

  filterByStatus(status: 'all' | 'previous' | 'upcoming', event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.statusFilter.set(status);
    this.showStatusFilter.set(false);
    this.updateBookingsList();
  }

  onDateFilterChange(): void {
    this.updateBookingsList();
  }

  // Helper method to check if user is properly authenticated
  isUserAuthenticated(): boolean {
    const token = this.authService.getToken();
    const userData = this.authService.getUserData();
    return !!(token && userData);
  }

  // Load user's cars from their active tickets
  private loadUserCars(): void {
    // Check if user is logged in before making API call
    if (!this.isUserAuthenticated()) {
      this.initialLoading.set(false);
      return;
    }

    this.ticketService.getUserTickets().subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.body.tickets) {
          // Filter only active tickets
          const filteredTickets = response.body.tickets.filter((ticket: Ticket) => 
            ticket.ticketstatus === 'active' && 
            new Date(ticket.ticketexpiry) > new Date()
          );
          
          this.userCars.set(filteredTickets);
          
          // Set first car as default if available
          if (filteredTickets.length > 0) {
            this.selectedCarForAvailability.set(filteredTickets[0].carid._id);
            this.loadCarBookings();
          }
        }
        this.initialLoading.set(false);
      },
      error: (error: any) => {
        this.initialLoading.set(false);
      }
    });
  }

  // Load user's bookings
  private loadUserBookings(): void {
    if (!this.isUserAuthenticated()) {
      return;
    }

    this.bookingService.getUserBookings().subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.body.bookings) {
          // Convert API booking data to component booking format
          const bookingsData = response.body.bookings.map((booking: any) => {
            const fromDate = new Date(booking.bookingFrom);
            const toDate = new Date(booking.bookingTo);
            const now = new Date();
            
            return {
              id: booking._id,
              carName: booking.carid?.carname || 'Unknown Car',
              dateRange: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
              status: toDate < now ? 'Completed' : 'Upcoming',
              fromDate: fromDate,
              toDate: toDate
            };
          });
          
          this.bookings.set(bookingsData);
          // Update filtered bookings
          this.updateBookingsList();
        }
      },
      error: (error: any) => {
        // Handle error silently
      }
    });
  }

  // Load bookings for selected car
  private loadCarBookings(): void {
    const selectedCar = this.selectedCarForAvailability();
    if (!selectedCar) return;
    
    this.loading.set(true);
    this.bookingService.getCarBookings(selectedCar).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.body.bookings) {
          this.carBookings.set(response.body.bookings);
          this.updateCalendar();
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        this.loading.set(false);
      }
    });
  }

  // Handle car selection change
  onCarSelectionChange(): void {
    this.loadCarBookings();
  }

  // Check if booking is available before submission
  private async checkBookingAvailability(): Promise<boolean> {
    if (!this.bookingForm.selectedCar || !this.bookingForm.fromDate || !this.bookingForm.toDate) {
      return false;
    }

    try {
      const response = await this.bookingService.checkBookingAvailability(
        this.bookingForm.selectedCar,
        this.bookingForm.fromDate,
        this.bookingForm.toDate
      ).toPromise();

      return response?.body?.isAvailable || false;
    } catch (error) {
      return false;
    }
  }
}