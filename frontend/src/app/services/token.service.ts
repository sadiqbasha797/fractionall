import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

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
  expectedpurchasedate?: string;
  status?: string;
  totaltickets: number;
  bookNowTokenAvailable: number;
  bookNowTokenPrice: number;
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

export interface Token {
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

export interface TokenResponse {
  status: string;
  body: {
    token?: Token;
    tokens?: Token[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/tokens');
  }

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

  // Create a new token
  createToken(tokenData: Partial<Token>): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all tokens
  getTokens(): Observable<TokenResponse> {
    return this.http.get<TokenResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a token by ID
  getTokenById(id: string): Observable<TokenResponse> {
    return this.http.get<TokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a token by ID
  updateToken(id: string, tokenData: Partial<Token>): Observable<TokenResponse> {
    return this.http.put<TokenResponse>(`${this.baseUrl}/${id}`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete a token by ID
  deleteToken(id: string): Observable<TokenResponse> {
    return this.http.delete<TokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}