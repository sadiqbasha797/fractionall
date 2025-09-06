import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, signal, effect, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  // Convert to signals for better change detection
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalNotifications = signal<number>(0);
  loading = signal<boolean>(false);
  showUnreadOnly = signal<boolean>(false);
  selectedNotification = signal<Notification | null>(null);
  showDeleteConfirm = signal<boolean>(false);
  notificationToDelete = signal<string | null>(null);

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Simplified approach: rely on manual change detection in subscriptions
    // This avoids potential issues with effects and NgZone in different environments
  }

  // Safe method to run code in NgZone with fallback
  private safeRunInZone(fn: () => void): void {
    try {
      if (this.ngZone && typeof this.ngZone.run === 'function') {
        this.ngZone.run(fn);
      } else {
        // Fallback: run directly if NgZone is not available
        fn();
      }
    } catch (error) {
      // If NgZone fails, run directly
      console.warn('NgZone error, running directly:', error);
      fn();
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeNotifications();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Stop auto-refresh when component is destroyed
    this.notificationService.stopAutoRefresh();
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
        this.safeRunInZone(() => {
          this.notifications.set(notifications);
          this.cdr.detectChanges();
        });
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.safeRunInZone(() => {
          this.unreadCount.set(count);
          this.cdr.detectChanges();
        });
      })
    );

    // Initialize the service for auto-refresh and initial data loading
    this.notificationService.initializeAutoRefresh();
  }

  loadNotifications(page: number = 1): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.loading.set(true);
    this.currentPage.set(page);

    this.subscriptions.push(
      this.notificationService.getNotifications(page, 20, this.showUnreadOnly()).subscribe({
        next: (response) => {
          // Extract data from the response
          const notifications = response.body?.notifications || [];
          const unreadCount = response.body?.pagination?.unreadCount || 0;
          
          // Update service subjects so other components can also receive updates
          this.notificationService.notificationsSubject.next(notifications);
          this.notificationService.unreadCountSubject.next(unreadCount);
          
          this.safeRunInZone(() => {
            this.notifications.set(notifications);
            this.currentPage.set(response.body?.pagination?.currentPage || 1);
            this.totalPages.set(response.body?.pagination?.totalPages || 1);
            this.totalNotifications.set(response.body?.pagination?.totalNotifications || 0);
            this.unreadCount.set(unreadCount);
            this.loading.set(false);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.safeRunInZone(() => {
            this.loading.set(false);
            this.cdr.detectChanges();
          });
        }
      })
    );
  }

  toggleUnreadOnly(): void {
    this.showUnreadOnly.set(!this.showUnreadOnly());
    this.loadNotifications(1);
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.subscriptions.push(
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          this.safeRunInZone(() => {
            notification.isRead = true;
            notification.readAt = new Date();
            this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
            this.cdr.detectChanges();
          });
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
          this.safeRunInZone(() => {
            this.notifications().forEach(notification => {
              notification.isRead = true;
              notification.readAt = new Date();
            });
            this.unreadCount.set(0);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        }
      })
    );
  }

  deleteNotification(notificationId: string): void {
    this.notificationToDelete.set(notificationId);
    this.showDeleteConfirm.set(true);
  }

  confirmDelete(): void {
    if (!this.notificationToDelete()) {
      return;
    }

    this.subscriptions.push(
      this.notificationService.deleteNotification(this.notificationToDelete()!).subscribe({
        next: () => {
          this.safeRunInZone(() => {
            this.notifications.set(this.notifications().filter(n => n._id !== this.notificationToDelete()));
            this.totalNotifications.set(Math.max(0, this.totalNotifications() - 1));
            this.showDeleteConfirm.set(false);
            this.notificationToDelete.set(null);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
          this.safeRunInZone(() => {
            this.showDeleteConfirm.set(false);
            this.notificationToDelete.set(null);
            this.cdr.detectChanges();
          });
        }
      })
    );
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.notificationToDelete.set(null);
  }

  viewNotification(notification: Notification): void {
    this.selectedNotification.set(notification);
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
  }

  closeNotificationDetail(): void {
    this.selectedNotification.set(null);
  }

  refreshNotifications(): void {
    this.loadNotifications(this.currentPage());
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadNotifications(page);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage() - 2);
    const endPage = Math.min(this.totalPages(), this.currentPage() + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationIconClass(type: string): string {
    const iconMap: { [key: string]: string } = {
      'booking': 'fa-calendar-check',
      'payment': 'fa-credit-card',
      'token': 'fa-coins',
      'kyc': 'fa-user-check',
      'contract': 'fa-file-contract',
      'amc': 'fa-tools',
      'ticket': 'fa-ticket-alt',
      'system': 'fa-cog',
      'info': 'fa-info-circle',
      'success': 'fa-check-circle',
      'warning': 'fa-exclamation-triangle',
      'error': 'fa-times-circle'
    };
    return iconMap[type] || 'fa-bell';
  }

  getNotificationIconPath(type: string): string {
    const iconMap: { [key: string]: string } = {
      'booking': 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
      'payment': 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
      'token': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      'kyc': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      'contract': 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z',
      'amc': 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
      'ticket': 'M15.58 16.8L12 14.5l-3.58 2.3 1.08-4.12-3.29-2.7 4.24-.25L12 6.8l1.55 3.63 4.24.25-3.29 2.7 1.08 4.12z',
      'system': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      'info': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
      'success': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      'warning': 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
      'error': 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z'
    };
    return iconMap[type] || 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  getTypeDisplayName(type: string): string {
    return this.notificationService.getTypeDisplayName(type);
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

  // Get metadata keys for display
  getMetadataKeys(metadata: any): string[] {
    return Object.keys(metadata || {});
  }

  // Make Object available in template
  get Object() {
    return Object;
  }
}
