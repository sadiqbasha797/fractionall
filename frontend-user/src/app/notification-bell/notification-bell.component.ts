import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;
  loading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeNotifications();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private initializeNotifications(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = (notifications || []).slice(0, 5); // Show only latest 5, handle undefined
        this.loading = false; // Ensure loading is false when data arrives
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count || 0; // Handle undefined
      })
    );

    // Load initial data only if not already loaded
    if (this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (!this.authService.isLoggedIn() || this.loading) {
      return;
    }

    this.loading = true;
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
      }
    }, 10000); // 10 second timeout
    
    this.subscriptions.push(
      this.notificationService.getNotifications(1, 5).subscribe({
        next: (response) => {
          // Extract data from the response
          const notifications = response.body?.notifications || [];
          const unreadCount = response.body?.pagination?.unreadCount || 0;
          
          this.notifications = notifications;
          this.unreadCount = unreadCount;
          this.loading = false;
          clearTimeout(loadingTimeout); // Clear timeout on success
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.loading = false;
          clearTimeout(loadingTimeout); // Clear timeout on error
        }
      })
    );
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.subscriptions.push(
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.isRead = true;
          notification.readAt = new Date();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      })
    );
  }

  markAllAsRead(): void {
    this.subscriptions.push(
      this.notificationService.markAllAsRead().subscribe({
        next: () => {
          this.notifications.forEach(notification => {
            notification.isRead = true;
            notification.readAt = new Date();
          });
          this.unreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        }
      })
    );
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  formatNotificationTime(date: Date | string): string {
    return this.notificationService.formatNotificationTime(date);
  }

  isRecentNotification(date: Date | string): boolean {
    return this.notificationService.isRecentNotification(date);
  }

  // Track by function for ngFor
  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }
}
