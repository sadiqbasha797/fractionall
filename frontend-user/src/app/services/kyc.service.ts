import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface KycDocument {
  id?: string;
  type: 'aadhar' | 'pan' | 'license' | 'voter' | 'income' | 'other';
  url: string;
  uploadedAt?: Date;
}

export interface KycStatus {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  kycDocs: string[];
  rejected_comments?: Array<{
    comment: string;
    date: Date;
  }>;
  kycApprovedBy?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface GovernmentId {
  aadharid?: string;
  panid?: string;
  licenseid?: string;
  income?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private apiUrl = 'https://fractionbackend.projexino.com/api';
  private kycStatusSubject = new BehaviorSubject<KycStatus | null>(null);
  public kycStatus$ = this.kycStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only load KYC status in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.loadKycStatus();
    }
  }

  // Submit KYC documents
  submitKyc(kycDocs: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/kyc/submit`, { kycDocs }).pipe(
      tap(() => this.loadKycStatus()) // Refresh status after submission
    );
  }

  // Get current user's KYC status
  getMyKycStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/kyc/my-status`).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.kycStatusSubject.next(response.body);
        }
      })
    );
  }

  // Load KYC status and update subject
  private loadKycStatus(): void {
    this.getMyKycStatus().subscribe({
      next: (response) => {
        // Status updated via tap operator
      },
      error: (error) => {
        console.error('Failed to load KYC status:', error);
      }
    });
  }

  // Upload KYC document (if you have file upload endpoint)
  uploadKycDocument(documentFile: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('document', documentFile);
    formData.append('documentType', documentType);
    return this.http.post<any>(`${this.apiUrl}/kyc/upload-document`, formData);
  }

  // Update government ID information
  updateGovernmentId(idType: 'aadharid' | 'panid' | 'licenseid' | 'income', idValue: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/profile/government-id`, {
      idType,
      idValue
    });
  }

  // Update multiple government IDs at once
  updateGovernmentIds(governmentIds: GovernmentId): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/profile`, {
      governmentid: governmentIds
    });
  }

  // Get current KYC status from subject
  getCurrentKycStatus(): KycStatus | null {
    return this.kycStatusSubject.value;
  }

  // Check if KYC is approved
  isKycApproved(): boolean {
    const status = this.getCurrentKycStatus();
    return status ? status.status === 'approved' : false;
  }

  // Check if KYC is submitted (pending review)
  isKycSubmitted(): boolean {
    const status = this.getCurrentKycStatus();
    return status ? status.status === 'submitted' : false;
  }

  // Check if KYC is rejected
  isKycRejected(): boolean {
    const status = this.getCurrentKycStatus();
    return status ? status.status === 'rejected' : false;
  }

  // Check if KYC is pending (not submitted yet)
  isKycPending(): boolean {
    const status = this.getCurrentKycStatus();
    return status ? status.status === 'pending' : true;
  }

  // Get KYC status display text
  getKycStatusText(): string {
    const status = this.getCurrentKycStatus();
    if (!status) return 'Not Started';
    
    switch (status.status) {
      case 'pending':
        return 'Not Submitted';
      case 'submitted':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  // Get KYC status color for UI
  getKycStatusColor(): string {
    const status = this.getCurrentKycStatus();
    if (!status) return 'gray';
    
    switch (status.status) {
      case 'pending':
        return 'orange';
      case 'submitted':
        return 'blue';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Get rejection comments
  getRejectionComments(): Array<{ comment: string; date: Date }> {
    const status = this.getCurrentKycStatus();
    return status?.rejected_comments || [];
  }

  // Get latest rejection comment
  getLatestRejectionComment(): string {
    const comments = this.getRejectionComments();
    return comments.length > 0 ? comments[comments.length - 1].comment : '';
  }

  // Check if user can submit KYC (pending or rejected status)
  canSubmitKyc(): boolean {
    return this.isKycPending() || this.isKycRejected();
  }

  // Check if user can resubmit KYC (only if rejected)
  canResubmitKyc(): boolean {
    return this.isKycRejected();
  }

  // Refresh KYC status manually
  refreshKycStatus(): Observable<any> {
    return this.getMyKycStatus();
  }

  // Clear KYC status from subject (useful for logout)
  clearKycStatus(): void {
    this.kycStatusSubject.next(null);
  }

  // Validate government ID format
  validateGovernmentId(idType: string, idValue: string): { valid: boolean; message?: string } {
    if (!idValue || idValue.trim().length === 0) {
      return { valid: false, message: 'ID value is required' };
    }

    switch (idType) {
      case 'aadharid':
        // Aadhar: 12 digits
        const aadharRegex = /^\d{12}$/;
        if (!aadharRegex.test(idValue)) {
          return { valid: false, message: 'Aadhar number must be 12 digits' };
        }
        break;
      
      case 'panid':
        // PAN: 5 letters, 4 digits, 1 letter
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(idValue.toUpperCase())) {
          return { valid: false, message: 'Invalid PAN format (e.g., ABCDE1234F)' };
        }
        break;
      
      case 'licenseid':
        // License: Variable format, just check minimum length
        if (idValue.length < 8) {
          return { valid: false, message: 'License number must be at least 8 characters' };
        }
        break;
      
      case 'income':
        // Income certificate: Just check it's not empty
        if (idValue.trim().length < 5) {
          return { valid: false, message: 'Income certificate number must be at least 5 characters' };
        }
        break;
    }

    return { valid: true };
  }

  // Get required documents list
  getRequiredDocuments(): Array<{ type: string; label: string; required: boolean }> {
    return [
      { type: 'aadharid', label: 'Aadhar Card', required: true },
      { type: 'panid', label: 'PAN Card', required: true },
      { type: 'licenseid', label: 'Driving License', required: true },
      { type: 'income', label: 'Income Certificate', required: false }
    ];
  }
}
