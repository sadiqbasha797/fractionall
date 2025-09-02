import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface Ticket {
  _id?: string;
  userid: string;
  carid: string;
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
  private baseUrl = 'http://localhost:5000/api/tickets';

  constructor(private http: HttpClient) { }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found in localStorage');
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