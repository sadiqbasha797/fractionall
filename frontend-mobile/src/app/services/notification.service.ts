import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, timer } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: any;
  relatedEntityId?: string;
  relatedEntityModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  status: string;
  body: {
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      unreadCount: number;
    };
  };
  message: string;
}

export interface UnreadCountResponse {
  status: string;
  body: {
    unreadCount: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  public unreadCountSubject = new BehaviorSubject<number>(0);
  public notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private refreshInterval?: any;
  private isInitialized = false;

  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Don't start auto-refresh in constructor
    // Let components initialize it when needed
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get notifications with pagination
  getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Observable<NotificationResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString()
    });

    return this.http.get<NotificationResponse>(`${this.apiUrl}?${params}`, {
      headers: this.getHeaders()
    });
  }

  // Get unread notification count
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`, {
      headers: this.getHeaders()
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mark-all-read`, {}, {
      headers: this.getHeaders()
    });
  }

  // Delete a notification
  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`, {
      headers: this.getHeaders()
    });
  }

  // Load notifications and update subjects
  loadNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.getNotifications(page, limit, unreadOnly).subscribe({
      next: (response) => {
        // Extract data from the response
        const notifications = response.body?.notifications || [];
        const unreadCount = response.body?.pagination?.unreadCount || 0;
        
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(unreadCount);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  // Load unread count only
  loadUnreadCount(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.getUnreadCount().subscribe({
      next: (response) => {
        // Extract unread count from the response
        const unreadCount = response.body?.unreadCount || 0;
        
        this.unreadCountSubject.next(unreadCount);
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  // Start auto-refresh for notifications
  private startAutoRefresh(): void {
    if (!this.isBrowser()) {
      return;
    }

    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (this.authService.isLoggedIn()) {
        this.loadUnreadCount();
        // Also refresh notifications if needed
        this.loadNotifications(1, 20);
      }
    }, 30000);
  }

  // Initialize auto-refresh (public method for components to call)
  initializeAutoRefresh(): void {
    if (!this.isInitialized) {
      this.loadNotifications();
      this.loadUnreadCount();
      this.startAutoRefresh();
      this.isInitialized = true;
    }
  }

  // Stop auto-refresh
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isInitialized = false;
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
      'kyc_rejected': '❌'
    };
    return iconMap[type] || '🔔';
  }

  // Get notification priority class
  getPriorityClass(priority: string): string {
    const classMap: { [key: string]: string } = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'urgent': 'priority-urgent'
    };
    return classMap[priority] || 'priority-medium';
  }

  // Get notification type display name
  getTypeDisplayName(type: string): string {
    const nameMap: { [key: string]: string } = {
      'welcome': 'Welcome',
      'booknow_token_created': 'Book Now Token',
      'token_created': 'Token Purchase',
      'ticket_created': 'Share Ticket',
      'amc_payment_done': 'AMC Payment',
      'amc_reminder': 'AMC Reminder',
      'booking_done': 'Booking',
      'kyc_approved': 'KYC Approved',
      'kyc_rejected': 'KYC Rejected'
    };
    return nameMap[type] || 'Notification';
  }

  // Format notification time
  formatNotificationTime(date: Date | string): string {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

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
      return notificationDate.toLocaleDateString();
    }
  }

  // Check if notification is recent (within last 5 minutes)
  isRecentNotification(date: Date | string): boolean {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInMinutes = (now.getTime() - notificationDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 5;
  }

  // Initialize notifications for logged-in user
  initializeNotifications(): void {
    if (this.authService.isLoggedIn() && !this.isInitialized) {
      this.isInitialized = true;
      this.loadNotifications();
      this.loadUnreadCount();
      this.startAutoRefresh();
    }
  }

  // Clear notifications on logout
  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.stopAutoRefresh();
    this.isInitialized = false;
  }

  // Refresh notifications
  refreshNotifications(): void {
    this.loadNotifications();
  }
}
