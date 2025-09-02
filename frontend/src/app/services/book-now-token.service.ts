import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface BookNowToken {
  _id?: string;
  userid: string;
  carid: string;
  tokenAmount: number;
  paymentId?: string;
  status: string;
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

  // Create a new book now token
  createBookNowToken(tokenData: BookNowToken): Observable<BookNowTokenResponse> {
    return this.http.post<BookNowTokenResponse>(`${this.baseUrl}/`, tokenData);
  }

  // Get all book now tokens
  getBookNowTokens(): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/`);
  }

  // Get a book now token by ID
  getBookNowTokenById(id: string): Observable<BookNowTokenResponse> {
    return this.http.get<BookNowTokenResponse>(`${this.baseUrl}/${id}`);
  }

  // Update a book now token by ID
  updateBookNowToken(id: string, tokenData: BookNowToken): Observable<BookNowTokenResponse> {
    return this.http.put<BookNowTokenResponse>(`${this.baseUrl}/${id}`, tokenData);
  }

  // Delete a book now token by ID
  deleteBookNowToken(id: string): Observable<BookNowTokenResponse> {
    return this.http.delete<BookNowTokenResponse>(`${this.baseUrl}/${id}`);
  }
}