import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { TokenService, Token } from '../services/token.service';
import { BookingService, Booking } from '../services/booking.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user: any = {
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
  };

  // Real tickets data from API
  tickets: Ticket[] = [];

  // Real tokens data from API
  tokens: Token[] = [];
  tokensLoading = false;
  tokensError = '';

  // Real bookings data from API
  bookings: Booking[] = [];
  bookingsLoading = false;
  bookingsError = '';
  currentMonth = new Date();
  calendarDays: any[] = [];

  // KYC form data
  kycForm = {
    aadharId: '',
    panId: '',
    file: null as File | null
  };

  showDocModal = false;
  fileError = '';
  fileInfo = '';
  aadharError = '';
  panError = '';
  submittingKyc = false;

  loading = false;
  error = '';

  ticketsLoading = false;
  ticketsError = '';

  // Edit profile modal state
  showEditModal = false;
  editSubmitting = false;
  editSuccessMessage = '';
  editErrorMessage = '';
  editForm: any = {
    name: '',
    email: '',
    phone: '',
    dateofbirth: '',
    location: '',
    address: '',
    pincode: ''
  };

  // Verify email modal state (after email change)
  showVerifyEmailModal = false;
  verifySubmitting = false;
  verifyErrorMessage = '';
  verifySuccessMessage = '';
  verifyForm = { email: '', code: '' };

  // Change password modal state
  showChangePasswordModal = false;
  passwordRequesting = false;
  passwordSubmitting = false;
  passwordErrorMessage = '';
  passwordSuccessMessage = '';
  resetForm = { code: '', newPassword: '' };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private ticketService: TicketService,
    private tokenService: TokenService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    // Don't load tickets here - wait for profile to load first
  }

  loadUserProfile() {
    this.loading = true;
    this.error = '';
    
    // First try to get from localStorage if available
    const storedUser = this.authService.getUserData();
    if (storedUser) {
      this.user = { ...this.user, ...storedUser };
    }

    // Check if user is authenticated
    const token = this.authService.getToken();
    if (!token) {
      this.loading = false;
      this.error = 'Please login to view your profile.';
      return;
    }

    // Then fetch fresh data from API
    this.userService.getProfile().subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.body && response.body.user) {
          this.user = { ...this.user, ...response.body.user };
          // Update stored user data
          this.authService.setUserData(this.user);
          // Now load tickets, tokens, and bookings since user is authenticated
          this.loadUserTickets();
          this.loadUserTokens();
          this.loadUserBookings();
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading profile:', error);
        
        if (error.status === 401) {
          this.error = 'Authentication failed. Please login again.';
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.error = 'Access denied. You do not have permission to view this profile.';
        } else {
          this.error = 'Failed to load profile data. Please try again later.';
        }
        
        // If API fails but we have stored data, use that
        if (!this.user.name && storedUser) {
          this.user = { ...this.user, ...storedUser };
        }
      }
    });
  }

    loadUserTickets() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.ticketsError = 'Please login to view your tickets';
      return;
    }

    this.ticketsLoading = true;
    this.ticketsError = '';

    this.ticketService.getUserTickets().subscribe({
      next: (response) => {
        this.ticketsLoading = false;
        
        if (response && response.body && response.body.tickets) {
          this.tickets = response.body.tickets;
          // Trigger change detection
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.ticketsLoading = false;
        console.error('Error loading tickets:', error);
        
        if (error.status === 401) {
          this.ticketsError = 'Authentication failed. Please login again.';
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.ticketsError = 'Access denied. You do not have permission to view tickets.';
        } else {
          this.ticketsError = 'Failed to load tickets. Please try again later.';
        }
      }
    });
  }

  loadUserTokens() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.tokensError = 'Please login to view your tokens';
      return;
    }

    this.tokensLoading = true;
    this.tokensError = '';

    this.tokenService.getUserTokens().subscribe({
      next: (response) => {
        this.tokensLoading = false;
        
        if (response && response.body && response.body.tokens) {
          this.tokens = response.body.tokens;
          // Trigger change detection
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.tokensLoading = false;
        console.error('Error loading tokens:', error);
        
        if (error.status === 401) {
          this.tokensError = 'Authentication failed. Please login again.';
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.tokensError = 'Access denied. You do not have permission to view tokens.';
        } else {
          this.tokensError = 'Failed to load tokens. Please try again later.';
        }
      }
    });
  }

  loadUserBookings() {
    // Check if user is authenticated before making the request
    const token = this.authService.getToken();
    if (!token) {
      this.bookingsError = 'Please login to view your bookings';
      return;
    }

    this.bookingsLoading = true;
    this.bookingsError = '';

    this.bookingService.getUserBookings().subscribe({
      next: (response) => {
        this.bookingsLoading = false;
        
        if (response && response.body && response.body.bookings) {
          this.bookings = response.body.bookings;
          this.generateCalendar();
          // Trigger change detection
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        this.bookingsLoading = false;
        console.error('Error loading bookings:', error);
        
        if (error.status === 401) {
          this.bookingsError = 'Authentication failed. Please login again.';
          // Clear invalid token and user data
          this.authService.removeToken();
          this.authService.removeUserData();
        } else if (error.status === 403) {
          this.bookingsError = 'Access denied. You do not have permission to view bookings.';
        } else {
          this.bookingsError = 'Failed to load bookings. Please try again later.';
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
    return this.user.verified ? 'Verified' : 'Not Verified';
  }

  // Helper method to get KYC status display
  getKycStatusDisplay(): string {
    switch (this.user.kycStatus) {
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
    switch (this.user.kycStatus) {
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
    this.showDocModal = true;
  }

  closeDocModal() {
    this.showDocModal = false;
    this.resetKycForm();
  }

  resetKycForm() {
    this.kycForm = {
      aadharId: '',
      panId: '',
      file: null
    };
    this.fileError = '';
    this.fileInfo = '';
    this.aadharError = '';
    this.panError = '';
    this.submittingKyc = false;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.resetFileMessages();
      return;
    }

    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files are accepted. Please upload a single PDF with front and back pages.';
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.fileError = 'File is too large. Please upload a PDF smaller than 10 MB.';
      event.target.value = '';
      return;
    }

    this.kycForm.file = file;
    this.fileInfo = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    this.fileError = '';
  }

  resetFileMessages() {
    this.fileError = '';
    this.fileInfo = '';
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
    this.aadharError = '';
    if (this.kycForm.aadharId.trim()) {
      const validation = this.validateAadharId(this.kycForm.aadharId);
      if (!validation.valid) {
        this.aadharError = validation.message || '';
      }
    }
  }

  // Real-time validation for PAN ID
  onPanIdChange() {
    this.panError = '';
    if (this.kycForm.panId.trim()) {
      const validation = this.validatePanId(this.kycForm.panId);
      if (!validation.valid) {
        this.panError = validation.message || '';
      }
    }
  }

  onSubmitKyc() {
    // Clear previous errors
    this.aadharError = '';
    this.panError = '';
    this.fileError = '';

    // Validate Aadhar ID
    const aadharValidation = this.validateAadharId(this.kycForm.aadharId);
    if (!aadharValidation.valid) {
      this.aadharError = aadharValidation.message || '';
      return;
    }

    // Validate PAN ID
    const panValidation = this.validatePanId(this.kycForm.panId);
    if (!panValidation.valid) {
      this.panError = panValidation.message || '';
      return;
    }

    // Validate file
    if (!this.kycForm.file) {
      this.fileError = 'Please upload the PDF containing both Aadhar and PAN card images.';
      return;
    }

    // Set submitting state
    this.submittingKyc = true;

    // First, update the government IDs in user profile
    const governmentIds = {
      aadharid: this.kycForm.aadharId.replace(/[\s-]/g, ''),
      panid: this.kycForm.panId.replace(/\s/g, '').toUpperCase()
    };

    // Update user profile with government IDs
    this.userService.updateProfile({ governmentid: governmentIds }).subscribe({
      next: (response) => {
        // After successfully updating government IDs, submit KYC documents
        this.submitKycDocuments();
      },
      error: (error) => {
        this.submittingKyc = false;
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
        this.submittingKyc = false;
        if (response && response.status === 'success') {
          // Update user's KYC status
          this.user.kycStatus = 'submitted';
          alert('KYC documents submitted successfully! Your application is under review.');
          this.closeDocModal();
        } else {
          alert('Failed to submit KYC documents. Please try again.');
        }
      },
      error: (error) => {
        this.submittingKyc = false;
        console.error('Error submitting KYC documents:', error);
        alert('Failed to submit KYC documents. Please try again.');
      }
    });
  }

  // Calendar generation methods
  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    this.calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ day: '', isEmpty: true });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = this.bookingService.hasBookingsOnDate(this.bookings, date);
      const bookingStatus = this.bookingService.getBookingStatusForDate(this.bookings, date);
      
      this.calendarDays.push({
        day: day,
        date: date,
        isEmpty: false,
        bookings: dayBookings,
        bookingStatus: bookingStatus,
        isToday: this.isToday(date)
      });
    }
  }

  // Helper method to check if a date is today
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Get current month display text
  getCurrentMonthDisplay(): string {
    return this.currentMonth.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  // Navigate to previous month
  goToPreviousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  // Navigate to next month
  goToNextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
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
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
    // Initialize form with current user values
    this.editForm = {
      name: this.user.name || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      dateofbirth: this.user.dateofbirth ? new Date(this.user.dateofbirth).toISOString().split('T')[0] : '',
      location: this.user.location || '',
      address: this.user.address || '',
      pincode: this.user.pincode || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    if (this.editSubmitting) return;
    this.showEditModal = false;
  }

  saveProfile() {
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
    this.editSubmitting = true;

    const payload: any = {
      name: this.editForm.name?.trim(),
      email: this.editForm.email?.trim(),
      phone: this.editForm.phone?.trim(),
      dateofbirth: this.editForm.dateofbirth ? new Date(this.editForm.dateofbirth).toISOString() : '',
      location: this.editForm.location?.trim(),
      address: this.editForm.address?.trim(),
      pincode: this.editForm.pincode?.trim()
    };

    this.userService.updateProfile(payload).subscribe({
      next: (response) => {
        this.editSubmitting = false;
        if (response && response.status === 'success') {
          const updatedUser = response.body?.user || {};
          this.user = { ...this.user, ...updatedUser };
          this.authService.setUserData(this.user);
          const emailChanged = !!response.body?.emailChangeVerificationSent;
          if (emailChanged) {
            this.verifyForm.email = this.user.email;
            this.showVerifyEmailModal = true;
            this.editSuccessMessage = 'Profile saved. Please verify your new email.';
          } else {
            this.editSuccessMessage = 'Profile updated successfully.';
          }
          // Close modal after short delay if no email verification needed
          if (!emailChanged) {
            setTimeout(() => { this.showEditModal = false; }, 800);
          }
        } else {
          this.editErrorMessage = response?.message || 'Failed to update profile.';
        }
      },
      error: (error) => {
        this.editSubmitting = false;
        this.editErrorMessage = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  // =============== Verify Email (after change) ===============
  closeVerifyEmailModal() {
    if (this.verifySubmitting) return;
    this.showVerifyEmailModal = false;
    this.verifyForm = { email: '', code: '' };
    this.verifyErrorMessage = '';
    this.verifySuccessMessage = '';
  }

  verifyNewEmail() {
    this.verifyErrorMessage = '';
    this.verifySuccessMessage = '';
    if (!this.verifyForm.email || !this.verifyForm.code) {
      this.verifyErrorMessage = 'Email and verification code are required.';
      return;
    }
    this.verifySubmitting = true;
    this.authService.verifyEmail({ email: this.verifyForm.email, code: this.verifyForm.code }).subscribe({
      next: (response) => {
        this.verifySubmitting = false;
        if (response?.status === 'success') {
          // Update token and user data
          if (response.body?.token) {
            this.authService.setToken(response.body.token);
          }
          if (response.body?.user) {
            this.user = { ...this.user, ...response.body.user };
            this.authService.setUserData(this.user);
          }
          this.verifySuccessMessage = 'Email verified successfully!';
          setTimeout(() => { this.closeVerifyEmailModal(); }, 800);
        } else {
          this.verifyErrorMessage = response?.message || 'Verification failed.';
        }
      },
      error: (error) => {
        this.verifySubmitting = false;
        this.verifyErrorMessage = error.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  resendVerifyCode() {
    if (!this.verifyForm.email) return;
    this.verifyErrorMessage = '';
    this.verifySuccessMessage = '';
    this.verifySubmitting = true;
    this.authService.resendVerificationCode(this.verifyForm.email).subscribe({
      next: () => {
        this.verifySubmitting = false;
        this.verifySuccessMessage = 'Verification code sent.';
      },
      error: (error) => {
        this.verifySubmitting = false;
        this.verifyErrorMessage = error.error?.message || 'Failed to send code.';
      }
    });
  }

  // =============== Change Password ===============
  openChangePasswordModal() {
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.resetForm = { code: '', newPassword: '' };
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal() {
    if (this.passwordRequesting || this.passwordSubmitting) return;
    this.showChangePasswordModal = false;
  }

  requestPasswordCode() {
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.passwordRequesting = true;
    const email = this.user.email;
    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.passwordRequesting = false;
        this.passwordSuccessMessage = 'Reset code sent to your email.';
      },
      error: (error) => {
        this.passwordRequesting = false;
        this.passwordErrorMessage = error.error?.message || 'Failed to send reset code.';
      }
    });
  }

  submitNewPassword() {
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    if (!this.resetForm.code || !this.resetForm.newPassword) {
      this.passwordErrorMessage = 'Code and new password are required.';
      return;
    }
    this.passwordSubmitting = true;
    const payload = { email: this.user.email, code: this.resetForm.code, newPassword: this.resetForm.newPassword };
    this.authService.resetPassword(payload).subscribe({
      next: (response) => {
        this.passwordSubmitting = false;
        if (response?.status === 'success') {
          this.passwordSuccessMessage = 'Password changed successfully.';
          setTimeout(() => { this.closeChangePasswordModal(); }, 800);
        } else {
          this.passwordErrorMessage = response?.message || 'Failed to change password.';
        }
      },
      error: (error) => {
        this.passwordSubmitting = false;
        this.passwordErrorMessage = error.error?.message || 'Failed to change password.';
      }
    });
  }
}
