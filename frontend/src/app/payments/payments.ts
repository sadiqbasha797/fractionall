import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, PaymentTransaction, PaymentStats, PaymentFilters, Refund, RefundRequest } from '../services/payment.service';
import { TokenService } from '../services/token.service';
import { BookNowTokenService } from '../services/book-now-token.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit {
  // Data properties
  transactions: PaymentTransaction[] = [];
  stats: PaymentStats | null = null;
  selectedTransaction: PaymentTransaction | null = null;
  refunds: Refund[] = [];
  selectedRefund: Refund | null = null;
  pendingTokenRefunds: any[] = [];

  // Authentication status
  isAuthenticated = false;
  userRole = '';
  authToken = '';

  // Loading states
  loading = false;
  loadingStats = false;
  loadingRefunds = false;

  // Loading state for refresh functionality
  isLoading: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 10; // Set to 10 for better pagination
  totalPages = 1;
  totalItems = 0;
  hasMore = false;

  // Filters
  filters: PaymentFilters = {
    count: 10, // Set to 10 for better pagination
    skip: 0
  };

  // Filter form values
  statusFilter = '';
  methodFilter = '';
  fromDate = '';
  toDate = '';
  searchTerm = '';

  // Excel-like filter properties
  showFilters = false;
  uniqueEmails: string[] = [];
  uniqueMethods: string[] = [];
  amountRangeFilter = 'all';

  // Modal state
  showDetailsModal = false;
  showExportModal = false;
  showRefundModal = false;
  showRefundDetailsModal = false;
  showRefundsListModal = false;

  // Refund form
  refundForm: RefundRequest = {
    paymentId: '',
    refundAmount: 0,
    reason: ''
  };

  // Refund amount in rupees for display
  refundAmountInRupees: number = 0;

  // Available filter options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'captured', label: 'Successful' },
    { value: 'failed', label: 'Failed' },
    { value: 'created', label: 'Pending' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'refunded', label: 'Refunded' }
  ];

  methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'card', label: 'Card' },
    { value: 'netbanking', label: 'Net Banking' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' }
  ];

  constructor(
    private paymentService: PaymentService,
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check authentication status
    this.checkAuthStatus();

    this.loadTransactions();
    this.loadStats();
    this.loadRefunds();
    this.loadPendingTokenRefunds();
  }

  checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    this.userRole = this.authService.getUserRole() || '';
    this.authToken = this.authService.getToken() || '';

    console.log('Authentication Status:', {
      isAuthenticated: this.isAuthenticated,
      userRole: this.userRole,
      hasToken: !!this.authToken,
      tokenLength: this.authToken.length
    });
  }

  // Load transactions with current filters
  loadTransactions(loadMore = false, page?: number): void {
    this.loading = true;
    this.isLoading = true;

    if (page !== undefined) {
      this.currentPage = page;
    }

    if (!loadMore && page === undefined) {
      // Only reset to first page when applying filters (not when navigating to specific page)
      this.currentPage = 1;
      this.transactions = [];
    }

    // Always calculate skip based on current page
    this.filters.skip = (this.currentPage - 1) * this.pageSize;

    this.filters.count = this.pageSize;
    this.filters.status = this.statusFilter || undefined;
    this.filters.method = this.methodFilter || undefined;
    this.filters.from = this.fromDate || undefined;
    this.filters.to = this.toDate || undefined;

    this.paymentService.getAllPayments(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          if (loadMore) {
            this.transactions = [...this.transactions, ...response.data.payments];
          } else {
            this.transactions = response.data.payments;
            this.extractUniqueValues();
          }
          this.hasMore = response.data.has_more;
          this.totalItems = response.data.total_count;
          this.totalPages = Math.ceil(response.data.total_count / this.pageSize);
        }
        this.loading = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  // Load payment statistics
  loadStats(): void {
    this.loadingStats = true;

    this.paymentService.getPaymentStats(this.fromDate, this.toDate).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.stats;
        }
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loadingStats = false;
      }
    });
  }

  // Apply filters
  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions();
    this.loadStats();
  }

  // Reset filters
  resetFilters(): void {
    this.statusFilter = '';
    this.methodFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  // Clear all filters (alias for resetFilters)
  clearFilters(): void {
    this.resetFilters();
  }

  // Toggle filters visibility
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Extract unique values for filters
  extractUniqueValues(): void {
    this.uniqueEmails = [...new Set(this.transactions.map(t => t.email).filter(email => email))];
    this.uniqueMethods = [...new Set(this.transactions.map(t => t.method).filter(method => method))];
  }

  // Load more transactions (pagination)
  loadMoreTransactions(): void {
    if (this.hasMore && !this.loading) {
      this.currentPage++;
      this.loadTransactions(true);
    }
  }

  // Go to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTransactions(false, page);
    }
  }

  // Get page numbers for pagination display
  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // Helper method for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Show transaction details
  showTransactionDetails(transaction: PaymentTransaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsModal = true;
  }

  // Close details modal
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTransaction = null;
  }

  // Export transactions
  exportTransactions(): void {
    this.showExportModal = true;
  }

  // Close export modal
  closeExportModal(): void {
    this.showExportModal = false;
  }

  // Download CSV
  downloadCSV(): void {
    const csvData = this.convertToCSV(this.transactions);
    this.downloadFile(csvData, 'transactions.csv', 'text/csv');
    this.closeExportModal();
  }

  // Convert transactions to CSV format
  convertToCSV(transactions: PaymentTransaction[]): string {
    const headers = [
      'Transaction ID',
      'Amount (₹)',
      'Status',
      'Method',
      'Email',
      'Contact',
      'Date',
      'Order ID'
    ];

    const csvRows = [
      headers.join(','),
      ...transactions.map(t => [
        t.id,
        this.paymentService.formatAmount(t.amount),
        t.status,
        this.paymentService.getMethodDisplayName(t.method),
        t.email,
        t.contact,
        this.paymentService.formatDate(t.created_at),
        t.order_id
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  // Download file helper
  downloadFile(data: string, filename: string, type: string): void {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for template
  formatAmount(amountInPaise: number): number {
    return this.paymentService.formatAmount(amountInPaise);
  }

  formatDate(timestamp: number | string): string {
    if (typeof timestamp === 'string') {
      // Handle ISO string dates
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Handle Unix timestamp (in seconds)
      return this.paymentService.formatDate(timestamp);
    }
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

  getStatusBadgeClass(status: string): string {
    return this.paymentService.getStatusBadgeClass(status);
  }


  // Filter transactions by search term
  get filteredTransactions(): PaymentTransaction[] {
    if (!this.searchTerm) {
      return this.transactions;
    }

    const term = this.searchTerm.toLowerCase();
    return this.transactions.filter(transaction =>
      transaction.id.toLowerCase().includes(term) ||
      transaction.email.toLowerCase().includes(term) ||
      transaction.contact.includes(term) ||
      transaction.order_id?.toLowerCase().includes(term)
    );
  }

  // Track by function for ngFor optimization
  trackByTransactionId(index: number, transaction: PaymentTransaction): string {
    return transaction.id;
  }

  // Refund Management Methods

  // Load refunds
  loadRefunds(): void {
    this.loadingRefunds = true;

    this.paymentService.getAllRefunds(1, 50).subscribe({
      next: (response) => {
        if (response.success) {
          this.refunds = response.data.refunds;
        }
        this.loadingRefunds = false;
      },
      error: (error) => {
        console.error('Error loading refunds:', error);
        this.loadingRefunds = false;
      }
    });
  }

  // Show refund modal
  showRefundModalForTransaction(transaction: PaymentTransaction): void {
    this.refundForm = {
      paymentId: transaction.id,
      refundAmount: transaction.amount, // Will be set in paise
      reason: ''
    };
    this.refundAmountInRupees = this.formatAmount(transaction.amount); // Display in rupees
    this.showRefundModal = true;
  }

  // Initiate refund
  initiateRefund(): void {
    if (!this.refundForm.reason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    // Check authentication before proceeding
    this.checkAuthStatus();

    if (!this.isAuthenticated) {
      alert('You are not authenticated. Please log in again.');
      return;
    }

    if (this.userRole !== 'superadmin') {
      alert('Only superadmins can initiate refunds.');
      return;
    }

    // Convert rupees to paise for the API call
    const refundRequest = {
      ...this.refundForm,
      refundAmount: Math.round(this.refundAmountInRupees * 100) // Convert rupees to paise
    };

    console.log('Initiating refund with form:', refundRequest);
    console.log('Authentication status:', {
      isAuthenticated: this.isAuthenticated,
      userRole: this.userRole,
      hasToken: !!this.authToken
    });

    this.paymentService.initiateRefund(refundRequest).subscribe({
      next: (response) => {
        console.log('Refund initiation response:', response);
        if (response.success) {
          alert('Refund initiated successfully');
          this.closeRefundModal();
          this.loadRefunds();
          this.loadTransactions();
        } else {
          alert('Failed to initiate refund: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error initiating refund:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        alert('Failed to initiate refund: ' + (error.error?.message || error.message));
      }
    });
  }

  // Show refund details
  showRefundDetails(refund: Refund): void {
    this.selectedRefund = refund;
    this.showRefundDetailsModal = true;
  }

  // Show refunds list
  showRefundsList(): void {
    this.showRefundsListModal = true;
  }

  // Close modals
  closeRefundModal(): void {
    this.showRefundModal = false;
    this.refundForm = {
      paymentId: '',
      refundAmount: 0,
      reason: ''
    };
    this.refundAmountInRupees = 0;
  }

  closeRefundDetailsModal(): void {
    this.showRefundDetailsModal = false;
    this.selectedRefund = null;
  }

  closeRefundsListModal(): void {
    this.showRefundsListModal = false;
  }

  // Cancel refund
  cancelRefund(refundId: string): void {
    const reason = prompt('Please provide a reason for cancelling this refund:');
    if (!reason) return;

    this.paymentService.cancelRefund(refundId, reason).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Refund cancelled successfully');
          this.loadRefunds();
        } else {
          alert('Failed to cancel refund: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error cancelling refund:', error);
        alert('Failed to cancel refund');
      }
    });
  }

  // Helper methods for refunds
  getRefundStatusBadgeClass(status: string): string {
    return this.paymentService.getRefundStatusBadgeClass(status);
  }

  getRefundStatusDisplayName(status: string): string {
    return this.paymentService.getRefundStatusDisplayName(status);
  }

  getTransactionTypeDisplayName(type: string): string {
    return this.paymentService.getTransactionTypeDisplayName(type);
  }

  // Helper method for payment status display
  getStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'captured': 'Successful',
      'authorized': 'Authorized',
      'failed': 'Failed',
      'pending': 'Pending'
    };
    return statusNames[status] || status;
  }

  // Helper method for payment method display
  getMethodDisplayName(method: string): string {
    const methodNames: { [key: string]: string } = {
      'card': 'Card',
      'netbanking': 'Net Banking',
      'wallet': 'Wallet',
      'upi': 'UPI',
      'bank_transfer': 'Bank Transfer'
    };
    return methodNames[method] || method.toUpperCase();
  }

  // Check if transaction can be refunded
  canRefundTransaction(transaction: PaymentTransaction): boolean {
    return transaction.status === 'captured' &&
      transaction.amount > 0 &&
      !this.hasExistingRefund(transaction.id);
  }

  // Check if transaction has existing refund
  hasExistingRefund(paymentId: string): boolean {
    return this.refunds.some(refund =>
      refund.originalPaymentId === paymentId &&
      ['initiated', 'processed', 'successful'].includes(refund.refundStatus)
    );
  }

  // Refresh functionality
  refreshTransactions(): void {
    this.loadTransactions();
    this.loadStats();
    this.loadRefunds();
    this.loadPendingTokenRefunds();
  }

  // Load pending token refunds
  loadPendingTokenRefunds(): void {
    // Load tokens with refund_initiated status
    this.tokenService.getTokens().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.tokens) {
          const refundInitiatedTokens = response.body.tokens
            .filter((token: any) => token.status === 'refund_initiated')
            .map((token: any) => ({
              ...token,
              tokenType: 'token',
              userName: token.userid?.name || 'N/A',
              userEmail: token.userid?.email || 'N/A',
              userPhone: token.userid?.phone || 'N/A',
              carName: token.carid?.carname || 'N/A'
            }));

          this.pendingTokenRefunds = [...this.pendingTokenRefunds, ...refundInitiatedTokens];
        }
      },
      error: (error) => {
        console.error('Error loading pending token refunds:', error);
      }
    });

    // Load book now tokens with refund_initiated status
    this.bookNowTokenService.getBookNowTokens().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.bookNowTokens) {
          const refundInitiatedBookNowTokens = response.body.bookNowTokens
            .filter((token: any) => token.status === 'refund_initiated')
            .map((token: any) => ({
              ...token,
              tokenType: 'booknow-token',
              userName: token.userid?.name || 'N/A',
              userEmail: token.userid?.email || 'N/A',
              userPhone: token.userid?.phone || 'N/A',
              carName: token.carid?.carname || 'N/A'
            }));

          this.pendingTokenRefunds = [...this.pendingTokenRefunds, ...refundInitiatedBookNowTokens];
        }
      },
      error: (error) => {
        console.error('Error loading pending book now token refunds:', error);
      }
    });
  }

  // Process token refund
  processTokenRefund(refund: any): void {
    const paymentId = prompt('Enter Razorpay Payment ID (optional):');
    const refundAmount = prompt('Enter refund amount (optional, leave empty for full refund):');
    const reason = prompt('Enter refund reason (optional):');

    if (paymentId !== null) { // User didn't cancel
      const refundData: any = {};
      if (paymentId) refundData.paymentId = paymentId;
      if (refundAmount) refundData.refundAmount = parseFloat(refundAmount);
      if (reason) refundData.reason = reason;

      this.paymentService.processTokenRefund(refund.tokenType, refund._id, refundData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Token refund processed successfully!');
            // Reload pending refunds
            this.pendingTokenRefunds = [];
            this.loadPendingTokenRefunds();
            // Reload transactions to show updated refund status
            this.loadTransactions();
          } else {
            alert('Failed to process refund: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error processing token refund:', error);
          alert('Failed to process refund. Please try again.');
        }
      });
    }
  }
}
