import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Define interfaces for our data models
export interface Ticket {
  _id?: string;
  userid: string;
  carid: {
    _id: string;
    carname: string;
    color: string;
    milege: string;
    seating: number;
    features: string[];
    brandname: string;
    price: string;
    fractionprice: string;
    tokenprice: string;
    expectedpurchasedate: string;
    status: string;
    totaltickets: number;
    bookNowTokenAvailable: number;
    bookNowTokenPrice: string;
    tokensavailble: number;
    images: string[];
    createdBy: string;
    createdByModel: string;
    createdAt: string;
    __v: number;
    ticketsavilble: number;
  };
  ticketcustomid: string;
  ticketprice: number;
  pricepaid: number;
  pendingamount: number;
  ticketexpiry: string;
  ticketbroughtdate: string;
  comments: string;
  paymentid: string;
  ticketstatus: string;
  resold: boolean;
  createdby: string;
  createdByModel: string;
  createdate: string;
}

export interface TicketResponse {
  status: string;
  body: {
    ticket?: Ticket;
    tickets?: Ticket[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private baseUrl = 'https://fractionbackend.projexino.com/api/tickets';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

  // Get tickets for the current user
  getUserTickets(): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.baseUrl}/my-tickets`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a specific ticket by ID
  getTicketById(id: string): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
