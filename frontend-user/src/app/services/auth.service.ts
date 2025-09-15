import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Helper method to safely access localStorage
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  registerUser(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register/user`, userData);
  }

  loginUser(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/user`, credentials);
  }

  // Email verification services
  verifyEmail(verificationData: { email: string, code: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-email`, verificationData);
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification`, { email });
  }

  // Password reset services
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(resetData: { email: string, code: string, newPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, resetData);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  validateToken(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/validate-token`);
  }

  setToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('token');
    }
    return null;
  }

  removeToken(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
    }
  }

  // User state management
  setUserData(userData: any): void {
    if (this.isBrowser()) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }

  getUserData(): any {
    if (this.isBrowser()) {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  removeUserData(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('userData');
    }
  }

  // Check if user is verified
  isUserVerified(): boolean {
    const userData = this.getUserData();
    return userData ? userData.verified === true : false;
  }

  // Get user's KYC status
  getUserKycStatus(): string {
    const userData = this.getUserData();
    return userData ? userData.kycStatus : 'pending';
  }

  // Check if user's KYC is approved
  isKycApproved(): boolean {
    return this.getUserKycStatus() === 'approved';
  }

  // Check if user's KYC is submitted
  isKycSubmitted(): boolean {
    return this.getUserKycStatus() === 'submitted';
  }

  // Check if user's KYC is rejected
  isKycRejected(): boolean {
    return this.getUserKycStatus() === 'rejected';
  }

  // Check if user can access full features (verified + KYC approved)
  canAccessFullFeatures(): boolean {
    return this.isUserVerified() && this.isKycApproved();
  }

  // Complete logout
  logout(): void {
    this.removeToken();
    this.removeUserData();
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getToken();
    const userData = this.getUserData();
    return !!(token && userData && userData.verified);
  }

  // Store temporary user data for verification flow
  setTempUserData(userData: any): void {
    if (this.isBrowser()) {
      localStorage.setItem('tempUserData', JSON.stringify(userData));
    }
  }

  getTempUserData(): any {
    if (this.isBrowser()) {
      const tempData = localStorage.getItem('tempUserData');
      return tempData ? JSON.parse(tempData) : null;
    }
    return null;
  }

  removeTempUserData(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('tempUserData');
    }
  }
}