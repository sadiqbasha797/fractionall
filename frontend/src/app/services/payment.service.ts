import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface PaymentTransaction {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  notes: any;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: any;
  created_at: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payments: PaymentTransaction[];
    count: number;
    has_more: boolean;
    total_count: number;
  };
}

export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount: number;
  successful_amount: number;
  methods: { [key: string]: number };
}

export interface PaymentStatsResponse {
  success: boolean;
  message: string;
  stats: PaymentStats;
}

export interface PaymentFilters {
  count?: number;
  skip?: number;
  from?: string;
  to?: string;
  status?: string;
  method?: string;
}

export interface RefundRequest {
  paymentId: string;
  refundAmount?: number;
  reason: string;
  transactionType?: 'token' | 'booknowtoken' | 'amc'; // Optional, will be determined by backend
  transactionId?: string; // Optional, will be determined by backend
}

export interface Refund {
  _id: string;
  originalPaymentId: string;
  originalOrderId: string;
  refundId: string;
  refundAmount: number;
  refundStatus: 'initiated' | 'processed' | 'successful' | 'failed' | 'cancelled';
  userId: string;
  transactionType: 'token' | 'booknowtoken' | 'amc';
  transactionId: string;
  refundReason: string;
  refundedBy: string;
  refundInitiatedAt: string;
  refundProcessedAt?: string;
  refundCompletedAt?: string;
  razorpayRefundId?: string;
  razorpayRefundStatus?: string;
  notes?: string;
  refundMethod: 'original' | 'bank_transfer' | 'wallet';
  createdAt: string;
  updatedAt: string;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  data?: {
    refund: Refund;
    razorpayRefund?: any;
  };
}

export interface RefundsListResponse {
  success: boolean;
  message: string;
  data: {
    refunds: Refund[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRefunds: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiUrl = this.configService.getBaseUrl();
  }

  // Get all payment transactions
  getAllPayments(filters: PaymentFilters = {}): Observable<PaymentResponse> {
    let params = new HttpParams();
    
    if (filters.count) params = params.set('count', filters.count.toString());
    if (filters.skip) params = params.set('skip', filters.skip.toString());
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.method) params = params.set('method', filters.method);

    return this.http.get<PaymentResponse>(`${this.apiUrl}/payments/transactions`, { params });
  }

  // Get payment statistics
  getPaymentStats(from?: string, to?: string): Observable<PaymentStatsResponse> {
    let params = new HttpParams();
    
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<PaymentStatsResponse>(`${this.apiUrl}/payments/stats`, { params });
  }

  // Get specific payment details
  getPaymentDetails(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/payment/${paymentId}`);
  }

  // Get order details
  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/order/${orderId}`);
  }

  // Create Razorpay order
  createOrder(amount: number, currency: string = 'INR', receipt?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/create-order`, {
      amount,
      currency,
      receipt
    });
  }

  // Verify payment
  verifyPayment(orderId: string, paymentId: string, signature: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/verify-payment`, {
      order_id: orderId,
      payment_id: paymentId,
      signature
    });
  }

  // Refund payment
  refundPayment(paymentId: string, amount?: number, notes?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/refund`, {
      payment_id: paymentId,
      amount,
      notes
    });
  }

  // Helper method to format amount from paise to rupees
  formatAmount(amountInPaise: number): number {
    return amountInPaise / 100;
  }

  // Helper method to format date
  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  // Helper method to get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'captured':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'created':
      case 'authorized':
        return 'badge-warning';
      case 'refunded':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  // Helper method to get method display name
  getMethodDisplayName(method: string): string {
    const methodNames: { [key: string]: string } = {
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking',
      'wallet': 'Wallet',
      'upi': 'UPI',
      'bank_transfer': 'Bank Transfer',
      'emi': 'EMI',
      'cardless_emi': 'Cardless EMI'
    };
    return methodNames[method] || method.toUpperCase();
  }

  // Refund Management Methods

  // Initiate refund
  initiateRefund(refundRequest: RefundRequest): Observable<RefundResponse> {
    console.log('Initiating refund with request:', refundRequest);
    console.log('Token from localStorage:', localStorage.getItem('token'));
    return this.http.post<RefundResponse>(`${this.apiUrl}/payments/refund/initiate`, refundRequest);
  }

  // Get refund details
  getRefundDetails(refundId: string): Observable<RefundResponse> {
    return this.http.get<RefundResponse>(`${this.apiUrl}/payments/refund/${refundId}`);
  }

  // Get all refunds (admin)
  getAllRefunds(page: number = 1, limit: number = 10, status?: string): Observable<RefundsListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<RefundsListResponse>(`${this.apiUrl}/payments/refunds`, { params });
  }

  // Get user refunds
  getUserRefunds(userId: string, page: number = 1, limit: number = 10): Observable<RefundsListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<RefundsListResponse>(`${this.apiUrl}/payments/refunds/user/${userId}`, { params });
  }

  // Cancel refund
  cancelRefund(refundId: string, reason: string): Observable<RefundResponse> {
    return this.http.put<RefundResponse>(`${this.apiUrl}/payments/refund/${refundId}/cancel`, { reason });
  }

  // Helper method to get refund status badge class
  getRefundStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'initiated':
        return 'badge-warning';
      case 'processed':
        return 'badge-info';
      case 'successful':
        return 'badge-success';
      case 'failed':
        return 'badge-danger';
      case 'cancelled':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  }

  // Helper method to get refund status display name
  getRefundStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'initiated': 'Initiated',
      'processed': 'Processed',
      'successful': 'Successful',
      'failed': 'Failed',
      'cancelled': 'Cancelled'
    };
    return statusNames[status] || status;
  }

  // Helper method to get transaction type display name
  getTransactionTypeDisplayName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'token': 'Token Purchase',
      'booknowtoken': 'Book Now Token',
      'amc': 'AMC Payment'
    };
    return typeNames[type] || type;
  }

  // Process token refund
  processTokenRefund(tokenType: 'token' | 'booknow-token', tokenId: string, refundData: { paymentId?: string, refundAmount?: number, reason?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/refund/${tokenType}/${tokenId}`, refundData);
  }
}
