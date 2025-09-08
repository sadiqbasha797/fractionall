import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
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
  bookNowTokenPrice: number;
  expectedpurchasedate?: string;
  status?: string;
  totaltickets: number;
  bookNowTokenAvailable: number;
  tokensavailble: number;
  images: string[];
  createdBy?: string;
  createdByModel?: string;
  createdAt?: string;
  __v?: number;
  ticketsavilble: number;
  location?: string;
  pincode?: string;
  amcperticket?: number;
  contractYears?: number;
  description?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  dateofbirth?: string;
  address?: string;
  location?: string;
  pincode?: string;
  kycStatus?: string;
  profileimage?: string;
  governmentid?: {
    aadharid?: string;
    panid?: string;
    licenseid?: string;
    income?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BookNowToken {
  _id?: string;
  carid: string | Car;
  customtokenid: string;
  userid: string | User;
  amountpaid: number;
  date?: string;
  expirydate: string;
  status: 'active' | 'expired' | 'dropped';
  createdAt?: string;
  updatedAt?: string;
}

export interface BookNowTokenResponse {
  status: string;
  body: {
    bookNowToken: BookNowToken;
    bookNowTokens: BookNowToken[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookNowTokenService {
  private baseUrl = 'http://localhost:5000/api/book-now-tokens';

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

  // Create a new book now token
  createBookNowToken(tokenData: Partial<BookNowToken>): Observable<BookNowTokenResponse> {
    return this.http.post<BookNowTokenResponse>(`${this.baseUrl}/`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all book now tokens
  getBookNowTokens(): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a book now token by ID
  getBookNowTokenById(id: string): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a book now token by ID
  updateBookNowToken(id: string, tokenData: Partial<BookNowToken>): Observable<BookNowTokenResponse> {
    return this.http.put<BookNowTokenResponse>(`${this.baseUrl}/${id}`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete a book now token by ID
  deleteBookNowToken(id: string): Observable<BookNowTokenResponse> {
    return this.http.delete<BookNowTokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}