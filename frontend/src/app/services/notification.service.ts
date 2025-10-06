import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface Notification {
  _id?: string;
  recipientId: string;
  recipientModel: 'User' | 'Admin' | 'SuperAdmin';
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string;
  relatedEntityModel?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  status: string;
  body: {
    notifications?: Notification[];
    notification?: Notification;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      unreadCount: number;
    };
    unreadCount?: number;
    modifiedCount?: number;
    stats?: {
      totalNotifications: number;
      unreadNotifications: number;
      readNotifications: number;
    };
  };
  message: string;
}

export interface CreateNotificationData {
  recipientType: 'specific' | 'all_users' | 'all_admins' | 'all_superadmins' | 'role_based';
  recipientId?: string;
  recipientRole?: 'user' | 'admin' | 'superadmin';
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: any;
  expiresAt?: string;
}

export interface UpdateNotificationData {
  title?: string;
  message?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isRead?: boolean;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/notifications');
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get notifications for the authenticated user
  getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Observable<NotificationResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('unreadOnly', unreadOnly.toString());

    return this.http.get<NotificationResponse>(this.baseUrl, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  // Get all notifications (Admin/SuperAdmin only)
  getAllNotifications(page: number = 1, limit: number = 20, filters?: any): Observable<NotificationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<NotificationResponse>(`${this.baseUrl}/admin/all`, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  // Get unread notification count
  getUnreadCount(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/unread-count`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${notificationId}/read`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/mark-all-read`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Delete a notification
  deleteNotification(notificationId: string): Observable<NotificationResponse> {
    return this.http.delete<NotificationResponse>(`${this.baseUrl}/${notificationId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get notification statistics (Admin/SuperAdmin only)
  getNotificationStats(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/stats`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Create manual notification (Admin/SuperAdmin only)
  createNotification(notificationData: CreateNotificationData): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.baseUrl}/admin/create`, notificationData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Update notification (Admin/SuperAdmin only)
  updateNotification(notificationId: string, updateData: UpdateNotificationData): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.baseUrl}/admin/${notificationId}`, updateData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get notification by ID (Admin/SuperAdmin only)
  getNotificationById(notificationId: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/admin/${notificationId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Admin delete notification (Admin/SuperAdmin only)
  adminDeleteNotification(notificationId: string): Observable<NotificationResponse> {
    return this.http.delete<NotificationResponse>(`${this.baseUrl}/admin/${notificationId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Send test notification (SuperAdmin only)
  sendTestNotification(testData: { title: string; message: string; type: string }): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.baseUrl}/admin/test`, testData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get notification types
  getNotificationTypes(): string[] {
    return [
      'welcome',
      'booknow_token_created',
      'token_created',
      'ticket_created',
      'amc_payment_done',
      'amc_reminder',
      'booking_done',
      'kyc_approved',
      'kyc_rejected',
      'user_joined_waitlist',
      'user_purchased_token',
      'user_purchased_booknow_token',
      'user_created_ticket',
      'user_paid_amc',
      'user_made_booking',
      'user_kyc_approved',
      'user_kyc_rejected',
      'manual_announcement',
      'system_maintenance',
      'security_alert'
    ];
  }

  // Get priority levels
  getPriorityLevels(): Array<{value: string, label: string}> {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ];
  }

  // Format notification date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'welcome': '🎉',
      'booknow_token_created': '🚀',
      'token_created': '🎫',
      'ticket_created': '🎫',
      'amc_payment_done': '🔧',
      'amc_reminder': '⚠️',
      'booking_done': '🚗',
      'kyc_approved': '✅',
      'kyc_rejected': '❌',
      'user_joined_waitlist': '👤',
      'user_purchased_token': '🎫',
      'user_purchased_booknow_token': '🚀',
      'user_created_ticket': '🎫',
      'user_paid_amc': '🔧',
      'user_made_booking': '🚗',
      'user_kyc_approved': '✅',
      'user_kyc_rejected': '❌',
      'manual_announcement': '📢',
      'system_maintenance': '🔧',
      'security_alert': '🔒'
    };

    return iconMap[type] || '📢';
  }

  // Get priority color class
  getPriorityColorClass(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };

    return colorMap[priority] || 'text-gray-600';
  }
}
