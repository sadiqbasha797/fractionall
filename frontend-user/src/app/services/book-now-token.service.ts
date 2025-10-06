import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Define interfaces for our data models
export interface BookNowToken {
  _id?: string;
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
  customtokenid: string;
  userid: string;
  amountpaid: number;
  date: string;
  expirydate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookNowTokenResponse {
  status: string;
  body: {
    bookNowToken?: BookNowToken;
    bookNowTokens?: BookNowToken[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookNowTokenService {
  private baseUrl = `${environment.apiUrl}/book-now-tokens`;

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

  // Get book now tokens for the current user
  getUserBookNowTokens(): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a specific book now token by ID
  getBookNowTokenById(id: string): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new book now token
  createBookNowToken(tokenData: Partial<BookNowToken>): Observable<BookNowTokenResponse> {
    return this.http.post<BookNowTokenResponse>(`${this.baseUrl}/`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a book now token
  updateBookNowToken(id: string, tokenData: Partial<BookNowToken>): Observable<BookNowTokenResponse> {
    return this.http.put<BookNowTokenResponse>(`${this.baseUrl}/${id}`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Cancel a book now token
  cancelBookNowToken(id: string, reason?: string): Observable<BookNowTokenResponse> {
    return this.http.post<BookNowTokenResponse>(`${this.baseUrl}/${id}/cancel`, { reason }, {
      headers: this.getAuthHeaders()
    });
  }
}
