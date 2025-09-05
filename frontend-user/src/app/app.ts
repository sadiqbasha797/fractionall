import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar';
import { FooterComponent } from './footer/footer';
import { PreloaderComponent } from './preloader/preloader';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent, PreloaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend-user');
  currentRoute = '';
  showPreloader = signal(false); // Controls preloader visibility

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Show preloader on navigation start
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.showPreloader.set(true);
      });

    // Hide preloader on navigation end
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        // Hide preloader after 2 seconds
        setTimeout(() => {
          this.showPreloader.set(false);
        }, 2000);
      });
  }

  ngOnInit(): void {
    // Initialize notifications for logged-in users
    this.notificationService.initializeNotifications();
  }

  shouldShowNavbar(): boolean {
    return !this.currentRoute.includes('/login') && !this.currentRoute.includes('/register');
  }
}
