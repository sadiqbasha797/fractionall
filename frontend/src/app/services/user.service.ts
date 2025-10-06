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
  // User status management fields
  status?: 'active' | 'suspended' | 'deactivated';
  suspensionEndDate?: string;
  suspensionReason?: string;
  deactivationReason?: string;
  statusChangedBy?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
  statusChangedAt?: string;
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

export interface UserStatusResponse {
  status: string;
  body: {
    user: User;
  };
  message: string;
}

export interface UsersByStatusResponse {
  status: string;
  body: {
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
    };
  };
  message: string;
}

export interface UserStatusHistoryResponse {
  status: string;
  body: {
    history: {
      currentStatus: string;
      suspensionEndDate?: string;
      suspensionReason?: string;
      deactivationReason?: string;
      statusChangedBy?: {
        id: string;
        role: string;
        name: string;
        email: string;
      };
      statusChangedAt?: string;
      accountCreatedAt: string;
    };
  };
  message: string;
}

export interface SuspensionStatsResponse {
  status: string;
  body: {
    stats: {
      totalUsers: number;
      active: number;
      suspended: number;
      deactivated: number;
      expiredSuspensions: number;
    };
  };
  message: string;
}

export interface UserPermissionsResponse {
  status: string;
  body: {
    permissions: {
      canPerform: boolean;
      reason: string;
      suspensionEndDate?: string;
    };
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

  // Create user (admin/superadmin only)
  createUser(userData: Partial<User>): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.baseUrl}/`, userData);
  }

  // Update user by ID (admin/superadmin only)
  updateUserById(userId: string, userData: Partial<User>): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.baseUrl}/${userId}`, userData);
  }

  // Delete user by ID (admin/superadmin only)
  deleteUserById(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${userId}`);
  }

  // User status management methods (admin/superadmin only)
  
  // Suspend user
  suspendUser(userId: string, reason: string): Observable<UserStatusResponse> {
    return this.http.post<UserStatusResponse>(`${this.baseUrl}/${userId}/suspend`, { reason });
  }

  // Deactivate user
  deactivateUser(userId: string, reason: string): Observable<UserStatusResponse> {
    return this.http.post<UserStatusResponse>(`${this.baseUrl}/${userId}/deactivate`, { reason });
  }

  // Reactivate user
  reactivateUser(userId: string, reason: string): Observable<UserStatusResponse> {
    return this.http.post<UserStatusResponse>(`${this.baseUrl}/${userId}/reactivate`, { reason });
  }

  // Get users by status
  getUsersByStatus(status: string, page: number = 1, limit: number = 20): Observable<UsersByStatusResponse> {
    return this.http.get<UsersByStatusResponse>(`${this.baseUrl}/status/${status}?page=${page}&limit=${limit}`);
  }

  // Get user status history
  getUserStatusHistory(userId: string): Observable<UserStatusHistoryResponse> {
    return this.http.get<UserStatusHistoryResponse>(`${this.baseUrl}/${userId}/status-history`);
  }

  // Get suspension statistics
  getSuspensionStats(): Observable<SuspensionStatsResponse> {
    return this.http.get<SuspensionStatsResponse>(`${this.baseUrl}/stats/suspensions`);
  }

  // Check user permissions
  checkUserPermissions(userId: string): Observable<UserPermissionsResponse> {
    return this.http.get<UserPermissionsResponse>(`${this.baseUrl}/${userId}/permissions`);
  }
}
