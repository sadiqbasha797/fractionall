import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = 'http://localhost:5000/api/payments';

  constructor(private http: HttpClient) {}

  // Get Razorpay Key ID
  getRazorpayKey(): Observable<{ key: string }> {
    return this.http.get<{ key: string }>('http://localhost:5000/api/razorpay-key');
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
}
