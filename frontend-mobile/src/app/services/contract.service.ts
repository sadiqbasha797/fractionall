import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Define interfaces for contract data models
export interface ContractDocument {
  _id: string;
  carid: {
    _id: string;
    carname: string;
    brandname: string;
    color: string;
    images: string[];
  };
  ticketid: {
    _id: string;
    ticketcustomid: string;
    ticketprice: number;
    pricepaid: number;
    pendingamount: number;
    ticketexpiry: string;
    ticketbroughtdate: string;
    ticketstatus: string;
  };
  contract_docs: string[];
  createdat: string;
}

export interface ContractResponse {
  status: string;
  body: {
    contracts?: ContractDocument[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private baseUrl = `${environment.apiUrl}/contracts`;

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

  // Get user's contract documents
  getUserContractDocuments(): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/my-contracts`, {
      headers: this.getAuthHeaders()
    });
  }

  // Download a specific contract document
  downloadContractDocument(contractId: string, docIndex: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${contractId}/${docIndex}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Helper method to trigger file download
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
