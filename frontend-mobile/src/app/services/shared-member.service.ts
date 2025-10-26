import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SharedMember {
  _id: string;
  name: string;
  email: string;
  mobileNumber: string;
  aadharNumber: string;
  panNumber: string;
  kycDocuments: KycDocument[];
  status: 'pending' | 'accepted' | 'rejected';
  rejectedComments?: string;
  createdBy: string;
  createdByModel: string;
  ticketid?: string;
  userid?: string;
  created_at: string;
}

export interface KycDocument {
  _id: string;
  documentType: 'aadhar_front' | 'aadhar_back' | 'pan_card' | 'passport' | 'driving_license' | 'other';
  documentUrl: string;
  publicId: string;
  uploadedAt: string;
}

export interface CreateSharedMemberRequest {
  name: string;
  email: string;
  mobileNumber: string;
  aadharNumber: string;
  panNumber: string;
  ticketid?: string;
  userid?: string;
}

export interface SharedMemberResponse {
  status: string;
  body: {
    sharedMember: SharedMember;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
}

export interface SharedMembersListResponse {
  status: string;
  body: {
    sharedMembers: SharedMember[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedMemberService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Create a new shared member
  createSharedMember(sharedMemberData: CreateSharedMemberRequest): Observable<SharedMemberResponse> {
    return this.http.post<SharedMemberResponse>(
      `${this.apiUrl}/shared-members`,
      sharedMemberData,
      { headers: this.getHeaders() }
    );
  }

  // Get user's shared members
  getMySharedMembers(page: number = 1, limit: number = 10, status?: string): Observable<SharedMembersListResponse> {
    let url = `${this.apiUrl}/shared-members/my?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<SharedMembersListResponse>(url, { headers: this.getHeaders() });
  }

  // Get shared member by ID
  getSharedMemberById(id: string): Observable<SharedMemberResponse> {
    return this.http.get<SharedMemberResponse>(
      `${this.apiUrl}/shared-members/my/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Delete shared member
  deleteSharedMember(id: string): Observable<SharedMemberResponse> {
    return this.http.delete<SharedMemberResponse>(
      `${this.apiUrl}/shared-members/my/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Upload KYC document
  uploadKycDocument(sharedMemberId: string, documentType: string, file: File): Observable<SharedMemberResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<SharedMemberResponse>(
      `${this.apiUrl}/shared-members/${sharedMemberId}/documents`,
      formData,
      { headers }
    );
  }

  // Update KYC document
  updateKycDocument(sharedMemberId: string, documentId: string, documentType: string, file: File): Observable<SharedMemberResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<SharedMemberResponse>(
      `${this.apiUrl}/shared-members/${sharedMemberId}/documents/${documentId}`,
      formData,
      { headers }
    );
  }

  // Delete KYC document
  deleteKycDocument(sharedMemberId: string, documentId: string): Observable<SharedMemberResponse> {
    return this.http.delete<SharedMemberResponse>(
      `${this.apiUrl}/shared-members/${sharedMemberId}/documents/${documentId}`,
      { headers: this.getHeaders() }
    );
  }
}
