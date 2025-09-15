import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html'
})
export class Navbar implements OnInit, OnDestroy {
  @Output() menuClick = new EventEmitter<void>();
  
  isMobile: boolean = false;
  user = {
    name: 'Admin User',
    role: 'System Administrator',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  };
  currentUser: any = null;
  userRole: string | null = null;
  private isBrowser: boolean;
  
  // Real-time clock properties
  currentTime: string = '';
  currentDate: string = '';
  private clockInterval: any;
  
  // Notifications properties
  unreadCount: number = 0;
  private notificationSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  ngOnInit() {
    // Get current user information
    this.userRole = this.authService.getUserRole();
    if (this.userRole === 'admin') {
      this.currentUser = this.authService.getCurrentAdmin();
      if (this.currentUser) {
        this.user.name = this.currentUser.name;
        this.user.role = 'Administrator';
        this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=0D8ABC&color=fff`;
      }
    } else if (this.userRole === 'superadmin') {
      this.currentUser = this.authService.getCurrentSuperAdmin();
      if (this.currentUser) {
        this.user.name = this.currentUser.name;
        this.user.role = 'Super Administrator';
        this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=8B5CF6&color=fff`;
      }
    }
    
    // Initialize real-time clock
    this.updateClock();
    this.startClock();
    
    // Load initial unread count and start periodic updates
    this.loadUnreadCount();
    this.startNotificationUpdates();
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  private updateClock() {
    if (this.isBrowser) {
      const now = new Date();
      
      // Format time (12-hour format with AM/PM)
      this.currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Format date
      this.currentDate = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  private startClock() {
    if (this.isBrowser) {
      // Update immediately
      this.updateClock();
      
      // Update every second
      this.clockInterval = setInterval(() => {
        this.updateClock();
      }, 1000);
    }
  }

  // Load unread notification count
  private loadUnreadCount(): void {
    try {
      this.notificationService.getUnreadCount().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.unreadCount = response.body.unreadCount || 0;
          }
        },
        error: (error) => {
          console.error('Error loading unread count:', error);
          this.unreadCount = 0;
        }
      });
    } catch (error) {
      console.error('Error in loadUnreadCount:', error);
      this.unreadCount = 0;
    }
  }
  
  // Start periodic notification updates
  private startNotificationUpdates(): void {
    if (this.isBrowser) {
      // Update unread count every 30 seconds
      this.notificationSubscription = interval(30000).subscribe(() => {
        this.loadUnreadCount();
      });
    }
  }
  
  // Navigate to notifications page
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login-selection'], { replaceUrl: true });
  }
}
