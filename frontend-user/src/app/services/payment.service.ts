import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface PaymentOrder {
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
  };
}

export interface PaymentVerification {
  order_id: string;
  payment_id: string;
  signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  payment: {
    order_id: string;
    payment_id: string;
    signature: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl = `${environment.apiUrl}/payments`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      console.error('No token found in auth service');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get Razorpay Key ID
  getRazorpayKey(): Observable<{ key: string }> {
    return this.http.get<{ key: string }>(`${environment.apiUrl.replace('/api', '')}/api/razorpay-key`);
  }

  // Create payment order
  createOrder(orderData: PaymentOrder): Observable<PaymentOrderResponse> {
    return this.http.post<PaymentOrderResponse>(`${this.baseUrl}/create-order`, orderData);
  }

  // Verify payment
  verifyPayment(verificationData: PaymentVerification): Observable<PaymentVerificationResponse> {
    return this.http.post<PaymentVerificationResponse>(`${this.baseUrl}/verify-payment`, verificationData);
  }

  // Get payment details
  getPaymentDetails(paymentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payment/${paymentId}`);
  }

  // Get order details
  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/order/${orderId}`);
  }

  // Process refund
  processRefund(paymentId: string, amount?: number, notes?: string): Observable<any> {
    const body: any = { payment_id: paymentId };
    if (amount) body.amount = amount;
    if (notes) body.notes = { reason: notes };
    
    return this.http.post(`${this.baseUrl}/refund`, body);
  }

  // Update AMC payment status after successful payment
  updateAMCPaymentStatus(amcId: string, yearIndex: number, paid: boolean, paiddate?: string): Observable<any> {
    const body: any = {
      yearIndex,
      paid,
      paiddate
    };
    
    return this.http.put(`${environment.apiUrl}/amcs/${amcId}/payment-status`, body, {
      headers: this.getAuthHeaders()
    });
  }
}
