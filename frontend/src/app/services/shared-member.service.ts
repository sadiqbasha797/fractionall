import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for shared member data models
export interface KycDocument {
  _id?: string;
  documentType: 'aadhar_front' | 'aadhar_back' | 'pan_card' | 'passport' | 'driving_license' | 'other';
  documentUrl: string;
  publicId: string;
  uploadedAt: string;
}

export interface SharedMember {
  _id?: string;
  name: string;
  email: string;
  mobileNumber: string;
  aadharNumber: string;
  panNumber: string;
  kycDocuments: KycDocument[];
  status: 'pending' | 'accepted' | 'rejected';
  rejectedComments?: string;
  ticketid?: string | {
    _id: string;
    ticketcustomid: string;
    ticketprice: number;
    ticketstatus: string;
  };
  userid?: string | {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdBy: string | {
    _id: string;
    name: string;
    email: string;
  };
  createdByModel: 'User' | 'Admin' | 'SuperAdmin';
  created_at: string;
  updatedAt?: string;
}

export interface SharedMemberResponse {
  status: string;
  body: {
    sharedMember?: SharedMember;
    sharedMembers?: SharedMember[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    stats?: {
      total: number;
      recent: number;
      statusCounts: {
        pending: number;
        accepted: number;
        rejected: number;
      };
    };
  };
  message: string;
}

export interface SharedMemberStats {
  total: number;
  recent: number;
  statusCounts: {
    pending: number;
    accepted: number;
    rejected: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SharedMemberService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/shared-members');
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Helper method to get auth headers for file uploads
  private getAuthHeadersForUpload(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Create a new shared member
  createSharedMember(sharedMemberData: Partial<SharedMember>): Observable<SharedMemberResponse> {
    return this.http.post<SharedMemberResponse>(`${this.baseUrl}/`, sharedMemberData, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all shared members (Admin and SuperAdmin only)
  getAllSharedMembers(page: number = 1, limit: number = 10, status?: string, search?: string): Observable<SharedMemberResponse> {
    let params = `page=${page}&limit=${limit}`;
    if (status) params += `&status=${status}`;
    if (search) params += `&search=${search}`;
    
    return this.http.get<SharedMemberResponse>(`${this.baseUrl}/all?${params}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get shared members created by current user (User only)
  getMySharedMembers(page: number = 1, limit: number = 10, status?: string): Observable<SharedMemberResponse> {
    let params = `page=${page}&limit=${limit}`;
    if (status) params += `&status=${status}`;
    
    return this.http.get<SharedMemberResponse>(`${this.baseUrl}/my?${params}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get shared member by ID
  getSharedMemberById(id: string): Observable<SharedMemberResponse> {
    return this.http.get<SharedMemberResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update shared member (Admin and SuperAdmin only)
  updateSharedMember(id: string, sharedMemberData: Partial<SharedMember>): Observable<SharedMemberResponse> {
    return this.http.put<SharedMemberResponse>(`${this.baseUrl}/${id}`, sharedMemberData, {
      headers: this.getAuthHeaders()
    });
  }

  // Update shared member status (Admin and SuperAdmin only)
  updateSharedMemberStatus(id: string, status: 'pending' | 'accepted' | 'rejected', rejectedComments?: string): Observable<SharedMemberResponse> {
    const body: any = { status };
    if (status === 'rejected' && rejectedComments) {
      body.rejectedComments = rejectedComments;
    }
    
    return this.http.put<SharedMemberResponse>(`${this.baseUrl}/${id}/status`, body, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete shared member
  deleteSharedMember(id: string): Observable<SharedMemberResponse> {
    return this.http.delete<SharedMemberResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get shared member statistics (Admin and SuperAdmin only)
  getSharedMemberStats(): Observable<SharedMemberResponse> {
    return this.http.get<SharedMemberResponse>(`${this.baseUrl}/stats`, {
      headers: this.getAuthHeaders()
    });
  }

  // Upload KYC document
  uploadKycDocument(sharedMemberId: string, documentType: string, file: File): Observable<SharedMemberResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    return this.http.post<SharedMemberResponse>(`${this.baseUrl}/${sharedMemberId}/documents`, formData, {
      headers: this.getAuthHeadersForUpload()
    });
  }

  // Update KYC document
  updateKycDocument(sharedMemberId: string, documentId: string, documentType: string, file: File): Observable<SharedMemberResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    return this.http.put<SharedMemberResponse>(`${this.baseUrl}/${sharedMemberId}/documents/${documentId}`, formData, {
      headers: this.getAuthHeadersForUpload()
    });
  }

  // Delete KYC document
  deleteKycDocument(sharedMemberId: string, documentId: string): Observable<SharedMemberResponse> {
    return this.http.delete<SharedMemberResponse>(`${this.baseUrl}/${sharedMemberId}/documents/${documentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Helper method to get document type display name
  getDocumentTypeDisplayName(documentType: string): string {
    const typeMap: { [key: string]: string } = {
      'aadhar_front': 'Aadhar Front',
      'aadhar_back': 'Aadhar Back',
      'pan_card': 'PAN Card',
      'passport': 'Passport',
      'driving_license': 'Driving License',
      'other': 'Other'
    };
    return typeMap[documentType] || documentType;
  }

  // Helper method to get status display name
  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Approved',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  }

  // Helper method to get status color class
  getStatusColorClass(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      'accepted': 'bg-green-900/50 text-green-300 border-green-700',
      'rejected': 'bg-red-900/50 text-red-300 border-red-700'
    };
    return colorMap[status] || 'bg-gray-900/50 text-gray-300 border-gray-700';
  }
}
