import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateofbirth: string;
  address: string;
  kycStatus: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
}

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  status: string;
  body: {
    token: string;
    user?: User;
    admin?: Admin;
    superAdmin?: SuperAdmin;
  };
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateofbirth: string;
  address: string;
}

export interface RegisterAdminData {
  name: string;
  email: string;
  password: string;
  phone: string;
  permissions: string[];
}

export interface RegisterSuperAdminData {
  name: string;
  email: string;
  password: string;
  phone: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) { }

  // User registration
  registerUser(userData: RegisterUserData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/user`, userData);
  }

  // User login
  loginUser(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login/user`, credentials);
  }

  // Admin registration
  registerAdmin(adminData: RegisterAdminData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/admin`, adminData);
  }

  // Admin login
  loginAdmin(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login/admin`, credentials);
  }

  // Super Admin registration
  registerSuperAdmin(superAdminData: RegisterSuperAdminData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/superadmin`, superAdminData);
  }

  // Super Admin login
  loginSuperAdmin(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login/superadmin`, credentials);
  }

  // Validate token
  validateToken(): Observable<any> {
    return new Observable(observer => {
      observer.next({ status: 'success' });
      observer.complete();
    });
  }

  // Get user profile (protected route)
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }

  // Store token in local storage
  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Get token from local storage
  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Remove token from local storage
  removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return typeof localStorage !== 'undefined' && !!this.getToken();
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('superadmin');
    localStorage.removeItem('userRole');
  }

  // Get current user role
  getUserRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  // Check if user is superadmin
  isSuperAdmin(): boolean {
    return this.getUserRole() === 'superadmin';
  }

  // Get current admin data
  getCurrentAdmin(): Admin | null {
    if (typeof localStorage !== 'undefined') {
      const adminData = localStorage.getItem('admin');
      return adminData ? JSON.parse(adminData) : null;
    }
    return null;
  }

  // Get current superadmin data
  getCurrentSuperAdmin(): SuperAdmin | null {
    if (typeof localStorage !== 'undefined') {
      const superAdminData = localStorage.getItem('superadmin');
      return superAdminData ? JSON.parse(superAdminData) : null;
    }
    return null;
  }
}