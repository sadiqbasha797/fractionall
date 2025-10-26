import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.service';
import { Car } from './car.service';
import { Ticket, Car as TicketCar } from './ticket.service';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface AMCAmount {
  year: number;
  amount: number;
  paid: boolean;
  duedate?: string;
  paiddate?: string;
  penality: number;
}

export interface AMC {
  _id?: string;
  userid: string | User;
  carid: string | Car;
  ticketid: string | Ticket;
  amcamount: AMCAmount[];
  createdAt?: string;
  updatedAt?: string;
}


export interface AMCResponse {
  status: string;
  body: {
    amc?: AMC;
    amcs?: AMC[];
  };
  message: string;
}

export interface PaymentStatusUpdate {
  yearIndex: number;
  paid: boolean;
  paiddate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AmcService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/amcs');
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Create a new AMC
  createAMC(amcData: Partial<AMC>): Observable<AMCResponse> {
    return this.http.post<AMCResponse>(`${this.baseUrl}/`, amcData, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all AMCs
  getAMCs(): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get an AMC by ID
  getAMCById(id: string): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update an AMC by ID
  updateAMC(id: string, amcData: Partial<AMC>): Observable<AMCResponse> {
    return this.http.put<AMCResponse>(`${this.baseUrl}/${id}`, amcData, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete an AMC by ID
  deleteAMC(id: string): Observable<AMCResponse> {
    return this.http.delete<AMCResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update AMC payment status
  updateAMCPaymentStatus(id: string, paymentData: PaymentStatusUpdate): Observable<AMCResponse> {
    return this.http.put<AMCResponse>(`${this.baseUrl}/${id}/payment-status`, paymentData, {
      headers: this.getAuthHeaders()
    });
  }

  // Generate AMC automatically for all active tickets
}
