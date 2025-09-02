import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface AMC {
  _id?: string;
  userid: string;
  carid: string;
  amcType: string;
  startDate: string;
  endDate: string;
  amount: number;
  paymentStatus: string;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AMCResponse {
  status: string;
  body: {
    amc: AMC;
    amcs: AMC[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AmcService {
  private baseUrl = 'http://localhost:5000/api/amcs';

  constructor(private http: HttpClient) { }

  // Create a new AMC
  createAMC(amcData: AMC): Observable<AMCResponse> {
    return this.http.post<AMCResponse>(`${this.baseUrl}/`, amcData);
  }

  // Get all AMCs
  getAMCs(): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/`);
  }

  // Get an AMC by ID
  getAMCById(id: string): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/${id}`);
  }

  // Update an AMC by ID
  updateAMC(id: string, amcData: AMC): Observable<AMCResponse> {
    return this.http.put<AMCResponse>(`${this.baseUrl}/${id}`, amcData);
  }

  // Delete an AMC by ID
  deleteAMC(id: string): Observable<AMCResponse> {
    return this.http.delete<AMCResponse>(`${this.baseUrl}/${id}`);
  }

  // Update AMC payment status
  updateAMCPaymentStatus(id: string, paymentStatus: string): Observable<AMCResponse> {
    return this.http.put<AMCResponse>(`${this.baseUrl}/${id}/payment-status`, { paymentStatus });
  }
}