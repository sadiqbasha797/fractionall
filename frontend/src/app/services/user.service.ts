import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  dateofbirth?: string;
  address?: string;
  location?: string;
  pincode?: string;
  kycStatus?: string;
  profileimage?: string;
  governmentid?: {
    aadharid?: string;
    panid?: string;
    licenseid?: string;
    income?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileResponse {
  status: string;
  body: {
    user: User;
  };
  message: string;
}

export interface UsersResponse {
  status: string;
  body: {
    users: User[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/users');
  }

  // Get user profile
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/profile`);
  }

  // Update user profile
  updateProfile(userData: Partial<User>): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/profile`, userData);
  }

  // Upload profile image
  uploadProfileImage(imageData: FormData): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.baseUrl}/profile/image`, imageData);
  }

  // Get all users (for admin/superadmin)
  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.baseUrl}/`);
  }

  // Update government ID
  updateGovernmentId(governmentIdData: FormData): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/profile/government-id`, governmentIdData);
  }
}