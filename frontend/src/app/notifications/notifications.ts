import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NotificationService, Notification, CreateNotificationData, UpdateNotificationData } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  stats: any = null;
  pagination: any = null;
  userRole: string = '';
  viewMode: 'user' | 'admin' = 'user';
  
  // Make Object available in template
  Object = Object;
  
  // Loading states
  isLoading = false;
  
  // View mode and pagination
  currentPage = 1;
  itemsPerPage = 20;
  
  // Toast messages
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  
  // Notification types - simplified
  notificationTypes: string[] = [];
  priorityLevels: Array<{value: string, label: string}> = [];
  
  // Auto-refresh subscription
  private refreshSubscription?: Subscription;
  
  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userRole = this.authService.getUserRole() || '';
    this.notificationTypes = this.notificationService.getNotificationTypes();
    this.priorityLevels = this.notificationService.getPriorityLevels();
  }
  
  ngOnInit(): void {
    if (!this.userRole) {
      this.router.navigate(['/login-selection']);
      return;
    }
    
    this.loadNotifications();
    this.loadStats();
    this.startAutoRefresh();
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  // Check if user is admin or superadmin
  isAdmin(): boolean {
    return this.userRole === 'admin' || this.userRole === 'superadmin';
  }
  
  // Check if user has unread notifications
  get hasUnreadNotifications(): boolean {
    return this.notifications.some(notification => !notification.isRead);
  }
  
  // Load notifications based on current view mode
  loadNotifications(): void {
    this.isLoading = true;
    
    const loadMethod = this.viewMode === 'admin' && this.isAdmin() 
      ? this.notificationService.getAllNotifications(this.currentPage, this.itemsPerPage, {})
      : this.notificationService.getNotifications(this.currentPage, this.itemsPerPage, false);
    
    loadMethod.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notifications = response.body.notifications || [];
          this.pagination = response.body.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.showToast('Failed to load notifications', 'error');
        this.isLoading = false;
      }
    });
  }
  
  // Load notification statistics
  loadStats(): void {
    if (!this.isAdmin()) return;
    
    this.notificationService.getNotificationStats().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.stats = response.body.stats;
        }
      },
      error: (error) => {
      }
    });
  }
  
  // Set view mode
  setViewMode(mode: 'user' | 'admin'): void {
    this.viewMode = mode;
    this.currentPage = 1;
    this.loadNotifications();
  }
  
  // Pagination
  goToPage(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }
  
  // Mark notification as read
  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          const notification = this.notifications.find(n => n._id === notificationId);
          if (notification) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
          }
          this.showToast('Notification marked as read', 'success');
        }
      },
      error: (error) => {
        this.showToast('Failed to mark notification as read', 'error');
      }
    });
  }
  
  // Mark all notifications as read
  markAllAsRead(): void {
    if (!this.hasUnreadNotifications) return;
    
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notifications.forEach(notification => {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
          });
          this.showToast('All notifications marked as read', 'success');
          this.loadStats();
        }
      },
      error: (error) => {
        this.showToast('Failed to mark all notifications as read', 'error');
      }
    });
  }
  
  // Delete notification
  deleteNotification(notificationId: string, isAdminDelete: boolean = false): void {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    const deleteMethod = isAdminDelete 
      ? this.notificationService.adminDeleteNotification(notificationId)
      : this.notificationService.deleteNotification(notificationId);
    
    deleteMethod.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
          this.showToast('Notification deleted successfully', 'success');
          this.loadStats();
        }
      },
      error: (error) => {
        this.showToast('Failed to delete notification', 'error');
      }
    });
  }
  
  // Start auto-refresh
  startAutoRefresh(): void {
    // Refresh notifications every 30 seconds
    this.refreshSubscription = interval(30000)
      .pipe(
        switchMap(() => {
          if (this.viewMode === 'admin' && this.isAdmin()) {
            return this.notificationService.getAllNotifications(this.currentPage, this.itemsPerPage, {});
          } else {
            return this.notificationService.getNotifications(this.currentPage, this.itemsPerPage, false);
          }
        })
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.notifications = response.body.notifications || [];
            this.pagination = response.body.pagination;
          }
        },
        error: (error) => {
        }
      });
  }
  
  // Utility methods
  formatType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  formatDate(dateString: string): string {
    return this.notificationService.formatDate(dateString);
  }
  
  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }
  
  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityColorClass(priority);
  }
  
  getMetadataItems(metadata: any): Array<{key: string, value: any}> {
    return Object.keys(metadata).map(key => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: metadata[key]
    }));
  }
  
  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id || index.toString();
  }
  
  // Toast methods
  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }
  
  hideToast(): void {
    this.toastMessage = '';
  }
}