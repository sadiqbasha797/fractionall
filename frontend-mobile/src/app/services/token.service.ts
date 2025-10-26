import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Define interfaces for our data models
export interface Token {
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
  private baseUrl = `${environment.apiUrl}/tokens`;

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

  // Get tokens for the current user
  getUserTokens(): Observable<TokenResponse> {
    return this.http.get<TokenResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a specific token by ID
  getTokenById(id: string): Observable<TokenResponse> {
    return this.http.get<TokenResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new token
  createToken(tokenData: Partial<Token>): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a token
  updateToken(id: string, tokenData: Partial<Token>): Observable<TokenResponse> {
    return this.http.put<TokenResponse>(`${this.baseUrl}/${id}`, tokenData, {
      headers: this.getAuthHeaders()
    });
  }

  // Cancel a token
  cancelToken(id: string, reason?: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/${id}/cancel`, { reason }, {
      headers: this.getAuthHeaders()
    });
  }
}
