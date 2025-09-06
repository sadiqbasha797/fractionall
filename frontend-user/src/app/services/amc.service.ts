import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
  ticketid: {
    _id: string;
    ticketcustomid: string;
    ticketprice: number;
    pricepaid: number;
    pendingamount: number;
    ticketstatus: string;
    ticketexpiry: string;
    ticketbroughtdate: string;
    comments?: string;
  };
  amcamount: AMCAmount[];
  createdAt: string;
}

export interface AMCResponse {
  body: {
    amc?: AMC;
    amcs?: AMC[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AMCService {
  private baseUrl = 'https://fractionbackend.projexino.com/api/amcs';

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

  // Get AMCs for the current user
  getUserAMCs(): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a specific AMC by ID
  getAMCById(id: string): Observable<AMCResponse> {
    return this.http.get<AMCResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new AMC
  createAMC(amcData: Partial<AMC>): Observable<AMCResponse> {
    return this.http.post<AMCResponse>(`${this.baseUrl}/`, amcData, {
      headers: this.getAuthHeaders()
    });
  }

  // Update an AMC
  updateAMC(id: string, amcData: Partial<AMC>): Observable<AMCResponse> {
    return this.http.put<AMCResponse>(`${this.baseUrl}/${id}`, amcData, {
      headers: this.getAuthHeaders()
    });
  }
}
