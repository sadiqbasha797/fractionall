import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { TokenService, Token } from '../services/token.service';
import { BookingService, Booking } from '../services/booking.service';
import { BookNowTokenService, BookNowToken } from '../services/book-now-token.service';
import { AMCService, AMC } from '../services/amc.service';
import { PaymentService, PaymentOrder, PaymentVerification } from '../services/payment.service';
import { ContractService, ContractDocument } from '../services/contract.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  // Convert to signals for proper reactivity with zoneless change detection
  protected user = signal<any>({
    name: '',
    email: '',
    phone: '',
    dateofbirth: '',
    location: '',
    address: '',
    pincode: '',
    profileimage: '',
    verified: false,
    kycStatus: 'pending',
    governmentid: {
      aadharid: '',
      panid: '',
      licenseid: '',
      income: ''
    },
    createdAt: ''
  });

  // Real tickets data from API
  protected tickets = signal<Ticket[]>([]);

  // Real tokens data from API
  protected tokens = signal<Token[]>([]);
  protected tokensLoading = signal<boolean>(false);
  protected tokensError = signal<string>('');

  // Real booknow tokens data from API
  protected bookNowTokens = signal<BookNowToken[]>([]);
  protected bookNowTokensLoading = signal<boolean>(false);
  protected bookNowTokensError = signal<string>('');

  // Real AMC data from API
  protected amcs = signal<AMC[]>([]);
  protected amcsLoading = signal<boolean>(false);
  protected amcsError = signal<string>('');
  protected expandedAMC = signal<string | null>(null);

  // Real contract documents data from API
  protected contractDocuments = signal<ContractDocument[]>([]);
  protected contractDocumentsLoading = signal<boolean>(false);
  protected contractDocumentsError = signal<string>('');

  // Real bookings data from API
  protected bookings = signal<Booking[]>([]);
  protected bookingsLoading = signal<boolean>(false);
  protected bookingsError = signal<string>('');
  protected currentMonth = signal<Date>(new Date());
  protected calendarDays = signal<any[]>([]);

  // KYC form data
  protected kycForm = signal({
    aadharId: '',
    panId: '',
    file: null as File | null
  });

  protected showDocModal = signal<boolean>(false);
  protected fileError = signal<string>('');
  protected fileInfo = signal<string>('');
  protected aadharError = signal<string>('');
  protected panError = signal<string>('');
  protected submittingKyc = signal<boolean>(false);

  protected loading = signal<boolean>(false);
  protected error = signal<string>('');

  protected ticketsLoading = signal<boolean>(false);
  protected ticketsError = signal<string>('');

  // Edit profile modal state
  protected showEditModal = signal<boolean>(false);
  protected editSubmitting = signal<boolean>(false);
  protected editSuccessMessage = signal<string>('');
  protected editErrorMessage = signal<string>('');
  protected editForm = signal<any>({
    name: '',
    email: '',
    phone: '',
    dateofbirth: '',
    location: '',
    address: '',
    pincode: ''
  });

  // Verify email modal state (after email change)
  protected showVerifyEmailModal = signal<boolean>(false);
  protected verifySubmitting = signal<boolean>(false);
  protected verifyErrorMessage = signal<string>('');
  protected verifySuccessMessage = signal<string>('');
  protected verifyForm = signal({ email: '', code: '' });

  // Change password modal state
  protected showChangePasswordModal = signal<boolean>(false);
  protected passwordRequesting = signal<boolean>(false);
  protected passwordSubmitting = signal<boolean>(false);
  protected passwordErrorMessage = signal<string>('');
  protected passwordSuccessMessage = signal<string>('');
  protected resetForm = signal({ code: '', newPassword: '' });

  // Profile image upload state
  protected uploadingImage = signal<boolean>(false);
  protected imageUploadError = signal<string>('');
  protected imageUploadSuccess = signal<string>('');

  // AMC Payment state
  protected razorpayKey = signal<string>('');
  protected isAMCPaymentLoading = signal<boolean>(false);
  protected amcPaymentError = signal<string>('');
  protected showAMCPaymentModal = signal<boolean>(false);
  protected selectedAMC = signal<AMC | null>(null);
  protected selectedAMCYear = signal<number>(-1);
  protected amcPaymentSuccess = signal<boolean>(false);

  // Profile expansion state
  protected profileExpanded = signal<boolean>(false);

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private ticketService: TicketService,
    private tokenService: TokenService,
    private bookingService: BookingService,
    private bookNowTokenService: BookNowTokenService,
    private amcService: AMCService,
    private paymentService: PaymentService,
    private contractService: ContractService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Effect to trigger change detection when data changes
    effect(() => {
      const userData = this.user();
      const ticketsData = this.tickets();
      const tokensData = this.tokens();
      const bookNowTokensData = this.bookNowTokens();
      const amcsData = this.amcs();
      const bookingsData = this.bookings();
      const contractDocumentsData = this.contractDocuments();
      
      // Trigger change detection when any data changes
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadRazorpayKey();
    // Don't load tickets here - wait for profile to load first
  }

  loadUserProfile() {
    this.loading.set(true);
    this.error.set('');
    
    // First try to get from localStorage if available
    const storedUser = this.authService.getUserData();
    if (storedUser) {
      this.user.set({ ...this.user(), ...storedUser });
    }

    // Check if user is authenticated
    const token = this.authService.getToken();
    if (!token) {
      this.loading.set(false);
      this.error.set('Please login to view your profile.');
      return;
    }

    // Then fetch fresh data from API
    this.userService.getProfile().subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response && response.body && response.body.user) {
          this.user.set({ ...this.user(), ...response.body.user });
          // Update stored user data
          this.authService.setUserData(this.user());
          // Now load tickets, tokens, booknow tokens, AMCs, bookings, and contract documents since user is authenticated
          this.loadUserTickets();
          this.loadUserTokens();
          this.loadUserBookNowTokens();
          this.loadUserAMCs();
          this.loadUserBookings();
          this.loadUserContractDocuments();
        }
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error loading profile:', error);
        
        if (error.status === 401) {
          this.error.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view this profile.');
        } else {
          this.error.set('Failed to load profile data. Please try again later.');
        }
        
        // If API fails but we have stored data, use that
        if (!this.user().name && storedUser) {
          this.user.set({ ...this.user(), ...storedUser });
        }
      }
    });
  }

    loadUserTickets() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.ticketsError.set('Please login to view your tickets');
      return;
    }

    this.ticketsLoading.set(true);
    this.ticketsError.set('');

    this.ticketService.getUserTickets().subscribe({
      next: (response) => {
        this.ticketsLoading.set(false);
        
        if (response && response.body && response.body.tickets) {
          this.tickets.set(response.body.tickets);
        }
      },
      error: (error) => {
        this.ticketsLoading.set(false);
        console.error('Error loading tickets:', error);
        
        if (error.status === 401) {
          this.ticketsError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.ticketsError.set('Access denied. You do not have permission to view tickets.');
        } else {
          this.ticketsError.set('Failed to load tickets. Please try again later.');
        }
      }
    });
  }

  loadUserTokens() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.tokensError.set('Please login to view your tokens');
      return;
    }

    this.tokensLoading.set(true);
    this.tokensError.set('');

    this.tokenService.getUserTokens().subscribe({
      next: (response) => {
        this.tokensLoading.set(false);
        
        if (response && response.body && response.body.tokens) {
          this.tokens.set(response.body.tokens);
        }
      },
      error: (error) => {
        this.tokensLoading.set(false);
        console.error('Error loading tokens:', error);
        
        if (error.status === 401) {
          this.tokensError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.tokensError.set('Access denied. You do not have permission to view tokens.');
        } else {
          this.tokensError.set('Failed to load tokens. Please try again later.');
        }
      }
    });
  }

  loadUserBookNowTokens() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.bookNowTokensError.set('Please login to view your book now tokens');
      return;
    }

    this.bookNowTokensLoading.set(true);
    this.bookNowTokensError.set('');

    this.bookNowTokenService.getUserBookNowTokens().subscribe({
      next: (response) => {
        this.bookNowTokensLoading.set(false);
        
        if (response && response.body && response.body.bookNowTokens) {
          this.bookNowTokens.set(response.body.bookNowTokens);
        }
      },
      error: (error) => {
        this.bookNowTokensLoading.set(false);
        console.error('Error loading book now tokens:', error);
        
        if (error.status === 401) {
          this.bookNowTokensError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.bookNowTokensError.set('Access denied. You do not have permission to view book now tokens.');
        } else {
          this.bookNowTokensError.set('Failed to load book now tokens. Please try again later.');
        }
      }
    });
  }

  loadUserAMCs() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.amcsError.set('Please login to view your AMC records');
      return;
    }

    this.amcsLoading.set(true);
    this.amcsError.set('');

    this.amcService.getUserAMCs().subscribe({
      next: (response) => {
        this.amcsLoading.set(false);
        
        if (response && response.body && response.body.amcs) {
          this.amcs.set(response.body.amcs);
        }
      },
      error: (error) => {
        this.amcsLoading.set(false);
        console.error('Error loading AMCs:', error);
        
        if (error.status === 401) {
          this.amcsError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.amcsError.set('Access denied. You do not have permission to view AMC records.');
        } else {
          this.amcsError.set('Failed to load AMC records. Please try again later.');
        }
      }
    });
  }

  loadUserBookings() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.bookingsError.set('Please login to view your bookings');
      return;
    }

    this.bookingsLoading.set(true);
    this.bookingsError.set('');

    this.bookingService.getUserBookings().subscribe({
      next: (response) => {
        this.bookingsLoading.set(false);
        
        if (response && response.body && response.body.bookings) {
          this.bookings.set(response.body.bookings);
          this.generateCalendar();
        }
      },
      error: (error) => {
        this.bookingsLoading.set(false);
        console.error('Error loading bookings:', error);
        
        if (error.status === 401) {
          this.bookingsError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.bookingsError.set('Access denied. You do not have permission to view bookings.');
        } else {
          this.bookingsError.set('Failed to load bookings. Please try again later.');
        }
      }
    });
  }

  // Helper method to format date
  formatDate(dateString: string | Date): string {
    if (!dateString) return 'Not provided';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }

  // Helper method to calculate total AMC amount for a car
  getTotalAMCAmount(amc: AMC): number {
    return amc.amcamount.reduce((total, amount) => total + amount.amount, 0);
  }

  // Helper method to calculate paid AMC amount for a car
  getPaidAMCAmount(amc: AMC): number {
    return amc.amcamount
      .filter(amount => amount.paid)
      .reduce((total, amount) => total + amount.amount, 0);
  }

  // Helper method to calculate pending AMC amount for a car
  getPendingAMCAmount(amc: AMC): number {
    return amc.amcamount
      .filter(amount => !amount.paid)
      .reduce((total, amount) => total + amount.amount, 0);
  }

  // Helper method to get next due AMC
  getNextDueAMC(amc: AMC): any {
    const unpaidAmounts = amc.amcamount.filter(amount => !amount.paid);
    if (unpaidAmounts.length === 0) return null;
    
    // Sort by due date and return the earliest
    return unpaidAmounts.sort((a, b) => {
      const dateA = a.duedate ? new Date(a.duedate) : new Date();
      const dateB = b.duedate ? new Date(b.duedate) : new Date();
      return dateA.getTime() - dateB.getTime();
    })[0];
  }

  // Helper method to toggle AMC expansion
  toggleAMCExpansion(amcId: string) {
    const currentExpanded = this.expandedAMC();
    if (currentExpanded === amcId) {
      this.expandedAMC.set(null);
    } else {
      this.expandedAMC.set(amcId);
    }
  }

  // Helper method to check if AMC is expanded
  isAMCExpanded(amcId: string): boolean {
    return this.expandedAMC() === amcId;
  }

  // Helper method to check if an AMC amount is overdue
  isAMCAmountOverdue(amount: any): boolean {
    if (amount.paid || !amount.duedate) {
      return false;
    }
    const dueDate = new Date(amount.duedate);
    const today = new Date();
    return dueDate < today;
  }

  // Helper method to format government ID
  formatGovernmentId(idType: string, idValue: string): string {
    if (!idValue) return 'Not provided';
    
    // Mask sensitive information for display
    if (idType === 'aadharid' && idValue.length >= 4) {
      return `****-****-${idValue.slice(-4)}`;
    }
    if (idType === 'panid' && idValue.length >= 4) {
      return `${idValue.slice(0, 2)}****${idValue.slice(-2)}`;
    }
    if (idType === 'licenseid' && idValue.length >= 4) {
      return `${idValue.slice(0, 2)}****${idValue.slice(-2)}`;
    }
    
    return idValue;
  }

  // Helper method to get verification status text
  getVerificationStatus(): string {
    return this.user().verified ? 'Verified' : 'Not Verified';
  }

  // Helper method to get KYC status display
  getKycStatusDisplay(): string {
    switch (this.user().kycStatus) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'submitted':
        return 'Under Review';
      case 'pending':
      default:
        return 'Pending Verification';
    }
  }

  // Helper method to get KYC status class
  getKycStatusClass(): string {
    switch (this.user().kycStatus) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'submitted':
        return 'submitted';
      case 'pending':
      default:
        return 'pending';
    }
  }

  openDocModal() {
    this.showDocModal.set(true);
  }

  closeDocModal() {
    this.showDocModal.set(false);
    this.resetKycForm();
  }

  resetKycForm() {
    this.kycForm.set({
      aadharId: '',
      panId: '',
      file: null
    });
    this.fileError.set('');
    this.fileInfo.set('');
    this.aadharError.set('');
    this.panError.set('');
    this.submittingKyc.set(false);
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.resetFileMessages();
      return;
    }

    if (file.type !== 'application/pdf') {
      this.fileError.set('Only PDF files are accepted. Please upload a single PDF with front and back pages.');
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.fileError.set('File is too large. Please upload a PDF smaller than 10 MB.');
      event.target.value = '';
      return;
    }

    this.kycForm.set({ ...this.kycForm(), file: file });
    this.fileInfo.set(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    this.fileError.set('');
  }

  resetFileMessages() {
    this.fileError.set('');
    this.fileInfo.set('');
  }

  // Validate Aadhar ID format
  validateAadharId(aadharId: string): { valid: boolean; message?: string } {
    if (!aadharId || aadharId.trim().length === 0) {
      return { valid: false, message: 'Aadhar ID is required' };
    }

    // Remove any spaces or dashes
    const cleanAadharId = aadharId.replace(/[\s-]/g, '');
    
    // Check if it's exactly 12 digits
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(cleanAadharId)) {
      return { valid: false, message: 'Aadhar number must be exactly 12 digits' };
    }

    return { valid: true };
  }

  // Validate PAN ID format
  validatePanId(panId: string): { valid: boolean; message?: string } {
    if (!panId || panId.trim().length === 0) {
      return { valid: false, message: 'PAN ID is required' };
    }

    // Convert to uppercase and remove spaces
    const cleanPanId = panId.replace(/\s/g, '').toUpperCase();
    
    // Check PAN format: 5 letters, 4 digits, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPanId)) {
      return { valid: false, message: 'Invalid PAN format. Use format like ABCDE1234F' };
    }

    return { valid: true };
  }

  // Real-time validation for Aadhar ID
  onAadharIdChange() {
    this.aadharError.set('');
    if (this.kycForm().aadharId.trim()) {
      const validation = this.validateAadharId(this.kycForm().aadharId);
      if (!validation.valid) {
        this.aadharError.set(validation.message || '');
      }
    }
  }

  // Real-time validation for PAN ID
  onPanIdChange() {
    this.panError.set('');
    if (this.kycForm().panId.trim()) {
      const validation = this.validatePanId(this.kycForm().panId);
      if (!validation.valid) {
        this.panError.set(validation.message || '');
      }
    }
  }

  onSubmitKyc() {
    // Clear previous errors
    this.aadharError.set('');
    this.panError.set('');
    this.fileError.set('');

    // Validate Aadhar ID
    const aadharValidation = this.validateAadharId(this.kycForm().aadharId);
    if (!aadharValidation.valid) {
      this.aadharError.set(aadharValidation.message || '');
      return;
    }

    // Validate PAN ID
    const panValidation = this.validatePanId(this.kycForm().panId);
    if (!panValidation.valid) {
      this.panError.set(panValidation.message || '');
      return;
    }

    // Validate file
    if (!this.kycForm().file) {
      this.fileError.set('Please upload the PDF containing both Aadhar and PAN card images.');
      return;
    }

    // Set submitting state
    this.submittingKyc.set(true);

    // First, update the government IDs in user profile
    const governmentIds = {
      aadharid: this.kycForm().aadharId.replace(/[\s-]/g, ''),
      panid: this.kycForm().panId.replace(/\s/g, '').toUpperCase()
    };

    // Update user profile with government IDs
    this.userService.updateProfile({ governmentid: governmentIds }).subscribe({
      next: (response) => {
        // After successfully updating government IDs, submit KYC documents
        this.submitKycDocuments();
      },
      error: (error) => {
        this.submittingKyc.set(false);
        console.error('Error updating government IDs:', error);
        alert('Failed to update government IDs. Please try again.');
      }
    });
  }

  private submitKycDocuments() {
    // For now, we'll simulate the KYC submission since the backend expects document URLs
    // In a real implementation, you would upload the file first and get URLs
    const kycDocs = ['document_url_placeholder']; // This would be actual document URLs

    // Submit KYC documents
    this.userService.submitKyc({ kycDocs }).subscribe({
      next: (response) => {
        this.submittingKyc.set(false);
        if (response && response.status === 'success') {
          // Update user's KYC status
          this.user.set({ ...this.user(), kycStatus: 'submitted' });
          alert('KYC documents submitted successfully! Your application is under review.');
          this.closeDocModal();
        } else {
          alert('Failed to submit KYC documents. Please try again.');
        }
      },
      error: (error) => {
        this.submittingKyc.set(false);
        console.error('Error submitting KYC documents:', error);
        alert('Failed to submit KYC documents. Please try again.');
      }
    });
  }

  // Calendar generation methods
  generateCalendar() {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays: any[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push({ day: '', isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = this.bookingService.hasBookingsOnDate(this.bookings(), date);
      const bookingStatus = this.bookingService.getBookingStatusForDate(this.bookings(), date);
      
      calendarDays.push({
        day: day,
        date: date,
        isEmpty: false,
        bookings: dayBookings,
        bookingStatus: bookingStatus,
        isToday: this.isToday(date)
      });
    }
    
    this.calendarDays.set(calendarDays);
  }

  // Helper method to check if a date is today
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Get current month display text
  getCurrentMonthDisplay(): string {
    return this.currentMonth().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  // Navigate to previous month
  goToPreviousMonth() {
    const newDate = new Date(this.currentMonth().getFullYear(), this.currentMonth().getMonth() - 1, 1);
    this.currentMonth.set(newDate);
    this.generateCalendar();
  }

  // Navigate to next month
  goToNextMonth() {
    const newDate = new Date(this.currentMonth().getFullYear(), this.currentMonth().getMonth() + 1, 1);
    this.currentMonth.set(newDate);
    this.generateCalendar();
  }

  // Get CSS class for calendar day based on booking status
  getCalendarDayClass(day: any): string {
    if (day.isEmpty) return 'calendar-day empty';
    
    let classes = 'calendar-day';
    
    if (day.isToday) {
      classes += ' today';
    }
    
    if (day.bookingStatus === 'accepted') {
      classes += ' booking-accepted';
    } else if (day.bookingStatus === 'rejected') {
      classes += ' booking-rejected';
    }
    
    return classes;
  }

  // Get booking tooltip text for a day
  getBookingTooltip(day: any): string {
    if (day.isEmpty || !day.bookings || day.bookings.length === 0) {
      return '';
    }
    
    const bookingTexts = day.bookings.map((booking: Booking) => {
      const carName = booking.carid?.carname || 'Unknown Car';
      const status = booking.status === 'accepted' ? '✓' : '✗';
      return `${status} ${carName}`;
    });
    
    return bookingTexts.join('\n');
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // =============== Edit Profile ===============
  openEditModal() {
    this.editErrorMessage.set('');
    this.editSuccessMessage.set('');
    // Initialize form with current user values
    this.editForm.set({
      name: this.user().name || '',
      email: this.user().email || '',
      phone: this.user().phone || '',
      dateofbirth: this.user().dateofbirth ? new Date(this.user().dateofbirth).toISOString().split('T')[0] : '',
      location: this.user().location || '',
      address: this.user().address || '',
      pincode: this.user().pincode || ''
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    if (this.editSubmitting()) return;
    this.showEditModal.set(false);
  }

  saveProfile() {
    this.editErrorMessage.set('');
    this.editSuccessMessage.set('');
    this.editSubmitting.set(true);

    const payload: any = {
      name: this.editForm().name?.trim(),
      email: this.editForm().email?.trim(),
      phone: this.editForm().phone?.trim(),
      dateofbirth: this.editForm().dateofbirth ? new Date(this.editForm().dateofbirth).toISOString() : '',
      location: this.editForm().location?.trim(),
      address: this.editForm().address?.trim(),
      pincode: this.editForm().pincode?.trim()
    };

    this.userService.updateProfile(payload).subscribe({
      next: (response) => {
        this.editSubmitting.set(false);
        if (response && response.status === 'success') {
          const updatedUser = response.body?.user || {};
          this.user.set({ ...this.user(), ...updatedUser });
          this.authService.setUserData(this.user());
          const emailChanged = !!response.body?.emailChangeVerificationSent;
          if (emailChanged) {
            this.verifyForm.set({ ...this.verifyForm(), email: this.user().email });
            this.showVerifyEmailModal.set(true);
            this.editSuccessMessage.set('Profile saved. Please verify your new email.');
          } else {
            this.editSuccessMessage.set('Profile updated successfully.');
          }
          // Close modal after short delay if no email verification needed
          if (!emailChanged) {
            setTimeout(() => { this.showEditModal.set(false); }, 800);
          }
        } else {
          this.editErrorMessage.set(response?.message || 'Failed to update profile.');
        }
      },
      error: (error) => {
        this.editSubmitting.set(false);
        this.editErrorMessage.set(error.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }

  // =============== Verify Email (after change) ===============
  closeVerifyEmailModal() {
    if (this.verifySubmitting()) return;
    this.showVerifyEmailModal.set(false);
    this.verifyForm.set({ email: '', code: '' });
    this.verifyErrorMessage.set('');
    this.verifySuccessMessage.set('');
  }

  verifyNewEmail() {
    this.verifyErrorMessage.set('');
    this.verifySuccessMessage.set('');
    if (!this.verifyForm().email || !this.verifyForm().code) {
      this.verifyErrorMessage.set('Email and verification code are required.');
      return;
    }
    this.verifySubmitting.set(true);
    this.authService.verifyEmail({ email: this.verifyForm().email, code: this.verifyForm().code }).subscribe({
      next: (response) => {
        this.verifySubmitting.set(false);
        if (response?.status === 'success') {
          // Update token and user data
          if (response.body?.token) {
            this.authService.setToken(response.body.token);
          }
          if (response.body?.user) {
            this.user.set({ ...this.user(), ...response.body.user });
            this.authService.setUserData(this.user());
          }
          this.verifySuccessMessage.set('Email verified successfully!');
          setTimeout(() => { this.closeVerifyEmailModal(); }, 800);
        } else {
          this.verifyErrorMessage.set(response?.message || 'Verification failed.');
        }
      },
      error: (error) => {
        this.verifySubmitting.set(false);
        this.verifyErrorMessage.set(error.error?.message || 'Verification failed. Please try again.');
      }
    });
  }

  resendVerifyCode() {
    if (!this.verifyForm().email) return;
    this.verifyErrorMessage.set('');
    this.verifySuccessMessage.set('');
    this.verifySubmitting.set(true);
    this.authService.resendVerificationCode(this.verifyForm().email).subscribe({
      next: () => {
        this.verifySubmitting.set(false);
        this.verifySuccessMessage.set('Verification code sent.');
      },
      error: (error) => {
        this.verifySubmitting.set(false);
        this.verifyErrorMessage.set(error.error?.message || 'Failed to send code.');
      }
    });
  }

  // =============== Change Password ===============
  openChangePasswordModal() {
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');
    this.resetForm.set({ code: '', newPassword: '' });
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal() {
    if (this.passwordRequesting() || this.passwordSubmitting()) return;
    this.showChangePasswordModal.set(false);
  }

  requestPasswordCode() {
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');
    this.passwordRequesting.set(true);
    const email = this.user().email;
    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.passwordRequesting.set(false);
        this.passwordSuccessMessage.set('Reset code sent to your email.');
      },
      error: (error) => {
        this.passwordRequesting.set(false);
        this.passwordErrorMessage.set(error.error?.message || 'Failed to send reset code.');
      }
    });
  }

  submitNewPassword() {
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');
    if (!this.resetForm().code || !this.resetForm().newPassword) {
      this.passwordErrorMessage.set('Code and new password are required.');
      return;
    }
    this.passwordSubmitting.set(true);
    const payload = { email: this.user().email, code: this.resetForm().code, newPassword: this.resetForm().newPassword };
    this.authService.resetPassword(payload).subscribe({
      next: (response) => {
        this.passwordSubmitting.set(false);
        if (response?.status === 'success') {
          this.passwordSuccessMessage.set('Password changed successfully.');
          setTimeout(() => { this.closeChangePasswordModal(); }, 800);
        } else {
          this.passwordErrorMessage.set(response?.message || 'Failed to change password.');
        }
      },
      error: (error) => {
        this.passwordSubmitting.set(false);
        this.passwordErrorMessage.set(error.error?.message || 'Failed to change password.');
      }
    });
  }

  // =============== Form Update Helper Methods ===============
  public updateKycAadharId(value: string) {
    this.kycForm.set({...this.kycForm(), aadharId: value});
  }

  public updateKycPanId(value: string) {
    this.kycForm.set({...this.kycForm(), panId: value});
  }

  public updateEditFormName(value: string) {
    this.editForm.set({...this.editForm(), name: value});
  }

  public updateEditFormEmail(value: string) {
    this.editForm.set({...this.editForm(), email: value});
  }

  public updateEditFormPhone(value: string) {
    this.editForm.set({...this.editForm(), phone: value});
  }

  public updateEditFormDateOfBirth(value: string) {
    this.editForm.set({...this.editForm(), dateofbirth: value});
  }

  public updateEditFormLocation(value: string) {
    this.editForm.set({...this.editForm(), location: value});
  }

  public updateEditFormPincode(value: string) {
    this.editForm.set({...this.editForm(), pincode: value});
  }

  public updateEditFormAddress(value: string) {
    this.editForm.set({...this.editForm(), address: value});
  }

  public updateVerifyFormEmail(value: string) {
    this.verifyForm.set({...this.verifyForm(), email: value});
  }

  public updateVerifyFormCode(value: string) {
    this.verifyForm.set({...this.verifyForm(), code: value});
  }

  public updateResetFormCode(value: string) {
    this.resetForm.set({...this.resetForm(), code: value});
  }

  public updateResetFormPassword(value: string) {
    this.resetForm.set({...this.resetForm(), newPassword: value});
  }

  // =============== Profile Image Upload ===============
  public triggerFileInput() {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event: any) => {
      this.onImageSelect(event);
    };
    
    // Trigger the file dialog
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  public onImageSelect(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Clear previous messages
    this.imageUploadError.set('');
    this.imageUploadSuccess.set('');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.imageUploadError.set('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.imageUploadError.set('Image size must be less than 5MB.');
      return;
    }

    // Upload the image
    this.uploadProfileImage(file);
  }

  private uploadProfileImage(file: File) {
    this.uploadingImage.set(true);
    this.imageUploadError.set('');
    this.imageUploadSuccess.set('');

    this.userService.uploadProfileImage(file).subscribe({
      next: (response) => {
        this.uploadingImage.set(false);
        if (response && response.status === 'success') {
          // Update the user's profile image
          const updatedUser = { ...this.user(), profileimage: response.body?.profileimage || response.body?.imageUrl };
          this.user.set(updatedUser);
          this.authService.setUserData(updatedUser);
          this.imageUploadSuccess.set('Profile image updated successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.imageUploadSuccess.set('');
          }, 3000);
        } else {
          this.imageUploadError.set(response?.message || 'Failed to upload image.');
        }
      },
      error: (error) => {
        this.uploadingImage.set(false);
        console.error('Error uploading profile image:', error);
        this.imageUploadError.set(error.error?.message || 'Failed to upload image. Please try again.');
      }
    });
  }

  // =============== AMC Payment Methods ===============
  loadRazorpayKey() {
    this.paymentService.getRazorpayKey().subscribe({
      next: (response) => {
        this.razorpayKey.set(response.key);
      },
      error: (error) => {
        console.error('Failed to load Razorpay key:', error);
        this.amcPaymentError.set('Failed to load payment system. Please refresh the page.');
      }
    });
  }

  initiateAMCPayment(amc: AMC, yearIndex: number) {
    if (!this.razorpayKey()) {
      this.amcPaymentError.set('Payment system not ready. Please refresh the page.');
      return;
    }

    const amcAmount = amc.amcamount[yearIndex];
    if (!amcAmount || amcAmount.paid) {
      this.amcPaymentError.set('Invalid AMC amount or already paid.');
      return;
    }

    // For test mode, use a fixed small amount instead of the actual amount
    const testAmount = 100; // ₹1 for testing
    const actualAmount = amcAmount.amount;
    

    this.selectedAMC.set(amc);
    this.selectedAMCYear.set(yearIndex);
    this.isAMCPaymentLoading.set(true);
    this.amcPaymentError.set('');

    const orderData: PaymentOrder = {
      amount: testAmount * 100, // Use test amount in paise
      currency: 'INR',
      receipt: `AMC_TEST_${amc._id}_${amcAmount.year}_${Date.now()}`.substring(0, 40)
    };

    this.paymentService.createOrder(orderData).subscribe({
      next: (response) => {
        if (response.success) {
          this.openRazorpayCheckout(response.order, `AMC Payment - Year ${amcAmount.year} - ${amc.carid.carname}`);
        } else {
          this.amcPaymentError.set(response.message || 'Failed to create payment order');
          this.isAMCPaymentLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating payment order:', error);
        this.amcPaymentError.set('Failed to create payment order. Please try again.');
        this.isAMCPaymentLoading.set(false);
      }
    });
  }

  openRazorpayCheckout(order: any, description: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    const options = {
      key: this.razorpayKey(),
      amount: order.amount,
      currency: order.currency,
      name: 'Fraction Car Co-ownership',
      description: description,
      order_id: order.id,
      handler: (response: any) => {
        this.verifyAMCPayment(response);
      },
      prefill: {
        name: this.user().name || 'User',
        email: this.user().email || 'user@example.com',
        contact: this.user().phone || '9999999999'
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: () => {
          this.isAMCPaymentLoading.set(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  verifyAMCPayment(response: any) {
    const verificationData: PaymentVerification = {
      order_id: response.razorpay_order_id,
      payment_id: response.razorpay_payment_id,
      signature: response.razorpay_signature
    };

    this.paymentService.verifyPayment(verificationData).subscribe({
      next: (result) => {
        if (result.success) {
          // Payment verified successfully, now update AMC payment status
          this.updateAMCPaymentStatus();
        } else {
          this.amcPaymentError.set('Payment verification failed. Please contact support.');
          this.isAMCPaymentLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.amcPaymentError.set('Payment verification failed. Please contact support.');
        this.isAMCPaymentLoading.set(false);
      }
    });
  }

  updateAMCPaymentStatus() {
    const amc = this.selectedAMC();
    const yearIndex = this.selectedAMCYear();
    
    if (!amc || yearIndex === -1) {
      this.amcPaymentError.set('Invalid AMC data. Please try again.');
      this.isAMCPaymentLoading.set(false);
      return;
    }

    const currentDate = new Date().toISOString();
    
    
    this.paymentService.updateAMCPaymentStatus(amc._id!, yearIndex, true, currentDate).subscribe({
      next: (response) => {
        this.isAMCPaymentLoading.set(false);
        if (response.status === 'success') {
          // Update local AMC data
          this.updateLocalAMCData(amc._id!, yearIndex, true, currentDate);
          this.amcPaymentSuccess.set(true);
          this.showAMCPaymentModal.set(true);
          this.amcPaymentError.set('');
        } else {
          this.amcPaymentError.set(response.message || 'Failed to update AMC payment status.');
        }
      },
      error: (error) => {
        console.error('Error updating AMC payment status:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        
        // Still show success modal but with a warning
        this.updateLocalAMCData(amc._id!, yearIndex, true, currentDate);
        this.amcPaymentSuccess.set(true);
        this.showAMCPaymentModal.set(true);
        this.isAMCPaymentLoading.set(false);
        
        // Show a warning message
        setTimeout(() => {
          this.amcPaymentError.set('Payment successful! AMC status updated locally. Please refresh the page to see the updated status.');
        }, 2000);
      }
    });
  }

  updateLocalAMCData(amcId: string, yearIndex: number, paid: boolean, paiddate: string) {
    const amcs = this.amcs();
    const amcIndex = amcs.findIndex(amc => amc._id === amcId);
    
    if (amcIndex !== -1 && amcs[amcIndex].amcamount[yearIndex]) {
      const updatedAmcs = [...amcs];
      updatedAmcs[amcIndex] = {
        ...updatedAmcs[amcIndex],
        amcamount: updatedAmcs[amcIndex].amcamount.map((amount, index) => 
          index === yearIndex 
            ? { ...amount, paid, paiddate }
            : amount
        )
      };
      this.amcs.set(updatedAmcs);
    }
  }

  closeAMCPaymentModal() {
    this.showAMCPaymentModal.set(false);
    this.selectedAMC.set(null);
    this.selectedAMCYear.set(-1);
    this.amcPaymentError.set('');
    this.amcPaymentSuccess.set(false);
  }

  getAMCPaymentAmount(amc: AMC, yearIndex: number): number {
    return amc.amcamount[yearIndex]?.amount || 0;
  }

  canPayAMC(amc: AMC, yearIndex: number): boolean {
    const amcAmount = amc.amcamount[yearIndex];
    return amcAmount && !amcAmount.paid;
  }

  getCurrentDate(): string {
    return this.formatDate(new Date().toISOString());
  }

  // =============== Contract Documents Methods ===============
  loadUserContractDocuments() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.contractDocumentsError.set('Please login to view your contract documents');
      return;
    }

    this.contractDocumentsLoading.set(true);
    this.contractDocumentsError.set('');

    this.contractService.getUserContractDocuments().subscribe({
      next: (response) => {
        this.contractDocumentsLoading.set(false);
        
        if (response && response.body && response.body.contracts) {
          this.contractDocuments.set(response.body.contracts);
        }
      },
      error: (error) => {
        this.contractDocumentsLoading.set(false);
        console.error('Error loading contract documents:', error);
        
        if (error.status === 401) {
          this.contractDocumentsError.set('Authentication failed. Please login again.');
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.contractDocumentsError.set('Access denied. You do not have permission to view contract documents.');
        } else {
          this.contractDocumentsError.set('Failed to load contract documents. Please try again later.');
        }
      }
    });
  }

  // Download a specific contract document
  downloadContractDocument(contractId: string, docIndex: number, ticketCustomId: string, carName: string) {
    this.contractService.downloadContractDocument(contractId, docIndex).subscribe({
      next: (blob) => {
        const fileName = `contract_${ticketCustomId}_${carName.replace(/\s+/g, '_')}_${docIndex + 1}.pdf`;
        this.contractService.downloadFile(blob, fileName);
      },
      error: (error) => {
        console.error('Error downloading contract document:', error);
        alert('Failed to download document. Please try again.');
      }
    });
  }

  // Get contract documents for a specific ticket
  getContractDocumentsForTicket(ticketId: string | undefined): ContractDocument[] {
    if (!ticketId) return [];
    return this.contractDocuments().filter(contract => 
      contract.ticketid._id === ticketId
    );
  }

  // Navigate to bookings page
  navigateToBookings() {
    this.router.navigate(['/bookings']);
  }

  // =============== Profile Expansion Methods ===============
  toggleProfileExpansion() {
    this.profileExpanded.set(!this.profileExpanded());
  }

  isProfileExpanded(): boolean {
    return this.profileExpanded();
  }
}
