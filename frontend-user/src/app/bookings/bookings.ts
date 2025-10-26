import { Component, OnInit, AfterViewInit, ChangeDetectorRef, signal, effect, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, Booking as BookingServiceType } from '../services/booking.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { AuthService } from '../services/auth.service';
import { BlockedDateService, BlockedDate } from '../services/blocked-date.service';

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
  isBlocked: boolean;
  blockedReason?: string;
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
export class Bookings implements OnInit, AfterViewInit {
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
  bookingSubmissionLoading = signal<boolean>(false);

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
  
  // Dropdown states for embedded filters
  protected isStatusDropdownOpen = signal<boolean>(false);

  // Blocked dates data
  blockedDates = signal<BlockedDate[]>([]);
  loadingBlockedDates = signal<boolean>(false);

  // Date filter
  dateFilter: DateFilter = {
    from: '',
    to: ''
  };

  // Booking rules validation
  protected validationErrors = signal<string[]>([]);
  protected weekendBookingsCount = signal<number>(0);
  protected maxWeekendBookings = 5;
  protected maxAdvanceBookingMonths = 3;

  // Get today's date in YYYY-MM-DD format for date input min attribute
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get maximum date for advance booking (3 months from today)
  protected get maxAdvanceDate(): string {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + this.maxAdvanceBookingMonths);
    return maxDate.toISOString().split('T')[0];
  }

  // Booked dates (for calendar display)
  bookedDates: Set<string> = new Set(['2024-07-15', '2024-07-16', '2024-07-17', '2024-07-18', '2024-07-19', '2024-07-20']);

  constructor(
    private bookingService: BookingService,
    private ticketService: TicketService,
    public authService: AuthService,
    private blockedDateService: BlockedDateService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef
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
      this.initializeDropdowns();
    }, 0);
  }

  private updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Debug: Log current blocked dates
    console.log('Current blocked dates in updateCalendar:', this.blockedDates());
    
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
        isBookedByOthers: false,
        isBlocked: false
      });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = this.formatDateForComparison(currentDate);
      
      // Check if date is booked by current user or others
      const isBookedByUser = this.bookingService.isBookedByCurrentUser(this.carBookings(), currentDate, this.currentUserId());
      const isBookedByOthers = this.bookingService.isBookedByOthers(this.carBookings(), currentDate, this.currentUserId());
      const isBooked = isBookedByUser || isBookedByOthers;
      
      // Check if date is blocked
      const blockedDateInfo = this.blockedDateService.getBlockedDateInfo(this.blockedDates(), currentDate);
      const isBlocked = !!blockedDateInfo;
      
      // Debug logging for blocked dates
      if (isBlocked) {
        console.log(`Date ${dateString} is blocked:`, blockedDateInfo);
      }
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = currentDate < today;
      
      this.calendarDays.push({
        number: day,
        isEmpty: false,
        isAvailable: !isBooked && !isPastDate && !isBlocked,
        isBooked: isBooked,
        isFirstOrLast: this.isFirstOrLastInBookedRange(dateString),
        isBookedByUser: isBookedByUser,
        isBookedByOthers: isBookedByOthers,
        isBlocked: isBlocked,
        blockedReason: blockedDateInfo?.reason,
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
    
    const prevDateString = this.formatDateForComparison(prevDay);
    const nextDateString = this.formatDateForComparison(nextDay);
    
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

  ngAfterViewInit(): void {
    // Initialize dropdowns after view is initialized
    if (typeof document !== 'undefined') {
      // Use multiple setTimeout attempts to ensure DOM is fully rendered
      setTimeout(() => this.initializeDropdowns(), 100);
      setTimeout(() => this.initializeDropdowns(), 500);
      setTimeout(() => this.initializeDropdowns(), 1000);
    }
  }

  private initializeDropdowns(): void {
    // Check if we're in the browser environment
    if (typeof document === 'undefined') {
      return;
    }
    
    const dropdowns = [
      { button: 'status-dropdown', menu: 'status-menu' }
    ];

    let foundElements = 0;
    dropdowns.forEach(({ button, menu }) => {
      const btn = this.elementRef.nativeElement.querySelector(`#${button}`);
      const menuEl = this.elementRef.nativeElement.querySelector(`#${menu}`);
      
      if (!btn || !menuEl) {
        console.log(`Dropdown elements not found: ${button}, ${menu}`);
        return;
      }
      
      foundElements++;
      
      // Remove any existing listeners to prevent duplicates
      if (btn.hasAttribute('data-listener-added')) {
        return;
      }
      btn.setAttribute('data-listener-added', 'true');
      
      // Button click handler
      this.renderer.listen(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(({ menu: m }) => {
          const el = this.elementRef.nativeElement.querySelector(`#${m}`);
          if (el && m !== menu) {
            this.renderer.addClass(el, 'hidden');
          }
        });
        
        // Toggle current dropdown and blur state
        if (menuEl.classList.contains('hidden')) {
          this.renderer.removeClass(menuEl, 'hidden');
          if (menu === 'status-menu') {
            this.isStatusDropdownOpen.set(true);
          }
        } else {
          this.renderer.addClass(menuEl, 'hidden');
          this.isStatusDropdownOpen.set(false);
        }
      });

      // Handle menu item clicks
      const links = menuEl.querySelectorAll('a');
      links.forEach((link: Element) => {
        this.renderer.listen(link, 'click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const linkText = link.textContent?.trim() || '';
          
          // Close all dropdowns and blur state
          dropdowns.forEach(({ menu: m }) => {
            const el = this.elementRef.nativeElement.querySelector(`#${m}`);
            if (el) this.renderer.addClass(el, 'hidden');
          });
          this.isStatusDropdownOpen.set(false);
          
          // Update button label
          const label = btn.querySelector('p');
          if (label) label.textContent = linkText;
          btn.setAttribute('data-active', linkText);
          
          // Apply filter based on which dropdown
          if (menu === 'status-menu') {
            let status: 'all' | 'previous' | 'upcoming' = 'all';
            if (linkText === 'Previous') status = 'previous';
            else if (linkText === 'Upcoming') status = 'upcoming';
            this.filterByStatus(status);
          }
        });
      });
    });
    
    console.log(`Found ${foundElements} dropdown elements`);
  }

  // Real-time validation when form fields change
  protected onFormFieldChange(): void {
    if (this.bookingForm.fromDate && this.bookingForm.toDate && this.bookingForm.selectedCar) {
      this.validateBookingRules();
      this.updateWeekendBookingCount();
    } else {
      this.validationErrors.set([]);
      this.weekendBookingsCount.set(0);
    }
  }

  // Update weekend booking count for display
  private updateWeekendBookingCount(): void {
    if (!this.bookingForm.selectedCar) {
      this.weekendBookingsCount.set(0);
      return;
    }

    const selectedCar = this.bookingForm.selectedCar;
    const currentYear = new Date().getFullYear();

    // Find the selected car from user's cars to get the car name
    const selectedCarData = this.userCars().find(car => car.carid._id === selectedCar);
    if (!selectedCarData) {
      this.weekendBookingsCount.set(0);
      return;
    }

    const weekendBookings = this.bookings().filter(booking => {
      const bookingFrom = new Date(booking.fromDate);
      const bookingTo = new Date(booking.toDate);
      const bookingYear = bookingFrom.getFullYear();
      
      // Check if booking is for the same car and in the current year
      if (bookingYear !== currentYear || !booking.carName.includes(selectedCarData.carid.carname)) {
        return false;
      }

      // Check if booking includes any weekend days
      let currentDate = new Date(bookingFrom);
      while (currentDate <= bookingTo) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          return true;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return false;
    });

    this.weekendBookingsCount.set(weekendBookings.length);
  }

  // Event handlers
  async onBookingSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.bookingForm.fromDate || !this.bookingForm.toDate || !this.bookingForm.selectedCar) {
      alert('Please fill in all required fields');
      return;
    }

    // Set loading state
    this.bookingSubmissionLoading.set(true);

    // Validate dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const fromDate = new Date(this.bookingForm.fromDate);
    const toDate = new Date(this.bookingForm.toDate);
    
    if (fromDate < today) {
      alert('From date cannot be in the past. Please select today or a future date.');
      this.bookingSubmissionLoading.set(false);
      return;
    }
    
    if (toDate < today) {
      alert('To date cannot be in the past. Please select today or a future date.');
      this.bookingSubmissionLoading.set(false);
      return;
    }
    
    if (fromDate > toDate) {
      alert('From date cannot be after To date. Please select valid date range.');
      this.bookingSubmissionLoading.set(false);
      return;
    }

    // Validate booking rules
    if (!this.validateBookingRules()) {
      const errorMessage = this.validationErrors().join('\n');
      alert(errorMessage);
      this.bookingSubmissionLoading.set(false);
      return;
    }

    // Check for blocked dates
    const blockedDatesInRange = this.blockedDateService.hasBlockedDatesInRange(
      this.blockedDates(), 
      fromDate, 
      toDate
    );
    
    if (blockedDatesInRange.length > 0) {
      const blockedDateInfo = blockedDatesInRange[0];
      const reason = blockedDateInfo.reason || 'Maintenance';
      alert(`Selected dates are blocked due to ${reason.toLowerCase()}. Please choose different dates.`);
      this.bookingSubmissionLoading.set(false);
      return;
    }

    // Check availability before submitting
    const isAvailable = await this.checkBookingAvailability();
    if (!isAvailable) {
      alert('Selected dates are not available. Please choose different dates.');
      this.bookingSubmissionLoading.set(false);
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
        this.bookingSubmissionLoading.set(false);
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
        this.bookingSubmissionLoading.set(false);
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
    
    if (day.isBlocked) {
      const reason = day.blockedReason || 'Maintenance';
      alert(`This date is blocked due to ${reason.toLowerCase()}. Please select a different date.`);
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
      
      const dateString = this.formatDateForComparison(selectedDate);
      
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
    this.isStatusDropdownOpen.set(false);
    this.updateBookingsList();
  }

  onDateFilterChange(): void {
    this.updateBookingsList();
  }

  // Check if any filters are active
  protected hasActiveFilters(): boolean {
    return this.statusFilter() !== 'all' || 
           this.dateFilter.from !== '' || 
           this.dateFilter.to !== '';
  }

  // Clear all filters
  protected clearAllFilters(): void {
    this.statusFilter.set('all');
    this.dateFilter.from = '';
    this.dateFilter.to = '';
    this.isStatusDropdownOpen.set(false);
    this.updateBookingsList();
  }

  // Helper method to check if user is properly authenticated
  isUserAuthenticated(): boolean {
    const token = this.authService.getToken();
    const userData = this.authService.getUserData();
    return !!(token && userData);
  }

  // Helper method to format date for comparison (avoiding timezone issues)
  private formatDateForComparison(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
          
          // Don't automatically select first car - let user choose
          // This ensures the dropdown shows "Choose a car" by default
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

  // Load blocked dates for the selected car for availability
  private loadBlockedDates(): void {
    if (!this.isUserAuthenticated()) {
      return;
    }

    // If no car is selected for availability, clear blocked dates
    if (!this.selectedCarForAvailability()) {
      this.blockedDates.set([]);
      return;
    }

    this.loadingBlockedDates.set(true);
    
    console.log('Loading blocked dates for car:', this.selectedCarForAvailability());
    console.log('Available user cars:', this.userCars().map(car => ({ id: car.carid._id, name: car.carid.carname, brand: car.carid.brandname })));
    
    // Load blocked dates for the selected car
    this.blockedDateService.getCarBlockedDates(this.selectedCarForAvailability()).subscribe({
      next: (response) => {
        console.log('Blocked dates API response:', response);
        if (response.status === 'success' && response.body.blockedDates) {
          console.log('Setting blocked dates:', response.body.blockedDates);
          this.blockedDates.set(response.body.blockedDates);
        } else {
          console.log('No blocked dates found or API error');
          this.blockedDates.set([]);
        }
        this.loadingBlockedDates.set(false);
        this.updateCalendar(); // Refresh calendar with blocked dates
      },
      error: (error) => {
        console.error('Error loading blocked dates:', error);
        this.blockedDates.set([]);
        this.loadingBlockedDates.set(false);
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
  onCarSelectionChange(carId: string): void {
    console.log('onCarSelectionChange called with carId:', carId);
    this.selectedCarForAvailability.set(carId);
    
    // Only load bookings and blocked dates if a car is actually selected
    if (carId) {
      this.loadCarBookings();
      this.loadBlockedDates(); // Reload blocked dates when car selection changes
    } else {
      // Clear bookings and blocked dates when no car is selected
      this.carBookings.set([]);
      this.blockedDates.set([]);
      this.updateCalendar(); // Refresh calendar
    }
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

  // Validate booking rules
  private validateBookingRules(): boolean {
    this.validationErrors.set([]);
    const errors: string[] = [];

    if (!this.bookingForm.fromDate || !this.bookingForm.toDate || !this.bookingForm.selectedCar) {
      return true; // Let the existing validation handle this
    }

    const fromDate = new Date(this.bookingForm.fromDate);
    const toDate = new Date(this.bookingForm.toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Rule 1: Min 1 day, Max 4 days
    const duration = this.getBookingDuration(fromDate, toDate);
    if (duration < 1) {
      errors.push('Minimum booking duration is 1 day.');
    }
    if (duration > 4) {
      errors.push('Maximum booking duration is 4 days.');
    }

    // Rule 2: Advance booking limit (3 months)
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setMonth(maxAdvanceDate.getMonth() + this.maxAdvanceBookingMonths);
    if (fromDate > maxAdvanceDate) {
      errors.push(`Advance booking is only allowed up to ${this.maxAdvanceBookingMonths} months ahead.`);
    }

    // Rule 3: Same car booking restriction
    if (this.hasExistingBookingForSameCar()) {
      errors.push('You already have an active booking for this car. Please wait for it to complete before booking again.');
    }

    // Rule 4: Weekend booking limit
    if (this.exceedsWeekendBookingLimit()) {
      errors.push(`You have reached the maximum limit of ${this.maxWeekendBookings} weekend bookings per year for this car.`);
    }

    this.validationErrors.set(errors);
    return errors.length === 0;
  }

  // Calculate booking duration in days
  private getBookingDuration(fromDate: Date, toDate: Date): number {
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }

  // Check if user has existing booking for the same car
  private hasExistingBookingForSameCar(): boolean {
    const selectedCar = this.bookingForm.selectedCar;
    const fromDate = new Date(this.bookingForm.fromDate);
    const toDate = new Date(this.bookingForm.toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the selected car from user's cars to get the car name
    const selectedCarData = this.userCars().find(car => car.carid._id === selectedCar);
    if (!selectedCarData) return false;

    return this.bookings().some(booking => {
      const bookingFrom = new Date(booking.fromDate);
      const bookingTo = new Date(booking.toDate);
      
      // Check if booking is for the same car and overlaps with the new booking period
      // and the existing booking hasn't completed yet
      return booking.carName.includes(selectedCarData.carid.carname) && 
             bookingTo >= today && 
             ((fromDate >= bookingFrom && fromDate <= bookingTo) ||
              (toDate >= bookingFrom && toDate <= bookingTo) ||
              (fromDate <= bookingFrom && toDate >= bookingTo));
    });
  }

  // Check if weekend booking limit is exceeded
  private exceedsWeekendBookingLimit(): boolean {
    const selectedCar = this.bookingForm.selectedCar;
    const fromDate = new Date(this.bookingForm.fromDate);
    const toDate = new Date(this.bookingForm.toDate);
    const currentYear = new Date().getFullYear();

    // Find the selected car from user's cars to get the car name
    const selectedCarData = this.userCars().find(car => car.carid._id === selectedCar);
    if (!selectedCarData) return false;

    // Count weekend bookings for this car in the current year
    const weekendBookings = this.bookings().filter(booking => {
      const bookingFrom = new Date(booking.fromDate);
      const bookingTo = new Date(booking.toDate);
      const bookingYear = bookingFrom.getFullYear();
      
      // Check if booking is for the same car and in the current year
      if (bookingYear !== currentYear || !booking.carName.includes(selectedCarData.carid.carname)) {
        return false;
      }

      // Check if booking includes any weekend days
      let currentDate = new Date(bookingFrom);
      while (currentDate <= bookingTo) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          return true;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return false;
    });

    // Check if the new booking includes weekends
    let includesWeekend = false;
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        includesWeekend = true;
        break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return includesWeekend && weekendBookings.length >= this.maxWeekendBookings;
  }

  // Check if booking can be cancelled (before 1 day of booking date)
  protected canCancelBooking(booking: Booking): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingFrom = new Date(booking.fromDate);
    const oneDayBefore = new Date(bookingFrom);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    
    return today < oneDayBefore;
  }

  // Cancel a booking
  protected cancelBooking(booking: Booking): void {
    if (!this.canCancelBooking(booking)) {
      alert('You can only cancel bookings at least 1 day before the booking date.');
      return;
    }

    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.deleteBooking(booking.id).subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            alert('Booking cancelled successfully!');
            // Reload bookings
            this.loadUserBookings();
            this.loadCarBookings();
          } else {
            alert('Failed to cancel booking. Please try again.');
          }
        },
        error: (error: any) => {
          alert('Failed to cancel booking. Please try again.');
        }
      });
    }
  }
}