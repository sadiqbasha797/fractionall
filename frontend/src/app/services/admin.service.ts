import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

export interface AdminResponse {
  status: string;
  body: {
    admins?: Admin[];
    admin?: Admin;
  };
  message: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  permissions: string[];
}

export interface EditAdminRequest {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  permissions: string[];
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  phone?: string;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.baseUrl = this.configService.getBaseUrl();
  }

  // Get all admins
  getAllAdmins(): Observable<AdminResponse> {
    return this.http.get<AdminResponse>(`${this.baseUrl}/admins`);
  }

  // Get admin by ID
  getAdminById(id: string): Observable<AdminResponse> {
    return this.http.get<AdminResponse>(`${this.baseUrl}/admins/${id}`);
  }

  // Create new admin
  createAdmin(adminData: CreateAdminRequest): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(`${this.baseUrl}/admins`, adminData);
  }

  // Update admin
  updateAdmin(id: string, adminData: UpdateAdminRequest): Observable<AdminResponse> {
    return this.http.put<AdminResponse>(`${this.baseUrl}/admins/${id}`, adminData);
  }

  // Delete admin
  deleteAdmin(id: string): Observable<AdminResponse> {
    return this.http.delete<AdminResponse>(`${this.baseUrl}/admins/${id}`);
  }

  // Get available permissions (page-level access only)
  getAvailablePermissions(): Permission[] {
    return [
      { id: 'dashboard', name: 'Dashboard', description: 'Access to dashboard overview', category: 'Pages' },
      { id: 'cars', name: 'Car Management', description: 'Access to car management page', category: 'Pages' },
      { id: 'bookings', name: 'Bookings', description: 'Access to bookings page', category: 'Pages' },
      { id: 'users', name: 'User Management', description: 'Access to user management page', category: 'Pages' },
      { id: 'tokens', name: 'Token Management', description: 'Access to token management page', category: 'Pages' },
      { id: 'amc', name: 'AMC Management', description: 'Access to AMC management page', category: 'Pages' },
      { id: 'contracts', name: 'Contracts', description: 'Access to contracts page', category: 'Pages' },
      { id: 'tickets', name: 'Tickets', description: 'Access to tickets page', category: 'Pages' },
      { id: 'notifications', name: 'Notifications', description: 'Access to notifications page', category: 'Pages' },
      { id: 'manage-content', name: 'Content Management', description: 'Access to content management page', category: 'Pages' },
      { id: 'revenue', name: 'Revenue', description: 'Access to revenue page', category: 'Pages' },
      { id: 'contact-forms', name: 'Contact Forms', description: 'Access to contact forms page', category: 'Pages' }
    ];
  }

}
