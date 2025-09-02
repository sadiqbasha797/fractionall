import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface User {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  dateofbirth: string;
  address: string;
  kycStatus: string;
  profileImage?: string;
  governmentId?: string;
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

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient) { }

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

  // Update government ID
  updateGovernmentId(governmentIdData: FormData): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/profile/government-id`, governmentIdData);
  }
}