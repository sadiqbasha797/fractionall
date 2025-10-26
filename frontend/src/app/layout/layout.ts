import { Component, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { AuthService } from '../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
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
      // Force desktop layout but detect actual mobile device for sidebar behavior
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.isSidebarOpen = !this.isMobile; // Open by default on desktop, closed on mobile
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      // Maintain mobile detection based on user agent, not screen size
      // since we're forcing desktop view on mobile devices
      // No need to change isMobile based on window width anymore
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
