import { Component, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { AuthService } from '../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar, CommonModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel implements OnInit {
  isLoading: boolean = true;
  isSidebarOpen: boolean = false;
  isMobile: boolean = false;
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
      this.isSidebarOpen = !this.isMobile; // Open by default on desktop, closed on mobile
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      const wasNotMobile = !this.isMobile;
      this.isMobile = window.innerWidth < 768;
      if (wasNotMobile && this.isMobile) {
        // Switching to mobile view
        this.isSidebarOpen = false;
      } else if (!this.isMobile && !wasNotMobile) {
        // Switching to desktop view
        this.isSidebarOpen = true;
      }
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnInit(): void {
    this.authService.validateToken().subscribe(
      (response: any) => {
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }
}
