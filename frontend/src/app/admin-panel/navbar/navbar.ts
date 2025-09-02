import { Component, OnInit, Output, EventEmitter, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navbar.html'
})
export class Navbar implements OnInit {
  @Output() menuClick = new EventEmitter<void>();
  
  searchQuery: string = '';
  isSearchActive: boolean = false;
  isMobile: boolean = false;
  notifications: any[] = [];
  user = {
    name: 'Admin User',
    role: 'System Administrator',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  };
  private isBrowser: boolean;

  constructor(
    private authService: AuthService, 
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
      if (!this.isMobile) {
        this.isSearchActive = false;
      }
    }
  }

  ngOnInit() {
    // Initialize with some dummy notifications
    this.notifications = [
      { id: 1, message: 'New KYC request received', time: '5m ago' },
      { id: 2, message: 'New booking confirmed', time: '10m ago' },
      { id: 3, message: 'System update completed', time: '1h ago' }
    ];
  }

  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
  }

  onSearch(event: Event) {
    event.preventDefault();
    // Implement search functionality
    console.log('Searching for:', this.searchQuery);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login'], { replaceUrl: true });
  }
}
