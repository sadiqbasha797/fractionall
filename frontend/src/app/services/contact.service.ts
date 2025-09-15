import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  status: string;
  body: {
    contactForm: {
      id: string;
      name: string;
      email: string;
      subject: string;
      status: string;
      createdAt: string;
    };
    userEmailSent: boolean;
  };
  message: string;
}

export interface ContactForm {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high';
  adminNotes: Array<{
    note: string;
    addedBy: {
      id: string;
      name: string;
      role: string;
    };
    addedAt: string;
  }>;
  repliedBy?: {
    id: string;
    name: string;
    role: string;
  };
  repliedAt?: string;
  closedBy?: {
    id: string;
    name: string;
    role: string;
  };
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormListResponse {
  status: string;
  body: {
    contactForms: ContactForm[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
}

export interface ContactFormStats {
  status: string;
  body: {
    stats: {
      total: number;
      byStatus: {
        new: number;
        read: number;
        replied: number;
        closed: number;
      };
      byPriority: {
        high: number;
        medium: number;
        low: number;
      };
      recent: number;
    };
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getBaseUrl();
  }

  // Submit contact form (public)
  submitContactForm(formData: ContactFormData): Observable<ContactFormResponse> {
    return this.http.post<ContactFormResponse>(`${this.apiUrl}/contact/submit`, formData);
  }

  // Get all contact forms (admin only)
  getAllContactForms(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Observable<ContactFormListResponse> {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.search) searchParams.append('search', params.search);
      queryParams = '?' + searchParams.toString();
    }
    
    return this.http.get<ContactFormListResponse>(`${this.apiUrl}/contact/admin/all${queryParams}`);
  }

  // Get contact form by ID (admin only)
  getContactFormById(id: string): Observable<{ status: string; body: { contactForm: ContactForm }; message: string }> {
    return this.http.get<{ status: string; body: { contactForm: ContactForm }; message: string }>(`${this.apiUrl}/contact/admin/${id}`);
  }

  // Update contact form status (admin only)
  updateContactFormStatus(id: string, updateData: {
    status?: string;
    priority?: string;
    adminNote?: string;
  }): Observable<{ status: string; body: { contactForm: ContactForm }; message: string }> {
    return this.http.put<{ status: string; body: { contactForm: ContactForm }; message: string }>(`${this.apiUrl}/contact/admin/${id}/status`, updateData);
  }

  // Delete contact form (admin only)
  deleteContactForm(id: string): Observable<{ status: string; body: {}; message: string }> {
    return this.http.delete<{ status: string; body: {}; message: string }>(`${this.apiUrl}/contact/admin/${id}`);
  }

  // Get contact form statistics (admin only)
  getContactFormStats(): Observable<ContactFormStats> {
    return this.http.get<ContactFormStats>(`${this.apiUrl}/contact/admin/stats`);
  }
}
