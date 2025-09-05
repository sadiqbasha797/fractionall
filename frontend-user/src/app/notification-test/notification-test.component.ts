import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notification-test-container" *ngIf="isLoggedIn">
      <h2>Notification System Test</h2>
      
      <div class="test-section">
        <h3>Test Notifications</h3>
        <div class="test-buttons">
          <button (click)="testWelcomeNotification()" class="btn btn-primary">
            Test Welcome Notification
          </button>
          <button (click)="testTokenNotification()" class="btn btn-primary">
            Test Token Notification
          </button>
          <button (click)="testBookingNotification()" class="btn btn-primary">
            Test Booking Notification
          </button>
          <button (click)="testAMCReminderNotification()" class="btn btn-primary">
            Test AMC Reminder
          </button>
        </div>
      </div>

      <div class="test-section">
        <h3>Notification Stats</h3>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Total Notifications:</span>
            <span class="stat-value">{{ totalNotifications }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Unread Count:</span>
            <span class="stat-value unread">{{ unreadCount }}</span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>Recent Notifications</h3>
        <div class="notifications-preview">
          <div 
            *ngFor="let notification of recentNotifications" 
            class="notification-preview-item"
            [class.unread]="!notification.isRead">
            <div class="notification-icon">{{ getNotificationIcon(notification.type) }}</div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="login-required" *ngIf="!isLoggedIn">
      <h2>Login Required</h2>
      <p>Please log in to test the notification system.</p>
    </div>
  `,
  styles: [`
    .notification-test-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .test-section {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .test-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .stats {
      display: flex;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

    .stat-value.unread {
      color: #e74c3c;
    }

    .notifications-preview {
      max-height: 300px;
      overflow-y: auto;
    }

    .notification-preview-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .notification-preview-item.unread {
      background: #f0f8ff;
      border-color: #3498db;
    }

    .notification-icon {
      font-size: 20px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 50%;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #666;
    }

    .login-required {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  `]
})
export class NotificationTestComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  totalNotifications = 0;
  unreadCount = 0;
  recentNotifications: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn = this.authService.isLoggedIn();
      
      if (this.isLoggedIn) {
        this.loadNotificationData();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadNotificationData(): void {
    // Subscribe to notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.recentNotifications = notifications.slice(0, 5);
        this.totalNotifications = notifications.length;
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Load initial data
    this.notificationService.loadNotifications();
  }

  testWelcomeNotification(): void {
    // This would typically be called from the backend
    console.log('Testing welcome notification...');
    // In a real scenario, this would trigger a backend API call
  }

  testTokenNotification(): void {
    console.log('Testing token notification...');
  }

  testBookingNotification(): void {
    console.log('Testing booking notification...');
  }

  testAMCReminderNotification(): void {
    console.log('Testing AMC reminder notification...');
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  formatTime(date: Date | string): string {
    return this.notificationService.formatNotificationTime(date);
  }
}
