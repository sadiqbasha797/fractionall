import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dateofbirth?: string;
  address?: string;
  location?: string;
  pincode?: string;
  verified: boolean;
  profileimage?: string;
  governmentid?: {
    aadharid?: string;
    panid?: string;
    licenseid?: string;
    income?: string;
  };
  kycStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Car {
  _id?: string;
  carname: string;
  color: string;
  milege: string;
  seating: number;
  features: string[];
  brandname: string;
  price: number;
  fractionprice: number;
  tokenprice: number;
  expectedpurchasedate: string;
  ticketsavilble: number;
  totaltickets: number;
  tokensavailble: number;
  bookNowTokenAvailable: number;
  bookNowTokenPrice: number;
  amcperticket: number;
  contractYears: number;
  location: string;
  pincode: string;
  description: string;
  images: string[];
  createdBy: string;
  createdByModel: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  _id?: string;
  userid: string | User;
  carid: string | Car;
  ticketcustomid: string;
  ticketprice: number;
  pricepaid: number;
  pendingamount: number;
  ticketexpiry: string;
  ticketbroughtdate: string;
  comments?: string;
  paymentid?: string;
  ticketstatus: 'active' | 'expired' | 'cancelled';
  resold: boolean;
  createdby: string;
  createdByModel: string;
  createdate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketResponse {
  status: string;
  body: {
    ticket: Ticket;
    tickets: Ticket[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/tickets');
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

  // Create a new ticket
  createTicket(ticketData: Ticket): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.baseUrl}/`, ticketData, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all tickets
  getTickets(): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a ticket by ID
  getTicketById(id: string): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a ticket by ID
  updateTicket(id: string, ticketData: Ticket): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.baseUrl}/${id}`, ticketData, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete a ticket by ID
  deleteTicket(id: string): Observable<TicketResponse> {
    return this.http.delete<TicketResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get tickets for the current user
  getUserTickets(): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.baseUrl}/my-tickets`, {
      headers: this.getAuthHeaders()
    });
  }
}
