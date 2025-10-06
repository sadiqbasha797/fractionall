import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface KYC {
  _id?: string;
  userid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  governmentId: string;
  status: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KYCResponse {
  status: string;
  body: {
    kyc?: KYC;
    kycs?: KYC[];
    users?: any[];
    user?: any;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/kyc');
  }

  // Submit KYC
  submitKyc(kycData: FormData): Observable<KYCResponse> {
    return this.http.post<KYCResponse>(`${this.baseUrl}/submit`, kycData);
  }

  // Get user's own KYC status
  getMyKycStatus(): Observable<KYCResponse> {
    return this.http.get<KYCResponse>(`${this.baseUrl}/my-status`);
  }

  // Get all KYC requests (Admin/SuperAdmin)
  getAllKycRequests(): Observable<KYCResponse> {
    return this.http.get<KYCResponse>(`${this.baseUrl}/requests`);
  }

  // Get KYC details by user ID (Admin/SuperAdmin)
  getKycDetails(userId: string): Observable<KYCResponse> {
    return this.http.get<KYCResponse>(`${this.baseUrl}/details/${userId}`);
  }

  // Approve KYC (Admin/SuperAdmin)
  approveKyc(userId: string): Observable<KYCResponse> {
    return this.http.put<KYCResponse>(`${this.baseUrl}/approve/${userId}`, {});
  }

  // Reject KYC (Admin/SuperAdmin)
  rejectKyc(userId: string, rejectionReason: string): Observable<KYCResponse> {
    return this.http.put<KYCResponse>(`${this.baseUrl}/reject/${userId}`, { rejectionReason });
  }
}
