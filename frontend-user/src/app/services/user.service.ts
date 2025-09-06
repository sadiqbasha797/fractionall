import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://fractionbackend.projexino.com/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Helper method to get headers with authentication token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() });
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, userData, { headers: this.getAuthHeaders() });
  }

  // Update profile with location and pincode
  updateProfileWithLocation(profileData: {
    name?: string,
    phone?: string,
    dateofbirth?: string,
    address?: string,
    location?: string,
    pincode?: string,
    governmentid?: any
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData, { headers: this.getAuthHeaders() });
  }

  uploadProfileImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // For file uploads, we need to set the token but not Content-Type (browser sets it)
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<any>(`${this.apiUrl}/profile/image`, formData, { headers });
  }

  updateGovernmentId(idData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile/government-id`, idData, { headers: this.getAuthHeaders() });
  }

  // KYC related services
  submitKyc(kycData: { kycDocs: string[] }): Observable<any> {
    return this.http.post<any>(`https://fractionbackend.projexino.com/api/kyc/submit`, kycData, { headers: this.getAuthHeaders() });
  }

  getMyKycStatus(): Observable<any> {
    return this.http.get<any>(`https://fractionbackend.projexino.com/api/kyc/my-status`, { headers: this.getAuthHeaders() });
  }

  // Upload KYC document
  uploadKycDocument(documentFile: File, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('document', documentFile);
    formData.append('documentType', documentType);
    
    // For file uploads, we need to set the token but not Content-Type (browser sets it)
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<any>(`https://fractionbackend.projexino.com/api/kyc/upload-document`, formData, { headers });
  }
}